import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  CreditCard,
  Truck,
  Shield,
  Tag,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import dataService, { pricingService, productService } from '../services/dataService';

const Cart = () => {
  const { user } = useAuth();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    appliedPromo, 
    applyPromoCode: applyPromo,
    removePromoCode 
  } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemPrices, setItemPrices] = useState({});

  // Load products data and calculate item prices
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const productsData = await productService.getAllProducts();
        setProducts(productsData);
        
        // Calculate prices for cart items
        const prices = {};
        for (const item of cartItems) {
          prices[item.id] = await getItemPrice(item);
        }
        setItemPrices(prices);
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [cartItems, user?.id]);

  // Get client-specific pricing
  const getItemPrice = async (item) => {
    if (user?.role === 'client') {
      try {
        const clientPrice = await pricingService.getClientPrice(user.id, item.id);
        return clientPrice || item.price;
      } catch (error) {
        return item.price;
      }
    }
    return item.price;
  };

  // Check quantity limits for products
  const getQuantityLimit = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.quantityLimits?.max || 999;
  };

  // Check if user can place orders
  const canPlaceOrder = () => {
    // All authenticated users can place orders
    return true;
  };

  const handleApplyPromo = () => {
    applyPromo(promoCode);
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoCode('');
  };

  const { subtotal, total, promoDiscount, shipping } = getCartTotal();
  const savings = cartItems.reduce((sum, item) => {
    const currentPrice = itemPrices[item.id] || item.price;
    return sum + ((item.originalPrice - currentPrice) * item.quantity);
  }, 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Votre panier est vide</h2>
            <p className="text-gray-600 mb-8">Découvrez nos produits et ajoutez-les à votre panier</p>
            <Link
              to="/catalog"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Continuer mes achats</span>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/catalog"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Continuer mes achats</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Mon Panier</h1>
          <p className="text-muted-foreground">{cartItems.length} article{cartItems.length > 1 ? 's' : ''} dans votre panier</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles du panier */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-foreground">Articles</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Image produit */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                          <div className="w-16 h-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>

                      {/* Informations produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.brand} • Réf: {item.reference}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-lg font-bold text-foreground">{itemPrices[item.id] || item.price} DH</span>
                              <span className="text-sm text-gray-500 line-through">{item.originalPrice} DH</span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                -{Math.round(((item.originalPrice - (itemPrices[item.id] || item.price)) / item.originalPrice) * 100)}%
                              </span>
                              {user?.role === 'client' && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Prix client
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Contrôles quantité */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-lg font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, getQuantityLimit(item.id)))}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              disabled={item.quantity >= getQuantityLimit(item.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {(getItemPrice(item) * item.quantity).toFixed(1)} DH
                            </p>
                            <p className="text-sm text-green-600">
                              Économie: {((item.originalPrice - getItemPrice(item)) * item.quantity).toFixed(1)} DH
                            </p>
                            {item.quantity >= getQuantityLimit(item.id) && (
                              <p className="text-xs text-orange-600 mt-1">
                                <Info className="w-3 h-3 inline mr-1" />
                                Limite atteinte
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Résumé de commande */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Résumé de commande</h2>
              
              {/* Code promo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code promo
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Entrez votre code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                </div>
                
                {appliedPromo && (
                  <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <span className="text-sm text-green-800">
                      Code {appliedPromo.code} appliqué
                    </span>
                    <button
                      onClick={handleRemovePromo}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Détails prix */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-semibold">{subtotal.toFixed(1)} DH</span>
                </div>
                
                <div className="flex justify-between text-green-600">
                  <span>Économies</span>
                  <span>-{savings.toFixed(1)} DH</span>
                </div>
                
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Code promo ({appliedPromo.code})</span>
                    <span>-{promoDiscount.toFixed(1)} DH</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
                    {shipping === 0 ? 'Gratuite' : `${shipping} DH`}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{total.toFixed(1)} DH</span>
                  </div>
                </div>
              </div>

              {/* Avantages */}
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Shield className="h-4 w-4" />
                  <span>Garantie qualité</span>
                </div>
              </div>

              {/* Role-specific information */}
              {user?.role === 'commercial' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Commande commerciale</p>
                      <p>Cette commande sera associée à votre performance commerciale.</p>
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'client' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium">Prix client appliqués</p>
                      <p>Vous bénéficiez de tarifs préférentiels sur certains produits.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton commander */}
              {canPlaceOrder() ? (
                <Link
                  to="/checkout"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Passer commande</span>
                </Link>
              ) : (
                <div className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 cursor-not-allowed">
                  <AlertCircle className="h-5 w-5" />
                  <span>Commande non autorisée</span>
                </div>
              )}

              {/* Sécurité */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Paiement 100% sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

