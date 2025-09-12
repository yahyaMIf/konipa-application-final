const express = require('express');
const router = express.Router();
const { Discount, Client, Product, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { AuditService } = require('../services/AuditService');
const NotificationService = require('../services/notificationService');
const { body, param, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Validation middleware
const validateDiscountCreation = [
  body('name')
    .notEmpty()
    .withMessage('Nom requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nom doit contenir entre 2 et 100 caractères'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description trop longue (max 500 caractères)'),
  body('type')
    .isIn(['percentage', 'fixed_amount', 'buy_x_get_y'])
    .withMessage('Type de remise invalide'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Valeur de remise invalide'),
  body('min_quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantité minimale invalide'),
  body('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Montant minimal invalide'),
  body('max_discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Montant maximal de remise invalide'),
  body('start_date')
    .isISO8601()
    .withMessage('Date de début invalide'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Statut actif invalide'),
  body('applies_to')
    .isIn(['all', 'specific_products', 'specific_clients', 'product_category'])
    .withMessage('Application invalide'),
  body('product_ids')
    .optional()
    .isArray()
    .withMessage('Liste de produits invalide'),
  body('product_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID produit invalide'),
  body('client_ids')
    .optional()
    .isArray()
    .withMessage('Liste de clients invalide'),
  body('client_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID client invalide'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID catégorie invalide'),
  body('usage_limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limite d\'utilisation invalide'),
  body('usage_limit_per_client')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limite d\'utilisation par client invalide')
];

const validateDiscountUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nom doit contenir entre 2 et 100 caractères'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description trop longue (max 500 caractères)'),
  body('type')
    .optional()
    .isIn(['percentage', 'fixed_amount', 'buy_x_get_y'])
    .withMessage('Type de remise invalide'),
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valeur de remise invalide'),
  body('min_quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantité minimale invalide'),
  body('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Montant minimal invalide'),
  body('max_discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Montant maximal de remise invalide'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Statut actif invalide'),
  body('applies_to')
    .optional()
    .isIn(['all', 'specific_products', 'specific_clients', 'product_category'])
    .withMessage('Application invalide'),
  body('usage_limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limite d\'utilisation invalide'),
  body('usage_limit_per_client')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limite d\'utilisation par client invalide')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID invalide')
];

/**
 * @route GET /api/discounts
 * @desc Récupérer toutes les remises avec filtres et pagination
 * @access Private (Admin/Manager)
 */
router.get('/', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
    query('type').optional().isIn(['percentage', 'fixed_amount', 'buy_x_get_y']).withMessage('Type invalide'),
    query('is_active').optional().isBoolean().withMessage('Statut actif invalide'),
    query('applies_to').optional().isIn(['all', 'specific_products', 'specific_clients', 'product_category']).withMessage('Application invalide'),
    query('sort_by').optional().isIn(['name', 'type', 'value', 'start_date', 'end_date', 'created_at']).withMessage('Tri invalide'),
    query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('Ordre de tri invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 20,
        search,
        type,
        is_active,
        applies_to,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Filtres de recherche
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (type) {
        whereConditions.type = type;
      }

      if (is_active !== undefined) {
        whereConditions.is_active = is_active === 'true';
      }

      if (applies_to) {
        whereConditions.applies_to = applies_to;
      }

      const { count, rows } = await Discount.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          discounts: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des remises:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des remises',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/discounts/active
 * @desc Récupérer les remises actives
 * @access Private
 */
router.get('/active', 
  authenticateToken,
  async (req, res) => {
    try {
      const now = new Date();
      const discounts = await Discount.findAll({
        where: {
          is_active: true,
          start_date: { [Op.lte]: now },
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: now } }
          ]
        },
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: discounts
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des remises actives:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des remises actives',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/discounts/:id
 * @desc Récupérer une remise par ID
 * @access Private (Admin/Manager)
 */
router.get('/:id', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const discount = await Discount.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Product,
            through: { attributes: [] },
            attributes: ['id', 'name', 'reference']
          },
          {
            model: Client,
            through: { attributes: [] },
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Remise non trouvée'
        });
      }

      res.json({
        success: true,
        data: discount
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la remise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la remise',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/discounts
 * @desc Créer une nouvelle remise
 * @access Private (Admin/Manager)
 */
router.post('/', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateDiscountCreation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const { product_ids, client_ids, ...discountData } = req.body;

      // Validation des dates
      if (discountData.end_date && new Date(discountData.end_date) <= new Date(discountData.start_date)) {
        return res.status(400).json({
          success: false,
          message: 'La date de fin doit être postérieure à la date de début'
        });
      }

      // Validation de la valeur selon le type
      if (discountData.type === 'percentage' && discountData.value > 100) {
        return res.status(400).json({
          success: false,
          message: 'Le pourcentage de remise ne peut pas dépasser 100%'
        });
      }

      // Créer la remise
      const discount = await Discount.create({
        ...discountData,
        created_by: req.user.id
      });

      // Associer les produits si spécifiés
      if (product_ids && product_ids.length > 0) {
        const products = await Product.findAll({
          where: { id: { [Op.in]: product_ids } }
        });
        await discount.setProducts(products);
      }

      // Associer les clients si spécifiés
      if (client_ids && client_ids.length > 0) {
        const clients = await Client.findAll({
          where: { id: { [Op.in]: client_ids } }
        });
        await discount.setClients(clients);
      }

      // Log d'audit
      await AuditService.log({
        entity_type: 'discount',
        entity_id: discount.id,
        action: 'CREATE',
        user_id: req.user.id,
        user_email: req.user.email,
        new_values: discount.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Notification aux managers
      const managers = await User.findAll({
        where: { role: 'manager', isActive: true }
      });

      for (const manager of managers) {
        await NotificationService.createNotification({
          user_id: manager.id,
          type: 'info',
          title: 'Nouvelle remise créée',
          message: `Une nouvelle remise "${discount.name}" a été créée par ${req.user.first_name} ${req.user.last_name}`,
          priority: 'medium',
          action_url: `/admin/discounts/${discount.id}`
        });
      }

      res.status(201).json({
        success: true,
        message: 'Remise créée avec succès',
        data: discount
      });
    } catch (error) {
      console.error('Erreur lors de la création de la remise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la remise',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/discounts/:id
 * @desc Mettre à jour une remise
 * @access Private (Admin/Manager)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [...validateId, ...validateDiscountUpdate],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { product_ids, client_ids, ...updateData } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const discount = await Discount.findByPk(id);
      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Remise non trouvée'
        });
      }

      // Validation des dates
      const startDate = updateData.start_date || discount.start_date;
      const endDate = updateData.end_date || discount.end_date;
      
      if (endDate && new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
          success: false,
          message: 'La date de fin doit être postérieure à la date de début'
        });
      }

      // Validation de la valeur selon le type
      const type = updateData.type || discount.type;
      const value = updateData.value || discount.value;
      
      if (type === 'percentage' && value > 100) {
        return res.status(400).json({
          success: false,
          message: 'Le pourcentage de remise ne peut pas dépasser 100%'
        });
      }

      const oldValues = discount.toJSON();
      await discount.update(updateData);

      // Mettre à jour les associations de produits si spécifiées
      if (product_ids !== undefined) {
        if (product_ids.length > 0) {
          const products = await Product.findAll({
            where: { id: { [Op.in]: product_ids } }
          });
          await discount.setProducts(products);
        } else {
          await discount.setProducts([]);
        }
      }

      // Mettre à jour les associations de clients si spécifiées
      if (client_ids !== undefined) {
        if (client_ids.length > 0) {
          const clients = await Client.findAll({
            where: { id: { [Op.in]: client_ids } }
          });
          await discount.setClients(clients);
        } else {
          await discount.setClients([]);
        }
      }

      // Log d'audit
      await AuditService.log({
        entity_type: 'discount',
        entity_id: discount.id,
        action: 'UPDATE',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: oldValues,
        new_values: discount.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Remise mise à jour avec succès',
        data: discount
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la remise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la remise',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/discounts/:id
 * @desc Supprimer une remise
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken,
  requireRole(['admin']),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const discount = await Discount.findByPk(id);
      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Remise non trouvée'
        });
      }

      // Vérifier si la remise est utilisée dans des commandes
      // Cette vérification devrait être ajoutée selon le modèle de données

      const discountData = discount.toJSON();

      // Supprimer les associations
      await discount.setProducts([]);
      await discount.setClients([]);

      // Supprimer la remise
      await discount.destroy();

      // Log d'audit
      await AuditService.log({
        entity_type: 'discount',
        entity_id: id,
        action: 'DELETE',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: discountData,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Remise supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la remise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la remise',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/discounts/:id/toggle-status
 * @desc Activer/Désactiver une remise
 * @access Private (Admin/Manager)
 */
router.post('/:id/toggle-status', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const discount = await Discount.findByPk(id);
      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Remise non trouvée'
        });
      }

      const oldValues = discount.toJSON();
      await discount.update({ is_active: !discount.is_active });

      // Log d'audit
      await AuditService.log({
        entity_type: 'discount',
        entity_id: discount.id,
        action: discount.is_active ? 'ACTIVATE' : 'DEACTIVATE',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: oldValues,
        new_values: discount.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: `Remise ${discount.is_active ? 'activée' : 'désactivée'} avec succès`,
        data: discount
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut de la remise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de statut de la remise',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/discounts/:id/usage-stats
 * @desc Récupérer les statistiques d'utilisation d'une remise
 * @access Private (Admin/Manager)
 */
router.get('/:id/usage-stats', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const discount = await Discount.findByPk(id);
      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Remise non trouvée'
        });
      }

      // Ici, vous devriez implémenter la logique pour récupérer les statistiques d'utilisation
      // basées sur les commandes qui ont utilisé cette remise
      const stats = {
        total_usage: discount.usage_count || 0,
        remaining_usage: discount.usage_limit ? discount.usage_limit - (discount.usage_count || 0) : null,
        total_discount_amount: 0, // À calculer depuis les commandes
        unique_clients: 0, // À calculer depuis les commandes
        average_order_value: 0 // À calculer depuis les commandes
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques d\'utilisation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques d\'utilisation',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/discounts/applicable/:client_id/:product_id
 * @desc Récupérer les remises applicables pour un client et un produit
 * @access Private
 */
router.get('/applicable/:client_id/:product_id', 
  authenticateToken,
  [
    param('client_id').isInt({ min: 1 }).withMessage('ID client invalide'),
    param('product_id').isInt({ min: 1 }).withMessage('ID produit invalide')
  ],
  async (req, res) => {
    try {
      const { client_id, product_id } = req.params;
      const { quantity = 1 } = req.query;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const now = new Date();
      
      // Récupérer toutes les remises actives
      const discounts = await Discount.findAll({
        where: {
          is_active: true,
          start_date: { [Op.lte]: now },
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: now } }
          ]
        },
        include: [
          {
            model: Product,
            through: { attributes: [] },
            required: false
          },
          {
            model: Client,
            through: { attributes: [] },
            required: false
          }
        ]
      });

      // Filtrer les remises applicables
      const applicableDiscounts = discounts.filter(discount => {
        // Vérifier l'application
        if (discount.applies_to === 'all') {
          return true;
        }
        
        if (discount.applies_to === 'specific_products') {
          return discount.Products.some(p => p.id == product_id);
        }
        
        if (discount.applies_to === 'specific_clients') {
          return discount.Clients.some(c => c.id == client_id);
        }
        
        // Pour product_category, vous devriez vérifier la catégorie du produit
        
        return false;
      }).filter(discount => {
        // Vérifier la quantité minimale
        if (discount.min_quantity && quantity < discount.min_quantity) {
          return false;
        }
        
        return true;
      });

      res.json({
        success: true,
        data: applicableDiscounts
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des remises applicables:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des remises applicables',
        error: error.message
      });
    }
  }
);

module.exports = router;