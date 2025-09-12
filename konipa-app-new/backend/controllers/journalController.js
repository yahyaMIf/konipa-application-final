const XLSX = require('xlsx');
const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

// Migration: Utiliser la base de données PostgreSQL au lieu du fichier JSON

/**
 * @desc Sauvegarder les activités du journal CEO
 * @route POST /api/journal/activities
 * @access Private
 */
const saveActivities = async (req, res) => {
  try {
    console.log('=== DEBUG saveActivities ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('req.body type:', typeof req.body);
    
    const { activities } = req.body;
    
    if (!Array.isArray(activities)) {
      console.log('Activities is not an array:', activities);
      return res.status(400).json({
        success: false,
        message: 'Les activités doivent être un tableau'
      });
    }

    // Sauvegarder chaque activité dans la base de données
    const savedActivities = [];
    
    for (const activity of activities) {
      try {
        // Vérifier si l'activité existe déjà
        const existingActivity = await AuditLog.findOne({
          where: {
            metadata: {
              activityId: activity.id
            }
          }
        });

        if (!existingActivity) {
          const auditLog = await AuditLog.create({
            userId: req.user?.id || null,
            action: activity.type || 'ACTIVITY',
            resource: 'journal_activity',
            resourceId: null,
            oldValues: null,
            newValues: {
              title: activity.title,
              description: activity.description,
              timestamp: activity.timestamp,
              type: activity.type,
              priority: activity.priority,
              status: activity.status
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: {
              activityId: activity.id,
              originalActivity: activity
            }
          });
          
          savedActivities.push(auditLog);
        }
      } catch (activityError) {
        console.error('Erreur lors de la sauvegarde d\'une activité:', activityError);
        // Continuer avec les autres activités
      }
    }

    res.json({
      success: true,
      message: 'Activités sauvegardées avec succès',
      count: savedActivities.length
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde des activités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde des activités'
    });
  }
};

/**
 * @desc Récupérer les activités du journal CEO
 * @route GET /api/journal/activities
 * @access Private
 */
const getActivities = async (req, res) => {
  try {
    // Récupérer les activités depuis la base de données
    const auditLogs = await AuditLog.findAll({
      where: {
        resource: 'journal_activity'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    // Transformer les audit logs en format d'activités
    const activities = auditLogs.map(log => {
      const originalActivity = log.metadata?.originalActivity;
      if (originalActivity) {
        return originalActivity;
      }
      
      // Fallback: créer une activité à partir des données de l'audit log
      return {
        id: log.metadata?.activityId || log.id,
        title: log.newValues?.title || log.action,
        description: log.newValues?.description || `Action: ${log.action}`,
        timestamp: log.newValues?.timestamp || log.createdAt,
        type: log.newValues?.type || log.action,
        priority: log.newValues?.priority || 'medium',
        status: log.newValues?.status || 'completed',
        user: log.user ? {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email
        } : null
      };
    });

    res.json({
      success: true,
      activities: activities
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités'
    });
  }
};

/**
 * @desc Ajouter une nouvelle activité
 * @route POST /api/journal/activity
 * @access Private
 */
const addActivity = async (req, res) => {
  try {
    const { title, description, type = 'info', priority = 'medium' } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Le titre et la description sont requis'
      });
    }

    const activityId = Date.now().toString();
    const timestamp = new Date().toISOString();

    // Créer l'activité dans la base de données
    const auditLog = await AuditLog.create({
      userId: req.user?.id || null,
      action: type.toUpperCase(),
      resource: 'journal_activity',
      resourceId: null,
      oldValues: null,
      newValues: {
        title,
        description,
        timestamp,
        type,
        priority,
        status: 'new'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        activityId,
        originalActivity: {
          id: activityId,
          title,
          description,
          type,
          priority,
          timestamp,
          status: 'new'
        }
      }
    });

    res.json({
      success: true,
      message: 'Activité ajoutée avec succès',
      activity: {
        id: activityId,
        title,
        description,
        type,
        priority,
        timestamp,
        status: 'new'
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'activité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'activité'
    });
  }
};

/**
 * @desc Fonction utilitaire pour enregistrer une activité (utilisée par d'autres contrôleurs)
 * @param {Object} activityData - Données de l'activité
 * @param {Object} user - Utilisateur qui effectue l'action
 * @param {string} ipAddress - Adresse IP
 * @param {string} userAgent - User Agent
 */
const logActivity = async (activityData, user = null, ipAddress = null, userAgent = null) => {
  try {
    const activityId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    
    const activity = {
      id: activityId,
      title: activityData.title,
      description: activityData.description,
      type: activityData.type || 'info',
      priority: activityData.priority || 'medium',
      timestamp,
      status: activityData.status || 'completed'
    };

    await AuditLog.create({
      userId: user?.id || null,
      action: (activityData.type || 'ACTIVITY').toUpperCase(),
      resource: 'journal_activity',
      resourceId: activityData.resourceId || null,
      oldValues: activityData.oldValues || null,
      newValues: {
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        type: activity.type,
        priority: activity.priority,
        status: activity.status
      },
      ipAddress,
      userAgent,
      metadata: {
        activityId,
        originalActivity: activity
      }
    });

    return activity;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
    throw error;
  }
};

/**
 * @desc Récupérer les statistiques du journal
 * @route GET /api/journal/statistics
 * @access Private
 */
const getJournalStats = async (req, res) => {
  try {
    const totalActivities = await AuditLog.count({
      where: { resource: 'journal_activity' }
    });

    const activitiesByType = await AuditLog.findAll({
      attributes: [
        'action',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']
      ],
      where: { resource: 'journal_activity' },
      group: ['action']
    });

    const activitiesByDate = await AuditLog.findAll({
      attributes: [
        [AuditLog.sequelize.fn('DATE_TRUNC', 'day', AuditLog.sequelize.col('createdAt')), 'date'],
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']
      ],
      where: { resource: 'journal_activity' },
      group: [AuditLog.sequelize.fn('DATE_TRUNC', 'day', AuditLog.sequelize.col('createdAt'))],
      order: [[AuditLog.sequelize.fn('DATE_TRUNC', 'day', AuditLog.sequelize.col('createdAt')), 'ASC']]
    });

    const recentActivities = await AuditLog.findAll({
      where: { resource: 'journal_activity' },
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    const stats = {
      totalActivities,
      byType: activitiesByType.reduce((acc, item) => {
        acc[item.action] = item.dataValues.count;
        return acc;
      }, {}),
      byDate: activitiesByDate.reduce((acc, item) => {
        acc[item.dataValues.date.toISOString().split('T')[0]] = item.dataValues.count;
        return acc;
      }, {}),
      recentActivities: recentActivities.map(log => {
        const originalActivity = log.metadata?.originalActivity;
        if (originalActivity) {
          return originalActivity;
        }
        return {
          id: log.metadata?.activityId || log.id,
          title: log.newValues?.title || log.action,
          description: log.newValues?.description || `Action: ${log.action}`,
          timestamp: log.newValues?.timestamp || log.createdAt,
          type: log.newValues?.type || log.action,
          priority: log.newValues?.priority || 'medium',
          status: log.newValues?.status || 'completed',
          user: log.user ? {
            id: log.user.id,
            name: `${log.user.firstName} ${log.user.lastName}`,
            email: log.user.email
          } : null
        };
      })
    };

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

/**
 * @desc Récupérer le résumé quotidien
 * @route GET /api/journal/daily-summary
 * @access Private
 */
const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyAuditLogs = await AuditLog.findAll({
      where: {
        resource: 'journal_activity',
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 20 // Limiter à 20 activités
    });

    // Transformer les audit logs en format d'activités
    const dailyActivities = dailyAuditLogs.map(log => {
      const originalActivity = log.metadata?.originalActivity;
      if (originalActivity) {
        return originalActivity;
      }
      return {
        id: log.metadata?.activityId || log.id,
        title: log.newValues?.title || log.action,
        description: log.newValues?.description || `Action: ${log.action}`,
        timestamp: log.newValues?.timestamp || log.createdAt,
        type: log.newValues?.type || log.action,
        priority: log.newValues?.priority || 'medium',
        status: log.newValues?.status || 'completed',
        user: log.user ? {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email
        } : null
      };
    });

    // Calculer le résumé
    const summary = {
      date: targetDate,
      totalActivities: dailyActivities.length,
      byType: {},
      activities: dailyActivities
    };

    // Grouper par type
    dailyActivities.forEach(activity => {
      summary.byType[activity.type] = (summary.byType[activity.type] || 0) + 1;
    });

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du résumé quotidien:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résumé quotidien'
    });
  }
};

/**
 * @desc Récupérer toutes les entrées du journal
 * @route GET /api/journal
 * @access Private
 */
const getAllJournalEntries = async (req, res) => {
  return getActivities(req, res);
};

/**
 * @desc Récupérer une entrée du journal par ID
 * @route GET /api/journal/:id
 * @access Private
 */
const getJournalEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await AuditLog.findOne({
      where: {
        resource: 'journal_activity',
        [Op.or]: [
          { id: id }, // Match by AuditLog ID
          { 'metadata.activityId': id } // Match by original activity ID if stored
        ]
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Activité non trouvée'
      });
    }

    // Transformer l'audit log en format d'activité
    const activity = auditLog.metadata?.originalActivity || {
      id: auditLog.metadata?.activityId || auditLog.id,
      title: auditLog.newValues?.title || auditLog.action,
      description: auditLog.newValues?.description || `Action: ${auditLog.action}`,
      timestamp: auditLog.newValues?.timestamp || auditLog.createdAt,
      type: auditLog.newValues?.type || auditLog.action,
      priority: auditLog.newValues?.priority || 'medium',
      status: auditLog.newValues?.status || 'completed',
      user: auditLog.user ? {
        id: auditLog.user.id,
        name: `${auditLog.user.firstName} ${auditLog.user.lastName}`,
        email: auditLog.user.email
      } : null
    };

    res.json({
      success: true,
      activity
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'activité'
    });
  }
};

/**
 * @desc Nettoyer les anciennes entrées
 * @route POST /api/journal/cleanup
 * @access Private (Admin)
 */
const cleanupOldEntries = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const removedCount = await AuditLog.destroy({
      where: {
        resource: 'journal_activity',
        createdAt: {
          [Op.lt]: cutoffDate
        }
      }
    });

    res.json({
      success: true,
      message: `Nettoyage terminé. ${removedCount} activités supprimées.`,
      removed: removedCount,
      remaining: await AuditLog.count({ where: { resource: 'journal_activity' } })
    });

  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage'
    });
  }
};

/**
 * @desc Exporter les entrées du journal
 * @route GET /api/journal/export
 * @access Private
 */
const exportJournalEntries = async (req, res) => {
  try {
    const auditLogs = await AuditLog.findAll({
      where: {
        resource: 'journal_activity'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const activities = auditLogs.map(log => {
      const originalActivity = log.metadata?.originalActivity;
      if (originalActivity) {
        return originalActivity;
      }
      return {
        id: log.metadata?.activityId || log.id,
        title: log.metadata?.title || log.action,
        description: log.metadata?.description || `Action: ${log.action}`,
        timestamp: log.metadata?.timestamp || log.createdAt,
        type: log.metadata?.type || log.action,
        priority: log.metadata?.priority || 'medium',
        status: log.metadata?.status || 'completed',
        user: log.user ? {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email
        } : null
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="journal_export.json"');
    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      totalActivities: activities.length,
      activities
    });

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export'
    });
  }
};

/**
 * Exporter les entrées du journal en Excel
 */
const exportJournalToExcel = async (req, res) => {
  try {
    // Filtrer par date si spécifié
    const { start_date, end_date } = req.query;
    const whereConditions = { resource: 'journal_activity' };

    if (start_date && end_date) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(start_date),
        [Op.lte]: new Date(end_date)
      };
    } else if (start_date) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(end_date)
      };
    }

    const auditLogs = await AuditLog.findAll({
      where: whereConditions,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const activities = auditLogs.map(log => {
      const originalActivity = log.metadata?.originalActivity;
      if (originalActivity) {
        return originalActivity;
      }
      return {
        id: log.metadata?.activityId || log.id,
        title: log.newValues?.title || log.action,
        description: log.newValues?.description || `Action: ${log.action}`,
        timestamp: log.newValues?.timestamp || log.createdAt,
        type: log.newValues?.type || log.action,
        priority: log.newValues?.priority || 'medium',
        status: log.newValues?.status || 'completed',
        user: log.user ? {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email
        } : null
      };
    });

    // Créer le workbook Excel
    const wb = XLSX.utils.book_new();
    
    // Préparer les données pour Excel
    const journalData = [
      ['Date', 'Heure', 'Type', 'Titre', 'Description', 'Priorité', 'Statut', 'Utilisateur']
    ];
    
    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      
      journalData.push([
        activityDate.toLocaleDateString('fr-FR'),
        activityDate.toLocaleTimeString('fr-FR'),
        activity.type || 'N/A',
        activity.title || 'N/A',
        activity.description || 'N/A',
        activity.priority || 'N/A',
        activity.status || 'N/A',
        activity.user ? `${activity.user.name} (${activity.user.email})` : 'N/A'
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(journalData);
    XLSX.utils.book_append_sheet(wb, ws, 'Journal CEO');
    
    // Générer le buffer Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Configuration des headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="journal_ceo_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel du journal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export Excel du journal'
    });
  }
};

/**
 * Exporter les entrées du journal en CSV
 */
const exportJournalToCSV = async (req, res) => {
  try {
    // Filtrer par date si spécifié
    const { start_date, end_date } = req.query;
    const whereConditions = { resource: 'journal_activity' };

    if (start_date && end_date) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(start_date),
        [Op.lte]: new Date(end_date)
      };
    } else if (start_date) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(end_date)
      };
    }

    const auditLogs = await AuditLog.findAll({
      where: whereConditions,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const activities = auditLogs.map(log => {
      const originalActivity = log.metadata?.originalActivity;
      if (originalActivity) {
        return originalActivity;
      }
      return {
        id: log.metadata?.activityId || log.id,
        title: log.newValues?.title || log.action,
        description: log.newValues?.description || `Action: ${log.action}`,
        timestamp: log.newValues?.timestamp || log.createdAt,
        type: log.newValues?.type || log.action,
        priority: log.newValues?.priority || 'medium',
        status: log.newValues?.status || 'completed',
        user: log.user ? {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email
        } : null
      };
    });

    // Export CSV
    const csvData = [
      'Date,Heure,Type,Titre,Description,Priorité,Statut,Utilisateur'
    ];
    
    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      
      const row = [
        activityDate.toLocaleDateString('fr-FR'),
        activityDate.toLocaleTimeString('fr-FR'),
        activity.type || 'N/A',
        `"${(activity.title || 'N/A').replace(/"/g, '""')}"`,
        `"${(activity.description || 'N/A').replace(/"/g, '""')}"`,
        activity.priority || 'N/A',
        activity.status || 'N/A',
        activity.user ? `"${activity.user.name}"` : 'N/A'
      ];
      
      csvData.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="journal-activities.csv"');
    res.send(csvData.join('\n'));

  } catch (error) {
    console.error('Erreur exportation CSV activités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'exportation CSV',
      error: error.message
    });
  }
};

module.exports = {
  saveActivities,
  getActivities,
  addActivity,
  logActivity,
  getAllJournalEntries,
  getJournalEntryById,
  getJournalStats,
  getDailySummary,
  cleanupOldEntries,
  exportJournalEntries,
  exportJournalToExcel,
  exportJournalToCSV
};