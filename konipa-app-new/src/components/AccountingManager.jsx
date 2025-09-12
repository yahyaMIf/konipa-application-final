import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  PieChart,
  BarChart3,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  ShoppingCart,
  CreditCard,
  Users,
  Package,
  Menu,
  MoreVertical
} from 'lucide-react';
import { ReportService } from '../services/reportService';
import { formatMAD } from '../utils/formatters';
import { accountingService, statisticsService } from '../services/dataService';
import orderService from '../services/orderService';
import InvoiceGenerator from './InvoiceGenerator';
import ceoJournalService from '../services/ceoJournalService';

const AccountingManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedUnpaid, setSelectedUnpaid] = useState(null);
  
  // États pour les données
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [isLoadingUnpaid, setIsLoadingUnpaid] = useState(false);

  // États pour les modales
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view', 'edit', 'create', 'delete'
  const [modalData, setModalData] = useState(null);
  const [currentSection, setCurrentSection] = useState(''); // 'factures', 'depenses', 'payments', etc.
  
  // États pour les formulaires
  const [formData, setFormData] = useState({});
  const [orderItems, setOrderItems] = useState([{ product: '', productSearch: '', quantity: 1, unitPrice: 0, showSuggestions: false }]);
  
  // Données produits - chargées depuis le backend
  const [products, setProducts] = useState([]);
  
  const [clients, setClients] = useState([]);
  
  // États pour le responsive
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // État pour le générateur de facture
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  
  // États pour les nouvelles fonctionnalités
  const [validationFilter, setValidationFilter] = useState('all');
  const [clientsData, setClientsData] = useState([]);
  
  const [ordersData, setOrdersData] = useState([]);
  
  // Données des commandes en validation - chargées depuis le backend
  const [validationOrdersData, setValidationOrdersData] = useState([]);

  // Types de comptes
  const accountTypes = [
    { id: 'asset', name: 'Actif', color: 'bg-blue-100 text-blue-800' },
    { id: 'liability', name: 'Passif', color: 'bg-red-100 text-red-800' },
    { id: 'equity', name: 'Capitaux propres', color: 'bg-green-100 text-green-800' },
    { id: 'revenue', name: 'Produits', color: 'bg-purple-100 text-purple-800' },
    { id: 'expense', name: 'Charges', color: 'bg-orange-100 text-orange-800' }
  ];

  // Données des comptes - chargées depuis le backend
  const [accountsData, setAccountsData] = useState([]);

  // Données des factures - chargées depuis le backend
  const [facturesData, setFacturesData] = useState([]);

  // Données des dépenses - chargées depuis le backend
  const [depensesData, setDepensesData] = useState([]);

  // Données des paiements - chargées depuis le backend
  const [paymentsData, setPaymentsData] = useState([]);

  // Chargement des données depuis le backend
  useEffect(() => {
    const loadAccountingData = async () => {
      try {
        // Charger les produits
        const productsData = await accountingService.getProducts();
        setProducts(productsData || []);

        // Charger les clients
        const clientsResponse = await accountingService.getClients();
        setClients(clientsResponse || []);
        setClientsData(clientsResponse || []);

        // Charger les commandes
        const ordersResponse = await orderService.getAllOrders();
        setOrdersData(ordersResponse || []);
        
        // Charger les commandes en validation
        const validationOrdersResponse = await orderService.getOrdersForValidation();
        setValidationOrdersData(validationOrdersResponse || []);

        // Charger les comptes
        const accountsResponse = await accountingService.getAccounts();
        setAccountsData(accountsResponse || []);

        // Charger les factures
        const invoicesResponse = await accountingService.getInvoices();
        setFacturesData(invoicesResponse || []);

        // Charger les dépenses
        const expensesResponse = await accountingService.getExpenses();
        setDepensesData(expensesResponse || []);

        // Charger les paiements
        const paymentsResponse = await accountingService.getPayments();
        setPaymentsData(paymentsResponse || []);
      } catch (error) {
        // En cas d'erreur, garder les tableaux vides
      }
    };

    loadAccountingData();
  }, []);

  // Fonction pour charger les données d'impayés depuis Sage
  const loadUnpaidInvoices = async () => {
    setIsLoadingUnpaid(true);
    try {

      const sageUnpaidData = await sageService.syncUnpaidInvoices();
      setUnpaidInvoices(sageUnpaidData);
      
      // Enregistrer l'activité de synchronisation réussie
      ceoJournalService.logSageSync(
        'Factures impayées', 
        'succès', 
        { count: sageUnpaidData.length, user: 'Système' }
      );

    } catch (error) {
      // Enregistrer l'erreur de synchronisation
      ceoJournalService.logSageSync(
        'Factures impayées', 
        'échec', 
        { error: error.message, fallback: 'données par défaut', user: 'Système' }
      );
      
      // En cas d'erreur, utiliser les données par défaut comme fallback
      const fallbackUnpaidData = await accountingService.getUnpaidInvoices();
        setUnpaidInvoices(fallbackUnpaidData);
    } finally {
      setIsLoadingUnpaid(false);
    }
  };

  // Charger les commandes et les impayés au montage du composant
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await orderService.getOrders();
        // Le service retourne un objet avec une propriété 'orders'
        setOrdersData(response.orders || []);
      } catch (error) {
        setOrdersData([]);
      }
    };
    
    loadOrders();
    loadUnpaidInvoices();
  }, []);

  // Onglets de navigation
  const tabs = [
    { id: 'dashboard', name: 'Tableau de bord', icon: BarChart3 },
    { id: 'unpaid', name: 'Impayés', icon: AlertCircle },
    { id: 'thresholds', name: 'Seuils CA', icon: TrendingUp },
    { id: 'validation', name: 'Validation Commandes', icon: CheckCircle },
    { id: 'reports', name: 'Rapports', icon: PieChart }
  ];

  // Calculs pour le tableau de bord
  const totalRevenue = 450000;
  const totalExpenses = 320000;
  const netIncome = totalRevenue - totalExpenses;
  const pendingEntries = 12;

  const getOrderStatusColor = (status) => {
    const statusColors = {
      'En cours': 'bg-blue-100 text-blue-800',
      'Livré': 'bg-green-100 text-green-800',
      'En attente': 'bg-yellow-100 text-yellow-800',
      'Annulé': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUnpaidStatusColor = (status) => {
    const statusColors = {
      'overdue': 'bg-red-100 text-red-800',
      'late': 'bg-orange-100 text-orange-800',
      'upcoming': 'bg-yellow-100 text-yellow-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleOrderAction = (action, order) => {
    setSelectedOrder(order);
    setCurrentSection('orders');
    
    switch(action) {
      case 'view':
        setModalType('view');
        setModalData(order);
        setShowModal(true);
        break;
      case 'edit':
        setModalType('edit');
        setModalData(order);
        setFormData({
          number: order.number || '',
          customer: order.customer || '',
          date: order.date || '',
          status: order.status || 'En attente',
          total: order.total || '',
          items: order.items || 1,
          notes: order.notes || ''
        });
        setShowModal(true);
        break;
      case 'delete':
        setModalType('delete');
        setModalData(order);
        setShowModal(true);
        break;
      default:

    }
  };

  const handleUnpaidAction = (action, unpaid) => {
    setCurrentSection('unpaid');
    setModalData(unpaid);
    setModalType(action);
    setShowModal(true);
    
    if (action === 'edit') {
      setFormData({
        invoiceNumber: unpaid.invoiceNumber,
        client: unpaid.client,
        amount: unpaid.amount,
        dueDate: unpaid.dueDate,
        daysPastDue: unpaid.daysPastDue
      });
    }
  };

  const handleFactureAction = (action, facture) => {
    setCurrentSection('factures');
    setModalData(facture);
    setModalType(action);
    setShowModal(true);
    
    if (action === 'edit') {
      setFormData({
        number: facture.number,
        client: facture.client,
        amount: facture.amount,
        date: facture.date,
        status: facture.status,
        description: facture.description || ''
      });
    }
  };

  const handleDepenseAction = (action, depense) => {
    setCurrentSection('depenses');
    setModalData(depense);
    setModalType(action);
    setShowModal(true);
    
    if (action === 'edit') {
      setFormData({
        reference: depense.reference,
        description: depense.description,
        amount: depense.amount,
        date: depense.date,
        category: depense.category,
        supplier: depense.supplier || ''
      });
    }
  };

  const handlePaymentAction = (action, payment) => {
    setCurrentSection('payments');
    setModalData(payment);
    setModalType(action);
    setShowModal(true);
    
    if (action === 'edit') {
      setFormData({
        reference: payment.reference,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        client: payment.client,
        description: payment.description || ''
      });
    }
  };

  // Nouvelles fonctions pour les seuils CA
  const handleThresholdUpdate = (clientId, newThreshold, justification = '') => {
    const client = clientsData.find(c => c.id === clientId);
    const oldThreshold = client?.threshold || 0;
    
    setClientsData(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, threshold: newThreshold, lastUpdated: new Date().toISOString() }
        : client
    ));
    
    // Enregistrer l'activité dans le journal CEO
    if (client) {
      ceoJournalService.logThresholdUpdate(
        client.name, 
        oldThreshold, 
        newThreshold, 
        { justification, user: 'Comptable', clientId }
      );
    }

  };

  const handleThresholdAction = (action, client) => {
    setCurrentSection('thresholds');
    setModalData(client);
    setModalType(action);
    setShowModal(true);
    
    if (action === 'edit') {
      setFormData({
        name: client.name,
        threshold: client.threshold,
        currentRevenue: client.currentRevenue,
        address: client.address
      });
    }
  };

  // Nouvelles fonctions pour la validation des commandes
  const handleOrderValidation = async (orderId, status, comments = '') => {
    try {
      // Utiliser l'API backend pour valider la commande
      const updatedOrder = await orderService.validateOrder(orderId, status, comments);
      
      // Mettre à jour les données locales
      setValidationOrdersData(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, validationStatus: status, validatedAt: new Date().toISOString() }
          : order
      ));
      
      // Mettre à jour aussi ordersData si nécessaire
      setOrdersData(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, validationStatus: status, validatedAt: new Date().toISOString() }
          : order
      ));
      
      // Enregistrer l'activité dans le journal CEO
      const order = validationOrdersData.find(o => o.id === orderId);
      if (order) {
        const actionText = status === 'approved' ? 'approuvée' : 
                          status === 'rejected' ? 'rejetée' : 'mise à jour';
        
        ceoJournalService.logOrderValidation(
          order.orderNumber, 
          actionText, 
          { 
            client: order.client, 
            salesperson: order.salesperson, 
            amount: order.amount, 
            status, 
            comments, 
            user: 'Comptable' 
          }
        );
      }
      
      console.log('Commande validée avec succès:', updatedOrder);
    } catch (error) {
      console.error('Erreur lors de la validation de la commande:', error);
    }
  };

  const handleValidationAction = (action, order) => {
    setCurrentSection('validation');
    setModalData(order);
    setModalType(action);
    setShowModal(true);
    
    if (action === 'view') {
      setFormData({
        number: order.number,
        client: order.client,
        salesperson: order.salesperson,
        total: order.total,
        date: order.date,
        validationStatus: order.validationStatus
      });
    }
  };

  const getValidationStatusColor = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getValidationStatusText = (status) => {
    const statusText = {
      'pending': 'En attente',
      'approved': 'Approuvée',
      'rejected': 'Rejetée'
    };
    return statusText[status] || status;
  };

  const filteredOrdersForValidation = validationOrdersData.filter(order => {
    if (validationFilter === 'all') return true;
    return order.validationStatus === validationFilter;
  });

  // Fonctions pour créer de nouveaux éléments
  const handleCreateNew = (section) => {
    if (section === 'factures') {
      // Pour les factures, ouvrir directement le générateur de facture
      const newInvoice = {
        id: Date.now().toString(),
        number: `FAC-${Date.now()}`,
        customer: '',
        date: new Date().toISOString().split('T')[0],
        status: 'En attente',
        total: 0,
        items: [],
        notes: ''
      };
      setSelectedOrderForInvoice(newInvoice);
      setShowInvoiceGenerator(true);
      return;
    }
    
    setCurrentSection(section);
    setModalData(null);
    setModalType('create');
    setShowModal(true);
    
    // Initialiser le formulaire selon la section
    switch(section) {
      case 'orders':
        setFormData({
          number: `CMD-${Date.now()}`,
          customer: '',
          date: new Date().toISOString().split('T')[0],
          status: 'En attente',
          total: calculateOrderTotal(),
          items: orderItems.length,
          notes: ''
        });
        break;
      case 'factures':
        setFormData({
          number: '',
          client: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          status: 'En attente',
          description: ''
        });
        break;
      case 'depenses':
        setFormData({
          reference: '',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: '',
          supplier: ''
        });
        break;
      case 'payments':
        setFormData({
          reference: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          method: 'Virement',
          client: '',
          description: ''
        });
        break;
    }
  };

  // Fonction pour fermer la modale
  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setModalData(null);
    setCurrentSection('');
    setFormData({});
    setOrderItems([{ product: '', quantity: 1, unitPrice: 0 }]);
  };
  
  // Fonctions pour gérer les articles de commande
  const addOrderItem = () => {
    setOrderItems([...orderItems, { product: '', productSearch: '', quantity: 1, unitPrice: 0, showSuggestions: false }]);
  };
  
  const removeOrderItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };
  
  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...orderItems];
    if (field === 'product') {
      const selectedProduct = products.find(p => p.reference === value);
      if (selectedProduct) {
        updatedItems[index] = {
          ...updatedItems[index],
          product: value,
          designation: selectedProduct.designation,
          unitPrice: selectedProduct.unitPrice
        };
      }
    } else if (field === 'productSearch') {
      // Si on tape dans la recherche, réinitialiser la sélection
      updatedItems[index] = {
        ...updatedItems[index],
        productSearch: value,
        product: '',
        designation: '',
        unitPrice: 0
      };
    } else {
      updatedItems[index][field] = value;
    }
    setOrderItems(updatedItems);
  };
  
  const calculateOrderTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  // Fonction pour sauvegarder les modifications
  const handleSave = () => {
    // Logique de sauvegarde spécifique selon la section

    if (currentSection === 'orders') {
      // Logique spécifique pour les commandes
      if (modalType === 'create') {
        // Ajouter une nouvelle commande
        const newOrder = {
          id: Date.now().toString(),
          number: formData.number || `CMD-${Date.now()}`,
          customer: formData.customer || '',
          date: formData.date || new Date().toISOString().split('T')[0],
          status: formData.status || 'En attente',
          total: calculateOrderTotal(),
          items: orderItems.length,
          orderItems: orderItems.map(item => ({
            product: item.product,
            productName: products.find(p => p.reference === item.product)?.designation || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: (item.quantity || 0) * (item.unitPrice || 0)
          })),
          notes: formData.notes || ''
        };
        setOrdersData(prev => [...prev, newOrder]);
        alert('Nouvelle commande créée avec succès!');
      } else {
        // Modifier une commande existante
        setOrdersData(prev => prev.map(order => 
          order.id === modalData.id 
            ? { ...order, ...formData }
            : order
        ));
        alert('Commande modifiée avec succès!');
      }
    } else if (currentSection === 'thresholds') {
      // Logique spécifique pour les seuils CA
      if (modalType === 'edit') {
        const oldThreshold = modalData.threshold;
        const newThreshold = formData.threshold;
        
        setClientsData(prev => prev.map(client => 
          client.id === modalData.id 
            ? { ...client, ...formData, lastUpdated: new Date().toISOString() }
            : client
        ));
        
        // Enregistrer l'activité dans le journal CEO
        ceoJournalService.logThresholdUpdate(
          modalData.name, 
          oldThreshold, 
          newThreshold, 
          { justification: formData.justification || '', user: 'Comptable', clientId: modalData.id }
        );
        
        alert('Seuil de chiffre d\'affaires mis à jour avec succès!');

      }
    } else if (currentSection === 'validation') {
      // Logique spécifique pour la validation des commandes
      if (modalType === 'view') {
        // Pour la validation, on ne modifie que le statut via les boutons d'action
        alert('Informations de la commande consultées.');
      } else if (modalType === 'edit') {
        // Mise à jour des commentaires de validation
        setOrdersData(prev => prev.map(order => 
          order.id === modalData.id 
            ? { ...order, comments: formData.comments, updatedAt: new Date().toISOString() }
            : order
        ));
        
        // Enregistrer l'activité dans le journal CEO
        ceoJournalService.logOrderValidation(
          modalData.orderNumber, 
          'commentaires mis à jour', 
          { 
            client: modalData.client, 
            comments: formData.comments, 
            user: 'Comptable' 
          }
        );
        
        alert('Commentaires de validation mis à jour avec succès!');
      }
    } else {
      // Logique générale pour les autres sections
      alert(`${modalType === 'create' ? 'Création' : 'Modification'} sauvegardée avec succès!`);
    }
    
    closeModal();
  };

  // Fonction pour confirmer la suppression
  const handleDelete = () => {
    const confirmMessage = currentSection === 'orders' 
      ? `Êtes-vous sûr de vouloir supprimer la commande ${modalData.number} ?`
      : `Êtes-vous sûr de vouloir supprimer cet élément ?`;
      
    if (confirm(confirmMessage)) {

      if (currentSection === 'orders') {
        // Supprimer la commande de la liste
        setOrdersData(prev => prev.filter(order => order.id !== modalData.id));
        alert(`Commande ${modalData.number} supprimée avec succès!`);
      } else {
        // Logique générale pour les autres sections
        alert('Élément supprimé avec succès!');
      }
      
      closeModal();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec menu mobile */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Gestion Comptable</h1>
            </div>
            
            {/* Menu desktop */}
            <nav className="hidden lg:flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bouton menu mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 px-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Contenu des onglets */}
        <div className="space-y-6">
          {/* Tableau de bord */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                      <p className="text-xl lg:text-2xl font-bold text-green-600">{formatMAD(totalRevenue)}</p>
                    </div>
                    <div className="p-2 lg:p-3 bg-green-100 rounded-full">
                      <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Charges</p>
                      <p className="text-xl lg:text-2xl font-bold text-red-600">{formatMAD(totalExpenses)}</p>
                    </div>
                    <div className="p-2 lg:p-3 bg-red-100 rounded-full">
                      <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Résultat net</p>
                      <p className={`text-xl lg:text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatMAD(netIncome)}
                      </p>
                    </div>
                    <div className={`p-2 lg:p-3 rounded-full ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <DollarSign className={`w-5 h-5 lg:w-6 lg:h-6 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Impayés</p>
                      <p className="text-xl lg:text-2xl font-bold text-red-600">{unpaidInvoices.length}</p>
                    </div>
                    <div className="p-2 lg:p-3 bg-red-100 rounded-full">
                      <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques supplémentaires */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Commandes du mois</p>
                      <p className="text-xl lg:text-2xl font-bold text-blue-600">{ordersData.length}</p>
                    </div>
                    <div className="p-2 lg:p-3 bg-blue-100 rounded-full">
                      <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Montant total impayés</p>
                      <p className="text-xl lg:text-2xl font-bold text-red-600">
                        {formatMAD(unpaidInvoices.reduce((sum, item) => sum + item.montant, 0))}
                      </p>
                    </div>
                    <div className="p-2 lg:p-3 bg-red-100 rounded-full">
                      <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Écritures en attente</p>
                      <p className="text-xl lg:text-2xl font-bold text-yellow-600">{pendingEntries}</p>
                    </div>
                    <div className="p-2 lg:p-3 bg-yellow-100 rounded-full">
                      <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commandes */}
          {activeTab === 'orders' && (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Gestion des commandes</h2>
                <button
                  onClick={() => handleCreateNew('orders')}
                  className="flex items-center justify-center space-x-2 px-3 py-2 lg:px-4 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm lg:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nouvelle commande</span>
                  <span className="sm:hidden">Nouveau</span>
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Numéro
                        </th>
                        <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ordersData.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex flex-col">
                              <span>{order.number}</span>
                              <span className="sm:hidden text-xs text-gray-500">
                                {new Date(order.date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span>{order.customer}</span>
                              <span className="md:hidden text-xs">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMAD(order.amount)}
                          </td>
                          <td className="hidden md:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-1 lg:space-x-2">
                              <button
                                onClick={() => handleOrderAction('view', order)}
                                className="p-1 lg:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                title="Voir"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOrderAction('edit', order)}
                                className="p-1 lg:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOrderAction('delete', order)}
                                className="p-1 lg:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Impayés */}
          {activeTab === 'unpaid' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Gestion des impayés</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={loadUnpaidInvoices}
                    disabled={isLoadingUnpaid}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <div className={`w-4 h-4 ${isLoadingUnpaid ? 'animate-spin' : ''}`}>
                      {isLoadingUnpaid ? (
                        <div className="rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                {currentSection === 'thresholds' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <select
                        value={formData.clientId || ''}
                        onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner un client</option>
                        {clientsData.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nouveau seuil CA (MAD)</label>
                      <input
                        type="number"
                        value={formData.threshold || ''}
                        onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nouveau seuil"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Justification</label>
                      <textarea
                        value={formData.justification || ''}
                        onChange={(e) => setFormData({...formData, justification: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Raison de la modification du seuil..."
                      />
                    </div>
                  </div>
                )}
                {currentSection === 'validation' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro commande</label>
                      <input
                        type="text"
                        value={formData.orderNumber || ''}
                        onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <input
                        type="text"
                        value={formData.client || ''}
                        onChange={(e) => setFormData({...formData, client: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Commercial</label>
                      <input
                        type="text"
                        value={formData.salesperson || ''}
                        onChange={(e) => setFormData({...formData, salesperson: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant total</label>
                      <input
                        type="text"
                        value={formData.amount ? formatMAD(formData.amount) : ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut validation</label>
                      <select
                        value={formData.validationStatus || ''}
                        onChange={(e) => setFormData({...formData, validationStatus: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">En attente</option>
                        <option value="approved">Approuvée</option>
                        <option value="rejected">Rejetée</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Commentaires</label>
                      <textarea
                        value={formData.comments || ''}
                        onChange={(e) => setFormData({...formData, comments: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Commentaires sur la validation..."
                      />
                    </div>
                  </div>
                )}
                {currentSection === 'orders' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro</label>
                      <input
                        type="text"
                        value={formData.number || ''}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <select
                        value={formData.customer || ''}
                        onChange={(e) => {
                          const selectedClient = sageClients.find(c => c.name === e.target.value);
                          setFormData({...formData, customer: e.target.value, clientData: selectedClient});
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner un client</option>
                        {sageClients.map(client => (
                          <option key={client.id} value={client.name}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="En attente">En attente</option>
                        <option value="En cours">En cours</option>
                        <option value="Livré">Livré</option>
                        <option value="Annulé">Annulé</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total</label>
                      <input
                        type="number"
                        value={formData.total || ''}
                        onChange={(e) => setFormData({...formData, total: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Articles</label>
                      <input
                        type="number"
                        value={formData.items || ''}
                        onChange={(e) => setFormData({...formData, items: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                    </div>
                    <span>{isLoadingUnpaid ? 'Synchronisation...' : 'Synchroniser Sage'}</span>
                  </button>
                  <button
                    onClick={() => setShowUnpaidModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvel impayé</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Échéance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Retard
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingUnpaid ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Chargement des données Sage...</span>
                </div>
              ) : unpaidInvoices.map((unpaid) => (
                        <tr key={unpaid.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {unpaid.numero}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {unpaid.client}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMAD(unpaid.montant)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(unpaid.dateEcheance).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {unpaid.joursRetard} jours
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800`}>
                              {unpaid.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleUnpaidAction('contact', unpaid)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleUnpaidAction('edit', unpaid)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleUnpaidAction('resolve', unpaid)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Seuils CA */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Gestion des seuils de chiffre d'affaires</h2>
                <button
                  onClick={() => handleCreateNew('thresholds')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau seuil</span>
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seuil actuel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CA réalisé
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pourcentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientsData.map((client) => {
                        const percentage = (client.currentRevenue / client.threshold) * 100;
                        return (
                          <tr key={client.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {client.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatMAD(client.threshold)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatMAD(client.currentRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {percentage.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                percentage >= 100 ? 'bg-green-100 text-green-800' :
                                percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {percentage >= 100 ? 'Atteint' : percentage >= 75 ? 'Proche' : 'En cours'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleThresholdAction('increase', client)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Augmenter le seuil"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleThresholdAction('edit', client)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleThresholdAction('view', client)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Voir détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Validation des commandes */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Validation des commandes</h2>
                <div className="flex space-x-2">
                  <select
                    value={validationFilter}
                    onChange={(e) => setValidationFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les commandes</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvées</option>
                    <option value="rejected">Rejetées</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Commande
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commercial
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ordersData.filter(order => {
                        if (validationFilter === 'all') return true;
                        return order.validationStatus === validationFilter;
                      }).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.client}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.salesperson}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMAD(order.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.validationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              order.validationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.validationStatus === 'approved' ? 'Approuvée' :
                               order.validationStatus === 'rejected' ? 'Rejetée' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {order.validationStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleValidationAction('approve', order)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Approuver"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleValidationAction('reject', order)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Rejeter"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleValidationAction('view', order)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Voir détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Rapports */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Rapports financiers</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Bilan</h3>
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-gray-600 mb-4">État de la situation financière à une date donnée</p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Générer le bilan
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Compte de résultat</h3>
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-4">Résultat de l'activité sur une période</p>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Générer le CPC
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Balance</h3>
                    <Calculator className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-gray-600 mb-4">Soldes de tous les comptes</p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Générer la balance
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modale universelle */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'view' && 'Détails'}
                {modalType === 'edit' && 'Modifier'}
                {modalType === 'create' && 'Créer'}
                {modalType === 'delete' && 'Supprimer'}
                {modalType === 'contact' && 'Contacter le client'}
                {modalType === 'resolve' && 'Marquer comme payé'}
                {currentSection === 'factures' && ' - Facture'}
                {currentSection === 'depenses' && ' - Dépense'}
                {currentSection === 'payments' && ' - Paiement'}
                {currentSection === 'unpaid' && ' - Impayé'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu de la modale selon le type */}
            {modalType === 'view' && modalData && (
              <div className="space-y-4">
                {currentSection === 'factures' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.client}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <p className="mt-1 text-sm text-gray-900">{formatMAD(modalData.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(modalData.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.status}</p>
                    </div>
                  </div>
                )}
                {currentSection === 'orders' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro de commande</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.customer}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(modalData.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.status}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total</label>
                      <p className="mt-1 text-sm text-gray-900">{formatMAD(modalData.total)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Articles</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {Array.isArray(modalData.items) ? (
                          modalData.items.map((item, index) => (
                            <div key={index} className="mb-1">
                              {typeof item === 'object' ? (
                                `${item.productId || item.name || 'Article'} - Qté: ${item.quantity || 0} - Prix: ${formatMAD(item.price || 0)}`
                              ) : (
                                item
                              )}
                            </div>
                          ))
                        ) : (
                          modalData.items || 'Aucun article'
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.notes || 'Aucune note'}</p>
                    </div>
                  </div>
                )}
                {currentSection === 'payments' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Référence</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.reference}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.client}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <p className="mt-1 text-sm text-gray-900">{formatMAD(modalData.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(modalData.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Méthode</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.method}</p>
                    </div>
                  </div>
                )}
                {currentSection === 'unpaid' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Facture</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.numero}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.client}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <p className="mt-1 text-sm text-gray-900">{formatMAD(modalData.montant)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Échéance</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(modalData.dateEcheance).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Jours de retard</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.joursRetard} jours</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formulaire d'édition/création */}
            {(modalType === 'edit' || modalType === 'create') && (
              <div className="space-y-4">
                {currentSection === 'factures' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro</label>
                      <input
                        type="text"
                        value={formData.number || ''}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <input
                        type="text"
                        value={formData.client || ''}
                        onChange={(e) => setFormData({...formData, client: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Payée">Payée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                {currentSection === 'orders' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro</label>
                      <input
                        type="text"
                        value={formData.number || ''}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <input
                        type="text"
                        value={formData.customer || ''}
                        onChange={(e) => setFormData({...formData, customer: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Confirmée">Confirmée</option>
                        <option value="En préparation">En préparation</option>
                        <option value="Expédiée">Expédiée</option>
                        <option value="Livrée">Livrée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant total</label>
                      <input
                        type="number"
                        value={formData.total || ''}
                        onChange={(e) => setFormData({...formData, total: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre d'articles</label>
                      <input
                        type="number"
                        value={formData.items || ''}
                        onChange={(e) => setFormData({...formData, items: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                {currentSection === 'orders' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro</label>
                      <input
                        type="text"
                        value={formData.number || ''}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <input
                        type="text"
                        value={formData.customer || ''}
                        onChange={(e) => setFormData({...formData, customer: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Confirmée">Confirmée</option>
                        <option value="Expédiée">Expédiée</option>
                        <option value="Livrée">Livrée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total</label>
                      <input
                        type="number"
                        value={formData.total || ''}
                        onChange={(e) => setFormData({...formData, total: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Articles</label>
                      <div className="space-y-3">
                        {orderItems.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5 relative">
                               <label className="block text-xs font-medium text-gray-600">Référence Produit</label>
                               <input
                                 type="text"
                                 value={item.productSearch || ''}
                                 onChange={(e) => updateOrderItem(index, 'productSearch', e.target.value)}
                                 onFocus={() => updateOrderItem(index, 'showSuggestions', true)}
                                 onBlur={() => setTimeout(() => updateOrderItem(index, 'showSuggestions', false), 200)}
                                 className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                 placeholder="Tapez la référence..."
                               />
                               {item.showSuggestions && item.productSearch && (
                                 <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                   {sageProducts
                                     .filter(product => 
                                       product.reference.toLowerCase().includes((item.productSearch || '').toLowerCase()) ||
                                       product.designation.toLowerCase().includes((item.productSearch || '').toLowerCase())
                                     )
                                     .slice(0, 5)
                                     .map(product => (
                                       <div
                                         key={product.reference}
                                         onClick={() => {
                                           updateOrderItem(index, 'product', product.reference);
                                           updateOrderItem(index, 'productSearch', product.reference);
                                           updateOrderItem(index, 'showSuggestions', false);
                                         }}
                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                       >
                                         <div className="font-medium">{product.reference}</div>
                                         <div className="text-gray-600 text-xs">{product.designation}</div>
                                         <div className="text-blue-600 text-xs">{product.unitPrice} MAD</div>
                                       </div>
                                     ))
                                   }
                                   {sageProducts.filter(product => 
                                     product.reference.toLowerCase().includes((item.productSearch || '').toLowerCase()) ||
                                     product.designation.toLowerCase().includes((item.productSearch || '').toLowerCase())
                                   ).length === 0 && (
                                     <div className="px-3 py-2 text-gray-500 text-sm">Aucun produit trouvé</div>
                                   )}
                                 </div>
                               )}
                             </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-600">Quantité</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-600">Prix unitaire</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice || 0}
                                onChange={(e) => updateOrderItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-600">Total</label>
                              <div className="mt-1 px-2 py-1 bg-gray-50 border border-gray-300 rounded-md text-sm">
                                {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)} MAD
                              </div>
                            </div>
                            <div className="col-span-1">
                              <button
                                type="button"
                                onClick={() => removeOrderItem(index)}
                                className="p-1 text-red-600 hover:text-red-800"
                                disabled={orderItems.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <button
                            type="button"
                            onClick={addOrderItem}
                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter un article
                          </button>
                          <div className="text-sm font-medium">
                            Total commande: {calculateOrderTotal().toFixed(2)} MAD
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                {currentSection === 'depenses' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Référence</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.reference}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <p className="mt-1 text-sm text-gray-900">{formatMAD(modalData.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(modalData.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.category}</p>
                    </div>
                  </div>
                )}
                {currentSection === 'payments' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Référence</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.reference}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.client}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <p className="mt-1 text-sm text-gray-900">{formatMAD(modalData.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(modalData.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Méthode</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.method}</p>
                    </div>
                  </div>
                )}
                {currentSection === 'unpaid' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Facture</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.invoiceNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.customer}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <p className="mt-1 text-sm text-gray-900">{formatMAD(modalData.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Échéance</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(modalData.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Jours de retard</label>
                      <p className="mt-1 text-sm text-gray-900">{modalData.daysPastDue} jours</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formulaire d'édition/création */}
            {(modalType === 'edit' || modalType === 'create') && (
              <div className="space-y-4">
                {currentSection === 'factures' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro</label>
                      <input
                        type="text"
                        value={formData.number || ''}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <input
                        type="text"
                        value={formData.client || ''}
                        onChange={(e) => setFormData({...formData, client: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Payée">Payée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                {currentSection === 'depenses' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Référence</label>
                      <input
                        type="text"
                        value={formData.reference || ''}
                        onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
                      <input
                        type="text"
                        value={formData.supplier || ''}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                      <select
                        value={formData.category || ''}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        <option value="Fournitures">Fournitures</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Transport">Transport</option>
                        <option value="Équipement">Équipement</option>
                        <option value="Services">Services</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                {currentSection === 'payments' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Référence</label>
                      <input
                        type="text"
                        value={formData.reference || ''}
                        onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <input
                        type="text"
                        value={formData.client || ''}
                        onChange={(e) => setFormData({...formData, client: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Montant</label>
                      <input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Méthode</label>
                      <select
                        value={formData.method || ''}
                        onChange={(e) => setFormData({...formData, method: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Virement">Virement</option>
                        <option value="Chèque">Chèque</option>
                        <option value="Espèces">Espèces</option>
                        <option value="Carte bancaire">Carte bancaire</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions spéciales pour les impayés */}
            {modalType === 'contact' && modalData && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Contacter le client</h4>
                  <p className="text-blue-700 mt-1">Facture: {modalData.invoiceNumber}</p>
                  <p className="text-blue-700">Client: {modalData.customer}</p>
                  <p className="text-blue-700">Montant: {formatMAD(modalData.amount)}</p>
                  <p className="text-blue-700">Retard: {modalData.daysPastDue} jours</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Bonjour, nous vous rappelons que votre facture est en retard..."
                  />
                </div>
              </div>
            )}

            {modalType === 'resolve' && modalData && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Marquer comme payé</h4>
                  <p className="text-green-700 mt-1">Facture: {modalData.invoiceNumber}</p>
                  <p className="text-green-700">Client: {modalData.customer}</p>
                  <p className="text-green-700">Montant: {formatMAD(modalData.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de paiement</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Méthode de paiement</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="Virement">Virement</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Espèces">Espèces</option>
                    <option value="Carte bancaire">Carte bancaire</option>
                  </select>
                </div>
              </div>
            )}

            {/* Confirmation de suppression */}
            {modalType === 'delete' && modalData && (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900">Confirmer la suppression</h4>
                  <p className="text-red-700 mt-1">Êtes-vous sûr de vouloir supprimer cet élément ?</p>
                  {currentSection === 'factures' && (
                    <p className="text-red-700">Facture: {modalData.number}</p>
                  )}
                  {currentSection === 'depenses' && (
                    <p className="text-red-700">Dépense: {modalData.reference}</p>
                  )}
                  {currentSection === 'payments' && (
                    <p className="text-red-700">Paiement: {modalData.reference}</p>
                  )}
                  {currentSection === 'orders' && (
                    <p className="text-red-700">Commande: {modalData.number}</p>
                  )}
                  <p className="text-red-700 font-medium mt-2">Cette action est irréversible.</p>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              
              {modalType === 'view' && (
                <button
                  onClick={() => {
                    setModalType('edit');
                    if (currentSection === 'factures') {
                      setFormData({
                        number: modalData.number,
                        client: modalData.client,
                        amount: modalData.amount,
                        date: modalData.date,
                        status: modalData.status,
                        description: modalData.description || ''
                      });
                    }
                    // Ajouter d'autres sections si nécessaire
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Modifier
                </button>
              )}
              
              {(modalType === 'edit' || modalType === 'create') && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {modalType === 'create' ? 'Créer' : 'Sauvegarder'}
                </button>
              )}
              
              {modalType === 'delete' && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              )}
              
              {modalType === 'contact' && (
                <button
                  onClick={() => {
                    alert('Message envoyé au client!');
                    closeModal();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Envoyer
                </button>
              )}
              
              {modalType === 'resolve' && (
                <button
                  onClick={() => {
                    alert('Facture marquée comme payée!');
                    closeModal();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmer le paiement
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Générateur de facture */}
      {showInvoiceGenerator && selectedOrderForInvoice && (
        <InvoiceGenerator
          orderData={selectedOrderForInvoice}
          onClose={() => {
            setShowInvoiceGenerator(false);
            setSelectedOrderForInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default AccountingManager;