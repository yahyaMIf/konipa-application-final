import React, { useState, useEffect } from 'react';
import { orderWorkflowService } from '../services/OrderWorkflowService';
import authService from '../services/authService';

/**
 * Composant de suivi des commandes pour les clients
 */
const OrderTracking = ({ orderId, embedded = false }) => {
  const [order, setOrder] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDelivery, setShowConfirmDelivery] = useState(false);
  const currentUserResult = authService.getCurrentUser();
  const currentUser = currentUserResult.success ? currentUserResult.user : null;

  useEffect(() => {
    loadOrderData();
    
    // Écouter les changements de statut en temps réel
    const handleStatusChange = (event, data) => {
      if (data.orderId === orderId) {
        setOrder(data.order);
        loadActionHistory();
      }
    };
    
    orderWorkflowService.addListener(handleStatusChange);
    
    return () => {
      orderWorkflowService.removeListener(handleStatusChange);
    };
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      const orderData = await orderWorkflowService.getOrderById(orderId);
      setOrder(orderData);
      await loadActionHistory();
    } catch (err) {
      setError('Erreur lors du chargement de la commande');
      } finally {
      setLoading(false);
    }
  };

  const loadActionHistory = async () => {
    try {
      const history = orderWorkflowService.getOrderActionHistory(orderId);
      setActionHistory(history);
    } catch (err) {
      }
  };

  const handleConfirmDelivery = async () => {
    try {
      await orderWorkflowService.changeOrderStatus(
        orderId,
        'completed',
        currentUser.id,
        currentUser.role,
        'Commande confirmée reçue par le client'
      );
      setShowConfirmDelivery(false);
    } catch (err) {
      alert('Erreur lors de la confirmation: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const statusInfo = orderWorkflowService.getStatusInfo(status);
    return statusInfo?.color || 'gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'draft': '📝',
      'pending': '⏳',
      'confirmed': '✅',
      'rejected': '❌',
      'preparing': '👨‍🍳',
      'ready_for_delivery': '📦',
      'shipped': '🚚',
      'delivered': '🏠',
      'completed': '🎉',
      'delivery_failed': '⚠️',
      'cancelled': '🚫'
    };
    return icons[status] || '📋';
  };

  const renderProgressBar = () => {
    const steps = [
      { key: 'pending', label: 'Commande reçue' },
      { key: 'confirmed', label: 'Validée' },
      { key: 'preparing', label: 'En préparation' },
      { key: 'ready_for_delivery', label: 'Prête' },
      { key: 'shipped', label: 'Expédiée' },
      { key: 'delivered', label: 'Livrée' },
      { key: 'completed', label: 'Terminée' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === order?.status);
    const isRejectedOrCancelled = ['rejected', 'cancelled'].includes(order?.status);

    if (isRejectedOrCancelled) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center text-red-600">
            <span className="text-2xl mr-2">{getStatusIcon(order.status)}</span>
            <div>
              <h3 className="font-semibold">
                {orderWorkflowService.getStatusInfo(order.status)?.label}
              </h3>
              <p className="text-sm">
                {orderWorkflowService.getStatusInfo(order.status)?.description}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold
                  ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'}
                `}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className={`
                  text-xs mt-2 text-center
                  ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-500'}
                `}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`
                    h-1 w-full mt-2
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOrderDetails = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Détails de la commande</h3>
      
      {/* Affichage spécial si commande créée par comptable */}
      {order?.source === 'accountant' && order?.metadata?.createdByAccountant && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-blue-800">
            <span className="text-lg mr-2">👤</span>
            <div>
              <p className="font-semibold">Commande créée par un comptable</p>
              <p className="text-sm text-blue-600">
                Créée par: {order.metadata.accountantName || 'Comptable'}
              </p>
              <p className="text-sm text-blue-600">
                Pour le client: {order.metadata.clientName}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Numéro de commande</p>
          <p className="font-semibold">{order?.orderNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Statut actuel</p>
          <div className="flex items-center">
            <span className="mr-2">{getStatusIcon(order?.status)}</span>
            <span className={`font-semibold text-${getStatusColor(order?.status)}-600`}>
              {orderWorkflowService.getStatusInfo(order?.status)?.label}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">Date de commande</p>
          <p className="font-semibold">
            {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '-'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Montant total</p>
          <p className="font-semibold">{order?.total?.toFixed(2)} €</p>
        </div>
        {order?.source && (
          <div>
            <p className="text-sm text-gray-600">Source de la commande</p>
            <p className="font-semibold">
              {order.source === 'accountant' ? 'Créée par comptable' : 
               order.source === 'web' ? 'Site web' : 
               order.source === 'mobile' ? 'Application mobile' : 
               order.source || 'Non spécifiée'}
            </p>
          </div>
        )}
        {order?.trackingNumber && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Numéro de suivi</p>
            <p className="font-semibold text-blue-600">{order.trackingNumber}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderActionHistory = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Historique de la commande</h3>
      <div className="space-y-4">
        {actionHistory.map((action, index) => (
          <div key={action.id} className="flex items-start space-x-3">
            <div className={`
              w-3 h-3 rounded-full mt-2
              ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}
            `} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {orderWorkflowService.getStatusInfo(action.newStatus)?.label}
                </p>
                <span className="text-sm text-gray-500">
                  {new Date(action.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {orderWorkflowService.getStatusInfo(action.newStatus)?.description}
              </p>
              {action.reason && (
                <p className="text-sm text-gray-500 italic mt-1">
                  Raison: {action.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDeliveryConfirmation = () => {
    if (order?.status !== 'delivered' || currentUser?.role !== 'client') {
      return null;
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              Commande livrée ! 🎉
            </h3>
            <p className="text-green-700">
              Veuillez confirmer que vous avez bien reçu votre commande.
            </p>
          </div>
          <button
            onClick={() => setShowConfirmDelivery(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirmer la réception
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadOrderData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">Commande non trouvée</p>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'max-w-4xl mx-auto p-6'}>
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Suivi de commande #{order.orderNumber}
          </h1>
          <p className="text-gray-600">
            Suivez l'état de votre commande en temps réel
          </p>
        </div>
      )}

      {renderProgressBar()}
      {renderDeliveryConfirmation()}
      {renderOrderDetails()}
      {renderActionHistory()}

      {/* Modal de confirmation de livraison */}
      {showConfirmDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirmer la réception
            </h3>
            <p className="text-gray-600 mb-6">
              Confirmez-vous avoir bien reçu votre commande #{order.orderNumber} ?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDelivery(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelivery}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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

export default OrderTracking;