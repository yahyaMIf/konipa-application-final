const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');

// Routes pour les commandes

// GET /api/orders - Obtenir toutes les commandes (avec filtres)
router.get('/', authenticateToken, orderController.getAllOrders);

// GET /api/orders/stats - Obtenir les statistiques des commandes
router.get('/stats', authenticateToken, requireRole(['admin', 'manager']), orderController.getOrderStatistics);

// GET /api/orders/:id - Obtenir une commande par ID
router.get('/:id', authenticateToken, orderController.getOrderById);

// POST /api/orders - Créer une nouvelle commande
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'sales']), validateOrder, orderController.createOrder);

// PUT /api/orders/:id - Mettre à jour une commande
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'sales']), validateOrder, orderController.updateOrder);

// DELETE /api/orders/:id - Supprimer une commande
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), orderController.deleteOrder);

// Routes d'export
// GET /api/orders/export/excel - Exporter les commandes en Excel
router.get('/export/excel', authenticateToken, requireRole(['admin', 'manager']), orderController.exportOrdersToExcel);

// GET /api/orders/export/csv - Exporter les commandes en CSV
router.get('/export/csv', authenticateToken, requireRole(['admin', 'manager']), orderController.exportOrdersToCSV);

// GET /api/orders/export/pdf - Exporter les commandes en PDF
router.get('/export/pdf', authenticateToken, requireRole(['admin', 'manager']), orderController.exportOrdersToPDF);

module.exports = router;