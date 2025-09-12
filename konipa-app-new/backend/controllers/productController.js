const { Product, ProductStock, ProductSubstitute, PriceOverride } = require('../models');
const { Op } = require('sequelize');
const { AuditService } = require('../services/AuditService');
const PriceCalculationService = require('../services/PriceCalculationService');
const NotificationService = require('../services/NotificationService');
const notificationService = require('../services/NotificationService');
const ActivityLogger = require('../services/activityLogger');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');

class ProductController {
  /**
   * Récupérer tous les produits avec filtres et pagination
   */
  static async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category_id,
        brand_id,
        status = 'active',
        min_price,
        max_price,
        in_stock_only,
        sort_by = 'name',
        sort_order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Filtres de recherche
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { sku: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status === 'active') {
        whereConditions.is_active = true;
      } else if (status === 'inactive') {
        whereConditions.is_active = false;
      }

      if (category_id) {
        whereConditions.category = category_id; // Utilise le champ category (string)
      }

      if (brand_id) {
        whereConditions.brand = brand_id; // Utilise le champ brand (string)
      }

      if (min_price || max_price) {
        whereConditions.base_price_ht = {};
        if (min_price) {
          whereConditions.base_price_ht[Op.gte] = parseFloat(min_price);
        }
        if (max_price) {
          whereConditions.base_price_ht[Op.lte] = parseFloat(max_price);
        }
      }

      const includeOptions = [
        {
          model: ProductStock,
          as: 'stocks',
          attributes: ['quantity_available', 'quantity_reserved', 'quantity_ordered', 'location']
        }
      ];

      // Filtrer par stock disponible si demandé
      if (in_stock_only === 'true') {
        includeOptions[0].where = {
          quantity_available: { [Op.gt]: 0 }
        };
        includeOptions[0].required = true;
      }

      const { count, rows } = await Product.findAndCountAll({
        where: whereConditions,
        include: includeOptions,
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          products: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des produits',
        error: error.message
      });
    }
  }

  /**
   * Récupérer un produit par ID
   */
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: ProductStock,
            as: 'stocks',
            attributes: ['quantity_available', 'quantity_reserved', 'quantity_ordered', 'location', 'last_inventory_date']
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du produit',
        error: error.message
      });
    }
  }

  /**
   * Créer un nouveau produit
   */
  static async createProduct(req, res) {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      // Vérifier les permissions
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour créer un produit'
        });
      }

      const productData = req.body;

      // Vérifier l'unicité de la référence Sage
      if (productData.product_ref_sage) {
        const existingProduct = await Product.findBySageRef(productData.product_ref_sage);
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Un produit avec cette référence Sage existe déjà'
          });
        }
      }

      // Vérifier l'unicité du code-barres
      if (productData.barcode) {
        const existingProduct = await Product.findByBarcode(productData.barcode);
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Un produit avec ce code-barres existe déjà'
          });
        }
      }

      // Créer le produit
      const product = await Product.create({
        ...productData,
        created_by: req.user.id
      });

      // Créer l'entrée de stock initiale si fournie
      if (productData.initial_stock !== undefined) {
        await ProductStock.create({
          product_id: product.id,
          quantity_available: productData.initial_stock,
        quantity_reserved: 0,
        quantity_ordered: 0,
          location: productData.location || 'DEFAULT'
        });
      }

      // Log d'audit
      await AuditService.log({
        entity_type: 'product',
        entity_id: product.id,
        action: 'CREATE',
        user_id: req.user.id,
        user_email: req.user.email,
        new_values: product.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Enregistrer l'activité de création de produit
      try {
        await ActivityLogger.logProductCreated(req.user.id, product.id, product.name);
      } catch (activityError) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      // Récupérer le produit complet avec ses relations
      const completeProduct = await Product.findByPk(product.id, {
        include: [
          { model: ProductStock, as: 'stocks' }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: completeProduct
      });
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du produit',
        error: error.message
      });
    }
  }

  /**
   * Mettre à jour un produit
   */
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      // Vérifier les permissions
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour modifier un produit'
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = product.toJSON();

      // Vérifier l'unicité de la référence Sage si modifiée
      if (updateData.product_ref_sage && updateData.product_ref_sage !== product.product_ref_sage) {
        const existingProduct = await Product.findBySageRef(updateData.product_ref_sage);
        if (existingProduct && existingProduct.id !== product.id) {
          return res.status(400).json({
            success: false,
            message: 'Un produit avec cette référence Sage existe déjà'
          });
        }
      }

      // Vérifier l'unicité du code-barres si modifié
      if (updateData.barcode && updateData.barcode !== product.barcode) {
        const existingProduct = await Product.findByBarcode(updateData.barcode);
        if (existingProduct && existingProduct.id !== product.id) {
          return res.status(400).json({
            success: false,
            message: 'Un produit avec ce code-barres existe déjà'
          });
        }
      }

      // Mettre à jour le produit
      await product.update({
        ...updateData,
        updated_by: req.user.id
      });

      // Log d'audit
      await AuditService.log({
        entity_type: 'product',
        entity_id: product.id,
        action: 'UPDATE',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: oldValues,
        new_values: product.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Enregistrer l'activité de modification de produit
      try {
        await ActivityLogger.logProductUpdated(req.user.id, product.id, product.name);
      } catch (activityError) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: product
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du produit',
        error: error.message
      });
    }
  }

  /**
   * Supprimer un produit
   */
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      // Vérifier les permissions
      if (!['admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour supprimer un produit'
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Vérifier s'il y a des commandes associées
      const { OrderItem } = require('../models');
      const orderItemCount = await OrderItem.count({ where: { product_id: id } });
      if (orderItemCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer un produit ayant des commandes associées'
        });
      }

      // Sauvegarder les données pour l'audit
      const productData = product.toJSON();

      // Supprimer les données associées
      await ProductStock.destroy({ where: { product_id: id } });
      await ProductSubstitute.destroy({ where: { product_id: id } });
      await PriceOverride.destroy({ where: { product_id: id } });

      // Supprimer le produit
      await product.destroy();

      // Log d'audit
      await AuditService.log({
        entity_type: 'product',
        entity_id: id,
        action: 'DELETE',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: productData,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Enregistrer l'activité de suppression de produit
      try {
        await ActivityLogger.logProductDeleted(req.user.id, id, productData.name);
      } catch (activityError) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du produit',
        error: error.message
      });
    }
  }

  /**
   * Calculer le prix d'un produit pour un client
   */
  static async calculatePrice(req, res) {
    try {
      const { id } = req.params;
      const { client_id, quantity = 1 } = req.query;

      if (!client_id) {
        return res.status(400).json({
          success: false,
          message: 'ID client requis pour le calcul du prix'
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      const priceCalculation = await PriceCalculationService.calculateFinalPrice(
        parseInt(id),
        parseInt(client_id),
        parseInt(quantity)
      );

      res.json({
        success: true,
        data: priceCalculation
      });
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul du prix',
        error: error.message
      });
    }
  }

  /**
   * Mettre à jour le stock d'un produit
   */
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation = 'set', location = 'DEFAULT' } = req.body;

      // Vérifier les permissions
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour modifier le stock'
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      let productStock = await ProductStock.findOne({
        where: { product_id: id, location }
      });

      if (!productStock) {
        productStock = await ProductStock.create({
          product_id: id,
          quantity_available: 0,
        quantity_reserved: 0,
        quantity_ordered: 0,
          location
        });
      }

      const oldQuantity = productStock.quantity_available;
      let newQuantity;

      switch (operation) {
        case 'add':
          newQuantity = oldQuantity + quantity;
          break;
        case 'subtract':
          newQuantity = Math.max(0, oldQuantity - quantity);
          break;
        case 'set':
        default:
          newQuantity = quantity;
          break;
      }

      await productStock.update({
        quantity_available: newQuantity,
        last_inventory_date: new Date()
      });

      // Log d'audit
      await AuditService.log({
        entity_type: 'product_stock',
        entity_id: productStock.id,
        action: 'UPDATE_STOCK',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: { quantity_available: oldQuantity },
          new_values: { quantity_available: newQuantity, operation },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Stock mis à jour avec succès',
        data: {
          product_id: id,
          old_quantity_available: oldQuantity,
          new_quantity_available: newQuantity,
          operation,
          location
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du stock',
        error: error.message
      });
    }
  }

  /**
   * Obtenir les produits de substitution
   */
  static async getSubstitutes(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      const substitutes = await ProductSubstitute.findAll({
        where: { product_id: id },
        include: [
          {
            model: Product,
            as: 'SubstituteProduct',
            include: [
              { model: ProductStock, as: 'stocks', attributes: ['quantity_available'] }
            ]
          }
        ]
      });

      res.json({
        success: true,
        data: substitutes
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des substituts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des substituts',
        error: error.message
      });
    }
  }

  /**
   * Synchroniser un produit avec Sage
   */
  static async syncProductToSage(req, res) {
    try {
      const { id } = req.params;

      // Vérifier les permissions
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour synchroniser avec Sage'
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Simuler la synchronisation avec Sage
      const sageResponse = {
        sage_id: `SAGE_PROD_${Date.now()}`,
        sage_code: product.product_ref_sage || `PROD_${product.id}`,
        sync_status: 'success',
        sync_date: new Date()
      };

      // Mettre à jour le produit avec les informations Sage
      await product.update({
        sage_id: sageResponse.sage_id,
        sage_code: sageResponse.sage_code,
        sage_last_sync: sageResponse.sync_date,
        is_synced_to_sage: true
      });

      // Log d'audit
      await AuditService.log({
        entity_type: 'product',
        entity_id: product.id,
        action: 'SYNC_SAGE',
        user_id: req.user.id,
        user_email: req.user.email,
        new_values: { sage_sync: sageResponse },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Produit synchronisé avec Sage avec succès',
        data: {
          product_id: product.id,
          sage_response: sageResponse
        }
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec Sage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la synchronisation avec Sage'
      });
    }
  }

  /**
   * Exporter les produits en Excel
   */
  static async exportProductsToExcel(req, res) {
    try {
      const { category_id, brand_id, status, in_stock_only } = req.query;
      
      const whereConditions = {};
      
      if (status) {
        whereConditions.status = status;
      }
      
      if (category_id) {
        whereConditions.category = category_id;
      }
      
      if (brand_id) {
        whereConditions.brand = brand_id;
      }
      
      const includeOptions = [
        {
          model: ProductStock,
          as: 'stocks',
          attributes: ['quantity_available', 'quantity_reserved', 'quantity_ordered', 'location']
        }
      ];
      
      if (in_stock_only === 'true') {
        includeOptions[0].where = {
          quantity_available: { [Op.gt]: 0 }
        };
      }
      
      const products = await Product.findAll({
        where: whereConditions,
        include: includeOptions,
        order: [['name', 'ASC']]
      });
      
      // Créer le workbook Excel
      const wb = XLSX.utils.book_new();
      
      // Préparer les données pour Excel
      const productData = [
        ['SKU', 'Nom', 'Description', 'Prix', 'Catégorie', 'Marque', 'Statut', 'Stock Disponible', 'Stock Réservé', 'Stock Commandé']
      ];
      
      products.forEach(product => {
        const stock = product.stocks && product.stocks.length > 0 ? product.stocks[0] : {}; // Prendre le premier stock trouvé
        
        productData.push([
          product.sku || 'N/A',
          product.name,
          product.description || 'N/A',
          product.base_price_ht || 0,
          product.category || 'N/A',
          product.brand || 'N/A',
          product.is_active ? 'Actif' : 'Inactif',
          stock.quantity_available || 0,
          stock.quantity_reserved || 0,
          stock.quantity_ordered || 0
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(wb, ws, 'Produits');
      
      // Générer le buffer Excel
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Configuration des headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="produits_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      
      res.send(excelBuffer);
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel des produits:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export Excel des produits'
      });
    }
  }

  /**
   * Exporter les produits en CSV
   */
  static async exportProductsToCSV(req, res) {
    try {
      const { category_id, brand_id, status, in_stock_only } = req.query;
      
      const whereConditions = {};
      
      if (status) {
        whereConditions.status = status;
      }
      
      if (category_id) {
        whereConditions.category = category_id;
      }
      
      if (brand_id) {
        whereConditions.brand = brand_id;
      }
      
      const includeOptions = [
        {
          model: ProductStock,
          as: 'stocks',
          attributes: ['quantity_available', 'quantity_reserved', 'quantity_ordered', 'location']
        }
      ];
      
      if (in_stock_only === 'true') {
        includeOptions[0].where = {
          quantity_available: { [Op.gt]: 0 }
        };
      }
      
      const products = await Product.findAll({
        where: whereConditions,
        include: includeOptions,
        order: [['name', 'ASC']]
      });
      
      // Export CSV
      const csvData = [
        'SKU,Nom,Description,Prix,Catégorie,Marque,Statut,Stock Disponible,Stock Réservé,Stock Commandé'
      ];
      
      products.forEach(product => {
        const stock = product.stocks && product.stocks.length > 0 ? product.stocks[0] : {};
        
        const row = [
          product.sku || 'N/A',
          `"${product.name}"`, 
          `"${product.description || 'N/A'}"`, 
          product.base_price_ht || 0,
          product.category || 'N/A',
          product.brand || 'N/A',
          product.is_active ? 'Actif' : 'Inactif',
          stock.quantity_available || 0,
          stock.quantity_reserved || 0,
          stock.quantity_ordered || 0
        ];
        csvData.push(row.join(','));
      });
      
      const csvContent = csvData.join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="produits_export_${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send('\uFEFF' + csvContent); // BOM pour UTF-8
      
    } catch (error) {
      console.error('Erreur lors de l\'export CSV des produits:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export CSV des produits'
      });
    }
  }

  /**
   * Récupérer les catégories de produits
   */
  static async getCategories(req, res) {
    try {
      const categories = await Product.findAll({
        attributes: [
          'category',
          [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        where: { category: { [Op.ne]: null } },
        order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'DESC']]
      });

      res.json({
        success: true,
        data: categories.map(cat => ({ name: cat.category, count: cat.dataValues.count }))
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des catégories',
        error: error.message
      });
    }
  }

  /**
   * Récupérer les marques de produits
   */
  static async getBrands(req, res) {
    try {
      const brands = await Product.findAll({
        attributes: [
          'brand',
          [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
        ],
        group: ['brand'],
        where: { brand: { [Op.ne]: null } },
        order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'DESC']]
      });

      res.json({
        success: true,
        data: brands.map(brand => ({ name: brand.brand, count: brand.dataValues.count }))
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des marques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des marques',
        error: error.message
      });
    }
  }

  /**
   * Récupérer les produits en rupture de stock
   */
  static async getLowStock(req, res) {
    try {
      const { threshold = 10 } = req.query;

      const lowStockProducts = await Product.findAll({
        include: [
          {
            model: ProductStock,
            as: 'stocks',
            where: {
              quantity_available: { [Op.lte]: parseInt(threshold) }
            },
            required: true // S'assurer que seuls les produits avec stock sont inclus
          }
        ],
        where: { is_active: true },
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: lowStockProducts
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des produits en rupture de stock:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des produits en rupture de stock',
        error: error.message
      });
    }
  }

  /**
   * Récupérer les statistiques des produits
   */
  static async getStats(req, res) {
    try {
      const totalProducts = await Product.count();
      const activeProducts = await Product.count({ where: { is_active: true } });
      const inactiveProducts = totalProducts - activeProducts;

      const totalStockValue = await Product.sum('base_price_ht', {
        include: [{ 
          model: ProductStock,
          as: 'stocks',
          attributes: [],
          where: { quantity_available: { [Op.gt]: 0 } }
        }],
        group: ['Product.id'] // Group by product to sum stock value per product
      }).then(sums => sums ? sums.reduce((acc, sum) => acc + (sum.dataValues?.sum || 0), 0) : 0);

      // Simpler way to get total stock value
      const productsWithStock = await Product.findAll({
        attributes: ['base_price_ht'],
        include: [{
          model: ProductStock,
          as: 'stocks',
          attributes: ['quantity_available'],
          where: { quantity_available: { [Op.gt]: 0 } }
        }]
      });

      let totalInventoryValue = 0;
      productsWithStock.forEach(product => {
        if (product.stocks && product.stocks.length > 0) {
          totalInventoryValue += product.base_price_ht * product.stocks[0].quantity_available;
        }
      });

      const lowStockCount = await Product.count({
        include: [
          {
            model: ProductStock,
            as: 'stocks',
            where: {
              quantity_available: { [Op.lte]: 10 } // Default threshold
            },
            required: true
          }
        ],
        where: { is_active: true }
      });

      res.json({
        success: true,
        data: {
          totalProducts,
          activeProducts,
          inactiveProducts,
          lowStockProducts: lowStockCount,
          totalInventoryValue: totalInventoryValue.toFixed(2)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques produits:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques produits',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;