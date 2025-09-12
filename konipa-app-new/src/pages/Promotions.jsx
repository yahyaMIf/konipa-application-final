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
  Percent,
  TrendingDown,
  Clock,
  Gift
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/dataService';
import { getPromoProducts } from '../utils/productFilters';
import promotionService from '../services/PromotionService';
import ProductDetailsModal from '../components/ProductDetailsModal';
import ProductEditModal from '../components/ProductEditModal';

const Promotions = () => {
  const { addToCart, addToFavorites } = useCart();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('discount');
  const [filterCategory, setFilterCategory] = useState('all');
  const [timeLeft, setTimeLeft] = useState({});
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Charger les produits en promotion au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger tous les produits
        const allProducts = await productService.getProducts();
        
        // Filtrer les produits en promotion
        const promoProducts = getPromoProducts(allProducts);
        setProducts(promoProducts);
        
        // Charger les promotions et nouveaux produits
        const activePromotions = promotionService.getActivePromotions();
        const activeNewProducts = promotionService.getActiveNewProducts();
        
        // Transformer les promotions pour correspondre au format attendu
        const formattedPromotions = activePromotions.map(promo => ({
          id: promo.id,
          name: promo.title,
          category: 'Promotion',
          price: 0, // Prix à calculer selon la logique métier
          originalPrice: 0,
          discount: promo.discountPercentage,
          image: promo.image || null,
          badge: 'PROMO',
          description: promo.description,
          stock: 10, // Valeur par défaut
          rating: 4.5,
          reviews: 0,
          endDate: promo.endDate,
          isFlashSale: promo.discountPercentage > 30,
          savings: 0 // À calculer
        }));
        
        // Transformer les nouveaux produits
        const formattedNewProducts = activeNewProducts.map(product => ({
          id: product.id,
          name: product.title,
          category: 'Nouveauté',
          price: 0,
          originalPrice: 0,
          discount: 0,
          image: product.image || null,
          badge: 'NOUVEAU',
          description: product.description,
          stock: 10,
          rating: 4.5,
          reviews: 0,
          endDate: product.highlightUntil,
          isFlashSale: false,
          savings: 0
        }));
        
        setPromotions([...formattedPromotions, ...formattedNewProducts]);
        setNewProducts(formattedNewProducts);
        
      } catch (error) {
        // En cas d'erreur, initialiser avec des tableaux vides
        setProducts([]);
        setPromotions([]);
        setNewProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Écouter les événements de mise à jour des promotions
  useEffect(() => {
    const handlePromotionUpdate = () => {
      // Recharger les données quand les promotions sont mises à jour
      const loadData = async () => {
        try {
          const allProducts = await productService.getProducts();
          const promoProducts = getPromoProducts(allProducts);
          setProducts(promoProducts);
          
          const activePromotions = promotionService.getActivePromotions();
          const activeNewProducts = promotionService.getActiveNewProducts();
          
          const formattedPromotions = activePromotions.map(promo => ({
            id: promo.id,
            name: promo.title,
            category: 'Promotion',
            price: 0,
            originalPrice: 0,
            discount: promo.discountPercentage,
            image: promo.image || null,
            badge: 'PROMO',
            description: promo.description,
            stock: 10,
            rating: 4.5,
            reviews: 0,
            endDate: promo.endDate,
            isFlashSale: promo.discountPercentage > 30,
            savings: 0
          }));
          
          const formattedNewProducts = activeNewProducts.map(product => ({
            id: product.id,
            name: product.title,
            category: 'Nouveauté',
            price: 0,
            originalPrice: 0,
            discount: 0,
            image: product.image || null,
            badge: 'NOUVEAU',
            description: product.description,
            stock: 10,
            rating: 4.5,
            reviews: 0,
            endDate: product.highlightUntil,
            isFlashSale: false,
            savings: 0
          }));
          
          setPromotions([...formattedPromotions, ...formattedNewProducts]);
          setNewProducts(formattedNewProducts);
        } catch (error) {
          }
      };
      
      loadData();
    };

    // Écouter l'événement personnalisé
    window.addEventListener('promotionUpdated', handlePromotionUpdate);
    window.addEventListener('newProductUpdated', handlePromotionUpdate);

    return () => {
       window.removeEventListener('promotionUpdated', handlePromotionUpdate);
       window.removeEventListener('newProductUpdated', handlePromotionUpdate);
     };
   }, []);

  // Les données sont maintenant chargées via l'API

  // Utiliser les promotions chargées ou les données de fallback
  const displayPromotions = promotions.length > 0 ? promotions : fallbackPromotions;
  
  const categories = ['all', 'Promotion', 'Nouveauté', 'Transmission', 'Lubrifiants', 'Freinage', 'Distribution', 'Refroidissement', 'Électrique'];

  // Calculer le temps restant pour chaque promotion
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const newTimeLeft = {};
      
      displayPromotions.forEach(promo => {
        const endTime = new Date(promo.endDate).getTime();
        const difference = endTime - now;
        
        if (difference > 0) {
          newTimeLeft[promo.id] = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
          };
        } else {
          newTimeLeft[promo.id] = { expired: true };
        }
      });
      
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [displayPromotions]);

  const filteredProducts = displayPromotions.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'discount':
        return b.discount - a.discount;
      case 'savings':
        return b.savings - a.savings;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'ending-soon':
        return new Date(a.endDate) - new Date(b.endDate);
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

  const formatTimeLeft = (time) => {
    if (time.expired) return 'Expiré';
    return `${time.days}j ${time.hours}h ${time.minutes}m ${time.seconds}s`;
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
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            <Percent className="w-4 h-4" />
            <span>PROMOTIONS</span>
            <Percent className="w-4 h-4" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Offres Exceptionnelles
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Profitez de nos promotions limitées avec des réductions allant jusqu'à 40%
          </p>
        </motion.div>

        {/* Bannière Flash Sales */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 text-white rounded-xl p-6 mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Gift className="w-6 h-6" />
              <h2 className="text-2xl font-bold">FLASH SALES</h2>
              <Gift className="w-6 h-6" />
            </div>
            <p className="text-lg mb-4">Offres limitées - Dépêchez-vous !</p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Jusqu'à 40% de réduction</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingDown className="w-4 h-4" />
                <span>Prix les plus bas</span>
              </div>
            </div>
          </div>
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
                placeholder="Rechercher dans les promotions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500"
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
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="discount">Remise la plus élevée</option>
                <option value="savings">Économies maximales</option>
                <option value="ending-soon">Se termine bientôt</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
              </select>

              {/* Mode d'affichage */}
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-red-500 text-white' : 'bg-background text-muted-foreground'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-red-500 text-white' : 'bg-background text-muted-foreground'}`}
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
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Promotions actives</p>
                <p className="text-3xl font-bold">{displayPromotions.length}</p>
              </div>
              <Percent className="w-8 h-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Remise moyenne</p>
                <p className="text-3xl font-bold">
                  {displayPromotions.length > 0 ? Math.round(displayPromotions.reduce((acc, p) => acc + p.discount, 0) / displayPromotions.length) : 0}%
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Économies totales</p>
                <p className="text-3xl font-bold">
                  {displayPromotions.reduce((acc, p) => acc + p.savings, 0)} DH
                </p>
              </div>
              <Gift className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </motion.div>

        {/* Grille de produits */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des promotions...</p>
            </div>
          </motion.div>
        ) : (
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
            {sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-card rounded-xl shadow-lg overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group relative ${
                  viewMode === 'list' ? 'flex' : ''
                } ${product.isFlashSale ? 'ring-2 ring-red-500 ring-opacity-50' : ''}`}
              >
                {/* Countdown Timer */}
                {timeLeft[product.id] && !timeLeft[product.id].expired && (
                  <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-xs font-bold z-10">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatTimeLeft(timeLeft[product.id])}
                  </div>
                )}

                {/* Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'} ${timeLeft[product.id] && !timeLeft[product.id].expired ? 'mt-6' : ''}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.isFlashSale 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse'
                        : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                    }`}>
                      {product.badge}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{product.discount}%
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Économisez {product.savings} DH
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
                    <h3 className="font-semibold text-card-foreground group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
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
                        <span className="text-2xl font-bold text-red-600">{product.price} DH</span>
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
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Profiter de l'offre</span>
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
                        <Percent className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Message si aucun résultat */}
        {!loading && sortedProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Percent className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Aucune promotion trouvée
            </h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche ou de filtrage
            </p>
          </motion.div>
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

export default Promotions;