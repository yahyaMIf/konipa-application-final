import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldX,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import userService from '../services/userService';
import { useRealTimeUsers } from '../hooks/useRealTimeSync';

const UserManagement = () => {
  const { user, hasPermission } = useAuth();
  const { users: realtimeUsers, loading: realtimeLoading, isConnected, userEvents } = useRealTimeUsers();
  
  // Logs de débogage
  useEffect(() => {
    console.log('[UserManagement] État temps réel:', {
      realtimeUsers: realtimeUsers?.length || 0,
      realtimeLoading,
      isConnected,
      userEvents: userEvents?.length || 0
    });
  }, [realtimeUsers, realtimeLoading, isConnected, userEvents]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);

  // Charger les utilisateurs depuis l'API
  const loadUsers = async () => {
    if (!mountedRef.current) return;
    
    // Utiliser les données temps réel si disponibles
    if (realtimeUsers && realtimeUsers.length > 0) {
      setUsers(realtimeUsers);
      loadedRef.current = true;
      return;
    }
    
    // Fallback vers l'API si pas de données temps réel
    try {
      setIsLoading(true);
      
      // Synchroniser le token avec le service d'authentification
      if (user?.token) {
        authService.syncToken(user.token);
      }
      
      const result = await userService.getUsers();
      
      if (mountedRef.current) {
        if (result && result.users) {
          setUsers(result.users);
          loadedRef.current = true;
        } else {
          // Si pas de format {users: []}, essayer de récupérer directement
          const users = await userService.getAllUsers();
          setUsers(users || []);
          loadedRef.current = true;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // En cas d'erreur, garder un tableau vide
      if (mountedRef.current) {
        setUsers([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    loadUsers();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Synchroniser avec les données temps réel
  useEffect(() => {
    if (realtimeUsers && realtimeUsers.length > 0) {
      setUsers(realtimeUsers);
      loadedRef.current = true;
    }
  }, [realtimeUsers]);
  
  // Demander une synchronisation des utilisateurs au montage
  useEffect(() => {
    if (isConnected && syncUsers) {
      syncUsers();
    }
  }, [isConnected, syncUsers]);

  // Les notifications sont maintenant gérées automatiquement par useRealTimeSync

  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'create', 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client',
    company: '',
    phone: '',
    address: '',
    password: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Fonctions pour gérer les mots de passe
  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Mot de passe copié dans le presse-papiers!');
    } catch (err) {
      alert('Erreur lors de la copie du mot de passe');
    }
  };

  // Vérifier les permissions
  if (!hasPermission('manage_users') && !hasPermission('admin_access')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && u.isActive) ||
                         (filterStatus === 'inactive' && !u.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Basculer le statut d'activation
  const toggleUserStatus = async (userId) => {
    setIsLoading(true);
    try {
      // Trouver l'utilisateur pour connaître son statut actuel
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Appel API pour basculer le statut utilisateur
      await userService.toggleUserStatus(userId, !user.isActive);
      
      // Recharger la liste des utilisateurs depuis le serveur
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        setIsLoading(true);
        await userService.deleteUser(userId);
        
        // Recharger la liste des utilisateurs
        await loadUsers();
      } catch (error) {
        alert('Erreur lors de la suppression de l\'utilisateur');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Ouvrir le modal
  const openModal = (type, userData = null) => {
    setModalType(type);
    setSelectedUser(userData);
    if (type === 'create') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'client',
        company: '',
        phone: '',
        address: '',
        password: '',
        isActive: true
      });
    } else if (type === 'edit' && userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        role: userData.role || 'client',
        company: userData.company || '',
        phone: userData.phone || '',
        address: userData.address || '',
        password: userData.password || '',
        isActive: userData.isActive !== false
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'client',
      company: '',
      phone: '',
      address: '',
      password: '',
      isActive: true
    });
    setFormErrors({});
  };

  // Gérer les changements de formulaire
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Effacer l'erreur pour ce champ
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) errors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) errors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email invalide';
    if (!formData.company.trim()) errors.company = 'L\'entreprise est requise';
    
    // Validation du mot de passe pour la création
    if (modalType === 'create' && !formData.password.trim()) {
      errors.password = 'Le mot de passe est requis pour créer un utilisateur';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    // Vérifier si l'email existe déjà (sauf pour l'édition du même utilisateur)
    const emailExists = users.some(u => 
      u.email === formData.email && 
      (modalType === 'create' || u.id !== selectedUser?.id)
    );
    if (emailExists) errors.email = 'Cet email est déjà utilisé';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sauvegarder l'utilisateur
  const handleSaveUser = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('konipa_access_token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      if (modalType === 'create') {
        await userService.createUser({
          ...formData,
          permissions: getDefaultPermissions(formData.role)
        });
      } else if (modalType === 'edit') {
        await userService.updateUser(selectedUser.id, {
          ...formData,
          permissions: getDefaultPermissions(formData.role)
        });
      }

      // Recharger la liste des utilisateurs
      await loadUsers();
      closeModal();
    } catch (error) {
      alert('Erreur lors de la sauvegarde de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir les permissions par défaut selon le rôle
  const getDefaultPermissions = (role) => {
    const permissions = {
      admin: ['admin_access', 'manage_users', 'manage_products', 'view_reports', 'manage_orders'],
      ceo: ['admin_access', 'view_reports', 'manage_orders'],
      commercial: ['view_products', 'manage_orders', 'view_clients'],
      compta: ['view_reports', 'manage_accounting'],
      client: ['view_products', 'place_orders'],
      pos: ['manage_pos', 'view_products'],
      counter: ['manage_counter', 'view_products']
    };
    return permissions[role] || ['view_products'];
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      ceo: 'bg-purple-100 text-purple-800',
      commercial: 'bg-blue-100 text-blue-800',
      compta: 'bg-green-100 text-green-800',
      accounting: 'bg-green-100 text-green-800',
      client: 'bg-muted text-muted-foreground',
      pos: 'bg-yellow-100 text-yellow-800',
      counter: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrateur',
      ceo: 'Directeur Général',
      commercial: 'Commercial',
      compta: 'Comptable',
      accounting: 'Comptabilité',
      client: 'Client',
      pos: 'Point de Vente',
      counter: 'Comptoir'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Users className="h-8 w-8 mr-3 text-blue-600" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérez les comptes utilisateurs, leurs rôles et permissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Indicateur de statut de synchronisation */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Synchronisé' : 'Hors ligne'}
                </span>
              </div>
              
              <motion.button
                 onClick={() => openModal('create')}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                 disabled={isLoading}
               >
                 <Plus className="h-5 w-5" />
                 <span>Nouvel Utilisateur</span>
               </motion.button>
             </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtre par rôle */}
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateur</option>

                <option value="commercial">Commercial</option>
                <option value="compta">Comptable</option>
                <option value="client">Client</option>
                <option value="pos">Point de Vente</option>
              </select>
            </div>

            {/* Filtre par statut */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            {/* Statistiques */}
            <div className="flex items-center justify-center bg-muted rounded-lg p-2">
              <span className="text-sm text-gray-600">
                {filteredUsers.length} utilisateur(s) trouvé(s)
              </span>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mot de passe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredUsers.map((userData) => (
                  <motion.tr
                    key={userData.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {userData.firstName} {userData.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userData.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userData.role)}`}>
                        {getRoleLabel(userData.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {userData.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono">
                          {visiblePasswords[userData.id] ? (userData.password || 'Non défini') : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(userData.id)}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded"
                          title={visiblePasswords[userData.id] ? 'Masquer' : 'Afficher'}
                        >
                          {visiblePasswords[userData.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {userData.password && (
                          <button
                            onClick={() => copyToClipboard(userData.password)}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded"
                            title="Copier le mot de passe"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userData.isActive ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-sm text-green-600 font-medium">Actif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-sm text-red-600 font-medium">Inactif</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal('view', userData)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', userData)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(userData.id)}
                          disabled={isLoading}
                          className={`p-1 rounded transition-colors ${
                            isLoading 
                              ? 'text-gray-400 cursor-not-allowed'
                              : userData.isActive 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                          }`}
                          title={isLoading ? 'Synchronisation...' : (userData.isActive ? 'Désactiver' : 'Activer')}
                        >
                          {isLoading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                          ) : (
                            userData.isActive ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>
                        {userData.id !== user.id && (
                          <button
                            onClick={() => deleteUser(userData.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">
                  {modalType === 'view' && 'Détails de l\'utilisateur'}
                  {modalType === 'edit' && 'Modifier l\'utilisateur'}
                  {modalType === 'create' && 'Nouvel utilisateur'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Formulaire de visualisation */}
              {selectedUser && modalType === 'view' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <p className="text-sm text-foreground">{selectedUser.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <p className="text-sm text-foreground">{selectedUser.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-sm text-foreground">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entreprise
                      </label>
                      <p className="text-sm text-foreground">{selectedUser.company}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut
                      </label>
                      <div className="flex items-center">
                        {selectedUser.isActive ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">Actif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-red-600">Inactif</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedUser.permissions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Permissions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formulaire de création/modification */}
              {(modalType === 'create' || modalType === 'edit') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Entrez le prénom"
                      />
                      {formErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Entrez le nom"
                      />
                      {formErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Entrez l'email"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle *
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="client">Client</option>
                        <option value="commercial">Commercial</option>
                        <option value="compta">Comptable</option>
                        <option value="pos">Point de Vente</option>
                        <option value="counter">Comptoir</option>
                        <option value="admin">Administrateur</option>
      
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entreprise *
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.company ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Entrez l'entreprise"
                      />
                      {formErrors.company && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.company}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Entrez le téléphone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe {modalType === 'create' ? '*' : ''}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={modalType === 'create' ? 'Entrez le mot de passe' : 'Laisser vide pour ne pas modifier'}
                      />
                      {formErrors.password && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Entrez l'adresse"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Compte actif
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {modalType === 'view' ? 'Fermer' : 'Annuler'}
                </button>
                
                {modalType === 'view' && selectedUser && (
                  <button
                    onClick={() => toggleUserStatus(selectedUser.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedUser.isActive
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedUser.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                )}
                
                {(modalType === 'create' || modalType === 'edit') && (
                  <button
                    onClick={handleSaveUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {modalType === 'create' ? 'Créer' : 'Modifier'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;