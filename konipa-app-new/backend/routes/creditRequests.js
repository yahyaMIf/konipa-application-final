const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  createCreditRequest,
  getCreditRequests,
  processCreditRequest,
  getCreditRequestStats,
  exportCreditRequestsToExcel,
  exportCreditRequestsToCSV
} = require('../controllers/creditRequestController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Créer une nouvelle demande d'augmentation de limite
// Accessible aux clients et aux commerciaux
router.post('/', 
  authenticateToken,
  [
    body('client_id').isUUID().withMessage('ID client requis et valide'),
    body('requested_amount').isNumeric().withMessage('Montant demandé requis'),
    body('reason').isLength({ min: 1, max: 500 }).withMessage('Raison requise (max 500 caractères)')
  ],
  createCreditRequest
);

// Obtenir toutes les demandes (avec filtres)
// Accessible aux administrateurs, CEO, comptables
router.get('/', authenticateToken, requireRole(['admin', 'ceo', 'accountant', 'compta']), getCreditRequests);

// Obtenir les statistiques des demandes
// Accessible aux administrateurs, CEO, comptables
router.get('/stats', authenticateToken, requireRole(['admin', 'ceo', 'accountant', 'compta']), getCreditRequestStats);

// Traiter une demande (approuver/rejeter)
// Accessible aux administrateurs, CEO, comptables
router.patch('/:requestId/process', authenticateToken, requireRole(['admin', 'ceo', 'accountant', 'compta']), processCreditRequest);

// Obtenir les demandes d'un client spécifique
// Accessible au client lui-même ou aux administrateurs
router.get('/client/:clientId', authenticateToken, async (req, res, next) => {
  // Vérifier si l'utilisateur peut accéder aux demandes de ce client
  const { clientId } = req.params;
  const userRole = req.user.role;
  const userId = req.user.id;
  
  // Les administrateurs peuvent voir toutes les demandes
  if (['admin', 'ceo', 'accountant', 'compta', 'commercial'].includes(userRole)) {
    return next();
  }
  
  // Les clients ne peuvent voir que leurs propres demandes
  if (userRole === 'client' && userId === clientId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Accès non autorisé' });
}, getCreditRequests);

// Routes d'export
// Exporter les demandes de crédit vers Excel
router.get('/export/excel', authenticateToken, requireRole(['admin', 'ceo', 'accountant', 'compta']), exportCreditRequestsToExcel);

// Exporter les demandes de crédit vers CSV
router.get('/export/csv', authenticateToken, requireRole(['admin', 'ceo', 'accountant', 'compta']), exportCreditRequestsToCSV);

module.exports = router;