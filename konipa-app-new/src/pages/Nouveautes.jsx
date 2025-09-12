import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Filter, 
  Grid, 
  List, 
  Search,
  ShoppingCart,
  Heart,
  Eye,
  ArrowRight,
  Package,
  TrendingUp
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import productService from '../services/ProductService';
import { getNouveauteProducts } from '../utils/productFilters';
import ProductDetailsModal from '../components/ProductDetailsModal';
import ProductEditModal from '../components/ProductEditModal';

const Nouveautes = () => {
  const { addToCart, addToFavorites } = useCart();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Les données sont maintenant chargées via l'API

  // Charger les nouveaux produits
  useEffect(() => {
    const loadNewProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await productService.getProducts();
        const newProducts = getNouveauteProducts(allProducts);
        setProducts(newProducts.length > 0 ? newProducts : fallbackNouveautes);
      } catch (error) {
        setProducts(fallbackNouveautes);
      } finally {
        setLoading(false);
      }
    };

    loadNewProducts();
  }, []);

  const categories = ['all', 'Freinage', 'Filtration', 'Suspension', 'Éclairage', 'Électrique', 'Pneumatiques'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'discount':
        return b.discount - a.discount;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const handleAddToCart = async (product) => {
    await addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  };

  const handleAddToFavorites = (product) => {
    addToFavorites({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  };

  const handleDetailsClick = (product) => {
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4" />
            <span>NOUVEAUTÉS</span>
            <Star className="w-4 h-4" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent mb-4">
            Nos Dernières Nouveautés
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les derniers produits ajoutés à notre catalogue avec des offres exceptionnelles
          </p>
        </motion.div>

        {/* Filtres et recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans les nouveautés..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Toutes les catégories' : category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Plus récent</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="discount">Remise la plus élevée</option>
                <option value="rating">Mieux notés</option>
              </select>

              {/* Mode d'affichage */}
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-background text-muted-foreground'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-background text-muted-foreground'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Nouveaux produits</p>
                <p className="text-3xl font-bold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Remise moyenne</p>
                <p className="text-3xl font-bold">
                  {products.length > 0 ? Math.round(products.reduce((acc, p) => acc + p.discount, 0) / products.length) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">En stock</p>
                <p className="text-3xl font-bold">
                  {products.reduce((acc, p) => acc + p.stock, 0)}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </motion.div>

        {/* Indicateur de chargement */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des nouveautés...</span>
          </div>
        ) : (
          <>
            {/* Grille de produits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}
            >
              <AnimatePresence>
                {sortedProducts.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucune nouveauté trouvée</p>
                  </div>
                ) : (
                  sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-card rounded-xl shadow-lg overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-gradient-to-r from-blue-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {product.badge}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{product.discount}%
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                      <button
                        onClick={() => handleAddToFavorites(product)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-red-500" />
                      </button>
                      <button className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors">
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-card-foreground group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">
                      {product.rating} ({product.reviews} avis)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-blue-600">{product.price} DH</span>
                        <span className="text-sm text-gray-500 line-through">{product.originalPrice} DH</span>
                      </div>
                      {user?.role !== 'client' && (
                        <p className="text-sm text-muted-foreground">
                          Stock: {product.stock} unités
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {user?.role === 'client' || user?.role === 'commercial' ? (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Ajouter au panier</span>
                    </button>
                  ) : (user?.role === 'admin' || user?.role === 'accountant') ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDetailsClick(product)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Détails</span>
                      </button>
                      <button
                        onClick={() => handleEditClick(product)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <Package className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))
                )}
          </AnimatePresence>
        </motion.div>
        </>
        )}
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

export default Nouveautes;