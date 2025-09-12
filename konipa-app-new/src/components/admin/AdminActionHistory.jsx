import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Filter,
  Download,
  Search,
  Calendar,
  User,
  Shield,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertCircle
} from 'lucide-react';
import databaseService from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';

const AdminActionHistory = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState([]);
  const [filteredActions, setFilteredActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: '',
    adminId: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadActions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [actions, filters]);

  const loadActions = async () => {
    try {
      setLoading(true);
      const allActions = databaseService.getAdminActions();
      setActions(allActions);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...actions];

    // Filtre par type d'action
    if (filters.actionType) {
      filtered = filtered.filter(action => action.actionType === filters.actionType);
    }

    // Filtre par administrateur
    if (filters.adminId) {
      filtered = filtered.filter(action => action.adminId === filters.adminId);
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(action => 
        new Date(action.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999); // Inclure toute la journée
      filtered = filtered.filter(action => 
        new Date(action.timestamp) <= dateTo
      );
    }

    // Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(action => 
        action.description?.toLowerCase().includes(searchLower) ||
        action.adminName?.toLowerCase().includes(searchLower) ||
        action.targetUserName?.toLowerCase().includes(searchLower) ||
        action.targetUserEmail?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredActions(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      actionType: '',
      adminId: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  const exportData = () => {
    const dataToExport = {
      actions: filteredActions,
      exportDate: new Date().toISOString(),
      exportedBy: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu',
      filters: filters
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-actions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getActionTypeIcon = (actionType) => {
    switch (actionType) {
      case 'user_activated':
      case 'user_unblocked':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'user_deactivated':
      case 'user_blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'role_changed':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionTypeLabel = (actionType) => {
    switch (actionType) {
      case 'user_activated':
        return 'Utilisateur activé';
      case 'user_deactivated':
        return 'Utilisateur désactivé';
      case 'user_blocked':
        return 'Utilisateur bloqué';
      case 'user_unblocked':
        return 'Utilisateur débloqué';
      case 'role_changed':
        return 'Rôle modifié';
      default:
        return actionType;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const uniqueActionTypes = [...new Set(actions.map(action => action.actionType))];
  const uniqueAdmins = [...new Set(actions.map(action => ({ id: action.adminId, name: action.adminName })))]
    .filter((admin, index, self) => 
      index === self.findIndex(a => a.id === admin.id)
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Historique des Actions</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 p-4 rounded-lg space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type d'action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'action
              </label>
              <select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les types</option>
                {uniqueActionTypes.map(type => (
                  <option key={type} value={type}>
                    {getActionTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Administrateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Administrateur
              </label>
              <select
                value={filters.adminId}
                onChange={(e) => handleFilterChange('adminId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les administrateurs</option>
                {uniqueAdmins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Effacer les filtres
            </button>
          </div>
        </motion.div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total des actions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredActions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredActions.filter(action => 
                  new Date(action.timestamp).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Administrateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueAdmins.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune action trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Administrateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur cible
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
                {filteredActions.map((action) => (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getActionTypeIcon(action.actionType)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getActionTypeLabel(action.actionType)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {action.adminName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {action.adminRole}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {action.targetUserName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {action.targetUserEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(action.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedAction(action);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetails && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de l'action
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID de l'action</label>
                  <p className="text-sm text-gray-900">{selectedAction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type d'action</label>
                  <p className="text-sm text-gray-900">{getActionTypeLabel(selectedAction.actionType)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Administrateur</label>
                  <p className="text-sm text-gray-900">{selectedAction.adminName} ({selectedAction.adminRole})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date et heure</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedAction.timestamp)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Utilisateur cible</label>
                  <p className="text-sm text-gray-900">{selectedAction.targetUserName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email cible</label>
                  <p className="text-sm text-gray-900">{selectedAction.targetUserEmail}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedAction.description}</p>
              </div>
              
              {selectedAction.previousState && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">État précédent</label>
                  <pre className="text-sm text-gray-900 bg-gray-100 p-2 rounded">
                    {JSON.stringify(selectedAction.previousState, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAction.newState && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nouvel état</label>
                  <pre className="text-sm text-gray-900 bg-gray-100 p-2 rounded">
                    {JSON.stringify(selectedAction.newState, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse IP</label>
                  <p className="text-sm text-gray-900">{selectedAction.ipAddress}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Agent</label>
                  <p className="text-sm text-gray-900 truncate" title={selectedAction.userAgent}>
                    {selectedAction.userAgent}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminActionHistory;