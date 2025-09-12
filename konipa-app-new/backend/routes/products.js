const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateProduct = [
  body('name')
    .notEmpty()
    .withMessage('Le nom du produit est requis')
    .isLength({ min: 2, max: 255 })
    .withMessage('Le nom doit contenir entre 2 et 255 caractères'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('base_price_ht')
    .isFloat({ min: 0 })
    .withMessage('Le prix HT doit être un nombre positif'),
  body('tva_rate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux de TVA doit être entre 0 et 100'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de catégorie invalide'),
  body('brand_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de marque invalide'),
  body('product_ref_sage')
    .optional()
    .isLength({ max: 50 })
    .withMessage('La référence Sage ne peut pas dépasser 50 caractères'),
  body('barcode')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le code-barres ne peut pas dépasser 50 caractères'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le poids doit être un nombre positif'),
  body('dimensions')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Les dimensions ne peuvent pas dépasser 100 caractères'),
  body('min_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le niveau de stock minimum doit être un entier positif'),
  body('max_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le niveau de stock maximum doit être un entier positif'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Statut invalide')
];

const validateProductUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Le nom doit contenir entre 2 et 255 caractères'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('base_price_ht')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix HT doit être un nombre positif'),
  body('tva_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux de TVA doit être entre 0 et 100'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de catégorie invalide'),
  body('brand_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de marque invalide'),
  body('product_ref_sage')
    .optional()
    .isLength({ max: 50 })
    .withMessage('La référence Sage ne peut pas dépasser 50 caractères'),
  body('barcode')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le code-barres ne peut pas dépasser 50 caractères'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le poids doit être un nombre positif'),
  body('dimensions')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Les dimensions ne peuvent pas dépasser 100 caractères'),
  body('min_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le niveau de stock minimum doit être un entier positif'),
  body('max_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le niveau de stock maximum doit être un entier positif'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Statut invalide')
];

const validateStockUpdate = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('La quantité doit être un entier positif'),
  body('operation')
    .optional()
    .isIn(['set', 'add', 'subtract'])
    .withMessage('Opération invalide (set, add, subtract)'),
  body('warehouse_location')
    .optional()
    .isLength({ max: 50 })
    .withMessage('L\'emplacement ne peut pas dépasser 50 caractères')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID invalide')
];

// Routes publiques (avec authentification)

/**
 * @route GET /api/products
 * @desc Récupérer tous les produits avec filtres et pagination
 * @access Private
 */
router.get('/', 
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
    query('category_id').optional().isInt({ min: 1 }).withMessage('ID de catégorie invalide'),
    query('brand_id').optional().isInt({ min: 1 }).withMessage('ID de marque invalide'),
    query('min_price').optional().isFloat({ min: 0 }).withMessage('Prix minimum invalide'),
    query('max_price').optional().isFloat({ min: 0 }).withMessage('Prix maximum invalide'),
    query('sort_by').optional().isIn(['name', 'base_price_ht', 'created_at', 'updated_at']).withMessage('Tri invalide'),
    query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('Ordre de tri invalide')
  ],
  ProductController.getProducts
);

/**
 * @route GET /api/products/categories
 * @desc Récupérer les catégories de produits
 * @access Private
 */
router.get('/categories', 
  authenticateToken,
  ProductController.getCategories
);

/**
 * @route GET /api/products/brands
 * @desc Récupérer les marques de produits
 * @access Private
 */
router.get('/brands', 
  authenticateToken,
  ProductController.getBrands
);

/**
 * @route GET /api/products/low-stock
 * @desc Récupérer les produits en rupture de stock
 * @access Private
 */
router.get('/low-stock', 
  authenticateToken,
  [query('threshold').optional().isInt({ min: 1 }).withMessage('Seuil invalide')],
  ProductController.getLowStock
);

/**
 * @route GET /api/products/stats
 * @desc Récupérer les statistiques des produits
 * @access Private (Admin/Manager)
 */
router.get('/stats', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  ProductController.getStats
);

/**
 * @route GET /api/products/:id
 * @desc Récupérer un produit par ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  validateId,
  ProductController.getProductById
);

/**
 * @route GET /api/products/:id/price
 * @desc Calculer le prix d'un produit pour un client
 * @access Private
 */
router.get('/:id/price', 
  authenticateToken,
  [
    ...validateId,
    query('client_id').isInt({ min: 1 }).withMessage('ID client requis'),
    query('quantity').optional().isInt({ min: 1 }).withMessage('Quantité invalide')
  ],
  ProductController.calculatePrice
);

/**
 * @route GET /api/products/:id/substitutes
 * @desc Récupérer les produits de substitution
 * @access Private
 */
router.get('/:id/substitutes', 
  authenticateToken,
  validateId,
  ProductController.getSubstitutes
);

// Routes d'administration (admin/manager uniquement)

/**
 * @route POST /api/products
 * @desc Créer un nouveau produit
 * @access Private (Admin/Manager)
 */
router.post('/', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateProduct,
  ProductController.createProduct
);

/**
 * @route PUT /api/products/:id
 * @desc Mettre à jour un produit
 * @access Private (Admin/Manager)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [...validateId, ...validateProductUpdate],
  ProductController.updateProduct
);

/**
 * @route DELETE /api/products/:id
 * @desc Supprimer un produit
 * @access Private (Admin only)
 */
router.delete('/:id', 
  authenticateToken,
  requireRole(['admin']),
  validateId,
  ProductController.deleteProduct
);

/**
 * @route PUT /api/products/:id/stock
 * @desc Mettre à jour le stock d'un produit
 * @access Private (Admin/Manager)
 */
router.put('/:id/stock', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [...validateId, ...validateStockUpdate],
  ProductController.updateStock
);

/**
 * @route POST /api/products/:id/sync-sage
 * @desc Synchroniser un produit avec Sage
 * @access Private (Admin/Manager)
 */
router.post('/:id/sync-sage', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateId,
  ProductController.syncProductToSage
);

// Routes pour la gestion des substituts (futures implémentations)

/**
 * @route POST /api/products/:id/substitutes
 * @desc Ajouter un produit de substitution
 * @access Private (Admin/Manager)
 */
router.post('/:id/substitutes', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    ...validateId,
    body('substitute_product_id').isInt({ min: 1 }).withMessage('ID du produit de substitution requis'),
    body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priorité invalide (1-10)')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { substitute_product_id, priority = 1 } = req.body;

      const { ProductSubstitute } = require('../models');
      
      // Vérifier que les produits existent
      const { Product } = require('../models');
      const [product, substituteProduct] = await Promise.all([
        Product.findByPk(id),
        Product.findByPk(substitute_product_id)
      ]);

      if (!product || !substituteProduct) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Vérifier que ce n'est pas le même produit
      if (id === substitute_product_id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Un produit ne peut pas être son propre substitut'
        });
      }

      // Vérifier si la relation existe déjà
      const existingSubstitute = await ProductSubstitute.findOne({
        where: {
          product_id: id,
          substitute_product_id
        }
      });

      if (existingSubstitute) {
        return res.status(400).json({
          success: false,
          message: 'Cette relation de substitution existe déjà'
        });
      }

      // Créer la relation de substitution
      const substitute = await ProductSubstitute.create({
        product_id: id,
        substitute_product_id,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Produit de substitution ajouté avec succès',
        data: substitute
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du substitut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du produit de substitution',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/products/:id/substitutes/:substitute_id
 * @desc Supprimer un produit de substitution
 * @access Private (Admin/Manager)
 */
router.delete('/:id/substitutes/:substitute_id', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    param('substitute_id').isInt({ min: 1 }).withMessage('ID de substitut invalide')
  ],
  async (req, res) => {
    try {
      const { id, substitute_id } = req.params;

      const { ProductSubstitute } = require('../models');
      
      const substitute = await ProductSubstitute.findOne({
        where: {
          product_id: id,
          substitute_product_id: substitute_id
        }
      });

      if (!substitute) {
        return res.status(404).json({
          success: false,
          message: 'Relation de substitution non trouvée'
        });
      }

      await substitute.destroy();

      res.json({
        success: true,
        message: 'Produit de substitution supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du substitut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du produit de substitution',
        error: error.message
      });
    }
  }
);

// Routes d'export
router.get('/export/excel', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    query('category_id').optional().isInt({ min: 1 }).withMessage('ID de catégorie invalide'),
    query('brand_id').optional().isInt({ min: 1 }).withMessage('ID de marque invalide'),
    query('status').optional().isIn(['active', 'inactive', 'discontinued']).withMessage('Statut invalide'),
    query('in_stock_only').optional().isBoolean().withMessage('in_stock_only doit être un booléen')
  ],
  ProductController.exportProductsToExcel
);

router.get('/export/csv', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    query('category_id').optional().isInt({ min: 1 }).withMessage('ID de catégorie invalide'),
    query('brand_id').optional().isInt({ min: 1 }).withMessage('ID de marque invalide'),
    query('status').optional().isIn(['active', 'inactive', 'discontinued']).withMessage('Statut invalide'),
    query('in_stock_only').optional().isBoolean().withMessage('in_stock_only doit être un booléen')
  ],
  ProductController.exportProductsToCSV
);

module.exports = router;