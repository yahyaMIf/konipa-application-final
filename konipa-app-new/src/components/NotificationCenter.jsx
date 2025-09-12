import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Settings,
  RefreshCw
} from 'lucide-react';
import { notificationService } from '../services/NotificationService';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter = ({ isOpen, onClose, user }) => {
  const { isAuthenticated, isUserActive, user: authUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    category: 'all',
    read: 'all',
    search: ''
  });

  // Fonction pour vérifier si on peut se connecter aux notifications
  const canConnect = () => {
    return isAuthenticated && isUserActive && authUser?.status === 'active';
  };
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (isOpen && canConnect()) {
      loadNotifications();
    } else if (isOpen) {
      setNotifications([]);
    }
  }, [isOpen, isAuthenticated, isUserActive, authUser?.status]);

  const loadNotifications = async () => {
    if (!canConnect() || !authUser) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const userNotifications = await notificationService.getNotifications(authUser);
      setNotifications(Array.isArray(userNotifications) ? userNotifications : []);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const filteredNotifications = notifications
    .filter(notification => {
      if (filters.type !== 'all' && notification.type !== filters.type) return false;
      if (filters.category !== 'all' && notification.category !== filters.category) return false;
      if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
      if (filters.read !== 'all') {
        const isRead = notification.read || false;
        if (filters.read === 'read' && !isRead) return false;
        if (filters.read === 'unread' && isRead) return false;
      }
      if (filters.search &&
        !notification.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !notification.message.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleMarkAsRead = async (notificationIds) => {
    try {
      for (const id of notificationIds) {
        await notificationService.markAsRead(id);
      }
      await loadNotifications();
      setSelectedNotifications([]);
    } catch (error) {
      }
  };

  const handleDeleteNotifications = async (notificationIds) => {
    try {
      for (const id of notificationIds) {
        await notificationService.deleteNotification(id);
      }
      await loadNotifications();
      setSelectedNotifications([]);
    } catch (error) {
      }
  };

  const handleNotificationSelect = (notificationId) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Centre de Notifications</h2>
                  <p className="text-blue-100 text-sm">Gérez toutes vos notifications système</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-blue-100">Total</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-blue-100">Non lues</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{highPriorityCount}</p>
                <p className="text-sm text-blue-100">Priorité haute</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="success">Succès</option>
                <option value="error">Erreur</option>
                <option value="warning">Attention</option>
                <option value="info">Information</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Toutes priorités</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>

              <select
                value={filters.read}
                onChange={(e) => setFilters({...filters, read: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Toutes</option>
                <option value="read">Lues</option>
                <option value="unread">Non lues</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="timestamp">Date</option>
                <option value="priority">Priorité</option>
                <option value="type">Type</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {selectedNotifications.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleMarkAsRead(selectedNotifications)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4" />
                    <span>Marquer comme lu</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNotifications(selectedNotifications)}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
              )}

              <button
                onClick={loadNotifications}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {/* Select All */}
                <div className="px-6 py-3 bg-gray-50 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={handleSelectAll}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-600">
                    {selectedNotifications.length > 0
                      ? `${selectedNotifications.length} sélectionnée${selectedNotifications.length > 1 ? 's' : ''}`
                      : 'Tout sélectionner'
                    }
                  </span>
                </div>

                {/* Notifications */}
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleNotificationSelect(notification.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                getPriorityColor(notification.priority)
                              }`}>
                                {notification.priority === 'high' ? 'Haute' :
                                 notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                notification.type === 'success' ? 'bg-green-100 text-green-800' :
                                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                notification.type === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {notification.type === 'success' ? 'Succès' :
                                 notification.type === 'warning' ? 'Attention' :
                                 notification.type === 'error' ? 'Erreur' : 'Info'}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(notification.timestamp).toLocaleString('fr-FR')}</span>
                              </span>
                              <span>
                                Catégorie: {notification.category || 'Général'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead([notification.id])}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Marquer comme lu
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotifications([notification.id])}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune notification</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search || filters.type !== 'all' || filters.category !== 'all'
                    ? 'Aucune notification ne correspond aux filtres sélectionnés.'
                    : 'Vous n\'avez aucune notification pour le moment.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter;