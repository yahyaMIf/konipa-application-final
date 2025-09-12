import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone, 
  Mail, 
  FileText, 
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  Plus,
  Trash2,
  Send
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import DocumentService from '../services/DocumentService';

const EnhancedUnpaidManagement = () => {
  const { user } = useAuth();
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('daysOverdue');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionType, setActionType] = useState('');

  // Load unpaid invoices from API
  useEffect(() => {
    const loadUnpaidInvoices = async () => {
      try {
        setLoading(true);
        const data = await apiService.get('invoices/unpaid');
        setUnpaidInvoices(data || []);
      } catch (error) {
        setUnpaidInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    loadUnpaidInvoices();
  }, []);

  // Calculate statistics
  const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueCount = unpaidInvoices.filter(invoice => invoice.daysOverdue > 0).length;
  const criticalCount = unpaidInvoices.filter(invoice => invoice.daysOverdue > 30).length;

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort invoices
  const filteredInvoices = unpaidInvoices
    .filter(invoice => {
      const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
      const matchesSearch = invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount': return b.amount - a.amount;
        case 'daysOverdue': return b.daysOverdue - a.daysOverdue;
        case 'client': return a.client.localeCompare(b.client);
        case 'dueDate': return new Date(a.dueDate) - new Date(b.dueDate);
        default: return 0;
      }
    });

  // Handle invoice actions
  const handleInvoiceAction = (invoice, action) => {
    setSelectedInvoice(invoice);
    setActionType(action);
    setShowModal(true);
  };

  const executeAction = () => {
    if (!selectedInvoice) return;

    const updatedInvoices = unpaidInvoices.map(invoice => {
      if (invoice.id === selectedInvoice.id) {
        return {
          ...invoice,
          status: actionType,
          lastAction: new Date().toISOString().split('T')[0],
          actionBy: user.firstName + ' ' + user.lastName
        };
      }
      return invoice;
    });

    setUnpaidInvoices(updatedInvoices);
    setShowModal(false);
    setSelectedInvoice(null);
    setActionType('');
  };

  // Bulk actions
  const handleBulkAction = (action) => {
    const updatedInvoices = unpaidInvoices.map(invoice => {
      if (selectedInvoices.includes(invoice.id)) {
        return {
          ...invoice,
          status: action,
          lastAction: new Date().toISOString().split('T')[0],
          actionBy: user.firstName + ' ' + user.lastName
        };
      }
      return invoice;
    });

    setUnpaidInvoices(updatedInvoices);
    setSelectedInvoices([]);
  };

  // Export function
  const handleExport = async (format = 'csv') => {

    const dataToExport = filteredInvoices.map(invoice => ({
      id: invoice.id,
      client: invoice.client,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      daysOverdue: invoice.daysOverdue,
      status: invoice.status
    }));
    
    if (format === 'pdf') {
      try {
        // Generate PDF using DocumentService
        await DocumentService.generateUnpaidInvoicesReport({
          invoices: dataToExport,
          generatedDate: new Date().toISOString(),
          totalAmount: dataToExport.reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
        });

      } catch (error) {
        alert('Erreur lors de la génération du rapport PDF');
      }
    } else {
      // Create CSV content
      const csvContent = [
        ['ID', 'Client', 'Montant', 'Date d\'échéance', 'Jours de retard', 'Statut'],
        ...dataToExport.map(row => [row.id, row.client, row.amount, row.dueDate, row.daysOverdue, row.status])
      ].map(row => row.join(',')).join('\n');
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'factures_impayees.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Chart data
  const statusData = [
    { name: 'En attente', value: unpaidInvoices.filter(i => i.status === 'pending').length, color: '#FCD34D' },
    { name: 'Litigieux', value: unpaidInvoices.filter(i => i.status === 'disputed').length, color: '#F87171' },
    { name: 'Approuvé', value: unpaidInvoices.filter(i => i.status === 'approved').length, color: '#34D399' },
    { name: 'Refusé', value: unpaidInvoices.filter(i => i.status === 'declined').length, color: '#9CA3AF' }
  ];

  const amountByStatus = [
    { status: 'En attente', amount: unpaidInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0) },
    { status: 'Litigieux', amount: unpaidInvoices.filter(i => i.status === 'disputed').reduce((sum, i) => sum + i.amount, 0) },
    { status: 'Approuvé', amount: unpaidInvoices.filter(i => i.status === 'approved').reduce((sum, i) => sum + i.amount, 0) },
    { status: 'Refusé', amount: unpaidInvoices.filter(i => i.status === 'declined').reduce((sum, i) => sum + i.amount, 0) }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Impayés</h1>
        <p className="text-muted-foreground">Suivi et gestion des factures en retard de paiement</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total impayés</p>
              <p className="text-2xl font-bold text-red-600">{totalUnpaid.toLocaleString()} DH</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Factures en retard</p>
              <p className="text-2xl font-bold text-orange-600">{overdueCount}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Critiques (+30j)</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taux de recouvrement</p>
              <p className="text-2xl font-bold text-green-600">78%</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Montants par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={amountByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} DH`, 'Montant']} />
              <Bar dataKey="amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher client ou facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="disputed">Litigieux</option>
              <option value="approved">Approuvé</option>
              <option value="declined">Refusé</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daysOverdue">Jours de retard</option>
              <option value="amount">Montant</option>
              <option value="client">Client</option>
              <option value="dueDate">Date d'échéance</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {selectedInvoices.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction('approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approuver ({selectedInvoices.length})</span>
                </button>
                <button
                  onClick={() => handleBulkAction('declined')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Refuser ({selectedInvoices.length})</span>
                </button>
              </>
            )}
            <button 
              onClick={() => handleExport()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(filteredInvoices.map(i => i.id));
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retard
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
              {filteredInvoices.map((invoice) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices([...selectedInvoices, invoice.id]);
                        } else {
                          setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.client}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{invoice.amount.toLocaleString()} DH</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.dueDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      invoice.daysOverdue > 30 ? 'text-red-600' :
                      invoice.daysOverdue > 15 ? 'text-orange-600' :
                      invoice.daysOverdue > 0 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {invoice.daysOverdue > 0 ? `${invoice.daysOverdue} jours` : 'À jour'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status === 'pending' && 'En attente'}
                      {invoice.status === 'disputed' && 'Litigieux'}
                      {invoice.status === 'approved' && 'Approuvé'}
                      {invoice.status === 'declined' && 'Refusé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleInvoiceAction(invoice, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(user?.role === 'compta' || user?.role === 'accounting' || user?.role === 'accountant') && (
                        <>
                          <button
                            onClick={() => handleInvoiceAction(invoice, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleInvoiceAction(invoice, 'declined')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleInvoiceAction(invoice, 'contact')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'approved' && 'Approuver la facture'}
              {actionType === 'declined' && 'Refuser la facture'}
              {actionType === 'view' && 'Détails de la facture'}
              {actionType === 'contact' && 'Contacter le client'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Facture: {selectedInvoice.id}</p>
              <p className="text-sm text-gray-600">Client: {selectedInvoice.client}</p>
              <p className="text-sm text-gray-600">Montant: {selectedInvoice.amount.toLocaleString()} DH</p>
              <p className="text-sm text-gray-600">Retard: {selectedInvoice.daysOverdue} jours</p>
            </div>

            {selectedInvoice.notes && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Notes:</p>
                <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              {(actionType === 'approved' || actionType === 'declined') && (
                <button
                  onClick={executeAction}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    actionType === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirmer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUnpaidManagement;
