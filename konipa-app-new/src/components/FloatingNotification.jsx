import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShoppingCart, X, Package, AlertCircle, AlertTriangle } from 'lucide-react';

const FloatingNotification = ({ type, message, productName, onClose }) => {
  useEffect(() => {
    if (type && message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, message, onClose]);

  if (!type || !message) return null;

  const getIcon = () => {
    switch (type) {
      case 'cart':
        return <ShoppingCart className="h-6 w-6" />;
      case 'success':
        return <CheckCircle className="h-6 w-6" />;
      case 'error':
        return <AlertCircle className="h-6 w-6" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6" />;
      case 'product':
        return <Package className="h-6 w-6" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'cart':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'cart':
        return 'Ajouté au panier';
      case 'success':
        return 'Succès';
      case 'error':
        return 'Erreur';
      case 'warning':
        return 'Attention';
      default:
        return 'Notification';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className={`${getColor()} text-white rounded-lg shadow-lg p-4 flex items-center space-x-3`}>
          <div className="flex-shrink-0 text-white">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{getTitle()}</p>
                <p className="text-xs opacity-90">{message}</p>
                {productName && type === 'cart' && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{productName}</p>
                      <p className="text-xs opacity-75">Ajouté avec succès</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingNotification;