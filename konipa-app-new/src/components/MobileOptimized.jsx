import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

// Composant de navigation mobile avec gestes
export const MobileNavigation = ({ 
  isOpen, 
  onToggle, 
  isAuthenticated, 
  onLogout, 
  cartItemsCount, 
  user, 
  onNavigate 
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-300, 0], [0, 1]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x < -100) {
      onToggle(false);
    }
  };

  const menuItems = [
    {
      icon: '🏠',
      label: 'Accueil',
      path: '/',
      show: true
    },
    {
      icon: '📦',
      label: 'Catalogue',
      path: '/catalog',
      show: true,
      badge: '11'
    },
    {
      icon: '🛒',
      label: 'Mon Panier',
      path: '/cart',
      show: isAuthenticated,
      badge: cartItemsCount > 0 ? cartItemsCount.toString() : null
    },
    {
      icon: '❤️',
      label: 'Mes Favoris',
      path: '/favorites',
      show: isAuthenticated
    },
    {
      icon: '📋',
      label: 'Mes Commandes',
      path: '/orders',
      show: isAuthenticated && (user?.role === 'client' || user?.role === 'commercial')
    },
    {
      icon: '👤',
      label: 'Mon Profil',
      path: '/profile',
      show: isAuthenticated
    }
  ];

  // Ajouter des éléments spécifiques selon le rôle
  if (user?.role === 'commercial') {
    menuItems.push({
      icon: '📊',
      label: 'Dashboard Commercial',
      path: '/commercial',
      show: true
    });
  }

  if (user?.role === 'compta' || user?.role === 'accounting' || user?.role === 'accountant') {
    menuItems.push({
      icon: '💰',
      label: 'Comptabilité',
      path: '/comptabilite',
      show: true
    });
  }

  if (user?.role === 'admin') {
    menuItems.push({
      icon: '🎯',
      label: 'Dashboard CEO',
      path: '/ceo',
      show: true
    });
  }

  if (user?.role === 'client') {
    menuItems.push({
      icon: '🏢',
      label: 'Dashboard Client',
      path: '/client',
      show: true
    });
  }

  if (user?.role === 'admin') {
    menuItems.push(
      {
        icon: '👥',
        label: 'Gestion Utilisateurs',
        path: '/user-management',
        show: true
      },
      {
        icon: '⚙️',
        label: 'Paramètres',
        path: '/admin-settings',
        show: true
      }
    );
  }

  const categories = [
    { icon: '🔧', label: 'Freinage', path: '/catalog?category=freinage', badge: '11' },
    { icon: '🚗', label: 'Moteur', path: '/catalog?category=moteur', badge: '12' },
    { icon: '📈', label: 'Suspension', path: '/catalog?category=suspension', badge: '8' },
    { icon: '🔍', label: 'Filtration', path: '/catalog?category=filtration', badge: '14' },
    { icon: '⭐', label: 'Promotions', path: '/promotions', badge: '15' },
    { icon: '🏷️', label: 'Déstockage', path: '/destockage', badge: '8' }
  ];

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={() => onToggle(false)}
      />
      
      {/* Menu mobile */}
      <motion.div
        className="fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 lg:hidden overflow-y-auto"
        style={{ x, opacity }}
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="x"
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">KONIPA</h2>
                {user && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.name || user.email}
                  </p>
                )}
              </div>
            </div>
            <motion.button
              onClick={() => onToggle(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Menu principal */}
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 mb-3">
              Navigation
            </h3>
            {menuItems.filter(item => item.show).map((item, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  onNavigate(item.path);
                  onToggle(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Catégories */}
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 mb-3">
              Catégories
            </h3>
            {categories.map((category, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  onNavigate(category.path);
                  onToggle(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                </div>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {category.badge}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Actions utilisateur */}
          {isAuthenticated && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                onClick={() => {
                  onLogout();
                  onToggle(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">🚪</span>
                <span className="font-medium">Déconnexion</span>
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Composant de carrousel tactile
export const TouchCarousel = ({ items, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const threshold = 50;
    
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (info.offset.x < -threshold && currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`} ref={constraintsRef}>
      <motion.div
        className="flex"
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{ x: -currentIndex * 100 + '%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="w-full flex-shrink-0 px-2"
            style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
          >
            {item}
          </motion.div>
        ))}
      </motion.div>
      
      {/* Indicateurs */}
      <div className="flex justify-center mt-4 space-x-2">
        {items.map((_, index) => (
          <motion.button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            onClick={() => setCurrentIndex(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
          />
        ))}
      </div>
      
      {/* Boutons de navigation */}
      <button
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg"
        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg"
        onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
        disabled={currentIndex === items.length - 1}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Composant de carte avec geste de balayage
export const SwipeCard = ({ children, onSwipeLeft, onSwipeRight, className = '' }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      onSwipeRight && onSwipeRight();
    } else if (info.offset.x < -threshold) {
      onSwipeLeft && onSwipeLeft();
    }
  };

  return (
    <motion.div
      className={`cursor-grab active:cursor-grabbing ${className}`}
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05 }}
    >
      {children}
    </motion.div>
  );
};

// Composant de bouton flottant avec animations
export const FloatingActionButton = ({ icon, onClick, className = '', expandedContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
    >
      <motion.button
        className="bg-blue-600 text-white rounded-full shadow-lg"
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          width: isExpanded && expandedContent ? 'auto' : 56,
          paddingLeft: isExpanded && expandedContent ? 16 : 0,
          paddingRight: isExpanded && expandedContent ? 16 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="flex items-center justify-center h-14">
          {typeof icon === 'function' ? React.createElement(icon, { className: 'w-6 h-6' }) : icon}
          {expandedContent && (
            <motion.div
              className="ml-2"
              initial={{ opacity: 0, width: 0 }}
              animate={{
                opacity: isExpanded ? 1 : 0,
                width: isExpanded ? 'auto' : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              {expandedContent}
            </motion.div>
          )}
        </div>
      </motion.button>
    </motion.div>
  );
};

// Composant de pull-to-refresh
export const PullToRefresh = ({ onRefresh, children, className = '' }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, 100], [0, 180]);

  const handleDragEnd = async (event, info) => {
    if (info.offset.y > 100 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setIsPulling(false);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ y }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.3}
      onDragStart={() => setIsPulling(true)}
      onDragEnd={handleDragEnd}
    >
      {/* Indicateur de refresh */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex items-center justify-center h-16"
        animate={{
          opacity: isPulling ? 1 : 0,
          y: isPulling ? 16 : 0,
        }}
      >
        <motion.div
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
          style={{ rotate }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        />
      </motion.div>
      
      {children}
    </motion.div>
  );
};

// Composant de notification toast mobile
export const MobileToast = ({ message, type = 'info', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <motion.div
      className={`fixed top-4 left-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50`}
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(event, info) => {
        if (info.offset.y < -50) {
          onClose();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{message}</span>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="ml-4 p-1 rounded-full hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};