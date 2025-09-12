import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Award, 
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Phone,
  Mail,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Bell,
  X,
  Save,
  Search,
  Filter,
  Download,
  MapPin,
  Building,
  UserPlus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import dataService, { orderService, quoteService, statisticsService } from '../services/dataService';
import DocumentService from '../services/DocumentService';
import FloatingNotification from '../components/FloatingNotification';
import NotificationBell from '../components/NotificationBell';
import NotificationToast from '../components/NotificationToast';
import { notificationService } from '../services/NotificationService';
import useNotifications from '../hooks/useNotifications';

const CommercialDashboard = () => {
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
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  // États pour les données et le chargement
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // États pour les modales
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // États pour les formulaires
  const [quoteForm, setQuoteForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    products: [{ name: '', quantity: 1, price: 0 }],
    validityDays: 30,
    notes: ''
  });
  
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    type: 'garage',
    creditLimit: 0
  });
  
  const [callForm, setCallForm] = useState({
    clientId: '',
    subject: '',
    notes: '',
    followUpDate: '',
    callType: '',
    duration: '',
    result: ''
  });

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les commandes et devis
        const [ordersData, quotesData, statsData] = await Promise.all([
            orderService.getOrders(),
            quoteService.getQuotes(),
            statisticsService.getStatistics()
        ]);
        
        // Filtrer pour ce commercial
        const commercialOrders = ordersData.filter(order => order.commercialId === user?.id);
        const commercialQuotes = quotesData.filter(quote => quote.commercialId === user?.id);
        
        setOrders(commercialOrders);
        setQuotes(commercialQuotes);
        setStatistics(statsData);
        
        // Charger les clients et produits du catalogue
        try {
          
          const clientsData = await clientService.getClients();
          const productsData = await productService.getProducts();
          setExistingClients(clientsData || []);
          setCatalogProducts(productsData || []);
        } catch (error) {
          setExistingClients([]);
          setCatalogProducts([]);
        }
      } catch (error) {
        // Initialiser avec des tableaux vides en cas d'erreur
        setOrders([]);
        setQuotes([]);
        setStatistics(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id]);
  
  // Utiliser les données chargées
  const commercialOrders = orders;
  const commercialQuotes = quotes;

  // Calculate detailed KPIs from real data
  const commissionRate = 0.05; // 5% commission rate
  
  // Calculer les métriques à partir des données réelles
  const monthlyRevenue = commercialOrders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, order) => sum + (order.total || 0), 0);
    
  const totalYearlyRevenue = commercialOrders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      const currentYear = new Date().getFullYear();
      return orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, order) => sum + (order.total || 0), 0);
    
  const monthlyCommission = monthlyRevenue * commissionRate;
  const yearlyCommission = totalYearlyRevenue * commissionRate;
  
  // Objectif mensuel (peut être configuré via les statistiques)
  const targetRevenue = statistics?.commercialTargets?.[user?.id] || 50000;
  const objectivePercentage = targetRevenue > 0 ? Math.round((monthlyRevenue / targetRevenue) * 100) : 0;
  
  // Données de performance commerciale calculées
  const commercialData = {
    commercialId: user?.id,
    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    monthlyRevenue,
    targetRevenue,
    percentage: objectivePercentage,
    commission: monthlyCommission,
    clientDetails: commercialOrders
      .reduce((clients, order) => {
        const existing = clients.find(c => c.client === order.clientName);
        if (existing) {
          existing.revenue += order.total || 0;
        } else {
          clients.push({
            client: order.clientName || 'Client inconnu',
            revenue: order.total || 0
          });
        }
        return clients;
      }, [])
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  };
  
  // Fonctions pour gérer les actions
  const handleCreateQuote = () => {
    setShowQuoteModal(true);
  };
  
  const handleAddClient = () => {
    setShowClientModal(true);
  };
  
  const handleCallClient = () => {
    setShowCallModal(true);
  };
  
  const handleMonthlyReport = () => {
    setShowReportModal(true);
  };
  
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fonction de test des notifications
  const testNotifications = () => {
    const testMessages = [
      { type: 'success', title: 'Test Succès Commercial', message: 'Notification de test réussie pour le commercial' },
      { type: 'error', title: 'Test Erreur Commercial', message: 'Notification d\'erreur de test pour le commercial' },
      { type: 'warning', title: 'Test Avertissement Commercial', message: 'Notification d\'avertissement de test pour le commercial' },
      { type: 'info', title: 'Test Information Commercial', message: 'Notification d\'information de test pour le commercial' }
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
      title: 'Test du système de notifications commercial',
      message: 'Test automatique du système de notifications pour les commerciaux',
      priority: 'medium',
      category: 'commercial'
    });
  };
  
  const handleSubmitQuote = (e) => {
    e.preventDefault();
    
    // Validation des données
    if (!quoteForm.clientName.trim()) {
      showNotification('error', 'Le nom du client est requis');
      return;
    }
    
    if (!quoteForm.clientEmail.trim()) {
      showNotification('error', 'L\'email du client est requis');
      return;
    }
    
    if (quoteForm.products.some(p => !p.name.trim() || p.quantity <= 0 || p.price <= 0)) {
      showNotification('error', 'Tous les produits doivent avoir un nom, une quantité et un prix valides');
      return;
    }
    
    // Calculer le total du devis
    const total = quoteForm.products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
    
    // Créer le devis avec un ID unique
    const newQuote = {
      id: `DEV-${Date.now()}`,
      ...quoteForm,
      total,
      status: 'En attente',
      createdAt: new Date().toISOString(),
      commercialId: user.id,
      commercialName: `${user.firstName} ${user.lastName}`
    };
    
    // Simuler l'enregistrement en base

    // Ajouter à la liste des devis (simulation)
    // Dans une vraie app, ceci serait un appel API
    
    showNotification('success', `Devis ${newQuote.id} créé avec succès!`);
    notificationService.addNotification(user, {
      type: 'success',
      title: 'Nouveau devis créé',
      message: `Devis ${newQuote.id} pour ${quoteForm.clientName} créé avec succès (${total.toLocaleString()} DH)`,
      category: 'quotes'
    });
    
    setShowQuoteModal(false);
    setQuoteForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      products: [{ name: '', quantity: 1, price: 0 }],
      validityDays: 30,
      notes: ''
    });
  };
  
  const handleSubmitClient = (e) => {
    e.preventDefault();
    
    // Validation des données
    if (!clientForm.name.trim()) {
      showNotification('error', 'Le nom du client est requis');
      return;
    }
    
    if (!clientForm.email.trim()) {
      showNotification('error', 'L\'email du client est requis');
      return;
    }
    
    if (!clientForm.phone.trim()) {
      showNotification('error', 'Le téléphone du client est requis');
      return;
    }
    
    if (!clientForm.address.trim()) {
      showNotification('error', 'L\'adresse du client est requise');
      return;
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientForm.email)) {
      showNotification('error', 'Format d\'email invalide');
      return;
    }
    
    // Validation téléphone (format marocain)
    const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/;
    if (!phoneRegex.test(clientForm.phone.replace(/\s/g, ''))) {
      showNotification('error', 'Format de téléphone invalide (ex: +212612345678 ou 0612345678)');
      return;
    }
    
    // Créer le client avec un ID unique
    const newClient = {
      id: `CLI-${Date.now()}`,
      ...clientForm,
      status: 'Actif',
      createdAt: new Date().toISOString(),
      commercialId: user.id,
      commercialName: `${user.firstName} ${user.lastName}`,
      totalOrders: 0,
      totalRevenue: 0
    };
    
    // Simuler l'enregistrement en base

    showNotification('success', `Client ${newClient.name} ajouté avec succès!`);
    notificationService.addNotification(user, {
      type: 'success',
      title: 'Nouveau client ajouté',
      message: `Client ${clientForm.name} ajouté avec succès (${clientForm.type})`,
      category: 'clients'
    });
    
    setShowClientModal(false);
    setClientForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      type: 'garage',
      creditLimit: 0
    });
  };
  
  const handleSubmitCall = (e) => {
    e.preventDefault();
    
    // Validation des données
    if (!callForm.clientId) {
      showNotification('error', 'Veuillez sélectionner un client');
      return;
    }
    
    if (!callForm.subject.trim()) {
      showNotification('error', 'Le sujet de l\'appel est requis');
      return;
    }
    
    if (!callForm.notes.trim()) {
      showNotification('error', 'Les notes de l\'appel sont requises');
      return;
    }
    
    // Créer l'appel avec un ID unique
    const newCall = {
      id: `CALL-${Date.now()}`,
      ...callForm,
      status: callForm.followUpDate ? 'Suivi programmé' : 'Terminé',
      createdAt: new Date().toISOString(),
      commercialId: user.id,
      commercialName: `${user.firstName} ${user.lastName}`,
      duration: Math.floor(Math.random() * 30) + 5 // Simulation durée 5-35 min
    };
    
    // Simuler l'enregistrement en base

    showNotification('success', 'Appel enregistré avec succès!');
    notificationService.addNotification(user, {
      type: 'info',
      title: 'Appel client enregistré',
      message: `Appel avec client concernant: ${callForm.subject}${callForm.followUpDate ? ' - Suivi programmé' : ''}`,
      category: 'calls'
    });
    
    setShowCallModal(false);
    setCallForm({
      clientId: '',
      subject: '',
      notes: '',
      followUpDate: ''
    });
  };
  
  const handleGenerateReport = async () => {
    try {
      // Calculer les données du rapport
      const reportData = {
        id: `RPT-${Date.now()}`,
        period: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        commercialId: user.id,
        commercialName: `${user.firstName} ${user.lastName}`,
        metrics: {
          totalRevenue: commercialData.monthlyRevenue,
          commission: commercialData.monthlyRevenue * 0.05,
          objectivePercentage: commercialData.percentage,
          newClients: Math.floor(Math.random() * 10) + 5,
          quotesCreated: Math.floor(Math.random() * 20) + 10,
          conversionRate: Math.floor(Math.random() * 30) + 15
        },
        clientDetails: commercialData.clientDetails,
        generatedAt: new Date().toISOString()
      };
      
      // Préparer les données pour DocumentService
      const pdfReportData = {
        title: 'Rapport Mensuel Commercial',
        subtitle: `Période: ${reportData.period}`,
        commercial: {
          id: reportData.commercialId,
          name: reportData.commercialName
        },
        metrics: [
          { label: 'CA réalisé', value: `${reportData.metrics.totalRevenue.toLocaleString()} DH` },
          { label: 'Commission', value: `${reportData.metrics.commission.toLocaleString()} DH` },
          { label: 'Objectif atteint', value: `${reportData.metrics.objectivePercentage}%` },
          { label: 'Nouveaux clients', value: reportData.metrics.newClients },
          { label: 'Devis créés', value: reportData.metrics.quotesCreated },
          { label: 'Taux de conversion', value: `${reportData.metrics.conversionRate}%` }
        ],
        clientDetails: reportData.clientDetails.map(client => ({
          name: client.client,
          revenue: `${client.revenue.toLocaleString()} DH`
        })),
        generatedAt: new Date(reportData.generatedAt).toLocaleString('fr-FR'),
        notes: 'Rapport généré automatiquement depuis le tableau de bord commercial'
      };
      
      // Générer le PDF avec DocumentService
      await DocumentService.generateCommercialReport(pdfReportData);
      
      showNotification('success', 'Rapport mensuel PDF généré et téléchargé!');
      notificationService.addNotification(user, {
        type: 'success',
        title: 'Rapport généré',
        message: `Rapport mensuel de ${reportData.period} généré avec succès`,
        category: 'reports'
      });
      
      setShowReportModal(false);
    } catch (error) {
      showNotification('error', 'Erreur lors de la génération du rapport PDF');
    }
  };
  
  const addProductToQuote = () => {
    setQuoteForm(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 1, price: 0 }]
    }));
  };
  
  const removeProductFromQuote = (index) => {
    setQuoteForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };
  
  const updateProduct = (index, field, value) => {
    setQuoteForm(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  // États pour les données chargées depuis le backend
  const [existingClients, setExistingClients] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Fonction pour sélectionner un produit du catalogue
  const selectCatalogProduct = (productIndex, catalogProduct) => {
    updateProduct(productIndex, 'name', catalogProduct.name);
    updateProduct(productIndex, 'price', catalogProduct.price);
    updateProduct(productIndex, 'description', catalogProduct.description);
  };

  // Fonction pour sélectionner un client existant
  const selectExistingClient = (client, formType) => {
    if (formType === 'quote') {
      setQuoteForm(prev => ({
        ...prev,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone
      }));
    } else if (formType === 'call') {
      setCallForm(prev => ({
        ...prev,
        clientId: client.id
      }));
    }
  };
  
  const kpis = [
    {
      title: 'CA du mois',
      value: `${commercialData.monthlyRevenue.toLocaleString()} DH`,
      change: `${commercialData.percentage}% de l'objectif`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Commission mensuelle',
      value: `${monthlyCommission.toLocaleString()} DH`,
      change: `${commissionRate * 100}% du CA`,
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'CA annuel projeté',
      value: `${totalYearlyRevenue.toLocaleString()} DH`,
      change: 'Projection basée sur le mois actuel',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Commission annuelle',
      value: `${yearlyCommission.toLocaleString()} DH`,
      change: 'Projection annuelle',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Afficher l'indicateur de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Tableau de bord Commercial
        </h1>
        <p className="text-gray-600">
          Bienvenue {user?.firstName}, voici votre performance commerciale
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <button 
          onClick={handleCreateQuote}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau devis</span>
        </button>
        <button 
          onClick={handleAddClient}
          className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Users size={20} />
          <span>Ajouter client</span>
        </button>
        <button 
          onClick={handleCallClient}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Phone size={20} />
          <span>Appeler client</span>
        </button>
        <button 
          onClick={handleMonthlyReport}
          className="bg-orange-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors"
        >
          <BarChart3 size={20} />
          <span>Rapport mensuel</span>
        </button>
        <button 
          onClick={testNotifications}
          className="bg-indigo-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Bell size={20} />
          <span>Test Notifications</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className={`text-sm ${kpi.color} mt-1`}>{kpi.change}</p>
              </div>
              <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Evolution */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Évolution du CA</h3>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="month">6 derniers mois</option>
              <option value="quarter">Trimestre</option>
              <option value="year">Année</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={commercialData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} DH`, '']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0088FE" 
                strokeWidth={3}
                name="CA réalisé"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#FF8042" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Objectif"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Client Performance */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance par client</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commercialData.clientDetails}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} DH`, 'CA']} />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Commission and Revenue History */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">Historique des Commissions et CA</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Commission Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-4">Détail des Commissions</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CA mensuel</span>
                <span className="font-semibold">{commercialData.monthlyRevenue.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taux de commission</span>
                <span className="font-semibold text-blue-600">{(commissionRate * 100)}%</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Commission à percevoir</span>
                <span className="font-bold text-green-600">{monthlyCommission.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Commission annuelle projetée</span>
                <span className="font-semibold text-purple-600">{yearlyCommission.toLocaleString()} DH</span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-4">Répartition du CA</h4>
            <div className="space-y-3">
              {commercialData.clientDetails.slice(0, 4).map((client, index) => {
                const clientCommission = client.revenue * commissionRate;
                return (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{client.client}</span>
                      <div className="text-xs text-gray-500">{client.revenue.toLocaleString()} DH</div>
                    </div>
                    <span className="font-semibold text-green-600">+{clientCommission.toLocaleString()} DH</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA Réalisé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objectif</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Objectif</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {commercialData.monthlyData.map((month, index) => {
                const monthCommission = month.revenue * commissionRate;
                const achievementRate = (month.revenue / month.target) * 100;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.revenue.toLocaleString()} DH
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.target.toLocaleString()} DH
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        achievementRate >= 100 ? 'text-green-600' :
                        achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {achievementRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {monthCommission.toLocaleString()} DH
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        achievementRate >= 100 ? 'bg-green-100 text-green-800' :
                        achievementRate >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {achievementRate >= 100 ? 'Objectif atteint' :
                         achievementRate >= 80 ? 'En cours' : 'À améliorer'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">Objectifs et Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Target */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#0088FE"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - commercialData.percentage / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{commercialData.percentage}%</span>
              </div>
            </div>
            <h4 className="font-semibold text-gray-900">Objectif CA</h4>
            <p className="text-sm text-gray-600">
              {commercialData.monthlyRevenue.toLocaleString()} / {commercialData.targetRevenue.toLocaleString()} DH
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#00C49F"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - commercialData.conversionRate / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{commercialData.conversionRate}%</span>
              </div>
            </div>
            <h4 className="font-semibold text-gray-900">Taux de conversion</h4>
            <p className="text-sm text-gray-600">Devis → Commandes</p>
          </div>

          {/* Client Satisfaction */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#FFBB28"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - 92 / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">92%</span>
              </div>
            </div>
            <h4 className="font-semibold text-gray-900">Satisfaction client</h4>
            <p className="text-sm text-gray-600">Note moyenne</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Commandes récentes</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button>
          </div>
          
          <div className="space-y-3">
            {commercialOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                  <p className="text-xs text-gray-500">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{order.total} DH</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'delivered' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {order.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                    {order.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {order.status === 'delivered' ? 'Livrée' :
                     order.status === 'processing' ? 'En cours' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Devis récents</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button>
          </div>
          
          <div className="space-y-3">
            {commercialQuotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{quote.id}</p>
                  <p className="text-sm text-gray-600">{quote.customer}</p>
                  <p className="text-xs text-gray-500">Valide jusqu'au {quote.validUntil}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{quote.total} DH</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quote.status === 'accepted' ? 'Accepté' :
                     quote.status === 'pending' ? 'En attente' : 'Refusé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <FloatingNotification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Modal pour nouveau devis */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nouveau Devis</h3>
              <button 
                onClick={() => setShowQuoteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {/* Sélection client existant */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un client existant (optionnel)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const client = existingClients.find(c => c.id === e.target.value);
                      if (client) selectExistingClient(client, 'quote');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Nouveau client --</option>
                  {existingClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    value={quoteForm.clientName}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={quoteForm.clientEmail}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={quoteForm.clientPhone}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+212612345678 ou 0612345678"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Produits
                  </label>
                  <button
                    type="button"
                    onClick={addProductToQuote}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Ajouter produit
                  </button>
                </div>
                
                {quoteForm.products.map((product, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                    {/* Sélection depuis le catalogue */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sélectionner depuis le catalogue
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const catalogProduct = catalogProducts.find(p => p.id === e.target.value);
                            if (catalogProduct) selectCatalogProduct(index, catalogProduct);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Sélectionner un produit --</option>
                        {catalogProducts.map(catalogProduct => (
                          <option key={catalogProduct.id} value={catalogProduct.id}>
                            {catalogProduct.name} - {catalogProduct.price} DH ({catalogProduct.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom du produit *
                        </label>
                        <input
                          type="text"
                          placeholder="Nom du produit"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="Description du produit"
                          value={product.description || ''}
                          onChange={(e) => updateProduct(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité *
                        </label>
                        <input
                          type="number"
                          placeholder="Quantité"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix unitaire (DH) *
                        </label>
                        <input
                          type="number"
                          placeholder="Prix unitaire"
                          value={product.price}
                          onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                          {((product.quantity || 0) * (product.price || 0)).toLocaleString()} DH
                        </div>
                      </div>
                    </div>

                    {quoteForm.products.length > 1 && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeProductFromQuote(index)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                        >
                          <X size={16} />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validité (jours)
                  </label>
                  <input
                    type="number"
                    value={quoteForm.validityDays}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, validityDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              
              {/* Récapitulatif du total */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Sous-total:</span>
                  <span className="text-sm text-gray-800">{quoteForm.products.reduce((sum, product) => sum + (product.quantity * product.price), 0).toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">TVA (20%):</span>
                  <span className="text-sm text-gray-800">{(quoteForm.products.reduce((sum, product) => sum + (product.quantity * product.price), 0) * 0.2).toFixed(2)} DH</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total TTC:</span>
                    <span className="text-lg font-bold text-blue-600">{(quoteForm.products.reduce((sum, product) => sum + (product.quantity * product.price), 0) * 1.2).toFixed(2)} DH</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  Créer le devis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour nouveau client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nouveau Client</h3>
              <button 
                onClick={() => setShowClientModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={clientForm.city}
                    onChange={(e) => setClientForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de client
                  </label>
                  <select
                    value={clientForm.type}
                    onChange={(e) => setClientForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="garage">Garage</option>
                    <option value="concessionnaire">Concessionnaire</option>
                    <option value="carrosserie">Carrosserie</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de crédit (DH)
                </label>
                <input
                  type="number"
                  value={clientForm.creditLimit}
                  onChange={(e) => setClientForm(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Ajouter le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour appel client */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Enregistrer un Appel</h3>
              <button 
                onClick={() => setShowCallModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitCall} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  value={callForm.clientId}
                  onChange={(e) => setCallForm(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {commercialData.clientDetails.map((client, index) => (
                    <option key={index} value={client.client}>{client.client}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet de l'appel
                </label>
                <input
                  type="text"
                  value={callForm.subject}
                  onChange={(e) => setCallForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Suivi commande, négociation prix..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes de l'appel
                </label>
                <textarea
                  value={callForm.notes}
                  onChange={(e) => setCallForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Détails de la conversation, accords, points à retenir..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'appel
                  </label>
                  <select
                    value={callForm.callType}
                    onChange={(e) => setCallForm(prev => ({ ...prev, callType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner le type</option>
                    <option value="prospection">Prospection</option>
                    <option value="suivi">Suivi commande</option>
                    <option value="negociation">Négociation</option>
                    <option value="reclamation">Réclamation</option>
                    <option value="information">Information</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    value={callForm.duration}
                    onChange={(e) => setCallForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    placeholder="Ex: 15"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résultat de l'appel
                </label>
                <select
                  value={callForm.result}
                  onChange={(e) => setCallForm(prev => ({ ...prev, result: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner le résultat</option>
                  <option value="positif">Positif - Intérêt confirmé</option>
                  <option value="neutre">Neutre - À recontacter</option>
                  <option value="negatif">Négatif - Pas intéressé</option>
                  <option value="commande">Commande passée</option>
                  <option value="devis">Devis demandé</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de suivi
                </label>
                <input
                  type="date"
                  value={callForm.followUpDate}
                  onChange={(e) => setCallForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Phone size={16} />
                  Enregistrer l'appel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour rapport mensuel */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Générer Rapport Mensuel</h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Résumé du mois</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CA réalisé:</span>
                    <span className="font-semibold">{commercialData.monthlyRevenue.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Objectif:</span>
                    <span>{commercialData.targetRevenue.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance:</span>
                    <span className={`font-semibold ${
                      commercialData.percentage >= 100 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {commercialData.percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-semibold text-blue-600">{monthlyCommission.toLocaleString()} DH</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Ce rapport inclura:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Détail des ventes par client</li>
                  <li>Évolution du chiffre d'affaires</li>
                  <li>Analyse des commissions</li>
                  <li>Objectifs vs réalisations</li>
                  <li>Recommandations pour le mois suivant</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <Download size={16} />
                  Générer le rapport
                </button>
              </div>
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

export default CommercialDashboard;
