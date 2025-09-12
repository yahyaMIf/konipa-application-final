const express = require('express');
const { body } = require('express-validator');
const accountRequestController = require('../controllers/accountRequestController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/account-requests
 * @desc    Obtenir toutes les demandes de compte en attente
 * @access  Private (Admin)
 */
router.get('/', [
  authenticateToken,
  requireRole(['admin'])
], accountRequestController.getAllAccountRequests);

/**
 * @route   POST /api/account-requests
 * @desc    Créer une nouvelle demande de compte
 * @access  Public
 */
router.post('/', [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Prénom doit contenir 2-50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nom doit contenir 2-50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s\-\(\)]{8,20}$/)
    .withMessage('Numéro de téléphone invalide'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Nom de l\'entreprise trop long'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Adresse trop longue'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Ville trop longue'),
  body('postalCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Code postal invalide'),
  body('requestedRole')
    .optional()
    .isIn(['client', 'commercial', 'comptoir'])
    .withMessage('Rôle demandé invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes trop longues'),
  handleValidationErrors
], accountRequestController.createAccountRequest);

/**
 * @route   POST /api/account-requests/:requestId/approve
 * @desc    Approuver une demande de compte
 * @access  Private (Admin)
 */
router.post('/:requestId/approve', [
  authenticateToken,
  requireRole(['admin']),
  body('assignedRole')
    .optional()
    .isIn(['client', 'commercial', 'comptoir', 'comptabilite'])
    .withMessage('Rôle assigné invalide'),
  body('creditLimit')
    .optional()
    .isNumeric()
    .withMessage('Limite de crédit doit être un nombre'),
  handleValidationErrors
], accountRequestController.approveAccountRequest);

/**
 * @route   POST /api/account-requests/:requestId/reject
 * @desc    Rejeter une demande de compte
 * @access  Private (Admin)
 */
router.post('/:requestId/reject', [
  authenticateToken,
  requireRole(['admin']),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Raison du rejet trop longue'),
  handleValidationErrors
], accountRequestController.rejectAccountRequest);

module.exports = router;