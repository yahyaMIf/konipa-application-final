import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Phone,
  User,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import dataService, { orderService, userService } from '../services/dataService';
import DocumentService from '../services/DocumentService';

const AllOrders = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrdersData = async () => {
      try {
        setLoading(true);
        const [ordersData, usersData] = await Promise.all([
          orderService.getAllOrders(),
          userService.getAllUsers()
        ]);
        
        // Enrichir les commandes avec les informations des utilisateurs
        const enrichedOrders = ordersData.map(order => {
          const orderUser = usersData.find(u => u.id === order.userId);
          return {
            ...order,
            userName: orderUser?.name || orderUser?.company || `${orderUser?.firstName} ${orderUser?.lastName}` || 'Utilisateur inconnu',
            userEmail: orderUser?.email || '',
            userRole: orderUser?.role || 'client'
          };
        });
        setOrders(enrichedOrders);
      } catch (error) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrdersData();
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { label: 'En préparation', color: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    return configs[status] || configs.pending;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      ceo: 'bg-purple-100 text-purple-800',
      accountant: 'bg-blue-100 text-blue-800',
      pos: 'bg-green-100 text-green-800',
      client: 'bg-gray-100 text-gray-800',
      commercial: 'bg-green-100 text-green-800',
      compta: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesUser = userFilter === 'all' || order.userRole === userFilter;
    const matchesDate = dateFilter === 'all' || (() => {
      const orderDate = new Date(order.date);
      const now = new Date();
      switch(dateFilter) {
        case 'today': return orderDate.toDateString() === now.toDateString();
        case 'week': return (now - orderDate) / (1000 * 60 * 60 * 24) <= 7;
        case 'month': return (now - orderDate) / (1000 * 60 * 60 * 24) <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesUser && matchesDate;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalAmount: orders.reduce((sum, order) => sum + order.total, 0)
  };

  const uniqueRoles = [...new Set(orders.map(order => order.userRole))];

  const generateOrderInvoicePDF = async (order) => {
    try {
      // Préparer les données de la facture
      const invoiceData = {
        invoiceNumber: `INV-${order.id}`,
        date: new Date(order.date).toLocaleDateString('fr-FR'),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
        customer: {
          name: order.userName,
          email: order.userEmail,
          address: order.shippingAddress || 'Adresse non spécifiée'
        },
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        })),
        subtotal: order.subtotal || order.total * 0.8,
        tax: order.tax || order.total * 0.2,
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Toutes les Commandes</h1>
          <p className="text-gray-600">Gestion et suivi de toutes les commandes du système</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
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
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
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
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expédiées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.shipped}</p>
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
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">DH</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAmount.toFixed(0)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher par ID, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtre statut */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En préparation</option>
                <option value="shipped">Expédiées</option>
                <option value="delivered">Livrées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>

            {/* Filtre utilisateur */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">Tous les rôles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Filtre date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Exporter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande trouvée</h3>
              <p className="text-gray-600">Aucune commande ne correspond aux critères de recherche.</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* En-tête de la commande */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                            {order.source === 'accountant' && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                👤 Comptable
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{order.userName}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(order.userRole)}`}>
                              {order.userRole}
                            </span>
                            {order.source === 'accountant' && order.metadata?.accountantName && (
                              <span className="text-xs text-blue-600">
                                (par {order.metadata.accountantName})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{new Date(order.date).toLocaleDateString('fr-FR')}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <StatusIcon className="h-4 w-4" />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{order.total} DH</p>
                          <p className="text-sm text-gray-600">{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détails de la commande */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Articles */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-3">Articles commandés</h4>
                        <div className="space-y-3">
                          {order.items?.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.brand}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{(item.price * item.quantity).toFixed(1)} DH</p>
                                <p className="text-sm text-gray-600">Qté: {item.quantity}</p>
                              </div>
                            </div>
                          )) || (
                            <p className="text-gray-500 italic">Aucun détail d'article disponible</p>
                          )}
                        </div>
                      </div>

                      {/* Informations de livraison */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Informations client</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{order.userName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>{order.userEmail}</span>
                            </div>
                          </div>
                        </div>
                        
                        {order.deliveryDate && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Livraison</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Prévue le {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</span>
                              </div>
                              {order.trackingNumber && (
                                <div className="flex items-center space-x-2">
                                  <Truck className="h-4 w-4" />
                                  <span>Suivi: {order.trackingNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        {order.trackingNumber && (
                          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                            <Truck className="h-4 w-4" />
                            <span>Suivre le colis</span>
                          </button>
                        )}
                        
                        <button 
                          onClick={() => generateOrderInvoicePDF(order)}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 text-sm font-medium"
                          title="Télécharger la facture PDF"
                        >
                          <Download className="h-4 w-4" />
                          <span>Télécharger la facture</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                          <Eye className="h-4 w-4" />
                          <span>Voir détails</span>
                        </button>
                        
                        {(user?.role === 'admin') && (
                          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            <Edit className="h-4 w-4" />
                            <span>Modifier</span>
                          </button>
                        )}
                      </div>
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
      </div>
    </div>
  );
};

export default AllOrders;