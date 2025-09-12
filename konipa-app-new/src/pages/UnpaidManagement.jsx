import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Mail, 
  Phone, 
  FileText, 
  Ban, 
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building,
  CreditCard,
  TrendingUp,
  Filter,
  Search,
  Download,
  Send
} from 'lucide-react';

const UnpaidManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // État pour les factures impayées - rempli par les données du backend
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  
  // Charger les factures impayées depuis le backend
  useEffect(() => {
    const loadUnpaidInvoices = async () => {
      try {
        // Charger les factures impayées depuis l'API
        const response = await fetch('/api/invoices/unpaid');
        if (response.ok) {
          const invoicesData = await response.json();
          setUnpaidInvoices(invoicesData || []);
        } else {
          setUnpaidInvoices([]);
        }
      } catch (error) {
        setUnpaidInvoices([]);
      }
    };
    
    loadUnpaidInvoices();
  }, []);

  // Règles métier
  const businessRules = {
    warningThreshold: 7, // jours
    criticalThreshold: 21, // jours
    blockingThreshold: 30, // jours
    maxReminderCount: 5,
    creditLimitBuffer: 0.1 // 10% de marge
  };

  // Statistiques
  const stats = {
    totalUnpaid: unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    totalClients: unpaidInvoices.length,
    criticalCases: unpaidInvoices.filter(inv => inv.status === 'critical' || inv.status === 'blocked').length,
    averageDaysPastDue: Math.round(unpaidInvoices.reduce((sum, inv) => sum + inv.daysPastDue, 0) / unpaidInvoices.length)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'blocked': return 'text-muted-foreground bg-muted';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'warning': return <Clock className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'blocked': return <Ban className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredInvoices = unpaidInvoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sendReminder = (invoiceId, type) => {
    // Simulation d'envoi de relance

    // Ici on intégrerait avec un service d'email/SMS
  };

  const blockClient = (clientId) => {
    // Simulation de blocage client

    // Ici on mettrait à jour le statut du client
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Impayés</h1>
          <p className="text-muted-foreground">Suivi et gestion des factures en retard de paiement</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Impayés</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalUnpaid.toLocaleString()} DH</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients Concernés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cas Critiques</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalCases}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retard Moyen</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageDaysPastDue} jours</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </motion.div>
        </div>

        {/* Onglets */}
        <div className="bg-card rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
                { id: 'invoices', label: 'Factures impayées', icon: FileText },
                { id: 'rules', label: 'Règles métier', icon: CheckCircle }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Tableau de bord des impayés</h3>
                
                {/* Graphique de répartition par statut */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-4">Répartition par statut</h4>
                    <div className="space-y-3">
                      {['warning', 'critical', 'blocked'].map(status => {
                        const count = unpaidInvoices.filter(inv => inv.status === status).length;
                        const percentage = (count / unpaidInvoices.length * 100).toFixed(1);
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${
                                status === 'warning' ? 'bg-yellow-500' :
                                status === 'critical' ? 'bg-red-500' : 'bg-muted-foreground'
                              }`} />
                              <span className="text-sm text-gray-600 capitalize">{status}</span>
                            </div>
                            <span className="text-sm font-medium">{count} ({percentage}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-4">Actions recommandées</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Relances urgentes</p>
                          <p className="text-xs text-gray-600">3 clients nécessitent une relance immédiate</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Ban className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Blocages à considérer</p>
                          <p className="text-xs text-gray-600">1 client dépasse le seuil de blocage</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <CreditCard className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Révision crédit</p>
                          <p className="text-xs text-gray-600">2 clients approchent leur limite de crédit</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des factures impayées */}
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                {/* Filtres et recherche */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par client ou facture..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="warning">Avertissement</option>
                    <option value="critical">Critique</option>
                    <option value="blocked">Bloqué</option>
                  </select>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </button>
                </div>

                {/* Table des factures */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client / Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Retard
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risque
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-foreground">{invoice.clientName}</div>
                              <div className="text-sm text-gray-500">{invoice.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {invoice.amount.toLocaleString()} DH
                            </div>
                            <div className="text-sm text-gray-500">
                              Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-red-600">
                              {invoice.daysPastDue} jours
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.reminderCount} relance(s)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusIcon(invoice.status)}
                              <span className="ml-1 capitalize">{invoice.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getRiskColor(invoice.riskLevel)}`}>
                              {invoice.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => sendReminder(invoice.id, 'email')}
                              className="text-blue-600 hover:text-blue-900"
                              title="Envoyer relance email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => sendReminder(invoice.id, 'sms')}
                              className="text-green-600 hover:text-green-900"
                              title="Envoyer relance SMS"
                            >
                              <Phone className="h-4 w-4" />
                            </button>
                            {invoice.status === 'blocked' && (
                              <button
                                onClick={() => blockClient(invoice.clientId)}
                                className="text-red-600 hover:text-red-900"
                                title="Bloquer client"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Règles métier */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Configuration des règles métier</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Seuils de retard */}
                  <div className="bg-muted rounded-lg p-6">
                    <h4 className="font-medium text-foreground mb-4">Seuils de retard</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avertissement</span>
                        <span className="text-sm font-medium text-yellow-600">{businessRules.warningThreshold} jours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Critique</span>
                        <span className="text-sm font-medium text-red-600">{businessRules.criticalThreshold} jours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Blocage</span>
                        <span className="text-sm font-medium text-gray-600">{businessRules.blockingThreshold} jours</span>
                      </div>
                    </div>
                  </div>

                  {/* Règles de relance */}
                  <div className="bg-muted rounded-lg p-6">
                    <h4 className="font-medium text-foreground mb-4">Règles de relance</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Relances maximum</span>
                        <span className="text-sm font-medium">{businessRules.maxReminderCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Fréquence</span>
                        <span className="text-sm font-medium">Tous les 7 jours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Escalade automatique</span>
                        <span className="text-sm font-medium text-green-600">Activée</span>
                      </div>
                    </div>
                  </div>

                  {/* Gestion du crédit */}
                  <div className="bg-muted rounded-lg p-6">
                    <h4 className="font-medium text-foreground mb-4">Gestion du crédit</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Marge de sécurité</span>
                        <span className="text-sm font-medium">{(businessRules.creditLimitBuffer * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Blocage automatique</span>
                        <span className="text-sm font-medium text-green-600">Activé</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Révision périodique</span>
                        <span className="text-sm font-medium">Mensuelle</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions automatiques */}
                  <div className="bg-muted rounded-lg p-6">
                    <h4 className="font-medium text-foreground mb-4">Actions automatiques</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Relance email automatique</span>
                        <span className="text-sm font-medium text-green-600">Activée</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Notification équipe</span>
                        <span className="text-sm font-medium text-green-600">Activée</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rapport hebdomadaire</span>
                        <span className="text-sm font-medium text-green-600">Activé</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions globales */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Actions globales disponibles</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Send className="h-4 w-4 mr-2" />
                      Relance groupée
                    </button>
                    <button className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Escalade critique
                    </button>
                    <button className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Ban className="h-4 w-4 mr-2" />
                      Blocage groupé
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnpaidManagement;

