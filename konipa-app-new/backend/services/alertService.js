const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { NotificationService } = require('./NotificationService');

class AlertService extends EventEmitter {
  constructor() {
    super();
    this.alerts = new Map();
    this.alertHistory = [];
    this.alertCounter = 1;
    this.isRunning = false;
    
    // Types d'alertes avec leurs configurations
    this.alertTypes = {
      SECURITY: {
        name: 'Sécurité',
        color: '#dc2626',
        icon: 'shield-alert',
        autoActions: ['log_security_event', 'notify_admin'],
        escalationTime: 300000 // 5 minutes
      },
      SYSTEM: {
        name: 'Système',
        color: '#ea580c',
        icon: 'server',
        autoActions: ['restart_service', 'log_error'],
        escalationTime: 600000 // 10 minutes
      },
      BUSINESS: {
        name: 'Business',
        color: '#0ea5e9',
        icon: 'trending-up',
        autoActions: ['notify_manager', 'update_dashboard'],
        escalationTime: 900000 // 15 minutes
      },
      INVENTORY: {
        name: 'Stock',
        color: '#7c3aed',
        icon: 'package',
        autoActions: ['notify_supplier', 'update_inventory'],
        escalationTime: 1800000 // 30 minutes
      },
      FINANCIAL: {
        name: 'Financier',
        color: '#059669',
        icon: 'dollar-sign',
        autoActions: ['notify_accountant', 'freeze_transaction'],
        escalationTime: 300000 // 5 minutes
      },
      CUSTOMER: {
        name: 'Client',
        color: '#db2777',
        icon: 'user',
        autoActions: ['notify_support', 'create_ticket'],
        escalationTime: 1200000 // 20 minutes
      },
      OPERATIONAL: {
        name: 'Opérationnel',
        color: '#65a30d',
        icon: 'settings',
        autoActions: ['notify_ops_team', 'log_incident'],
        escalationTime: 900000 // 15 minutes
      },
      PERFORMANCE: {
        name: 'Performance',
        color: '#dc2626',
        icon: 'activity',
        autoActions: ['scale_resources', 'notify_devops'],
        escalationTime: 600000 // 10 minutes
      }
    };
    
    this.startSimulation();
  }

  // Créer une nouvelle alerte
  createAlert({
    type,
    title,
    message,
    priority = 'medium',
    source = 'system',
    data = {},
    userId = null
  }) {
    const alertId = `alert_${this.alertCounter++}`;
    const now = new Date();
    
    const alert = {
      id: alertId,
      type,
      title,
      message,
      priority,
      status: 'active',
      source,
      data,
      userId,
      timestamp: now.toISOString(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      escalatedAt: null,
      autoActions: [],
      history: [{
        action: 'created',
        timestamp: now.toISOString(),
        user: 'system',
        details: 'Alerte créée'
      }]
    };

    this.alerts.set(alertId, alert);
    this.alertHistory.push(alert);

    // Exécuter les actions automatiques
    this.executeAutoActions(alert);

    // Programmer l'escalade si nécessaire
    if (priority === 'critical' || priority === 'high') {
      this.scheduleEscalation(alert);
    }

    // Créer une notification pour les alertes critiques et système
    this.createNotificationForAlert(alert);

    // Émettre l'événement
    this.emit('alert_created', alert);
    
    console.log(`[ALERT] Nouvelle alerte créée: ${title} (${priority})`);
    return alert;
  }

  // Acquitter une alerte
  acknowledgeAlert(alertId, userId, comment = '') {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      throw new Error('Alerte non trouvée ou déjà traitée');
    }

    const now = new Date();
    alert.acknowledgedAt = now.toISOString();
    alert.acknowledgedBy = userId;
    alert.status = 'acknowledged';
    
    alert.history.push({
      action: 'acknowledged',
      timestamp: now.toISOString(),
      user: userId,
      details: comment || 'Alerte acquittée'
    });

    this.emit('alert_acknowledged', alert);
    console.log(`[ALERT] Alerte acquittée: ${alert.title} par ${userId}`);
    return alert;
  }

  // Résoudre une alerte
  resolveAlert(alertId, userId, resolution = '') {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alerte non trouvée');
    }

    const now = new Date();
    alert.resolvedAt = now.toISOString();
    alert.resolvedBy = userId;
    alert.status = 'resolved';
    
    alert.history.push({
      action: 'resolved',
      timestamp: now.toISOString(),
      user: userId,
      details: resolution || 'Alerte résolue'
    });

    // Retirer de la liste des alertes actives
    this.alerts.delete(alertId);

    this.emit('alert_resolved', alert);
    console.log(`[ALERT] Alerte résolue: ${alert.title} par ${userId}`);
    return alert;
  }

  // Escalader une alerte
  escalateAlert(alertId, reason = 'Escalade automatique') {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status === 'resolved') {
      return;
    }

    const now = new Date();
    alert.escalatedAt = now.toISOString();
    alert.priority = alert.priority === 'high' ? 'critical' : 'high';
    
    alert.history.push({
      action: 'escalated',
      timestamp: now.toISOString(),
      user: 'system',
      details: reason
    });

    this.emit('alert_escalated', alert);
    console.log(`[ALERT] Alerte escaladée: ${alert.title}`);
    return alert;
  }

  // Exécuter les actions automatiques
  executeAutoActions(alert) {
    const alertType = this.alertTypes[alert.type];
    if (!alertType || !alertType.autoActions) return;

    alertType.autoActions.forEach(action => {
      this.executeAction(action, alert);
      alert.autoActions.push({
        action,
        timestamp: new Date().toISOString(),
        status: 'executed'
      });
    });
  }

  // Exécuter une action spécifique
  executeAction(action, alert) {
    console.log(`[ACTION] Exécution de l'action: ${action} pour l'alerte ${alert.id}`);
    
    switch (action) {
      case 'log_security_event':
        console.log(`[SECURITY] Événement de sécurité enregistré: ${alert.title}`);
        break;
      case 'notify_admin':
        console.log(`[NOTIFICATION] Administrateur notifié pour: ${alert.title}`);
        break;
      case 'restart_service':
        console.log(`[SYSTEM] Redémarrage du service pour: ${alert.title}`);
        break;
      case 'notify_manager':
        console.log(`[NOTIFICATION] Manager notifié pour: ${alert.title}`);
        break;
      case 'update_dashboard':
        console.log(`[DASHBOARD] Tableau de bord mis à jour pour: ${alert.title}`);
        break;
      case 'notify_supplier':
        console.log(`[NOTIFICATION] Fournisseur notifié pour: ${alert.title}`);
        break;
      case 'update_inventory':
        console.log(`[INVENTORY] Stock mis à jour pour: ${alert.title}`);
        break;
      case 'notify_accountant':
        console.log(`[NOTIFICATION] Comptable notifié pour: ${alert.title}`);
        break;
      case 'freeze_transaction':
        console.log(`[FINANCIAL] Transaction gelée pour: ${alert.title}`);
        break;
      case 'notify_support':
        console.log(`[NOTIFICATION] Support notifié pour: ${alert.title}`);
        break;
      case 'create_ticket':
        console.log(`[SUPPORT] Ticket créé pour: ${alert.title}`);
        break;
      case 'notify_ops_team':
        console.log(`[NOTIFICATION] Équipe opérationnelle notifiée pour: ${alert.title}`);
        break;
      case 'log_incident':
        console.log(`[INCIDENT] Incident enregistré pour: ${alert.title}`);
        break;
      case 'scale_resources':
        console.log(`[SCALING] Ressources mises à l'échelle pour: ${alert.title}`);
        break;
      case 'notify_devops':
        console.log(`[NOTIFICATION] DevOps notifié pour: ${alert.title}`);
        break;
      default:
        console.log(`[ACTION] Action inconnue: ${action}`);
    }
  }

  // Créer une notification pour une alerte
  async createNotificationForAlert(alert) {
    try {
      // Créer des notifications seulement pour les alertes critiques et système
      if (alert.priority === 'critical' || alert.type === 'SYSTEM' || alert.type === 'SECURITY') {
        const notificationData = {
          type: 'system_alert',
          title: `🚨 Alerte ${alert.type}: ${alert.title}`,
          message: alert.message,
          priority: alert.priority === 'critical' ? 'high' : 'medium',
          data: {
            alertId: alert.id,
            alertType: alert.type,
            alertPriority: alert.priority,
            source: alert.source,
            timestamp: alert.timestamp,
            ...alert.data
          }
        };

        // Notifier les administrateurs pour les alertes critiques
        if (alert.priority === 'critical' || alert.type === 'SECURITY') {
          await NotificationService.notifyByRole('admin', notificationData);
        }
        
        // Notifier les utilisateurs concernés pour les alertes système
        if (alert.type === 'SYSTEM' && alert.userId) {
          await NotificationService.notify({
            user_id: alert.userId,
            ...notificationData
          });
        }

        // Envoyer via WebSocket pour les alertes critiques
        if (alert.priority === 'critical') {
          await NotificationService.sendWebSocketNotification({
            type: 'critical_alert',
            alert: alert,
            notification: notificationData
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de notification pour alerte:', error);
    }
  }

  // Programmer l'escalade
  scheduleEscalation(alert) {
    const alertType = this.alertTypes[alert.type];
    if (!alertType || !alertType.escalationTime) return;

    setTimeout(() => {
      if (this.alerts.has(alert.id) && this.alerts.get(alert.id).status === 'active') {
        this.escalateAlert(alert.id);
      }
    }, alertType.escalationTime);
  }

  // Obtenir toutes les alertes actives
  getActiveAlerts() {
    return Array.from(this.alerts.values());
  }

  // Obtenir l'historique des alertes
  getAlertHistory(limit = 100) {
    return this.alertHistory
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Obtenir les métriques
  getMetrics() {
    const activeAlerts = this.getActiveAlerts();
    const totalAlerts = this.alertHistory.length;
    
    const priorityCount = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const typeCount = {};
    Object.keys(this.alertTypes).forEach(type => {
      typeCount[type] = 0;
    });

    activeAlerts.forEach(alert => {
      priorityCount[alert.priority]++;
      typeCount[alert.type]++;
    });

    const resolvedToday = this.alertHistory.filter(alert => {
      const today = new Date().toDateString();
      return alert.resolvedAt && new Date(alert.resolvedAt).toDateString() === today;
    }).length;

    return {
      total: totalAlerts,
      active: activeAlerts.length,
      resolved: totalAlerts - activeAlerts.length,
      resolvedToday,
      priorityCount,
      typeCount,
      averageResolutionTime: this.calculateAverageResolutionTime()
    };
  }

  // Calculer le temps moyen de résolution
  calculateAverageResolutionTime() {
    const resolvedAlerts = this.alertHistory.filter(alert => alert.resolvedAt);
    if (resolvedAlerts.length === 0) return 0;

    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const created = new Date(alert.timestamp);
      const resolved = new Date(alert.resolvedAt);
      return sum + (resolved - created);
    }, 0);

    return Math.round(totalTime / resolvedAlerts.length / 1000 / 60); // en minutes
  }

  // Démarrer la simulation d'alertes
  startSimulation() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Créer des alertes de test périodiquement
    const simulationInterval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% de chance de créer une alerte
        this.createRandomAlert();
      }
    }, 30000); // Toutes les 30 secondes

    // Nettoyer l'intervalle après 1 heure
    setTimeout(() => {
      clearInterval(simulationInterval);
      this.isRunning = false;
    }, 3600000);
  }

  // Créer une alerte aléatoire pour la simulation
  createRandomAlert() {
    const types = Object.keys(this.alertTypes);
    const priorities = ['low', 'medium', 'high', 'critical'];
    const sources = ['system', 'user', 'api', 'monitoring', 'external'];

    const type = types[Math.floor(Math.random() * types.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];

    const alertTemplates = {
      SECURITY: [
        { title: 'Tentative de connexion suspecte', message: 'Plusieurs tentatives de connexion échouées détectées' },
        { title: 'Accès non autorisé détecté', message: 'Tentative d\'accès à une ressource protégée' },
        { title: 'Activité anormale détectée', message: 'Comportement inhabituel dans le système' }
      ],
      SYSTEM: [
        { title: 'Utilisation CPU élevée', message: 'Le processeur atteint 85% d\'utilisation' },
        { title: 'Espace disque faible', message: 'Moins de 10% d\'espace disque disponible' },
        { title: 'Service indisponible', message: 'Le service de base de données ne répond pas' }
      ],
      BUSINESS: [
        { title: 'Objectif de vente atteint', message: 'L\'objectif mensuel a été dépassé de 15%' },
        { title: 'Nouveau client important', message: 'Inscription d\'un client avec un potentiel élevé' },
        { title: 'Commande importante', message: 'Nouvelle commande de plus de 10 000€' }
      ],
      INVENTORY: [
        { title: 'Stock faible', message: 'Le produit XYZ123 a moins de 5 unités en stock' },
        { title: 'Rupture de stock', message: 'Le produit ABC456 est en rupture de stock' },
        { title: 'Livraison en retard', message: 'La livraison du fournisseur est en retard de 2 jours' }
      ],
      FINANCIAL: [
        { title: 'Paiement en retard', message: 'Facture #12345 en retard de 30 jours' },
        { title: 'Transaction suspecte', message: 'Transaction inhabituelle détectée' },
        { title: 'Limite de crédit atteinte', message: 'Client a atteint sa limite de crédit' }
      ],
      CUSTOMER: [
        { title: 'Réclamation client', message: 'Nouveau ticket de support prioritaire' },
        { title: 'Avis négatif', message: 'Avis 1 étoile reçu sur le produit XYZ' },
        { title: 'Demande de remboursement', message: 'Demande de remboursement pour la commande #67890' }
      ],
      OPERATIONAL: [
        { title: 'Maintenance programmée', message: 'Maintenance du serveur prévue dans 1 heure' },
        { title: 'Mise à jour disponible', message: 'Nouvelle version du système disponible' },
        { title: 'Sauvegarde échouée', message: 'La sauvegarde automatique a échoué' }
      ],
      PERFORMANCE: [
        { title: 'Temps de réponse élevé', message: 'Les pages se chargent en plus de 3 secondes' },
        { title: 'Pic de trafic', message: 'Augmentation de 200% du trafic détectée' },
        { title: 'Erreurs fréquentes', message: 'Taux d\'erreur supérieur à 5%' }
      ]
    };

    const templates = alertTemplates[type];
    const template = templates[Math.floor(Math.random() * templates.length)];

    this.createAlert({
      type,
      title: template.title,
      message: template.message,
      priority,
      source,
      data: {
        simulated: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Arrêter le service
  stop() {
    this.isRunning = false;
    this.removeAllListeners();
  }
}

module.exports = AlertService;