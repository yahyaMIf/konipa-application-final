import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  ShoppingCart, 
  Heart,
  ChevronDown,
  SlidersHorizontal,
  Package,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { productService } from '../services/dataService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart, toggleFavorite, getFavoriteIds } = useCart();

  // Fonction pour gérer l'ajout au panier de manière asynchrone
  const handleAddToCart = async (product) => {
    await addToCart(product);
  };
  const favoriteIds = getFavoriteIds();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour la recherche intelligente
  const [searchResults, setSearchResults] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isIntelligentSearch, setIsIntelligentSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    inStock: false,
    minPrice: '',
    maxPrice: '',
    rating: 0,
    isNew: false,
    hasDiscount: false
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Charger les données depuis l'API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData, brandsData] = await Promise.all([
          productService.getProducts(),
          productService.getCategories(),
          productService.getBrands()
        ]);
        setProducts(productsData?.products || []);
        setCategories(categoriesData || []);
        setBrands(brandsData || []);
      } catch (error) {
        setProducts([]);
        setCategories([]);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Traiter les paramètres de recherche de l'URL
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    const promotionParam = searchParams.get('promotion');
    
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
    
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
    
    if (promotionParam === 'true') {
      setFilters(prev => ({ ...prev, hasDiscount: true }));
    }
  }, [searchParams]);

  // Fonction de recherche intelligente
  const performIntelligentSearch = async (searchTerm, filters) => {
    if (!searchTerm || searchTerm.length < 2) {
      setIsIntelligentSearch(false);
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    setIsIntelligentSearch(true);

    try {
      const results = await productService.intelligentSearch(searchTerm, filters, {
        limit: 50
      });
      
      setSearchResults(results);
      } catch (error) {
      // Fallback vers recherche simple
      setIsIntelligentSearch(false);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Fonction de recherche et filtrage classique (fallback)
  const searchAndFilterProducts = (searchTerm, filters) => {
    let results = products.filter(product => {
      // Recherche par nom, marque, description
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtres
      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesBrand = !filters.brand || product.brand === filters.brand;
      const matchesStock = !filters.inStock || product.stock > 0;
      const matchesMinPrice = !filters.minPrice || product.price >= parseFloat(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || product.price <= parseFloat(filters.maxPrice);
      const matchesRating = !filters.rating || (product.rating && product.rating >= filters.rating);
      const matchesNew = !filters.isNew || product.isNew;
      const matchesDiscount = !filters.hasDiscount || (product.originalPrice && product.originalPrice > product.price);
      
      return matchesSearch && matchesCategory && matchesBrand && matchesStock && 
             matchesMinPrice && matchesMaxPrice && matchesRating && matchesNew && matchesDiscount;
    });
    
    return results;
  };

  // Fonction pour obtenir des suggestions de recherche
  const getSuggestions = async (partialQuery) => {
    if (partialQuery.length >= 2) {
      try {
        const suggestions = await productService.getSearchSuggestions(partialQuery, 5);
        setSearchSuggestions(suggestions);
      } catch (error) {
        setSearchSuggestions([]);
      }
    } else {
      setSearchSuggestions([]);
    }
  };

  // Gestionnaire de changement de terme de recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 2) {
        performIntelligentSearch(searchTerm, filters);
        getSuggestions(searchTerm);
      } else {
        setIsIntelligentSearch(false);
        setSearchResults(null);
        setSearchSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Effet principal pour filtrer et trier les produits
  useEffect(() => {
    if (products.length === 0) return;
    
    let results;
    
    // Utiliser les résultats de recherche intelligente si disponibles
    if (isIntelligentSearch && searchResults) {
      results = searchResults.products || [];
      // Appliquer les filtres supplémentaires aux résultats intelligents
      results = results.filter(product => {
        const matchesCategory = !filters.category || product.category === filters.category;
        const matchesBrand = !filters.brand || product.brand === filters.brand;
        const matchesStock = !filters.inStock || product.stock > 0;
        const matchesMinPrice = !filters.minPrice || product.price >= parseFloat(filters.minPrice);
        const matchesMaxPrice = !filters.maxPrice || product.price <= parseFloat(filters.maxPrice);
        const matchesRating = !filters.rating || (product.rating && product.rating >= filters.rating);
        const matchesNew = !filters.isNew || product.isNew;
        const matchesDiscount = !filters.hasDiscount || (product.originalPrice && product.originalPrice > product.price);
        
        return matchesCategory && matchesBrand && matchesStock && 
               matchesMinPrice && matchesMaxPrice && matchesRating && matchesNew && matchesDiscount;
      });
    } else {
      // Utiliser la recherche classique
      results = searchAndFilterProducts(searchTerm, filters);
    }

    // Tri (sauf si recherche intelligente avec score de pertinence)
    if (!isIntelligentSearch || sortBy !== 'relevance') {
      results.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === 'price') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    setFilteredProducts(results);
    setCurrentPage(1);
  }, [products, searchTerm, filters, sortBy, sortOrder, isIntelligentSearch, searchResults]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      inStock: false,
      minPrice: '',
      maxPrice: '',
      rating: 0,
      isNew: false,
      hasDiscount: false
    });
    setSearchTerm('');
  };

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const ProductCard = ({ product }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 p-3 relative group"
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.discount > 0 && (
          <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            -{product.discount}%
          </span>
        )}
        {product.isNew && (
          <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            Nouveau
          </span>
        )}
        {product.matchType === 'substitution' && (
          <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            Substitution
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button 
          onClick={() => toggleFavorite(product)}
          className={`bg-card/90 hover:bg-card p-1.5 rounded shadow-sm transition-colors ${
            favoriteIds.includes(product.id) ? 'text-red-500' : 'text-muted-foreground'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${
            favoriteIds.includes(product.id) ? 'fill-current' : ''
          }`} />
        </button>
        <Link to={`/product/${product.id}`} className="bg-card/90 hover:bg-card p-1.5 rounded shadow-sm transition-colors">
          <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-blue-500" />
        </Link>
      </div>

      {/* Image */}
      <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
        <Package className="w-10 h-10 text-muted-foreground" />
      </div>

      {/* Contenu */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">{product.brand}</span>
          {user?.role !== 'client' && (
                <span className={`status-${product.inStock ? 'en-stock' : 'rupture'}`}>
                  {product.inStock ? 'En stock' : 'Rupture'}
                </span>
              )}
              {user?.role === 'client' && (
                <span className="text-blue-600 text-sm font-medium">
                  Disponible
                </span>
              )}
        </div>
        
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Réf: {product.reference}</span>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
            <span className="ml-1">({product.reviews})</span>
          </div>
        </div>
        
        {product.matchType === 'substitution' && product.originalReference && (
          <p className="text-xs text-orange-600 mb-1">
            Substitution pour: {product.originalReference}
          </p>
        )}
        
        {/* Prix */}
        <div className="py-1">
          <div className="text-lg font-bold text-foreground">{product.price} DH</div>
          {product.originalPrice > product.price && (
            <div className="text-xs text-muted-foreground line-through">
              {product.originalPrice} DH
            </div>
          )}
        </div>
        
        {/* Bouton d'ajout */}
        {(user?.role === 'client' || user?.role === 'commercial') && (
          <button 
            onClick={() => handleAddToCart(product)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!product.inStock}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.inStock ? 'Ajouter au panier' : 'Indisponible'}
          </button>
        )}
      </div>
    </motion.div>
  );

  const ProductListItem = ({ product }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-lg border border-border hover:border-border hover:shadow-md transition-all duration-300 p-4"
    >
      <div className="flex items-center gap-4">
        {/* Image */}
        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              {/* Titre et badges */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{product.name}</h3>
                {user?.role !== 'client' && (
              <span className={`status-${product.inStock ? 'en-stock' : 'rupture'} flex-shrink-0`}>
                {product.inStock ? 'En stock' : 'Rupture'}
              </span>
            )}
            {user?.role === 'client' && (
              <span className="text-blue-600 text-sm font-medium flex-shrink-0">
                Disponible
              </span>
            )}
                {product.discount > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0">
                    -{product.discount}%
                  </span>
                )}
                {product.isNew && (
                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0">
                    Nouveau
                  </span>
                )}
              </div>
              
              {/* Informations produit */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">{product.brand}</span>
                <span>Réf: {product.reference}</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-1 text-xs">({product.reviews})</span>
                </div>
              </div>
            </div>

            {/* Prix et actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{product.price} DH</div>
                {product.originalPrice > product.price && (
                  <div className="text-sm text-gray-500 line-through">
                    {product.originalPrice} DH
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleFavorite(product)}
                  className={`p-2 rounded-lg border transition-colors ${
                    favoriteIds.includes(product.id) 
                      ? 'text-red-500 border-red-200 bg-red-50' 
                      : 'text-gray-600 border-gray-200 hover:text-red-500 hover:border-red-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${
                    favoriteIds.includes(product.id) ? 'fill-current' : ''
                  }`} />
                </button>
                <Link 
                  to={`/product/${product.id}`} 
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-500 hover:border-blue-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {(user?.role === 'client' || user?.role === 'commercial') && (
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter au panier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalogue</h1>
          <p className="text-gray-600">
            Découvrez notre gamme complète de pièces automobiles de qualité
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="card-konipa mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, marque, référence, modèle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-konipa-search"
                />
                
                {/* Indicateur de recherche intelligente */}
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {isIntelligentSearch && searchResults && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 font-medium">
                    IA
                  </div>
                )}
                
                {/* Suggestions de recherche */}
                {searchSuggestions.length > 0 && searchTerm.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 text-xs text-gray-500 border-b">
                      Suggestions
                    </div>
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setSearchSuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-3 h-3 text-gray-400" />
                          <span>{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-konipa-outline px-4 py-2 ${showFilters ? 'bg-blue-50' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtres
              </button>

              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="input-konipa text-sm"
              >
                {isIntelligentSearch && (
                  <option value="relevance-desc">Pertinence</option>
                )}
                <option value="name-asc">Nom A-Z</option>
                <option value="name-desc">Nom Z-A</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="rating-desc">Mieux notés</option>
                <option value="brand-asc">Marque A-Z</option>
              </select>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="input-konipa text-sm"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marque */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marque
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="input-konipa text-sm"
                  >
                    <option value="">Toutes les marques</option>
                    {brands.map(brand => (
                      <option key={brand.id || brand} value={brand.name || brand}>
                        {brand.name || brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix (DH)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="input-konipa text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="input-konipa text-sm"
                    />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">En stock uniquement</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.isNew}
                        onChange={(e) => handleFilterChange('isNew', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Nouveautés</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasDiscount}
                        onChange={(e) => handleFilterChange('hasDiscount', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">En promotion</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="btn-konipa-outline text-sm px-4 py-2"
                >
                  Effacer les filtres
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Résultats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </p>
            
            {filteredProducts.length > 0 && (
              <p className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
              </p>
            )}
          </div>
          
          {/* Informations de recherche intelligente */}
          {isIntelligentSearch && searchResults && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Recherche intelligente activée</span>
              </div>
              <div className="mt-1 text-xs text-blue-600">
                {searchResults.metadata && (
                  <div className="flex flex-wrap gap-4">
                    {searchResults.metadata.parsedQuery && (
                      <span>Marque: {searchResults.metadata.parsedQuery.brand || 'Non détectée'}</span>
                    )}
                    {searchResults.metadata.parsedQuery && searchResults.metadata.parsedQuery.model && (
                      <span>Modèle: {searchResults.metadata.parsedQuery.model}</span>
                    )}
                    {searchResults.metadata.parsedQuery && searchResults.metadata.parsedQuery.years && searchResults.metadata.parsedQuery.years.length > 0 && (
                      <span>Années: {searchResults.metadata.parsedQuery.years.join(', ')}</span>
                    )}
                    {searchResults.metadata.parsedQuery && searchResults.metadata.parsedQuery.partType && (
                      <span>Type: {searchResults.metadata.parsedQuery.partType}</span>
                    )}
                  </div>
                )}
                {searchResults.suggestions && searchResults.suggestions.length > 0 && (
                  <div className="mt-1">
                    <span>Suggestions: {searchResults.suggestions.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Grille/Liste de produits */}
        {currentProducts.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
                {currentProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {currentProducts.map(product => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-konipa-outline px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === i + 1
                        ? 'btn-konipa-primary'
                        : 'btn-konipa-outline'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-konipa-outline px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche ou vos filtres.
            </p>
            <button
              onClick={clearFilters}
              className="btn-konipa-primary"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;

