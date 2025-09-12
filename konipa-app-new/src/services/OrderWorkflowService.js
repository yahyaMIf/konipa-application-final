import { notificationService } from './NotificationService';
import authService from './authService';
import actionLogService from './ActionLogService';
import { adminJournalService } from './adminJournalService';
import realTimeService from './realTimeService';

/**
 * Service de gestion du workflow des commandes
 * Processus: Client → Comptabilité → Comptoir → Livraison
 */
class OrderWorkflowService {
  constructor() {
    this.listeners = new Set();
    this.isRealTimeConnected = false;
    
    // Initialiser les listeners WebSocket
    this.initializeRealTimeListeners();
    
    this.orderStatuses = {
      // Statuts initiaux
      'draft': {
        label: 'Brouillon',
        description: 'Commande en cours de création',
        nextStatuses: ['pending'],
        allowedRoles: ['client'],
        color: 'gray'
      },
      'pending': {
        label: 'En attente de validation',
        description: 'Commande soumise, en attente de validation comptabilité',
        nextStatuses: ['confirmed', 'rejected'],
        allowedRoles: ['compta', 'accountant', 'accounting', 'admin'],
        color: 'yellow',
        notifyRoles: ['compta', 'accountant', 'accounting', 'admin']
      },
      
      // Statuts comptabilité
      'confirmed': {
        label: 'Confirmée par comptabilité',
        description: 'Commande validée par la comptabilité',
        nextStatuses: ['preparing'],
        allowedRoles: ['counter', 'admin'],
        color: 'blue',
        notifyRoles: ['client', 'counter', 'admin']
      },
      'rejected': {
        label: 'Rejetée',
        description: 'Commande rejetée par la comptabilité',
        nextStatuses: ['pending'], // Peut être resoumise après modification
        allowedRoles: ['compta', 'accountant', 'accounting', 'admin'],
        color: 'red',
        notifyRoles: ['client']
      },
      
      // Statuts comptoir
      'preparing': {
        label: 'En préparation',
        description: 'Commande en cours de préparation au comptoir',
        nextStatuses: ['ready_for_delivery', 'cancelled'],
        allowedRoles: ['counter', 'admin'],
        color: 'orange',
        notifyRoles: ['client', 'compta', 'admin']
      },
      'ready_for_delivery': {
        label: 'Prête pour livraison',
        description: 'Commande préparée, en attente de livraison',
        nextStatuses: ['shipped'],
        allowedRoles: ['counter', 'admin'],
        color: 'purple',
        notifyRoles: ['client', 'admin']
      },
      
      // Statuts livraison
      'shipped': {
        label: 'En livraison',
        description: 'Commande expédiée, en cours de livraison',
        nextStatuses: ['delivered', 'delivery_failed'],
        allowedRoles: ['admin', 'counter'],
        color: 'indigo',
        notifyRoles: ['client', 'compta', 'admin']
      },
      'delivered': {
        label: 'Livrée',
        description: 'Commande livrée au client',
        nextStatuses: ['completed'],
        allowedRoles: ['client', 'admin'],
        color: 'green',
        notifyRoles: ['compta', 'counter', 'admin']
      },
      'completed': {
        label: 'Terminée',
        description: 'Commande terminée et acceptée par le client',
        nextStatuses: [],
        allowedRoles: ['client'],
        color: 'green',
        notifyRoles: ['compta', 'counter', 'admin']
      },
      
      // Statuts d'exception
      'delivery_failed': {
        label: 'Échec de livraison',
        description: 'Tentative de livraison échouée',
        nextStatuses: ['shipped', 'cancelled'],
        allowedRoles: ['admin', 'counter'],
        color: 'red',
        notifyRoles: ['client', 'admin']
      },
      'cancelled': {
        label: 'Annulée',
        description: 'Commande annulée',
        nextStatuses: [],
        allowedRoles: ['client', 'compta', 'accountant', 'accounting', 'admin'],
        color: 'red',
        notifyRoles: ['client', 'compta', 'counter', 'admin']
      }
    };
    
    this.actionLog = [];
    this.listeners = new Set();
  }

  /**
   * Obtenir les informations d'un statut
   */
  getStatusInfo(status) {
    return this.orderStatuses[status] || null;
  }

  /**
   * Vérifier si un utilisateur peut changer le statut d'une commande
   */
  canUserChangeStatus(userRole, currentStatus, newStatus) {
    const statusInfo = this.orderStatuses[newStatus];
    if (!statusInfo) return false;
    
    // Vérifier si le rôle est autorisé pour ce statut
    const isRoleAllowed = statusInfo.allowedRoles.includes(userRole) || userRole === 'admin';
    
    // Vérifier si la transition est valide
    const currentStatusInfo = this.orderStatuses[currentStatus];
    const isTransitionValid = currentStatusInfo?.nextStatuses.includes(newStatus);
    
    return isRoleAllowed && isTransitionValid;
  }

  /**
   * Changer le statut d'une commande
   */
  async changeOrderStatus(orderId, newStatus, userId, userRole, reason = '', additionalData = {}) {
    try {
      // Récupérer la commande actuelle (simulation)
      const currentOrder = await this.getOrderById(orderId);
      if (!currentOrder) {
        throw new Error('Commande non trouvée');
      }

      const currentStatus = currentOrder.status;
      
      // Vérifier les permissions
      if (!this.canUserChangeStatus(userRole, currentStatus, newStatus)) {
        throw new Error('Vous n\'avez pas les permissions pour effectuer cette action');
      }

      // Obtenir les informations de l'utilisateur
      const currentUser = await this.getUserById(userId);
      const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Utilisateur inconnu';

      // Enregistrer l'action dans les logs
      const action = {
        id: Date.now().toString(),
        orderId,
        userId,
        userRole,
        action: 'status_change',
        oldStatus: currentStatus,
        newStatus,
        reason,
        timestamp: new Date(),
        additionalData
      };
      
      this.actionLog.push(action);

      // Mettre à jour la commande (simulation)
      currentOrder.status = newStatus;
      currentOrder.lastUpdated = new Date();
      currentOrder.updatedBy = userId;
      
      // Ajouter des données spécifiques selon le statut
      if (newStatus === 'shipped' && additionalData.trackingNumber) {
        currentOrder.trackingNumber = additionalData.trackingNumber;
        currentOrder.shippedAt = new Date();
      } else if (newStatus === 'delivered') {
        currentOrder.deliveredAt = new Date();
      } else if (newStatus === 'completed') {
        currentOrder.completedAt = new Date();
      }

      // Enregistrer l'action dans le service de logs
      const affectedUsers = [currentOrder.clientId]; // Le client est toujours affecté
      actionLogService.logOrderAction(
        userId,
        userRole,
        userName,
        'order_status_changed',
        orderId,
        {
          ...currentOrder,
          previousStatus: currentStatus
        },
        affectedUsers
      );
      
      // Logger dans le journal Admin
      adminJournalService.logOrderStatusChange({
        orderId: currentOrder.orderNumber || orderId,
        oldStatus: currentStatus,
        newStatus,
        changedBy: userName,
        reason: reason || 'Aucune raison spécifiée',
        clientId: currentOrder.clientId,
        orderData: currentOrder,
        timestamp: new Date().toISOString()
      });

      // Envoyer les notifications aux rôles concernés
      await this.sendStatusChangeNotifications(currentOrder, currentStatus, newStatus, userId, reason);

      // Notifier les listeners
      this.notifyListeners('order_status_changed', {
        orderId,
        oldStatus: currentStatus,
        newStatus,
        order: currentOrder,
        action
      });

      return {
        success: true,
        order: currentOrder,
        action
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Envoyer les notifications de changement de statut
   */
  async sendStatusChangeNotifications(order, oldStatus, newStatus, userId, reason) {
    const statusInfo = this.orderStatuses[newStatus];
    const oldStatusInfo = this.orderStatuses[oldStatus];
    
    if (!statusInfo?.notifyRoles) return;

    // Récupérer les informations de l'utilisateur qui a effectué l'action
    const actionUser = await this.getUserById(userId);
    const actionUserName = actionUser ? `${actionUser.firstName} ${actionUser.lastName}` : 'Système';

    // Créer les notifications pour chaque rôle
    for (const role of statusInfo.notifyRoles) {
      const notification = this.createStatusChangeNotification(
        order, 
        oldStatus, 
        newStatus, 
        actionUserName, 
        reason, 
        role
      );
      
      // Envoyer la notification à tous les utilisateurs de ce rôle
      await this.sendNotificationToRole(role, notification);
    }
  }

  /**
   * Créer une notification de changement de statut
   */
  createStatusChangeNotification(order, oldStatus, newStatus, actionUserName, reason, targetRole) {
    const statusInfo = this.orderStatuses[newStatus];
    const oldStatusInfo = this.orderStatuses[oldStatus];
    
    let title, message, type = 'info';
    
    // Messages personnalisés selon le rôle et le statut
    switch (newStatus) {
      case 'pending':
        if (targetRole === 'compta' || targetRole === 'accountant' || targetRole === 'accounting') {
          title = 'Nouvelle commande à valider';
          message = `Commande #${order.orderNumber} en attente de validation`;
          type = 'warning';
        }
        break;
        
      case 'confirmed':
        if (targetRole === 'client') {
          title = 'Commande confirmée';
          message = `Votre commande #${order.orderNumber} a été validée par la comptabilité`;
          type = 'success';
        } else if (targetRole === 'counter') {
          title = 'Commande à préparer';
          message = `Commande #${order.orderNumber} validée, à préparer au comptoir`;
          type = 'info';
        }
        break;
        
      case 'rejected':
        if (targetRole === 'client') {
          title = 'Commande rejetée';
          message = `Votre commande #${order.orderNumber} a été rejetée. Raison: ${reason}`;
          type = 'error';
        }
        break;
        
      case 'preparing':
        if (targetRole === 'client') {
          title = 'Commande en préparation';
          message = `Votre commande #${order.orderNumber} est en cours de préparation`;
          type = 'info';
        }
        break;
        
      case 'ready_for_delivery':
        if (targetRole === 'client') {
          title = 'Commande prête';
          message = `Votre commande #${order.orderNumber} est prête pour la livraison`;
          type = 'info';
        }
        break;
        
      case 'shipped':
        if (targetRole === 'client') {
          title = 'Commande expédiée';
          message = `Votre commande #${order.orderNumber} a été expédiée${order.trackingNumber ? ` (Suivi: ${order.trackingNumber})` : ''}`;
          type = 'info';
        }
        break;
        
      case 'delivered':
        if (targetRole === 'client') {
          title = 'Commande livrée';
          message = `Votre commande #${order.orderNumber} a été livrée. Veuillez confirmer la réception`;
          type = 'success';
        } else {
          title = 'Commande livrée';
          message = `Commande #${order.orderNumber} livrée au client`;
          type = 'success';
        }
        break;
        
      case 'completed':
        title = 'Commande terminée';
        message = `Commande #${order.orderNumber} terminée et acceptée par le client`;
        type = 'success';
        break;
        
      case 'cancelled':
        title = 'Commande annulée';
        message = `Commande #${order.orderNumber} annulée. Raison: ${reason}`;
        type = 'error';
        break;
        
      default:
        title = 'Statut de commande mis à jour';
        message = `Commande #${order.orderNumber}: ${oldStatusInfo?.label} → ${statusInfo?.label}`;
    }
    
    return {
      id: `order_${order.id}_${newStatus}_${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      priority: type === 'error' ? 'high' : 'medium',
      category: 'orders',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus,
        actionUser: actionUserName,
        reason
      }
    };
  }

  /**
   * Envoyer une notification à tous les utilisateurs d'un rôle
   */
  async sendNotificationToRole(role, notification) {
    try {
      // Utiliser la nouvelle méthode du NotificationService
      await notificationService.addNotificationToRole(role, notification);
    } catch (error) {
      }
  }

  /**
   * Obtenir l'historique des actions pour une commande
   */
  getOrderActionHistory(orderId) {
    return this.actionLog.filter(action => action.orderId === orderId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Obtenir toutes les actions (pour les logs admin)
   */
  getAllActions(filters = {}) {
    let actions = [...this.actionLog];
    
    if (filters.userId) {
      actions = actions.filter(action => action.userId === filters.userId);
    }
    
    if (filters.orderId) {
      actions = actions.filter(action => action.orderId === filters.orderId);
    }
    
    if (filters.startDate) {
      actions = actions.filter(action => new Date(action.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      actions = actions.filter(action => new Date(action.timestamp) <= new Date(filters.endDate));
    }
    
    return actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Obtenir les statuts suivants possibles pour une commande
   */
  getNextPossibleStatuses(currentStatus, userRole) {
    const statusInfo = this.orderStatuses[currentStatus];
    if (!statusInfo) return [];
    
    return statusInfo.nextStatuses.filter(nextStatus => {
      const nextStatusInfo = this.orderStatuses[nextStatus];
      return nextStatusInfo?.allowedRoles.includes(userRole) || userRole === 'admin';
    });
  }

  /**
   * Initialiser les listeners WebSocket temps réel
   */
  initializeRealTimeListeners() {
    if (this.isRealTimeConnected) {
      return;
    }
    
    // Écouter les mises à jour de commandes
    realTimeService.onOrderUpdate((data) => {
      this.handleOrderUpdate(data);
    });
    
    // Écouter les notifications générales
    realTimeService.onNotification((notification) => {
      this.handleGeneralNotification(notification);
    });
    
    this.isRealTimeConnected = true;
  }
  
  /**
   * Gérer les mises à jour de commandes en temps réel
   */
  handleOrderUpdate(data) {
    try {
      const { order, oldStatus, newStatus, actionUser, reason } = data;
      
      // Notifier tous les listeners locaux
      this.notifyListeners('order:status_changed', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus,
        order,
        actionUser,
        reason,
        timestamp: new Date()
      });
      
      } catch (error) {
      }
  }
  
  /**
   * Gérer les notifications générales
   */
  handleGeneralNotification(notification) {
    try {
      // Filtrer les notifications liées aux commandes
      if (notification.type && notification.type.startsWith('order_')) {
        this.notifyListeners('order:notification', notification);
      }
      
      // Notifier tous les listeners pour les autres notifications
      this.notifyListeners('notification', notification);
      
    } catch (error) {
      }
  }

  /**
   * Ajouter un listener pour les événements
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Supprimer un listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notifier tous les listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        }
    });
  }

  // Méthodes utilitaires (à remplacer par de vrais appels API)
  async getOrderById(orderId) {
    // Simulation - à remplacer par un vrai appel API
    return {
      id: orderId,
      orderNumber: `CMD-${orderId}`,
      status: 'pending',
      clientId: 'client-123',
      total: 1500.00,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Simule la récupération d'un utilisateur par ID
   */
  async getCurrentUser(userId) {
    const result = await authService.getCurrentUser();
    return result.success ? result.user : null;
  }

  async getUserById(userId) {
    const response = await authService.getUserById(userId);
    return response.data;
  }

  async getUsersByRole(role) {
    const response = await authService.getUsersByRole(role);
    return response.data;
  }
}

// Instance singleton
const orderWorkflowService = new OrderWorkflowService();
export { orderWorkflowService };
export default orderWorkflowService;