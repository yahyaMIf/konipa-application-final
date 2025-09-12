/**
 * Service de recherche intelligente pour le catalogue de produits
 * Utilise parseDesignation.ts pour améliorer la pertinence des résultats
 */

import { parseDesignation, generateSearchQuery, filterProductsByParsedDesignation, suggestAlternativeTerms } from '../utils/parseDesignation';
import { apiService } from './api';

class IntelligentSearchService {
  constructor() {
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Recherche intelligente de produits
   * @param {string} query - Terme de recherche
   * @param {Object} filters - Filtres additionnels
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Résultats de recherche enrichis
   */
  async searchProducts(query, filters = {}, options = {}) {
    try {
      // Vérifier le cache
      const cacheKey = this.generateCacheKey(query, filters, options);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Parser la requête
      const parsedQuery = parseDesignation(query);
      // Générer des requêtes optimisées
      const searchQueries = this.generateSearchQueries(query, parsedQuery);
      
      // Effectuer les recherches
      const searchResults = await this.performMultipleSearches(searchQueries, filters, options);
      
      // Fusionner et scorer les résultats
      const mergedResults = this.mergeAndScoreResults(searchResults, parsedQuery, query);
      
      // Appliquer le filtrage intelligent
      const filteredResults = this.applyIntelligentFiltering(mergedResults, parsedQuery);
      
      // Générer des suggestions
      const suggestions = this.generateSuggestions(parsedQuery, filteredResults);
      
      const result = {
        products: filteredResults,
        totalCount: filteredResults.length,
        parsedQuery,
        suggestions,
        searchQueries,
        confidence: parsedQuery.confidence
      };

      // Mettre en cache
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      // Fallback vers recherche simple
      return this.fallbackSearch(query, filters, options);
    }
  }

  /**
   * Génère plusieurs requêtes de recherche optimisées
   */
  generateSearchQueries(originalQuery, parsedQuery) {
    const queries = [originalQuery];
    
    // Requête optimisée basée sur le parsing
    if (parsedQuery.confidence > 0.3) {
      const optimizedQuery = generateSearchQuery(parsedQuery);
      if (optimizedQuery !== originalQuery) {
        queries.push(optimizedQuery);
      }
    }
    
    // Requêtes par composants
    if (parsedQuery.marque && parsedQuery.typePiece) {
      queries.push(`${parsedQuery.marque} ${parsedQuery.typePiece}`);
    }
    
    if (parsedQuery.modele && parsedQuery.typePiece) {
      queries.push(`${parsedQuery.modele} ${parsedQuery.typePiece}`);
    }
    
    // Requêtes avec années
    if (parsedQuery.annees.length > 0) {
      const year = parsedQuery.annees[0];
      if (parsedQuery.marque) {
        queries.push(`${parsedQuery.marque} ${year}`);
      }
      if (parsedQuery.modele) {
        queries.push(`${parsedQuery.modele} ${year}`);
      }
    }
    
    return [...new Set(queries)]; // Supprimer les doublons
  }

  /**
   * Effectue plusieurs recherches en parallèle
   */
  async performMultipleSearches(queries, filters, options) {
    const searchPromises = queries.map(async (query) => {
      try {
        const params = {
          search: query,
          ...filters,
          page: 1,
          limit: options.limit || 50
        };
        
        const response = await apiService.get('/products', { params });
        return {
          query,
          products: response.data.products || [],
          success: true
        };
      } catch (error) {
        return {
          query,
          products: [],
          success: false,
          error: error.message
        };
      }
    });
    
    return Promise.all(searchPromises);
  }

  /**
   * Fusionne et score les résultats de recherche
   */
  mergeAndScoreResults(searchResults, parsedQuery, originalQuery) {
    const productMap = new Map();
    
    searchResults.forEach((result, index) => {
      if (!result.success) return;
      
      const queryWeight = index === 0 ? 1.0 : 0.8 - (index * 0.1); // Première requête = poids max
      
      result.products.forEach(product => {
        const productId = product.id || product.sku;
        
        if (productMap.has(productId)) {
          // Augmenter le score si trouvé dans plusieurs recherches
          const existing = productMap.get(productId);
          existing.searchScore += queryWeight * 0.5;
          existing.foundInQueries.push(result.query);
        } else {
          // Calculer le score initial
          const relevanceScore = this.calculateRelevanceScore(product, parsedQuery, originalQuery);
          
          productMap.set(productId, {
            ...product,
            searchScore: queryWeight,
            relevanceScore,
            totalScore: queryWeight + relevanceScore,
            foundInQueries: [result.query]
          });
        }
      });
    });
    
    // Convertir en array et trier par score total
    return Array.from(productMap.values())
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calcule le score de pertinence d'un produit
   */
  calculateRelevanceScore(product, parsedQuery, originalQuery) {
    let score = 0;
    
    const productText = `${product.name || ''} ${product.description || ''} ${product.brand || ''} ${product.model || ''}`
      .toLowerCase();
    const queryLower = originalQuery.toLowerCase();
    
    // Score basé sur la correspondance exacte
    if (productText.includes(queryLower)) {
      score += 2.0;
    }
    
    // Score basé sur les composants parsés
    if (parsedQuery.confidence > 0.3) {
      if (parsedQuery.marque && productText.includes(parsedQuery.marque.toLowerCase())) {
        score += 1.5;
      }
      
      if (parsedQuery.modele && productText.includes(parsedQuery.modele.toLowerCase())) {
        score += 1.5;
      }
      
      if (parsedQuery.typePiece && productText.includes(parsedQuery.typePiece.toLowerCase())) {
        score += 1.0;
      }
      
      if (parsedQuery.annees.length > 0) {
        const hasYear = parsedQuery.annees.some(year => productText.includes(year));
        if (hasYear) score += 0.8;
      }
    }
    
    // Bonus pour les produits actifs et en stock
    if (product.isActive) score += 0.2;
    if (product.stock > 0) score += 0.3;
    
    // Bonus pour les produits avec images
    if (product.images && product.images.length > 0) score += 0.1;
    
    return score;
  }

  /**
   * Applique un filtrage intelligent basé sur le parsing
   */
  applyIntelligentFiltering(products, parsedQuery) {
    if (parsedQuery.confidence < 0.3) {
      return products;
    }
    
    // Filtrer avec un seuil adaptatif
    const threshold = Math.max(0.2, parsedQuery.confidence * 0.5);
    return filterProductsByParsedDesignation(products, parsedQuery, threshold);
  }

  /**
   * Génère des suggestions de recherche
   */
  generateSuggestions(parsedQuery, results) {
    const suggestions = {
      alternatives: [],
      refinements: [],
      related: []
    };
    
    // Suggestions alternatives basées sur le parsing
    if (parsedQuery.confidence > 0.3) {
      suggestions.alternatives = suggestAlternativeTerms(parsedQuery);
    }
    
    // Suggestions de raffinement
    if (results.length > 10) {
      if (parsedQuery.marque && !parsedQuery.modele) {
        const modeles = this.extractUniqueValues(results, 'model');
        suggestions.refinements.push(...modeles.slice(0, 5).map(m => `${parsedQuery.marque} ${m}`));
      }
      
      if (parsedQuery.typePiece && !parsedQuery.marque) {
        const marques = this.extractUniqueValues(results, 'brand');
        suggestions.refinements.push(...marques.slice(0, 5).map(m => `${m} ${parsedQuery.typePiece}`));
      }
    }
    
    // Suggestions de produits liés
    if (results.length > 0) {
      const categories = this.extractUniqueValues(results, 'category');
      suggestions.related = categories.slice(0, 3);
    }
    
    return suggestions;
  }

  /**
   * Extrait les valeurs uniques d'un champ
   */
  extractUniqueValues(products, field) {
    const values = products
      .map(p => p[field])
      .filter(v => v && typeof v === 'string')
      .map(v => v.trim());
    
    return [...new Set(values)];
  }

  /**
   * Recherche de fallback en cas d'erreur
   */
  async fallbackSearch(query, filters, options) {
    try {
      const params = {
        search: query,
        ...filters,
        page: 1,
        limit: options.limit || 20
      };
      
      const response = await apiService.get('/products', { params });
      
      return {
        products: response.data.products || [],
        totalCount: response.data.totalCount || 0,
        parsedQuery: null,
        suggestions: { alternatives: [], refinements: [], related: [] },
        searchQueries: [query],
        confidence: 0,
        fallback: true
      };
    } catch (error) {
      return {
        products: [],
        totalCount: 0,
        parsedQuery: null,
        suggestions: { alternatives: [], refinements: [], related: [] },
        searchQueries: [query],
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Gestion du cache
   */
  generateCacheKey(query, filters, options) {
    return JSON.stringify({ query, filters, options });
  }

  getFromCache(key) {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.searchCache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Nettoyer le cache si trop volumineux
    if (this.searchCache.size > 100) {
      const oldestKey = this.searchCache.keys().next().value;
      this.searchCache.delete(oldestKey);
    }
  }

  /**
   * Nettoie le cache
   */
  clearCache() {
    this.searchCache.clear();
  }

  /**
   * Recherche de produits similaires
   */
  async findSimilarProducts(productId, limit = 5) {
    try {
      const product = await apiService.get(`/products/${productId}`);
      const productData = product.data;
      
      if (!productData) return [];
      
      // Créer une requête basée sur le produit
      const searchQuery = `${productData.brand || ''} ${productData.model || ''} ${productData.category || ''}`
        .trim();
      
      const results = await this.searchProducts(searchQuery, {}, { limit: limit + 5 });
      
      // Exclure le produit original et limiter les résultats
      return results.products
        .filter(p => p.id !== productId)
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Suggestions de recherche en temps réel
   */
  async getSearchSuggestions(partialQuery, limit = 5) {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }
    
    try {
      // Parser la requête partielle
      const parsed = parseDesignation(partialQuery);
      
      const suggestions = [];
      
      // Suggestions basées sur les marques
      if (parsed.marque) {
        suggestions.push(parsed.marque);
        if (parsed.typePiece) {
          suggestions.push(`${parsed.marque} ${parsed.typePiece}`);
        }
      }
      
      // Suggestions basées sur les types de pièces
      if (parsed.typePiece) {
        suggestions.push(parsed.typePiece);
      }
      
      // Compléter avec des suggestions génériques
      const commonSuggestions = [
        'amortisseur',
        'frein',
        'filtre',
        'courroie',
        'roulement',
        'embrayage'
      ];
      
      commonSuggestions.forEach(suggestion => {
        if (suggestion.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.push(suggestion);
        }
      });
      
      return [...new Set(suggestions)].slice(0, limit);
    } catch (error) {
      return [];
    }
  }
}

export const intelligentSearchService = new IntelligentSearchService();
export default intelligentSearchService;