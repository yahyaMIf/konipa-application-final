const express = require('express');
const { body, query } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Obtenir toutes les catégories
 * @access  Public
 */
router.get('/', [
  query('includeInactive').optional().isBoolean().withMessage('includeInactive doit être un booléen'),
  query('parentId').optional().isUUID().withMessage('ID parent invalide'),
  query('level').optional().isInt({ min: 0 }).withMessage('Niveau doit être un entier positif'),
  handleValidationErrors
], categoryController.getAllCategories);

/**
 * @route   GET /api/categories/tree
 * @desc    Obtenir l'arbre des catégories
 * @access  Public
 */
router.get('/tree', [
  query('includeInactive').optional().isBoolean().withMessage('includeInactive doit être un booléen'),
  handleValidationErrors
], categoryController.getCategoryTree);

/**
 * @route   GET /api/categories/:id
 * @desc    Obtenir une catégorie par ID
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   GET /api/categories/:id/products
 * @desc    Obtenir les produits d'une catégorie
 * @access  Public
 */
router.get('/:id/products', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('includeSubcategories').optional().isBoolean().withMessage('includeSubcategories doit être un booléen'),
  handleValidationErrors
], categoryController.getCategoryProducts);

/**
 * @route   POST /api/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Private (Admin/Manager)
 */
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  upload.single('image'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom de la catégorie doit contenir 2-255 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description ne peut pas dépasser 1000 caractères'),
  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Slug invalide'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('ID parent invalide'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Ordre de tri doit être un entier positif'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen'),
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta titre ne peut pas dépasser 255 caractères'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description ne peut pas dépasser 500 caractères'),
  handleValidationErrors
], categoryController.createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Mettre à jour une catégorie
 * @access  Private (Admin/Manager)
 */
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  upload.single('image'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom de la catégorie doit contenir 2-255 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description ne peut pas dépasser 1000 caractères'),
  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Slug invalide'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('ID parent invalide'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Ordre de tri doit être un entier positif'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen'),
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta titre ne peut pas dépasser 255 caractères'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description ne peut pas dépasser 500 caractères'),
  handleValidationErrors
], categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Supprimer une catégorie
 * @access  Private (Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], categoryController.deleteCategory);

/**
 * @route   PUT /api/categories/:id/move
 * @desc    Déplacer une catégorie
 * @access  Private (Admin/Manager)
 */
router.put('/:id/move', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('newParentId')
    .optional()
    .isUUID()
    .withMessage('ID nouveau parent invalide'),
  body('newSortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Nouvel ordre de tri doit être un entier positif'),
  handleValidationErrors
], categoryController.moveCategory);

/**
 * @route   GET /api/categories/:id/children
 * @desc    Obtenir les sous-catégories d'une catégorie
 * @access  Public
 */
router.get('/:id/children', [
  query('includeInactive').optional().isBoolean().withMessage('includeInactive doit être un booléen'),
  handleValidationErrors
], categoryController.getCategoryChildren);

/**
 * @route   GET /api/categories/:id/breadcrumb
 * @desc    Obtenir le fil d'Ariane d'une catégorie
 * @access  Public
 */
router.get('/:id/breadcrumb', categoryController.getCategoryBreadcrumb);

module.exports = router;