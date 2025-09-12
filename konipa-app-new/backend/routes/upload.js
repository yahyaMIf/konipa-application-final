const express = require('express');
const { body, query } = require('express-validator');
const uploadController = require('../controllers/uploadController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { upload } = require('../controllers/uploadController');

const router = express.Router();

/**
 * @route   POST /api/upload/single
 * @desc    Upload d'un seul fichier
 * @access  Private (Admin/Manager/Employee)
 */
router.post('/single', [
  authenticateToken,
  requireRole(['admin', 'manager', 'employee']),
  upload.single('file'),
  body('category')
    .optional()
    .isIn(['product', 'category', 'brand', 'user', 'general'])
    .withMessage('Catégorie invalide'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description ne peut pas dépasser 500 caractères'),
  handleValidationErrors
], uploadController.uploadSingle);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload de plusieurs fichiers
 * @access  Private (Admin/Manager/Employee)
 */
router.post('/multiple', [
  authenticateToken,
  requireRole(['admin', 'manager', 'employee']),
  upload.array('files', 10), // Maximum 10 fichiers
  body('category')
    .optional()
    .isIn(['product', 'category', 'brand', 'user', 'general'])
    .withMessage('Catégorie invalide'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description ne peut pas dépasser 500 caractères'),
  handleValidationErrors
], uploadController.uploadMultiple);

/**
 * @route   POST /api/upload/product-images
 * @desc    Upload d'images pour un produit
 * @access  Private (Admin/Manager/Employee)
 */
router.post('/product-images', [
  authenticateToken,
  requireRole(['admin', 'manager', 'employee']),
  upload.array('images', 5), // Maximum 5 images par produit
  body('productId')
    .isUUID()
    .withMessage('ID produit invalide'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary doit être un booléen'),
  body('altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Texte alternatif ne peut pas dépasser 255 caractères'),
  handleValidationErrors
], uploadController.uploadProductImages);

/**
 * @route   POST /api/upload/category-image
 * @desc    Upload d'image pour une catégorie
 * @access  Private (Admin/Manager)
 */
router.post('/category-image', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  upload.single('image'),
  body('categoryId')
    .isUUID()
    .withMessage('ID catégorie invalide'),
  body('altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Texte alternatif ne peut pas dépasser 255 caractères'),
  handleValidationErrors
], uploadController.uploadCategoryImage);

/**
 * @route   POST /api/upload/brand-logo
 * @desc    Upload de logo pour une marque
 * @access  Private (Admin/Manager)
 */
router.post('/brand-logo', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  upload.single('logo'),
  body('brandId')
    .isUUID()
    .withMessage('ID marque invalide'),
  body('altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Texte alternatif ne peut pas dépasser 255 caractères'),
  handleValidationErrors
], uploadController.uploadBrandLogo);

/**
 * @route   POST /api/upload/brand-banner
 * @desc    Upload de bannière pour une marque
 * @access  Private (Admin/Manager)
 */
router.post('/brand-banner', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  upload.single('banner'),
  body('brandId')
    .isUUID()
    .withMessage('ID marque invalide'),
  body('altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Texte alternatif ne peut pas dépasser 255 caractères'),
  handleValidationErrors
], uploadController.uploadBrandBanner);

/**
 * @route   POST /api/upload/user-avatar
 * @desc    Upload d'avatar pour un utilisateur
 * @access  Private
 */
router.post('/user-avatar', [
  authenticateToken,
  upload.single('avatar'),
  body('userId')
    .optional()
    .isUUID()
    .withMessage('ID utilisateur invalide'),
  handleValidationErrors
], uploadController.uploadUserAvatar);

/**
 * @route   GET /api/upload/files
 * @desc    Obtenir la liste des fichiers uploadés
 * @access  Private (Admin/Manager)
 */
router.get('/files', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
  query('category').optional().isIn(['product', 'category', 'brand', 'user', 'general']).withMessage('Catégorie invalide'),
  query('fileType').optional().isIn(['image', 'document', 'video', 'audio']).withMessage('Type de fichier invalide'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Terme de recherche invalide'),
  query('sortBy').optional().isIn(['filename', 'size', 'createdAt', 'category']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Ordre de tri invalide'),
  handleValidationErrors
], uploadController.getFiles);

/**
 * @route   GET /api/upload/files/:id
 * @desc    Obtenir les détails d'un fichier
 * @access  Private (Admin/Manager)
 */
router.get('/files/:id', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], uploadController.getFileById);

/**
 * @route   DELETE /api/upload/files/:id
 * @desc    Supprimer un fichier
 * @access  Private (Admin/Manager)
 */
router.delete('/files/:id', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], uploadController.deleteFile);

/**
 * @route   DELETE /api/upload/files
 * @desc    Supprimer plusieurs fichiers
 * @access  Private (Admin)
 */
router.delete('/files', [
  authenticateToken,
  requireRole(['admin']),
  body('fileIds')
    .isArray({ min: 1 })
    .withMessage('Au moins un ID de fichier requis'),
  body('fileIds.*')
    .isUUID()
    .withMessage('ID de fichier invalide'),
  handleValidationErrors
], uploadController.deleteMultipleFiles);

/**
 * @route   PUT /api/upload/files/:id
 * @desc    Mettre à jour les métadonnées d'un fichier
 * @access  Private (Admin/Manager)
 */
router.put('/files/:id', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('filename')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nom de fichier doit contenir 1-255 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description ne peut pas dépasser 500 caractères'),
  body('altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Texte alternatif ne peut pas dépasser 255 caractères'),
  body('category')
    .optional()
    .isIn(['product', 'category', 'brand', 'user', 'general'])
    .withMessage('Catégorie invalide'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags doivent être un tableau'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Chaque tag doit contenir 1-50 caractères'),
  handleValidationErrors
], uploadController.updateFileMetadata);

/**
 * @route   GET /api/upload/stats
 * @desc    Obtenir les statistiques des uploads
 * @access  Private (Admin/Manager)
 */
router.get('/stats', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], uploadController.getUploadStats);

/**
 * @route   POST /api/upload/cleanup
 * @desc    Nettoyer les fichiers orphelins
 * @access  Private (Admin)
 */
router.post('/cleanup', [
  authenticateToken,
  requireRole(['admin']),
  body('dryRun')
    .optional()
    .isBoolean()
    .withMessage('dryRun doit être un booléen'),
  body('olderThanDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('olderThanDays doit être un entier positif'),
  handleValidationErrors
], uploadController.cleanupOrphanedFiles);

/**
 * @route   GET /api/upload/serve/:filename
 * @desc    Servir un fichier uploadé
 * @access  Public
 */
router.get('/serve/:filename', uploadController.serveFile);

/**
 * @route   GET /api/upload/download/:id
 * @desc    Télécharger un fichier par ID
 * @access  Private
 */
router.get('/download/:id', [
  authenticateToken
], uploadController.downloadFile);

/**
 * @route   POST /api/upload/resize-image
 * @desc    Redimensionner une image
 * @access  Private (Admin/Manager/Employee)
 */
router.post('/resize-image', [
  authenticateToken,
  requireRole(['admin', 'manager', 'employee']),
  body('fileId')
    .isUUID()
    .withMessage('ID fichier invalide'),
  body('width')
    .isInt({ min: 1, max: 4000 })
    .withMessage('Largeur doit être entre 1 et 4000 pixels'),
  body('height')
    .isInt({ min: 1, max: 4000 })
    .withMessage('Hauteur doit être entre 1 et 4000 pixels'),
  body('quality')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Qualité doit être entre 1 et 100'),
  body('format')
    .optional()
    .isIn(['jpeg', 'png', 'webp'])
    .withMessage('Format invalide'),
  handleValidationErrors
], uploadController.resizeImage);

module.exports = router;