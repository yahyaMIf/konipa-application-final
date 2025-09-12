import React, { useState, useEffect } from 'react';
import { orderWorkflowService } from '../services/OrderWorkflowService';
import authService from '../services/authService';
import dataService, { orderService } from '../services/dataService';
import OrderTracking from './OrderTracking';

/**
 * Composant de gestion des commandes pour admin/comptabilité/comptoir
 */
const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({
    orderId: null,
    newStatus: '',
    reason: '',
    trackingNumber: ''
  });
  
  const currentUserResult = authService.getCurrentUser();
  const currentUser = currentUserResult.success ? currentUserResult.user : null;
  const userRole = currentUser?.role || 'client';

  useEffect(() => {
    loadOrders();
    
    // Écouter les changements de statut en temps réel
    const handleStatusChange = (event, data) => {
      loadOrders(); // Recharger la liste
      if (selectedOrder && selectedOrder.id === data.orderId) {
        setSelectedOrder(data.order);
      }
    };
    
    orderWorkflowService.addListener(handleStatusChange);
    
    return () => {
      orderWorkflowService.removeListener(handleStatusChange);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    
    // Filtres selon le rôle
    switch (userRole) {
      case 'compta':
      case 'accountant':
      case 'accounting':
        if (filter === 'pending') return orders.filter(o => o.status === 'pending');
        if (filter === 'my_actions') return orders.filter(o => ['pending', 'confirmed', 'rejected'].includes(o.status));
        break;
        
      case 'counter':
        if (filter === 'to_prepare') return orders.filter(o => o.status === 'confirmed');
        if (filter === 'preparing') return orders.filter(o => o.status === 'preparing');
        if (filter === 'my_actions') return orders.filter(o => ['confirmed', 'preparing', 'ready_for_delivery', 'shipped'].includes(o.status));
        break;
        
      default:
        return orders.filter(o => o.status === filter);
    }
    
    return orders;
  };

  const getAvailableActions = (order) => {
    const nextStatuses = orderWorkflowService.getNextPossibleStatuses(order.status, userRole);
    return nextStatuses.map(status => ({
      status,
      label: orderWorkflowService.getStatusInfo(status)?.label,
      color: orderWorkflowService.getStatusInfo(status)?.color
    }));
  };

  const handleStatusChange = (orderId, newStatus) => {
    setStatusChangeData({
      orderId,
      newStatus,
      reason: '',
      trackingNumber: ''
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      const { orderId, newStatus, reason, trackingNumber } = statusChangeData;
      
      const additionalData = {};
      if (newStatus === 'shipped' && trackingNumber) {
        additionalData.trackingNumber = trackingNumber;
      }
      
      await orderWorkflowService.changeOrderStatus(
        orderId,
        newStatus,
        currentUser.id,
        userRole,
        reason,
        additionalData
      );
      
      setShowStatusModal(false);
      setStatusChangeData({ orderId: null, newStatus: '', reason: '', trackingNumber: '' });
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800',
      'preparing': 'bg-orange-100 text-orange-800',
      'ready_for_delivery': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getFilterOptions = () => {
    const baseOptions = [
      { value: 'all', label: 'Toutes les commandes' }
    ];
    
    switch (userRole) {
      case 'compta':
      case 'accountant':
      case 'accounting':
        return [
          ...baseOptions,
          { value: 'pending', label: 'En attente de validation' },
          { value: 'my_actions', label: 'Mes actions' }
        ];
        
      case 'counter':
        return [
          ...baseOptions,
          { value: 'to_prepare', label: 'À préparer' },
          { value: 'preparing', label: 'En préparation' },
          { value: 'my_actions', label: 'Mes actions' }
        ];
        
      default:
        return [
          ...baseOptions,
          { value: 'pending', label: 'En attente' },
          { value: 'confirmed', label: 'Confirmées' },
          { value: 'preparing', label: 'En préparation' },
          { value: 'shipped', label: 'Expédiées' },
          { value: 'delivered', label: 'Livrées' }
        ];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gestion des commandes
        </h1>
        <p className="text-gray-600">
          {userRole === 'compta' || userRole === 'accountant' || userRole === 'accounting' 
            ? 'Validez les commandes en attente'
            : userRole === 'counter'
            ? 'Gérez la préparation et l\'expédition des commandes'
            : 'Vue d\'ensemble de toutes les commandes'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des commandes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Commandes</h2>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  {getFilterOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="divide-y">
              {getFilteredOrders().map(order => {
                const availableActions = getAvailableActions(order);
                
                return (
                  <div
                    key={order.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{order.orderNumber}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getStatusColor(order.status)
                          }`}>
                            {orderWorkflowService.getStatusInfo(order.status)?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Client: {order.clientName} • {order.total.toFixed(2)} €
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      {availableActions.length > 0 && (
                        <div className="flex space-x-2">
                          {availableActions.map(action => (
                            <button
                              key={action.status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, action.status);
                              }}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors
                                ${action.color === 'green' ? 'bg-green-600 text-white hover:bg-green-700' :
                                  action.color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                  action.color === 'orange' ? 'bg-orange-600 text-white hover:bg-orange-700' :
                                  action.color === 'red' ? 'bg-red-600 text-white hover:bg-red-700' :
                                  'bg-gray-600 text-white hover:bg-gray-700'
                                }
                              `}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {getFilteredOrders().length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Aucune commande trouvée
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails de la commande sélectionnée */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Détails de la commande</h2>
              </div>
              <div className="p-4">
                <OrderTracking orderId={selectedOrder.id} embedded={true} />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">Sélectionnez une commande pour voir les détails</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de changement de statut */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Changer le statut de la commande
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Nouveau statut: <span className="font-semibold">
                    {orderWorkflowService.getStatusInfo(statusChangeData.newStatus)?.label}
                  </span>
                </p>
              </div>
              
              {statusChangeData.newStatus === 'shipped' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de suivi (optionnel)
                  </label>
                  <input
                    type="text"
                    value={statusChangeData.trackingNumber}
                    onChange={(e) => setStatusChangeData(prev => ({
                      ...prev,
                      trackingNumber: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ex: TRK123456789"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison (optionnel)
                </label>
                <textarea
                  value={statusChangeData.reason}
                  onChange={(e) => setStatusChangeData(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Commentaire ou raison du changement..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmStatusChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;