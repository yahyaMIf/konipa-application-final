const express = require('express');
const router = express.Router();
const AlertService = require('../services/alertService');

// Instance globale du service d'alertes
let alertService = null;

// Initialiser le service d'alertes
function initializeAlertService() {
  if (!alertService) {
    alertService = new AlertService();
    console.log('[ALERTS] Service d\'alertes initialisé');
  }
  return alertService;
}

// Middleware pour s'assurer que le service est initialisé
router.use((req, res, next) => {
  if (!alertService) {
    initializeAlertService();
  }
  req.alertService = alertService;
  next();
});

// GET /api/alerts - Obtenir toutes les alertes actives
router.get('/', (req, res) => {
  try {
    const alerts = req.alertService.getActiveAlerts();
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des alertes'
    });
  }
});

// GET /api/alerts/history - Obtenir l'historique des alertes
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = req.alertService.getAlertHistory(limit);
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// GET /api/alerts/metrics - Obtenir les métriques des alertes
router.get('/metrics', (req, res) => {
  try {
    const metrics = req.alertService.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la récupération des métriques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des métriques'
    });
  }
});

// POST /api/alerts - Créer une nouvelle alerte
router.post('/', (req, res) => {
  try {
    const {
      type,
      title,
      message,
      priority = 'medium',
      source = 'api',
      data = {},
      userId = null
    } = req.body;

    // Validation des champs requis
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Les champs type, title et message sont requis'
      });
    }

    // Validation du type d'alerte
    const validTypes = ['SECURITY', 'SYSTEM', 'BUSINESS', 'INVENTORY', 'FINANCIAL', 'CUSTOMER', 'OPERATIONAL', 'PERFORMANCE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Type d'alerte invalide. Types valides: ${validTypes.join(', ')}`
      });
    }

    // Validation de la priorité
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: `Priorité invalide. Priorités valides: ${validPriorities.join(', ')}`
      });
    }

    const alert = req.alertService.createAlert({
      type,
      title,
      message,
      priority,
      source,
      data,
      userId
    });

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alerte créée avec succès'
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'alerte'
    });
  }
});

// PUT /api/alerts/:id/acknowledge - Acquitter une alerte
router.put('/:id/acknowledge', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, comment = '' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'L\'ID utilisateur est requis'
      });
    }

    const alert = req.alertService.acknowledgeAlert(id, userId, comment);
    
    res.json({
      success: true,
      data: alert,
      message: 'Alerte acquittée avec succès'
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de l\'acquittement:', error);
    if (error.message.includes('non trouvée')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'acquittement de l\'alerte'
      });
    }
  }
});

// PUT /api/alerts/:id/resolve - Résoudre une alerte
router.put('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, resolution = '' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'L\'ID utilisateur est requis'
      });
    }

    const alert = req.alertService.resolveAlert(id, userId, resolution);
    
    res.json({
      success: true,
      data: alert,
      message: 'Alerte résolue avec succès'
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la résolution:', error);
    if (error.message.includes('non trouvée')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la résolution de l\'alerte'
      });
    }
  }
});

// PUT /api/alerts/:id/escalate - Escalader une alerte
router.put('/:id/escalate', (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Escalade manuelle' } = req.body;

    const alert = req.alertService.escalateAlert(id, reason);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alerte non trouvée ou déjà résolue'
      });
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alerte escaladée avec succès'
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de l\'escalade:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'escalade de l\'alerte'
    });
  }
});

// GET /api/alerts/types - Obtenir les types d'alertes disponibles
router.get('/types', (req, res) => {
  try {
    const types = req.alertService.alertTypes;
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la récupération des types:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des types d\'alertes'
    });
  }
});

// POST /api/alerts/test - Créer une alerte de test
router.post('/test', (req, res) => {
  try {
    const { type = 'SYSTEM' } = req.body;
    
    const testAlerts = {
      SECURITY: {
        title: 'Test - Alerte de sécurité',
        message: 'Ceci est une alerte de test pour vérifier le système de sécurité',
        priority: 'high'
      },
      SYSTEM: {
        title: 'Test - Alerte système',
        message: 'Ceci est une alerte de test pour vérifier le système',
        priority: 'medium'
      },
      BUSINESS: {
        title: 'Test - Alerte business',
        message: 'Ceci est une alerte de test pour les métriques business',
        priority: 'low'
      },
      INVENTORY: {
        title: 'Test - Alerte stock',
        message: 'Ceci est une alerte de test pour la gestion des stocks',
        priority: 'medium'
      },
      FINANCIAL: {
        title: 'Test - Alerte financière',
        message: 'Ceci est une alerte de test pour les transactions financières',
        priority: 'high'
      },
      CUSTOMER: {
        title: 'Test - Alerte client',
        message: 'Ceci est une alerte de test pour le service client',
        priority: 'medium'
      },
      OPERATIONAL: {
        title: 'Test - Alerte opérationnelle',
        message: 'Ceci est une alerte de test pour les opérations',
        priority: 'low'
      },
      PERFORMANCE: {
        title: 'Test - Alerte performance',
        message: 'Ceci est une alerte de test pour les performances système',
        priority: 'critical'
      }
    };

    const testAlert = testAlerts[type] || testAlerts.SYSTEM;
    
    const alert = req.alertService.createAlert({
      type,
      title: testAlert.title,
      message: testAlert.message,
      priority: testAlert.priority,
      source: 'test',
      data: {
        test: true,
        createdBy: 'api_test'
      }
    });

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alerte de test créée avec succès'
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la création de l\'alerte de test:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'alerte de test'
    });
  }
});

// GET /api/alerts/:id - Obtenir une alerte spécifique
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const alerts = req.alertService.getActiveAlerts();
    const alert = alerts.find(a => a.id === id);
    
    if (!alert) {
      // Chercher dans l'historique
      const history = req.alertService.getAlertHistory();
      const historicalAlert = history.find(a => a.id === id);
      
      if (!historicalAlert) {
        return res.status(404).json({
          success: false,
          error: 'Alerte non trouvée'
        });
      }
      
      return res.json({
        success: true,
        data: historicalAlert
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('[ALERTS] Erreur lors de la récupération de l\'alerte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'alerte'
    });
  }
});

// Exporter le router et la fonction d'initialisation
module.exports = {
  router,
  initializeAlertService,
  getAlertService: () => alertService
};