const express = require('express');
const { body, query } = require('express-validator');
const brandController = require('../controllers/brandController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/brands
 * @desc    Obtenir toutes les marques
 * @access  Public
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Terme de recherche invalide'),
  query('isActive').optional().isBoolean().withMessage('isActive doit être un booléen'),
  query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Ordre de tri invalide'),
  handleValidationErrors
], brandController.getAllBrands);

/**
 * @route   GET /api/brands/featured
 * @desc    Obtenir les marques en vedette
 * @access  Public
 */
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite doit être entre 1 et 50'),
  handleValidationErrors
], brandController.getAllBrands);

/**
 * @route   GET /api/brands/stats/summary
 * @desc    Obtenir les statistiques des marques
 * @access  Private (Admin, Manager)
 */
router.get('/stats/summary', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], brandController.getAllBrands);

/**
 * @route   GET /api/brands/:id
 * @desc    Obtenir une marque par ID
 * @access  Public
 */
router.get('/:id', brandController.getBrandById);

/**
 * @route   GET /api/brands/:id/products
 * @desc    Obtenir les produits d'une marque
 * @access  Public
 */
router.get('/:id/products', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('categoryId').optional().isUUID().withMessage('ID catégorie invalide'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Prix minimum invalide'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Prix maximum invalide'),
  query('inStock').optional().isBoolean().withMessage('inStock doit être un booléen'),
  query('sortBy').optional().isIn(['name', 'price', 'createdAt', 'stock']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Ordre de tri invalide'),
  handleValidationErrors
], brandController.getBrandProducts);

/**
 * @route   POST /api/brands
 * @desc    Créer une nouvelle marque
 * @access  Private (Admin/Manager)
 */
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom de la marque doit contenir 2-255 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description ne peut pas dépasser 2000 caractères'),
  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Slug invalide'),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL du site web invalide'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email invalide'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Adresse ne peut pas dépasser 500 caractères'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Pays doit contenir 2-100 caractères'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured doit être un booléen'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Ordre de tri doit être un entier positif'),
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
], brandController.createBrand);

/**
 * @route   PUT /api/brands/:id
 * @desc    Mettre à jour une marque
 * @access  Private (Admin/Manager)
 */
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom de la marque doit contenir 2-255 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description ne peut pas dépasser 2000 caractères'),
  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Slug invalide'),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL du site web invalide'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email invalide'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Adresse ne peut pas dépasser 500 caractères'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Pays doit contenir 2-100 caractères'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured doit être un booléen'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Ordre de tri doit être un entier positif'),
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
], brandController.updateBrand);

/**
 * @route   DELETE /api/brands/:id
 * @desc    Supprimer une marque
 * @access  Private (Admin)
 */
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], brandController.deleteBrand);

/**
 * @route   DELETE /api/brands/:id/logo
 * @desc    Supprimer le logo d'une marque
 * @access  Private (Admin/Manager)
 */
router.delete('/:id/logo', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], brandController.deleteBrandLogo);

/**
 * @route   DELETE /api/brands/:id/banner
 * @desc    Supprimer la bannière d'une marque
 * @access  Private (Admin/Manager)
 */
router.delete('/:id/banner', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], brandController.deleteBrandBanner);

module.exports = router;