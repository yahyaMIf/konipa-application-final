const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/clientController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateClient = [
  body('name')
    .notEmpty()
    .withMessage('Le nom du client est requis')
    .isLength({ min: 2, max: 255 })
    .withMessage('Le nom doit contenir entre 2 et 255 caractères'),
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('L\'adresse ne peut pas dépasser 500 caractères'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La ville ne peut pas dépasser 100 caractères'),
  body('postal_code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Le code postal ne peut pas dépasser 20 caractères'),
  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le pays ne peut pas dépasser 100 caractères'),
  body('client_code_sage')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le code client Sage ne peut pas dépasser 50 caractères'),
  body('payment_terms')
    .optional()
    .isIn(['immediate', '30_days', '45_days', '60_days', '90_days'])
    .withMessage('Conditions de paiement invalides'),
  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La limite de crédit doit être un nombre positif'),
  body('discount_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux de remise doit être entre 0 et 100'),
  body('client_type')
    .optional()
    .isIn(['individual', 'company', 'reseller', 'distributor'])
    .withMessage('Type de client invalide'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Statut invalide')
];

const validateClientUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Le nom doit contenir entre 2 et 255 caractères'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('L\'adresse ne peut pas dépasser 500 caractères'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La ville ne peut pas dépasser 100 caractères'),
  body('postal_code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Le code postal ne peut pas dépasser 20 caractères'),
  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le pays ne peut pas dépasser 100 caractères'),
  body('client_code_sage')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le code client Sage ne peut pas dépasser 50 caractères'),
  body('payment_terms')
    .optional()
    .isIn(['immediate', '30_days', '45_days', '60_days', '90_days'])
    .withMessage('Conditions de paiement invalides'),
  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La limite de crédit doit être un nombre positif'),
  body('discount_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux de remise doit être entre 0 et 100'),
  body('client_type')
    .optional()
    .isIn(['individual', 'company', 'reseller', 'distributor'])
    .withMessage('Type de client invalide'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Statut invalide')
];

const validateId = [
  param('id')
    .isUUID()
    .withMessage('ID invalide')
];

// Routes principales

/**
 * @route GET /api/clients
 * @desc Récupérer tous les clients avec filtres et pagination
 * @access Private
 */
router.get('/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
    query('client_type').optional().isIn(['individual', 'company', 'reseller', 'distributor']).withMessage('Type de client invalide'),
    query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Statut invalide'),
    query('sort_by').optional().isIn(['name', 'email', 'created_at', 'updated_at']).withMessage('Tri invalide'),
    query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('Ordre de tri invalide')
  ],
  ClientController.getClients
);

/**
 * @route GET /api/clients/:id
 * @desc Récupérer un client par ID
 * @access Private
 */
router.get('/:id',
  authenticateToken,
  validateId,
  ClientController.getClientById
);

/**
 * @route GET /api/clients/stats/summary
 * @desc Obtenir les statistiques globales des clients
 * @access Private (Admin/Manager)
 */
router.get('/stats/summary',
  authenticateToken,
  requireRole(['admin', 'manager']),
  ClientController.getClientsStats
);

/**
 * @route GET /api/clients/:id/stats
 * @desc Récupérer les statistiques d'un client
 * @access Private
 */
router.get('/:id/stats',
  authenticateToken,
  [
    ...validateId,
    query('start_date').optional().isISO8601().withMessage('Date de début invalide'),
    query('end_date').optional().isISO8601().withMessage('Date de fin invalide')
  ],
  ClientController.getClientStats
);

// Routes d'administration

/**
 * @route POST /api/clients
 * @desc Créer un nouveau client
 * @access Private (Admin/Manager/Sales)
 */
router.post('/',
  authenticateToken,
  requireRole(['admin', 'manager', 'sales']),
  validateClient,
  ClientController.createClient
);

/**
 * @route PUT /api/clients/:id
 * @desc Mettre à jour un client
 * @access Private (Admin/Manager/Sales)
 */
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'manager', 'sales']),
  [...validateId, ...validateClientUpdate],
  ClientController.updateClient
);

/**
 * @route DELETE /api/clients/:id
 * @desc Supprimer un client
 * @access Private (Admin/Manager)
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateId,
  ClientController.deleteClient
);

/**
 * @route POST /api/clients/:id/sync-sage
 * @desc Synchroniser un client avec Sage
 * @access Private (Admin/Manager)
 */
router.post('/:id/sync-sage',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateId,
  ClientController.syncClientToSage
);

// Routes pour la gestion des relations client-commercial

/**
 * @route POST /api/clients/:id/assign-sales
 * @desc Assigner un commercial à un client
 * @access Private (Admin/Manager)
 */
router.post('/:id/assign-sales',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    ...validateId,
    body('sales_user_id').isUUID().withMessage('ID du commercial requis')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sales_user_id } = req.body;

      const { Client, User, UserClient } = require('../models');
      const { AuditService } = require('../services/AuditService');

      // Vérifier que le client existe
      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier que l'utilisateur est un commercial
      const salesUser = await User.findByPk(sales_user_id);
      if (!salesUser || salesUser.role !== 'sales') {
        return res.status(400).json({
          success: false,
          message: 'Utilisateur commercial non trouvé'
        });
      }

      // Vérifier si la relation existe déjà
      const existingRelation = await UserClient.findOne({
        where: {
          user_id: sales_user_id,
          client_id: id
        }
      });

      if (existingRelation) {
        return res.status(400).json({
          success: false,
          message: 'Ce commercial est déjà assigné à ce client'
        });
      }

      // Créer la relation
      await UserClient.create({
        user_id: sales_user_id,
        client_id: id,
        assigned_by: req.user.id,
        assigned_at: new Date()
      });

      // Log d'audit
      await AuditService.log({
        entity_type: 'client',
        entity_id: id,
        action: 'ASSIGN_SALES',
        user_id: req.user.id,
        user_email: req.user.email,
        new_values: { sales_user_id, assigned_by: req.user.id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Commercial assigné au client avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'assignation du commercial:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'assignation du commercial',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/clients/:id/unassign-sales/:sales_id
 * @desc Désassigner un commercial d'un client
 * @access Private (Admin/Manager)
 */
router.delete('/:id/unassign-sales/:sales_id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    param('id').isUUID().withMessage('ID client invalide'),
    param('sales_id').isUUID().withMessage('ID commercial invalide')
  ],
  async (req, res) => {
    try {
      const { id, sales_id } = req.params;

      const { UserClient } = require('../models');
      const { AuditService } = require('../services/AuditService');

      const relation = await UserClient.findOne({
        where: {
          user_id: sales_id,
          client_id: id
        }
      });

      if (!relation) {
        return res.status(404).json({
          success: false,
          message: 'Relation commercial-client non trouvée'
        });
      }

      await relation.destroy();

      // Log d'audit
      await AuditService.log({
        entity_type: 'client',
        entity_id: id,
        action: 'UNASSIGN_SALES',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: { sales_user_id: sales_id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Commercial désassigné du client avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la désassignation du commercial:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la désassignation du commercial',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/clients/:id/sales
 * @desc Récupérer les commerciaux assignés à un client
 * @access Private
 */
router.get('/:id/sales',
  authenticateToken,
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { Client, User, UserClient } = require('../models');

      // Vérifier que le client existe
      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier les permissions pour les commerciaux
      if (req.user.role === 'sales') {
        const hasAccess = await UserClient.findOne({
          where: {
            user_id: req.user.id,
            client_id: id
          }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce client'
          });
        }
      }

      const salesUsers = await UserClient.findAll({
        where: { client_id: id },
        include: [
          {
            model: User,
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'territory']
          }
        ],
        attributes: ['assigned_at', 'assigned_by']
      });

      res.json({
        success: true,
        data: salesUsers
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des commerciaux:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commerciaux',
        error: error.message
      });
    }
  }
);

// Routes pour la gestion des remises client

/**
 * @route GET /api/clients/:id/discounts
 * @desc Récupérer les remises d'un client
 * @access Private
 */
router.get('/:id/discounts',
  authenticateToken,
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { Client, PriceOverride, Product } = require('../models');

      // Vérifier que le client existe
      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier les permissions pour les commerciaux
      if (req.user.role === 'sales') {
        const { UserClient } = require('../models');
        const hasAccess = await UserClient.findOne({
          where: {
            user_id: req.user.id,
            client_id: id
          }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce client'
          });
        }
      }

      const discounts = await PriceOverride.findAll({
        where: {
          client_id: id,
          is_active: true
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
        data: discounts
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

// Route pour synchroniser les données financières d'un client depuis Sage
router.post('/:id/sync-financial',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    param('id')
      .isUUID()
      .withMessage('ID client invalide')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { Client } = require('../models');
      const SageIntegrationService = require('../services/sageIntegrationService');

      // Vérifier que le client existe
      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier que le client a un code Sage
      if (!client.client_code_sage) {
        return res.status(400).json({
          success: false,
          message: 'Le client n\'a pas de code Sage associé'
        });
      }

      const sageService = new SageIntegrationService();

      // Récupérer les données financières depuis Sage
      const financialData = await sageService.getClientFinancialData(client.client_code_sage);

      // Mettre à jour le client avec les nouvelles données financières
      await client.update({
        credit_limit: financialData.creditLimit,
        outstanding_amount: financialData.outstandingAmount,
        is_blocked: financialData.isBlocked,
        sage_last_sync: new Date()
      });

      res.json({
        success: true,
        message: 'Données financières synchronisées avec succès',
        data: {
          clientId: client.id,
          clientName: client.name,
          creditLimit: financialData.creditLimit,
          outstandingAmount: financialData.outstandingAmount,
          availableCredit: financialData.availableCredit,
          isBlocked: financialData.isBlocked,
          lastSyncDate: new Date()
        }
      });

    } catch (error) {
      console.error('Erreur lors de la synchronisation financière:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la synchronisation des données financières',
        error: error.message
      });
    }
  }
);

// Route pour synchroniser les données financières de tous les clients
router.post('/sync-all-financial',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { Client } = require('../models');
      const SageIntegrationService = require('../services/sageIntegrationService');

      const sageService = new SageIntegrationService();

      // Récupérer tous les clients avec un code Sage
      const clients = await Client.findAll({
        where: {
          client_code_sage: {
            [require('sequelize').Op.ne]: null
          }
        }
      });

      const syncResults = [];
      let successCount = 0;
      let errorCount = 0;

      for (const client of clients) {
        try {
          // Récupérer les données financières depuis Sage
          const financialData = await sageService.getClientFinancialData(client.client_code_sage);

          // Mettre à jour le client
          await client.update({
            credit_limit: financialData.creditLimit,
            outstanding_amount: financialData.outstandingAmount,
            is_blocked: financialData.isBlocked,
            sage_last_sync: new Date()
          });

          syncResults.push({
            clientId: client.id,
            clientName: client.name,
            status: 'success',
            creditLimit: financialData.creditLimit,
            outstandingAmount: financialData.outstandingAmount,
            isBlocked: financialData.isBlocked
          });

          successCount++;

        } catch (clientError) {
          console.error(`Erreur pour le client ${client.id}:`, clientError);
          syncResults.push({
            clientId: client.id,
            clientName: client.name,
            status: 'error',
            error: clientError.message
          });
          errorCount++;
        }

        // Petit délai pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      res.json({
        success: true,
        message: `Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs`,
        data: {
          totalClients: clients.length,
          successCount,
          errorCount,
          results: syncResults
        }
      });

    } catch (error) {
      console.error('Erreur lors de la synchronisation globale:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la synchronisation globale des données financières',
        error: error.message
      });
    }
  }
);

module.exports = router;