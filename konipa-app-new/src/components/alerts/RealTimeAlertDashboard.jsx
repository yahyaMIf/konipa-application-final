import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Shield, 
  Server, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users, 
  Settings, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Volume2,
  VolumeX,
  Plus,
  Download,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useRealTimeAlerts, useAlertCreators } from '../../hooks/useRealTimeAlerts';
import AlertCard from './AlertCard';
import { AlertTypeIcon, PriorityBadge, StatusBadge } from './AlertBadge';

const RealTimeAlertDashboard = () => {
  // Hook d'alertes en temps réel
  const {
    activeAlerts,
    alertHistory,
    metrics,
    loading,
    error,
    connected,
    stats,
    acknowledgeAlert,
    resolveAlert,
    createAlert,
    refreshData,
    clearError,
    getAlertsByPriority,
    getAlertsByType,
    getCriticalAlerts,
    getUnacknowledgedAlerts,
    playAlertSound
  } = useRealTimeAlerts({
    autoRefresh: true,
    refreshInterval: 30000,
    enableSound: soundEnabled,
    maxAlerts: 100
  });
  
  // Hook pour créer des alertes
  const {
    createSecurityAlert,
    createSystemAlert,
    createBusinessAlert,
    createInventoryAlert,
    createFinancialAlert,
    createCustomAlert
  } = useAlertCreators();
  
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: '',
    search: ''
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showResolved, setShowResolved] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Icônes pour les types d'alertes
  const alertTypeIcons = {
    SECURITY: Shield,
    SYSTEM: Settings,
    BUSINESS: TrendingUp,
    INVENTORY: Package,
    FINANCIAL: DollarSign,
    CUSTOMER: Users,
    OPERATIONAL: Wrench,
    PERFORMANCE: BarChart3
  };

  // Couleurs pour les priorités
  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  // Effet pour l'auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(refreshData, 30000); // Toutes les 30 secondes
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  // Acquitter une alerte
  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      }
  };

  // Résoudre une alerte
  const handleResolve = async (alertId, resolution) => {
    try {
      await resolveAlert(alertId, resolution);
      setSelectedAlert(null);
    } catch (error) {
      }
  };

  // Fonctions de test supprimées - utilisation des vraies données uniquement

  // Filtrer les alertes
  const filteredAlerts = activeAlerts.filter(alert => {
    if (filters.type && alert.type !== filters.type) return false;
    if (filters.priority && alert.priority !== filters.priority) return false;
    if (filters.search && !alert.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Filtrer l'historique
  const filteredHistory = alertHistory.filter(alert => {
    if (!showResolved && alert.resolved) return false;
    if (filters.type && alert.type !== filters.type) return false;
    if (filters.priority && alert.priority !== filters.priority) return false;
    if (filters.search && !alert.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Centre d'Alertes en Temps Réel
          </h1>
          <p className="text-gray-600 mt-1">
            Surveillance et gestion des alertes système en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border ${
              soundEnabled 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
          >
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg border ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            title={autoRefresh ? 'Désactiver l\'auto-refresh' : 'Activer l\'auto-refresh'}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes Actives</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.pending || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critiques</p>
              <p className="text-2xl font-bold text-red-600">{metrics.critical || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Zap className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Résolues (24h)</p>
              <p className="text-2xl font-bold text-green-600">{metrics.alerts24h || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Temps Moyen</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.avgResolutionTime || 0}min</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une alerte..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 w-64"
            />
          </div>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Tous les types</option>
            <option value="SECURITY">🔒 Sécurité</option>
            <option value="SYSTEM">⚙️ Système</option>
            <option value="BUSINESS">💼 Business</option>
            <option value="INVENTORY">📦 Stock</option>
            <option value="FINANCIAL">💰 Financier</option>
            <option value="CUSTOMER">👤 Client</option>
            <option value="OPERATIONAL">🔧 Opérationnel</option>
            <option value="PERFORMANCE">📊 Performance</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Toutes les priorités</option>
            <option value="critical">🔴 Critique</option>
            <option value="high">🟠 Élevée</option>
            <option value="medium">🟡 Moyenne</option>
            <option value="low">🔵 Faible</option>
          </select>
          
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
              showResolved 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            {showResolved ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Résolues
          </button>
          
          {/* Boutons de test supprimés - utilisation des vraies alertes uniquement */}
        </div>
      </div>

      {/* Alertes actives */}
      {filteredAlerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alertes Actives ({filteredAlerts.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => handleAcknowledge(alert.id)}
                onResolve={(resolution) => handleResolve(alert.id, resolution)}
                onViewDetails={() => setSelectedAlert(alert)}
                showActions={true}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historique des alertes */}
      {filteredHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              Historique des Alertes ({filteredHistory.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredHistory.slice(0, 20).map((alert) => {
              const IconComponent = alertTypeIcons[alert.type] || AlertTriangle;
              
              return (
                <div key={alert.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg opacity-60`} style={{ backgroundColor: alert.color + '20' }}>
                        <IconComponent className="h-4 w-4" style={{ color: alert.color }} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-700">{alert.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border opacity-60 ${
                            priorityColors[alert.priority]
                          }`}>
                            {alert.priority.toUpperCase()}
                          </span>
                          {alert.resolved && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                              RÉSOLUE
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-500 text-sm mb-2">{alert.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          {alert.resolvedAt && (
                            <span>
                              Résolue: {new Date(alert.resolvedAt).toLocaleString()}
                            </span>
                          )}
                          {alert.metrics?.resolutionTime && (
                            <span>
                              Temps: {Math.round(alert.metrics.resolutionTime / 1000 / 60)}min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de détails/résolution */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Détails de l'Alerte</h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedAlert.title}</h3>
                <p className="text-gray-600">{selectedAlert.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900">{selectedAlert.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priorité</label>
                  <p className="text-gray-900">{selectedAlert.priority}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Créée le</label>
                  <p className="text-gray-900">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-gray-900">
                    {selectedAlert.acknowledged ? 'Acquittée' : 'En attente'}
                  </p>
                </div>
              </div>
              
              {selectedAlert.data && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Données</label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedAlert.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAlert.actions && selectedAlert.actions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actions Exécutées</label>
                  <div className="space-y-2">
                    {selectedAlert.actions.map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{action.type}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          action.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {action.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!selectedAlert.resolved && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Résoudre l'Alerte</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(selectedAlert.id, 'Résolu automatiquement')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Marquer comme Résolue
                    </button>
                    <button
                      onClick={() => handleResolve(selectedAlert.id, 'Fausse alerte')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Fausse Alerte
                    </button>
                    <button
                      onClick={() => handleResolve(selectedAlert.id, 'Nécessite investigation')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Investigation Requise
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message si aucune alerte */}
      {filteredAlerts.length === 0 && filteredHistory.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte</h3>
          <p className="text-gray-600">Tous les systèmes fonctionnent normalement.</p>
        </div>
      )}
    </div>
  );
};

export default RealTimeAlertDashboard;