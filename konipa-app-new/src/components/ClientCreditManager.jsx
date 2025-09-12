import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Plus,
  Download,
  Filter,
  Search,
  Eye,
  History,
  DollarSign,
  Percent,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  X
} from 'lucide-react';
import ClientCreditService from '../services/clientCreditService';
import DocumentService from '../services/DocumentService';
import { formatMAD } from '../utils/currency';
import { userService } from '../services/userService';

const ClientCreditManager = ({ userRole = 'accountant' }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [globalStats, setGlobalStats] = useState({});
  const [filters, setFilters] = useState({
    searchTerm: '',
    riskLevel: '',
    status: '',
    utilizationMin: '',
    utilizationMax: ''
  });
  const [existingClients, setExistingClients] = useState([]);
  const [selectedExistingClient, setSelectedExistingClient] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: '',
    paymentTerms: '30 jours',
    notes: ''
  });
  const [editLimit, setEditLimit] = useState({
    newLimit: '',
    reason: '',
    approvedBy: userRole === 'ceo' ? 'CEO' : 'Comptabilité'
  });
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filterClients = async () => {
      await applyFilters();
    };
    filterClients();
  }, [clients, filters]);

  const loadData = async () => {
    try {
      const clientsData = ClientCreditService.getAllClients();
      const statsData = ClientCreditService.getGlobalStats();
      
      // Charger les clients existants depuis l'API (clients uniquement)
      const allUsers = await userService.getAllUsers();
      const existingClientsData = Array.isArray(allUsers) ? allUsers
        .filter(user => user.role === 'client')
        .map(user => ({
          id: user.id,
          name: user.company || `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone || '',
          address: user.address || ''
        })) : [];
      
      setClients(clientsData);
      setGlobalStats(statsData);
      setExistingClients(existingClientsData);
    } catch (error) {
      // Fallback en cas d'erreur
      const clientsData = ClientCreditService.getAllClients();
      const statsData = ClientCreditService.getGlobalStats();
      setClients(clientsData);
      setGlobalStats(statsData);
      setExistingClients([]);
    }
  };

  const applyFilters = async () => {
    try {
      const filtered = await ClientCreditService.filterClients(filters);
      setFilteredClients(Array.isArray(filtered) ? filtered : []);
    } catch (error) {
      setFilteredClients([]);
    }
  };

  const handleSelectExistingClient = (clientId) => {
    if (clientId) {
      const client = existingClients.find(c => c.id === parseInt(clientId));
      if (client) {
        setNewClient({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          creditLimit: '',
          paymentTerms: '30 jours',
          notes: ''
        });
        setSelectedExistingClient(clientId);
      }
    } else {
      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        creditLimit: '',
        paymentTerms: '30 jours',
        notes: ''
      });
      setSelectedExistingClient('');
    }
  };

  const handleAddClient = () => {
    try {
      const clientData = {
        ...newClient,
        creditLimit: parseFloat(newClient.creditLimit),
        approvedBy: userRole === 'admin' ? 'Admin' : 'Comptabilité',
        approverName: userRole === 'admin' ? 'Hassan Alami' : 'Fatima Benali'
      };
      
      ClientCreditService.addClient(clientData);
      loadData();
      setShowAddForm(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        creditLimit: '',
        paymentTerms: '30 jours',
        notes: ''
      });
      alert('Client ajouté avec succès!');
    } catch (error) {
      alert('Erreur lors de l\'ajout du client: ' + error.message);
    }
  };

  const handleUpdateLimit = () => {
    try {
      const approverName = userRole === 'admin' ? 'Hassan Alami' : 'Fatima Benali';
      ClientCreditService.updateCreditLimit(
        selectedClient.id,
        parseFloat(editLimit.newLimit),
        editLimit.reason,
        editLimit.approvedBy,
        approverName
      );
      loadData();
      setShowEditForm(false);
      setEditLimit({ newLimit: '', reason: '', approvedBy: userRole === 'admin' ? 'Admin' : 'Comptabilité' });
      alert('Limite de crédit mise à jour avec succès!');
    } catch (error) {
      alert('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  const handleDeleteClient = (client) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.name}?`)) {
      try {
        ClientCreditService.deleteClient(client.id);
        loadData();
        alert('Client supprimé avec succès!');
      } catch (error) {
        alert('Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleDownloadReport = async (format = 'csv') => {
    try {
      if (format === 'pdf') {
        // Générer un rapport PDF avec DocumentService
        const reportData = {
          clients: filteredClients,
          stats: globalStats,
          filters: filters,
          generatedAt: new Date().toISOString()
        };
        await DocumentService.generateCreditLimitsReport(reportData);
      } else {
        // Utiliser l'exportation CSV existante
        await ClientCreditService.downloadCreditReport(filters);
      }
    } catch (error) {
      alert('Erreur lors de l\'exportation du rapport. Veuillez réessayer.');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUtilizationColor = (rate) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="text-blue-600" />
              Gestion des Limites de Crédit Client
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les limites de chiffre d'affaires pour chaque client
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nouveau Client
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download size={20} />
                Exporter
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleDownloadReport('csv');
                        setShowExportMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="inline mr-2" size={16} />
                      Exporter en CSV
                    </button>
                    <button
                      onClick={() => {
                        handleDownloadReport('pdf');
                        setShowExportMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="inline mr-2" size={16} />
                      Exporter en PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Limite Totale</p>
                <p className="text-2xl font-bold text-gray-900">{formatMAD(globalStats.totalCreditLimit)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crédit Utilisé</p>
                <p className="text-2xl font-bold text-gray-900">{formatMAD(globalStats.totalUsedCredit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crédit Disponible</p>
                <p className="text-2xl font-bold text-gray-900">{formatMAD(globalStats.totalAvailableCredit)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisation Moy.</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats.averageUtilization}%</p>
              </div>
              <Percent className="h-8 w-8 text-purple-600" />
            </div>
          </motion.div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="text-gray-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les risques</option>
              <option value="low">Risque faible</option>
              <option value="medium">Risque moyen</option>
              <option value="high">Risque élevé</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="warning">Attention</option>
              <option value="suspended">Suspendu</option>
            </select>
            <input
              type="number"
              placeholder="Utilisation min %"
              value={filters.utilizationMin}
              onChange={(e) => setFilters({ ...filters, utilizationMin: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Utilisation max %"
              value={filters.utilizationMax}
              onChange={(e) => setFilters({ ...filters, utilizationMax: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risque</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client, index) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMAD(client.creditLimit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMAD(client.currentAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMAD(client.availableCredit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${getUtilizationColor(client.utilizationRate)}`}
                          style={{ width: `${Math.min(client.utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{client.utilizationRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(client.riskLevel)}`}>
                      {client.riskLevel === 'low' && 'Faible'}
                      {client.riskLevel === 'medium' && 'Moyen'}
                      {client.riskLevel === 'high' && 'Élevé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status === 'active' && 'Actif'}
                      {client.status === 'warning' && 'Attention'}
                      {client.status === 'suspended' && 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowClientDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setEditLimit({ ...editLimit, newLimit: client.creditLimit });
                          setShowEditForm(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier limite"
                      >
                        <Edit3 size={16} />
                      </button>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <XCircle size={16} />
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

      {/* Modal d'ajout de client */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Nouveau Client</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Sélection client existant */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un client existant (optionnel)
                </label>
                <select
                  value={selectedExistingClient}
                  onChange={(e) => handleSelectExistingClient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Nouveau client --</option>
                  {existingClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@entreprise.ma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+212 5XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Limite de crédit (DH)</label>
                  <input
                    type="number"
                    value={newClient.creditLimit}
                    onChange={(e) => setNewClient({ ...newClient, creditLimit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adresse complète"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conditions de paiement</label>
                  <select
                    value={newClient.paymentTerms}
                    onChange={(e) => setNewClient({ ...newClient, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="15 jours">15 jours</option>
                    <option value="30 jours">30 jours</option>
                    <option value="45 jours">45 jours</option>
                    <option value="60 jours">60 jours</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Notes sur le client..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Ajouter Client
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de modification de limite */}
      <AnimatePresence>
        {showEditForm && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Modifier Limite de Crédit</h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Client: <span className="font-medium">{selectedClient.name}</span></p>
                <p className="text-sm text-gray-600">Limite actuelle: <span className="font-medium">{formatMAD(selectedClient.creditLimit)}</span></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nouvelle limite (DH)</label>
                  <input
                    type="number"
                    value={editLimit.newLimit}
                    onChange={(e) => setEditLimit({ ...editLimit, newLimit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nouvelle limite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Raison de la modification</label>
                  <textarea
                    value={editLimit.reason}
                    onChange={(e) => setEditLimit({ ...editLimit, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Expliquez la raison de cette modification..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateLimit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Mettre à jour
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de détails client */}
      <AnimatePresence>
        {showClientDetails && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails du Client</h2>
                <button
                  onClick={() => setShowClientDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations générales */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="text-blue-600" size={20} />
                    Informations Générales
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Nom:</span>
                      <span className="text-gray-900">{selectedClient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="text-gray-500" size={16} />
                      <span className="text-gray-900">{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="text-gray-500" size={16} />
                      <span className="text-gray-900">{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="text-gray-500 mt-1" size={16} />
                      <span className="text-gray-900">{selectedClient.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-500" size={16} />
                      <span className="text-gray-900">Conditions: {selectedClient.paymentTerms}</span>
                    </div>
                  </div>
                </div>

                {/* Informations financières */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="text-green-600" size={20} />
                    Informations Financières
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Limite de crédit:</span>
                      <span className="text-gray-900 font-semibold">{formatMAD(selectedClient.creditLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Montant utilisé:</span>
                      <span className="text-gray-900">{formatMAD(selectedClient.currentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Crédit disponible:</span>
                      <span className="text-green-600 font-semibold">{formatMAD(selectedClient.availableCredit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Taux d'utilisation:</span>
                      <span className={`font-semibold ${
                        selectedClient.utilizationRate >= 90 ? 'text-red-600' :
                        selectedClient.utilizationRate >= 70 ? 'text-yellow-600' : 'text-green-600'
                      }`}>{selectedClient.utilizationRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Niveau de risque:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getRiskColor(selectedClient.riskLevel)
                      }`}>
                        {selectedClient.riskLevel === 'low' && 'Faible'}
                        {selectedClient.riskLevel === 'medium' && 'Moyen'}
                        {selectedClient.riskLevel === 'high' && 'Élevé'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historique des paiements */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="text-purple-600" size={20} />
                    Historique des Paiements
                  </h3>
                  <div className="space-y-2">
                    {selectedClient.paymentHistory.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <span className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status === 'paid' ? 'Payé' : 'En attente'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatMAD(payment.amount)}</div>
                          {payment.daysLate > 0 && (
                            <div className="text-xs text-red-600">+{payment.daysLate} jours</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historique des limites */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="text-orange-600" size={20} />
                    Historique des Limites
                  </h3>
                  <div className="space-y-2">
                    {selectedClient.creditHistory.map((entry, index) => (
                      <div key={index} className="py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{formatMAD(entry.limit)}</div>
                            <div className="text-xs text-gray-600">{new Date(entry.date).toLocaleDateString('fr-FR')}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-700">{entry.approvedBy}</div>
                            <div className="text-xs text-gray-500">{entry.approver}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{entry.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedClient.notes && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="text-blue-600" size={20} />
                    Notes
                  </h3>
                  <p className="text-gray-700">{selectedClient.notes}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowClientDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientCreditManager;