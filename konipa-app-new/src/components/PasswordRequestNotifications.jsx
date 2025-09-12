import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Eye, 
  Edit, 
  Clock, 
  User, 
  Mail, 
  CheckCircle, 
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from './NotificationSystem';
import apiService from '../services/apiService';

// Composant pour afficher les demandes de mot de passe
export const PasswordRequestNotifications = () => {
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const { addNotification } = useNotifications();

  // Charger les demandes de mot de passe
  const loadPasswordRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/auth/admin/password-requests');
      let requests = [];
      
      // Handle different response formats
      if (response.data && response.data.requests) {
        requests = response.data.requests;
      } else if (response.data && Array.isArray(response.data)) {
        requests = response.data;
      } else if (Array.isArray(response)) {
        requests = response;
      }
      
      setPasswordRequests(requests);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les demandes de mot de passe'
      });
    } finally {
      setLoading(false);
    }
  };

  // Traiter une demande (voir ou modifier le mot de passe)
  const handlePasswordRequest = async (requestId, action, newPassword = null) => {
    try {
      setProcessingRequest(requestId);
      const result = await apiService.post(`/auth/admin/password-requests/${requestId}`, { action, newPassword });
        
        // Marquer la demande comme traitée
        setPasswordRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'processed', processedAt: new Date() }
              : req
          )
        );

        const password = result.data?.password || result.password;
        addNotification({
          type: 'success',
          title: 'Demande traitée',
          message: action === 'view' 
            ? `Mot de passe actuel: ${password}` 
            : 'Mot de passe modifié avec succès'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de traiter la demande'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Générer un nouveau mot de passe aléatoirement
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  useEffect(() => {
    loadPasswordRequests();
    
    // Actualiser les demandes toutes les 30 secondes
    const interval = setInterval(loadPasswordRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRequestTypeIcon = (type) => {
    return type === 'view' ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />;
  };

  const getRequestTypeLabel = (type) => {
    return type === 'view' ? 'Voir le mot de passe' : 'Modifier le mot de passe';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Chargement des demandes...</span>
        </div>
      </div>
    );
  }

  const pendingRequests = passwordRequests.filter(req => req.status === 'pending');
  const processedRequests = passwordRequests.filter(req => req.status === 'processed');

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Demandes de Mot de Passe</h2>
          </div>
          <button
            onClick={loadPasswordRequests}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">En attente</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-2">{pendingRequests.length}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Traitées</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">{processedRequests.length}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">{passwordRequests.length}</p>
          </div>
        </div>
      </div>

      {/* Demandes en attente */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            Demandes en attente ({pendingRequests.length})
          </h3>
          
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getRequestTypeIcon(request.requestType)}
                      <span className="font-medium text-gray-900">
                        {getRequestTypeLabel(request.requestType)}
                      </span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        En attente
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Utilisateur:</span>
                        <span className="text-sm font-medium">{request.username}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium">{request.userEmail}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Demandé {formatTimeAgo(request.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {request.requestType === 'view' ? (
                      <button
                        onClick={() => handlePasswordRequest(request.id, 'view')}
                        disabled={processingRequest === request.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir mot de passe</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const newPassword = generateRandomPassword();
                            handlePasswordRequest(request.id, 'change', newPassword);
                          }}
                          disabled={processingRequest === request.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Générer nouveau</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            const newPassword = prompt('Entrez le nouveau mot de passe:');
                            if (newPassword) {
                              handlePasswordRequest(request.id, 'change', newPassword);
                            }
                          }}
                          disabled={processingRequest === request.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Définir manuel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Demandes traitées récentes */}
      {processedRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            Demandes traitées récentes
          </h3>
          
          <div className="space-y-3">
            {processedRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  {getRequestTypeIcon(request.requestType)}
                  <span className="text-sm font-medium">{request.username}</span>
                  <span className="text-sm text-gray-500">({request.userEmail})</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {getRequestTypeLabel(request.requestType)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500">
                  Traité {formatTimeAgo(request.processedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune demande */}
      {passwordRequests.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande de mot de passe</h3>
          <p className="text-gray-600">Les demandes d'assistance pour les mots de passe apparaîtront ici.</p>
        </div>
      )}
    </div>
  );
};

export default PasswordRequestNotifications;