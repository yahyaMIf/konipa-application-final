const express = require('express');
const router = express.Router();
const {
  testConnection,
  getConfiguration,
  syncClient,
  syncProduct,
  syncOrder,
  getSyncLogs,
  getSyncStats,
  forceSyncAll
} = require('../controllers/sageController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * @route POST /api/sage/sync/clients
 * @desc Synchroniser les clients depuis Sage
 * @access Private - Admin/CEO
 */
router.post('/sync/clients', 
  authenticateToken, 
  requireRole(['CEO', 'admin']), 
  syncClient
);

/**
 * @route POST /api/sage/sync/products
 * @desc Synchroniser les produits depuis Sage
 * @access Private - Admin/CEO
 */
router.post('/sync/products', 
  authenticateToken, 
  requireRole(['CEO', 'admin']), 
  syncProduct
);

/**
 * @route POST /api/sage/sync/orders
 * @desc Synchroniser les commandes vers Sage
 * @access Private - Admin/CEO
 */
router.post('/sync/orders', 
  authenticateToken, 
  requireRole(['CEO', 'admin']), 
  syncOrder
);

/**
 * @route POST /api/sage/sync/prices
 * @desc Synchroniser les prix et remises depuis Sage
 * @access Private - Admin/CEO
 */
router.get('/config', 
  authenticateToken, 
  requireRole(['CEO', 'admin']), 
  getConfiguration
);

/**
 * @route POST /api/sage/sync/all
 * @desc Synchronisation complète forcée
 * @access Private - CEO only
 */
router.post('/sync/all', 
  authenticateToken, 
  requireRole(['CEO']), 
  forceSyncAll
);

/**
 * @route GET /api/sage/sync/status
 * @desc Obtenir le statut de la dernière synchronisation
 * @access Private
 */
router.get('/sync/logs', 
  authenticateToken, 
  getSyncLogs
);

router.get('/sync/stats', 
  authenticateToken, 
  getSyncStats
);

router.get('/test', 
  authenticateToken, 
  requireRole(['CEO', 'admin']), 
  testConnection
);

module.exports = router;