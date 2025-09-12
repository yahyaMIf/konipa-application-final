import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, Activity, Download, Filter, Search, Eye, TrendingUp, AlertCircle, RefreshCw, Bell, Pause, Play, Settings } from 'lucide-react';
import ceoJournalService from '../services/ceoJournalService';

const CEOJournal = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dailySummary, setDailySummary] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, all
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // secondes
  const intervalRef = useRef(null);
  const previousActivitiesCount = useRef(0);

  // Types d'activités avec leurs couleurs et icônes
  const activityTypes = {
    accounting: { label: 'Comptabilité', color: 'bg-blue-100 text-blue-800', icon: '💼' },
    order_validation: { label: 'Validation Commandes', color: 'bg-green-100 text-green-800', icon: '✅' },
    threshold_update: { label: 'Seuils CA', color: 'bg-purple-100 text-purple-800', icon: '📊' },
    unpaid_invoice: { label: 'Factures Impayées', color: 'bg-red-100 text-red-800', icon: '💸' },
    sage_sync: { label: 'Synchronisation Sage', color: 'bg-yellow-100 text-yellow-800', icon: '🔄' },
    user_activity: { label: 'Activité Utilisateur', color: 'bg-indigo-100 text-indigo-800', icon: '👤' },
    system_error: { label: 'Erreur Système', color: 'bg-red-100 text-red-800', icon: '⚠️' }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, viewMode]);

  useEffect(() => {
    filterActivities();
  }, [activities, selectedType, searchTerm]);

  // Charger les données depuis l'API au montage du composant
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        await ceoJournalService.loadActivities();
        loadData();
        previousActivitiesCount.current = ceoJournalService.getAllActivities().length;
      } catch (error) {
        } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Gestion du temps réel
  useEffect(() => {
    if (isRealTimeEnabled) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return () => stopRealTimeUpdates();
  }, [isRealTimeEnabled, autoRefreshInterval]);

  // Détecter les nouvelles activités
  useEffect(() => {
    const currentCount = activities.length;
    if (currentCount > previousActivitiesCount.current) {
      setNewActivitiesCount(currentCount - previousActivitiesCount.current);
      // Réinitialiser le compteur après 5 secondes
      setTimeout(() => setNewActivitiesCount(0), 5000);
    }
    previousActivitiesCount.current = currentCount;
  }, [activities]);

  const loadData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    
    try {
      let loadedActivities = [];
      
      switch (viewMode) {
        case 'daily':
          loadedActivities = await ceoJournalService.getActivitiesByDate(selectedDate);
          const dailySummaryData = await ceoJournalService.getDailySummary(selectedDate);
          setDailySummary(dailySummaryData);
          break;
        case 'weekly':
          const weekStart = new Date(selectedDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const allActivities = await ceoJournalService.getAllActivities();
          loadedActivities = (allActivities || []).filter(activity => {
            const activityDate = new Date(activity.date);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return activityDate >= weekStart && activityDate <= weekEnd;
          });
          break;
        case 'all':
          loadedActivities = await ceoJournalService.getAllActivities();
          break;
        default:
          loadedActivities = await ceoJournalService.getActivitiesByDate(selectedDate);
      }
      
      setActivities(Array.isArray(loadedActivities) ? loadedActivities : []);
      const stats = await ceoJournalService.getStatistics();
      setStatistics(stats);
      setLastUpdate(new Date());
    } catch (error) {
      setActivities([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    stopRealTimeUpdates(); // Nettoyer l'ancien interval
    intervalRef.current = setInterval(async () => {
      try {
        await ceoJournalService.loadActivities();
        loadData();
      } catch (error) {
        }
    }, autoRefreshInterval * 1000);
  };

  const stopRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleManualRefresh = async () => {
    try {
      setIsLoading(true);
      await ceoJournalService.loadActivities();
      loadData();
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  };

  const filterActivities = () => {
    let filtered = Array.isArray(activities) ? activities : [];

    if (selectedType !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user && activity.user.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  const exportData = () => {
    const csv = ceoJournalService.exportToCSV(selectedDate, selectedDate);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-ceo-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityTypeInfo = (type) => {
    return activityTypes[type] || { label: type, color: 'bg-gray-100 text-gray-800', icon: '📝' };
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal CEO</h1>
            <p className="text-gray-600">Suivi des activités quotidiennes de l'entreprise</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Indicateur de nouvelles activités */}
            {newActivitiesCount > 0 && (
              <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                <Bell className="h-4 w-4 mr-1" />
                {newActivitiesCount} nouvelle{newActivitiesCount > 1 ? 's' : ''} activité{newActivitiesCount > 1 ? 's' : ''}
              </div>
            )}
            
            {/* Statut temps réel */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isRealTimeEnabled ? 'Temps réel actif' : 'Temps réel désactivé'}
              </span>
            </div>
            
            {/* Dernière mise à jour */}
            <div className="text-sm text-gray-500">
              Dernière MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Activités (7j)</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalActivities}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Moyenne/Jour</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.averagePerDay}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Jour le plus actif</p>
                <p className="text-lg font-semibold text-gray-900">
                  {statistics.mostActiveDay ? 
                    `${new Date(statistics.mostActiveDay.date).toLocaleDateString('fr-FR')} (${statistics.mostActiveDay.count})` : 
                    'Aucun'
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Type le plus fréquent</p>
                <p className="text-lg font-semibold text-gray-900">
                  {statistics.mostActiveType ? 
                    `${getActivityTypeInfo(statistics.mostActiveType.type).label} (${statistics.mostActiveType.count})` : 
                    'Aucun'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Mode d'affichage */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Tout
            </button>
          </div>

          {/* Sélecteur de date */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtre par type */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              {Object.entries(activityTypes || {}).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Recherche */}
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Contrôles temps réel */}
          <div className="flex items-center space-x-2 border-l pl-4">
            <button
              onClick={toggleRealTime}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                isRealTimeEnabled 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isRealTimeEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isRealTimeEnabled ? 'Pause' : 'Activer'}</span>
            </button>
            
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
            
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1min</option>
              <option value={300}>5min</option>
            </select>
          </div>

          {/* Export */}
          <button
            onClick={exportData}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Résumé quotidien */}
      {viewMode === 'daily' && dailySummary && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Résumé du {new Date(selectedDate).toLocaleDateString('fr-FR')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{dailySummary.totalActivities}</p>
              <p className="text-sm text-gray-500">Activités totales</p>
            </div>
            {Object.entries(dailySummary?.byType || {}).map(([type, count]) => {
              const typeInfo = getActivityTypeInfo(type);
              return (
                <div key={type} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500">{typeInfo.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des activités */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Activités ({filteredActivities.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune activité trouvée pour les critères sélectionnés</p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const typeInfo = getActivityTypeInfo(activity.type);
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                        {typeInfo.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(activity.timestamp)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          {activity.user}
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{activity.description}</p>
                      {Object.keys(activity.details).length > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <strong>Détails:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CEOJournal;