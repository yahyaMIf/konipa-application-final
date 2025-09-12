// Service d'alertes en temps réel amélioré
import { EventEmitter } from '../utils/EventEmitter';
import { notificationService } from './NotificationService';
import { adminJournalService } from './adminJournalService';
import { ceoJournalService } from './ceoJournalService';
import { buildWsUrl } from '../utils/wsUrl';
import apiService from './apiService';
import { hasAuthToken } from '../utils/auth';

class RealTimeAlertService extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.reconnectTimeout = null;
    this.shouldReconnect = true;
    this.listeners = new Map();
    this.alertHistory = [];
    this.activeAlerts = new Map();
    this.isConnected = false;
    this.connectionId = null;
    this.lastConnectionTime = null;
    this.isRunning = false;
    
    // Protection contre React StrictMode
    this.strictModeProtection = false;
    this.connectionTimeout = null;
    this.alertMetrics = {
      total: 0,
      resolved: 0,
      pending: 0,
      critical: 0,
      escalated: 0
    };
    
    // Types d'alertes détaillées
    this.alertTypes = {
      SECURITY: {
        name: 'Sécurité',
        icon: '🔒',
        color: '#dc2626',
        priority: 'critical',
        autoActions: ['log_security_event', 'notify_admin'],
        escalationTime: 300000 // 5 minutes
      },
      SYSTEM: {
        name: 'Système',
        icon: '⚙️',
        color: '#ea580c',
        priority: 'high',
        autoActions: ['log_system_event', 'check_health'],
        escalationTime: 600000 // 10 minutes
      },
      BUSINESS: {
        name: 'Business',
        icon: '💼',
        color: '#dc2626',
        priority: 'high',
        autoActions: ['notify_management', 'log_business_event'],
        escalationTime: 900000 // 15 minutes
      },
      INVENTORY: {
        name: 'Stock',
        icon: '📦',
        color: '#f59e0b',
        priority: 'medium',
        autoActions: ['notify_warehouse', 'update_stock_status'],
        escalationTime: 1800000 // 30 minutes
      },
      FINANCIAL: {
        name: 'Financier',
        icon: '💰',
        color: '#dc2626',
        priority: 'high',
        autoActions: ['notify_accounting', 'log_financial_event'],
        escalationTime: 600000 // 10 minutes
      },
      CUSTOMER: {
        name: 'Client',
        icon: '👤',
        color: '#2563eb',
        priority: 'medium',
        autoActions: ['notify_commercial', 'log_customer_event'],
        escalationTime: 1200000 // 20 minutes
      },
      OPERATIONAL: {
        name: 'Opérationnel',
        icon: '🔧',
        color: '#059669',
        priority: 'medium',
        autoActions: ['notify_operations', 'log_operational_event'],
        escalationTime: 1800000 // 30 minutes
      },
      PERFORMANCE: {
        name: 'Performance',
        icon: '📊',
        color: '#7c3aed',
        priority: 'low',
        autoActions: ['log_performance_event'],
        escalationTime: 3600000 // 1 hour
      }
    };
    
    // Ne pas initialiser automatiquement - attendre la connexion utilisateur
    // this.init();
  }

  // Démarrer le service manuellement (appelé après connexion)
  async start() {
    if (this.isRunning) {
      return;
    }

    if (!this.canConnect()) {
      this.isRunning = false;
      return;
    }

    this.isRunning = true;
    return this.init();
  }

  // Arrêter le service
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.shouldReconnect = false;
    
    // Arrêter les vérifications périodiques
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Arrêter les tentatives de reconnexion
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Fermer la connexion WebSocket proprement
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Service stopped');
      }
      this.ws = null;
    }
    
    // Nettoyer la protection StrictMode
    this.strictModeProtection = false;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Réinitialiser l'état
    this.isConnected = false;
    this.connectionId = null;
    this.reconnectAttempts = 0;
    
    // Sauvegarder l'historique
    this.saveAlertHistory();
    
    }

  // Initialiser le service
  async init() {
    try {
      // Vérifier si un utilisateur est connecté avant d'initialiser
      if (!this.canConnect()) {
        this.isRunning = false;
        return;
      }

      if (!this.isRunning) {
        return;
      }

      await this.connectWebSocket();
      this.startPeriodicChecks();
      this.loadAlertHistory();
      } catch (error) {
      this.isRunning = false;
    }
  }

  // Connexion WebSocket
  async connectWebSocket() {
    try {
      // Protection contre les connexions multiples en React StrictMode
      if (this.strictModeProtection) {
        return;
      }
      
      this.strictModeProtection = true;
      
      // Vérifier la présence du token avant de se connecter
      if (!this.canConnect()) {
        this.isRunning = false;
        this.strictModeProtection = false;
        return;
      }

      if (!this.isRunning) {
        this.strictModeProtection = false;
        return;
      }
      
      // Fermer la connexion existante si elle existe
      if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
        this.ws.close();
      }

      const wsUrl = buildWsUrl('/ws/alerts');
      if (!wsUrl) {
        return;
      }
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.lastConnectionTime = new Date();
        
        // Désactiver la protection StrictMode après connexion réussie
        this.connectionTimeout = setTimeout(() => {
          this.strictModeProtection = false;
        }, 1000);
        
        // Le token est déjà inclus dans l'URL par buildWsUrl
        this.requestActiveAlerts();
        this.sendHeartbeat();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          }
      };
      
      this.ws.onclose = (event) => {
        this.isConnected = false;
        
        // Désactiver la protection StrictMode et nettoyer les timeouts
        this.strictModeProtection = false;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        // Gestion des codes d'erreur spécifiques
        if (event.code === 1006 || event.code === 1011 || event.code === 1008) {
          // Erreurs d'authentification - ne pas reconnecter
          this.shouldReconnect = false;
          this.isRunning = false;
          
          // Émettre l'événement websocket:error pour AccountDeactivationHandler
          window.dispatchEvent(new CustomEvent('websocket:error', {
            detail: { 
              code: event.code, 
              reason: event.reason,
              service: 'RealTimeAlertService'
            }
          }));
          
          // Forcer la déconnexion de l'utilisateur
          window.dispatchEvent(new CustomEvent('auth:force-logout', { 
            detail: { reason: 'websocket_auth_error' } 
          }));
          return;
        }
        
        if (this.shouldReconnect) {
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        this.isConnected = false;
      };
    
    } catch (error) {
      // Fallback en mode polling
      this.startPollingMode();
    }
  }

  // Vérifier si la connexion est autorisée
  canConnect() {
    const user = apiService.getCurrentUser();
    return apiService.isAuthenticated() && 
           user && 
           user.status === 'active' && 
           hasAuthToken();
  }

  // Gestion des messages WebSocket
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'connection_established':
        this.isConnected = true;
        this.connectionId = data.clientId;
        this.lastConnectionTime = new Date();
        // Émettre un événement pour notifier les composants
        this.emit('connection_established', {
          clientId: data.clientId,
          timestamp: data.timestamp || new Date().toISOString()
        });
        // Demander les alertes actives après connexion
        this.requestActiveAlerts();
        break;
      case 'alert':
        this.processIncomingAlert(data.alert);
        break;
      case 'alert_resolved':
        this.resolveAlert(data.alertId, data.resolution);
        break;
      case 'system_status':
        this.updateSystemStatus(data.status);
        break;
      case 'heartbeat':
        // Répondre au heartbeat
        this.sendHeartbeat();
        break;
      default:
        }
  }

  // Envoyer un heartbeat
  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
    }
  }

  // Demander les alertes actives
  requestActiveAlerts() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'get_active_alerts' }));
      }
  }

  // Créer une nouvelle alerte
  async createAlert(alertData) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'active',
      acknowledged: false,
      resolved: false,
      escalated: false,
      escalationTime: null,
      resolvedAt: null,
      resolvedBy: null,
      actions: [],
      metrics: {
        responseTime: null,
        resolutionTime: null,
        escalationCount: 0
      },
      ...alertData
    };

    // Valider le type d'alerte
    if (!this.alertTypes[alert.type]) {
      throw new Error(`Type d'alerte invalide: ${alert.type}`);
    }

    const alertType = this.alertTypes[alert.type];
    alert.priority = alert.priority || alertType.priority;
    alert.color = alertType.color;
    alert.icon = alertType.icon;

    // Ajouter à la liste des alertes actives
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // Mettre à jour les métriques
    this.updateMetrics('created', alert);

    // Exécuter les actions automatiques
    await this.executeAutoActions(alert, alertType.autoActions);

    // Programmer l'escalade si nécessaire
    if (alert.priority === 'critical' || alert.priority === 'high') {
      this.scheduleEscalation(alert, alertType.escalationTime);
    }

    // Notifier les listeners
    this.notifyListeners('alert_created', alert);

    // Envoyer via WebSocket si connecté
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'new_alert',
        alert: alert
      }));
    }

    // Créer une notification
    await this.createNotificationFromAlert(alert);

    return alert;
  }

  // Exécuter les actions automatiques
  async executeAutoActions(alert, autoActions) {
    for (const action of autoActions) {
      try {
        await this.executeAction(alert, action);
        alert.actions.push({
          type: action,
          timestamp: new Date(),
          status: 'completed',
          automatic: true
        });
      } catch (error) {
        alert.actions.push({
          type: action,
          timestamp: new Date(),
          status: 'failed',
          error: error.message,
          automatic: true
        });
      }
    }
  }

  // Exécuter une action spécifique
  async executeAction(alert, actionType) {
    switch (actionType) {
      case 'log_security_event':
        // Vérifier la présence du token avant de logger
        if (hasAuthToken()) {
          await adminJournalService.logSecurityAlert(alert.type, alert.title, alert.data);
        } else {
          }
        break;
        
      case 'notify_admin':
        await this.notifyRole('admin', alert);
        break;
        
      case 'notify_management':
          await this.notifyRole('admin', alert);
          break;
        
      case 'notify_commercial':
        await this.notifyRole('commercial', alert);
        break;
        
      case 'notify_accounting':
        await this.notifyRole('accountant', alert);
        await this.notifyRole('compta', alert);
        break;
        
      case 'notify_warehouse':
        await this.notifyRole('pos', alert);
        break;
        
      case 'notify_operations':
        await this.notifyRole('counter', alert);
        break;
        
      case 'check_health':
        await this.performHealthCheck(alert);
        break;
        
      case 'update_stock_status':
        await this.updateStockStatus(alert);
        break;
        
      case 'log_system_event':
      case 'log_business_event':
      case 'log_financial_event':
      case 'log_customer_event':
      case 'log_operational_event':
      case 'log_performance_event':
        await this.logEvent(alert, actionType);
        break;
        
      default:
        }
  }

  // Notifier un rôle spécifique
  async notifyRole(role, alert) {
    const notification = {
      type: 'alert',
      title: `🚨 ${alert.title}`,
      message: alert.message,
      priority: alert.priority,
      category: 'alerts',
      data: {
        alertId: alert.id,
        alertType: alert.type,
        timestamp: alert.timestamp
      },
      actionUrl: `/alerts/${alert.id}`,
      actionLabel: 'Voir l\'alerte'
    };

    await notificationService.addNotificationToRole(role, notification);
  }

  // Créer une notification à partir d'une alerte
  async createNotificationFromAlert(alert) {
    const notification = {
      type: 'alert',
      title: `${alert.icon} ${alert.title}`,
      message: alert.message,
      priority: alert.priority,
      category: 'alerts',
      data: {
        alertId: alert.id,
        alertType: alert.type,
        timestamp: alert.timestamp
      },
      actionUrl: `/alerts/${alert.id}`,
      actionLabel: 'Gérer l\'alerte'
    };

    // Déterminer les rôles à notifier selon le type d'alerte
    const rolesToNotify = this.getRolesToNotify(alert.type);
    
    for (const role of rolesToNotify) {
      await notificationService.addNotificationToRole(role, notification);
    }
  }

  // Déterminer les rôles à notifier
  getRolesToNotify(alertType) {
    const roleMap = {
      SECURITY: ['admin'],
      SYSTEM: ['admin'],
      BUSINESS: ['admin', 'commercial'],
      INVENTORY: ['pos', 'admin'],
      FINANCIAL: ['accountant', 'compta', 'admin'],
      CUSTOMER: ['commercial', 'admin'],
      OPERATIONAL: ['counter', 'pos', 'admin'],
      PERFORMANCE: ['admin']
    };
    
    return roleMap[alertType] || ['admin'];
  }

  // Programmer l'escalade d'une alerte
  scheduleEscalation(alert, escalationTime) {
    setTimeout(async () => {
      if (this.activeAlerts.has(alert.id) && !alert.acknowledged && !alert.resolved) {
        await this.escalateAlert(alert.id);
      }
    }, escalationTime);
  }

  // Escalader une alerte
  async escalateAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.escalated) return;

    alert.escalated = true;
    alert.escalationTime = new Date();
    alert.metrics.escalationCount++;
    
    // Notifier la direction
    await this.notifyRole('admin', {
      ...alert,
      title: `🔥 ESCALADE: ${alert.title}`,
      message: `Alerte non traitée depuis ${Math.round((Date.now() - alert.timestamp) / 60000)} minutes`,
      priority: 'critical'
    });

    this.updateMetrics('escalated', alert);
    this.notifyListeners('alert_escalated', alert);
    
    }

  // Acquitter une alerte
  async acknowledgeAlert(alertId, userId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) throw new Error('Alerte non trouvée');

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    alert.metrics.responseTime = Date.now() - alert.timestamp;

    this.notifyListeners('alert_acknowledged', alert);
    
    // Envoyer via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'alert_acknowledged',
        alertId: alertId,
        userId: userId
      }));
    }

    return alert;
  }

  // Résoudre une alerte
  async resolveAlert(alertId, resolution) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) throw new Error('Alerte non trouvée');

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolution.userId;
    alert.resolution = resolution;
    alert.status = 'resolved';
    alert.metrics.resolutionTime = Date.now() - alert.timestamp;

    // Retirer des alertes actives
    this.activeAlerts.delete(alertId);
    
    this.updateMetrics('resolved', alert);
    this.notifyListeners('alert_resolved', alert);
    
    // Envoyer via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'alert_resolved',
        alertId: alertId,
        resolution: resolution
      }));
    }

    return alert;
  }

  // Mettre à jour les métriques
  updateMetrics(action, alert) {
    switch (action) {
      case 'created':
        this.alertMetrics.total++;
        this.alertMetrics.pending++;
        if (alert.priority === 'critical') {
          this.alertMetrics.critical++;
        }
        break;
      case 'resolved':
        this.alertMetrics.resolved++;
        this.alertMetrics.pending = Math.max(0, this.alertMetrics.pending - 1);
        if (alert.priority === 'critical') {
          this.alertMetrics.critical = Math.max(0, this.alertMetrics.critical - 1);
        }
        break;
      case 'escalated':
        this.alertMetrics.escalated++;
        break;
    }
  }

  // Obtenir les alertes actives
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => {
        // Trier par priorité puis par timestamp
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }

  // Obtenir l'historique des alertes
  getAlertHistory(filters = {}) {
    let history = [...this.alertHistory];
    
    if (filters.type) {
      history = history.filter(alert => alert.type === filters.type);
    }
    
    if (filters.priority) {
      history = history.filter(alert => alert.priority === filters.priority);
    }
    
    if (filters.status) {
      history = history.filter(alert => alert.status === filters.status);
    }
    
    if (filters.dateFrom) {
      history = history.filter(alert => new Date(alert.timestamp) >= new Date(filters.dateFrom));
    }
    
    if (filters.dateTo) {
      history = history.filter(alert => new Date(alert.timestamp) <= new Date(filters.dateTo));
    }
    
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Obtenir les métriques
  getMetrics() {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    const alerts24h = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) >= last24h
    );
    
    const alerts7d = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) >= last7d
    );
    
    const resolvedAlerts = this.alertHistory.filter(alert => alert.resolved);
    const avgResolutionTime = resolvedAlerts.length > 0 
      ? resolvedAlerts.reduce((sum, alert) => sum + (alert.metrics.resolutionTime || 0), 0) / resolvedAlerts.length
      : 0;
    
    return {
      ...this.alertMetrics,
      alerts24h: alerts24h.length,
      alerts7d: alerts7d.length,
      avgResolutionTime: Math.round(avgResolutionTime / 1000 / 60), // en minutes
      resolutionRate: this.alertMetrics.total > 0 
        ? Math.round((this.alertMetrics.resolved / this.alertMetrics.total) * 100)
        : 0
    };
  }

  // Ajouter un listener
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Supprimer un listener
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Notifier les listeners
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          }
      });
    }
  }

  // Vérifications périodiques
  startPeriodicChecks() {
    // Vérifier les alertes toutes les minutes
    this.checkInterval = setInterval(() => {
      this.performSystemChecks();
    }, 60000);
    
    // Nettoyer l'historique toutes les heures
    this.cleanupInterval = setInterval(() => {
      this.cleanupHistory();
    }, 3600000);
  }

  // Effectuer des vérifications système
  async performSystemChecks() {
    try {
      // Vérifier la connectivité
      await this.checkConnectivity();
      
      // Vérifier les performances
      await this.checkPerformance();
      
      // Vérifier les stocks critiques
      await this.checkCriticalStock();
      
      // Vérifier les paiements en retard
      await this.checkOverduePayments();
      
    } catch (error) {
      }
  }

  // Vérifier la connectivité
  async checkConnectivity() {
    if (!navigator.onLine) {
      await this.createAlert({
        type: 'SYSTEM',
        title: 'Perte de connexion internet',
        message: 'La connexion internet a été perdue',
        priority: 'high',
        data: { timestamp: new Date() }
      });
    }
  }

  // Vérifier les performances
  async checkPerformance() {
    const loadTime = performance.now();
    if (loadTime > 5000) { // Plus de 5 secondes
      await this.createAlert({
        type: 'PERFORMANCE',
        title: 'Performance dégradée',
        message: `Temps de chargement élevé: ${Math.round(loadTime)}ms`,
        priority: 'medium',
        data: { loadTime, timestamp: new Date() }
      });
    }
  }

  // Vérifier les stocks critiques
  async checkCriticalStock() {
    // Cette méthode sera implémentée avec l'API d'inventaire
    // Pour l'instant, simulation
    const criticalItems = Math.floor(Math.random() * 3);
    if (criticalItems > 0) {
      await this.createAlert({
        type: 'INVENTORY',
        title: 'Stock critique détecté',
        message: `${criticalItems} article(s) en stock critique`,
        priority: 'high',
        data: { criticalItems, timestamp: new Date() }
      });
    }
  }

  // Vérifier les paiements en retard
  async checkOverduePayments() {
    // Cette méthode sera implémentée avec l'API financière
    // Pour l'instant, simulation
    const overdueCount = Math.floor(Math.random() * 5);
    if (overdueCount > 2) {
      await this.createAlert({
        type: 'FINANCIAL',
        title: 'Paiements en retard',
        message: `${overdueCount} factures en retard de paiement`,
        priority: 'high',
        data: { overdueCount, timestamp: new Date() }
      });
    }
  }

  // Nettoyer l'historique
  cleanupHistory() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.alertHistory = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) > thirtyDaysAgo
    );
  }

  // Sauvegarder l'historique
  saveAlertHistory() {
    try {
      localStorage.setItem('konipa_alert_history', JSON.stringify(this.alertHistory));
      localStorage.setItem('konipa_alert_metrics', JSON.stringify(this.alertMetrics));
    } catch (error) {
      }
  }

  // Charger l'historique
  loadAlertHistory() {
    try {
      const history = localStorage.getItem('konipa_alert_history');
      const metrics = localStorage.getItem('konipa_alert_metrics');
      
      if (history) {
        this.alertHistory = JSON.parse(history);
      }
      
      if (metrics) {
        this.alertMetrics = { ...this.alertMetrics, ...JSON.parse(metrics) };
      }
    } catch (error) {
      }
  }

  // Mode polling de fallback
  startPollingMode() {
    if (!this.isRunning) {
      return;
    }
    
    this.pollingInterval = setInterval(() => {
      if (this.isRunning) {
        this.performSystemChecks();
      } else {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    }, 30000); // Toutes les 30 secondes
  }

  // Heartbeat WebSocket
  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
    }
  }

  // Tentative de reconnexion
  attemptReconnect() {
    // Vérifier si on doit encore reconnecter et si l'utilisateur peut se connecter
    if (!this.shouldReconnect || !this.canConnect() || !this.isRunning) {
      // Reconnection not allowed
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        30000 // Maximum 30 secondes
      );
      
      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connectWebSocket();
          if (this.isConnected) {
            this.reconnectAttempts = 0; // Reset sur succès
          }
        } catch (error) {
          // Continuer les tentatives si on n'a pas atteint la limite
          if (this.reconnectAttempts < this.maxReconnectAttempts && this.shouldReconnect && this.isRunning) {
            this.attemptReconnect();
          } else {
            if (this.isRunning) {
              this.startPollingMode();
            }
          }
        }
      }, delay);
    } else {
      if (this.isRunning) {
        this.startPollingMode();
      }
    }
  }

  // Fermer la connexion
  disconnect() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.saveAlertHistory();
  }

  // Méthodes utilitaires pour les actions manuelles
  async performHealthCheck(alert) {
    // Simulation d'un health check
    const healthStatus = {
      database: Math.random() > 0.1,
      api: Math.random() > 0.05,
      storage: Math.random() > 0.02
    };
    
    alert.data.healthCheck = {
      timestamp: new Date(),
      status: healthStatus,
      overall: Object.values(healthStatus).every(status => status)
    };
  }

  async updateStockStatus(alert) {
    // Simulation de mise à jour du statut de stock
    alert.data.stockUpdate = {
      timestamp: new Date(),
      action: 'status_updated',
      details: 'Stock status updated automatically'
    };
  }

  async logEvent(alert, eventType) {
    try {
      const eventData = {
        type: 'alert_event',
        alertId: alert.id,
        eventType: eventType,
        timestamp: new Date(),
        alertType: alert.type,
        priority: alert.priority
      };

      // Log to admin journal
      await adminJournalService.logEvent(eventData);
      
      // Log to CEO journal if high priority
      if (alert.priority === 'critical' || alert.priority === 'high') {
        await ceoJournalService.logEvent(eventData);
      }
    } catch (error) {
      }
  }
}

// Instance singleton
const realTimeAlertService = new RealTimeAlertService();

// Exporter le service
export { realTimeAlertService };
export default realTimeAlertService;

// Méthodes utilitaires pour créer des alertes spécifiques
export const AlertCreators = {
  // Alerte de sécurité
  security: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'SECURITY',
      title,
      message,
      data
    }),

  // Alerte système
  system: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'SYSTEM',
      title,
      message,
      data
    }),

  // Alerte business
  business: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'BUSINESS',
      title,
      message,
      data
    }),

  // Alerte stock
  inventory: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'INVENTORY',
      title,
      message,
      data
    }),

  // Alerte financière
  financial: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'FINANCIAL',
      title,
      message,
      data
    }),

  // Alerte client
  customer: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'CUSTOMER',
      title,
      message,
      data
    }),

  // Alerte opérationnelle
  operational: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'OPERATIONAL',
      title,
      message,
      data
    }),

  // Alerte performance
  performance: (title, message, data = {}) => 
    realTimeAlertService.createAlert({
      type: 'PERFORMANCE',
      title,
      message,
      data
    })
};