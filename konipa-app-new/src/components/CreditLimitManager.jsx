import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Users, AlertTriangle, CheckCircle, Edit, Save, X,
  TrendingUp, TrendingDown, Eye, Settings, Bell, Shield,
  CreditCard, BarChart3, Calendar, Filter, Search, Download
} from 'lucide-react';
import DocumentService from '../services/DocumentService';

const CreditLimitManager = ({ userRole, onUpdateLimit, onNotifyUser }) => {
  const [accounts, setAccounts] = useState([
    {
      id: 'ACC001',
      name: 'Compte Ventes',
      user: 'Marie Dubois',
      email: 'marie.dubois@konipa.com',
      department: 'Ventes',
      currentLimit: 50000,
      usedAmount: 35000,
      availableAmount: 15000,
      utilizationRate: 70,
      lastTransaction: '2024-01-15T14:30:00',
      status: 'active',
      riskLevel: 'medium',
      monthlySpending: 42000,
      averageTransaction: 2500,
      transactionCount: 28,
      creditHistory: [
        { date: '2024-01-01', limit: 45000, reason: 'Augmentation annuelle', approvedBy: 'CEO' },
        { date: '2024-01-10', limit: 50000, reason: 'Performance exceptionnelle', approvedBy: 'CEO' }
      ]
    },
    {
      id: 'ACC002',
      name: 'Compte Marketing',
      user: 'Ahmed Benali',
      email: 'ahmed.benali@konipa.com',
      department: 'Marketing',
      currentLimit: 30000,
      usedAmount: 28500,
      availableAmount: 1500,
      utilizationRate: 95,
      lastTransaction: '2024-01-15T16:45:00',
      status: 'warning',
      riskLevel: 'high',
      monthlySpending: 29000,
      averageTransaction: 1800,
      transactionCount: 35,
      creditHistory: [
        { date: '2024-01-01', limit: 25000, reason: 'Limite initiale', approvedBy: 'Comptabilité' },
        { date: '2024-01-05', limit: 30000, reason: 'Campagne spéciale', approvedBy: 'CEO' }
      ]
    },
    {
      id: 'ACC003',
      name: 'Compte Achats',
      user: 'Fatima Zahra',
      email: 'fatima.zahra@konipa.com',
      department: 'Achats',
      currentLimit: 75000,
      usedAmount: 45000,
      availableAmount: 30000,
      utilizationRate: 60,
      lastTransaction: '2024-01-15T11:20:00',
      status: 'active',
      riskLevel: 'low',
      monthlySpending: 52000,
      averageTransaction: 3200,
      transactionCount: 22,
      creditHistory: [
        { date: '2024-01-01', limit: 70000, reason: 'Limite annuelle', approvedBy: 'CEO' },
        { date: '2024-01-12', limit: 75000, reason: 'Commande exceptionnelle', approvedBy: 'CEO' }
      ]
    },
    {
      id: 'ACC004',
      name: 'Compte R&D',
      user: 'Youssef Alami',
      email: 'youssef.alami@konipa.com',
      department: 'R&D',
      currentLimit: 40000,
      usedAmount: 12000,
      availableAmount: 28000,
      utilizationRate: 30,
      lastTransaction: '2024-01-14T09:15:00',
      status: 'active',
      riskLevel: 'low',
      monthlySpending: 15000,
      averageTransaction: 2000,
      transactionCount: 8,
      creditHistory: [
        { date: '2024-01-01', limit: 35000, reason: 'Budget projet', approvedBy: 'CEO' },
        { date: '2024-01-08', limit: 40000, reason: 'Extension projet', approvedBy: 'CEO' }
      ]
    }
  ]);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [reason, setReason] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Vérifier les permissions
  const canEditLimits = userRole === 'admin' || userRole === 'accounting' || userRole === 'accountant';
  const canViewAll = userRole === 'admin' || userRole === 'accounting' || userRole === 'accountant';

  const riskLevelConfig = {
    low: { label: 'Faible', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    high: { label: 'Élevé', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  };

  const statusConfig = {
    active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
    warning: { label: 'Attention', color: 'bg-yellow-100 text-yellow-800' },
    suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-800' }
  };

  const departments = [...new Set(accounts.map(acc => acc.department))];

  const filteredAccounts = accounts.filter(account => {
    const matchesDepartment = filterDepartment === 'all' || account.department === filterDepartment;
    const matchesRisk = filterRisk === 'all' || account.riskLevel === filterRisk;
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDepartment && matchesRisk && matchesSearch;
  });

  const updateCreditLimit = (accountId, newLimitValue, updateReason) => {
    setAccounts(prevAccounts => 
      prevAccounts.map(account => {
        if (account.id === accountId) {
          const updatedAccount = {
            ...account,
            currentLimit: newLimitValue,
            availableAmount: newLimitValue - account.usedAmount,
            utilizationRate: Math.round((account.usedAmount / newLimitValue) * 100),
            creditHistory: [
              ...account.creditHistory,
              {
                date: new Date().toISOString(),
                limit: newLimitValue,
                reason: updateReason,
                approvedBy: userRole === 'admin' ? 'Admin' : 'Comptabilité'
              }
            ]
          };
          
          // Mettre à jour le statut basé sur le taux d'utilisation
          if (updatedAccount.utilizationRate >= 90) {
            updatedAccount.status = 'warning';
            updatedAccount.riskLevel = 'high';
          } else if (updatedAccount.utilizationRate >= 70) {
            updatedAccount.status = 'active';
            updatedAccount.riskLevel = 'medium';
          } else {
            updatedAccount.status = 'active';
            updatedAccount.riskLevel = 'low';
          }
          
          onUpdateLimit?.(updatedAccount);
          onNotifyUser?.(updatedAccount, 'limit_updated');
          
          return updatedAccount;
        }
        return account;
      })
    );
  };

  const handleSaveLimit = () => {
    if (editingAccount && newLimit && reason) {
      updateCreditLimit(editingAccount.id, parseInt(newLimit), reason);
      setEditingAccount(null);
      setNewLimit('');
      setReason('');
    }
  };

  const getTotalStats = () => {
    const totalLimit = accounts.reduce((sum, acc) => sum + acc.currentLimit, 0);
    const totalUsed = accounts.reduce((sum, acc) => sum + acc.usedAmount, 0);
    const totalAvailable = totalLimit - totalUsed;
    const avgUtilization = Math.round((totalUsed / totalLimit) * 100);
    
    return { totalLimit, totalUsed, totalAvailable, avgUtilization };
  };

  const stats = getTotalStats();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportReport = async () => {
    try {
      const reportData = {
        title: 'Rapport des Limites de Crédit',
        generatedAt: new Date().toISOString(),
        generatedBy: userRole,
        totalStats: stats,
        accounts: filteredAccounts.map(acc => ({
          ...acc,
          creditHistory: acc.creditHistory
        }))
      };
      
      await DocumentService.generateCreditLimitsReport(reportData);
    } catch (error) {
      // Fallback vers l'export JSON en cas d'erreur
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit_limits_report_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  };

  if (!canViewAll) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Accès Restreint</h3>
        <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques globales */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Limites de Crédit</h2>
          <div className="flex space-x-3">
            <button
              onClick={exportReport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Limite Totale</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalLimit.toLocaleString()} DH
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Montant Utilisé</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.totalUsed.toLocaleString()} DH
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Disponible</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.totalAvailable.toLocaleString()} DH
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Utilisation Moy.</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.avgUtilization}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </motion.div>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, utilisateur ou département..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les départements</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les niveaux de risque</option>
            <option value="low">Risque faible</option>
            <option value="medium">Risque moyen</option>
            <option value="high">Risque élevé</option>
          </select>
        </div>
      </div>

      {/* Liste des comptes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disponible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredAccounts.map((account, index) => {
                  const RiskIcon = riskLevelConfig[account.riskLevel].icon;
                  return (
                    <motion.tr
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{account.name}</div>
                          <div className="text-sm text-gray-500">{account.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{account.user}</div>
                          <div className="text-sm text-gray-500">{account.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.currentLimit.toLocaleString()} DH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.usedAmount.toLocaleString()} DH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.availableAmount.toLocaleString()} DH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                account.utilizationRate >= 90 ? 'bg-red-600' :
                                account.utilizationRate >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(account.utilizationRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{account.utilizationRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          riskLevelConfig[account.riskLevel].color
                        }`}>
                          <RiskIcon className="h-3 w-3 mr-1" />
                          {riskLevelConfig[account.riskLevel].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusConfig[account.status].color
                        }`}>
                          {statusConfig[account.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedAccount(account)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEditLimits && (
                            <button
                              onClick={() => {
                                setEditingAccount(account);
                                setNewLimit(account.currentLimit.toString());
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Modifier limite"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de modification de limite */}
      <AnimatePresence>
        {editingAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setEditingAccount(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Modifier la limite de crédit
                  </h3>
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compte: {editingAccount.name}
                    </label>
                    <p className="text-sm text-gray-500">Utilisateur: {editingAccount.user}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite actuelle: {editingAccount.currentLimit.toLocaleString()} DH
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nouvelle limite (DH)
                    </label>
                    <input
                      type="number"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Entrez la nouvelle limite"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Raison de la modification
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Expliquez la raison de cette modification..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveLimit}
                    disabled={!newLimit || !reason}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Sauvegarder</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de détails du compte */}
      <AnimatePresence>
        {selectedAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedAccount(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Détails du compte {selectedAccount.name}
                  </h3>
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Informations générales */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Informations Générales</h4>
                    <div className="space-y-2">
                      <div><strong>Utilisateur:</strong> {selectedAccount.user}</div>
                      <div><strong>Email:</strong> {selectedAccount.email}</div>
                      <div><strong>Département:</strong> {selectedAccount.department}</div>
                      <div><strong>Dernière transaction:</strong> {formatDate(selectedAccount.lastTransaction)}</div>
                    </div>
                  </div>

                  {/* Statistiques financières */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Statistiques Financières</h4>
                    <div className="space-y-2">
                      <div><strong>Dépenses mensuelles:</strong> {selectedAccount.monthlySpending.toLocaleString()} DH</div>
                      <div><strong>Transaction moyenne:</strong> {selectedAccount.averageTransaction.toLocaleString()} DH</div>
                      <div><strong>Nombre de transactions:</strong> {selectedAccount.transactionCount}</div>
                      <div><strong>Taux d'utilisation:</strong> {selectedAccount.utilizationRate}%</div>
                    </div>
                  </div>
                </div>

                {/* Historique des limites */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Historique des Limites</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Limite</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Approuvé par</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedAccount.creditHistory.map((history, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatDate(history.date)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{history.limit.toLocaleString()} DH</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{history.reason}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{history.approvedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditLimitManager;