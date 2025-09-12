import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Trash2, 
  ArrowLeft,
  Package,
  Star,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productService, pricingService } from '../services/dataService';
import ProductDetailsModal from '../components/ProductDetailsModal';
import ProductEditModal from '../components/ProductEditModal';

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite, addToCart } = useCart();

  // Fonction pour gérer l'ajout au panier de manière asynchrone
  const handleAddToCart = async (product) => {
    await addToCart(product);
  };
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [clientPricing, setClientPricing] = useState({});
  const [loading, setLoading] = useState(true);

  // Obtenir les produits favoris complets
  const favoriteProducts = favorites.map(fav => {
    const product = products.find(p => p.id === fav.id);
    return product ? { ...product, ...fav } : null;
  }).filter(Boolean);

  const removeFromFavorites = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      toggleFavorite(product);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, pricingData] = await Promise.all([
          productService.getProducts(),
          user?.id ? pricingService.getClientPricing(user.id) : Promise.resolve({})
        ]);
        
        setProducts(productsData || []);
        setClientPricing(pricingData || {});
      } catch (error) {
        setProducts([]);
        setClientPricing({});
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id]);

  const getClientPrice = async (clientId, productId) => {
    try {
      const clientPrice = await pricingService.getClientPrice(clientId, productId);
      return clientPrice;
    } catch (error) {
      return null;
    }
  };

  const handleModifyClick = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleProductSave = (updatedProduct) => {
    // Ici vous pouvez ajouter la logique pour sauvegarder le produit modifié

    setShowEditModal(false);
    // Optionnel: mettre à jour la liste des produits
  };

  const getProductPrice = async (product) => {
    if (user?.role === 'client') {
      const clientPrice = await getClientPrice(user.id, product.id);
      return clientPrice || product.price;
    }
    return product.price;
  };

  const sortedAndFilteredProducts = favoriteProducts
    .filter(product => filterCategory === 'all' || product.category.toLowerCase() === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          // Pour le tri par prix, utiliser le prix de base ou le prix client stocké
          const priceA = user?.role === 'client' && clientPricing[a.id] ? clientPricing[a.id].price : a.price;
          const priceB = user?.role === 'client' && clientPricing[b.id] ? clientPricing[b.id].price : b.price;
          return priceA - priceB;
        case 'brand':
          return a.brand.localeCompare(b.brand);
        default:
          return 0;
      }
    });

  const categories = [...new Set(favoriteProducts.map(p => p.category))];

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link
              to="/catalog"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour au catalogue</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Mes Favoris</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Aucun favori pour le moment</h2>
            <p className="text-muted-foreground mb-8">Découvrez nos produits et ajoutez-les à vos favoris</p>
            <Link
              to="/catalog"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="h-5 w-5" />
              <span>Parcourir le catalogue</span>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/catalog"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour au catalogue</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mes Favoris</h1>
              <p className="text-gray-600">{favoriteProducts.length} produit{favoriteProducts.length > 1 ? 's' : ''} en favoris</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filtres :</span>
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category.toLowerCase()}>{category}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Trier par nom</option>
              <option value="price">Trier par prix</option>
              <option value="brand">Trier par marque</option>
            </select>
          </div>
        </div>

        {/* Products Grid/List */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {sortedAndFilteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={viewMode === 'grid' 
                ? "bg-card rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
                : "bg-card rounded-xl shadow-sm p-6 flex items-center space-x-6"
              }
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid View */}
                  <div className="relative">
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        -{Math.round(((product.originalPrice - (user?.role === 'client' && clientPricing[product.id] ? clientPricing[product.id].price : product.price)) / product.originalPrice) * 100)}%
                      </div>
                    )}
                    <button
                      onClick={() => removeFromFavorites(product.id)}
                      className="absolute top-2 right-2 p-2 bg-card rounded-full shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-blue-600 font-semibold text-sm mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-500 text-sm mb-2">Réf: {product.reference}</p>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-gray-500 text-sm ml-2">({product.reviews})</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-800">{user?.role === 'client' && clientPricing[product.id] ? clientPricing[product.id].price : product.price} DH</span>
                        {product.originalPrice && (user?.role === 'client' && clientPricing[product.id] ? clientPricing[product.id].price : product.price) < product.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">{product.originalPrice} DH</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {user?.role !== 'client' && (
                        <span className={`text-sm font-medium ${
                          product.stock > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.stock > 0 ? 'En stock' : 'Rupture'}
                        </span>
                      )}
                      {user?.role === 'client' && (
                        <span className="text-sm font-medium text-blue-600">
                          Disponible
                        </span>
                      )}
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/product/${product.id}`}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {user?.role === 'client' || user?.role === 'commercial' ? (
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        ) : (user?.role === 'admin' || user?.role === 'accountant') ? (
                          <button
                            onClick={() => {
                        setSelectedProduct(product);
                        setShowDetailsModal(true);
                      }}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.brand} • Réf: {product.reference}</p>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-gray-500 text-sm ml-2">({product.reviews})</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xl font-bold text-gray-900">{user?.role === 'client' && clientPricing[product.id] ? clientPricing[product.id].price : product.price} DH</span>
                          {product.originalPrice && (user?.role === 'client' && clientPricing[product.id] ? clientPricing[product.id].price : product.price) < product.originalPrice && (
                            <span className="text-gray-500 line-through text-sm">{product.originalPrice} DH</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => removeFromFavorites(product.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/product/${product.id}`}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal de détails du produit */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Modal d'édition du produit */}
      <ProductEditModal
        product={selectedProduct}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleProductSave}
      />
    </div>
  );
};

export default Favorites;
