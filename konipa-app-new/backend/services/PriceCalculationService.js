const { Product, PriceOverride, Client } = require('../models');
const { Op } = require('sequelize');

class PriceCalculationService {
  /**
   * Calculer le prix final d'un produit pour un client donné
   * @param {number} productId - ID du produit
   * @param {number} clientId - ID du client
   * @param {number} quantity - Quantité commandée
   * @returns {Object} Prix final avec détails
   */
  static async calculateFinalPrice(productId, clientId, quantity = 1) {
    try {
      // Récupérer le produit
      const product = await Product.findByPk(productId);

      if (!product) {
        throw new Error('Produit non trouvé');
      }

      const basePrice = product.base_price_ht;
      let finalPrice = basePrice;
      let discountPercent = 0;
      let appliedDiscount = null;

      // Rechercher les remises applicables
      const discounts = await this.getApplicableDiscounts(productId, clientId, quantity);

      if (discounts.length > 0) {
        // Prendre la meilleure remise (la plus avantageuse)
        const bestDiscount = this.getBestDiscount(discounts, basePrice, quantity);
        
        if (bestDiscount) {
          appliedDiscount = bestDiscount;
          
          if (bestDiscount.discount_percent) {
            discountPercent = bestDiscount.discount_percent;
            finalPrice = basePrice * (1 - discountPercent / 100);
          } else if (bestDiscount.fixed_price) {
            finalPrice = bestDiscount.fixed_price;
            discountPercent = ((basePrice - finalPrice) / basePrice) * 100;
          }
        }
      }

      return {
        product_id: productId,
        base_price_ht: basePrice,
        unit_price_ht: finalPrice,
        discount_percent: discountPercent,
        total_discount_amount: (basePrice - finalPrice) * quantity,
        total_ht: finalPrice * quantity,
        applied_discount: appliedDiscount ? {
          id: appliedDiscount.id,
          type: appliedDiscount.discount_percent ? 'percentage' : 'fixed_price',
          value: appliedDiscount.discount_percent || appliedDiscount.fixed_price,
          description: appliedDiscount.description
        } : null
      };
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les remises applicables pour un produit et un client
   * @param {number} productId - ID du produit
   * @param {number} clientId - ID du client
   * @param {number} quantity - Quantité
   * @returns {Array} Liste des remises applicables
   */
  static async getApplicableDiscounts(productId, clientId, quantity) {
    const now = new Date();
    
    // Récupérer le produit
    const product = await Product.findByPk(productId);

    const whereConditions = {
      is_active: true,
      [Op.or]: [
        { valid_from: { [Op.lte]: now } },
        { valid_from: null }
      ],
      [Op.or]: [
        { valid_to: { [Op.gte]: now } },
        { valid_to: null }
      ],
      [Op.or]: [
        { minimum_quantity: { [Op.lte]: quantity } },
        { minimum_quantity: null }
      ],
      [Op.and]: [
        {
          [Op.or]: [
            { client_id: clientId },
            { client_id: null }
          ]
        },
        {
          [Op.or]: [
            { product_id: productId },
            { category_name: product.category },
            { 
              [Op.and]: [
                { product_id: null },
                { category_name: null }
              ]
            }
          ]
        }
      ]
    };

    const discounts = await PriceOverride.findAll({
      where: whereConditions,
      include: [
        { model: Client, as: 'client', required: false },
        { model: Product, as: 'product', required: false }
      ],
      order: [
        ['priority', 'DESC'],
        ['discount_percent', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    return discounts;
  }

  /**
   * Déterminer la meilleure remise parmi celles applicables
   * @param {Array} discounts - Liste des remises
   * @param {number} basePrice - Prix de base
   * @param {number} quantity - Quantité
   * @returns {Object|null} Meilleure remise
   */
  static getBestDiscount(discounts, basePrice, quantity) {
    if (!discounts || discounts.length === 0) {
      return null;
    }

    let bestDiscount = null;
    let maxSavings = 0;

    for (const discount of discounts) {
      let savings = 0;

      if (discount.discount_percent) {
        savings = (basePrice * discount.discount_percent / 100) * quantity;
      } else if (discount.fixed_price) {
        savings = (basePrice - discount.fixed_price) * quantity;
      }

      if (savings > maxSavings) {
        maxSavings = savings;
        bestDiscount = discount;
      }
    }

    return bestDiscount;
  }

  /**
   * Calculer le prix pour plusieurs produits
   * @param {Array} items - Liste des items avec product_id et quantity
   * @param {number} clientId - ID du client
   * @returns {Object} Détails des prix calculés
   */
  static async calculateMultipleProductsPrices(items, clientId) {
    try {
      const results = [];
      let totalHT = 0;
      let totalDiscountAmount = 0;

      for (const item of items) {
        const priceCalculation = await this.calculateFinalPrice(
          item.product_id,
          clientId,
          item.quantity
        );
        
        results.push({
          ...item,
          ...priceCalculation
        });
        
        totalHT += priceCalculation.total_ht;
        totalDiscountAmount += priceCalculation.total_discount_amount;
      }

      return {
        items: results,
        summary: {
          total_ht: totalHT,
          total_discount_amount: totalDiscountAmount,
          total_savings_percent: totalDiscountAmount > 0 ? 
            (totalDiscountAmount / (totalHT + totalDiscountAmount)) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Erreur lors du calcul des prix multiples:', error);
      throw error;
    }
  }

  /**
   * Valider qu'une remise peut être appliquée
   * @param {number} discountId - ID de la remise
   * @param {number} productId - ID du produit
   * @param {number} clientId - ID du client
   * @param {number} quantity - Quantité
   * @returns {boolean} True si la remise est applicable
   */
  static async validateDiscountApplication(discountId, productId, clientId, quantity) {
    try {
      const discount = await PriceOverride.findByPk(discountId);
      
      if (!discount || !discount.is_active) {
        return false;
      }

      const now = new Date();
      
      // Vérifier les dates de validité
      if (discount.valid_from && discount.valid_from > now) {
        return false;
      }
      
      if (discount.valid_to && discount.valid_to < now) {
        return false;
      }

      // Vérifier la quantité minimale
      if (discount.min_quantity && quantity < discount.min_quantity) {
        return false;
      }

      // Vérifier le client
      if (discount.client_id && discount.client_id !== clientId) {
        return false;
      }

      // Vérifier le produit ou la catégorie
      if (discount.product_id && discount.product_id !== productId) {
        return false;
      }

      if (discount.category_id) {
        const product = await Product.findByPk(productId);
        if (!product || product.category_id !== discount.category_id) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la validation de la remise:', error);
      return false;
    }
  }

  /**
   * Obtenir l'historique des prix pour un produit
   * @param {number} productId - ID du produit
   * @param {number} days - Nombre de jours d'historique
   * @returns {Array} Historique des prix
   */
  static async getPriceHistory(productId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Cette méthode nécessiterait une table d'historique des prix
      // Pour l'instant, on retourne le prix actuel
      const product = await Product.findByPk(productId);
      
      if (!product) {
        return [];
      }

      return [{
        date: product.updated_at,
        price: product.base_price_ht,
        type: 'current'
      }];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des prix:', error);
      throw error;
    }
  }
}

module.exports = PriceCalculationService;