import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Filter,
  Download,
  Search,
  Calendar,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
  Eye,
  LogIn,
  LogOut,
  MapPin
} from 'lucide-react';
import databaseService from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';

const UserSessionHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    sessionType: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    ipAddress: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filters]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const allSessions = databaseService.getUserSessions();
      setSessions(allSessions);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Filtre par utilisateur
    if (filters.userId) {
      filtered = filtered.filter(session => session.userId === filters.userId);
    }

    // Filtre par type de session
    if (filters.sessionType) {
      filtered = filtered.filter(session => session.sessionType === filters.sessionType);
    }

    // Filtre par adresse IP
    if (filters.ipAddress) {
      filtered = filtered.filter(session => 
        session.ipAddress?.includes(filters.ipAddress)
      );
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(session => 
        new Date(session.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(session => 
        new Date(session.timestamp) <= dateTo
      );
    }

    // Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(session => 
        session.userName?.toLowerCase().includes(searchLower) ||
        session.userEmail?.toLowerCase().includes(searchLower) ||
        session.ipAddress?.toLowerCase().includes(searchLower) ||
        session.userAgent?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredSessions(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      sessionType: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      ipAddress: ''
    });
  };

  const exportData = () => {
    const dataToExport = {
      sessions: filteredSessions,
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
    a.download = `user-sessions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSessionTypeIcon = (sessionType) => {
    switch (sessionType) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-red-500" />;
      case 'auto_logout':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSessionTypeLabel = (sessionType) => {
    switch (sessionType) {
      case 'login':
        return 'Connexion';
      case 'logout':
        return 'Déconnexion';
      case 'auto_logout':
        return 'Déconnexion automatique';
      default:
        return sessionType;
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor className="h-4 w-4 text-gray-500" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4 text-blue-500" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-4 w-4 text-purple-500" />;
    }
    return <Monitor className="h-4 w-4 text-gray-500" />;
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return 'Inconnu';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablette';
    }
    return 'Ordinateur';
  };

  const getBrowser = (userAgent) => {
    if (!userAgent) return 'Inconnu';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Autre';
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

  const uniqueUsers = sessions.map(session => ({ id: session.userId, name: session.userName, email: session.userEmail }))
    .filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
  
  const uniqueSessionTypes = [...new Set(sessions.map(session => session.sessionType))];
  const uniqueIPs = [...new Set(sessions.map(session => session.ipAddress).filter(Boolean))];

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
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Historique des Sessions</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Utilisateur
              </label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les utilisateurs</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Type de session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de session
              </label>
              <select
                value={filters.sessionType}
                onChange={(e) => handleFilterChange('sessionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les types</option>
                {uniqueSessionTypes.map(type => (
                  <option key={type} value={type}>
                    {getSessionTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Adresse IP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse IP
              </label>
              <select
                value={filters.ipAddress}
                onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les adresses IP</option>
                {uniqueIPs.map(ip => (
                  <option key={ip} value={ip}>
                    {ip}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total des sessions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSessions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <LogIn className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Connexions</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredSessions.filter(session => session.sessionType === 'login').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredSessions.filter(session => 
                  new Date(session.timestamp).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Adresses IP uniques</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueIPs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des sessions */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune session trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appareil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
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
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getSessionTypeIcon(session.sessionType)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getSessionTypeLabel(session.sessionType)}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {session.sessionId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session.userName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.userEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(session.userAgent)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getDeviceType(session.userAgent)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getBrowser(session.userAgent)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.ipAddress}
                          </p>
                          <p className="text-sm text-gray-500">
                            {session.loginMethod}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
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
      {showDetails && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de la session
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
                  <label className="block text-sm font-medium text-gray-700">ID de session</label>
                  <p className="text-sm text-gray-900">{selectedSession.sessionId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de session</label>
                  <p className="text-sm text-gray-900">{getSessionTypeLabel(selectedSession.sessionType)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Utilisateur</label>
                  <p className="text-sm text-gray-900">{selectedSession.userName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedSession.userEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rôle</label>
                  <p className="text-sm text-gray-900">{selectedSession.userRole}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date et heure</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedSession.timestamp)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse IP</label>
                  <p className="text-sm text-gray-900">{selectedSession.ipAddress}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Méthode de connexion</label>
                  <p className="text-sm text-gray-900">{selectedSession.loginMethod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type d'appareil</label>
                  <p className="text-sm text-gray-900">{getDeviceType(selectedSession.userAgent)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Navigateur</label>
                  <p className="text-sm text-gray-900">{getBrowser(selectedSession.userAgent)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent complet</label>
                <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded break-all">
                  {selectedSession.userAgent}
                </p>
              </div>
              
              {selectedSession.sessionData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Données de session</label>
                  <pre className="text-sm text-gray-900 bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(selectedSession.sessionData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserSessionHistory;