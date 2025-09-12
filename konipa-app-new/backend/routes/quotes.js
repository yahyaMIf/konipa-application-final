const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Validation middleware pour les devis
const validateQuote = [
  body('clientId')
    .notEmpty()
    .withMessage('L\'ID du client est requis')
    .isUUID()
    .withMessage('ID client invalide'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Date de validité invalide'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Au moins un article est requis'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('ID produit requis')
    .isUUID()
    .withMessage('ID produit invalide'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un entier positif'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être positif')
];

const validateQuoteUpdate = [
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Date de validité invalide'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Au moins un article est requis si fourni'),
  body('items.*.productId')
    .optional()
    .isUUID()
    .withMessage('ID produit invalide'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un entier positif'),
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être positif')
];

// Routes principales pour les devis

// GET /api/quotes - Obtenir tous les devis (avec filtres)
router.get('/', authenticateToken, quoteController.getAllQuotes);

// GET /api/quotes/my - Obtenir les devis de l'utilisateur connecté
router.get('/my', authenticateToken, quoteController.getMyQuotes);

// GET /api/quotes/client/:clientId - Obtenir les devis d'un client
router.get('/client/:clientId', authenticateToken, quoteController.getClientQuotes);

// GET /api/quotes/stats - Obtenir les statistiques des devis
router.get('/stats', authenticateToken, requireRole(['admin', 'manager']), quoteController.getQuoteStats);

// GET /api/quotes/:id - Obtenir un devis par ID
router.get('/:id', authenticateToken, quoteController.getQuoteById);

// POST /api/quotes - Créer un nouveau devis
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'sales']), validateQuote, quoteController.createQuote);

// PUT /api/quotes/:id - Mettre à jour un devis
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'sales']), validateQuoteUpdate, quoteController.updateQuote);

// PATCH /api/quotes/:id/status - Changer le statut d'un devis
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.updateQuoteStatus);

// DELETE /api/quotes/:id - Supprimer/Annuler un devis
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager']), quoteController.deleteQuote);

// Routes pour les lignes de devis

// GET /api/quotes/:quoteId/items - Obtenir les lignes d'un devis
router.get('/:quoteId/items', authenticateToken, quoteController.getQuoteItems);

// POST /api/quotes/:quoteId/items - Ajouter une ligne à un devis
router.post('/:quoteId/items', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.addQuoteItem);

// PUT /api/quotes/:quoteId/items/:itemId - Mettre à jour une ligne de devis
router.put('/:quoteId/items/:itemId', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.updateQuoteItem);

// DELETE /api/quotes/:quoteId/items/:itemId - Supprimer une ligne de devis
router.delete('/:quoteId/items/:itemId', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.removeQuoteItem);

// Routes pour les actions spéciales

// POST /api/quotes/:id/send - Envoyer un devis par email
router.post('/:id/send', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.sendQuote);

// POST /api/quotes/:id/accept - Accepter un devis (côté client)
router.post('/:id/accept', authenticateToken, quoteController.acceptQuote);

// POST /api/quotes/:id/reject - Rejeter un devis (côté client)
router.post('/:id/reject', authenticateToken, quoteController.rejectQuote);

// POST /api/quotes/:id/convert-to-order - Convertir un devis en commande
router.post('/:id/convert-to-order', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.convertToOrder);

// POST /api/quotes/:id/duplicate - Dupliquer un devis
router.post('/:id/duplicate', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.duplicateQuote);

// POST /api/quotes/:id/calculate - Recalculer les totaux d'un devis
router.post('/:id/calculate', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.calculateQuoteTotals);

// Routes pour les documents

// GET /api/quotes/:id/documents - Obtenir les documents d'un devis
router.get('/:id/documents', authenticateToken, quoteController.getQuoteDocuments);

// POST /api/quotes/:id/documents - Ajouter un document à un devis
router.post('/:id/documents', authenticateToken, requireRole(['admin', 'manager', 'sales']), quoteController.addQuoteDocument);

// Routes pour l'export

// GET /api/quotes/:id/export/pdf - Exporter un devis en PDF
router.get('/:id/export/pdf', authenticateToken, quoteController.exportQuoteToPDF);

// GET /api/quotes/:id/export/excel - Exporter un devis en Excel
router.get('/:id/export/excel', authenticateToken, quoteController.exportQuoteToExcel);

// POST /api/quotes/export/bulk - Export en masse
router.post('/export/bulk', authenticateToken, requireRole(['admin', 'manager']), quoteController.bulkExportQuotes);

// Routes pour les rapports

// GET /api/quotes/reports/conversion - Rapport de conversion devis/commandes
router.get('/reports/conversion', authenticateToken, requireRole(['admin', 'manager']), quoteController.getConversionReport);

// GET /api/quotes/reports/performance - Rapport de performance des devis
router.get('/reports/performance', authenticateToken, requireRole(['admin', 'manager']), quoteController.getPerformanceReport);

module.exports = router;