import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { 
  ShoppingCart as CartIcon, Package, Clock, CheckCircle, XCircle, 
  AlertTriangle, DollarSign, TrendingUp, Calendar, Eye, Download,
  CreditCard, Receipt, FileText, User, Mail, Phone, MapPin,
  Building, Truck, Star, MessageCircle, Settings, Bell
} from 'lucide-react';
import dataService, { productService, orderService, statisticsService, pricingService } from '../services/dataService';
import DocumentService from '../services/DocumentService';
import { apiService } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import OrderHistory from '../components/OrderHistory';
import ProductCatalog from '../components/ProductCatalog';
import ShoppingCart from '../components/ShoppingCart';
import CustomerProfile from '../components/CustomerProfile';
import InvoiceGenerator from '../components/InvoiceGenerator';
import FloatingNotification from '../components/FloatingNotification';
import { notificationService } from '../services/NotificationService';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();

  // Fonction pour gérer l'ajout au panier de manière asynchrone
  const handleAddToCart = async (product) => {
    await addToCart(product);
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState(null);

  // Quick actions handlers
  const handleDownloadStatement = async () => {
    try {
      // Prepare statement data for PDF generation
      const statementData = {
        client: user,
        orders: orders,
        totalAmount: orders.reduce((sum, order) => sum + order.total, 0),
        generatedDate: new Date().toISOString(),
        period: 'current_month'
      };
      
      // Generate PDF using DocumentService
      await DocumentService.generateAccountStatement(statementData);
      
      setNotification({
        type: 'success',
        message: 'Relevé de compte PDF téléchargé avec succès'
      });
      
      // Log the event
      notificationService.addNotification({
        type: 'info',
        message: `Relevé de compte généré pour ${user?.firstName} ${user?.lastName}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erreur lors de la génération du relevé de compte'
      });
    }
  };

  const handleContactAccounting = () => {
    // Simulate contacting accounting
    setNotification({
      type: 'info',
      message: 'Redirection vers la messagerie comptabilité...'
    });
    // In a real app, you would open a chat or email interface
  };

  const handleScheduleAppointment = () => {
    // Simulate appointment scheduling
    setNotification({
      type: 'info',
      message: 'Ouverture du calendrier de rendez-vous...'
    });
    // In a real app, you would open a calendar booking interface
  };
  // Client financial data - initialized empty, filled from backend
  const [creditLimit, setCreditLimit] = useState({
    limit: 0,
    used: 0,
    available: 0,
    status: 'inactive'
  });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [accountingIssues, setAccountingIssues] = useState([]);

  useEffect(() => {
    const loadClientData = async () => {
      try {
        setLoading(true);
        
        // Load products, orders, and users
        const [productsData, ordersData, usersData] = await Promise.all([
          productService.getProducts(),
          orderService.getOrders(),
          dataService.getUsers()
        ]);
        
        setProducts(productsData || []);
        setUsers(usersData || []);
        
        // Filter orders for current client
        const allOrders = ordersData || [];
        if (user && user.role === 'client') {
          const clientOrders = allOrders.filter(order => order.customerId === user.id);
          setOrders(clientOrders);
        } else {
          setOrders(allOrders);
        }
        
      } catch (error) {
        // Fallback to empty data
        setProducts([]);
        setUsers([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadClientData();
  }, [user]);

  const [clientPricing, setClientPricing] = useState([]);

  // Load client-specific pricing
  useEffect(() => {
    const loadClientPricing = async () => {
      if (user?.id) {
        try {
          const pricing = await pricingService.getClientPricing(user.id);
          setClientPricing(pricing || []);
        } catch (error) {
          setClientPricing([]);
        }
      }
    };
    
    loadClientPricing();
  }, [user?.id]);
  
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const placeOrder = () => {
    if (cartItems.length === 0) return;
    
    const orderTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Vérifier la limite de crédit
    if (creditLimit.used + orderTotal > creditLimit.limit) {
      showNotification('error', 'Limite de crédit dépassée. Contactez la comptabilité.');
      return;
    }

    const order = {
      id: `ORD-${Date.now()}`,
      customerId: user.id,
      items: cartItems,
      total: orderTotal,
      status: 'pending',
      date: new Date().toISOString(),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    setOrders([order, ...orders]);
    setCreditLimit(prev => ({ ...prev, used: prev.used + orderTotal, available: prev.available - orderTotal }));
    clearCart();
    showNotification('success', 'Commande passée avec succès!');
    notificationService.addNotification('client', 'Nouvelle commande créée', 'order');
  };
  
  const handlePaymentRequest = (paymentId) => {
    showNotification('info', 'Demande de paiement envoyée à la comptabilité');
    notificationService.addNotification('accountant', `Demande de paiement client: ${paymentId}`, 'payment');
  };
  
  const handleCreditLimitRequest = () => {
    showNotification('info', 'Demande d\'augmentation de limite envoyée');
    notificationService.addNotification('admin', 'Demande d\'augmentation de limite de crédit', 'credit');
    notificationService.addNotification('accountant', 'Demande d\'augmentation de limite de crédit', 'credit');
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Données pour les graphiques
  const orderHistoryData = [
    { month: 'Jan', orders: 3, amount: 15000 },
    { month: 'Fév', orders: 5, amount: 22000 },
    { month: 'Mar', orders: 2, amount: 9000 },
    { month: 'Avr', orders: 4, amount: 18000 },
    { month: 'Mai', orders: 6, amount: 28000 },
    { month: 'Jun', orders: 3, amount: 14000 }
  ];
  
  const getOrderStats = () => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing').length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    
    return { totalOrders, totalSpent, pendingOrders, deliveredOrders };
  };
  
  const stats = getOrderStats();

  if (!user || user.role !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
              <p className="text-gray-600 mb-6">
                Cette page est réservée aux clients. Votre rôle actuel est : <span className="font-semibold">{user?.role || 'non défini'}</span>
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Pour accéder au dashboard client, connectez-vous avec un compte client :
                <br />
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  Email: client@konipa.fr<br />
                  Mot de passe: client123
                </span>
              </p>
              
              <button
                onClick={() => {
                  navigate('/login');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Retourner à la connexion
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Retour à la page précédente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données client...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {notification && (
        <FloatingNotification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {user.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Espace client - Gestion complète de votre compte</p>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total commandes</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total dépensé</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.totalSpent.toLocaleString()} DH</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">En cours</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Crédit disponible</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{creditLimit.available.toLocaleString()} DH</p>
              </div>
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </motion.div>
        </div>
        
        {/* Limite de crédit */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Limite de crédit</h2>
            <button
              onClick={handleCreditLimitRequest}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium self-start sm:self-auto"
            >
              Demander augmentation
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilisé: {creditLimit.used.toLocaleString()} DH</span>
              <span>Limite: {creditLimit.limit.toLocaleString()} DH</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  (creditLimit.used / creditLimit.limit) > 0.8 ? 'bg-red-600' :
                  (creditLimit.used / creditLimit.limit) > 0.6 ? 'bg-yellow-600' : 'bg-green-600'
                }`}
                style={{ width: `${(creditLimit.used / creditLimit.limit) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600">
              Disponible: {creditLimit.available.toLocaleString()} DH
            </p>
          </div>
        </div>
        
        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide px-3 sm:px-6">
              <div className="flex space-x-2 sm:space-x-8 min-w-max">
                {[
                  { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp, shortLabel: 'Vue' },
                  { id: 'orders', label: 'Mes commandes', icon: Package, shortLabel: 'Commandes' },
                  { id: 'cart', label: 'Mon panier', icon: CartIcon, shortLabel: 'Panier' },
                  { id: 'payments', label: 'Paiements', icon: CreditCard, shortLabel: 'Paiements' },
                  { id: 'accounting', label: 'Comptabilité', icon: Receipt, shortLabel: 'Compta' },
                  { id: 'profile', label: 'Mon profil', icon: User, shortLabel: 'Profil' }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
          
          <div className="p-3 sm:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Graphique historique des commandes */}
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Historique des commandes</h3>
                  <div className="overflow-x-auto">
                    <ResponsiveContainer width="100%" height={250} minWidth={300}>
                      <BarChart data={orderHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="orders" fill="#3B82F6" name="Nombre de commandes" />
                        <Bar dataKey="amount" fill="#10B981" name="Montant (DH)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Commandes récentes */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Commandes récentes</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                          <div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{order.id}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{new Date(order.date).toLocaleDateString()}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{order.items?.length || 0} articles</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-medium text-gray-900">{order.total.toLocaleString()} DH</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'delivered' ? 'Livrée' :
                               order.status === 'shipped' ? 'Expédiée' :
                               order.status === 'processing' ? 'En cours' : 'En attente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Alertes comptabilité */}
                {accountingIssues.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Points à régler avec la comptabilité</h3>
                    <div className="space-y-3">
                      {accountingIssues.map((issue) => (
                        <div key={issue.id} className={`p-4 rounded-lg border ${
                          issue.priority === 'high' ? 'bg-red-50 border-red-200' :
                          issue.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{issue.description}</p>
                              <p className="text-sm text-gray-600">{new Date(issue.date).toLocaleDateString()}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                              issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {issue.priority === 'high' ? 'Urgent' :
                               issue.priority === 'medium' ? 'Moyen' : 'Faible'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Mes commandes</h3>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    Exporter
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Articles</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.items?.length || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total.toLocaleString()} DH</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'delivered' ? 'Livrée' :
                               order.status === 'shipped' ? 'Expédiée' :
                               order.status === 'processing' ? 'En cours' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Download className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'cart' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Catalogue Produits</h3>
                    <ProductCatalog
                      products={products}
                      onAddToCart={handleAddToCart}
                      selectedCustomer={user}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Mon Panier</h3>
                    <ShoppingCart
                      cart={cartItems}
                      onRemoveFromCart={removeFromCart}
                      onUpdateQuantity={updateQuantity}
                      total={cartTotal}
                      customer={user}
                    />
                    
                    <button 
                      onClick={placeOrder}
                      disabled={cartItems.length === 0 || creditLimit.used + cartTotal > creditLimit.limit}
                      className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {creditLimit.used + cartTotal > creditLimit.limit ? 'Limite de crédit dépassée' : 'Passer la commande'}
                    </button>
                    
                    {creditLimit.used + cartTotal > creditLimit.limit && (
                      <p className="text-sm text-red-600 mt-2">
                        Contactez la comptabilité pour augmenter votre limite de crédit.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Paiements en attente</h3>
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <p className="text-sm text-gray-600">Échéance: {payment.dueDate}</p>
                          <p className="text-lg font-semibold text-red-600">{payment.amount.toLocaleString()} DH</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePaymentRequest(payment.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Demander délai
                          </button>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status === 'overdue' ? 'En retard' : 'En attente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'accounting' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Gestion comptable</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Limite de crédit</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Limite actuelle:</span>
                        <span className="font-medium">{creditLimit.limit.toLocaleString()} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Montant utilisé:</span>
                        <span className="font-medium text-red-600">{creditLimit.used.toLocaleString()} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disponible:</span>
                        <span className="font-medium text-green-600">{creditLimit.available.toLocaleString()} DH</span>
                      </div>
                      <button
                        onClick={handleCreditLimitRequest}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mt-4"
                      >
                        Demander augmentation
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Actions rapides</h4>
                    <div className="space-y-3">
                      <button 
                        onClick={handleDownloadStatement}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Receipt className="h-5 w-5 text-blue-600 mr-3" />
                          <span>Télécharger relevé de compte</span>
                        </div>
                      </button>
                      <button 
                        onClick={handleContactAccounting}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <MessageCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span>Contacter la comptabilité</span>
                        </div>
                      </button>
                      <button 
                        onClick={handleScheduleAppointment}
                        className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                          <span>Planifier un rendez-vous</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div>
                <CustomerProfile user={user} />
              </div>
            )}
          </div>
        </div>

        {showInvoice && selectedOrder && (
          <InvoiceGenerator
            order={selectedOrder}
            customer={user}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
