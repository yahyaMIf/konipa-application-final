import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import clientDiscountService from '../services/ClientDiscountService';
import productLimitService from '../services/ProductLimitService';
import promotionService from '../services/PromotionService';
import FloatingNotification from '../components/FloatingNotification';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notification, setNotification] = useState(null);
  const mountedRef = useRef(true);
  const currentUserRef = useRef(null);

  // Charger le panier depuis le localStorage par utilisateur
  useEffect(() => {
    if (!mountedRef.current) return;
    
    // Éviter les rechargements inutiles si l'utilisateur n'a pas changé
    const userId = user?.id || user?.email;
    if (currentUserRef.current === userId) {
      return;
    }
    
    currentUserRef.current = userId;
    
    if (user) {
      const userCartKey = `konipa_cart_${user.id || user.email || 'default'}`;
      const userFavoritesKey = `konipa_favorites_${user.id || user.email || 'default'}`;
      
      const savedCart = localStorage.getItem(userCartKey);
      const savedFavorites = localStorage.getItem(userFavoritesKey);
      
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (error) {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    } else {
      // Si pas d'utilisateur connecté, vider le panier
      setCartItems([]);
      setFavorites([]);
    }
  }, [user?.id, user?.email]);

  // Sauvegarder le panier dans le localStorage par utilisateur
  useEffect(() => {
    if (!mountedRef.current || !user) return;
    
    const userCartKey = `konipa_cart_${user.id || user.email || 'default'}`;
    localStorage.setItem(userCartKey, JSON.stringify(cartItems));
  }, [cartItems, user?.id, user?.email]);

  // Sauvegarder les favoris dans le localStorage par utilisateur
  useEffect(() => {
    if (!mountedRef.current || !user) return;
    
    const userFavoritesKey = `konipa_favorites_${user.id || user.email || 'default'}`;
    localStorage.setItem(userFavoritesKey, JSON.stringify(favorites));
  }, [favorites, user?.id, user?.email]);
  
  // Effet de nettoyage lors du démontage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Obtenir le prix pour un client spécifique
  const getItemPrice = async (product) => {
    let basePrice = product.price;
    
    // Appliquer les promotions
    const promotionalPrice = promotionService.calculatePromotionalPrice(product.id, basePrice);
    if (promotionalPrice < basePrice) {
      basePrice = promotionalPrice;
    }
    
    // Appliquer la réduction client spécifique
    if (user && user.role === 'client') {
      const clientDiscount = clientDiscountService.getClientDiscount(user.id);
      if (clientDiscount > 0) {
        basePrice = basePrice * (1 - clientDiscount / 100);
      }
      
      // Vérifier aussi les prix clients spécifiques (ancien système)
      try {
        const clientPriceData = await apiService.get(`clients/${user.id}/products/${product.id}/price`);
        if (clientPriceData && clientPriceData.price !== null && clientPriceData.price < basePrice) {
          basePrice = clientPriceData.price;
        }
      } catch (error) {
        // Ignorer les erreurs de prix client spécifique
        }
    }
    
    return Math.round(basePrice * 100) / 100; // Arrondir à 2 décimales
  };

  // Obtenir la limite de quantité pour un produit
  const getQuantityLimit = (productId) => {
    if (user && user.role === 'client') {
      const limit = productLimitService.getProductLimit(user.id, productId);
      return limit || 100; // Limite par défaut si aucune limite spécifique
    }
    return 1000; // Pas de limite pour les autres rôles
  };

  const showNotification = (type, message, productName = '') => {
    setNotification({ type, message, productName });
    setTimeout(() => setNotification(null), 3000);
  };

  // Ajouter un produit au panier
  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      showNotification('error', 'Veuillez vous connecter pour ajouter des articles au panier');
      return false;
    }

    // Vérifier l'éligibilité d'achat pour les clients
    if (user && user.role === 'client') {
      const canPurchase = productLimitService.canPurchase(user.id, product.id, quantity);
      if (!canPurchase.eligible) {
        showNotification('error', `Limite d'achat dépassée: ${canPurchase.message}`);
        return false;
      }
    }

    const existingItem = cartItems.find(item => item.id === product.id);
    const price = await getItemPrice(product);
    const maxQuantity = getQuantityLimit(product.id);

    if (existingItem) {
      const newQuantity = Math.min(existingItem.quantity + quantity, maxQuantity);
      
      // Vérifier à nouveau avec la nouvelle quantité totale
      if (user && user.role === 'client') {
        const canPurchaseTotal = productLimitService.canPurchase(user.id, product.id, newQuantity - existingItem.quantity);
        if (!canPurchaseTotal.eligible) {
          showNotification('error', `Limite d'achat dépassée: ${canPurchaseTotal.message}`);
          return false;
        }
      }
      
      setCartItems(items =>
        items.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, price }
            : item
        )
      );
    } else {
      const finalQuantity = Math.min(quantity, maxQuantity);
      setCartItems(items => [
        ...items,
        {
          ...product,
          quantity: finalQuantity,
          price,
          addedAt: new Date().toISOString()
        }
      ]);
    }
    
    showNotification('cart', `${product.name} ajouté au panier`, product.name);
    return true;
  };

  // Mettre à jour la quantité d'un produit
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const maxQuantity = getQuantityLimit(productId);
    const finalQuantity = Math.min(newQuantity, maxQuantity);

    setCartItems(items =>
      items.map(item =>
        item.id === productId
          ? { ...item, quantity: finalQuantity }
          : item
      )
    );
  };

  // Supprimer un produit du panier
  const removeFromCart = (productId) => {
    setCartItems(items => items.filter(item => item.id !== productId));
  };

  // Vider le panier
  const clearCart = () => {
    setCartItems([]);
  };

  // Ajouter/supprimer des favoris
  const toggleFavorite = (product) => {
    const productId = typeof product === 'object' ? product.id : product;
    const isFavorite = favorites.some(fav => fav.id === productId);
    
    if (isFavorite) {
      setFavorites(favs => favs.filter(fav => fav.id !== productId));
    } else {
      const productData = typeof product === 'object' ? product : { id: productId };
      setFavorites(favs => [...favs, { ...productData, addedAt: new Date().toISOString() }]);
    }
  };

  // Vérifier si un produit est en favoris
  const isFavorite = (productId) => {
    return favorites.some(fav => fav.id === productId);
  };

  // Obtenir les IDs des favoris pour compatibilité
  const getFavoriteIds = () => {
    return favorites.map(fav => fav.id);
  };

  // Calculer le total du panier
  const getCartTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculer la réduction promo
    let promoDiscount = 0;
    if (appliedPromo) {
      promoDiscount = appliedPromo.type === 'percentage' 
        ? subtotal * (appliedPromo.discount / 100)
        : appliedPromo.discount;
    }
    
    // Calculer les frais de livraison
    const shipping = subtotal > 500 ? 0 : 25;
    
    // Calculer le total final
    const total = subtotal - promoDiscount + shipping;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      promoDiscount: Math.round(promoDiscount * 100) / 100,
      shipping,
      total: Math.round(total * 100) / 100
    };
  };

  // Calculer le nombre total d'articles
  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Calculer les économies totales
  const getTotalSavings = () => {
    return cartItems.reduce((savings, item) => {
      const originalPrice = item.originalPrice || item.price;
      return savings + ((originalPrice - item.price) * item.quantity);
    }, 0);
  };

  // Gestion des codes promo
  const [appliedPromo, setAppliedPromo] = useState(null);
  
  const applyPromoCode = (code) => {
    // Codes promo disponibles
    const promoCodes = {
      'WELCOME10': { discount: 10, type: 'percentage' },
      'SAVE50': { discount: 50, type: 'fixed' },
      'NEWCLIENT': { discount: 15, type: 'percentage' }
    };
    
    if (promoCodes[code]) {
      setAppliedPromo({ code, ...promoCodes[code] });
      return true;
    }
    return false;
  };
  
  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  // Enregistrer les achats lors de la finalisation de commande
  const recordPurchases = () => {
    if (user && user.role === 'client') {
      cartItems.forEach(item => {
        productLimitService.recordPurchase(user.id, item.id, item.quantity);
      });
    }
  };

  const value = {
    cartItems,
    favorites,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    recordPurchases,
    toggleFavorite,
    isFavorite,
    getFavoriteIds,
    getCartTotal,
    getCartItemsCount,
    getTotalSavings,
    getItemPrice,
    getQuantityLimit,
    appliedPromo,
    applyPromoCode,
    removePromoCode
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {notification && (
        <FloatingNotification
          type={notification.type}
          message={notification.message}
          productName={notification.productName}
          onClose={() => setNotification(null)}
        />
      )}
    </CartContext.Provider>
  );
};

export default CartProvider;