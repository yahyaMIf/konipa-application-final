const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Routes pour les utilisateurs authentifiés

// Obtenir les notifications de l'utilisateur connecté
router.get('/', authenticateToken, notificationController.getUserNotifications);

// Marquer une notification comme lue
router.patch('/:notificationId/read', authenticateToken, notificationController.markNotificationAsRead);

// Marquer toutes les notifications comme lues
router.patch('/mark-all-read', authenticateToken, notificationController.markAllNotificationsAsRead);

// Supprimer une notification
router.delete('/:notificationId', authenticateToken, notificationController.deleteNotification);

// Obtenir les statistiques des notifications
router.get('/stats', authenticateToken, notificationController.getNotificationStats);

// Routes pour les administrateurs

// Créer une notification (admin seulement)
router.post('/', 
  authenticateToken, 
  requireRole(['admin', 'ceo', 'accountant']), 
  notificationController.createNotification
);

// Obtenir toutes les notifications (admin seulement)
router.get('/admin/all', 
  authenticateToken, 
  requireRole(['admin', 'ceo']), 
  notificationController.getAllNotifications
);

module.exports = router;