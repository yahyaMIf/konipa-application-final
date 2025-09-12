const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const {
  syncWithSage,
  syncAllClients,
  syncAllProducts,
  syncAllOrders,
  getSyncStatus,
  testSageConnection,
  initScheduler,
  getScheduler,
  syncAllClientsManual,
  syncSingleClient,
  getSyncStats
} = require('../controllers/syncController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Initialiser le planificateur au démarrage
initScheduler();

/**
 * @route POST /api/sync/sessions
 * @desc Enregistrer une nouvelle session utilisateur
 * @access Private
 */
router.post('/sage', authenticateToken, requireRole(['admin', 'manager']), syncWithSage);

/**
 * @route DELETE /api/sync/sessions/:sessionId
 * @desc Désenregistrer une session utilisateur
 * @access Private
 */
router.post('/clients', authenticateToken, requireRole(['admin', 'manager']), syncAllClients);

/**
 * @route GET /api/sync/users/:userId/status
 * @desc Vérifier le statut d'un utilisateur
 * @access Private
 */
router.post('/products', authenticateToken, requireRole(['admin', 'manager']), syncAllProducts);

/**
 * @route PUT /api/sync/users/:userId/status
 * @desc Bloquer/débloquer un utilisateur (CEO/Admin seulement)
 * @access Private - CEO/Admin
 */
router.post('/orders', authenticateToken, requireRole(['admin', 'manager']), syncAllOrders);

/**
 * @route GET /api/sync/actions
 * @desc Obtenir les actions administratives récentes
 * @access Private - CEO/Admin
 */
router.get('/status', authenticateToken, getSyncStatus);

/**
 * @route GET /api/sync/sessions/:sessionId
 * @desc Synchroniser les données utilisateur pour une session
 * @access Private
 */
router.get('/test-connection', authenticateToken, requireRole(['admin']), testSageConnection);

// Nouvelles routes pour la synchronisation automatique

/**
 * @route POST /api/sync/clients/manual
 * @desc Synchronisation manuelle de tous les clients
 * @access Private - Admin
 */
router.post('/clients/manual',
  authenticateToken,
  requireRole(['admin']),
  syncAllClientsManual
);

/**
 * @route POST /api/sync/clients/:id
 * @desc Synchronisation d'un client spécifique
 * @access Private - Admin/Manager
 */
router.post('/clients/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    param('id')
      .isUUID()
      .withMessage('ID client invalide')
  ],
  syncSingleClient
);

/**
 * @route GET /api/sync/stats
 * @desc Statistiques de synchronisation
 * @access Private - Admin/Manager
 */
router.get('/stats',
  authenticateToken,
  requireRole(['admin', 'manager']),
  getSyncStats
);

/**
 * @route POST /api/sync/clients/outdated
 * @desc Synchronisation des clients obsolètes
 * @access Private - Admin
 */
router.post('/clients/outdated',
  authenticateToken,
  requireRole(['admin']),
  [
    query('hours')
      .optional()
      .isInt({ min: 1, max: 168 }) // Max 1 semaine
      .withMessage('Le paramètre hours doit être entre 1 et 168')
  ],
  async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const hoursThreshold = parseInt(hours);
      
      const scheduler = getScheduler();
      const results = await scheduler.syncOutdatedClients(hoursThreshold);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      res.json({
        success: true,
        message: `Synchronisation des clients obsolètes terminée: ${successCount} succès, ${errorCount} erreurs`,
        data: {
          hoursThreshold,
          totalProcessed: results.length,
          successCount,
          errorCount,
          results
        }
      });

    } catch (error) {
      console.error('Erreur lors de la synchronisation des clients obsolètes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la synchronisation des clients obsolètes',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/sync/scheduler/status
 * @desc Statut du planificateur
 * @access Private - Admin/Manager
 */
router.get('/scheduler/status',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const scheduler = getScheduler();
      
      res.json({
        success: true,
        data: {
          isRunning: scheduler.isRunning,
          lastSyncTime: scheduler.lastSyncTime,
          nextScheduledSync: 'Toutes les heures',
          schedulerActive: true
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/sync/stats/reset
 * @desc Remise à zéro des statistiques
 * @access Private - Admin
 */
router.post('/stats/reset',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const scheduler = getScheduler();
      scheduler.resetStats();
      
      res.json({
        success: true,
        message: 'Statistiques remises à zéro'
      });

    } catch (error) {
      console.error('Erreur lors de la remise à zéro des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la remise à zéro des statistiques',
        error: error.message
      });
    }
  }
);

module.exports = router;