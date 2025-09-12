import React, { useState, useEffect } from 'react';
import { Search, Package, ShoppingCart, FileText, Calculator, Eye, Edit, Plus, Download, Filter, Barcode, Printer, Clock, CheckCircle, AlertTriangle, Users, DollarSign, TrendingUp, X, Minus } from 'lucide-react';
import dataService, { productService, orderService, statisticsService } from '../services/dataService';
import { ceoJournalService } from '../services/ceoJournalService';
import DocumentService from '../services/DocumentService';

const CounterDashboard = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [invoiceData, setInvoiceData] = useState({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    items: [],
    total: 0,
    tax: 0,
    discount: 0
  });
  const [stockData, setStockData] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    averageTransaction: 0,
    topProducts: []
  });

  // Simuler les données de stock avec quantités
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const loadCounterData = async () => {
      try {
        setLoading(true);
        
        // Load products, orders, and users
        const [productsData, ordersData, usersData] = await Promise.all([
          productService.getProducts(),
          orderService.getOrders(),
          dataService.getUsers()
        ]);
        
        setProducts(productsData || []);
        setOrders(ordersData || []);
        setUsers(usersData || []);
        
        // Update inventory with loaded products - use real stock data
        const inventoryData = (productsData || []).map(product => ({
          ...product,
          stockQuantity: product.stockQuantity || product.stock || 0,
          minStock: product.minStock || product.minimumStock || 5,
          location: product.location || product.warehouse || `A${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`
        }));
        setInventory(inventoryData);
        
        // Calculate daily statistics
        const today = new Date().toDateString();
        const todayOrders = (ordersData || []).filter(order => 
          new Date(order.date).toDateString() === today
        );
        
        const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const transactionCount = todayOrders.length;
        const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;
        
        setDailyStats({
          totalSales,
          transactionCount,
          averageTransaction,
          topProducts: inventoryData.slice(0, 5)
        });
        
      } catch (error) {
        // Fallback to empty data in case of error
        setProducts([]);
        setOrders([]);
        setUsers([]);
        
        setInventory([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadCounterData();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const results = inventory.filter(product => 
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.reference?.toLowerCase().includes(term.toLowerCase()) ||
        product.category?.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generateInvoice = async () => {
    try {
      const subtotal = calculateCartTotal();
      const tax = subtotal * 0.2; // 20% TVA
      const total = subtotal + tax - invoiceData.discount;
      
      const invoice = {
        id: `INV-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        customer: {
          name: invoiceData.customerName,
          address: invoiceData.customerAddress,
          phone: invoiceData.customerPhone
        },
        items: cart,
        subtotal,
        tax,
        discount: invoiceData.discount,
        total
      };
      
      // Préparer les données pour DocumentService
       const pdfInvoiceData = {
         number: invoice.id,
         date: new Date().toLocaleDateString('fr-FR'),
         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'), // 30 jours
         customer: {
           name: invoice.customer.name,
           email: 'client@example.com', // Valeur par défaut
           phone: invoice.customer.phone || 'Non spécifié',
           address: invoice.customer.address || 'Adresse non spécifiée'
         },
         items: cart.map(item => ({
           reference: item.id || item.sku,
           name: item.name,
           quantity: item.quantity,
           unitPrice: item.price,
           total: item.price * item.quantity
         })),
         subtotal: invoice.subtotal,
         tax: invoice.tax,
         total: invoice.total,
         notes: 'Facture générée depuis le comptoir'
       };
       
       // Générer le PDF avec DocumentService
       await DocumentService.generateInvoicePDF(pdfInvoiceData);
      
      // Logger la génération de facture dans le journal CEO
      ceoJournalService.logInvoiceGeneration(
        invoice.id,
        null, // Pas de numéro de commande dans ce contexte
        total,
        {
          customerName: invoice.customer.name,
          itemCount: cart.length,
          subtotal,
          tax,
          discount: invoice.discount,
          generatedBy: 'Counter'
        }
      );
      
      alert(`Facture PDF ${invoice.id} générée et téléchargée avec succès!`);
      
      // Réinitialiser le panier et les données de facture
      setCart([]);
      setInvoiceData({
        customerName: '',
        customerAddress: '',
        customerPhone: '',
        items: [],
        total: 0,
        tax: 0,
        discount: 0
      });
      setShowInvoiceModal(false);
    } catch (error) {
      alert('Erreur lors de la génération de la facture PDF');
    }
  };

  const printBarcode = (product) => {

    alert(`Code-barres imprimé pour ${product.name}`);
  };

  const checkStock = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const lowStockProducts = inventory.filter(product => 
    product.stockQuantity <= product.minStock
  );

  const statsCards = [
    {
      title: 'Ventes du Jour',
      value: `${dailyStats.totalSales.toLocaleString()} €`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Transactions',
      value: dailyStats.transactionCount.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Panier Moyen',
      value: `${dailyStats.averageTransaction.toFixed(2)} €`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Stock Faible',
      value: lowStockProducts.length.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  // Loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données du comptoir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Dashboard Comptoir</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestion des ventes et du stock en temps réel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} rounded-lg p-3 sm:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 px-3 sm:px-6">
              {[
                { id: 'search', label: 'Recherche Produits', shortLabel: 'Recherche', icon: Search },
                { id: 'cart', label: 'Panier', shortLabel: 'Panier', icon: ShoppingCart },
                { id: 'stock', label: 'Gestion Stock', shortLabel: 'Stock', icon: Package },
                { id: 'invoices', label: 'Factures', shortLabel: 'Factures', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {tab.id === 'cart' && cart.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                      {cart.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-lg shadow">
          {activeTab === 'search' && (
            <div className="p-3 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Recherche de Produits</h2>
              
              {/* Search Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, référence..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-lg"
                  />
                </div>
              </div>
              
              {/* Search Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(searchResults.length > 0 ? searchResults : inventory.slice(0, 12)).map((product) => (
                  <div key={product.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{product.name}</h3>
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                        product.stockQuantity > product.minStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stockQuantity}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-2">{product.category}</p>
                    <p className="text-base sm:text-lg font-bold text-blue-600 mb-2 sm:mb-3">{product.price.toLocaleString()} €</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{product.location}</p>
                    
                    <div className="flex space-x-1 sm:space-x-2">
                      <button 
                        onClick={() => addToCart(product)}
                        className="flex-1 bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                      >
                        <Plus size={14} className="sm:w-4 sm:h-4" /> 
                        <span className="hidden sm:inline">Ajouter</span>
                        <span className="sm:hidden">+</span>
                      </button>
                      <button 
                        onClick={() => checkStock(product)}
                        className="bg-gray-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-700"
                      >
                        <Eye size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        onClick={() => printBarcode(product)}
                        className="bg-green-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-green-700"
                      >
                        <Barcode size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'cart' && (
            <div className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <h2 className="text-lg sm:text-xl font-bold">Panier ({cart.length} articles)</h2>
                <button 
                  onClick={() => setShowInvoiceModal(true)}
                  disabled={cart.length === 0}
                  className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <FileText size={16} className="sm:w-5 sm:h-5" /> 
                  <span className="hidden sm:inline">Générer Facture</span>
                  <span className="sm:hidden">Facture</span>
                </button>
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground text-base sm:text-lg">Votre panier est vide</p>
                  <p className="text-muted-foreground/60 text-sm sm:text-base">Ajoutez des produits depuis la recherche</p>
                </div>
              ) : (
                <div>
                  {/* Cart Items */}
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                        <div className="flex-1 w-full sm:w-auto">
                          <h3 className="font-semibold text-sm sm:text-base">{item.name}</h3>
                          <p className="text-muted-foreground text-xs sm:text-sm">{item.price.toLocaleString()} € / unité</p>
                        </div>
                        
                        <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-3">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="bg-gray-200 text-gray-700 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <span className="w-8 sm:w-12 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="bg-gray-200 text-gray-700 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              <Plus size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-sm sm:text-base">{(item.price * item.quantity).toLocaleString()} €</p>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={18} className="sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Cart Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg sm:text-xl font-bold">
                      <span>Total:</span>
                      <span>{calculateCartTotal().toLocaleString()} €</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'stock' && (
            <div className="p-3 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Gestion du Stock</h2>
              
              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800 text-sm sm:text-base">Alerte Stock Faible</h3>
                  </div>
                  <p className="text-red-700 text-xs sm:text-sm">{lowStockProducts.length} produit(s) en stock faible</p>
                </div>
              )}
              
              {/* Stock Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Produit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Actuel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Min</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Emplacement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200">
                    {inventory.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-foreground">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.price.toLocaleString()} €</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product.stockQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.minStock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stockQuantity > product.minStock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stockQuantity > product.minStock ? 'En stock' : 'Stock faible'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => checkStock(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => printBarcode(product)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'invoices' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Gestion des Factures</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Nouvelle Facture</h3>
                  <p className="text-muted-foreground mb-4">Créer une facture à partir du panier actuel</p>
                  <button 
                    onClick={() => setShowInvoiceModal(true)}
                    disabled={cart.length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Créer Facture
                  </button>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Factures du Jour</h3>
                  <p className="text-2xl font-bold text-green-600">{dailyStats.transactionCount}</p>
                  <p className="text-muted-foreground">Total: {dailyStats.totalSales.toLocaleString()} €</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Impression</h3>
                  <p className="text-muted-foreground mb-4">Réimprimer une facture existante</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    <Printer className="w-4 h-4 inline mr-2" />
                    Réimprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Modal */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Générer Facture</h3>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Nom du Client</label>
                    <input
                      type="text"
                      value={invoiceData.customerName}
                      onChange={(e) => setInvoiceData({...invoiceData, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nom du client"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={invoiceData.customerPhone}
                      onChange={(e) => setInvoiceData({...invoiceData, customerPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Adresse</label>
                  <textarea
                    value={invoiceData.customerAddress}
                    onChange={(e) => setInvoiceData({...invoiceData, customerAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Adresse du client"
                  />
                </div>
                
                {/* Cart Summary */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Articles ({cart.length})</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between py-1">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString()} €</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Remise (€)</label>
                  <input
                    type="number"
                    value={invoiceData.discount}
                    onChange={(e) => setInvoiceData({...invoiceData, discount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                
                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total:</span>
                    <span>{calculateCartTotal().toLocaleString()} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA (20%):</span>
                    <span>{(calculateCartTotal() * 0.2).toLocaleString()} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remise:</span>
                    <span>-{invoiceData.discount.toLocaleString()} €</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{(calculateCartTotal() * 1.2 - invoiceData.discount).toLocaleString()} €</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={generateInvoice}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Générer Facture
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Detail Modal */}
        {showStockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Détails du Stock</h3>
                <button 
                  onClick={() => setShowStockModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{selectedProduct.name}</h4>
                  <p className="text-muted-foreground">{selectedProduct.category}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Actuel</p>
                    <p className="text-xl font-bold">{selectedProduct.stockQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Minimum</p>
                    <p className="text-xl font-bold">{selectedProduct.minStock}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Emplacement</p>
                  <p className="font-semibold">{selectedProduct.location}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Prix Unitaire</p>
                  <p className="text-xl font-bold text-blue-600">{selectedProduct.price.toLocaleString()} €</p>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setShowStockModal(false);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Ajouter au Panier
                  </button>
                  <button 
                    onClick={() => {
                      printBarcode(selectedProduct);
                      setShowStockModal(false);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Barcode size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterDashboard;