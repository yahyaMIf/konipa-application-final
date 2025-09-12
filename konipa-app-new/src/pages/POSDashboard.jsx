import React, { useState, useEffect } from 'react';
import { Search, Package, Receipt, DollarSign, Users, FileText, Printer, Eye, ShoppingCart as CartIcon, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import ProductCatalog from '../components/ProductCatalog';
import ShoppingCart from '../components/ShoppingCart';
import CustomerSearch from '../components/CustomerSearch';
import PaymentProcessing from '../components/PaymentProcessing';
import DailySummary from '../components/DailySummary';
import EnhancedPOSInterface from '../components/EnhancedPOSInterface';
import OrderControlInterface from '../components/OrderControlInterface';
import { formatMAD } from '../utils/currency';
import dataService, { productService, orderService, statisticsService, pricingService, userService } from '../services/dataService';
import { ceoJournalService } from '../services/ceoJournalService';
import DocumentService from '../services/DocumentService';

const POSDashboard = () => {
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('pos');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [invoiceData, setInvoiceData] = useState({
    number: '',
    customer: null,
    items: [],
    total: 0,
    date: new Date().toISOString().split('T')[0]
  });
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [posStats, setPosStats] = useState({
    dailyRevenue: 0,
    transactionsToday: 0,
    averageTransaction: 0,
    customersServed: 0
  });

  // Load POS data from APIs
  useEffect(() => {
    const loadPOSData = async () => {
      try {
        setLoading(true);
        
        // Load products, customers, and orders
        const [productsData, usersData, ordersData, statsData] = await Promise.all([
          productService.getProducts(),
          dataService.getUsers(),
          orderService.getOrders(),
          statisticsService.getStatistics()
        ]);
        
        setProducts(productsData || []);
        
        // Filter and format customers
        const clientUsers = (usersData || [])
          .filter(user => user.role === 'client')
          .map(u => ({
            ...u,
            name: u.company || `${u.firstName} ${u.lastName}`
          }));
        setCustomers(clientUsers);
        
        setOrders(ordersData || []);
        
        // Calculate POS stats from real data
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Filter today's orders
        const todayOrders = (ordersData.orders || ordersData || []).filter(order => {
          const orderDate = new Date(order.createdAt || order.date);
          return orderDate.toISOString().split('T')[0] === todayStr;
        });
        
        // Calculate daily revenue
        const dailyRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        // Calculate transactions count
        const transactionsToday = todayOrders.length;
        
        // Calculate average transaction
        const averageTransaction = transactionsToday > 0 ? Math.round(dailyRevenue / transactionsToday) : 0;
        
        // Calculate unique customers served today
        const uniqueCustomers = new Set(todayOrders.map(order => order.customerId || order.customer)).size;
        
        setPosStats({
          dailyRevenue,
          transactionsToday,
          averageTransaction,
          customersServed: uniqueCustomers
        });
        
        // Update with backend stats if available (override calculated values)
        if (statsData) {
          setPosStats(prev => ({
            ...prev,
            dailyRevenue: statsData.dailyRevenue || prev.dailyRevenue,
            transactionsToday: statsData.transactionsToday || prev.transactionsToday,
            averageTransaction: statsData.averageTransaction || prev.averageTransaction,
            customersServed: statsData.customersServed || prev.customersServed
          }));
        }
        
      } catch (error) {
        // Fallback to empty data in case of error
        setProducts([]);
        const clientUsers = [];
        setCustomers(clientUsers);
      } finally {
        setLoading(false);
      }
    };

    loadPOSData();
  }, []);

  // Get products and customers from state
  const productsToUse = products;
  const customersToUse = customers;

  // Filter products based on search and category
  const filteredProducts = productsToUse.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate cart total
  const [cartTotal, setCartTotal] = useState(0);
  
  useEffect(() => {
    const calculateTotal = async () => {
      let total = 0;
      for (const item of cart) {
        let price = item.price;
        if (selectedCustomer) {
          try {
            const clientPrice = await pricingService.getClientPrice(selectedCustomer.id, item.id);
            price = clientPrice || item.price;
          } catch (error) {
            }
        }
        total += price * item.quantity;
      }
      setCartTotal(total);
    };
    
    calculateTotal();
  }, [cart, selectedCustomer]);

  // Add item to cart
  const addToCart = async (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let price = product.price;
    
    if (selectedCustomer) {
      try {
        const clientPrice = await pricingService.getClientPrice(selectedCustomer.id, product.id);
        price = clientPrice ?? product.price;
      } catch (error) {
        price = product.price;
      }
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, price }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  // Process payment
  const processPayment = async (paymentMethod, amountReceived) => {
    if (amountReceived < cartTotal) {
      alert('Montant insuffisant pour effectuer le paiement');
      return null;
    }

    // Check stock availability before processing
    const stockIssues = [];
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product && product.stock < item.quantity) {
        stockIssues.push(`${item.name}: Stock insuffisant (${product.stock} disponible, ${item.quantity} demandé)`);
      }
    });

    if (stockIssues.length > 0) {
      alert('Problèmes de stock détectés:\n' + stockIssues.join('\n'));
      return null;
    }

    // Calculer les prix clients pour tous les articles
    const itemsWithClientPrices = await Promise.all(
      cart.map(async (item) => {
        let unitPrice = item.price;
        if (selectedCustomer) {
          try {
            const clientPrice = await pricingService.getClientPrice(selectedCustomer.id, item.id);
            unitPrice = clientPrice ?? item.price;
          } catch (error) {
            unitPrice = item.price;
          }
        }
        return {
          ...item,
          unitPrice,
          totalPrice: unitPrice * item.quantity
        };
      })
    );

    const order = {
      id: `ORD-${Date.now()}`,
      customer: selectedCustomer,
      items: itemsWithClientPrices,
      subtotal: cartTotal,
      tax: cartTotal * 0.2,
      total: cartTotal,
      paymentMethod,
      amountReceived,
      change: amountReceived - cartTotal,
      date: new Date().toISOString(),
      status: 'completed',
      cashier: 'Comptoir', // Could be dynamic based on logged user
      receipt: `REC-${Date.now()}`
    };

    setCurrentOrder(order);
    setDailySales([...dailySales, order]);
    
    // Update POS statistics
    setPosStats(prev => ({
      ...prev,
      dailyRevenue: prev.dailyRevenue + cartTotal,
      transactionsToday: prev.transactionsToday + 1,
      averageTransaction: (prev.dailyRevenue + cartTotal) / (prev.transactionsToday + 1),
      customersServed: selectedCustomer ? prev.customersServed + 1 : prev.customersServed
    }));
    
    setCart([]);
    setSelectedCustomer(null);
    
    // Update inventory with better tracking
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        product.stock -= item.quantity;
        product.lastSold = new Date().toISOString();
        product.totalSold = (product.totalSold || 0) + item.quantity;
        
        // Alert for low stock
        if (product.stock <= 10) {
          }
      }
    });

    return order;
  };

  // Generate invoice
  const generateInvoice = async () => {
    if (!selectedCustomer || cart.length === 0) {
      alert('Veuillez sélectionner un client et ajouter des articles');
      return;
    }

    // Calculer les prix clients pour tous les articles
    const itemsWithClientPrices = await Promise.all(
      cart.map(async (item) => {
        let unitPrice = item.price;
        if (selectedCustomer) {
          try {
            const clientPrice = await pricingService.getClientPrice(selectedCustomer.id, item.id);
            unitPrice = clientPrice ?? item.price;
          } catch (error) {
            unitPrice = item.price;
          }
        }
        return {
          ...item,
          unitPrice,
          totalPrice: unitPrice * item.quantity
        };
      })
    );

    const invoice = {
      id: `INV-${Date.now()}`,
      number: `INV-${String(invoiceHistory.length + 1).padStart(8, '0')}`,
      customer: selectedCustomer,
      items: itemsWithClientPrices,
      subtotal: cartTotal,
      tax: cartTotal * 0.2, // 20% TVA
      total: cartTotal * 1.2,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      status: 'generated',
      paymentStatus: 'pending'
    };

    setInvoiceHistory([...invoiceHistory, invoice]);
    setInvoiceData(invoice);
    
    // Logger la génération de facture dans le journal CEO
    ceoJournalService.logInvoiceGeneration(
      invoice.number,
      null, // Pas de numéro de commande dans ce contexte
      invoice.total,
      {
        customerName: selectedCustomer.name,
        customerId: selectedCustomer.id,
        itemCount: cart.length,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        generatedBy: 'POS'
      }
    );
    
    // Update daily stats
    setPosStats(prev => ({
      ...prev,
      dailyRevenue: prev.dailyRevenue + cartTotal,
      transactionsToday: prev.transactionsToday + 1,
      averageTransaction: (prev.dailyRevenue + cartTotal) / (prev.transactionsToday + 1)
    }));
    
    setCart([]);
    setSelectedCustomer(null);
    alert(`Facture ${invoice.number} générée avec succès!\nMontant TTC: ${(cartTotal * 1.2).toLocaleString()} DH`);
  };

  // Generate invoice PDF
  const generateInvoicePDF = async (invoice) => {
    try {
      // Préparer les données de la facture pour DocumentService
      const invoiceData = {
        number: invoice.number,
        date: new Date(invoice.date).toLocaleDateString('fr-FR'),
        dueDate: new Date(invoice.dueDate).toLocaleDateString('fr-FR'),
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email,
          phone: invoice.customer.phone || 'Non spécifié',
          address: invoice.customer.address || 'Adresse non spécifiée'
        },
        items: invoice.items.map(item => ({
          reference: item.reference || item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.price,
          total: item.totalPrice || (item.price * item.quantity)
        })),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        notes: 'Facture générée depuis le point de vente'
      };

      // Générer le PDF avec DocumentService
      await DocumentService.generateInvoicePDF(invoiceData);
      alert(`Facture PDF ${invoice.number} générée et téléchargée avec succès!`);
    } catch (error) {
      alert('Erreur lors de la génération du PDF de la facture');
    }
  };

  // Handle stock alert
  const handleStockAlert = (alert) => {
    const product = productsToUse.find(p => p.id === alert.id);
    if (product) {
      const newStock = prompt(`Stock actuel pour ${product.name}: ${product.stock}\nNouveau stock:`, product.stock);
      if (newStock && !isNaN(newStock)) {
        product.stock = parseInt(newStock);
        alert(`Stock mis à jour pour ${product.name}: ${newStock} unités`);
      }
    }
  };

  // Generate POS report
  const generatePOSReport = (reportData, type) => {
    const reportContent = {
      title: `Rapport ${type === 'daily' ? 'Journalier' : 'POS'} - ${new Date().toLocaleDateString('fr-FR')}`,
      data: reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Comptoir'
    };
    
    // Simple export to console for now (could be enhanced with actual export service)

    alert(`Rapport ${type} généré avec succès!\nVentes: ${reportData.totalSales?.toLocaleString()} DH\nTransactions: ${reportData.transactionCount}`);
  };

  // Filter stock products
  const filteredStockProducts = productsToUse.filter(product =>
    product.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
    product.reference.toLowerCase().includes(stockSearchTerm.toLowerCase())
  );

  // Loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Comptoir</h1>
          <p className="text-muted-foreground">Système de point de vente et gestion comptoir</p>
        </div>

        {/* Enhanced POS Interface */}
        <EnhancedPOSInterface 
          posStats={posStats}
          products={products}
          onStockAlert={handleStockAlert}
          onGenerateReport={generatePOSReport}
        />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA Journalier</p>
                <p className="text-2xl font-bold text-gray-900">{(posStats.dailyRevenue || 0).toLocaleString()} DH</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{posStats.transactionsToday}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Panier Moyen</p>
                <p className="text-2xl font-bold text-gray-900">{posStats.averageTransaction} DH</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients Servis</p>
                <p className="text-2xl font-bold text-gray-900">{posStats.customersServed}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'pos', label: 'Point de Vente', icon: CartIcon },
                { id: 'stock', label: 'Recherche Stock', icon: Package },
                { id: 'invoice', label: 'Facturation', icon: FileText },
                { id: 'order-control', label: 'Contrôle Commandes', icon: CheckCircle },
                { id: 'history', label: 'Historique', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Point de Vente Tab */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <CustomerSearch
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                  />
                  
                  <div className="mt-6">
                    <div className="flex gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Rechercher des produits..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Toutes catégories</option>
                        <option value="Moteur">Moteur</option>
                        <option value="Freinage">Freinage</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Filtration">Filtration</option>
                        <option value="Éclairage">Éclairage</option>
                      </select>
                    </div>

                    <ProductCatalog
                      products={filteredProducts}
                      onAddToCart={(product) => addToCart(product)}
                      selectedCustomer={selectedCustomer}
                    />
                  </div>
                </div>

                <div>
                  <ShoppingCart
                    cart={cart}
                    onRemoveFromCart={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                    total={cartTotal}
                    customer={selectedCustomer}
                  />
                  
                  <div className="mt-6">
                    <PaymentProcessing
                      total={cartTotal}
                      onProcessPayment={processPayment}
                      disabled={cart.length === 0}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stock Search Tab */}
            {activeTab === 'stock' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recherche dans le Stock</h3>
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou référence..."
                        value={stockSearchTerm}
                        onChange={(e) => setStockSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStockProducts.slice(0, 12).map((product) => {
                      const stockLevel = product.stock;
                      const stockStatus = stockLevel > 50 ? 'high' : stockLevel > 20 ? 'medium' : 'low';
                      
                      return (
                        <div key={product.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              stockStatus === 'high' ? 'bg-green-100 text-green-800' :
                              stockStatus === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {stockLevel} unités
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Réf: {product.reference}</p>
                          <p className="text-sm font-semibold text-gray-900">{product.price} DH</p>
                          {selectedCustomer && (
                            <p className="text-sm text-blue-600">
                              Prix client: {product.clientPrice || product.price} DH
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Tab */}
            {activeTab === 'invoice' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Génération de Factures</h3>
                  
                  {selectedCustomer && cart.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">Facture prête à générer</p>
                          <p className="text-sm text-blue-700">
                            Client: {selectedCustomer.name} | Articles: {cart.length} | Total: {cartTotal.toLocaleString()} DH
                          </p>
                        </div>
                        <button
                          onClick={generateInvoice}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Générer Facture
                        </button>
                      </div>
                    </div>
                  )}

                  {(!selectedCustomer || cart.length === 0) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-gray-600">
                          Sélectionnez un client et ajoutez des articles pour générer une facture
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Invoices */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Factures Récentes</h4>
                  <div className="space-y-3">
                    {invoiceHistory.slice(-5).reverse().map((invoice) => (
                      <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{invoice.number}</p>
                            <p className="text-sm text-gray-600">
                              {invoice.customer.name} | {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{invoice.total.toLocaleString()} DH</span>
                            <button
                              onClick={() => generateInvoicePDF(invoice)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Télécharger PDF"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Order Control Tab */}
            {activeTab === 'order-control' && (
              <OrderControlInterface
                orders={dailySales.map((sale, index) => ({
                  id: `ORD-${String(index + 1).padStart(3, '0')}`,
                  client: sale.customer?.name || 'Client Anonyme',
                  email: sale.customer?.email || 'Non spécifié',
                  phone: sale.customer?.phone || '+212 6 00 00 00 00',
                  address: sale.customer?.address || 'Adresse non spécifiée',
                  items: sale.items || [],
                  total: sale.total,
                  status: 'pending',
                  priority: 'normal',
                  orderDate: sale.timestamp || new Date().toISOString(),
                  estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                  notes: 'Commande POS',
                  controlledBy: null,
                  controlledAt: null,
                  statusHistory: [
                    { status: 'pending', timestamp: sale.timestamp || new Date().toISOString(), user: 'Système' }
                  ]
                }))}
                onUpdateOrder={(orderId, updates) => {

                  // Ici vous pouvez ajouter la logique pour mettre à jour la commande
                }}
                onNotifyClient={(order, message) => {

                  // Ici vous pouvez ajouter la logique de notification
                }}
              />
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Historique des Ventes</h3>
                <DailySummary dailySales={dailySales} />
                
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Commandes Récentes</h4>
                  <div className="space-y-3">
                    {dailySales.slice(-10).reverse().map((sale) => (
                      <div key={sale.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Commande #{sale.id}</p>
                            <p className="text-sm text-gray-600">
                              {sale.customer?.name || 'Client anonyme'} | {new Date(sale.date).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{sale.total.toFixed(2)} DH</p>
                            <p className="text-sm text-gray-600">{sale.paymentMethod}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Confirmation Modal */}
        {currentOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Commande #{currentOrder.id} Terminée!
                </h3>
                <p className="text-gray-600 mb-4">
                  Total: {currentOrder.total.toFixed(2)} DH
                </p>
                {currentOrder.change > 0 && (
                  <p className="text-gray-600 mb-4">
                    Monnaie: {currentOrder.change.toFixed(2)} DH
                  </p>
                )}
                <button
                  onClick={() => setCurrentOrder(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default POSDashboard;
