const AlertService = require('../services/alertService');
const { NotificationService } = require('../services/NotificationService');

/**
 * Middleware pour capturer les erreurs et créer des alertes système
 */
class ErrorAlertMiddleware {
  constructor() {
    this.alertService = new AlertService();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Middleware Express pour capturer les erreurs
   */
  static errorHandler(err, req, res, next) {
    const alertService = new AlertService();
    
    // Déterminer la priorité selon le type d'erreur
    let priority = 'medium';
    let alertType = 'SYSTEM';
    
    if (err.status >= 500 || !err.status) {
      priority = 'high';
    }
    
    if (err.name === 'ValidationError') {
      priority = 'low';
    }
    
    if (err.name === 'UnauthorizedError' || err.status === 401 || err.status === 403) {
      alertType = 'SECURITY';
      priority = 'high';
    }
    
    if (err.name === 'DatabaseError' || err.name === 'SequelizeError') {
      priority = 'critical';
    }

    // Créer l'alerte
    alertService.createAlert({
      type: alertType,
      title: `Erreur ${err.status || 500}: ${err.name || 'Erreur serveur'}`,
      message: err.message || 'Une erreur inattendue s\'est produite',
      priority,
      source: 'express_middleware',
      data: {
        error: {
          name: err.name,
          message: err.message,
          status: err.status,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        },
        request: {
          method: req.method,
          url: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?.id
        },
        timestamp: new Date().toISOString()
      },
      userId: req.user?.id
    });

    // Continuer avec la gestion d'erreur normale
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Une erreur inattendue s\'est produite' 
      : err.message;

    res.status(status).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  /**
   * Configurer les gestionnaires d'erreurs globaux
   */
  setupGlobalErrorHandlers() {
    // Erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('❌ Exception non capturée:', error);
      
      this.alertService.createAlert({
        type: 'SYSTEM',
        title: '🚨 Exception non capturée',
        message: `Exception critique: ${error.message}`,
        priority: 'critical',
        source: 'uncaught_exception',
        data: {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          timestamp: new Date().toISOString(),
          processId: process.pid
        }
      });
      
      // Laisser le processus se terminer après avoir créé l'alerte
      setTimeout(() => process.exit(1), 1000);
    });

    // Promesses rejetées non gérées
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesse rejetée non gérée:', reason);
      
      this.alertService.createAlert({
        type: 'SYSTEM',
        title: '🚨 Promesse rejetée non gérée',
        message: `Promesse rejetée: ${reason?.message || reason}`,
        priority: 'high',
        source: 'unhandled_rejection',
        data: {
          reason: reason?.toString(),
          stack: reason?.stack,
          timestamp: new Date().toISOString(),
          processId: process.pid
        }
      });
    });

    // Avertissements de dépréciation
    process.on('warning', (warning) => {
      if (warning.name === 'DeprecationWarning') {
        this.alertService.createAlert({
          type: 'SYSTEM',
          title: '⚠️ Avertissement de dépréciation',
          message: warning.message,
          priority: 'low',
          source: 'deprecation_warning',
          data: {
            warning: {
              name: warning.name,
              message: warning.message,
              stack: warning.stack
            },
            timestamp: new Date().toISOString()
          }
        });
      }
    });
  }

  /**
   * Créer une alerte pour une erreur de base de données
   */
  static async createDatabaseErrorAlert(error, context = {}) {
    const alertService = new AlertService();
    
    await alertService.createAlert({
      type: 'SYSTEM',
      title: '🗄️ Erreur de base de données',
      message: `Erreur DB: ${error.message}`,
      priority: 'critical',
      source: 'database',
      data: {
        error: {
          name: error.name,
          message: error.message,
          sql: error.sql,
          parameters: error.parameters
        },
        context,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Créer une alerte pour une erreur d'API externe
   */
  static async createExternalApiErrorAlert(apiName, error, context = {}) {
    const alertService = new AlertService();
    
    await alertService.createAlert({
      type: 'SYSTEM',
      title: `🌐 Erreur API ${apiName}`,
      message: `Erreur lors de l'appel à ${apiName}: ${error.message}`,
      priority: 'high',
      source: 'external_api',
      data: {
        apiName,
        error: {
          message: error.message,
          status: error.status,
          response: error.response?.data
        },
        context,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Créer une alerte pour un problème de performance
   */
  static async createPerformanceAlert(metric, threshold, actual, context = {}) {
    const alertService = new AlertService();
    
    await alertService.createAlert({
      type: 'PERFORMANCE',
      title: `⚡ Problème de performance: ${metric}`,
      message: `${metric} dépasse le seuil: ${actual} > ${threshold}`,
      priority: actual > threshold * 2 ? 'high' : 'medium',
      source: 'performance_monitor',
      data: {
        metric,
        threshold,
        actual,
        context,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Créer une instance pour les gestionnaires globaux
const ErrorAlertHandler = new ErrorAlertMiddleware();

// Export du middleware fonction
const errorAlertMiddleware = ErrorAlertMiddleware.errorHandler;

module.exports = {
  ErrorAlertHandler,
  errorAlertMiddleware
};