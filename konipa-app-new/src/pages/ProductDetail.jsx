import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Truck,
  Shield,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Eye,
  MessageCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { productService } from '../services/dataService';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import ProductDetailsModal from '../components/ProductDetailsModal';
import ProductEditModal from '../components/ProductEditModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, toggleFavorite, isFavorite: isProductFavorite } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await productService.getProductById(id);
        if (productData) {
          setProduct(productData);
          setIsFavorite(isProductFavorite(productData.id));
          
          // Charger les produits similaires de la même catégorie
          try {
            const allProducts = await productService.getProducts();
            const related = allProducts
              .filter(p => p.category === productData.category && p.id !== productData.id)
              .slice(0, 4);
            setRelatedProducts(related);
          } catch (error) {
            setRelatedProducts([]);
          }
          
          // Charger les avis du produit
          try {
            const reviewsData = await apiService.get(`products/${id}/reviews`);
            setReviews(reviewsData || []);
          } catch (error) {
            setReviews([]);
          }
        }
      } catch (error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadProduct();
    }
  }, [id, isProductFavorite]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-4">Le produit que vous recherchez n'existe pas.</p>
          <button
            onClick={() => navigate('/catalog')}
            className="btn-konipa-primary"
          >
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    // Optionnel: afficher une notification de succès
    alert(`${product.name} (x${quantity}) ajouté au panier !`);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product);
    setIsFavorite(!isFavorite);
  };

  const handleProductSave = async (updatedProduct) => {
    try {
      const savedProduct = await productService.updateProduct(updatedProduct.id, updatedProduct);
      setProduct(savedProduct);

    } catch (error) {
      alert('Erreur lors de la mise à jour du produit');
    }
  };

  const tabs = [
    { id: 'description', label: 'Description', icon: Eye },
    { id: 'specifications', label: 'Caractéristiques', icon: Package },
    { id: 'reviews', label: 'Avis clients', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au catalogue</span>
          </button>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Images produit */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center relative">
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    -{product.discount}%
                  </span>
                </div>
              )}
              {product.isNew && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    Nouveau
                  </span>
                </div>
              )}
              <Package className="w-32 h-32 text-gray-300" />
            </div>
            
            {/* Miniatures */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-card rounded-lg border border-border flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Informations produit */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-600">{product.brand}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-blue-100 hover:text-blue-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-2">Référence: {product.reference}</p>
              
              {/* Substitutions disponibles */}
              {product.substitutions && product.substitutions.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-orange-800 mb-2">Substitutions disponibles:</h3>
                  <div className="space-y-1">
                    {product.substitutions.map((sub, index) => (
                      <div key={index} className="text-xs text-orange-700">
                        <span className="font-medium">{sub.reference}</span>
                        {sub.brand && <span className="text-orange-600"> ({sub.brand})</span>}
                        {sub.reason && <span className="text-orange-500"> - {sub.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Évaluation */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                <span className="text-sm text-gray-500">({product.reviews} avis)</span>
              </div>
            </div>

            {/* Prix */}
            <div className="border-t border-b border-gray-200 py-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl font-bold text-gray-900">{product.price} DH</span>
                {product.originalPrice > product.price && (
                  <span className="text-xl text-gray-500 line-through">
                    {product.originalPrice} DH
                  </span>
                )}
              </div>
              
              {/* Statut stock - masqué pour les clients */}
              {user?.role !== 'client' && (
                <div className="flex items-center space-x-2 mb-4">
                  {product.inStock ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">En stock ({product.stock} disponibles)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 font-medium">Rupture de stock</span>
                    </>
                  )}
                </div>
              )}
              {/* Affichage simplifié pour les clients */}
              {user?.role === 'client' && (
                <div className="flex items-center space-x-2 mb-4">
                  {product.inStock ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">Disponible</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 font-medium">Non disponible</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quantité et ajout panier */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantité:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                {(user?.role === 'client' || user?.role === 'commercial') ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="btn-konipa-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {product.inStock ? 'Ajouter au panier' : 'Indisponible'}
                  </button>
                ) : (user?.role === 'admin' || user?.role === 'accountant') ? (
                  <>
                    <button
                      onClick={() => setShowDetailsModal(true)}
                      className="btn-konipa-secondary flex-1 py-3 text-lg"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Voir détails
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(true);
                      }}
                      className="btn-konipa-primary flex-1 py-3 text-lg"
                    >
                      <Package className="w-5 h-5 mr-2" />
                      Modifier
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {/* Avantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="w-5 h-5 text-blue-500" />
                <span>Livraison 24/48h</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Garantie {product.warranty}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <span>Qualité certifiée</span>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="card-konipa mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="py-6">
            {selectedTab === 'description' && (
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                
                {product.features && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Caractéristiques principales:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'specifications' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Spécifications techniques</h3>
                {product.specifications && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700 capitalize">{key}:</span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Avis clients ({reviews.length})</h3>
                  <button className="btn-konipa-outline text-sm">
                    Écrire un avis
                  </button>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{review.author}</span>
                          {review.verified && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Achat vérifié
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span>Utile ({review.helpful})</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-red-600 transition-colors">
                          <ThumbsDown className="w-4 h-4" />
                          <span>Pas utile</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Produits similaires */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produits similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-konipa-product cursor-pointer"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm text-gray-500">{relatedProduct.brand}</span>
                    <h3 className="font-semibold text-gray-900 text-sm">{relatedProduct.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{relatedProduct.price} DH</span>
                      {relatedProduct.originalPrice > relatedProduct.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {relatedProduct.originalPrice} DH
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails du produit */}
      <ProductDetailsModal
        product={product}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Modal d'édition du produit */}
      <ProductEditModal
        product={product}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleProductSave}
      />
    </div>
  );
};

export default ProductDetail;

