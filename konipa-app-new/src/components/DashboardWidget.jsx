import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  ShoppingCart,
  FileText,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Configuration des données selon le rôle
  const getDashboardData = () => {
    switch (user.role) {
      case 'admin':
        return {
          title: 'Dashboard Admin',
          color: 'from-red-500 to-red-600',
          bgColor: 'from-red-50 to-red-100',
          textColor: 'text-red-700',
          route: '/admin-dashboard',
          stats: [
            { label: 'Utilisateurs', value: '156', icon: Users, change: '+12%' },
            { label: 'Commandes', value: '2,847', icon: Package, change: '+8%' },
            { label: 'Revenus', value: '€45,230', icon: DollarSign, change: '+15%' },
            { label: 'Produits', value: '1,234', icon: ShoppingCart, change: '+3%' }
          ]
        };
      case 'commercial':
        return {
          title: 'Dashboard Commercial',
          color: 'from-blue-500 to-blue-600',
          bgColor: 'from-blue-50 to-blue-100',
          textColor: 'text-blue-700',
          route: '/commercial',
          stats: [
            { label: 'Ventes du mois', value: '€12,450', icon: DollarSign, change: '+22%' },
            { label: 'Clients actifs', value: '89', icon: Users, change: '+5%' },
            { label: 'Commandes', value: '156', icon: Package, change: '+18%' },
            { label: 'Objectif', value: '78%', icon: TrendingUp, change: '+12%' }
          ]
        };
      case 'compta':
      case 'accounting':
      case 'accountant':
        return {
          title: 'Dashboard Comptabilité',
          color: 'from-green-500 to-green-600',
          bgColor: 'from-green-50 to-green-100',
          textColor: 'text-green-700',
          route: '/comptabilite',
          stats: [
            { label: 'Factures en attente', value: '23', icon: FileText, change: '-8%' },
            { label: 'Paiements reçus', value: '€8,920', icon: DollarSign, change: '+12%' },
            { label: 'Impayés', value: '€2,340', icon: BarChart3, change: '-15%' },
            { label: 'Rapports', value: '12', icon: FileText, change: '+3%' }
          ]
        };
      case 'client':
        return {
          title: 'Mon Espace Client',
          color: 'from-indigo-500 to-indigo-600',
          bgColor: 'from-indigo-50 to-indigo-100',
          textColor: 'text-indigo-700',
          route: '/client',
          stats: [
            { label: 'Mes commandes', value: '12', icon: Package, change: '+2' },
            { label: 'Favoris', value: '28', icon: ShoppingCart, change: '+5' },
            { label: 'Points fidélité', value: '1,250', icon: TrendingUp, change: '+150' },
            { label: 'Économies', value: '€245', icon: DollarSign, change: '+€45' }
          ]
        };
      case 'pos':
        return {
          title: 'Dashboard POS',
          color: 'from-orange-500 to-orange-600',
          bgColor: 'from-orange-50 to-orange-100',
          textColor: 'text-orange-700',
          route: '/pos',
          stats: [
            { label: 'Ventes du jour', value: '€1,245', icon: DollarSign, change: '+12%' },
            { label: 'Transactions', value: '67', icon: Package, change: '+8%' },
            { label: 'Clients', value: '45', icon: Users, change: '+15%' },
            { label: 'Moyenne panier', value: '€28', icon: ShoppingCart, change: '+€3' }
          ]
        };
      case 'counter':
        return {
          title: 'Dashboard Comptoir',
          color: 'from-teal-500 to-teal-600',
          bgColor: 'from-teal-50 to-teal-100',
          textColor: 'text-teal-700',
          route: '/counter',
          stats: [
            { label: 'Commandes traitées', value: '34', icon: Package, change: '+6' },
            { label: 'En attente', value: '8', icon: FileText, change: '-2' },
            { label: 'Clients servis', value: '42', icon: Users, change: '+12' },
            { label: 'Temps moyen', value: '3.2min', icon: BarChart3, change: '-0.5min' }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          color: 'from-gray-500 to-gray-600',
          bgColor: 'from-gray-50 to-gray-100',
          textColor: 'text-gray-700',
          route: '/dashboard',
          stats: []
        };
    }
  };

  const dashboardData = getDashboardData();

  const handleViewFullDashboard = () => {
    navigate(dashboardData.route);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      {/* Widget Header - Toujours visible */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`bg-gradient-to-r ${dashboardData.bgColor} dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden`}
      >
        {/* Header cliquable */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer p-4 flex items-center justify-between hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${dashboardData.color} rounded-full flex items-center justify-center`}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${dashboardData.textColor} dark:text-white`}>
                {dashboardData.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Bienvenue, {user.name || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isExpanded ? 'Réduire' : 'Voir plus'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </div>
        </div>

        {/* Contenu extensible */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 dark:border-gray-600"
            >
              <div className="p-4">
                {/* Statistiques en grille */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {dashboardData.stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className={`w-5 h-5 ${dashboardData.textColor} dark:text-white`} />
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          stat.change.startsWith('+') 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Bouton pour voir le dashboard complet */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={handleViewFullDashboard}
                  className={`w-full bg-gradient-to-r ${dashboardData.color} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 group`}
                >
                  <Eye className="w-5 h-5" />
                  <span>Afficher le dashboard complet</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DashboardWidget;