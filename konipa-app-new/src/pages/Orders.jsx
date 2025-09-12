import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DocumentService from '../services/DocumentService';
import { orderService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone
} from 'lucide-react';

const Orders = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les commandes depuis l'API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const ordersData = await orderService.getOrders({ userId: user?.id });
        setOrders(ordersData?.orders || []);
      } catch (error) {
        setError('Erreur lors du chargement des commandes. Veuillez réessayer.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadOrders();
    }
  }, [user?.id]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered':
        return { 
          label: 'Livrée', 
          color: 'text-green-600 bg-green-100', 
          icon: CheckCircle 
        };
      case 'shipped':
        return { 
          label: 'Expédiée', 
          color: 'text-blue-600 bg-blue-100', 
          icon: Truck 
        };
      case 'processing':
        return { 
          label: 'En préparation', 
          color: 'text-yellow-600 bg-yellow-100', 
          icon: Clock 
        };
      case 'cancelled':
        return { 
          label: 'Annulée', 
          color: 'text-red-600 bg-red-100', 
          icon: AlertCircle 
        };
      default:
        return { 
          label: 'Inconnue', 
          color: 'text-gray-600 bg-gray-100', 
          icon: Package 
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items_detail.some(item => 
                           item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.brand.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || (() => {
      const orderDate = new Date(order.date);
      const now = new Date();
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case '7days': return diffDays <= 7;
        case '30days': return diffDays <= 30;
        case '90days': return diffDays <= 90;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    processing: orders.filter(o => o.status === 'processing').length,
    totalAmount: orders.reduce((sum, order) => sum + order.total, 0)
  };

  const generateOrderInvoicePDF = async (order) => {
    try {
      // Préparer les données de la facture
      const invoiceData = {
        invoiceNumber: `INV-${order.id}`,
        date: new Date(order.date).toLocaleDateString('fr-FR'),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
        customer: {
          name: 'Client',
          email: order.customer?.email || 'Non spécifié',
          address: 'Adresse non spécifiée'
        },
        items: order.items_detail.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        })),
        subtotal: order.total * 0.8,
        tax: order.total * 0.2,
        total: order.total,
        status: order.status
      };

     await DocumentService.generateInvoicePDF(invoiceData);
     alert('Facture PDF générée avec succès!');
   } catch (error) {
     alert('Erreur lors de la génération de la facture PDF');
   }
 };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Commandes</h1>
          <p className="text-gray-600">Suivez l'état de vos commandes et téléchargez vos factures</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des commandes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!loading && (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Livrées</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <Truck className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Expédiées</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.shipped}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">En cours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">€</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAmount.toFixed(2)}€</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Rechercher une commande..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="processing">En préparation</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="7days">7 derniers jours</option>
                    <option value="30days">30 derniers jours</option>
                    <option value="90days">90 derniers jours</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Liste des commandes */}
            <div className="space-y-6">
              {orders.length === 0 && !error ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
                  <p className="text-gray-600">Vous n'avez pas encore passé de commande.</p>
                  <Link 
                    to="/products" 
                    className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Découvrir nos produits
                  </Link>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
                  <p className="text-gray-600">Aucune commande ne correspond à vos critères de recherche.</p>
                </div>
              ) : (
                filteredOrders.map((order, index) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Commande {order.id}</h3>
                              <p className="text-sm text-gray-600">
                                Passée le {new Date(order.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                              <StatusIcon className="h-4 w-4 mr-1" />
                              {statusInfo.label}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{order.total.toFixed(2)}€</p>
                            <p className="text-sm text-gray-600">{order.items} article{order.items > 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        {/* Informations de livraison */}
                        {(order.trackingNumber || order.deliveryDate) && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {order.trackingNumber && (
                                <div className="flex items-center">
                                  <Truck className="h-5 w-5 text-gray-400 mr-2" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Numéro de suivi</p>
                                    <p className="text-sm text-gray-600">{order.trackingNumber}</p>
                                  </div>
                                </div>
                              )}
                              {order.deliveryDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Date de livraison</p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Articles de la commande */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Articles commandés</h4>
                          <div className="space-y-2">
                            {order.items_detail.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center justify-between py-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-600">{item.brand}</p>
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-gray-600">Qté: {item.quantity}</span>
                                  <span className="font-medium text-gray-900">{item.price.toFixed(2)}€</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                          <Link
                            to={`/orders/${order.id}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span>Voir détails</span>
                          </Link>
                          
                          {order.status === 'delivered' && (
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                              Racheter
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="flex items-center justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    Précédent
                  </button>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    2
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;

