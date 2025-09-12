const express = require('express');
const router = express.Router();
const { PriceOverride, Client, Product, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { AuditService } = require('../services/AuditService');
const PriceCalculationService = require('../services/PriceCalculationService');

// Validation pour création/modification de tarification
const validatePriceOverride = [
  body('client_id')
    .isUUID()
    .withMessage('ID client invalide'),
  body('product_id')
    .optional()
    .isUUID()
    .withMessage('ID produit invalide'),
  body('category_name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nom de catégorie invalide'),
  body('discount_percent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Pourcentage de remise invalide (0-100)'),
  body('fixed_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prix fixe invalide'),
  body('minimum_quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantité minimum invalide'),
  body('valid_from')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide'),
  body('valid_until')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes trop longues (max 1000 caractères)')
];

const validateId = [
  param('id')
    .isUUID()
    .withMessage('ID invalide')
];

/**
 * @route GET /api/pricing
 * @desc Récupérer toutes les tarifications
 * @access Private (Admin/Manager)
 */
router.get('/',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
    query('client_id').optional().isUUID().withMessage('ID client invalide'),
    query('product_id').optional().isUUID().withMessage('ID produit invalide'),
    query('is_active').optional().isBoolean().withMessage('Statut actif invalide'),
    query('search').optional().isLength({ min: 1 }).withMessage('Terme de recherche invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 20,
        client_id,
        product_id,
        is_active,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtres
      if (client_id) where.client_id = client_id;
      if (product_id) where.product_id = product_id;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      // Recherche
      const include = [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'company_name', 'contact_person'],
          required: true
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'product_ref_sage'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        }
      ];

      if (search) {
        include[0].where = {
          [Op.or]: [
            { company_name: { [Op.iLike]: `%${search}%` } },
            { contact_person: { [Op.iLike]: `%${search}%` } },
          ]
        };
      }

      const { count, rows } = await PriceOverride.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          pricing: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des tarifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tarifications',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/pricing/:id
 * @desc Récupérer une tarification par ID
 * @access Private (Admin/Manager)
 */
router.get('/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ID invalide',
          errors: errors.array()
        });
      }

      const pricing = await PriceOverride.findByPk(req.params.id, {
        include: [
          {
            model: Client,
            attributes: ['id', 'company_name', 'contact_name']
          },
          {
            model: Product,
            attributes: ['id', 'name', 'product_ref_sage']
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      if (!pricing) {
        return res.status(404).json({
          success: false,
          message: 'Tarification non trouvée'
        });
      }

      res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la tarification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la tarification',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/pricing
 * @desc Créer une nouvelle tarification
 * @access Private (Admin/Manager)
 */
router.post('/',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validatePriceOverride,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const {
        client_id,
        product_id,
        category_name,
        discount_percent,
        fixed_price,
        minimum_quantity,
        valid_from,
        valid_until,
        notes
      } = req.body;

      // Vérifier que le client existe
      const client = await Client.findByPk(client_id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier que le produit existe (si spécifié)
      if (product_id) {
        const product = await Product.findByPk(product_id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Produit non trouvé'
          });
        }
      }

      // Vérifier qu'il n'y a pas de conflit avec une tarification existante
      const existingPricing = await PriceOverride.findOne({
        where: {
          client_id,
          [Op.or]: [
            { product_id: product_id || null },
            { category_name: category_name || null }
          ],
          is_active: true,
          [Op.or]: [
            { valid_until: null },
            { valid_until: { [Op.gte]: new Date() } }
          ]
        }
      });

      if (existingPricing) {
        return res.status(409).json({
          success: false,
          message: 'Une tarification active existe déjà pour ce client et ce produit/catégorie'
        });
      }

      const pricing = await PriceOverride.create({
        client_id,
        product_id: product_id || null,
        category_name: category_name || null,
        discount_percent,
        fixed_price: fixed_price || null,
        minimum_quantity: minimum_quantity || 1,
        valid_from: valid_from || new Date(),
        valid_until: valid_until || null,
        notes: notes || null,
        created_by: req.user.id
      });

      // Audit log
      await AuditService.log({
        actor_user_id: req.user.id,
        action: 'CREATE_PRICING',
        entity_type: 'PriceOverride',
        entity_id: pricing.id,
        new_values: pricing.toJSON(),
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Récupérer la tarification créée avec les relations
      const createdPricing = await PriceOverride.findByPk(pricing.id, {
        include: [
          {
            model: Client,
            attributes: ['id', 'company_name', 'contact_name']
          },
          {
            model: Product,
            attributes: ['id', 'name', 'product_ref_sage']
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tarification créée avec succès',
        data: createdPricing
      });
    } catch (error) {
      console.error('Erreur lors de la création de la tarification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la tarification',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/pricing/:id
 * @desc Mettre à jour une tarification
 * @access Private (Admin/Manager)
 */
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [...validateId, ...validatePriceOverride],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const pricing = await PriceOverride.findByPk(req.params.id);
      if (!pricing) {
        return res.status(404).json({
          success: false,
          message: 'Tarification non trouvée'
        });
      }

      const oldValues = pricing.toJSON();

      const {
        client_id,
        product_id,
        category_name,
        discount_percent,
        fixed_price,
        minimum_quantity,
        valid_from,
        valid_until,
        notes,
        is_active
      } = req.body;

      // Vérifier que le client existe
      const client = await Client.findByPk(client_id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier que le produit existe (si spécifié)
      if (product_id) {
        const product = await Product.findByPk(product_id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Produit non trouvé'
          });
        }
      }

      await pricing.update({
        client_id,
        product_id: product_id || null,
        category_name: category_name || null,
        discount_percent,
        fixed_price: fixed_price || null,
        minimum_quantity: minimum_quantity || 1,
        valid_from: valid_from || pricing.valid_from,
        valid_until: valid_until || null,
        notes: notes || null,
        is_active: is_active !== undefined ? is_active : pricing.is_active
      });

      // Audit log
      await AuditService.log({
        actor_user_id: req.user.id,
        action: 'UPDATE_PRICING',
        entity_type: 'PriceOverride',
        entity_id: pricing.id,
        old_values: oldValues,
        new_values: pricing.toJSON(),
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Récupérer la tarification mise à jour avec les relations
      const updatedPricing = await PriceOverride.findByPk(pricing.id, {
        include: [
          {
            model: Client,
            attributes: ['id', 'company_name', 'contact_name']
          },
          {
            model: Product,
            attributes: ['id', 'name', 'product_ref_sage']
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Tarification mise à jour avec succès',
        data: updatedPricing
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tarification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la tarification',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/pricing/:id
 * @desc Supprimer une tarification
 * @access Private (Admin)
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  validateId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ID invalide',
          errors: errors.array()
        });
      }

      const pricing = await PriceOverride.findByPk(req.params.id);
      if (!pricing) {
        return res.status(404).json({
          success: false,
          message: 'Tarification non trouvée'
        });
      }

      const oldValues = pricing.toJSON();

      await pricing.destroy();

      // Audit log
      await AuditService.log({
        actor_user_id: req.user.id,
        action: 'DELETE_PRICING',
        entity_type: 'PriceOverride',
        entity_id: req.params.id,
        old_values: oldValues,
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Tarification supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la tarification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la tarification',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/pricing/client/:client_id
 * @desc Récupérer les tarifications d'un client
 * @access Private
 */
router.get('/client/:client_id',
  authenticateToken,
  [
    param('client_id').isUUID().withMessage('ID client invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ID client invalide',
          errors: errors.array()
        });
      }

      const { client_id } = req.params;

      // Vérifier l'accès au client
      if (req.user.role === 'client' && req.user.client_id !== client_id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const pricing = await PriceOverride.findAll({
        where: {
          client_id,
          is_active: true,
          [Op.or]: [
            { valid_until: null },
            { valid_until: { [Op.gte]: new Date() } }
          ]
        },
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'product_ref_sage', 'base_price_ht']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des tarifications client:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tarifications client',
        error: error.message
      });
    }
  }
);

// Endpoint pour calculer le prix final d'un produit pour un client
router.post('/calculate',
  authenticateToken,
  [
    body('client_id').isUUID().withMessage('ID client invalide'),
    body('product_id').isUUID().withMessage('ID produit invalide'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantité invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { client_id, product_id, quantity } = req.body;

      // Vérifier que le client existe
      const client = await Client.findByPk(client_id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier que le produit existe
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Calculer le prix final
      const priceCalculation = await PriceCalculationService.calculateFinalPrice(
        product_id,
        client_id,
        quantity
      );

      // Enregistrer l'audit
      await AuditService.log({
        entity_type: 'pricing',
        entity_id: `${client_id}-${product_id}`,
        action: 'PRICE_CALCULATION',
        user_id: req.user.id,
        notes: `Calcul de prix pour client ${client_id}, produit ${product_id}, quantité ${quantity}, prix final ${priceCalculation.finalPrice}`
      });

      res.json({
        success: true,
        data: priceCalculation
      });

    } catch (error) {
      console.error('Erreur lors du calcul de prix:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul de prix',
        error: error.message
      });
    }
  }
);

module.exports = router;