const { Notification, User } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const websocketService = require('./websocketService');

class NotificationService {
  /**
   * Envoyer une notification
   * @param {Object} notificationData - Données de la notification
   * @param {string} notificationData.user_id - ID de l'utilisateur
   * @param {string} notificationData.type - Type de notification
   * @param {string} notificationData.channel - Canal (email, sms, whatsapp, push)
   * @param {string} notificationData.recipient - Destinataire
   * @param {string} [notificationData.subject] - Sujet
   * @param {string} notificationData.message - Message
   * @param {string} [notificationData.priority='normal'] - Priorité
   * @param {Date} [notificationData.scheduled_at] - Date de programmation
   * @param {Object} [notificationData.metadata] - Métadonnées
   */
  static async notify(notificationData) {
    try {
      // Pour l'instant, on stocke juste la notification en base
      // L'envoi réel sera implémenté plus tard
      const query = `
        INSERT INTO notifications (
          user_id, type, channel, recipient, subject, message,
          priority, scheduled_at, metadata, status, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, 'pending', CURRENT_TIMESTAMP
        )
      `;
      
      const values = [
        notificationData.user_id,
        notificationData.type,
        notificationData.channel,
        notificationData.recipient || 'system',
        notificationData.subject || null,
        notificationData.message,
        notificationData.priority || 'normal',
        notificationData.scheduled_at || null,
        notificationData.metadata ? JSON.stringify(notificationData.metadata) : null
      ];
      
      const result = await sequelize.query(query, {
        replacements: values,
        type: QueryTypes.INSERT
      });
      
      console.log(`📧 Notification créée: ${notificationData.type} pour ${notificationData.user_id}`);
      
      // Envoyer la notification en temps réel via WebSocket
      try {
        if (global.socketService) {
          const wsPayload = {
            id: result[0], // ID de la notification créée
            type: notificationData.type,
            message: notificationData.message,
            subject: notificationData.subject,
            priority: notificationData.priority || 'normal',
            metadata: notificationData.metadata,
            created_at: new Date().toISOString()
          };
          
          // Envoyer à l'utilisateur spécifique
          global.socketService.emitToUser(notificationData.user_id, 'notification', wsPayload);
          
          // Si c'est une notification système, envoyer aussi aux admins
          if (notificationData.type === 'system' || notificationData.type === 'alert') {
            global.socketService.emitToRole('admin', 'notification', wsPayload);
          }
        }
      } catch (wsError) {
        console.error('Erreur lors de l\'envoi WebSocket:', wsError);
      }
      
      // Simuler l'envoi immédiat pour les notifications push
      if (notificationData.channel === 'push') {
        await this.markAsSent(notificationData.user_id, notificationData.type);
      }
      
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
    }
  }
  
  /**
   * Marquer une notification comme envoyée
   * @param {string} userId - ID de l'utilisateur
   * @param {string} type - Type de notification
   */
  static async markAsSent(userId, type) {
    try {
      const query = `
        UPDATE notifications 
        SET status = 'sent', sent_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND type = ? AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      await sequelize.query(query, {
        replacements: [userId, type],
        type: QueryTypes.UPDATE
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de notification:', error);
    }
  }
  
  /**
   * Récupérer les notifications d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} [limit=50] - Limite de résultats
   * @param {string} [status] - Filtrer par statut
   */
  static async getUserNotifications(userId, limit = 50, status = null) {
    try {
      let query = `
        SELECT * FROM notifications 
        WHERE user_id = ?
      `;
      
      const replacements = [userId];
      
      if (status) {
        query += ' AND status = ?';
        replacements.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ?';
      replacements.push(limit);
      
      const [results] = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }
  
  /**
   * Récupérer les notifications en attente
   * @param {number} [limit=100] - Limite de résultats
   */
  static async getPendingNotifications(limit = 100) {
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE status = 'pending' 
        AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
        ORDER BY priority DESC, created_at ASC
        LIMIT ?
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [limit],
        type: QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications en attente:', error);
      return [];
    }
  }
  
  /**
   * Marquer une notification comme échouée
   * @param {string} notificationId - ID de la notification
   * @param {string} errorMessage - Message d'erreur
   */
  static async markAsFailed(notificationId, errorMessage) {
    try {
      const query = `
        UPDATE notifications 
        SET status = 'failed', failed_at = CURRENT_TIMESTAMP, error_message = ?
        WHERE id = ?
      `;
      
      await sequelize.query(query, {
        replacements: [errorMessage, notificationId],
        type: QueryTypes.UPDATE
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut d\'échec:', error);
    }
  }
  
  /**
   * Envoyer une notification de synchronisation
   * @param {string} userId - ID de l'utilisateur
   * @param {string} syncType - Type de synchronisation
   * @param {Object} stats - Statistiques de synchronisation
   */
  static async notifySync(userId, syncType, stats) {
    const message = `Synchronisation ${syncType} terminée: ${stats.created || 0} créés, ${stats.updated || 0} mis à jour, ${stats.errors || 0} erreurs`;
    
    await this.notify({
      user_id: userId,
      type: 'sync_completed',
      channel: 'push',
      message,
      priority: stats.errors > 0 ? 'high' : 'normal',
      metadata: { syncType, stats }
    });
  }
  
  /**
   * Envoyer une notification d'erreur de synchronisation
   * @param {string} userId - ID de l'utilisateur
   * @param {string} syncType - Type de synchronisation
   * @param {string} errorMessage - Message d'erreur
   */
  static async notifySyncError(userId, syncType, errorMessage) {
    await this.notify({
      user_id: userId,
      type: 'sync_failed',
      channel: 'push',
      message: `Échec de la synchronisation ${syncType}: ${errorMessage}`,
      priority: 'high',
      metadata: { syncType, error: errorMessage }
    });
  }

  /**
   * Créer une notification MongoDB
   * @param {Object} notificationData - Données de la notification
   */
  static async createNotification(notificationData) {
    try {
      const notification = await Notification.create({
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: {
          ...notificationData.data || {},
          category: notificationData.category || 'general',
          actionUrl: notificationData.actionUrl,
          actionLabel: notificationData.actionLabel
        },
        priority: notificationData.priority || 'medium',
        expires_at: notificationData.expiresAt
      });
      
      console.log(`📧 Notification créée: ${notificationData.type} pour ${notificationData.userId}`);
      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de notification:', error);
      throw error;
    }
  }

  /**
   * Notifier tous les administrateurs
   * @param {Object} notificationData - Données de la notification
   */
  static async notifyAdmins(notificationData) {
    try {
      const User = require('../models/User');
      const admins = await User.findAll({ 
        where: { role: 'admin' },
        attributes: ['id', 'email', 'first_name', 'last_name']
      });
      
      const notifications = [];
      for (const admin of admins) {
        const notification = await this.createNotification({
          ...notificationData,
          userId: admin.id
        });
        notifications.push(notification);
      }
      
      console.log(`📧 ${notifications.length} notifications envoyées aux administrateurs`);
      return notifications;
    } catch (error) {
      console.error('Erreur lors de la notification des administrateurs:', error);
      throw error;
    }
  }

  /**
   * Notifier un client spécifique
   * @param {string} clientId - ID du client
   * @param {Object} notificationData - Données de la notification
   */
  static async notifyClient(clientId, notificationData) {
    try {
      const User = require('../models/User');
      const client = await User.findByPk(clientId);
      
      if (!client) {
        throw new Error(`Client ${clientId} non trouvé`);
      }
      
      const notification = await this.createNotification({
        ...notificationData,
        userId: clientId
      });
      
      console.log(`📧 Notification envoyée au client ${clientId}`);
      return notification;
    } catch (error) {
      console.error('Erreur lors de la notification du client:', error);
      throw error;
    }
  }

  /**
   * Notifier tous les utilisateurs d'un rôle
   * @param {string} role - Rôle des utilisateurs
   * @param {Object} notificationData - Données de la notification
   */
  static async notifyByRole(role, notificationData) {
    try {
      const User = require('../models/User');
      const users = await User.findAll({ 
        where: { role },
        attributes: ['id', 'email', 'first_name', 'last_name']
      });
      
      const notifications = [];
      for (const user of users) {
        const notification = await this.createNotification({
          ...notificationData,
          userId: user.id
        });
        notifications.push(notification);
        
        // Envoyer en temps réel via WebSocket
        websocketService.sendToUser(user.id.toString(), notification);
      }
      
      console.log(`📧 ${notifications.length} notifications envoyées aux utilisateurs de rôle ${role}`);
      return notifications;
    } catch (error) {
      console.error(`Erreur lors de la notification du rôle ${role}:`, error);
      throw error;
    }
  }

  /**
   * Notification de nouvelle commande
   * @param {string} orderNumber - Numéro de commande
   * @param {string} clientName - Nom du client
   * @param {string} userId - ID de l'utilisateur
   */
  static async notifyNewOrder(orderNumber, clientName, userId) {
    const notification = {
      title: 'Nouvelle commande créée',
      message: `Commande ${orderNumber} créée pour ${clientName}`,
      type: 'success',
      category: 'order',
      priority: 'medium',
      userId,
      data: {
        orderNumber,
        clientName
      }
    };

    await this.createNotification(notification);
    
    // Envoyer en temps réel via WebSocket
    websocketService.sendToUser(userId, notification);
    
    // Notifier aussi les commerciaux et admins
    websocketService.sendToRole('commercial', notification);
    websocketService.sendToRole('admin', notification);
  }

  /**
   * Notification de mise à jour de commande
   * @param {string} orderNumber - Numéro de commande
   * @param {string} status - Nouveau statut
   * @param {string} userId - ID de l'utilisateur
   */
  static async notifyOrderUpdate(orderNumber, status, userId) {
    const notification = {
      title: 'Commande mise à jour',
      message: `Commande ${orderNumber} - Statut: ${status}`,
      type: 'info',
      category: 'order',
      priority: 'medium',
      userId,
      data: {
        orderNumber,
        status
      }
    };

    await this.createNotification(notification);
    websocketService.sendToUser(userId, notification);
  }

  /**
   * Notification de nouveau client
   * @param {string} clientName - Nom du client
   * @param {string} userId - ID de l'utilisateur
   */
  static async notifyNewClient(clientName, userId) {
    const notification = {
      title: 'Nouveau client ajouté',
      message: `Client ${clientName} ajouté avec succès`,
      type: 'success',
      category: 'client',
      priority: 'medium',
      userId,
      data: {
        clientName
      }
    };

    await this.createNotification(notification);
    websocketService.sendToUser(userId, notification);
    
    // Notifier les admins
     websocketService.sendToRole('admin', notification);
   }

   /**
    * Notification de changement de statut de commande
    * @param {string} orderNumber - Numéro de commande
    * @param {string} oldStatus - Ancien statut
    * @param {string} newStatus - Nouveau statut
    * @param {string} userId - ID de l'utilisateur
    */
   static async notifyOrderStatusChange(orderNumber, oldStatus, newStatus, userId) {
     const notification = {
       title: 'Statut de commande modifié',
       message: `Commande ${orderNumber}: ${oldStatus} → ${newStatus}`,
       type: 'info',
       category: 'order',
       priority: 'high',
       userId,
       data: {
         orderNumber,
         oldStatus,
         newStatus
       }
     };

     await this.createNotification(notification);
     websocketService.sendToUser(userId, notification);
   }

   /**
    * Notification de stock faible
    * @param {string} productName - Nom du produit
    * @param {number} currentStock - Stock actuel
    * @param {number} minStock - Stock minimum
    */
   static async notifyLowStock(productName, currentStock, minStock) {
     const notification = {
       title: 'Stock faible',
       message: `${productName}: ${currentStock} unités restantes (min: ${minStock})`,
       type: 'warning',
       category: 'stock',
       priority: 'high',
       data: {
         productName,
         currentStock,
         minStock
       }
     };

     // Notifier tous les admins et commerciaux
     websocketService.sendToRole('admin', notification);
   }

   /**
    * Notification de changement de statut de commande
    * @param {string} orderId - ID de la commande
    * @param {string} oldStatus - Ancien statut
    * @param {string} newStatus - Nouveau statut
    * @param {string} userId - ID de l'utilisateur concerné
    * @param {Object} orderData - Données de la commande
    */
   static async notifyOrderStatusChange(orderId, oldStatus, newStatus, userId, orderData = {}) {
     try {
       const notificationData = {
         user_id: userId,
         type: 'order_status_change',
         channel: 'push',
         recipient: 'user',
         subject: `Commande ${orderId} - Statut mis à jour`,
         message: `Votre commande ${orderId} est passée de "${oldStatus}" à "${newStatus}".`,
         priority: 'normal',
         metadata: {
           orderId,
           oldStatus,
           newStatus,
           orderData
         }
       };

       // Créer la notification en base et envoyer via WebSocket
       await this.notify(notificationData);

       // Envoyer aussi une notification WebSocket directe pour les changements critiques
       if (global.socketService && ['confirmed', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
         const wsPayload = {
           orderId,
           oldStatus,
           newStatus,
           message: notificationData.message,
           timestamp: new Date().toISOString(),
           ...orderData
         };

         global.socketService.emitToUser(userId, 'orderStatus', wsPayload);
         
         // Notifier aussi les commerciaux et admins
         global.socketService.emitToRole('commercial', 'orderStatus', wsPayload);
         global.socketService.emitToRole('admin', 'orderStatus', wsPayload);
       }

       console.log(`📦 Notification de changement de statut envoyée: ${orderId} (${oldStatus} → ${newStatus})`);
     } catch (error) {
       console.error('Erreur lors de la notification de changement de statut:', error);
     }
   }

   /**
    * Méthode utilitaire pour envoyer une notification WebSocket directe
    * @param {string} userId - ID de l'utilisateur
    * @param {string} type - Type de notification
    * @param {Object} data - Données à envoyer
    */
   static async sendWebSocketNotification(userId, type, data) {
     try {
       if (global.socketService) {
         const payload = {
           ...data,
           timestamp: new Date().toISOString()
         };
         
         global.socketService.emitToUser(userId, type, payload);
         return true;
       }
       return false;
     } catch (error) {
       console.error('Erreur lors de l\'envoi WebSocket direct:', error);
       return false;
     }
   }

   /**
    * Méthode utilitaire pour envoyer une notification WebSocket à un rôle
    * @param {string} role - Rôle des utilisateurs
    * @param {string} type - Type de notification
    * @param {Object} data - Données à envoyer
    */
   static async sendWebSocketNotificationToRole(role, type, data) {
     try {
       if (global.socketService) {
         const payload = {
           ...data,
           timestamp: new Date().toISOString()
         };
         
         global.socketService.emitToRole(role, type, payload);
         return true;
       }
       return false;
     } catch (error) {
       console.error('Erreur lors de l\'envoi WebSocket au rôle:', error);
       return false;
     }
   }

   /**
    * Notification de génération de document
    * @param {string} documentType - Type de document (PDF, Excel, etc.)
    * @param {string} documentName - Nom du document
    * @param {string} userId - ID de l'utilisateur
    */
   static async notifyDocumentGenerated(documentType, documentName, userId) {
     const notification = {
       title: 'Document généré',
       message: `${documentType} généré: ${documentName}`,
       type: 'success',
       category: 'document',
       priority: 'low',
       userId,
       data: {
         documentType,
         documentName
       }
     };

     await this.createNotification(notification);
     websocketService.sendToUser(userId, notification);
   }

  /**
   * Notifier les admins d'une demande de réinitialisation de mot de passe
   */
  static async notifyPasswordResetRequest(user, reason = '') {
    try {
      const notificationData = {
        type: 'password_reset_request',
        title: 'Demande de réinitialisation de mot de passe',
        message: `${user.first_name} ${user.last_name} (${user.email}) a demandé une réinitialisation de mot de passe.${reason ? ` Raison: ${reason}` : ''}`,
        priority: 'high',
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: `${user.first_name} ${user.last_name}`,
          reason: reason || null,
          requestedAt: new Date().toISOString()
        },
        related_entity_type: 'user',
        related_entity_id: user.id
      };

      // Notifier tous les admins (Directeur)
      await this.notifyByRole('Directeur', notificationData);

      // Envoyer notification WebSocket aux admins connectés
      await this.sendWebSocketNotificationToRole('Directeur', 'password_reset_request', {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.first_name} ${user.last_name}`,
        reason: reason || null
      });

    } catch (error) {
      console.error('Erreur lors de la notification de demande de réinitialisation:', error);
    }
  }

  /**
   * Notifier lors du blocage/déblocage d'un utilisateur
   */
  static async notifyUserStatusChange(user, action, adminUser) {
    try {
      const isBlocked = action === 'blocked';
      const notificationData = {
        type: isBlocked ? 'user_blocked' : 'user_unblocked',
        title: `Utilisateur ${isBlocked ? 'bloqué' : 'débloqué'}`,
        message: `L'utilisateur ${user.first_name} ${user.last_name} (${user.email}) a été ${isBlocked ? 'bloqué' : 'débloqué'} par ${adminUser.first_name} ${adminUser.last_name}`,
        priority: 'high',
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: `${user.first_name} ${user.last_name}`,
          action: action,
          adminId: adminUser.id,
          adminName: `${adminUser.first_name} ${adminUser.last_name}`,
          timestamp: new Date().toISOString()
        },
        related_entity_type: 'user',
        related_entity_id: user.id
      };

      // Notifier tous les admins
      await this.notifyByRole('Directeur', notificationData);

      // Envoyer notification WebSocket
      await this.sendWebSocketNotificationToRole('Directeur', isBlocked ? 'user_blocked' : 'user_unblocked', {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.first_name} ${user.last_name}`,
        action: action,
        adminName: `${adminUser.first_name} ${adminUser.last_name}`
      });

    } catch (error) {
      console.error('Erreur lors de la notification de changement de statut utilisateur:', error);
    }
  }

  /**
   * Notifier lors de l'activation/désactivation d'un utilisateur
   */
  static async notifyUserActivationChange(user, action, adminUser) {
    try {
      const isActivated = action === 'activated';
      const notificationData = {
        type: isActivated ? 'user_activated' : 'user_deactivated',
        title: `Utilisateur ${isActivated ? 'activé' : 'désactivé'}`,
        message: `L'utilisateur ${user.first_name} ${user.last_name} (${user.email}) a été ${isActivated ? 'activé' : 'désactivé'} par ${adminUser.first_name} ${adminUser.last_name}`,
        priority: 'medium',
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: `${user.first_name} ${user.last_name}`,
          action: action,
          adminId: adminUser.id,
          adminName: `${adminUser.first_name} ${adminUser.last_name}`,
          timestamp: new Date().toISOString()
        },
        related_entity_type: 'user',
        related_entity_id: user.id
      };

      // Notifier tous les admins
      await this.notifyByRole('Directeur', notificationData);

      // Envoyer notification WebSocket
      await this.sendWebSocketNotificationToRole('Directeur', isActivated ? 'user_activated' : 'user_deactivated', {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.first_name} ${user.last_name}`,
        action: action,
        adminName: `${adminUser.first_name} ${adminUser.last_name}`
      });

    } catch (error) {
      console.error('Erreur lors de la notification de changement d\'activation utilisateur:', error);
    }
  }
 }

module.exports = { NotificationService };