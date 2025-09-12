// Service pour gérer les promotions et nouveautés
import adminJournalService from './adminJournalService.js';
import { ceoJournalService } from './ceoJournalService.js';

class PromotionService {
  constructor() {
    this.promotions = new Map();
    this.newProducts = new Map();
    this.loadData();
  }

  // Charger les données depuis le localStorage
  loadData() {
    try {
      const promotions = localStorage.getItem('promotions');
      const newProducts = localStorage.getItem('newProducts');
      
      if (promotions) {
        this.promotions = new Map(JSON.parse(promotions));
      }
      
      if (newProducts) {
        this.newProducts = new Map(JSON.parse(newProducts));
      }
    } catch (error) {
      }
  }

  // Sauvegarder les données dans le localStorage
  saveData() {
    try {
      localStorage.setItem('promotions', JSON.stringify(Array.from(this.promotions.entries())));
      localStorage.setItem('newProducts', JSON.stringify(Array.from(this.newProducts.entries())));
    } catch (error) {
      }
  }

  // Ajouter une promotion
  addPromotion(productId, promotionData) {
    const {
      title,
      description,
      discountPercentage,
      startDate,
      endDate,
      image,
      isActive = true
    } = promotionData;

    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Le pourcentage de réduction doit être entre 0 et 100');
    }

    const promotion = {
      id: Date.now().toString(),
      productId,
      title,
      description,
      discountPercentage,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      image: image || null,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.promotions.set(promotion.id, promotion);
    this.saveData();
    
    // Log promotion creation
    adminJournalService.logConfigurationChange({
      type: 'Création de promotion',
      description: `Nouvelle promotion créée: ${title}`,
      oldValue: null,
      newValue: {
        title,
        productId,
        discountPercentage,
        startDate: promotion.startDate,
        endDate: promotion.endDate
      },
      data: promotion,
      timestamp: new Date().toISOString()
    });
    
    return promotion;
  }

  // Obtenir toutes les promotions
  getAllPromotions() {
    return Array.from(this.promotions.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Obtenir les promotions actives
  getActivePromotions() {
    const now = new Date();
    return this.getAllPromotions().filter(promo => {
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      return promo.isActive && now >= startDate && now <= endDate;
    });
  }

  // Obtenir les promotions pour un produit spécifique
  getPromotionsForProduct(productId) {
    return this.getAllPromotions().filter(promo => promo.productId === productId);
  }

  // Obtenir la meilleure promotion active pour un produit
  getBestPromotionForProduct(productId) {
    const activePromotions = this.getActivePromotions()
      .filter(promo => promo.productId === productId)
      .sort((a, b) => b.discountPercentage - a.discountPercentage);
    
    return activePromotions.length > 0 ? activePromotions[0] : null;
  }

  // Supprimer une promotion
  removePromotion(promotionId) {
    const promotion = this.promotions.get(promotionId);
    if (promotion) {
      // Log promotion deletion
      ceoJournalService.logConfigurationChange({
        type: 'Suppression de promotion',
        description: `Promotion supprimée: ${promotion.title}`,
        oldValue: promotion,
        newValue: null,
        data: { promotionId, deletedPromotion: promotion },
        timestamp: new Date().toISOString()
      });
    }
    
    this.promotions.delete(promotionId);
    this.saveData();
  }

  // Activer/désactiver une promotion
  togglePromotion(promotionId) {
    const promotion = this.promotions.get(promotionId);
    if (promotion) {
      const oldStatus = promotion.isActive;
      promotion.isActive = !promotion.isActive;
      promotion.updatedAt = new Date().toISOString();
      this.saveData();
      
      // Log promotion status change
      ceoJournalService.logConfigurationChange({
        type: 'Modification de promotion',
        description: `Promotion ${promotion.title} ${promotion.isActive ? 'activée' : 'désactivée'}`,
        oldValue: { isActive: oldStatus },
        newValue: { isActive: promotion.isActive },
        data: { promotionId, promotion },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Ajouter un produit comme nouveauté
  addNewProduct(productId, newProductData) {
    const {
      title,
      description,
      highlightUntil,
      image,
      isActive = true
    } = newProductData;

    const newProduct = {
      id: Date.now().toString(),
      productId,
      title,
      description,
      highlightUntil: new Date(highlightUntil).toISOString(),
      image: image || null,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.newProducts.set(newProduct.id, newProduct);
    this.saveData();
    return newProduct;
  }

  // Obtenir toutes les nouveautés
  getAllNewProducts() {
    return Array.from(this.newProducts.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Obtenir les nouveautés actives
  getActiveNewProducts() {
    const now = new Date();
    return this.getAllNewProducts().filter(newProd => {
      const highlightUntil = new Date(newProd.highlightUntil);
      return newProd.isActive && now <= highlightUntil;
    });
  }

  // Vérifier si un produit est une nouveauté
  isNewProduct(productId) {
    return this.getActiveNewProducts().some(newProd => newProd.productId === productId);
  }

  // Supprimer une nouveauté
  removeNewProduct(newProductId) {
    this.newProducts.delete(newProductId);
    this.saveData();
  }

  // Activer/désactiver une nouveauté
  toggleNewProduct(newProductId) {
    const newProduct = this.newProducts.get(newProductId);
    if (newProduct) {
      newProduct.isActive = !newProduct.isActive;
      newProduct.updatedAt = new Date().toISOString();
      this.saveData();
    }
  }

  // Calculer le prix avec promotion
  calculatePromotionalPrice(productId, originalPrice) {
    const bestPromotion = this.getBestPromotionForProduct(productId);
    if (bestPromotion) {
      const discountAmount = (originalPrice * bestPromotion.discountPercentage) / 100;
      return {
        originalPrice,
        discountedPrice: originalPrice - discountAmount,
        discount: bestPromotion.discountPercentage,
        promotion: bestPromotion
      };
    }
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discount: 0,
      promotion: null
    };
  }

  // Nettoyer les promotions et nouveautés expirées
  cleanExpiredItems() {
    const now = new Date();
    
    // Nettoyer les promotions expirées
    for (const [id, promotion] of this.promotions.entries()) {
      if (new Date(promotion.endDate) < now) {
        this.promotions.delete(id);
      }
    }
    
    // Nettoyer les nouveautés expirées
    for (const [id, newProduct] of this.newProducts.entries()) {
      if (new Date(newProduct.highlightUntil) < now) {
        this.newProducts.delete(id);
      }
    }
    
    this.saveData();
  }

  // Obtenir les statistiques
  getStats() {
    const activePromotions = this.getActivePromotions();
    const activeNewProducts = this.getActiveNewProducts();
    
    return {
      totalPromotions: this.promotions.size,
      activePromotions: activePromotions.length,
      totalNewProducts: this.newProducts.size,
      activeNewProducts: activeNewProducts.length
    };
  }
}

// Instance singleton
const promotionService = new PromotionService();
export default promotionService;