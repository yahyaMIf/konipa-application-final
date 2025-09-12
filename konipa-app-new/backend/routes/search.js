/**
 * Routes pour la recherche intelligente
 */

const express = require('express');
const router = express.Router();
const intelligentSearchService = require('../services/intelligentSearchService');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/search/intelligent
 * @desc Recherche intelligente de produits
 * @access Public
 */
router.post('/intelligent', async (req, res) => {
  try {
    const {
      query,
      limit = 50,
      offset = 0,
      category = null,
      brand = null,
      minPrice = null,
      maxPrice = null,
      inStock = null,
      sortBy = 'relevance'
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La requête de recherche est requise'
      });
    }

    const options = {
      limit: Math.min(parseInt(limit) || 50, 100), // Limiter à 100 max
      offset: parseInt(offset) || 0,
      category,
      brand,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      inStock: inStock !== null ? Boolean(inStock) : null,
      sortBy
    };

    const result = await intelligentSearchService.search(query.trim(), options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la recherche intelligente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/search/suggestions
 * @desc Obtenir des suggestions de recherche
 * @access Public
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await intelligentSearchService.getSuggestions(
      query.trim(),
      Math.min(parseInt(limit) || 5, 10)
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Erreur lors de la génération de suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/search/similar/:productId
 * @desc Trouver des produits similaires
 * @access Public
 */
router.get('/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'ID du produit requis'
      });
    }

    const similarProducts = await intelligentSearchService.findSimilarProducts(
      productId,
      Math.min(parseInt(limit) || 5, 10)
    );

    res.json({
      success: true,
      data: similarProducts
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de produits similaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/search/parse
 * @desc Parser une désignation de produit
 * @access Public
 */
router.post('/parse', async (req, res) => {
  try {
    const { designation } = req.body;

    if (!designation) {
      return res.status(400).json({
        success: false,
        message: 'La désignation est requise'
      });
    }

    const designationParser = require('../utils/parseDesignation');
    const parsed = designationParser.parse(designation);

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    console.error('Erreur lors du parsing de la désignation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/search/cache
 * @desc Vider le cache de recherche (Admin seulement)
 * @access Private/Admin
 */
router.delete('/cache', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Admin requis'
      });
    }

    intelligentSearchService.clearCache();

    res.json({
      success: true,
      message: 'Cache vidé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du vidage du cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/search/cache/stats
 * @desc Obtenir les statistiques du cache (Admin seulement)
 * @access Private/Admin
 */
router.get('/cache/stats', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Admin requis'
      });
    }

    const stats = intelligentSearchService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats du cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/search/health
 * @desc Vérifier l'état du service de recherche
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    // Test simple de parsing
    const designationParser = require('../utils/parseDesignation');
    const testParse = designationParser.parse('RENAULT CLIO FILTRE');
    
    // Test du cache
    const cacheStats = intelligentSearchService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        parser: {
          working: testParse.confidence > 0,
          testResult: testParse
        },
        cache: {
          working: true,
          stats: cacheStats
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors du check de santé:', error);
    res.status(500).json({
      success: false,
      message: 'Service de recherche non disponible',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;