import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, ShoppingCart, Calendar, Target, Award, Globe, Settings, Bell, Mail, FileText, BarChart3, PieChart as PieChartIcon, Activity, Package, CheckCircle, XCircle, Clock, AlertTriangle, AlertCircle, Download, Plus, Eye, Edit, Trash2, Filter, Search, Ban, X, EyeOff, Copy, RefreshCw, Key, Home, BookOpen, Megaphone, List, Grid, Info, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, setToken } from '../services/apiService';
import { ceoJournalService } from '../services/ceoJournalService';
import dataService, { productService, orderService, statisticsService, userService } from '../services/dataService';
import pricingService from '../services/pricingService';
import { notificationService } from '../services/NotificationService';
import ExportService from '../services/ExportService';
import DocumentService from '../services/DocumentService';
import authService from '../services/authService';
import ClientCreditManager from '../components/ClientCreditManager';
import PasswordGenerator from '../components/PasswordGenerator';
import ProductManagementModal from '../components/ProductManagementModal';
import NotificationBell from '../components/NotificationBell';
import NotificationToast from '../components/NotificationToast';
import { generatePassword, evaluatePasswordStrength } from '../utils/passwordGenerator';
import useNotifications from '../hooks/useNotifications';
import { useRealTimeSync, useRealTimeUsers, useRealTimeOrders, useRealTimeProducts, useRealTimeStats } from '../hooks/useRealTimeSync';
import CEOJournal from '../components/CEOJournal';
import RealTimeSyncIndicator from '../components/RealTimeSyncIndicator';
import RealTimeSyncToast from '../components/RealTimeSyncToast';
import './AdminPanel.css';

const UnifiedAdminDashboard = () => {
  const { user } = useAuth();
  const {
    notifications: userNotifications,
    unreadCount,
    toastNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    removeToastNotification,
    refreshNotifications
  } = useNotifications(user);

  // Hooks de synchronisation temps réel
  const {
    isConnected,
    isConnecting,
    connectionError,
    lastSyncTime: lastUpdate,
    connect,
    disconnect,
    forceSync
  } = useRealTimeSync({
    autoConnect: true,
    enableCache: true,
    syncInterval: 30000, // Synchronisation toutes les 30 secondes
    onConnectionChange: (status) => {
      console.log('État de connexion temps réel:', status);
      if (status.connected) {
        addNotification({
          type: 'success',
          title: 'Synchronisation temps réel activée',
          message: 'Les données sont maintenant synchronisées en temps réel'
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Synchronisation temps réel désactivée',
          message: 'Reconnexion en cours...'
        });
      }
    },
    onDataUpdate: (type, data) => {
      console.log(`Données ${type} mises à jour:`, data);
    }
  });

  // Variables dérivées pour la compatibilité avec RealTimeSyncIndicator
  const lastSyncTime = lastUpdate;
  const connectionStatus = { connected: isConnected, connecting: isConnecting, error: connectionError };
  const syncStatus = isConnected ? 'connected' : 'disconnected';
  const reconnect = connect;

  const { users: realtimeUsers, userEvents, syncUsers } = useRealTimeUsers();
  const { orders: realtimeOrders, orderEvents } = useRealTimeOrders();
  const { products: realtimeProducts, productEvents } = useRealTimeProducts();
  const { stats: realtimeStatistics } = useRealTimeStats();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [unpaidData, setUnpaidData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);

  // États pour la gestion des commandes (fonctionnalités CEO)
  const [newOrder, setNewOrder] = useState({
    customer: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    total: 0,
    date: '',
    transporter: '',
    deliveryAddress: '',
    notes: '',
    priority: 'normal',
    paymentMethod: 'comptoir'
  });
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // États pour la gestion des utilisateurs (fonctionnalités Admin)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'client'
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    city: '',
    isActive: true
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showPasswordGeneratorModal, setShowPasswordGeneratorModal] = useState(false);

  // États pour la gestion des prix clients (fonctionnalités CEO)
  const [clientPricing, setClientPricing] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);
  const [pricingPagination, setPricingPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [pricingForm, setPricingForm] = useState({
    client_id: '',
    product_id: '',
    category_name: '',
    discount_percent: '',
    fixed_price: '',
    minimum_quantity: 1,
    valid_from: '',
    valid_until: '',
    notes: '',
    is_active: true
  });
  const [showProductLimitModal, setShowProductLimitModal] = useState(false);
  const [productLimitForm, setProductLimitForm] = useState({ productId: '', productName: '', maxQuantity: '' });
  const [showProductManagementModal, setShowProductManagementModal] = useState(false);

  // États pour les modales de détails des widgets
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [showPreparingOrdersModal, setShowPreparingOrdersModal] = useState(false);
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // États pour les filtres de produits
  const [productFilters, setProductFilters] = useState({
    search: '',
    category: '',
    supplier: '',
    status: '',
    priceRange: '',
    stockLevel: ''
  });
  const [productSortBy, setProductSortBy] = useState('name');
  const [productSortOrder, setProductSortOrder] = useState('asc');
  const [productViewMode, setProductViewMode] = useState('grid');

  // États pour les notifications
  const [notificationFilters, setNotificationFilters] = useState({
    type: 'all',
    category: 'all',
    priority: 'all',
    read: 'all',
    search: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [notificationSortBy, setNotificationSortBy] = useState('timestamp');
  const [notificationSortOrder, setNotificationSortOrder] = useState('desc');

  // États pour la tarification
  const [pricingFilters, setPricingFilters] = useState({
    search: '',
    status: '',
    discountRange: '',
    quantityRange: '',
    hasSpecificProducts: ''
  });
  const [pricingSortBy, setPricingSortBy] = useState('clientName');
  const [pricingSortOrder, setPricingSortOrder] = useState('asc');
  const [pricingViewMode, setPricingViewMode] = useState('grid');

  // Vérifier si l'utilisateur est admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Accès refusé</h2>
          <p>Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Utiliser les données temps réel quand disponibles, sinon charger manuellement
  useEffect(() => {
    if (isConnected && realtimeUsers.length > 0) {
      setUsers(realtimeUsers);
    } else {
      loadUsers(showPasswords);
    }
  }, [isConnected, realtimeUsers, showPasswords]);

  useEffect(() => {
    if (isConnected && realtimeOrders.length > 0) {
      setOrders(realtimeOrders);
    } else {
      loadOrders();
    }
  }, [isConnected, realtimeOrders]);

  useEffect(() => {
    loadNotifications();
    loadAvailableProducts();
    loadPricing();
  }, []);

  // Afficher les événements temps réel dans les notifications
  useEffect(() => {
    if (userEvents.length > 0) {
      const latestEvent = userEvents[0];
      addNotification({
        type: 'info',
        title: 'Utilisateur mis à jour',
        message: `${latestEvent.type}: ${latestEvent.user.email}`,
        timestamp: latestEvent.timestamp
      });
    }
  }, [userEvents, addNotification]);

  useEffect(() => {
    if (orderEvents.length > 0) {
      const latestEvent = orderEvents[0];
      addNotification({
        type: 'info',
        title: 'Commande mise à jour',
        message: `${latestEvent.type}: Commande #${latestEvent.order.id}`,
        timestamp: latestEvent.timestamp
      });
    }
  }, [orderEvents, addNotification]);

  useEffect(() => {
    if (productEvents.length > 0) {
      const latestEvent = productEvents[0];
      addNotification({
        type: 'info',
        title: 'Produit mis à jour',
        message: `${latestEvent.type}: ${latestEvent.product.name}`,
        timestamp: latestEvent.timestamp
      });
    }
  }, [productEvents, addNotification]);

  const loadUsers = async (withPasswords = false) => {
    try {
      setLoading(true);

      // Synchroniser le token avec le service d'authentification
      if (user?.token) {
        authService.syncToken(user.token);
      }

      const response = await authService.getAllUsers();
      console.log('Response from getAllUsers:', response);

      if (response && response.success && response.users) {
        setUsers(response.users);
      } else {
        console.warn('Format de réponse inattendu:', response);
        setUsers([]);
      }
      setError(null);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setError('Erreur de connexion');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await orderService.getOrders();
      setOrders(ordersData || []);
    } catch (error) {
    }
  };

  const loadNotifications = async () => {
    try {
      // Charger les notifications pour l'admin
      const adminUser = { role: 'admin', id: user.id, email: user.email };
      const adminNotifications = notificationService.getNotificationsForUser(adminUser);
      // S'assurer que adminNotifications est un tableau
      setNotifications(Array.isArray(adminNotifications) ? adminNotifications : []);
    } catch (error) {
      setNotifications([]); // Définir un tableau vide en cas d'erreur
    }
  };

  const loadAvailableProducts = async () => {
    try {
      // Synchroniser le token avec apiService
      if (user?.token) {
        setToken(user.token);
      }

      const productsData = await productService.getProducts();
      setAvailableProducts(productsData?.products || []);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const loadPricing = async (page = 1) => {
    try {
      setPricingLoading(true);
      setPricingError(null);

      // Synchroniser le token avec apiService
      if (user?.token) {
        setToken(user.token);
      }

      const response = await pricingService.getAllPricing({ page, limit: pricingPagination.items_per_page });

      if (response && response.success) {
        setClientPricing(response.data || []);
        setPricingPagination({
          current_page: response.pagination?.current_page || 1,
          total_pages: response.pagination?.total_pages || 1,
          total_items: response.pagination?.total_items || 0,
          items_per_page: response.pagination?.items_per_page || 20
        });
      } else {
        setClientPricing([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tarifications:', error);
      setPricingError('Erreur lors du chargement des tarifications');
      setClientPricing([]);
    } finally {
      setPricingLoading(false);
    }
  };

  const handlePricingSubmit = async () => {
    try {
      setPricingLoading(true);

      // Synchroniser le token avec apiService
      if (user?.token) {
        setToken(user.token);
      }

      if (editingPricing) {
        const response = await pricingService.updatePricing(editingPricing.id, pricingForm);
        if (response && response.success) {
          addNotification({
            type: 'success',
            title: 'Tarification mise à jour',
            message: 'La tarification a été mise à jour avec succès'
          });
          loadPricing(pricingPagination.current_page);
        }
      } else {
        const response = await pricingService.createPricing(pricingForm);
        if (response && response.success) {
          addNotification({
            type: 'success',
            title: 'Tarification créée',
            message: 'La nouvelle tarification a été créée avec succès'
          });
          loadPricing(1);
        }
      }

      setShowPricingForm(false);
      setEditingPricing(null);
      setPricingForm({
        client_id: '',
        product_id: '',
        category_name: '',
        discount_percent: '',
        fixed_price: '',
        minimum_quantity: 1,
        valid_from: '',
        valid_until: '',
        notes: '',
        is_active: true
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la sauvegarde de la tarification'
      });
    } finally {
      setPricingLoading(false);
    }
  };

  const handleDeletePricing = async (pricingId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tarification ?')) {
      return;
    }

    try {
      setPricingLoading(true);

      // Synchroniser le token avec apiService
      if (user?.token) {
        setToken(user.token);
      }

      const response = await pricingService.deletePricing(pricingId);

      if (response && response.success) {
        addNotification({
          type: 'success',
          title: 'Tarification supprimée',
          message: 'La tarification a été supprimée avec succès'
        });
        loadPricing(pricingPagination.current_page);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression de la tarification'
      });
    } finally {
      setPricingLoading(false);
    }
  };

  const handleEditPricing = (pricing) => {
    setEditingPricing(pricing);
    setPricingForm({
      client_id: pricing.client_id || '',
      product_id: pricing.product_id || '',
      category_name: pricing.category_name || '',
      discount_percent: pricing.discount_percent || '',
      fixed_price: pricing.fixed_price || '',
      minimum_quantity: pricing.minimum_quantity || 1,
      valid_from: pricing.valid_from || '',
      valid_until: pricing.valid_until || '',
      notes: pricing.notes || '',
      is_active: pricing.is_active !== undefined ? pricing.is_active : true
    });
    setShowPricingForm(true);
  };

  // Calculs pour les KPIs - disponibles dans tout le composant
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const todayOrders = safeOrders.filter(order => {
    const orderDate = new Date(order.date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const monthOrders = safeOrders.filter(order => {
    const orderDate = new Date(order.date);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });

  const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  const pendingOrders = safeOrders.filter(order => order.status === 'pending' || order.status === 'en_attente');
  const preparingOrders = safeOrders.filter(order => order.status === 'preparing' || order.status === 'en_preparation');
  const blockedUsers = safeUsers.filter(user => user.status === 'blocked' || user.isBlocked);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const result = await authService.createUser(formData);

      if (result.success) {
        // Logger la création d'utilisateur dans le journal CEO
        adminJournalService.logUserCreation(formData.email, formData.role, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          createdBy: user?.email || 'Admin',
          createdById: user?.id
        });

        setShowCreateForm(false);
        setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'client' });
        loadUsers();
      } else {
        setError(result.error || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const result = await authService.updateUser(editingUser.id, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });

      if (result.success) {
        setEditingUser(null);
        setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'client' });
        loadUsers();
      } else {
        setError(result.error || 'Erreur lors de la mise à jour de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const result = await authService.deleteUser(userId);

        if (result.success) {
          loadUsers();
        } else {
          setError(result.error || 'Erreur lors de la suppression de l\'utilisateur');
        }
      } catch (err) {
        setError('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const generateNewPassword = () => {
    const newPassword = generatePassword(12, true, true, true, true);
    setFormData({ ...formData, password: newPassword });
  };

  // Fonction de test des notifications
  const testNotifications = () => {
    const testMessages = [
      { type: 'success', title: 'Test Succès', message: 'Notification de test réussie' },
      { type: 'error', title: 'Test Erreur', message: 'Notification d\'erreur de test' },
      { type: 'warning', title: 'Test Avertissement', message: 'Notification d\'avertissement de test' },
      { type: 'info', title: 'Test Information', message: 'Notification d\'information de test' }
    ];

    testMessages.forEach((notif, index) => {
      setTimeout(() => {
        addToastNotification({
          type: notif.type,
          title: notif.title,
          message: notif.message,
          duration: 4000
        });
      }, index * 1000);
    });

    // Ajouter aussi une notification système
    addNotification({
      type: 'info',
      title: 'Test du système de notifications',
      message: 'Test automatique du système de notifications administrateur',
      priority: 'medium',
      category: 'system'
    });
  };

  // Onglets du dashboard unifié
  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'users', label: 'Gestion Utilisateurs', icon: Users },
    { id: 'validation', label: 'Commandes en Validation', icon: CheckCircle },
    { id: 'products', label: 'Gestion Produits', icon: Package },
    { id: 'pricing', label: 'Tarification Clients', icon: DollarSign },
    { id: 'credit', label: 'Crédit Clients', icon: Target },
    { id: 'reports', label: 'Rapports & Analytics', icon: BarChart3 },
    { id: 'journal', label: 'Journal d\'Activité', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'validation':
        return renderValidationTab();
      case 'products':
        return renderProductsTab();
      case 'pricing':
        return renderPricingTab();
      case 'credit':
        return renderCreditTab();
      case 'reports':
        return renderReportsTab();
      case 'journal':
        return renderJournalTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => {

    return (
      <div className="space-y-6">
        {/* Message de bienvenue personnalisé */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Bonjour, {user?.firstName || 'Administrateur'} !</h2>
          <p className="text-blue-100">Voici le tableau de bord de contrôle de votre plateforme Konipa</p>
        </div>

        {/* Widgets Clés - Première rangée */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowUsersModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
                <p className="text-3xl font-bold text-gray-900">{safeUsers.filter(u => u.status !== 'blocked').length}</p>
                <p className="text-xs text-gray-500 mt-1">Total: {safeUsers.length}</p>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowOrdersModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes Aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-900">{todayOrders.length}</p>
                <p className="text-xs text-gray-500 mt-1">Ce mois: {monthOrders.length}</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowRevenueModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA Aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-900">{todayRevenue.toLocaleString('fr-FR')}€</p>
                <p className="text-xs text-gray-500 mt-1">Ce mois: {monthRevenue.toLocaleString('fr-FR')}€</p>
              </div>
              <DollarSign className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowProductsModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produits Catalogue</p>
                <p className="text-3xl font-bold text-gray-900">{availableProducts.length}</p>
                <p className="text-xs text-gray-500 mt-1">Références actives</p>
              </div>
              <Package className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Widgets d'Alertes - Deuxième rangée */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowPendingOrdersModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes en Attente</p>
                <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
                <p className="text-xs text-gray-500 mt-1">Validation comptabilité</p>
              </div>
              <Clock className="h-12 w-12 text-orange-500" />
            </div>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-indigo-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowPreparingOrdersModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Préparation</p>
                <p className="text-3xl font-bold text-indigo-600">{preparingOrders.length}</p>
                <p className="text-xs text-gray-500 mt-1">Comptoir</p>
              </div>
              <Activity className="h-12 w-12 text-indigo-500" />
            </div>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowBlockedUsersModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients Bloqués</p>
                <p className="text-3xl font-bold text-red-600">{blockedUsers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Nécessite attention</p>
              </div>
              <Ban className="h-12 w-12 text-red-500" />
            </div>
          </div>

          <div
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-pink-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowNotificationsModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-3xl font-bold text-pink-600">{Array.isArray(notifications) ? notifications.length : 0}</p>
                <p className="text-xs text-gray-500 mt-1">Non lues</p>
              </div>
              <Bell className="h-12 w-12 text-pink-500" />
            </div>
          </div>
        </div>

        {/* Système d'Alertes Avancé */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Centre d'Alertes en Temps Réel
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Alertes Critiques */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Alertes Critiques</p>
                  <p className="text-2xl font-bold text-red-900">3</p>
                </div>
                <div className="animate-pulse">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
              <p className="text-xs text-red-600 mt-1">Stock épuisé, commandes urgentes</p>
            </div>

            {/* Alertes Moyennes */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Alertes Moyennes</p>
                  <p className="text-2xl font-bold text-yellow-900">7</p>
                </div>
                <div className="animate-pulse">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              <p className="text-xs text-yellow-600 mt-1">Stock faible, retards de livraison</p>
            </div>

            {/* Alertes Info */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Informations</p>
                  <p className="text-2xl font-bold text-blue-900">12</p>
                </div>
                <div className="animate-pulse">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-1">Nouveaux comptes, mises à jour</p>
            </div>

            {/* Système OK */}
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Système OK</p>
                  <p className="text-2xl font-bold text-green-900">✓</p>
                </div>
                <div className="animate-pulse">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-1">Tous les services fonctionnent</p>
            </div>
          </div>

          {/* Liste des Alertes Détaillées */}
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-700">Alertes Récentes</h4>

            {/* Alerte Critique */}
            <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-800">Stock épuisé - Produit #12345</p>
                  <span className="text-xs text-red-600">Il y a 5 min</span>
                </div>
                <p className="text-xs text-red-600 mt-1">Le produit "Ordinateur Portable Dell" n'a plus de stock disponible</p>
                <div className="flex space-x-2 mt-2">
                  <button className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">
                    Réapprovisionner
                  </button>
                  <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Marquer comme lu
                  </button>
                </div>
              </div>
            </div>

            {/* Alerte Moyenne */}
            <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-yellow-800">Commande en retard - #CMD-2024-001</p>
                  <span className="text-xs text-yellow-600">Il y a 15 min</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">Livraison prévue hier, client Ahmed Benali attend une mise à jour</p>
                <div className="flex space-x-2 mt-2">
                  <button className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded">
                    Contacter transporteur
                  </button>
                  <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Voir détails
                  </button>
                </div>
              </div>
            </div>

            {/* Alerte Info */}
            <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Users className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-800">Nouveau compte créé</p>
                  <span className="text-xs text-blue-600">Il y a 30 min</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Fatima Zahra (Représentant) a créé un compte pour Société ALAMI</p>
                <div className="flex space-x-2 mt-2">
                  <button className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
                    Voir profil
                  </button>
                  <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Approuver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques et Rapports Stratégiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique d'évolution du CA */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Évolution du Chiffre d'Affaires
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { name: 'Jan', ca: 45000, commandes: 120 },
                  { name: 'Fév', ca: 52000, commandes: 140 },
                  { name: 'Mar', ca: 48000, commandes: 130 },
                  { name: 'Avr', ca: 61000, commandes: 165 },
                  { name: 'Mai', ca: 55000, commandes: 150 },
                  { name: 'Juin', ca: monthRevenue, commandes: monthOrders.length }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [name === 'ca' ? `${value.toLocaleString('fr-FR')}€` : value, name === 'ca' ? 'CA' : 'Commandes']} />
                  <Legend />
                  <Line type="monotone" dataKey="ca" stroke="#10B981" strokeWidth={3} name="CA (€)" />
                  <Line type="monotone" dataKey="commandes" stroke="#3B82F6" strokeWidth={2} name="Commandes" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Produits/Catégories */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              Top Catégories de Produits
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Électronique', value: 35, color: '#3B82F6' },
                      { name: 'Mobilier', value: 25, color: '#10B981' },
                      { name: 'Textile', value: 20, color: '#F59E0B' },
                      { name: 'Alimentaire', value: 15, color: '#EF4444' },
                      { name: 'Autres', value: 5, color: '#8B5CF6' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {[
                      { name: 'Électronique', value: 35, color: '#3B82F6' },
                      { name: 'Mobilier', value: 25, color: '#10B981' },
                      { name: 'Textile', value: 20, color: '#F59E0B' },
                      { name: 'Alimentaire', value: 15, color: '#EF4444' },
                      { name: 'Autres', value: 5, color: '#8B5CF6' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance des Représentants et Activités Récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance des Représentants */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Performance des Représentants
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Ahmed Benali', ca: 45000, commandes: 120, trend: '+12%' },
                { name: 'Fatima Zahra', ca: 38000, commandes: 95, trend: '+8%' },
                { name: 'Youssef Alami', ca: 42000, commandes: 110, trend: '+15%' },
                { name: 'Khadija Mansouri', ca: 35000, commandes: 85, trend: '+5%' }
              ].map((rep, index) => (
                <div key={rep.id || `rep-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {rep.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{rep.name}</p>
                      <p className="text-xs text-gray-500">{rep.commandes} commandes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{rep.ca.toLocaleString('fr-FR')}€</p>
                    <p className="text-xs text-green-600">{rep.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activités Récentes Améliorées */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-500" />
              Dernières Activités
            </h3>
            <div className="space-y-3">
              {/* Derniers comptes créés */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Nouveaux Comptes</h4>
                {(Array.isArray(users) ? users : []).slice(-3).map((user, index) => (
                  <div key={user.id || `recent-user-${index}`} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-gray-400">{user.role}</span>
                  </div>
                ))}
              </div>

              {/* Dernières commandes */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Dernières Commandes</h4>
                {(Array.isArray(orders) ? orders : []).slice(-3).map((order, index) => (
                  <div key={order.id || `recent-order-${index}`} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600">#{order.id || `CMD-${index + 1}`}</span>
                    <span className="text-xs text-gray-400">{(order.total || 0).toLocaleString('fr-FR')}€</span>
                  </div>
                ))}
              </div>

              {/* Notifications importantes */}
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Alertes Importantes</h4>
                {(Array.isArray(notifications) ? notifications : []).slice(0, 3).map((notification, index) => (
                  <div key={notification.id || `alert-${index}`} className="py-1">
                    <p className="text-sm text-gray-600">{notification.title}</p>
                    <p className="text-xs text-gray-400">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-500" />
            Actions Rapides
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Navigation vers les pages spécialisées */}
            <button
              onClick={() => window.location.href = '/admin/users'}
              className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <Users className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-700">Gestion Utilisateurs</span>
            </button>

            <button
              onClick={() => window.location.href = '/admin/products'}
              className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <Package className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-700">Gestion Produits</span>
            </button>

            <button
              onClick={() => window.location.href = '/admin/orders'}
              className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <ShoppingCart className="h-8 w-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-green-700">Gestion Commandes</span>
            </button>

            <button
              onClick={() => window.location.href = '/admin/marketing'}
              className="flex flex-col items-center p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors group"
            >
              <Megaphone className="h-8 w-8 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-pink-700">Marketing</span>
            </button>

            <button
              onClick={() => window.location.href = '/admin/analytics'}
              className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
            >
              <BarChart3 className="h-8 w-8 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-yellow-700">Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <Settings className="h-8 w-8 text-gray-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Paramètres</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
        <div className="flex space-x-3">
          <button
            onClick={syncUsers}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            disabled={!isConnected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Synchroniser
          </button>
          <button
            onClick={togglePasswordVisibility}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPasswords ? 'Masquer' : 'Afficher'} mots de passe
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {Array.isArray(realtimeUsers) && realtimeUsers.length > 0 ? realtimeUsers.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {showPasswords && user.password && (
                          <div className="text-xs text-gray-400 font-mono">
                            Mot de passe: {user.password}
                            <button
                              onClick={() => copyToClipboard(user.password)}
                              className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'commercial' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {user.role}
                    </span>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setFormData({
                          email: user.email,
                          firstName: user.firstName,
                          lastName: user.lastName,
                          role: user.role,
                          password: ''
                        });
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {!isConnected ? 'Connexion en cours...' : 'Aucun utilisateur trouvé'}
                </p>
                {!isConnected && (
                  <button
                    onClick={syncUsers}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Réessayer la synchronisation
                  </button>
                )}
              </div>
            )}
          </ul>
        </div>
      )}

      {/* Modal de création/édition d'utilisateur */}
      {(showCreateForm || editingUser) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
            </h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="client">Client</option>
                  <option value="commercial">Commercial</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              {!editingUser && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Mot de passe
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateNewPassword}
                      className="px-3 py-2 bg-gray-500 text-white rounded-r-lg hover:bg-gray-600"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingUser(null);
                    setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'client' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderValidationTab = () => {
    // Filtrer les commandes en attente de validation
    const validationOrders = Array.isArray(orders) ? orders.filter(order =>
      order.status === 'pending' || order.status === 'validation' || order.status === 'waiting_approval'
    ) : [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Commandes en Validation</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {validationOrders.length} commande(s) en attente
            </span>
            <button
              onClick={() => {
                // Rafraîchir les données
                loadOrders();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtres et statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-orange-800">En Attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {validationOrders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Validation Comptabilité</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {validationOrders.filter(o => o.status === 'validation').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Prêt à Approuver</p>
                <p className="text-2xl font-bold text-blue-600">
                  {validationOrders.filter(o => o.status === 'waiting_approval').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Montant Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {validationOrders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString('fr-FR')}€
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {validationOrders.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {validationOrders.map((order) => (
                <li key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          Commande #{order.id}
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'validation' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'waiting_approval' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {order.status === 'pending' ? 'En Attente' :
                            order.status === 'validation' ? 'Validation Comptabilité' :
                              order.status === 'waiting_approval' ? 'Prêt à Approuver' :
                                order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Client: {order.customer} - Total: {(order.total || 0).toLocaleString('fr-FR')}€
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Date: {order.date} - Représentant: {order.representative || 'Non assigné'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {order.status === 'waiting_approval' && (
                        <>
                          <button
                            onClick={() => {
                              // Approuver la commande

                            }}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Approuver"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              // Rejeter la commande

                            }}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Rejeter"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Aucune commande en validation</p>
              <p className="text-gray-600">Toutes les commandes ont été traitées.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProductsTab = () => {

    const categories = ['Électronique', 'Vêtements', 'Maison & Jardin', 'Sport', 'Alimentaire', 'Beauté', 'Livres', 'Autres'];
    const suppliers = ['Fournisseur A', 'Fournisseur B', 'Fournisseur C', 'Distributeur XYZ', 'Import Direct'];

    const filteredProducts = (Array.isArray(availableProducts) ? availableProducts : [])
      .filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
          product.description?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
          product.sku?.toLowerCase().includes(productFilters.search.toLowerCase());
        const matchesCategory = !productFilters.category || product.category === productFilters.category;
        const matchesSupplier = !productFilters.supplier || product.supplier === productFilters.supplier;
        const matchesStatus = !productFilters.status ||
          (productFilters.status === 'active' && product.isActive) ||
          (productFilters.status === 'inactive' && !product.isActive) ||
          (productFilters.status === 'low-stock' && product.stock < 10) ||
          (productFilters.status === 'out-of-stock' && product.stock === 0);

        return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
      })
      .sort((a, b) => {
        let aValue = a[productSortBy];
        let bValue = b[productSortBy];

        if (productSortBy === 'price' || productSortBy === 'stock') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        }

        if (productSortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

    const getStockStatus = (stock) => {
      if (stock === 0) return { text: 'Rupture', color: 'bg-red-100 text-red-800' };
      if (stock < 10) return { text: 'Stock faible', color: 'bg-yellow-100 text-yellow-800' };
      if (stock < 50) return { text: 'Stock moyen', color: 'bg-blue-100 text-blue-800' };
      return { text: 'En stock', color: 'bg-green-100 text-green-800' };
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Produits Avancée</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setProductViewMode(productViewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {productViewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowProductManagementModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres et Recherche</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <input
                type="text"
                placeholder="Nom, description, SKU..."
                value={productFilters.search}
                onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={productFilters.category}
                onChange={(e) => setProductFilters({ ...productFilters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <select
                value={productFilters.supplier}
                onChange={(e) => setProductFilters({ ...productFilters, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tous les fournisseurs</option>
                {suppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={productFilters.status}
                onChange={(e) => setProductFilters({ ...productFilters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="low-stock">Stock faible</option>
                <option value="out-of-stock">Rupture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
              <select
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="name">Nom</option>
                <option value="price">Prix</option>
                <option value="stock">Stock</option>
                <option value="category">Catégorie</option>
                <option value="supplier">Fournisseur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
              <select
                value={productSortOrder}
                onChange={(e) => setProductSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredProducts.length} produit(s) trouvé(s)
            </span>
            <button
              onClick={() => setProductFilters({
                search: '', category: '', supplier: '', status: '', priceRange: '', stockLevel: ''
              })}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Total Produits</p>
                <p className="text-2xl font-bold text-blue-600">{filteredProducts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">Produits Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredProducts.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Stock Faible</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredProducts.filter(p => p.stock < 10).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-900">Ruptures</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredProducts.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des produits */}
        {productViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock || 0);
              return (
                <div key={product.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
                    <span className="text-lg font-bold text-green-600">{product.price || 0}€</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Catégorie: {product.category || 'Non définie'}</p>
                    <p className="text-xs text-gray-500">Fournisseur: {product.supplier || 'Non défini'}</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">Stock: {product.stock || 0}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {product.isActive ? 'Actif' : 'Inactif'}
                    </span>

                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock || 0);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category || 'Non définie'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.supplier || 'Non défini'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{product.price || 0}€</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                          {product.stock || 0} - {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {product.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderPricingTab = () => {

    const filteredPricing = Array.isArray(clientPricing) ? clientPricing
      .filter(pricing => {
        const searchTerm = pricingFilters.search?.toLowerCase() || '';
        const matchesSearch = !searchTerm ||
          pricing.Client?.name?.toLowerCase().includes(searchTerm) ||
          pricing.Product?.name?.toLowerCase().includes(searchTerm) ||
          pricing.category_name?.toLowerCase().includes(searchTerm) ||
          pricing.id?.toString().includes(searchTerm);

        const matchesStatus = !pricingFilters.status ||
          (pricingFilters.status === 'active' && pricing.is_active) ||
          (pricingFilters.status === 'inactive' && !pricing.is_active);

        const discountPercent = pricing.discount_percent || 0;
        const matchesDiscountRange = !pricingFilters.discountRange ||
          (pricingFilters.discountRange === 'low' && discountPercent < 10) ||
          (pricingFilters.discountRange === 'medium' && discountPercent >= 10 && discountPercent < 20) ||
          (pricingFilters.discountRange === 'high' && discountPercent >= 20);

        const minQuantity = pricing.minimum_quantity || 0;
        const matchesQuantityRange = !pricingFilters.quantityRange ||
          (pricingFilters.quantityRange === 'small' && minQuantity < 100) ||
          (pricingFilters.quantityRange === 'medium' && minQuantity >= 100 && minQuantity < 500) ||
          (pricingFilters.quantityRange === 'large' && minQuantity >= 500);

        const hasProduct = pricing.product_id || pricing.category_name;
        const matchesSpecificProducts = !pricingFilters.hasSpecificProducts ||
          (pricingFilters.hasSpecificProducts === 'yes' && hasProduct) ||
          (pricingFilters.hasSpecificProducts === 'no' && !hasProduct);

        return matchesSearch && matchesStatus && matchesDiscountRange && matchesQuantityRange && matchesSpecificProducts;
      }) : []
        .sort((a, b) => {
          let aValue, bValue;

          switch (pricingSortBy) {
            case 'clientName':
              aValue = a.Client?.name || '';
              bValue = b.Client?.name || '';
              break;
            case 'productName':
              aValue = a.Product?.name || a.category_name || '';
              bValue = b.Product?.name || b.category_name || '';
              break;
            case 'discountPercentage':
              aValue = Number(a.discount_percent) || 0;
              bValue = Number(b.discount_percent) || 0;
              break;
            case 'quantityLimit':
              aValue = Number(a.minimum_quantity) || 0;
              bValue = Number(b.minimum_quantity) || 0;
              break;
            case 'fixedPrice':
              aValue = Number(a.fixed_price) || 0;
              bValue = Number(b.fixed_price) || 0;
              break;
            case 'isActive':
              aValue = a.is_active ? 1 : 0;
              bValue = b.is_active ? 1 : 0;
              break;
            default:
              aValue = a[pricingSortBy] || '';
              bValue = b[pricingSortBy] || '';
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }

          if (pricingSortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

    const getDiscountLevel = (percentage) => {
      if (percentage < 10) return { text: 'Faible', color: 'bg-blue-100 text-blue-800' };
      if (percentage < 20) return { text: 'Moyen', color: 'bg-yellow-100 text-yellow-800' };
      return { text: 'Élevé', color: 'bg-red-100 text-red-800' };
    };

    const getQuantityLevel = (quantity) => {
      const qty = Number(quantity) || 0;
      if (qty < 100) return { text: 'Petit', color: 'bg-gray-100 text-gray-800' };
      if (qty < 500) return { text: 'Moyen', color: 'bg-blue-100 text-blue-800' };
      return { text: 'Grand', color: 'bg-green-100 text-green-800' };
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Tarification Clients Avancée</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setPricingViewMode(pricingViewMode === 'grid' ? 'table' : 'grid')}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {pricingViewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowPricingForm(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau tarif client
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres et Recherche</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <input
                type="text"
                placeholder="Nom client, ID..."
                value={pricingFilters.search}
                onChange={(e) => setPricingFilters({ ...pricingFilters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={pricingFilters.status}
                onChange={(e) => setPricingFilters({ ...pricingFilters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau de remise</label>
              <select
                value={pricingFilters.discountRange}
                onChange={(e) => setPricingFilters({ ...pricingFilters, discountRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Toutes les remises</option>
                <option value="low">Faible (&lt; 10%)</option>
                <option value="medium">Moyen (10-20%)</option>
                <option value="high">Élevé (&gt; 20%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite quantité</label>
              <select
                value={pricingFilters.quantityRange}
                onChange={(e) => setPricingFilters({ ...pricingFilters, quantityRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Toutes les limites</option>
                <option value="small">Petit (&lt; 100)</option>
                <option value="medium">Moyen (100-500)</option>
                <option value="large">Grand (&gt; 500)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produits spécifiques</label>
              <select
                value={pricingFilters.hasSpecificProducts}
                onChange={(e) => setPricingFilters({ ...pricingFilters, hasSpecificProducts: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous</option>
                <option value="yes">Avec produits spécifiques</option>
                <option value="no">Sans produits spécifiques</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
              <select
                value={pricingSortBy}
                onChange={(e) => setPricingSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="clientName">Nom du client</option>
                <option value="discountPercentage">Pourcentage de remise</option>
                <option value="quantityLimit">Limite de quantité</option>
                <option value="specificProducts">Nombre de produits spécifiques</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
              <select
                value={pricingSortOrder}
                onChange={(e) => setPricingSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredPricing.length} tarif(s) trouvé(s)
            </span>
            <button
              onClick={() => setPricingFilters({
                search: '', status: '', discountRange: '', quantityRange: '', hasSpecificProducts: ''
              })}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-indigo-900">Total Clients</p>
                <p className="text-2xl font-bold text-indigo-600">{filteredPricing.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">Tarifs Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPricing.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Remise Moyenne</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredPricing.length > 0 ?
                    Math.round(filteredPricing.reduce((sum, p) => sum + p.discountPercentage, 0) / filteredPricing.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Avec Produits Spécifiques</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredPricing.filter(p => p.specificProducts.length > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des tarifications */}
        {pricingViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPricing.map((pricing) => {
              const discountPercent = pricing.discount_percent || 0;
              const minQuantity = pricing.minimum_quantity || 0;
              const discountLevel = getDiscountLevel(discountPercent);
              const quantityLevel = getQuantityLevel(minQuantity);
              const clientName = pricing.Client?.name || `Client ${pricing.client_id}`;
              const productName = pricing.Product?.name || pricing.category_name || 'Tous produits';

              return (
                <div key={pricing.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{clientName}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${pricing.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {pricing.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Produit/Catégorie:</span>
                      <span className="font-medium text-sm truncate max-w-32">{productName}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remise:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{discountPercent}%</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${discountLevel.color}`}>
                          {discountLevel.text}
                        </span>
                      </div>
                    </div>

                    {pricing.fixed_price && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Prix fixe:</span>
                        <span className="font-medium">{pricing.fixed_price}€</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quantité min:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{minQuantity}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${quantityLevel.color}`}>
                          {quantityLevel.text}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      ID: {pricing.id} | Client: {pricing.client_id}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPricing(pricing)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePricing(pricing.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit/Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Fixe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité Min</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPricing.map((pricing) => {
                  const discountPercent = pricing.discount_percent || 0;
                  const minQuantity = pricing.minimum_quantity || 0;
                  const fixedPrice = pricing.fixed_price;
                  const clientName = pricing.clientName || pricing.client_name || 'N/A';
                  const productName = pricing.productName || pricing.product_name || pricing.category || 'Général';
                  const discountLevel = getDiscountLevel(discountPercent);
                  const quantityLevel = getQuantityLevel(minQuantity);
                  return (
                    <tr key={pricing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{clientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{discountPercent}%</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${discountLevel.color}`}>
                            {discountLevel.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fixedPrice ? `${fixedPrice} MAD` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{minQuantity}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${quantityLevel.color}`}>
                            {quantityLevel.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${pricing.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {pricing.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPricing(pricing)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePricing(pricing.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800" title="Voir">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderCreditTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Gestion du Crédit Clients</h2>
      <ClientCreditManager userRole="admin" />
    </div>
  );

  const renderReportsTab = () => {
    const salesData = [
      { month: 'Jan', sales: 45000, orders: 120, conversion: 3.2 },
      { month: 'Fév', sales: 52000, orders: 135, conversion: 3.8 },
      { month: 'Mar', sales: 48000, orders: 128, conversion: 3.5 },
      { month: 'Avr', sales: 61000, orders: 155, conversion: 4.1 },
      { month: 'Mai', sales: 58000, orders: 148, conversion: 3.9 },
      { month: 'Juin', sales: 67000, orders: 172, conversion: 4.3 }
    ];

    const categoryData = [
      { name: 'Électronique', value: 35, revenue: 125000 },
      { name: 'Vêtements', value: 25, revenue: 89000 },
      { name: 'Maison & Jardin', value: 20, revenue: 67000 },
      { name: 'Sport', value: 12, revenue: 43000 },
      { name: 'Autres', value: 8, revenue: 28000 }
    ];

    const performanceMetrics = {
      totalRevenue: 352000,
      growthRate: 15.3,
      avgOrderValue: 289,
      customerRetention: 78.5,
      profitMargin: 23.7,
      inventoryTurnover: 4.2
    };

    const exportData = () => {
      const data = {
        salesData,
        categoryData,
        performanceMetrics,
        users: users.length,
        orders: orders.length,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Rapports & Analytics Avancés</h2>
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter les Données
          </button>
        </div>

        {/* Métriques de Performance Clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold">{performanceMetrics.totalRevenue.toLocaleString()}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Croissance</p>
                <p className="text-2xl font-bold">+{performanceMetrics.growthRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Panier Moyen</p>
                <p className="text-2xl font-bold">{performanceMetrics.avgOrderValue}€</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Rétention Client</p>
                <p className="text-2xl font-bold">{performanceMetrics.customerRetention}%</p>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Marge Bénéficiaire</p>
                <p className="text-2xl font-bold">{performanceMetrics.profitMargin}%</p>
              </div>
              <Target className="h-8 w-8 text-teal-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Rotation Stock</p>
                <p className="text-2xl font-bold">{performanceMetrics.inventoryTurnover}x</p>
              </div>
              <Package className="h-8 w-8 text-indigo-200" />
            </div>
          </div>
        </div>

        {/* Graphiques Avancés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Évolution des Ventes & Conversions</h3>
              <div className="flex space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  Ventes
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Conversion
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis yAxisId="left" stroke="#666" />
                <YAxis yAxisId="right" orientation="right" stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Ventes (€)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversion"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Taux de Conversion (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Performance par Catégorie</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Voir Détails
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'value' ? `${value}%` : `${value.toLocaleString()}€`,
                    name === 'value' ? 'Part de Marché' : 'Chiffre d\'Affaires'
                  ]}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analyse Détaillée */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par Rôle</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Clients', value: Array.isArray(users) ? users.filter(u => u.role === 'client').length : 0 },
                    { name: 'Commerciaux', value: Array.isArray(users) ? users.filter(u => u.role === 'commercial').length : 0 },
                    { name: 'Admins', value: Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#0088FE" />
                  <Cell fill="#00C49F" />
                  <Cell fill="#FFBB28" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tendances Mensuelles</h3>
            <div className="space-y-4">
              {(Array.isArray(salesData) ? salesData : []).slice(-3).map((item, index) => (
                <div key={item.id || `sales-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.month}</p>
                    <p className="text-sm text-gray-500">{item.orders} commandes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.sales.toLocaleString()}€</p>
                    <p className="text-sm text-green-600">+{item.conversion}% conv.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions Rapides Analytics</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/analytics'}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <span className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Rapport Détaillé</span>
                </span>
                <span className="text-blue-600">→</span>
              </button>

              <button
                onClick={exportData}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <span className="flex items-center">
                  <Download className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-900">Exporter CSV</span>
                </span>
                <span className="text-green-600">→</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <span className="flex items-center">
                  <RefreshCw className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-900">Actualiser</span>
                </span>
                <span className="text-purple-600">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderJournalTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Journal d'Activité - Suivi des Actions</h2>
      <CEOJournal />
    </div>
  );

  const renderNotificationsTab = () => {

    // Filtrer et trier les notifications
    const filteredNotifications = notifications
      .filter(notification => {
        if (notificationFilters.type !== 'all' && notification.type !== notificationFilters.type) return false;
        if (notificationFilters.category !== 'all' && notification.category !== notificationFilters.category) return false;
        if (notificationFilters.priority !== 'all' && notification.priority !== notificationFilters.priority) return false;
        if (notificationFilters.read !== 'all') {
          const isRead = notification.read || false;
          if (notificationFilters.read === 'read' && !isRead) return false;
          if (notificationFilters.read === 'unread' && isRead) return false;
        }
        if (notificationFilters.search &&
          !notification.title.toLowerCase().includes(notificationFilters.search.toLowerCase()) &&
          !notification.message.toLowerCase().includes(notificationFilters.search.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let aValue = a[notificationSortBy];
        let bValue = b[notificationSortBy];

        if (notificationSortBy === 'timestamp') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (notificationSortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

    const handleSelectAll = () => {
      if (selectedNotifications.length === filteredNotifications.length) {
        setSelectedNotifications([]);
      } else {
        setSelectedNotifications(filteredNotifications.map(n => n.id));
      }
    };

    const handleMarkAsRead = (notificationIds) => {
      notificationIds.forEach(id => {
        notificationService.markAsRead(id);
      });
      loadNotifications();
    };

    const handleDeleteNotifications = (notificationIds) => {
      notificationIds.forEach(id => {
        notificationService.deleteNotification(id);
      });
      setSelectedNotifications([]);
      loadNotifications();
    };

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
        case 'info': default: return <Info className="h-5 w-5 text-blue-500" />;
      }
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'text-red-600 bg-red-50';
        case 'medium': return 'text-yellow-600 bg-yellow-50';
        case 'low': return 'text-green-600 bg-green-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    return (
      <div className="space-y-6">
        {/* En-tête avec statistiques */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Centre de Notifications</h2>
            <p className="text-gray-600 mt-1">Gérez toutes vos notifications système</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {realTimeEnabled ? 'Temps réel' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Non lues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => !n.read).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Priorité haute</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => {
                    const today = new Date().toDateString();
                    return new Date(n.timestamp).toDateString() === today;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contrôles et filtres */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={notificationFilters.type}
                onChange={(e) => setNotificationFilters({ ...notificationFilters, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Tous</option>
                <option value="info">Info</option>
                <option value="success">Succès</option>
                <option value="warning">Attention</option>
                <option value="error">Erreur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={notificationFilters.category}
                onChange={(e) => setNotificationFilters({ ...notificationFilters, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Toutes</option>
                <option value="system">Système</option>
                <option value="users">Utilisateurs</option>
                <option value="orders">Commandes</option>
                <option value="payments">Paiements</option>
                <option value="inventory">Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <select
                value={notificationFilters.priority}
                onChange={(e) => setNotificationFilters({ ...notificationFilters, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Toutes</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={notificationFilters.read}
                onChange={(e) => setNotificationFilters({ ...notificationFilters, read: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Toutes</option>
                <option value="unread">Non lues</option>
                <option value="read">Lues</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
              <select
                value={notificationSortBy}
                onChange={(e) => setNotificationSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="timestamp">Date</option>
                <option value="priority">Priorité</option>
                <option value="type">Type</option>
                <option value="title">Titre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
              <select
                value={notificationSortOrder}
                onChange={(e) => setNotificationSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={notificationFilters.search}
                  onChange={(e) => setNotificationFilters({ ...notificationFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {selectedNotifications.length > 0 && (
                <>
                  <button
                    onClick={() => handleMarkAsRead(selectedNotifications)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Marquer comme lu</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNotifications(selectedNotifications)}
                    className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Supprimer</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${realTimeEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <Bell className="h-4 w-4" />
                <span>{realTimeEnabled ? 'Temps réel ON' : 'Temps réel OFF'}</span>
              </button>

              <button
                onClick={loadNotifications}
                className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Actualiser</span>
              </button>

              <button
                onClick={testNotifications}
                className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 text-sm"
              >
                <Bell className="h-4 w-4" />
                <span>Test Notifications</span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredNotifications.length > 0 ? (
            <>
              {/* En-tête avec sélection */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {selectedNotifications.length > 0
                      ? `${selectedNotifications.length} sélectionnée${selectedNotifications.length > 1 ? 's' : ''}`
                      : 'Sélectionner tout'
                    }
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <li key={notification.id} className={`px-6 py-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''
                    }`}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotifications([...selectedNotifications, notification.id]);
                          } else {
                            setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />

                      <div className="ml-4 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(notification.priority)
                              }`}>
                              {notification.priority === 'high' ? 'Haute' :
                                notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-800' :
                              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                notification.type === 'error' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                              }`}>
                              {notification.type === 'success' ? 'Succès' :
                                notification.type === 'warning' ? 'Attention' :
                                  notification.type === 'error' ? 'Erreur' : 'Info'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleString('fr-FR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            Catégorie: {notification.category || 'Général'}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead([notification.id])}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="Marquer comme lu"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotifications([notification.id])}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune notification</h3>
              <p className="mt-1 text-sm text-gray-500">
                {notificationFilters.search || notificationFilters.type !== 'all' || notificationFilters.category !== 'all'
                  ? 'Aucune notification ne correspond aux filtres sélectionnés.'
                  : 'Vous n\'avez aucune notification pour le moment.'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Paramètres Système</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Générateur de Mots de Passe</h3>
          <button
            onClick={() => setShowPasswordGeneratorModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Key className="h-4 w-4 mr-2" />
            Ouvrir le générateur
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sauvegarde & Export</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              <Download className="h-4 w-4 mr-2" />
              Exporter les données
            </button>
            <button className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser avec Sage
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur Unifié</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Indicateur de connexion temps réel */}
              <RealTimeSyncIndicator
                isConnected={isConnected}
                lastSyncTime={lastSyncTime}
                syncStatus={syncStatus}
                onReconnect={reconnect}
              />
              <span className="text-sm text-gray-500">Connecté en tant que</span>
              <span className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</span>
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                Administrateur
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Navigation par onglets */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        {renderTabContent()}
      </div>

      {/* Toast de synchronisation temps réel */}
      <RealTimeSyncToast
        notifications={realtimeNotifications}
        onDismiss={(id) => {
          setRealtimeNotifications(prev => prev.filter(n => n.id !== id));
        }}
      />

      {/* Modals */}
      {showPasswordGeneratorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Générateur de Mots de Passe</h3>
              <button
                onClick={() => setShowPasswordGeneratorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <PasswordGenerator />
          </div>
        </div>
      )}

      {showProductManagementModal && (
        <ProductManagementModal
          isOpen={showProductManagementModal}
          onClose={() => setShowProductManagementModal(false)}
          onProductsUpdate={loadAvailableProducts}
        />
      )}

      {/* Modal pour tarification client */}
      {showPricingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Nouvelle Tarification Client
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client</label>
                <select
                  value={pricingForm.client_id || ''}
                  onChange={(e) => setPricingForm({ ...pricingForm, client_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sélectionner un client</option>
                  {users.filter(user => user.role === 'client').map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produit/Catégorie</label>
                <select
                  value={pricingForm.product_id || ''}
                  onChange={(e) => setPricingForm({ ...pricingForm, product_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sélectionner un produit (optionnel)</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie (si pas de produit spécifique)</label>
                <input
                  type="text"
                  value={pricingForm.category_name || ''}
                  onChange={(e) => setPricingForm({ ...pricingForm, category_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Catégorie générale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pourcentage de Remise (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={pricingForm.discount_percent || ''}
                  onChange={(e) => setPricingForm({ ...pricingForm, discount_percent: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="15.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix Fixe (MAD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingForm.fixed_price || ''}
                  onChange={(e) => setPricingForm({ ...pricingForm, fixed_price: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Prix fixe (optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantité Minimum</label>
                <input
                  type="number"
                  min="0"
                  value={pricingForm.minimum_quantity || ''}
                  onChange={(e) => setPricingForm({ ...pricingForm, minimum_quantity: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="100"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pricingActive"
                  checked={pricingForm.is_active || false}
                  onChange={(e) => setPricingForm({ ...pricingForm, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="pricingActive" className="text-sm">Tarification active</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowPricingForm(false)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handlePricingSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingPricing ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de détails pour les widgets */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Détails des Utilisateurs Actifs</h3>
              <button
                onClick={() => setShowUsersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {Array.isArray(users) ? users.map((user, index) => (
                <div key={user.id || `user-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{user.firstName} {user.lastName}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">Rôle: {user.role} | Dernière connexion: {user.lastLogin || 'Jamais'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-600">Aucun utilisateur trouvé</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Commandes d'Aujourd'hui</h3>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {todayOrders.map((order, index) => (
                <div key={order.id || `today-order-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Commande #{order.id}</h4>
                      <p className="text-sm text-gray-600">Client: {order.customer}</p>
                      <p className="text-xs text-gray-500">Date: {order.date} | Total: {(order.total || 0).toLocaleString('fr-FR')}€</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Détails du Chiffre d'Affaires</h3>
              <button
                onClick={() => setShowRevenueModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">CA Aujourd'hui</h4>
                  <p className="text-2xl font-bold text-blue-600">{todayRevenue.toLocaleString('fr-FR')}€</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">CA Ce Mois</h4>
                  <p className="text-2xl font-bold text-green-600">{monthRevenue.toLocaleString('fr-FR')}€</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Répartition par Statut</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Commandes payées:</span>
                    <span className="font-medium">{todayOrders.filter(o => o.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commandes en attente:</span>
                    <span className="font-medium">{todayOrders.filter(o => o.status === 'pending').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Catalogue Produits</h3>
              <button
                onClick={() => setShowProductsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Array.isArray(availableProducts) ? availableProducts : []).map((product, index) => (
                <div key={product.id || `product-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <span className="text-lg font-bold text-green-600">{product.price}€</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {product.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPendingOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Commandes en Attente</h3>
              <button
                onClick={() => setShowPendingOrdersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {pendingOrders.map((order, index) => (
                <div key={order.id || `pending-order-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Commande #{order.id}</h4>
                      <p className="text-sm text-gray-600">Client: {order.customer}</p>
                      <p className="text-xs text-gray-500">Date: {order.date} | Total: {(order.total || 0).toLocaleString('fr-FR')}€</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                      En Attente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPreparingOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Commandes en Préparation</h3>
              <button
                onClick={() => setShowPreparingOrdersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {preparingOrders.map((order, index) => (
                <div key={order.id || `preparing-order-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Commande #{order.id}</h4>
                      <p className="text-sm text-gray-600">Client: {order.customer}</p>
                      <p className="text-xs text-gray-500">Date: {order.date} | Total: {(order.total || 0).toLocaleString('fr-FR')}€</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                      En Préparation
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showBlockedUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Clients Bloqués</h3>
              <button
                onClick={() => setShowBlockedUsersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {blockedUsers.map((user, index) => (
                <div key={user.id || `blocked-user-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{user.firstName} {user.lastName}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">Raison: {user.blockReason || 'Non spécifiée'}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      Bloqué
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Centre de Notifications</h3>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {Array.isArray(notifications) && notifications.length > 0 ? notifications.map((notification, index) => (
                <div key={notification.id || `notification-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500">Date: {notification.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-800' :
                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {notification.type}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Aucune notification</p>
                  <p className="text-gray-600">Vous êtes à jour avec toutes les notifications.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Composants de notification */}
      <NotificationBell
        unreadCount={unreadCount}
        notifications={userNotifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onRefresh={refreshNotifications}
      />

      <NotificationToast
        notifications={toastNotifications}
        onRemove={removeToastNotification}
      />
    </div>
  );
};

export default UnifiedAdminDashboard;