const { Client, Order, User, Document, PriceOverride } = require('../models');
const { Op } = require('sequelize');
const { AuditService } = require('../services/AuditService');
const { NotificationService } = require('../services/NotificationService');
const { validationResult } = require('express-validator');
const ActivityLogger = require('../services/activityLogger');

class ClientController {
  /**
   * Récupérer tous les clients avec filtres et pagination
   */
  static async getClients(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        territory,
        sort_by = 'company_name',
        sort_order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Filtres de recherche
      if (search) {
        whereConditions[Op.or] = [
          { company_name: { [Op.iLike]: `%${search}%` } },
          { client_code_sage: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status === 'blocked') {
        whereConditions.is_blocked = true;
      } else if (status === 'active') {
        whereConditions.is_blocked = false;
      }

      // Vérifier les permissions
      if (req.user.role === 'sales') {
        // Les commerciaux ne voient que leurs clients
        const userClients = await req.user.getAssignedClients();
        const clientIds = userClients.map(client => client.id);
        whereConditions.id = { [Op.in]: clientIds };
      }

      // Utiliser findAll et count séparément pour éviter le problème d'alias
      const rows = await Client.findAll({
        where: whereConditions,
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      const count = await Client.count({
        where: whereConditions
      });

      res.json({
        success: true,
        data: {
          clients: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des clients',
        error: error.message
      });
    }
  }

  /**
   * Récupérer un client par ID
   */
  static async getClientById(req, res) {
    try {
      const { id } = req.params;

      const client = await Client.findByPk(id, {
        include: [
          {
            model: Order,
            as: 'orders',
            include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
            order: [['order_date', 'DESC']],
            limit: 10
          }
        ]
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'sales') {
        const hasAccess = await req.user.hasAccessToClient(client.id);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce client'
          });
        }
      }

      res.json({
        success: true,
        data: client
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du client',
        error: error.message
      });
    }
  }

  /**
   * Créer un nouveau client
   */
  static async createClient(req, res) {
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
          message: 'Permissions insuffisantes pour créer un client'
        });
      }

      const clientData = req.body;

      // Vérifier l'unicité du code client Sage
      if (clientData.client_code_sage) {
        const existingClient = await Client.findOne({
          where: { client_code_sage: clientData.client_code_sage }
        });
        if (existingClient) {
          return res.status(400).json({
            success: false,
            message: 'Un client avec ce code Sage existe déjà'
          });
        }
      }

      // Mapper les données pour correspondre au modèle
      const mappedData = {
        ...clientData,
        company_name: clientData.name || clientData.company_name,
        created_by: req.user.id
      };
      
      // Supprimer le champ 'name' s'il existe car le modèle utilise 'company_name'
      delete mappedData.name;
      
      // Convertir payment_terms de chaîne vers entier
      if (mappedData.payment_terms) {
        const paymentTermsMap = {
          'immediate': 0,
          '30_days': 30,
          '45_days': 45,
          '60_days': 60,
          '90_days': 90
        };
        mappedData.payment_terms = paymentTermsMap[mappedData.payment_terms] || 30;
      }
      
      // Créer le client
      const client = await Client.create(mappedData);

      // Log d'audit (seulement si req.user existe)
      if (req.user) {
        await AuditService.log({
          entity_type: 'client',
          entity_id: client.id,
          action: 'CREATE',
          user_id: req.user.id,
          user_email: req.user.email,
          new_values: client.toJSON(),
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      }

      // Enregistrer l'activité de création de client
      try {
        await ActivityLogger.logClientCreated(client, req.user, req.ip, req.get('User-Agent'));
      } catch (activityError) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      // Notification pour les managers (seulement si req.user existe)
      if (req.user) {
        const managers = await User.getUsersByRole('admin');
        for (const manager of managers) {
          await NotificationService.createNotification({
            userId: manager.id,
            type: 'system_alert',
            title: 'Nouveau client créé',
            message: `Le client ${client.company_name} a été créé par ${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.email,
            data: { client_id: client.id },
            priority: 'medium'
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Client créé avec succès',
        data: client
      });
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du client',
        error: error.message
      });
    }
  }

  /**
   * Mettre à jour un client
   */
  static async updateClient(req, res) {
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

      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'sales') {
        const hasAccess = await req.user.hasAccessToClient(client.id);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce client'
          });
        }
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = client.toJSON();

      // Vérifier l'unicité du code client Sage si modifié
      if (updateData.client_code_sage && updateData.client_code_sage !== client.client_code_sage) {
        const existingClient = await Client.findBySageCode(updateData.client_code_sage);
        if (existingClient && existingClient.id !== client.id) {
          return res.status(400).json({
            success: false,
            message: 'Un client avec ce code Sage existe déjà'
          });
        }
      }

      // Mettre à jour le client
      await client.update({
        ...updateData,
        updated_by: req.user.id
      });

      // Log d'audit
      await AuditService.log({
        entity_type: 'client',
        entity_id: client.id,
        action: 'UPDATE',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: oldValues,
        new_values: client.toJSON(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Enregistrer l'activité de modification de client
      try {
        await ActivityLogger.logClientUpdated(client, req.user, req.ip, req.get('User-Agent'));
      } catch (activityError) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      res.json({
        success: true,
        message: 'Client mis à jour avec succès',
        data: client
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du client',
        error: error.message
      });
    }
  }

  /**
   * Supprimer un client
   */
  static async deleteClient(req, res) {
    try {
      const { id } = req.params;

      // Vérifier les permissions
      if (!['admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour supprimer un client'
        });
      }

      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier s'il y a des commandes associées
      const orderCount = await Order.count({ where: { client_id: id } });
      if (orderCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer un client ayant des commandes associées'
        });
      }

      // Sauvegarder les données pour l'audit
      const clientData = client.toJSON();

      // Supprimer le client
      await client.destroy();

      // Log d'audit
      await AuditService.log({
        entity_type: 'client',
        entity_id: id,
        action: 'DELETE',
        user_id: req.user.id,
        user_email: req.user.email,
        old_values: clientData,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Enregistrer l'activité de suppression de client
      try {
        await ActivityLogger.logClientDeleted(clientData, req.user, req.ip, req.get('User-Agent'));
      } catch (activityError) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      res.json({
        success: true,
        message: 'Client supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du client',
        error: error.message
      });
    }
  }

  /**
   * Obtenir les statistiques d'un client
   */
  static async getClientStats(req, res) {
    try {
      const { id } = req.params;
      const { period = '12months' } = req.query;

      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'sales') {
        const hasAccess = await req.user.hasAccessToClient(client.id);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce client'
          });
        }
      }

      // Calculer la période
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '12months':
        default:
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Statistiques des commandes
      const orderStats = await Order.findAll({
        where: {
          client_id: id,
          order_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'total_orders'],
          [Order.sequelize.fn('SUM', Order.sequelize.col('total_amount')), 'total_amount'],
          [Order.sequelize.fn('AVG', Order.sequelize.col('total_amount')), 'average_order_value']
        ],
        raw: true
      });

      // Commandes par statut
      const ordersByStatus = await Order.findAll({
        where: {
          client_id: id,
          order_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'status',
          [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Évolution mensuelle
      const monthlyEvolution = await Order.findAll({
        where: {
          client_id: id,
          order_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [Order.sequelize.fn('DATE_TRUNC', 'month', Order.sequelize.col('order_date')), 'month'],
          [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'orders_count'],
          [Order.sequelize.fn('SUM', Order.sequelize.col('total_amount')), 'total_amount']
        ],
        group: [Order.sequelize.fn('DATE_TRUNC', 'month', Order.sequelize.col('order_date'))],
        order: [[Order.sequelize.fn('DATE_TRUNC', 'month', Order.sequelize.col('order_date')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          client_info: {
            id: client.id,
            company_name: client.company_name,
            status: client.status
          },
          period: {
            start_date: startDate,
            end_date: endDate,
            period_type: period
          },
          summary: orderStats[0] || {
            total_orders: 0,
            total_amount: 0,
            average_order_value: 0
          },
          orders_by_status: ordersByStatus,
          monthly_evolution: monthlyEvolution
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques client:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques client',
        error: error.message
      });
    }
  }

  /**
   * Récupérer les statistiques globales des clients
   */
  static async getClientsStats(req, res) {
    try {
      // Statistiques générales
      const totalClients = await Client.count();
      const activeClients = await Client.count({ where: { is_blocked: false } });
      const blockedClients = await Client.count({ where: { is_blocked: true } });

      // Statistiques par type de client
      const clientsByType = await Client.findAll({
        attributes: [
          'client_type',
          [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
        ],
        group: ['client_type'],
        raw: true
      });

      // Statistiques par territoire
      const clientsByTerritory = await Client.findAll({
        attributes: [
          'territory',
          [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
        ],
        group: ['territory'],
        raw: true
      });

      // Nouveaux clients ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const newClientsThisMonth = await Client.count({
        where: {
          createdAt: {
            [Op.gte]: startOfMonth
          }
        }
      });

      // Clients avec commandes récentes (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeOrderClients = await Client.count({
        include: [{
          model: Order,
          where: {
            order_date: {
              [Op.gte]: thirtyDaysAgo
            }
          },
          required: true
        }]
      });

      res.json({
        success: true,
        data: {
          total_clients: totalClients,
          active_clients: activeClients,
          blocked_clients: blockedClients,
          new_clients_this_month: newClientsThisMonth,
          active_order_clients: activeOrderClients,
          clients_by_type: clientsByType,
          clients_by_territory: clientsByTerritory
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques clients:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques clients',
        error: error.message
      });
    }
  }

  /**
   * Synchroniser un client avec Sage
   */
  static async syncClientToSage(req, res) {
    try {
      const { id } = req.params;

      // Vérifier les permissions
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour synchroniser avec Sage'
        });
      }

      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Simuler la synchronisation avec Sage
      const sageResponse = {
        sage_id: `SAGE_${Date.now()}`,
        sage_code: client.client_code_sage || `CLI_${client.id}`,
        sync_status: 'success',
        sync_date: new Date()
      };

      // Mettre à jour le client avec les informations Sage
      await client.update({
        sage_id: sageResponse.sage_id,
        sage_code: sageResponse.sage_code,
        sage_last_sync: sageResponse.sync_date,
        is_synced_to_sage: true
      });

      // Log d'audit
      await AuditService.log({
        entity_type: 'client',
        entity_id: client.id,
        action: 'SYNC_SAGE',
        user_id: req.user.id,
        user_email: req.user.email,
        new_values: { sage_sync: sageResponse },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Client synchronisé avec Sage avec succès',
        data: {
          client_id: client.id,
          sage_response: sageResponse
        }
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation Sage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la synchronisation avec Sage',
        error: error.message
      });
    }
  }
}

module.exports = ClientController;