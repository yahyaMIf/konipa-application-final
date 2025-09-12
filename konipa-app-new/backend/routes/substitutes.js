const express = require('express');
const router = express.Router();
const { Substitute, Product, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Op, sequelize } = require('sequelize');

// Middleware de validation pour les substituts
const substituteValidation = {
  create: [
    body('originalProductId').isInt().withMessage('ID du produit original requis'),
    body('substituteProductId').isInt().withMessage('ID du produit substitut requis'),
    body('reason').notEmpty().withMessage('Raison du substitut requise'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Priorité invalide'),
    body('compatibility').optional().isDecimal({ min: 0, max: 100 })
      .withMessage('Compatibilité doit être entre 0 et 100'),
    body('priceRatio').optional().isDecimal({ min: 0 })
      .withMessage('Ratio de prix invalide'),
    body('status').optional().isIn(['pending', 'approved', 'rejected', 'inactive'])
      .withMessage('Statut invalide'),
    body('validFrom').optional().isISO8601().withMessage('Date de début invalide'),
    body('validTo').optional().isISO8601().withMessage('Date de fin invalide')
  ],
  update: [
    body('originalProductId').optional().isInt().withMessage('ID du produit original invalide'),
    body('substituteProductId').optional().isInt().withMessage('ID du produit substitut invalide'),
    body('reason').optional().notEmpty().withMessage('Raison ne peut pas être vide'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Priorité invalide'),
    body('compatibility').optional().isDecimal({ min: 0, max: 100 })
      .withMessage('Compatibilité doit être entre 0 et 100'),
    body('priceRatio').optional().isDecimal({ min: 0 })
      .withMessage('Ratio de prix invalide'),
    body('status').optional().isIn(['pending', 'approved', 'rejected', 'inactive'])
      .withMessage('Statut invalide'),
    body('validFrom').optional().isISO8601().withMessage('Date de début invalide'),
    body('validTo').optional().isISO8601().withMessage('Date de fin invalide')
  ]
};

// GET /api/substitutes - Récupérer tous les substituts
router.get('/', 
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo']),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        originalProductId,
        substituteProductId,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtres
      if (originalProductId) where.originalProductId = originalProductId;
      if (substituteProductId) where.substituteProductId = substituteProductId;
      if (status) where.status = status;
      if (priority) where.priority = priority;

      // Recherche textuelle
      if (search) {
        where[Op.or] = [
          { reason: { [Op.like]: `%${search}%` } },
          { notes: { [Op.like]: `%${search}%` } },
          { technicalNotes: { [Op.like]: `%${search}%` } }
        ];
      }

      const substitutes = await Substitute.findAndCountAll({
        where,
        include: [
          {
            model: Product,
            as: 'originalProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category']
          },
          {
            model: Product,
            as: 'substituteProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        substitutes: substitutes.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: substitutes.count,
          pages: Math.ceil(substitutes.count / limit)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des substituts:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/substitutes/product/:productId - Récupérer les substituts d'un produit
router.get('/product/:productId',
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo', 'client']),
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { includeInactive = false } = req.query;

      const where = {
        originalProductId: productId
      };

      // Exclure les substituts inactifs sauf si demandé
      if (!includeInactive) {
        where.status = { [Op.ne]: 'inactive' };
      }

      const substitutes = await Substitute.findAll({
        where,
        include: [
          {
            model: Product,
            as: 'originalProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category']
          },
          {
            model: Product,
            as: 'substituteProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category', 'stock']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['priority', 'DESC'], ['compatibility', 'DESC']]
      });

      res.json(substitutes);
    } catch (error) {
      console.error('Erreur lors de la récupération des substituts du produit:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/substitutes/:id - Récupérer un substitut spécifique
router.get('/:id',
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const substitute = await Substitute.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'originalProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category', 'description']
          },
          {
            model: Product,
            as: 'substituteProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category', 'description', 'stock']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'updater',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      if (!substitute) {
        return res.status(404).json({ error: 'Substitut non trouvé' });
      }

      res.json(substitute);
    } catch (error) {
      console.error('Erreur lors de la récupération du substitut:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// POST /api/substitutes - Créer un nouveau substitut
router.post('/',
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo']),
  substituteValidation.create,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { originalProductId, substituteProductId } = req.body;

      // Vérifier que les produits existent
      const originalProduct = await Product.findByPk(originalProductId);
      const substituteProduct = await Product.findByPk(substituteProductId);

      if (!originalProduct) {
        return res.status(404).json({ error: 'Produit original non trouvé' });
      }

      if (!substituteProduct) {
        return res.status(404).json({ error: 'Produit substitut non trouvé' });
      }

      // Vérifier qu'un substitut n'existe pas déjà
      const existingSubstitute = await Substitute.findOne({
        where: {
          originalProductId,
          substituteProductId,
          status: { [Op.ne]: 'inactive' }
        }
      });

      if (existingSubstitute) {
        return res.status(409).json({ error: 'Ce substitut existe déjà' });
      }

      const substituteData = {
        ...req.body,
        createdBy: req.user.id
      };

      // Calculer le ratio de prix automatiquement si non fourni
      if (!substituteData.priceRatio && originalProduct.price && substituteProduct.price) {
        substituteData.priceRatio = (substituteProduct.price / originalProduct.price).toFixed(2);
      }

      const substitute = await Substitute.create(substituteData);

      // Récupérer le substitut créé avec les associations
      const createdSubstitute = await Substitute.findByPk(substitute.id, {
        include: [
          {
            model: Product,
            as: 'originalProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category']
          },
          {
            model: Product,
            as: 'substituteProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.status(201).json(createdSubstitute);
    } catch (error) {
      console.error('Erreur lors de la création du substitut:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// PUT /api/substitutes/:id - Mettre à jour un substitut
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo']),
  substituteValidation.update,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const substitute = await Substitute.findByPk(id);

      if (!substitute) {
        return res.status(404).json({ error: 'Substitut non trouvé' });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      await substitute.update(updateData, { userId: req.user.id });

      // Récupérer le substitut mis à jour avec les associations
      const updatedSubstitute = await Substitute.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'originalProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category']
          },
          {
            model: Product,
            as: 'substituteProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'updater',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.json(updatedSubstitute);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du substitut:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /api/substitutes/:id - Supprimer un substitut
router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const substitute = await Substitute.findByPk(id);

      if (!substitute) {
        return res.status(404).json({ error: 'Substitut non trouvé' });
      }

      await substitute.destroy();

      res.json({ message: 'Substitut supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du substitut:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// POST /api/substitutes/:id/approve - Approuver un substitut
router.post('/:id/approve',
  authenticateToken,
  requireRole(['admin', 'ceo']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status = 'approved' } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Statut d\'approbation invalide' });
      }

      const substitute = await Substitute.findByPk(id);

      if (!substitute) {
        return res.status(404).json({ error: 'Substitut non trouvé' });
      }

      await substitute.update({
        status,
        approvedBy: req.user.id,
        approvedAt: new Date()
      });

      const approvedSubstitute = await Substitute.findByPk(id, {
        include: [
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.json(approvedSubstitute);
    } catch (error) {
      console.error('Erreur lors de l\'approbation du substitut:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/substitutes/stats - Statistiques des substituts
router.get('/stats',
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo']),
  async (req, res) => {
    try {
      const stats = await Substitute.findAll({
        attributes: [
          'status',
          'priority',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status', 'priority']
      });

      const totalSubstitutes = await Substitute.count();
      const activeSubstitutes = await Substitute.count({
        where: {
          status: { [Op.ne]: 'inactive' }
        }
      });

      const recentSubstitutes = await Substitute.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
        }
      });

      res.json({
        total: totalSubstitutes,
        active: activeSubstitutes,
        recent: recentSubstitutes,
        breakdown: stats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/substitutes/recommendations/:productId - Recommandations de substituts
router.get('/recommendations/:productId',
  authenticateToken,
  requireRole(['admin', 'commercial', 'ceo', 'client']),
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;

      // Récupérer le produit original
      const originalProduct = await Product.findByPk(productId);
      if (!originalProduct) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      // Récupérer les substituts approuvés et actifs
      const substitutes = await Substitute.findAll({
        where: {
          originalProductId: productId,
          status: 'approved',
          [Op.or]: [
            { validTo: null },
            { validTo: { [Op.gte]: new Date() } }
          ]
        },
        include: [
          {
            model: Product,
            as: 'substituteProduct',
            attributes: ['id', 'name', 'reference', 'price', 'category', 'stock', 'imageUrl'],
            where: {
              stock: { [Op.gt]: 0 } // Seulement les produits en stock
            }
          }
        ],
        order: [
          ['priority', 'DESC'],
          ['compatibility', 'DESC'],
          ['priceRatio', 'ASC']
        ],
        limit: parseInt(limit)
      });

      res.json(substitutes);
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

module.exports = router;