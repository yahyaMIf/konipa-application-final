import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Users,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  Archive
} from 'lucide-react';

const SageSyncHistory = ({ isOpen, onClose }) => {
  const [syncHistory, setSyncHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSyncHistory();
    }
  }, [isOpen]);

  const loadSyncHistory = async () => {
    setLoading(true);
    // Simulation de l'historique des synchronisations
    setTimeout(() => {
      setSyncHistory([
        {
          id: 1,
          date: '2024-01-15 14:30:00',
          status: 'success',
          duration: '2m 15s',
          modules: ['Clients', 'Produits', 'Commandes'],
          results: {
            Clients: { imported: 25, updated: 12, errors: 0 },
            Produits: { imported: 150, updated: 45, errors: 2 },
            Commandes: { imported: 8, updated: 3, errors: 0 }
          }
        },
        {
          id: 2,
          date: '2024-01-15 10:15:00',
          status: 'partial',
          duration: '1m 45s',
          modules: ['Factures', 'Paiements'],
          results: {
            Factures: { imported: 12, updated: 8, errors: 1 },
            Paiements: { imported: 18, updated: 5, errors: 0 }
          }
        },
        {
          id: 3,
          date: '2024-01-14 16:45:00',
          status: 'error',
          duration: '0m 30s',
          modules: ['Stock'],
          error: 'Connexion à Sage 100 impossible',
          results: {}
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <XCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-500" />;
    }
  };

  const getModuleIcon = (module) => {
    const icons = {
      'Clients': Users,
      'Produits': Package,
      'Commandes': ShoppingCart,
      'Factures': FileText,
      'Paiements': CreditCard,
      'Stock': Archive
    };
    const Icon = icons[module] || Database;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Historique des Synchronisations Sage</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Chargement de l'historique...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(sync.status)}
                      <div>
                        <div className="font-medium text-gray-900">
                          Synchronisation du {new Date(sync.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          Durée: {sync.duration}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sync.status)}`}>
                      {sync.status === 'success' && 'Réussie'}
                      {sync.status === 'partial' && 'Partielle'}
                      {sync.status === 'error' && 'Échec'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                    {sync.modules.map((module) => (
                      <div key={module} className="flex items-center space-x-2 text-sm">
                        {getModuleIcon(module)}
                        <span className="font-medium">{module}</span>
                        {sync.results[module] && (
                          <span className="text-gray-500">
                            ({sync.results[module].imported + sync.results[module].updated} éléments)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {sync.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-800 font-medium">Erreur:</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{sync.error}</p>
                    </div>
                  )}

                  {Object.keys(sync.results).length > 0 && (
                    <div className="bg-gray-50 rounded p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Détails par module:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(sync.results).map(([module, result]) => (
                          <div key={module} className="bg-white rounded p-2 border">
                            <div className="flex items-center space-x-2 mb-1">
                              {getModuleIcon(module)}
                              <span className="text-sm font-medium">{module}</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Importés: <span className="font-medium text-green-600">{result.imported}</span></div>
                              <div>Mis à jour: <span className="font-medium text-blue-600">{result.updated}</span></div>
                              <div>Erreurs: <span className="font-medium text-red-600">{result.errors}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SageSyncHistory;