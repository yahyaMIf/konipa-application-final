import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Bell,
  Heart,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Settings,
  UserCircle,
  Moon,
  Sun,
  ChevronDown,
  Home,
  Package,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import logoKonipa from '../assets/logo.webp';
import { vehicleService } from '../services/vehicleService';
import NotificationCenter from './notifications/NotificationCenter';

const MobileOptimizedHeader = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItems, favoritesCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState({
    brand: '',
    model: '',
    year: ''
  });
  const [vehicles, setVehicles] = useState({ brands: [], models: {}, years: [] });

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehicleData = await vehicleService.getVehicles();
        setVehicles(vehicleData);
      } catch (error) {
        // Fallback avec des données vides
        setVehicles({ brands: [], models: {}, years: [] });
      }
    };
    
    loadVehicles();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Gestion du mode sombre
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const vehicleBrands = vehicles.brands;
  const vehicleModels = vehicles.models[selectedVehicle.brand] || [];
  const vehicleYears = vehicles.years;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsSearchOpen(false);
  };

  // Si ce n'est pas mobile, retourner le header original
  if (!isMobile) {
    return (
      <>
        {/* Top Bar */}
        <div className="bg-gray-900 dark:bg-gray-950 text-white py-2 px-4 text-sm">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+212 522 607 272</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>contact@konipa.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Casablanca, Maroc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header - Version PC originale */}
        <header className="bg-card shadow-lg border-b-2 border-blue-600 dark:border-blue-500">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-3">
                <img src={logoKonipa} alt="Konipa" className="h-12 w-auto" />
                <span className="text-2xl font-bold text-blue-600">KONIPA</span>
              </Link>

              {/* Barre de recherche */}
              <div className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                {isAuthenticated && (
                  <>
                    <button 
                      onClick={() => handleNavigation('/favorites')}
                      className="relative p-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Heart className="w-6 h-6" />
                      {favoritesCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {favoritesCount}
                        </span>
                      )}
                    </button>

                    <NotificationCenter />

                    {(user?.role === 'client' || user?.role === 'commercial') && (
                      <button 
                        onClick={() => handleNavigation('/cart')}
                        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <ShoppingCart className="w-6 h-6" />
                        {cartItemsCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cartItemsCount}
                          </span>
                        )}
                      </button>
                    )}

                    <div className="relative">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <span className="hidden md:block text-gray-700">{user?.firstName}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </button>

                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                          >
                            <button
                              onClick={() => handleNavigation('/profile')}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <UserCircle className="w-4 h-4" />
                              <span>Mon profil</span>
                            </button>
                            {(user?.role === 'client' || user?.role === 'commercial') && (
                              <button
                                onClick={() => handleNavigation('/orders')}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Package className="w-4 h-4" />
                                <span>Mes commandes</span>
                              </button>
                            )}
                            <hr className="my-2" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Se déconnecter</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {!isAuthenticated && (
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Connexion
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  // Version mobile optimisée
  return (
    <>
      {/* Top Bar Mobile - Simplifié */}
      <div className="bg-slate-900 text-white py-2 px-4 text-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Phone className="w-3 h-3" />
            <span>+212 522 607 272</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-1 rounded hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Header Mobile Principal */}
      <header className="bg-white dark:bg-slate-900 shadow-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Mobile */}
            <Link to="/" className="flex items-center space-x-2">
              <img src={logoKonipa} alt="Konipa" className="h-8 w-auto" />
              <span className="text-lg font-bold text-blue-600">KONIPA</span>
            </Link>

            {/* Actions Mobile */}
            <div className="flex items-center space-x-2">
              {/* Recherche Mobile */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>

              {isAuthenticated && (
                <>
                  {/* Favoris Mobile */}
                  <button 
                    onClick={() => handleNavigation('/favorites')}
                    className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Heart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {favoritesCount > 9 ? '9+' : favoritesCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Mobile */}
                  <NotificationCenter />

                  {/* Panier Mobile */}
                  {(user?.role === 'client' || user?.role === 'commercial') && (
                    <button 
                      onClick={() => handleNavigation('/cart')}
                      className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      {cartItemsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                          {cartItemsCount > 9 ? '9+' : cartItemsCount}
                        </span>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* Menu Hamburger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-200 dark:border-slate-700 px-4 py-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher des pièces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500"
                  autoFocus
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <div className="px-4 py-4">
                {isAuthenticated ? (
                  <>
                    {/* Profil utilisateur */}
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Navigation mobile */}
                    <div className="space-y-1">
                      <button
                        onClick={() => handleNavigation('/')}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Home className="w-5 h-5" />
                        <span>Accueil</span>
                      </button>
                      
                      <button
                        onClick={() => handleNavigation('/catalog')}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Package className="w-5 h-5" />
                        <span>Catalogue</span>
                      </button>
                      
                      <button
                        onClick={() => handleNavigation('/favorites')}
                        className="w-full flex items-center justify-between px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Heart className="w-5 h-5" />
                          <span>Favoris</span>
                        </div>
                        {favoritesCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {favoritesCount}
                          </span>
                        )}
                      </button>
                      
                      {(user?.role === 'client' || user?.role === 'commercial') && (
                        <button
                          onClick={() => handleNavigation('/cart')}
                          className="w-full flex items-center justify-between px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <ShoppingCart className="w-5 h-5" />
                            <span>Panier</span>
                          </div>
                          {cartItemsCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {cartItemsCount}
                            </span>
                          )}
                        </button>
                      )}
                      
                      {(user?.role === 'client' || user?.role === 'commercial') && (
                        <button
                          onClick={() => handleNavigation('/orders')}
                          className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Package className="w-5 h-5" />
                          <span>Mes commandes</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleNavigation('/profile')}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <UserCircle className="w-5 h-5" />
                        <span>Mon profil</span>
                      </button>
                      
                      <button
                        className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Paramètres</span>
                      </button>
                    </div>
                    
                    {/* Déconnexion */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleNavigation('/login')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Se connecter
                    </button>
                    <button
                      onClick={() => handleNavigation('/catalog')}
                      className="w-full py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Voir le catalogue
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default MobileOptimizedHeader;