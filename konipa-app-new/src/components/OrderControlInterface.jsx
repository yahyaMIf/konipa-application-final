import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Clock, Truck, CheckCircle, AlertCircle, Eye, Edit,
  Search, Filter, Calendar, User, MapPin, Phone, Mail,
  Printer, Download, RefreshCw, ArrowRight, Play, Pause
} from 'lucide-react';
import { orderService } from '../services/dataService';

const OrderControlInterface = ({ orders: initialOrders, onUpdateOrder, onNotifyClient }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les commandes depuis l'API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        if (initialOrders && initialOrders.length > 0) {
          setOrders(initialOrders);
        } else {
          const ordersData = await orderService.getOrders();
          setOrders(ordersData || []);
        }
      } catch (err) {
        setError(err.message);
        // Données de secours en cas d'erreur
        setOrders([
          {
            id: 'CMD001',
            client: 'Jean Dupont',
            email: 'jean.dupont@email.com',
            phone: '+212 6 12 34 56 78',
            address: '123 Rue Mohammed V, Casablanca',
            items: [
              { name: 'Produit A', quantity: 2, price: 150 },
              { name: 'Produit B', quantity: 1, price: 300 }
            ],
            total: 600,
            status: 'pending',
            priority: 'normal',
            orderDate: '2024-01-15T10:30:00',
            estimatedDelivery: '2024-01-18T14:00:00',
            notes: 'Livraison urgente demandée',
            controlledBy: null,
            controlledAt: null,
            statusHistory: [
              { status: 'pending', timestamp: '2024-01-15T10:30:00', user: 'Système' }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [initialOrders]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser] = useState('Agent001'); // Simulé

  const statusConfig = {
    pending: {
      label: 'En attente',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
      nextStatus: 'preparation',
      nextLabel: 'Commencer la préparation'
    },
    preparation: {
      label: 'En préparation',
      color: 'bg-blue-100 text-blue-800',
      icon: Package,
      nextStatus: 'awaiting_shipment',
      nextLabel: 'Marquer prêt pour expédition'
    },
    awaiting_shipment: {
      label: 'En attente d\'expédition',
      color: 'bg-purple-100 text-purple-800',
      icon: AlertCircle,
      nextStatus: 'shipped',
      nextLabel: 'Marquer comme expédié'
    },
    shipped: {
      label: 'Expédié',
      color: 'bg-green-100 text-green-800',
      icon: Truck,
      nextStatus: 'delivered',
      nextLabel: 'Marquer comme livré'
    },
    delivered: {
      label: 'Livré',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      nextStatus: null,
      nextLabel: null
    }
  };

  const priorityConfig = {
    low: { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    high: { label: 'Élevée', color: 'bg-red-100 text-red-800' }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = {
            ...order,
            status: newStatus,
            controlledBy: currentUser,
            controlledAt: new Date().toISOString(),
            statusHistory: [
              ...order.statusHistory,
              {
                status: newStatus,
                timestamp: new Date().toISOString(),
                user: currentUser
              }
            ]
          };
          
          // Notifier le client
          onNotifyClient?.(updatedOrder, newStatus);
          onUpdateOrder?.(updatedOrder);
          
          return updatedOrder;
        }
        return order;
      })
    );
  };

  const getStatusStats = () => {
    const stats = {};
    Object.keys(statusConfig).forEach(status => {
      stats[status] = orders.filter(order => order.status === status).length;
    });
    return stats;
  };

  const stats = getStatusStats();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const printOrderLabel = (order) => {
    const printContent = `
      ÉTIQUETTE DE COMMANDE\n
      Commande: ${order.id}\n
      Client: ${order.client}\n
      Adresse: ${order.address}\n
      Téléphone: ${order.phone}\n
      Articles:\n
      ${order.items.map(item => `- ${item.name} x${item.quantity}`).join('\n')}\n
      Total: ${order.total} DH\n
      Statut: ${statusConfig[order.status].label}\n
      Date: ${formatDate(order.orderDate)}
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre>${printContent}</pre>`);
    printWindow.print();
    printWindow.close();
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Contrôle des Commandes</h2>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Statistiques des statuts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 text-center"
              >
                <Icon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="text-2xl font-bold text-gray-900">{stats[status] || 0}</div>
                <div className="text-sm text-gray-600">{config.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par ID ou nom client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusConfig).map(([status, config]) => (
              <option key={status} value={status}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredOrders.map((order, index) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{order.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.client}</div>
                          <div className="text-sm text-gray-500">{order.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.total.toLocaleString()} DH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusConfig[order.status].color
                        }`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[order.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          priorityConfig[order.priority].color
                        }`}>
                          {priorityConfig[order.priority].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => printOrderLabel(order)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Imprimer étiquette"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {statusConfig[order.status].nextStatus && (
                            <button
                              onClick={() => updateOrderStatus(order.id, statusConfig[order.status].nextStatus)}
                              className="text-green-600 hover:text-green-900"
                              title={statusConfig[order.status].nextLabel}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails de commande */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Détails de la commande {selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations client */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Informations Client</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.client}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informations commande */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Informations Commande</h4>
                    <div className="space-y-2">
                      <div>Statut actuel: 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusConfig[selectedOrder.status].color
                        }`}>
                          {statusConfig[selectedOrder.status].label}
                        </span>
                      </div>
                      <div>Priorité: 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          priorityConfig[selectedOrder.priority].color
                        }`}>
                          {priorityConfig[selectedOrder.priority].label}
                        </span>
                      </div>
                      <div>Date de commande: {formatDate(selectedOrder.orderDate)}</div>
                      <div>Livraison estimée: {formatDate(selectedOrder.estimatedDelivery)}</div>
                      {selectedOrder.controlledBy && (
                        <div>Contrôlé par: {selectedOrder.controlledBy} le {formatDate(selectedOrder.controlledAt)}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Articles */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Articles commandés</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString()} DH</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{(item.quantity * item.price).toLocaleString()} DH</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Total:</td>
                          <td className="px-4 py-2 text-sm font-bold text-gray-900">{selectedOrder.total.toLocaleString()} DH</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Historique des statuts */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Historique des statuts</h4>
                  <div className="space-y-2">
                    {selectedOrder.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="font-medium">{statusConfig[history.status].label}</span>
                        <span className="text-gray-500">par {history.user}</span>
                        <span className="text-gray-400">le {formatDate(history.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => printOrderLabel(selectedOrder)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimer</span>
                  </button>
                  {statusConfig[selectedOrder.status].nextStatus && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, statusConfig[selectedOrder.status].nextStatus);
                        setSelectedOrder(null);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>{statusConfig[selectedOrder.status].nextLabel}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderControlInterface;