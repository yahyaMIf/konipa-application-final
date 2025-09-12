const { Notification } = require('../models');
const { Op } = require('sequelize');
const { NotificationService } = require('../services/NotificationService');
const { syncLogger } = require('../utils/syncLogger');

// Obtenir les notifications d'un utilisateur
const getUserNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const userId = req.user.id;
    const { 
      limit = 20, 
      offset = 0, 
      unreadOnly = false, 
      category, 
      type,
      priority 
    } = req.query;

    const where = { user_id: userId };
    
    if (unreadOnly === 'true') {
      where.is_read = false;
    }
    
    if (type) {
      where.type = type;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Notification.count({ where });
    const unreadCount = await Notification.count({ where: { user_id: userId, is_read: false } });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des notifications' });
  }
};

// Marquer une notification comme lue
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    await notification.update({
      is_read: true,
      read_at: new Date()
    });

    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: notification
    });

  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({ error: 'Erreur serveur lors du marquage comme lu' });
  }
};

// Marquer toutes les notifications comme lues
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const [affectedCount] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );

    res.json({
      success: true,
      message: `${affectedCount} notifications marquées comme lues`,
      data: { modifiedCount: affectedCount }
    });

  } catch (error) {
    console.error('Erreur lors du marquage de toutes comme lues:', error);
    res.status(500).json({ error: 'Erreur serveur lors du marquage de toutes comme lues' });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const deletedCount = await Notification.destroy({
      where: {
        id: notificationId,
        user_id: userId
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
};

// Obtenir les statistiques des notifications
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const where = { user_id: userId };
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const totalNotifications = await Notification.count({ where: { user_id: userId } });
    const unreadNotifications = await Notification.count({ where: { user_id: userId, is_read: false } });
    
    // Statistiques par type
    const typeStats = await Notification.findAll({
      attributes: [
        'type',
        [Notification.sequelize.fn('COUNT', '*'), 'total'],
        [Notification.sequelize.fn('SUM', Notification.sequelize.literal('CASE WHEN is_read = 0 THEN 1 ELSE 0 END')), 'unread']
      ],
      where: { user_id: userId },
      group: ['type'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        byType: typeStats
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
};

// Créer une notification (pour les administrateurs)
const createNotification = async (req, res) => {
  try {
    const {
      userId,
      userRole,
      type,
      title,
      message,
      data = {},
      priority = 'medium',
      category = 'general',
      actionUrl,
      actionLabel,
      expiresAt
    } = req.body;

    let notification;

    if (userId) {
      // Notification pour un utilisateur spécifique
      notification = await NotificationService.createNotification({
        userId,
        type,
        title,
        message,
        data,
        priority,
        category,
        actionUrl,
        actionLabel,
        expiresAt
      });
    } else if (userRole) {
      // Notification pour tous les utilisateurs d'un rôle
      const notifications = await NotificationService.notifyByRole(userRole, {
        type,
        title,
        message,
        data,
        priority,
        category,
        actionUrl,
        actionLabel,
        expiresAt
      });
      
      return res.status(201).json({
        success: true,
        message: `Notifications envoyées à ${notifications.length} utilisateurs`,
        data: { count: notifications.length }
      });
    } else {
      return res.status(400).json({ error: 'userId ou userRole requis' });
    }

    res.status(201).json({
      success: true,
      message: 'Notification créée avec succès',
      data: notification
    });

  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la notification' });
  }
};

// Obtenir toutes les notifications (pour les administrateurs)
const getAllNotifications = async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      type, 
      priority, 
      category,
      startDate,
      endDate
    } = req.query;

    const where = {};
    
    if (type) where.type = type;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const notifications = await Notification.findAll({
      where,
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Notification.count({ where });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les notifications:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des notifications' });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
  createNotification,
  getAllNotifications
};