/**
 * Service de recherche intelligente backend
 * Utilise parseDesignation.js pour améliorer la recherche de produits
 */

const designationParser = require('../utils/parseDesignation');
const Product = require('../models/Product');
const NodeCache = require('node-cache');

class IntelligentSearchService {
  constructor() {
    // Cache pour les résultats de recherche (TTL: 5 minutes)
    this.searchCache = new NodeCache({ stdTTL: 300 });
    
    // Cache pour les suggestions (TTL: 1 heure)
    this.suggestionCache = new NodeCache({ stdTTL: 3600 });
  }

  /**
   * Recherche intelligente de produits
   */
  async search(query, options = {}) {
    const {
      limit = 50,
      offset = 0,
      category = null,
      brand = null,
      minPrice = null,
      maxPrice = null,
      inStock = null,
      sortBy = 'relevance'
    } = options;

    // Vérifier le cache
    const cacheKey = this.generateCacheKey(query, options);
    const cachedResult = this.searchCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Parser la requête
      const parsedQuery = designationParser.parse(query);
      
      // Construire la requête MongoDB
      const mongoQuery = this.buildMongoQuery(parsedQuery, {
        category,
        brand,
        minPrice,
        maxPrice,
        inStock
      });

      // Exécuter la recherche
      let products = await Product.find(mongoQuery)
        .populate('category', 'name')
        .populate('brand', 'name')
        .lean();

      // Filtrer et scorer avec le parser
      if (parsedQuery.confidence > 0) {
        products = designationParser.filterProducts(products, parsedQuery);
      }

      // Trier les résultats
      products = this.sortProducts(products, sortBy, parsedQuery);

      // Pagination
      const total = products.length;
      const paginatedProducts = products.slice(offset, offset + limit);

      const result = {
        products: paginatedProducts,
        total,
        parsedQuery,
        suggestions: this.generateSearchSuggestions(parsedQuery),
        hasMore: offset + limit < total
      };

      // Mettre en cache
      this.searchCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Erreur lors de la recherche intelligente:', error);
      throw error;
    }
  }

  /**
   * Construit la requête MongoDB basée sur les données parsées
   */
  buildMongoQuery(parsedQuery, filters) {
    const query = { active: true };
    const searchConditions = [];

    // Conditions basées sur le parsing
    if (parsedQuery.confidence > 0) {
      const { brand, model, partType } = parsedQuery;

      if (brand) {
        searchConditions.push({
          $or: [
            { 'brand.name': new RegExp(brand, 'i') },
            { name: new RegExp(brand, 'i') },
            { description: new RegExp(brand, 'i') }
          ]
        });
      }

      if (model) {
        searchConditions.push({
          $or: [
            { name: new RegExp(model, 'i') },
            { description: new RegExp(model, 'i') },
            { compatibility: new RegExp(model, 'i') }
          ]
        });
      }

      if (partType) {
        searchConditions.push({
          $or: [
            { name: new RegExp(partType, 'i') },
            { description: new RegExp(partType, 'i') },
            { 'category.name': new RegExp(partType, 'i') }
          ]
        });
      }
    } else {
      // Recherche textuelle classique si le parsing n'a pas donné de résultats
      const searchText = parsedQuery.originalText;
      if (searchText) {
        searchConditions.push({
          $or: [
            { name: new RegExp(searchText, 'i') },
            { description: new RegExp(searchText, 'i') },
            { reference: new RegExp(searchText, 'i') },
            { 'brand.name': new RegExp(searchText, 'i') }
          ]
        });
      }
    }

    if (searchConditions.length > 0) {
      query.$and = searchConditions;
    }

    // Filtres additionnels
    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.brand) {
      query.brand = filters.brand;
    }

    if (filters.minPrice !== null || filters.maxPrice !== null) {
      query.price = {};
      if (filters.minPrice !== null) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== null) query.price.$lte = filters.maxPrice;
    }

    if (filters.inStock !== null) {
      if (filters.inStock) {
        query.stock = { $gt: 0 };
      } else {
        query.stock = { $lte: 0 };
      }
    }

    return query;
  }

  /**
   * Trie les produits selon le critère spécifié
   */
  sortProducts(products, sortBy, parsedQuery) {
    switch (sortBy) {
      case 'relevance':
        return products.sort((a, b) => {
          const scoreA = a.relevanceScore || 0;
          const scoreB = b.relevanceScore || 0;
          return scoreB - scoreA;
        });
      
      case 'price_asc':
        return products.sort((a, b) => a.price - b.price);
      
      case 'price_desc':
        return products.sort((a, b) => b.price - a.price);
      
      case 'name_asc':
        return products.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'name_desc':
        return products.sort((a, b) => b.name.localeCompare(a.name));
      
      case 'rating':
        return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      case 'newest':
        return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      default:
        return products;
    }
  }

  /**
   * Génère des suggestions de recherche
   */
  generateSearchSuggestions(parsedQuery) {
    const suggestions = [];
    const { brand, model, partType, originalText } = parsedQuery;

    // Suggestions basées sur les éléments parsés
    if (brand && !model) {
      // Suggérer des modèles pour cette marque
      const models = designationParser.models[brand] || [];
      models.slice(0, 3).forEach(modelName => {
        suggestions.push(`${brand} ${modelName}`);
      });
    }

    if (brand && !partType) {
      // Suggérer des types de pièces pour cette marque
      ['FILTRE', 'PLAQUETTE', 'DISQUE', 'AMORTISSEUR'].forEach(type => {
        suggestions.push(`${brand} ${type}`);
      });
    }

    if (partType && !brand) {
      // Suggérer des marques pour ce type de pièce
      ['RENAULT', 'PEUGEOT', 'CITROEN', 'VOLKSWAGEN'].forEach(brandName => {
        suggestions.push(`${brandName} ${partType}`);
      });
    }

    // Suggestions génériques si pas assez d'éléments parsés
    if (suggestions.length === 0) {
      const genericSuggestions = designationParser.generateSuggestions(originalText, 5);
      suggestions.push(...genericSuggestions);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Recherche de suggestions en temps réel
   */
  async getSuggestions(partialQuery, limit = 5) {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    const cacheKey = `suggestions_${partialQuery}_${limit}`;
    const cached = this.suggestionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Suggestions du parser
      const parserSuggestions = designationParser.generateSuggestions(partialQuery, limit);
      
      // Suggestions basées sur les produits existants
      const productSuggestions = await this.getProductBasedSuggestions(partialQuery, limit);
      
      // Combiner et dédupliquer
      const allSuggestions = [...parserSuggestions, ...productSuggestions];
      const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, limit);
      
      this.suggestionCache.set(cacheKey, uniqueSuggestions);
      return uniqueSuggestions;
    } catch (error) {
      console.error('Erreur lors de la génération de suggestions:', error);
      return [];
    }
  }

  /**
   * Génère des suggestions basées sur les produits existants
   */
  async getProductBasedSuggestions(partialQuery, limit) {
    try {
      const regex = new RegExp(partialQuery, 'i');
      
      const products = await Product.find({
        $or: [
          { name: regex },
          { description: regex }
        ],
        active: true
      })
      .select('name')
      .limit(limit * 2)
      .lean();

      return products
        .map(p => p.name)
        .filter(name => name.toLowerCase().includes(partialQuery.toLowerCase()))
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la recherche de suggestions produits:', error);
      return [];
    }
  }

  /**
   * Recherche de produits similaires
   */
  async findSimilarProducts(productId, limit = 5) {
    try {
      const product = await Product.findById(productId).lean();
      if (!product) {
        return [];
      }

      // Parser la désignation du produit
      const parsedProduct = designationParser.parse(`${product.name} ${product.description || ''}`);
      
      // Rechercher des produits similaires
      const similarQuery = this.buildMongoQuery(parsedProduct, {});
      similarQuery._id = { $ne: productId }; // Exclure le produit actuel
      
      let similarProducts = await Product.find(similarQuery)
        .populate('category', 'name')
        .populate('brand', 'name')
        .limit(limit * 2)
        .lean();

      // Scorer et trier
      similarProducts = designationParser.filterProducts(similarProducts, parsedProduct);
      similarProducts = this.sortProducts(similarProducts, 'relevance', parsedProduct);
      
      return similarProducts.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la recherche de produits similaires:', error);
      return [];
    }
  }

  /**
   * Génère une clé de cache
   */
  generateCacheKey(query, options) {
    const optionsStr = JSON.stringify(options);
    return `search_${Buffer.from(query + optionsStr).toString('base64')}`;
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this.searchCache.flushAll();
    this.suggestionCache.flushAll();
  }

  /**
   * Statistiques du cache
   */
  getCacheStats() {
    return {
      searchCache: this.searchCache.getStats(),
      suggestionCache: this.suggestionCache.getStats()
    };
  }
}

module.exports = new IntelligentSearchService();