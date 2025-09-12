import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  Tag,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle,
  Star,
  Home,
  Settings,
  Database,
  Truck,
  Shield,
  Key,
  FileText,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  XCircle,
  Clock
} from 'lucide-react';
import clientDiscountService from '../services/ClientDiscountService';
import productLimitService from '../services/ProductLimitService';
import promotionService from '../services/PromotionService';
import sageService from '../services/sageService';
import ImageUpload from '../components/ImageUpload';
import SageSyncHistory from '../components/SageSyncHistory';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('discounts');
  const [loading, setLoading] = useState(true);
  
  // États pour les réductions clients
  const [clientDiscounts, setClientDiscounts] = useState([]);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    clientId: '',
    percentage: ''
  });

  // États pour la configuration Sage
  const [sageConfig, setSageConfig] = useState({
    mode: 'real', // Mode de production par défaut
    apiUrl: '',
    apiKey: '',
    syncEnabled: false,
    lastSync: null
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentSyncOperation, setCurrentSyncOperation] = useState('');
  const [showSyncHistory, setShowSyncHistory] = useState(false);

  // États pour les transporteurs
  const [carriers, setCarriers] = useState([]);
  const [showCarrierForm, setShowCarrierForm] = useState(false);
  const [carrierForm, setCarrierForm] = useState({
    name: '',
    code: '',
    active: true,
    trackingUrl: '',
    apiKey: ''
  });

  // États pour les rôles et permissions
  const [roles, setRoles] = useState([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    permissions: [],
    description: ''
  });

  // États pour les demandes de mot de passe
  const [passwordRequests, setPasswordRequests] = useState([]);

  // États pour le journal d'audit
  const [auditLogs, setAuditLogs] = useState([]);

  // États pour les paramètres généraux
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Konipa',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const [productLimits, setProductLimits] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  
  // États pour les formulaires
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [limitForm, setLimitForm] = useState({ productId: '', maxQuantity: '', period: 'monthly' });
  const [promotionForm, setPromotionForm] = useState({
    productId: '',
    title: '',
    description: '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
    image: null,
    imagePreview: null
  });
  const [newProductForm, setNewProductForm] = useState({
    productId: '',
    title: '',
    description: '',
    highlightUntil: '',
    image: null,
    imagePreview: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setClientDiscounts(clientDiscountService.getAllClientDiscounts());
      setProductLimits(productLimitService.getAllProductLimits());
      setPromotions(promotionService.getAllPromotions());
      setNewProducts(promotionService.getAllNewProducts());
      
      // Charger les données supplémentaires
      await loadAdditionalData();
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const loadAdditionalData = async () => {
    try {
      // Charger la configuration Sage
      sageService.loadConfig();
      const config = sageService.getConfig();
      setSageConfig(config);
      
      // Configuration par défaut si pas de config sauvée
      if (!config.apiUrl) {
        setSageConfig({
          mode: 'real',
          apiUrl: '',
          apiKey: '',
          syncEnabled: false,
          lastSync: null
        });
      }

      setCarriers([
        { id: 1, name: 'DHL', code: 'DHL', active: true, trackingUrl: 'https://www.dhl.com/tracking', apiKey: 'dhl_key_123' },
        { id: 2, name: 'UPS', code: 'UPS', active: true, trackingUrl: 'https://www.ups.com/tracking', apiKey: 'ups_key_456' },
        { id: 3, name: 'FedEx', code: 'FEDEX', active: false, trackingUrl: 'https://www.fedex.com/tracking', apiKey: 'fedex_key_789' }
      ]);

      setRoles([
        { id: 1, name: 'admin', description: 'Administrateur système', permissions: ['all'] },
        { id: 2, name: 'manager', description: 'Gestionnaire', permissions: ['users', 'orders', 'products'] },
        { id: 3, name: 'sales', description: 'Commercial', permissions: ['orders', 'clients'] },
        { id: 4, name: 'client', description: 'Client', permissions: ['orders_view'] }
      ]);

      // Chargement des demandes de mot de passe depuis l'API
      setPasswordRequests([]);

      setAuditLogs([
        { id: 1, action: 'USER_LOGIN', userId: 'admin', timestamp: '2024-01-15T14:30:00Z', details: 'Connexion administrateur' },
        { id: 2, action: 'ORDER_CREATED', userId: 'U001', timestamp: '2024-01-15T14:25:00Z', details: 'Commande #12345 créée' },
        { id: 3, action: 'PRODUCT_UPDATED', userId: 'admin', timestamp: '2024-01-15T14:20:00Z', details: 'Produit P001 modifié' }
      ]);
    } catch (error) {
      }
  };

  // Gestion des réductions clients
  const handleAddDiscount = () => {
    try {
      clientDiscountService.setClientDiscount(discountForm.clientId, parseFloat(discountForm.percentage));
      setDiscountForm({ clientId: '', percentage: '' });
      setShowDiscountForm(false);
      loadData();
      alert('Réduction client ajoutée avec succès!');
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleRemoveDiscount = (clientId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réduction?')) {
      clientDiscountService.removeClientDiscount(clientId);
      loadData();
    }
  };

  // Gestion de la configuration Sage
  const handleSageConfigChange = (field, value) => {
    const newConfig = { ...sageConfig, [field]: value };
    setSageConfig(newConfig);
  };

  const handleSaveSageConfig = () => {
    try {
      sageService.updateConfig(sageConfig);
      alert('Configuration Sage sauvegardée avec succès!');
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const result = await sageService.testConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Erreur lors du test: ' + error.message
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncStatus(null);
    setSyncProgress(0);
    setCurrentSyncOperation('');
    
    try {
      // Surveiller le progrès de la synchronisation
      const progressInterval = setInterval(() => {
        const status = sageService.getSyncStatus();
        setSyncProgress(status.progress);
        setCurrentSyncOperation(status.currentOperation || '');
        
        if (!status.isRunning) {
          clearInterval(progressInterval);
        }
      }, 500);
      
      const result = await sageService.syncAll();
      setSyncStatus(result);
      
      // Mettre à jour la configuration avec la nouvelle date de sync
      const updatedConfig = { ...sageConfig, lastSync: result.timestamp };
      setSageConfig(updatedConfig);
      
      clearInterval(progressInterval);
    } catch (error) {
      setSyncStatus({
        success: false,
        message: 'Erreur lors de la synchronisation: ' + error.message
      });
    } finally {
      setSyncing(false);
      setSyncProgress(0);
      setCurrentSyncOperation('');
    }
  };

  // Gestion des limites de produits
  const handleAddLimit = () => {
    try {
      productLimitService.setProductLimit(
        limitForm.productId,
        parseInt(limitForm.maxQuantity),
        limitForm.period
      );
      setLimitForm({ productId: '', maxQuantity: '', period: 'monthly' });
      setShowLimitForm(false);
      loadData();
      alert('Limite de produit ajoutée avec succès!');
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleRemoveLimit = (productId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette limite?')) {
      productLimitService.removeProductLimit(productId);
      loadData();
    }
  };

  // Gestion des promotions
  const handleAddPromotion = () => {
    try {
      promotionService.addPromotion(promotionForm.productId, {
        title: promotionForm.title,
        description: promotionForm.description,
        discountPercentage: parseFloat(promotionForm.discountPercentage),
        startDate: promotionForm.startDate,
        endDate: promotionForm.endDate,
        image: promotionForm.imagePreview
      });
      setPromotionForm({
        productId: '',
        title: '',
        description: '',
        discountPercentage: '',
        startDate: '',
        endDate: '',
        image: null,
        imagePreview: null
      });
      setShowPromotionForm(false);
      loadData();
      // Déclencher l'événement pour mettre à jour la page Promotions
      window.dispatchEvent(new CustomEvent('promotionUpdated'));
      alert('Promotion ajoutée avec succès!');
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleTogglePromotion = (promotionId) => {
    promotionService.togglePromotion(promotionId);
    loadData();
  };

  const handleRemovePromotion = (promotionId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion?')) {
      promotionService.removePromotion(promotionId);
      loadData();
    }
  };

  // Gestion des nouveautés
  const handleAddNewProduct = () => {
    try {
      promotionService.addNewProduct(newProductForm.productId, {
        title: newProductForm.title,
        description: newProductForm.description,
        highlightUntil: newProductForm.highlightUntil,
        image: newProductForm.imagePreview
      });
      setNewProductForm({
        productId: '',
        title: '',
        description: '',
        highlightUntil: '',
        image: null,
        imagePreview: null
      });
      setShowNewProductForm(false);
      loadData();
      // Déclencher l'événement pour mettre à jour la page Promotions
      window.dispatchEvent(new CustomEvent('newProductUpdated'));
      alert('Nouveauté ajoutée avec succès!');
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // Fonctions pour la configuration Sage
  const handleSageConfigUpdate = (field, value) => {
    setSageConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSageSync = async () => {
    setSyncing(true);
    try {
      // Simulation de la synchronisation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSageConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      alert('Synchronisation Sage réussie!');
    } catch (error) {
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  // Fonctions pour les transporteurs
  const handleAddCarrier = () => {
    if (carrierForm.name && carrierForm.code) {
      const newCarrier = {
        id: Date.now(),
        ...carrierForm
      };
      setCarriers([...carriers, newCarrier]);
      setCarrierForm({ name: '', code: '', active: true, trackingUrl: '', apiKey: '' });
      setShowCarrierForm(false);
    }
  };

  const handleToggleCarrier = (id) => {
    setCarriers(carriers.map(carrier => 
      carrier.id === id ? { ...carrier, active: !carrier.active } : carrier
    ));
  };

  const handleDeleteCarrier = (id) => {
    setCarriers(carriers.filter(carrier => carrier.id !== id));
  };

  // Fonctions pour les rôles
  const handleAddRole = () => {
    if (roleForm.name && roleForm.description) {
      const newRole = {
        id: Date.now(),
        ...roleForm
      };
      setRoles([...roles, newRole]);
      setRoleForm({ name: '', permissions: [], description: '' });
      setShowRoleForm(false);
    }
  };

  const handleDeleteRole = (id) => {
    setRoles(roles.filter(role => role.id !== id));
  };

  // Fonctions pour les demandes de mot de passe
  const handlePasswordRequestAction = (id, action) => {
    setPasswordRequests(passwordRequests.map(request => 
      request.id === id ? { ...request, status: action } : request
    ));
  };

  // Fonctions pour les paramètres généraux
  const handleGeneralSettingUpdate = (field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  // Gestionnaires d'upload d'images
  const handlePromotionImageSelect = (file, imageUrl) => {
    setPromotionForm({
      ...promotionForm,
      image: file,
      imagePreview: imageUrl
    });
  };

  const handleNewProductImageSelect = (file, imageUrl) => {
    setNewProductForm({
      ...newProductForm,
      image: file,
      imagePreview: imageUrl
    });
  };

  const handleToggleNewProduct = (newProductId) => {
    promotionService.toggleNewProduct(newProductId);
    loadData();
  };

  const handleRemoveNewProduct = (newProductId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette nouveauté?')) {
      promotionService.removeNewProduct(newProductId);
      loadData();
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'sage', label: 'Configuration Sage', icon: Database },
    { id: 'carriers', label: 'Transporteurs', icon: Truck },
    { id: 'roles', label: 'Rôles & Permissions', icon: Shield },
    { id: 'passwords', label: 'Mots de passe', icon: Key },
    { id: 'audit', label: 'Journal d\'audit', icon: FileText },
    { id: 'discounts', label: 'Réductions', icon: Users },
    { id: 'limits', label: 'Limites Produits', icon: Package },
    { id: 'promotions', label: 'Promotions', icon: Tag },
    { id: 'new-products', label: 'Nouveautés', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600 mt-1">Gestion des réductions, limites et promotions</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Paramètres Généraux */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Paramètres Généraux</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du site
                      </label>
                      <input
                        type="text"
                        value={generalSettings.siteName}
                        onChange={(e) => handleGeneralSettingUpdate('siteName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Mode maintenance</span>
                      <button
                        onClick={() => handleGeneralSettingUpdate('maintenanceMode', !generalSettings.maintenanceMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          generalSettings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            generalSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Inscription activée</span>
                      <button
                        onClick={() => handleGeneralSettingUpdate('registrationEnabled', !generalSettings.registrationEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          generalSettings.registrationEnabled ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            generalSettings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Notifications email</span>
                      <button
                        onClick={() => handleGeneralSettingUpdate('emailNotifications', !generalSettings.emailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          generalSettings.emailNotifications ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            generalSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Notifications SMS</span>
                      <button
                        onClick={() => handleGeneralSettingUpdate('smsNotifications', !generalSettings.smsNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          generalSettings.smsNotifications ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            generalSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Sauvegarder les paramètres
                  </button>
                </div>
              </div>
            )}

              {/* Configuration Sage */}
              {activeTab === 'sage' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Configuration Sage</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mode de fonctionnement
                        </label>
                        <input
                          type="text"
                          value="Mode Réel (Production)"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL de l'API Sage
                        </label>
                        <input
                          type="url"
                          value={sageConfig.apiUrl}
                          onChange={(e) => handleSageConfigChange('apiUrl', e.target.value)}
                          placeholder="https://api.sage.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clé API Sage
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={sageConfig.apiKey}
                            onChange={(e) => handleSageConfigChange('apiKey', e.target.value)}
                            placeholder="sk_live_..."
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showApiKey ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Synchronisation automatique</span>
                        <button
                          onClick={() => handleSageConfigChange('syncEnabled', !sageConfig.syncEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            sageConfig.syncEnabled ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              sageConfig.syncEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">État de la synchronisation</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {sageConfig.mode === 'real' ? (
                              <Wifi className="w-4 h-4 text-green-500" />
                            ) : (
                              <WifiOff className="w-4 h-4 text-orange-500" />
                            )}
                            <span className="text-sm text-gray-600">
                              Mode: {sageConfig.mode === 'real' ? 'Production' : 'Test'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600">
                              Dernière sync: {sageConfig.lastSync ? new Date(sageConfig.lastSync).toLocaleString('fr-FR') : 'Jamais'}
                            </span>
                          </div>
                          {syncing && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-sm text-blue-600">
                                  {currentSyncOperation || 'Synchronisation en cours...'}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${syncProgress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                {syncProgress}% terminé
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Statut de connexion */}
                      {connectionStatus && (
                        <div className={`p-3 rounded-lg ${
                          connectionStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {connectionStatus.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm font-medium ${
                              connectionStatus.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {connectionStatus.message}
                            </span>
                          </div>
                          {connectionStatus.success && connectionStatus.version && (
                            <div className="mt-2 text-xs text-green-600">
                              Version: {connectionStatus.version}
                              {connectionStatus.modules && (
                                <div>Modules: {connectionStatus.modules.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Statut de synchronisation */}
                      {syncStatus && (
                        <div className={`p-3 rounded-lg ${
                          syncStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {syncStatus.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm font-medium ${
                              syncStatus.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {syncStatus.message}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <button
                          onClick={handleSyncNow}
                          disabled={syncing || testingConnection}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          {syncing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          <span>{syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
                        </button>

                        <button 
                          onClick={handleTestConnection}
                          disabled={syncing || testingConnection}
                          className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          {testingConnection ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wifi className="w-4 h-4" />
                          )}
                          <span>{testingConnection ? 'Test en cours...' : 'Tester la connexion'}</span>
                        </button>

                        <button 
                          onClick={handleSaveSageConfig}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Sauvegarder la configuration</span>
                        </button>

                        <button 
                          onClick={() => setShowSyncHistory(true)}
                          className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Historique des synchronisations</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Paramètres avancés */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold mb-4 flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Paramètres avancés</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modules Sage à synchroniser
                        </label>
                        <div className="space-y-2">
                          {['Clients', 'Produits', 'Commandes', 'Factures', 'Paiements', 'Stock'].map(module => (
                            <label key={module} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={sageConfig.modules?.includes(module) || false}
                                onChange={(e) => {
                                  const modules = sageConfig.modules || [];
                                  if (e.target.checked) {
                                    handleSageConfigChange('modules', [...modules, module]);
                                  } else {
                                    handleSageConfigChange('modules', modules.filter(m => m !== module));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{module}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fréquence de synchronisation
                        </label>
                        <select
                          value={sageConfig.syncFrequency || 'manual'}
                          onChange={(e) => handleSageConfigChange('syncFrequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="manual">Manuelle</option>
                          <option value="hourly">Toutes les heures</option>
                          <option value="daily">Quotidienne</option>
                          <option value="weekly">Hebdomadaire</option>
                        </select>
                        
                        <div className="mt-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={sageConfig.enableLogs || false}
                              onChange={(e) => handleSageConfigChange('enableLogs', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Activer les logs détaillés</span>
                          </label>
                        </div>
                        
                        <div className="mt-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={sageConfig.enableNotifications || false}
                              onChange={(e) => handleSageConfigChange('enableNotifications', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Notifications de synchronisation</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

               {/* Transporteurs */}
               {activeTab === 'carriers' && (
                 <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <Truck className="w-5 h-5 text-blue-600" />
                       <h3 className="text-lg font-semibold">Gestion des Transporteurs</h3>
                     </div>
                     <button
                       onClick={() => setShowCarrierForm(true)}
                       className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                     >
                       Ajouter un transporteur
                     </button>
                   </div>

                   {showCarrierForm && (
                     <div className="bg-gray-50 p-4 rounded-lg">
                       <h4 className="font-medium mb-4">Nouveau transporteur</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                           <input
                             type="text"
                             value={carrierForm.name}
                             onChange={(e) => setCarrierForm({...carrierForm, name: e.target.value})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="DHL, UPS, FedEx..."
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                           <input
                             type="text"
                             value={carrierForm.code}
                             onChange={(e) => setCarrierForm({...carrierForm, code: e.target.value})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="DHL, UPS, FEDEX..."
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">URL de suivi</label>
                           <input
                             type="url"
                             value={carrierForm.trackingUrl}
                             onChange={(e) => setCarrierForm({...carrierForm, trackingUrl: e.target.value})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="https://www.dhl.com/tracking"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
                           <input
                             type="password"
                             value={carrierForm.apiKey}
                             onChange={(e) => setCarrierForm({...carrierForm, apiKey: e.target.value})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Clé API du transporteur"
                           />
                         </div>
                       </div>
                       <div className="flex items-center space-x-2 mt-4">
                         <input
                           type="checkbox"
                           id="carrierActive"
                           checked={carrierForm.active}
                           onChange={(e) => setCarrierForm({...carrierForm, active: e.target.checked})}
                           className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                         />
                         <label htmlFor="carrierActive" className="text-sm text-gray-700">Transporteur actif</label>
                       </div>
                       <div className="flex space-x-2 mt-4">
                         <button
                           onClick={handleAddCarrier}
                           className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                         >
                           Ajouter
                         </button>
                         <button
                           onClick={() => {
                             setShowCarrierForm(false);
                             setCarrierForm({ name: '', code: '', active: true, trackingUrl: '', apiKey: '' });
                           }}
                           className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                         >
                           Annuler
                         </button>
                       </div>
                     </div>
                   )}

                   <div className="bg-white rounded-lg border">
                     <div className="overflow-x-auto">
                       <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                           <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporteur</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL de suivi</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {carriers.map((carrier) => (
                             <tr key={carrier.id}>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                   <Truck className="w-5 h-5 text-gray-400 mr-2" />
                                   <span className="text-sm font-medium text-gray-900">{carrier.name}</span>
                                 </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{carrier.code}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                                 <a href={carrier.trackingUrl} target="_blank" rel="noopener noreferrer">
                                   {carrier.trackingUrl}
                                 </a>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                   carrier.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                 }`}>
                                   {carrier.active ? 'Actif' : 'Inactif'}
                                 </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                 <button
                                   onClick={() => handleToggleCarrier(carrier.id)}
                                   className={`${carrier.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                 >
                                   {carrier.active ? 'Désactiver' : 'Activer'}
                                 </button>
                                 <button
                                   onClick={() => handleDeleteCarrier(carrier.id)}
                                   className="text-red-600 hover:text-red-900"
                                 >
                                   Supprimer
                                 </button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 </div>
               )}

               {/* Rôles & Permissions */}
               {activeTab === 'roles' && (
                 <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <Shield className="w-5 h-5 text-blue-600" />
                       <h3 className="text-lg font-semibold">Gestion des Rôles & Permissions</h3>
                     </div>
                     <button
                       onClick={() => setShowRoleForm(true)}
                       className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                     >
                       Créer un rôle
                     </button>
                   </div>

                   {showRoleForm && (
                     <div className="bg-gray-50 p-4 rounded-lg">
                       <h4 className="font-medium mb-4">Nouveau rôle</h4>
                       <div className="space-y-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Nom du rôle</label>
                           <input
                             type="text"
                             value={roleForm.name}
                             onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Gestionnaire, Superviseur..."
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                           <textarea
                             value={roleForm.description}
                             onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             rows="3"
                             placeholder="Description du rôle et de ses responsabilités"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                             {[
                               'Gestion utilisateurs',
                               'Gestion produits',
                               'Gestion commandes',
                               'Vue client 360°',
                               'Marketing',
                               'Paramètres système',
                               'Analytics',
                               'Gestion transporteurs',
                               'Configuration Sage',
                               'Journal d\'audit'
                             ].map((permission) => (
                               <div key={permission} className="flex items-center space-x-2">
                                 <input
                                   type="checkbox"
                                   id={permission}
                                   checked={roleForm.permissions.includes(permission)}
                                   onChange={(e) => {
                                     if (e.target.checked) {
                                       setRoleForm({...roleForm, permissions: [...roleForm.permissions, permission]});
                                     } else {
                                       setRoleForm({...roleForm, permissions: roleForm.permissions.filter(p => p !== permission)});
                                     }
                                   }}
                                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                 />
                                 <label htmlFor={permission} className="text-sm text-gray-700">{permission}</label>
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>
                       <div className="flex space-x-2 mt-4">
                         <button
                           onClick={handleAddRole}
                           className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                         >
                           Créer
                         </button>
                         <button
                           onClick={() => {
                             setShowRoleForm(false);
                             setRoleForm({ name: '', description: '', permissions: [] });
                           }}
                           className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                         >
                           Annuler
                         </button>
                       </div>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {roles.map((role) => (
                       <div key={role.id} className="bg-white p-4 rounded-lg border">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <Shield className="w-5 h-5 text-blue-600" />
                             <h4 className="font-medium text-gray-900">{role.name}</h4>
                           </div>
                           <button
                             onClick={() => handleDeleteRole(role.id)}
                             className="text-red-600 hover:text-red-900"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         </div>
                         <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                         <div className="space-y-1">
                           <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions ({role.permissions.length})</p>
                           <div className="flex flex-wrap gap-1">
                             {role.permissions.slice(0, 3).map((permission) => (
                               <span key={permission} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                 {permission}
                               </span>
                             ))}
                             {role.permissions.length > 3 && (
                               <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                 +{role.permissions.length - 3} autres
                               </span>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Mots de passe */}
               {activeTab === 'passwords' && (
                 <div className="space-y-6">
                   <div className="flex items-center space-x-2">
                     <Key className="w-5 h-5 text-blue-600" />
                     <h3 className="text-lg font-semibold">Gestion des Demandes de Mot de Passe</h3>
                   </div>

                   <div className="bg-white rounded-lg border">
                     <div className="overflow-x-auto">
                       <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                           <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de demande</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {passwordRequests.map((request) => (
                             <tr key={request.id}>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                   <Users className="w-5 h-5 text-gray-400 mr-2" />
                                   <span className="text-sm font-medium text-gray-900">{request.userName}</span>
                                 </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.email}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                 {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                   request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                   request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                   'bg-red-100 text-red-800'
                                 }`}>
                                   {request.status === 'pending' ? 'En attente' :
                                    request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                                 </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                 {request.status === 'pending' && (
                                   <>
                                     <button
                                       onClick={() => handlePasswordRequestUpdate(request.id, 'approved')}
                                       className="text-green-600 hover:text-green-900"
                                     >
                                       Approuver
                                     </button>
                                     <button
                                       onClick={() => handlePasswordRequestUpdate(request.id, 'rejected')}
                                       className="text-red-600 hover:text-red-900"
                                     >
                                       Rejeter
                                     </button>
                                   </>
                                 )}
                                 {request.status !== 'pending' && (
                                   <span className="text-gray-400">Traité le {new Date(request.processedDate).toLocaleDateString('fr-FR')}</span>
                                 )}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {passwordRequests.length === 0 && (
                     <div className="text-center py-8 text-gray-500">
                       <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                       <p>Aucune demande de réinitialisation de mot de passe en attente</p>
                     </div>
                   )}
                 </div>
               )}

               {/* Journal d'audit */}
               {activeTab === 'audit' && (
                 <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <FileText className="w-5 h-5 text-blue-600" />
                       <h3 className="text-lg font-semibold">Journal d'Audit</h3>
                     </div>
                     <div className="flex space-x-2">
                       <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                         <option value="all">Toutes les actions</option>
                         <option value="user">Gestion utilisateurs</option>
                         <option value="product">Gestion produits</option>
                         <option value="order">Gestion commandes</option>
                         <option value="settings">Paramètres</option>
                       </select>
                       <input
                         type="date"
                         className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                     </div>
                   </div>

                   <div className="bg-white rounded-lg border">
                     <div className="overflow-x-auto">
                       <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                           <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Heure</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {auditLog.map((entry) => (
                             <tr key={entry.id}>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                 {new Date(entry.timestamp).toLocaleString('fr-FR')}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                   <Users className="w-4 h-4 text-gray-400 mr-2" />
                                   <span className="text-sm font-medium text-gray-900">{entry.user}</span>
                                 </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                   entry.action.includes('Création') ? 'bg-green-100 text-green-800' :
                                   entry.action.includes('Modification') ? 'bg-blue-100 text-blue-800' :
                                   entry.action.includes('Suppression') ? 'bg-red-100 text-red-800' :
                                   'bg-gray-100 text-gray-800'
                                 }`}>
                                   {entry.action}
                                 </span>
                               </td>
                               <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                 {entry.details}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {entry.ipAddress}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {auditLog.length === 0 && (
                     <div className="text-center py-8 text-gray-500">
                       <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                       <p>Aucune entrée dans le journal d'audit</p>
                     </div>
                   )}

                   <div className="flex justify-between items-center">
                     <p className="text-sm text-gray-500">
                       Affichage de {auditLog.length} entrées
                     </p>
                     <div className="flex space-x-2">
                       <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                         Précédent
                       </button>
                       <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                         Suivant
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               {/* Réductions Clients */}
               {activeTab === 'discounts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Réductions par Client</h2>
                  <button
                    onClick={() => setShowDiscountForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une réduction</span>
                  </button>
                </div>

                {showDiscountForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="ID Client"
                        value={discountForm.clientId}
                        onChange={(e) => setDiscountForm({...discountForm, clientId: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Pourcentage (0-100)"
                        value={discountForm.percentage}
                        onChange={(e) => setDiscountForm({...discountForm, percentage: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        min="0"
                        max="100"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddDiscount}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          <span>Sauvegarder</span>
                        </button>
                        <button
                          onClick={() => setShowDiscountForm(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                          <span>Annuler</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réduction</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientDiscounts.map((discount) => (
                        <tr key={discount.clientId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {discount.clientId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Percent className="w-3 h-3 mr-1" />
                              {discount.percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(discount.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleRemoveDiscount(discount.clientId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Limites Produits */}
            {activeTab === 'limits' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Limites par Produit</h2>
                  <button
                    onClick={() => setShowLimitForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une limite</span>
                  </button>
                </div>

                {showLimitForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="ID Produit"
                        value={limitForm.productId}
                        onChange={(e) => setLimitForm({...limitForm, productId: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Quantité max"
                        value={limitForm.maxQuantity}
                        onChange={(e) => setLimitForm({...limitForm, maxQuantity: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        min="1"
                      />
                      <select
                        value={limitForm.period}
                        onChange={(e) => setLimitForm({...limitForm, period: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuel</option>
                        <option value="yearly">Annuel</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddLimit}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          <span>Sauvegarder</span>
                        </button>
                        <button
                          onClick={() => setShowLimitForm(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                          <span>Annuler</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité Max</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productLimits.map((limit) => (
                        <tr key={limit.productId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {limit.productId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {limit.maxQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {limit.period === 'daily' ? 'Quotidien' :
                               limit.period === 'weekly' ? 'Hebdomadaire' :
                               limit.period === 'monthly' ? 'Mensuel' : 'Annuel'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(limit.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleRemoveLimit(limit.productId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Promotions */}
            {activeTab === 'promotions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Promotions</h2>
                  <button
                    onClick={() => setShowPromotionForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une promotion</span>
                  </button>
                </div>

                {showPromotionForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="ID Produit"
                        value={promotionForm.productId}
                        onChange={(e) => setPromotionForm({...promotionForm, productId: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Titre de la promotion"
                        value={promotionForm.title}
                        onChange={(e) => setPromotionForm({...promotionForm, title: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Pourcentage de réduction"
                        value={promotionForm.discountPercentage}
                        onChange={(e) => setPromotionForm({...promotionForm, discountPercentage: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        min="0"
                        max="100"
                      />
                      <textarea
                        placeholder="Description"
                        value={promotionForm.description}
                        onChange={(e) => setPromotionForm({...promotionForm, description: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        rows="2"
                      />
                      <input
                        type="datetime-local"
                        placeholder="Date de début"
                        value={promotionForm.startDate}
                        onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <input
                        type="datetime-local"
                        placeholder="Date de fin"
                        value={promotionForm.endDate}
                        onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image de la promotion
                      </label>
                      <ImageUpload
                        onImageSelect={handlePromotionImageSelect}
                        currentImage={promotionForm.imagePreview}
                        className="w-full"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddPromotion}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        <span>Sauvegarder</span>
                      </button>
                      <button
                        onClick={() => setShowPromotionForm(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {promotions.map((promotion) => (
                    <div key={promotion.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{promotion.title}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTogglePromotion(promotion.id)}
                            className={`p-1 rounded ${promotion.isActive ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            {promotion.isActive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleRemovePromotion(promotion.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{promotion.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Produit:</span>
                          <span className="font-medium">{promotion.productId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Réduction:</span>
                          <span className="font-medium text-green-600">{promotion.discountPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Période:</span>
                          <span className="font-medium">
                            {new Date(promotion.startDate).toLocaleDateString('fr-FR')} - {new Date(promotion.endDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nouveautés */}
            {activeTab === 'new-products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Nouveautés</h2>
                  <button
                    onClick={() => setShowNewProductForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une nouveauté</span>
                  </button>
                </div>

                {showNewProductForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="ID Produit"
                        value={newProductForm.productId}
                        onChange={(e) => setNewProductForm({...newProductForm, productId: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Titre de la nouveauté"
                        value={newProductForm.title}
                        onChange={(e) => setNewProductForm({...newProductForm, title: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <textarea
                        placeholder="Description"
                        value={newProductForm.description}
                        onChange={(e) => setNewProductForm({...newProductForm, description: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        rows="2"
                      />
                      <input
                        type="datetime-local"
                        placeholder="Mettre en avant jusqu'à"
                        value={newProductForm.highlightUntil}
                        onChange={(e) => setNewProductForm({...newProductForm, highlightUntil: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image de la nouveauté
                      </label>
                      <ImageUpload
                        onImageSelect={handleNewProductImageSelect}
                        currentImage={newProductForm.imagePreview}
                        className="w-full"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddNewProduct}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        <span>Sauvegarder</span>
                      </button>
                      <button
                        onClick={() => setShowNewProductForm(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newProducts.map((newProduct) => (
                    <div key={newProduct.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{newProduct.title}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleNewProduct(newProduct.id)}
                            className={`p-1 rounded ${newProduct.isActive ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            {newProduct.isActive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleRemoveNewProduct(newProduct.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{newProduct.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Produit:</span>
                          <span className="font-medium">{newProduct.productId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mis en avant jusqu'à:</span>
                          <span className="font-medium">
                            {new Date(newProduct.highlightUntil).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal d'historique des synchronisations Sage */}
      {showSyncHistory && (
        <SageSyncHistory 
          isOpen={showSyncHistory}
          onClose={() => setShowSyncHistory(false)}
        />
      )}
    </div>
  );
};

export default AdminSettings;