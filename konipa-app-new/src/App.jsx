import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FloatingParticles,
  ScrollReveal,
  AnimatedGradient,
  TypewriterText,
  InteractiveCard,
  WaveButton
} from './components/DynamicAnimations';
import {
  MobileNavigation,
  TouchCarousel,
  FloatingActionButton
} from './components/MobileOptimized';
import {
  PulseButton,
  AnimatedHeart,
  AnimatedStars,
  AnimatedCartButton,
  AnimatedCounter,
  AnimatedBadge,
  HoverCard,
  DotLoader,
  TapEffect
} from './components/MicroInteractions';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Bell,
  Heart,
  Car,
  Wrench,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  ArrowRight,
  Truck,
  Shield,
  Clock,
  Award,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Filter,
  Grid,
  List,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  XCircle,
  LogOut,
  Settings,
  UserCircle,
  Moon,
  Sun
} from 'lucide-react';
import './App.css';
import logoKonipa from './assets/logo.webp';
import { productService } from './services/dataService';
import { vehicleService } from './services/vehicleService';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Integrations from './pages/Integrations';
import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage'; // Désactivé - inscription publique interdite
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AllOrders from './pages/AllOrders';
import UnpaidManagement from './pages/UnpaidManagement';
import ComptabiliteDashboard from './pages/ComptabiliteDashboard';
import POSDashboard from './pages/POSDashboard';
import CounterDashboard from './pages/CounterDashboard';
import ClientDashboard from './pages/ClientDashboard';
import CommercialDashboard from './pages/CommercialDashboard';
import Favorites from './pages/Favorites';
import EnhancedUnpaidManagement from './pages/EnhancedUnpaidManagement';
import UserManagement from './pages/UserManagement';
import AdminSettings from './pages/AdminSettings';
import Nouveautes from './pages/Nouveautes';
import Promotions from './pages/Promotions';
import Destockage from './pages/Destockage';
import Categories from './pages/Categories';
import AdminPanel from './pages/AdminPanel';
import AlertDashboard from './pages/AlertDashboard';
import UnifiedAdminDashboard from './pages/UnifiedAdminDashboard';
// import AdminUsers from './pages/AdminUsers';
// import AdminProducts from './pages/AdminProducts';
// import AdminOrders from './pages/AdminOrders';
import AdminClient360 from './pages/AdminClient360';
import AdminMarketing from './pages/AdminMarketing';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminUserManagement from './pages/AdminUserManagement';
import { Documents } from './components/Documents';
import { Substitutes } from './components/Substitutes';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OrderManagement from './components/OrderManagement';
import OrderTracking from './components/OrderTracking';
import HelpPage from './pages/HelpPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import LegalPage from './pages/LegalPage';
import CookiesPage from './pages/CookiesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

import { SimpleNotificationBell } from './components/SimpleNotifications';
import { favoritesService } from './services/FavoritesService';
import Footer from './components/Footer';
import PublicHeader from './components/PublicHeader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { NotificationProvider } from './components/NotificationSystem';
import { ThemeProvider } from './contexts/ThemeContext';
import MobileOptimizedHeader from './components/MobileOptimizedHeader';
import DashboardWidget from './components/DashboardWidget';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedNavigation from './components/auth/RoleBasedNavigation';
import SyncNotifications from './components/common/SyncNotifications';
import RealTimeNotifications from './components/RealTimeNotifications';
import AccountDeactivationHandler from './components/AccountDeactivationHandler';
import InactiveUserHandler from './components/InactiveUserHandler';
import { RealTimeNotificationProvider } from './components/RealTimeNotificationProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingProvider } from './components/GlobalLoadingManager';

// Enhanced Header Component
const Header = () => {
  const { user, logout, hasPermission, hasAnyRole, isAuthenticated } = useAuth();
  const { cartItems, favoritesCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState({
    brand: '',
    model: '',
    year: ''
  });

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

  // Calculate cart items count
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const vehicleBrands = vehicleService.getBrands();
  const vehicleModels = vehicleService.getModels(selectedVehicle.brand);
  const vehicleYears = vehicleService.getYears();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsUserMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

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

      {/* Main Header */}
      <header className="bg-card shadow-lg border-b-2 border-blue-600 dark:border-blue-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img src={logoKonipa} alt="Konipa" className="h-12 w-auto" />
              <span className="text-2xl font-bold text-blue-600">KONIPA</span>
            </Link>

            {/* Barre de recherche desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher des pièces..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      navigate(`/catalog?search=${encodeURIComponent(e.target.value.trim())}`);
                    }
                  }}
                />
              </div>
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-2 md:space-x-4 mobile-header-actions">

              {/* Bouton Dashboard - Visible pour tous les rôles */}
              {user && (
                <button
                  onClick={() => {
                    const dashboardRoutes = {
                      'commercial': '/commercial',
                      'compta': '/comptabilite',
                      'accounting': '/comptabilite',
                      'accountant': '/comptabilite',
                      'client': '/client',
                      'pos': '/pos',
                      'counter': '/counter',
                      'admin': '/admin-dashboard'
                    };
                    const route = dashboardRoutes[user.role];
                    if (route) {
                      handleNavigation(route);
                    }
                  }}
                  className="hidden md:flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              )}

              {/* Recherche mobile */}
              <div className="md:hidden mobile-search">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        navigate(`/catalog?search=${encodeURIComponent(e.target.value.trim())}`);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Bouton Dashboard Mobile - Plus visible */}
              {user && (
                <button
                  onClick={() => {
                    const dashboardRoutes = {
                      'commercial': '/commercial',
                      'compta': '/comptabilite',
                      'accounting': '/comptabilite',
                      'accountant': '/comptabilite',
                      'client': '/client',
                      'pos': '/pos',
                      'counter': '/counter',
                      'admin': '/admin-dashboard'
                    };
                    const route = dashboardRoutes[user.role];
                    if (route) {
                      setIsMobileMenuOpen(false); // Fermer le menu mobile après navigation
                      handleNavigation(route);
                    }
                  }}
                  className="md:hidden mobile-action-btn px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  title={`Dashboard ${user?.role}`}
                >
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <span className="text-sm">Dashboard</span>
                </button>
              )}

              {/* Notifications */}
              <div className="mobile-action-btn">
                <SimpleNotificationBell />
              </div>

              {/* Bouton Commandes pour comptable */}
              {(user?.role === 'compta' || user?.role === 'accounting' || user?.role === 'accountant') && (
                <div className="relative mobile-action-btn">
                  <TapEffect
                    onTap={() => navigate('/all-orders')}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Gestion des commandes"
                  >
                    <Package className="w-5 h-5 md:w-6 md:h-6" />
                  </TapEffect>
                </div>
              )}

              {/* Favoris animés */}
              <div className="relative mobile-action-btn">
                <TapEffect
                  onTap={() => navigate('/favorites')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Heart className="w-5 h-5 md:w-6 md:h-6" />
                </TapEffect>
                <AnimatedBadge count={favoritesCount} />
              </div>

              {/* Panier animé */}
              <div className="relative mobile-action-btn">
                <TapEffect
                  onTap={() => navigate('/cart')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                </TapEffect>
                <AnimatedBadge count={cartItemsCount} className="bg-orange-500" />
              </div>

              {/* Enhanced User Menu */}
              <div className="relative mobile-action-btn">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs md:text-sm font-medium">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</div>
                  </div>
                </button>

                {/* Enhanced Dropdown menu utilisateur */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-1 z-50 mobile-user-menu"
                    >
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 capitalize mt-1">
                          Rôle: {user?.role}
                        </div>
                      </div>

                      {/* Bouton Dashboard principal - Visible en premier */}
                      <button
                        onClick={() => {
                          const dashboardRoutes = {
                            'commercial': '/commercial',
                            'compta': '/comptabilite',
                            'accounting': '/comptabilite',
                            'accountant': '/comptabilite',
                            'client': '/client',
                            'pos': '/pos',
                            'counter': '/counter',
                            'admin': '/admin-dashboard'
                          };
                          const route = dashboardRoutes[user.role];
                          if (route) {
                            setIsUserMenuOpen(false); // Fermer le menu après navigation
                            handleNavigation(route);
                          }
                        }}
                        className="w-full text-left px-4 py-3 text-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/40 flex items-center space-x-3 transition-all duration-200 font-semibold border-l-4 border-blue-500 shadow-sm hover:shadow-md"
                      >
                        <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">🏠 Mon Dashboard</div>
                          <div className="text-xs opacity-75 capitalize">{user?.role}</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleNavigation('/profile');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Mon Profil</span>
                      </button>

                      {(user?.role === 'client' || user?.role === 'commercial') && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleNavigation('/orders');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>Mes Commandes</span>
                        </button>
                      )}

                      {(user?.role === 'compta' || user?.role === 'accounting' || user?.role === 'accountant' || user?.role === 'admin' || user?.role === 'counter') && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleNavigation('/all-orders');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>Toutes les Commandes</span>
                        </button>
                      )}

                      {/* Boutons spécifiques pour admin seulement */}
                      {user?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleNavigation('/admin-settings');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Paramètres Admin</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleNavigation('/integrations');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Intégrations</span>
                          </button>
                        </>
                      )}

                      {(hasPermission('manage_users') || hasPermission('admin_access')) && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleNavigation('/user-management');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span>Gestion des Utilisateurs</span>
                        </button>
                      )}

                      {hasAnyRole(['admin']) && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleNavigation('/admin-settings');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Paramètres</span>
                        </button>
                      )}

                      {hasAnyRole(['admin']) && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleNavigation('/admin-panel');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span>Gestion des utilisateurs</span>
                        </button>
                      )}

                      <hr className="my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Déconnexion</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu mobile */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4">
            {/* Navigation desktop */}
            <div className="hidden md:flex items-center space-x-8 py-3">
              <button
                onClick={() => handleNavigation('/catalog')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">Catalogue</span>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">11</span>
              </button>

              <button
                onClick={() => handleNavigation('/catalog?category=freinage')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Wrench className="w-5 h-5" />
                <span>Freinage</span>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">11</span>
              </button>

              <button
                onClick={() => handleNavigation('/catalog?category=moteur')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Car className="w-5 h-5" />
                <span>Moteur</span>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">12</span>
              </button>

              <button
                onClick={() => handleNavigation('/catalog?category=suspension')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Suspension</span>
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">8</span>
              </button>

              <button
                onClick={() => handleNavigation('/catalog?category=filtration')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filtration</span>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">14</span>
              </button>

              <button
                onClick={() => handleNavigation('/promotions')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
              >
                <Star className="w-5 h-5" />
                <span>Promotions</span>
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">15</span>
              </button>

              <button
                onClick={() => handleNavigation('/destockage')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                <span>Déstockage</span>
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">8</span>
              </button>

              <button
                onClick={() => handleNavigation('/destockage')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                <span>Déstockage</span>
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">8</span>
              </button>
            </div>

            {/* Navigation mobile responsive */}
            <div className="md:hidden nav-mobile-container">
              <div className="nav-mobile-items">
                <button
                  onClick={() => handleNavigation('/catalog')}
                  className="nav-mobile-item relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span className="font-medium">Catalogue</span>
                  <span className="badge bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">11</span>
                </button>

                <button
                  onClick={() => handleNavigation('/catalog?category=freinage')}
                  className="nav-mobile-item relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Freinage</span>
                  <span className="badge bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">11</span>
                </button>

                <button
                  onClick={() => handleNavigation('/catalog?category=moteur')}
                  className="nav-mobile-item relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Car className="w-4 h-4" />
                  <span>Moteur</span>
                  <span className="badge bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">12</span>
                </button>

                <button
                  onClick={() => handleNavigation('/catalog?category=suspension')}
                  className="nav-mobile-item relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Suspension</span>
                  <span className="badge bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">8</span>
                </button>

                <button
                  onClick={() => handleNavigation('/catalog?category=filtration')}
                  className="nav-mobile-item relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtration</span>
                  <span className="badge bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">14</span>
                </button>

                <button
                  onClick={() => handleNavigation('/promotions')}
                  className="nav-mobile-item relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                >
                  <Star className="w-4 h-4" />
                  <span>Promotions</span>
                  <span className="badge bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">15</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Navigation mobile améliorée */}
        <MobileNavigation
          isOpen={isMenuOpen}
          onToggle={setIsMenuOpen}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          cartItemsCount={cartItems.length}
          user={user}
          onNavigate={handleNavigation}
        />
      </header>
    </>
  );
};

// Composant HomePage
const HomePage = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les produits
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await productService.getProducts();
        setProducts(productsData?.products || []);
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // KPIs personnalisés selon le rôle
  const getKPIs = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { title: 'Uptime API', value: '99.9%', icon: CheckCircle, color: 'blue' },
          { title: 'Erreurs système', value: '0', icon: AlertCircle, color: 'red' },
          { title: 'Utilisateurs actifs', value: '1,247', icon: Users, color: 'blue' },
          { title: 'Commandes aujourd\'hui', value: '89', icon: Package, color: 'blue' }
        ];
      case 'client':
        return [
          { title: 'Mes dépenses', value: '2,450 DH', icon: DollarSign, color: 'blue' },
          { title: 'Mes commandes', value: '12', icon: Package, color: 'blue' },
          { title: 'Mon panier', value: '3 articles', icon: ShoppingCart, color: 'red' },
          { title: 'Mes avoirs', value: '150 DH', icon: Award, color: 'blue' }
        ];
      case 'commercial':
        return [
          { title: 'CA du mois', value: '45,600 DH', icon: TrendingUp, color: 'blue' },
          { title: 'Objectif', value: '78%', icon: Award, color: 'blue' },
          { title: 'Nouveaux clients', value: '8', icon: Users, color: 'blue' },
          { title: 'Devis en cours', value: '15', icon: Package, color: 'red' }
        ];
      case 'compta':
        return [
          { title: 'Encours client', value: '125,400 DH', icon: DollarSign, color: 'red' },
          { title: 'Factures en attente', value: '23', icon: Package, color: 'red' },
          { title: 'TVA à déclarer', value: '8,900 DH', icon: Award, color: 'blue' },
          { title: 'Relances', value: '7', icon: AlertCircle, color: 'red' }
        ];
      default:
        return [
          { title: 'Produits', value: '3,456', icon: Package, color: 'blue' },
          { title: 'Commandes', value: '89', icon: ShoppingCart, color: 'blue' },
          { title: 'Clients', value: '1,247', icon: Users, color: 'blue' },
          { title: 'Revenus', value: '45,230 DH', icon: DollarSign, color: 'red' }
        ];
    }
  };

  const kpis = getKPIs();

  return (
    <div className="min-h-screen bg-background relative transition-colors duration-300">
      {/* Widget Dashboard */}
      <DashboardWidget user={user} />

      {/* Particules flottantes */}
      <FloatingParticles />

      {/* Section héro avec animations dynamiques */}
      <AnimatedGradient className="relative overflow-hidden">
        <section className="text-white py-16 md:py-24 relative z-10">
          <div className="container mx-auto px-4 text-center">
            <ScrollReveal direction="up">
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  type: "spring",
                  stiffness: 100
                }}
              >
                <TypewriterText
                  text={`Bonsoir, ${user?.firstName} !`}
                  delay={500}
                  speed={100}
                />
              </motion.h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <motion.p
                className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Bienvenue sur votre plateforme B2B de pièces automobiles
                <br className="hidden md:block" />
                <span className="text-blue-200">Découvrez l'excellence automobile</span>
              </motion.p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <motion.div
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-2xl md:text-3xl font-semibold mb-8">Trouvez vos pièces par véhicule</h3>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                  <motion.select
                    className="px-6 py-4 rounded-xl text-card-foreground border-2 border-border/30 focus:border-border focus:ring-2 focus:ring-border/50 bg-card/90 backdrop-blur-sm transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option>Sélectionner une marque</option>
                    <option>Renault</option>
                    <option>Peugeot</option>
                    <option>Citroën</option>
                  </motion.select>

                  <motion.select
                    className="px-6 py-4 rounded-xl text-card-foreground border-2 border-border/30 focus:border-border focus:ring-2 focus:ring-border/50 bg-card/90 backdrop-blur-sm transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option>Sélectionner un modèle</option>
                    <option>Clio</option>
                    <option>208</option>
                    <option>C3</option>
                  </motion.select>

                  <motion.select
                    className="px-6 py-4 rounded-xl text-card-foreground border-2 border-border/30 focus:border-border focus:ring-2 focus:ring-border/50 bg-card/90 backdrop-blur-sm transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option>Année</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                  </motion.select>

                  <WaveButton
                    onClick={() => navigate('/catalog')}
                    className="btn-konipa-primary px-8 py-4 text-white font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <Search className="w-5 h-5" />
                    <span>Rechercher</span>
                  </WaveButton>
                </div>
              </motion.div>
            </ScrollReveal>
          </div>
        </section>
      </AnimatedGradient>

      {/* Section Nouveautés et Promotions */}
      <section className="py-16 bg-background relative overflow-hidden">
        <FloatingParticles count={15} />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <motion.div
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4 cursor-pointer hover:scale-105 transition-transform duration-300"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(239, 68, 68, 0.3)',
                    '0 0 30px rgba(37, 99, 235, 0.4)',
                    '0 0 20px rgba(239, 68, 68, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                onClick={() => navigate('/nouveautes')}
              >
                <Star className="w-4 h-4" />
                <span>NOUVEAUTÉS & PROMOTIONS</span>
                <Star className="w-4 h-4" />
              </motion.div>
              <motion.div
                onClick={() => navigate('/promotions')}
                className="cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <TypewriterText
                  text="Découvrez nos dernières offres"
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent"
                />
              </motion.div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { title: 'Freins Brembo', discount: '-25%', price: '299 DH', originalPrice: '399 DH', badge: 'NOUVEAU' },
              { title: 'Filtres Mann', discount: '-15%', price: '89 DH', originalPrice: '105 DH', badge: 'PROMO' },
              { title: 'Amortisseurs KYB', discount: '-30%', price: '450 DH', originalPrice: '650 DH', badge: 'FLASH' }
            ].map((promo, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <motion.div
                  className="bg-card rounded-xl shadow-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className="relative p-6">
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white ${promo.badge === 'NOUVEAU' ? 'bg-blue-500' :
                      promo.badge === 'PROMO' ? 'bg-red-500' : 'bg-gradient-to-r from-red-500 to-blue-500'
                      }`}>
                      {promo.badge}
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground mb-2">{promo.title}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-2xl font-bold text-red-600">{promo.discount}</span>
                      <span className="text-lg text-gray-500 line-through">{promo.originalPrice}</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-4">{promo.price}</div>
                    <button
                      onClick={() => navigate('/promotions')}
                      className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Voir l'offre
                    </button>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tableau de bord */}
      <section className="py-12 bg-background relative overflow-hidden">
        <FloatingParticles count={20} />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <TypewriterText
              text="Tableau de bord"
              className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent"
            />
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <InteractiveCard className="group">
                  <motion.div
                    className={`bg-card rounded-xl shadow-lg p-6 border-l-4 border-${kpi.color}-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium mb-2">{kpi.title}</p>
                        <AnimatedCounter
                          value={parseInt(kpi.value.replace(/[^0-9,]/g, '').replace(/,/g, '')) || 0}
                          duration={2000}
                          className="text-3xl font-bold text-card-foreground"
                        />
                        <span className="text-3xl font-bold text-card-foreground">
                          {kpi.value.includes('DH') ? ' DH' : (kpi.value.includes('%') ? '%' : '')}
                        </span>
                      </div>
                      <motion.div
                        className={`p-3 rounded-full bg-${kpi.color}-100 group-hover:bg-${kpi.color}-200 transition-colors duration-300`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <kpi.icon className={`w-6 h-6 text-${kpi.color}-600`} />
                      </motion.div>
                    </div>
                    <motion.div
                      className={`mt-4 h-1 bg-gradient-to-r from-${kpi.color}-400 to-${kpi.color}-600 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: index * 0.2 + 1, duration: 1 }}
                    />
                  </motion.div>
                </InteractiveCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories principales */}
      <section className="py-20 bg-background relative overflow-hidden">
        <FloatingParticles count={30} />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => navigate('/categories')}
            >
              Catégories principales
            </motion.h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
            {[
              { name: 'Freinage', count: '2,450', color: 'blue', icon: Wrench },
              { name: 'Moteur', count: '3,200', color: 'red', icon: Car },
              { name: 'Suspension', count: '1,800', color: 'blue', icon: TrendingUp },
              { name: 'Filtration', count: '1,200', color: 'blue', icon: Filter },
              { name: 'Éclairage', count: '950', color: 'red', icon: Star },
              { name: 'Carrosserie', count: '2,100', color: 'blue', icon: Shield }
            ].map((category, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <InteractiveCard
                  onClick={() => navigate(`/catalog?category=${category.name.toLowerCase()}`)}
                  className={`bg-card/80 backdrop-blur-sm border-2 border-${category.color}-200 rounded-2xl p-6 md:p-8 text-center transition-all duration-500 hover:shadow-2xl group border border-border/20`}
                >
                  <motion.div
                    className="group-hover:scale-110 transition-transform duration-300 mb-3"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <category.icon className={`w-8 h-8 text-${category.color}-600 mx-auto`} />
                  </motion.div>
                  <h3 className={`font-semibold text-${category.color}-800 mb-1 group-hover:text-blue-600 transition-colors duration-300`}>{category.name}</h3>
                  <p className="text-muted-foreground text-sm">{category.count} produits</p>
                </InteractiveCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Produits vedettes */}
      <section className="py-20 bg-background relative overflow-hidden">
        <AnimatedGradient className="absolute inset-0" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="flex justify-between items-center mb-16">
              <motion.h2
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent"
              >
                Produits vedettes
              </motion.h2>
              <WaveButton
                onClick={() => navigate('/catalog')}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2 bg-card/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>Voir tout le catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </WaveButton>
            </div>
          </ScrollReveal>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.slice(0, 8).map((product, index) => (
              <ScrollReveal key={product.id} direction="up" delay={index * 0.1}>
                <InteractiveCard className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                  <div className="relative">
                    <motion.div
                      className="h-48 bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </motion.div>
                    {product.discount > 0 && (
                      <motion.div
                        className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        -{product.discount}%
                      </motion.div>
                    )}
                    {product.isNew && (
                      <motion.div
                        className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Nouveau
                      </motion.div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="text-blue-600 font-semibold text-sm mb-1 group-hover:text-indigo-600 transition-colors duration-300">{product.brand}</p>
                    <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">{product.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">Réf: {product.reference}</p>

                    <div className="flex items-center mb-2">
                      <AnimatedStars rating={product.rating} className="flex items-center" />
                      <span className="text-muted-foreground text-sm ml-2">({product.reviews})</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <motion.span
                          className="text-xl font-bold text-card-foreground"
                          whileHover={{ scale: 1.1 }}
                        >
                          {product.price} DH
                        </motion.span>
                        {product.originalPrice && (
                          <span className="text-muted-foreground line-through text-sm">{product.originalPrice} DH</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <motion.span
                        className={`text-sm font-medium px-3 py-1 rounded-full ${product.stock > 0
                          ? 'text-green-600 bg-green-100'
                          : 'text-red-600 bg-red-100'
                          }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {product.stock > 0 ? 'En stock' : 'Rupture'}
                      </motion.span>
                      <div className="flex items-center space-x-2">
                        <TapEffect>
                          <motion.button
                            className="p-2 rounded-full bg-muted hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-all duration-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <AnimatedHeart className="w-4 h-4" />
                          </motion.button>
                        </TapEffect>
                        <PulseButton
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          Voir détail
                        </PulseButton>
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              </ScrollReveal>
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <TouchCarousel
              items={products.slice(0, 8).map((product, index) => (
                <InteractiveCard key={product.id} className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mx-2 min-w-[280px] overflow-hidden">
                  <div className="relative">
                    <motion.div
                      className="h-48 bg-muted flex items-center justify-center rounded-xl mb-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </motion.div>
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        -{product.discount}%
                      </div>
                    )}
                    {product.isNew && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        Nouveau
                      </div>
                    )}
                  </div>

                  <p className="text-blue-600 font-semibold text-sm mb-1">{product.brand}</p>
                  <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">Réf: {product.reference}</p>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < product.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground text-sm ml-2">({product.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-card-foreground">{product.price} DH</span>
                      {product.originalPrice && (
                        <span className="text-muted-foreground line-through text-sm">{product.originalPrice} DH</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {product.stock > 0 ? 'En stock' : 'Rupture'}
                    </span>
                    <WaveButton
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                    >
                      Voir détail
                    </WaveButton>
                  </div>
                </InteractiveCard>
              ))}
            />
          </div>
        </div>
      </section>

      {/* Section confiance */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-red-600 text-white relative overflow-hidden">
        <FloatingParticles count={40} color="white" />
        <AnimatedGradient className="absolute inset-0 opacity-30" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <ScrollReveal direction="up">
            <motion.h2 className="text-4xl md:text-5xl font-bold mb-6">
              <TypewriterText
                text="Votre satisfaction, notre priorité"
                className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
              />
            </motion.h2>
            <motion.p
              className="text-xl md:text-2xl mb-16 text-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Des pièces de qualité, un service client exceptionnel et une livraison rapide.
            </motion.p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: Truck, title: "Livraison Express", desc: "Recevez vos commandes en 24/48h partout au Maroc.", color: "from-green-400 to-blue-500" },
              { icon: Shield, title: "Qualité Certifiée", desc: "Toutes nos pièces sont d'origine ou de qualité équivalente.", color: "from-yellow-400 to-orange-500" },
              { icon: Clock, title: "Support Dédié", desc: "Une équipe d'experts à votre écoute 6j/7.", color: "from-purple-400 to-pink-500" }
            ].map((item, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.2}>
                <InteractiveCard className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500">
                  <motion.div
                    className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center shadow-lg`}
                    whileHover={{
                      scale: 1.1,
                      rotate: [0, -5, 5, 0],
                      boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.h3
                    className="text-2xl font-semibold mb-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    {item.title}
                  </motion.h3>
                  <p className="text-blue-100 text-lg leading-relaxed">{item.desc}</p>
                </InteractiveCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bouton d'action flottant pour mobile */}
      <FloatingActionButton
        onClick={() => navigate('/catalog')}
        className="md:hidden"
        icon={<Search className="w-6 h-6" />}
        expandedContent={
          <div className="flex flex-col space-y-2">
            <div
              onClick={() => navigate('/catalog')}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-blue-700 transition-colors text-center"
            >
              Catalogue
            </div>
            <div
              onClick={() => navigate('/cart')}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-green-700 transition-colors text-center"
            >
              Panier ({cartItems.length})
            </div>
          </div>
        }
      />
    </div>
  );
};

// Enhanced Protected Route Component
// ProtectedRoute component moved to separate file: src/components/auth/ProtectedRoute.jsx

// Composant Layout principal
const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {isAuthenticated ? <MobileOptimizedHeader /> : <PublicHeader />}
      <main>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
      <Footer />

      {/* Notifications de synchronisation */}
      {isAuthenticated && <SyncNotifications />}

      {/* Notifications en temps réel */}
      {isAuthenticated && <RealTimeNotifications />}

      {/* Bouton flottant de mode sombre */}
      {isAuthenticated && (
        <motion.button
          onClick={toggleDarkMode}
          className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDarkMode ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </motion.div>

          {/* Effet de shimmer */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
        </motion.button>
      )}
    </div>
  );
};

// Composant App principal
function App() {
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <ThemeProvider>
          <AuthProvider>
            <AccountDeactivationHandler />
            <InactiveUserHandler />
            <CartProvider>
              <NotificationProvider>
                <RealTimeNotificationProvider>
                  <Router>
                    <div className="min-h-screen bg-gray-50">
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/login-alt" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                        {/* <Route path="/register" element={<RegisterPage />} /> */} {/* Désactivé - inscription publique interdite */}
                        <Route path="/profile" element={<Profile />} />

                        <Route path="/" element={
                          <ProtectedRoute>
                            <Layout>
                              <HomePage />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/catalog" element={
                          <ProtectedRoute>
                            <Layout>
                              <Catalog />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/product/:id" element={
                          <ProtectedRoute>
                            <Layout>
                              <ProductDetail />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin-dashboard" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <UnifiedAdminDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin-settings" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <AdminSettings />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/integrations" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <Integrations />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/alerts" element={
                          <ProtectedRoute allowedRoles={['admin', 'accountant', 'commercial', 'counter', 'pos']}>
                            <Layout>
                              <AlertDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/cart" element={
                          <ProtectedRoute>
                            <Layout>
                              <Cart />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/checkout" element={
                          <ProtectedRoute>
                            <Layout>
                              <Checkout />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/orders" element={
                          <ProtectedRoute>
                            <Layout>
                              <Orders />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/all-orders" element={
                          <ProtectedRoute allowedRoles={['compta', 'accounting', 'accountant', 'admin', 'counter']}>
                            <Layout>
                              <AllOrders />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/old-profile" element={
                          <ProtectedRoute>
                            <Layout>
                              <Profile />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/unpaid-management" element={
                          <ProtectedRoute>
                            <Layout>
                              <UnpaidManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/comptabilite" element={
                          <ProtectedRoute allowedRoles={['compta', 'accounting', 'accountant']}>
                            <Layout>
                              <ComptabiliteDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/pos" element={
                          <ProtectedRoute allowedRoles={['pos']}>
                            <Layout>
                              <POSDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/counter" element={
                          <ProtectedRoute allowedRoles={['counter']}>
                            <Layout>
                              <CounterDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/client" element={
                          <ProtectedRoute allowedRoles={['client']}>
                            <Layout>
                              <ClientDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/commercial" element={
                          <ProtectedRoute allowedRoles={['commercial']}>
                            <Layout>
                              <CommercialDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/favorites" element={
                          <ProtectedRoute>
                            <Layout>
                              <Favorites />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/enhanced-unpaid" element={
                          <ProtectedRoute allowedRoles={['compta', 'accounting', 'accountant', 'admin']}>
                            <Layout>
                              <EnhancedUnpaidManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/user-management" element={
                          <ProtectedRoute requiredAnyPermission={['manage_users', 'admin_access']}>
                            <Layout>
                              <UserManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/users" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <AdminUserManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/nouveautes" element={
                          <ProtectedRoute>
                            <Layout>
                              <Nouveautes />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/promotions" element={
                          <ProtectedRoute>
                            <Layout>
                              <Promotions />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/destockage" element={
                          <ProtectedRoute>
                            <Layout>
                              <Destockage />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/categories" element={
                          <ProtectedRoute>
                            <Layout>
                              <Categories />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/order-management" element={
                          <ProtectedRoute allowedRoles={['admin', 'compta', 'accounting', 'accountant', 'counter']}>
                            <Layout>
                              <OrderManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/order-tracking" element={
                          <ProtectedRoute allowedRoles={['client']}>
                            <Layout>
                              <OrderTracking />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin-panel" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <UnifiedAdminDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Routes Admin spécialisées */}
                        <Route path="/admin/users" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              {/* <AdminUsers /> */}
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/products" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              {/* <AdminProducts /> */}
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/orders" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              {/* <AdminOrders /> */}
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/client/:id" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <AdminClient360 />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/marketing" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <AdminMarketing />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/analytics" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Layout>
                              <AdminAnalytics />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/documents" element={
                          <ProtectedRoute allowedRoles={['admin', 'compta', 'accounting', 'accountant', 'commercial']}>
                            <Layout>
                              <Documents />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/substitutes/:productId?" element={
                          <ProtectedRoute allowedRoles={['admin', 'commercial']}>
                            <Layout>
                              <Substitutes />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Pages publiques */}
                        <Route path="/help" element={
                          <Layout>
                            <HelpPage />
                          </Layout>
                        } />
                        <Route path="/terms" element={
                          <Layout>
                            <TermsPage />
                          </Layout>
                        } />
                        <Route path="/privacy" element={
                          <Layout>
                            <PrivacyPage />
                          </Layout>
                        } />
                        <Route path="/legal" element={
                          <Layout>
                            <LegalPage />
                          </Layout>
                        } />
                        <Route path="/cookies" element={
                          <Layout>
                            <CookiesPage />
                          </Layout>
                        } />
                        <Route path="/about" element={
                          <Layout>
                            <AboutPage />
                          </Layout>
                        } />
                        <Route path="/contact" element={
                          <Layout>
                            <ContactPage />
                          </Layout>
                        } />

                        {/* Redirection par défaut */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </Router>
                </RealTimeNotificationProvider>
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
}

export default App;
