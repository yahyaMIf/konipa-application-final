import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import DocumentService from '../services/DocumentService';

const EnhancedAccountingInterface = ({ 
  invoices, 
  expenses, 
  payments, 
  onViewInvoice, 
  onEditInvoice, 
  onDeleteInvoice,
  onGenerateReport 
}) => {
  const [financialSummary, setFinancialSummary] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Quick actions handlers
  const handleNewInvoice = () => {

    // Logic for creating new invoice
  };

  const handleRecordPayment = () => {

    // Logic for recording payment
  };

  const handleNewExpense = () => {

    // Logic for adding new expense
  };

  const handleMonthlyReport = async () => {
    try {
      const reportData = {
        period: 'monthly',
        summary: financialSummary,
        invoices: invoices,
        expenses: expenses,
        payments: payments,
        alerts: alerts,
        generatedAt: new Date().toISOString()
      };
      
      // Essayer d'utiliser DocumentService en premier
      await DocumentService.generateMonthlyReport(reportData);
    } catch (error) {
      // Fallback vers le callback existant
      onGenerateReport?.('monthly');
    }
  };

  const handleInvoicesExport = async () => {
    try {
      const reportData = {
        type: 'invoices',
        invoices: invoices,
        summary: financialSummary,
        generatedAt: new Date().toISOString()
      };
      
      // Essayer d'utiliser DocumentService en premier
      await DocumentService.generateInvoicesReport(reportData);
    } catch (error) {
      // Fallback vers le callback existant
      onGenerateReport?.('invoices');
    }
  };

  useEffect(() => {
    calculateFinancialSummary();
    generateAlerts();
  }, [invoices, expenses, payments, selectedPeriod]);

  const calculateFinancialSummary = () => {
    const now = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredInvoices = invoices.filter(inv => new Date(inv.date) >= startDate);
    const filteredExpenses = expenses.filter(exp => new Date(exp.date) >= startDate);
    const filteredPayments = payments.filter(pay => new Date(pay.date) >= startDate);

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPayments = filteredPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const pendingInvoices = filteredInvoices.filter(inv => inv.paymentStatus === 'unpaid' || inv.status === 'pending');
    const overdueInvoices = pendingInvoices.filter(inv => {
      const dueDate = new Date(inv.dueDate || inv.date);
      return dueDate < now;
    });

    setFinancialSummary({
      totalRevenue,
      totalExpenses,
      totalPayments,
      netProfit: totalRevenue - totalExpenses,
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0),
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0),
      invoiceCount: filteredInvoices.length,
      expenseCount: filteredExpenses.length,
      paymentCount: filteredPayments.length,
      averageInvoice: filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0,
      cashFlow: totalPayments - totalExpenses
    });
  };

  const generateAlerts = () => {
    const newAlerts = [];
    const now = new Date();

    // Overdue invoices alert
    const overdueInvoices = invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate || inv.date);
      return dueDate < now && (inv.paymentStatus === 'unpaid' || inv.status === 'pending');
    });

    if (overdueInvoices.length > 0) {
      newAlerts.push({
        id: 'overdue',
        type: 'warning',
        title: 'Factures en retard',
        message: `${overdueInvoices.length} facture(s) en retard de paiement`,
        count: overdueInvoices.length,
        amount: overdueInvoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0)
      });
    }

    // High expenses alert
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = expenses.filter(exp => new Date(exp.date) >= thisMonth);
    const totalMonthlyExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    if (totalMonthlyExpenses > 50000) { // Alert if monthly expenses > 50k DH
      newAlerts.push({
        id: 'high-expenses',
        type: 'info',
        title: 'Dépenses élevées',
        message: `Dépenses mensuelles: ${totalMonthlyExpenses.toLocaleString()} DH`,
        amount: totalMonthlyExpenses
      });
    }

    // Low cash flow alert
    if (financialSummary.cashFlow < 0) {
      newAlerts.push({
        id: 'negative-cashflow',
        type: 'error',
        title: 'Trésorerie négative',
        message: `Flux de trésorerie: ${financialSummary.cashFlow?.toLocaleString()} DH`,
        amount: financialSummary.cashFlow
      });
    }

    setAlerts(newAlerts);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'unpaid': case 'pending': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'partial': return <Clock size={16} />;
      case 'unpaid': case 'pending': return <AlertCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="enhanced-accounting-interface">
      {/* Period Selector */}
      <div className="period-selector mb-6">
        <div className="flex items-center gap-4">
          <span className="font-medium">Période:</span>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section mb-6">
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            Alertes Financières ({alerts.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <h5 className="font-medium text-gray-800">{alert.title}</h5>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                {alert.amount && (
                  <p className="text-lg font-bold mt-2">
                    {alert.amount.toLocaleString()} DH
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="financial-summary grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="summary-card bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-green-800">
                {financialSummary.totalRevenue?.toLocaleString() || 0} DH
              </p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <div className="mt-2 text-sm text-green-600">
            {financialSummary.invoiceCount || 0} factures
          </div>
        </div>

        <div className="summary-card bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Dépenses</p>
              <p className="text-2xl font-bold text-red-800">
                {financialSummary.totalExpenses?.toLocaleString() || 0} DH
              </p>
            </div>
            <TrendingDown className="text-red-500" size={24} />
          </div>
          <div className="mt-2 text-sm text-red-600">
            {financialSummary.expenseCount || 0} dépenses
          </div>
        </div>

        <div className="summary-card bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Bénéfice Net</p>
              <p className={`text-2xl font-bold ${
                (financialSummary.netProfit || 0) >= 0 ? 'text-blue-800' : 'text-red-800'
              }`}>
                {financialSummary.netProfit?.toLocaleString() || 0} DH
              </p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
          <div className="mt-2 text-sm text-blue-600">
            Marge: {financialSummary.totalRevenue > 0 
              ? ((financialSummary.netProfit / financialSummary.totalRevenue) * 100).toFixed(1)
              : 0}%
          </div>
        </div>

        <div className="summary-card bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">En Attente</p>
              <p className="text-2xl font-bold text-purple-800">
                {financialSummary.pendingAmount?.toLocaleString() || 0} DH
              </p>
            </div>
            <Clock className="text-purple-500" size={24} />
          </div>
          <div className="mt-2 text-sm text-purple-600">
            Dont {financialSummary.overdueAmount?.toLocaleString() || 0} DH en retard
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="recent-invoices mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Factures Récentes</h4>
          <button 
            onClick={handleInvoicesExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Exporter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Numéro</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.slice(0, 10).map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {invoice.number || invoice.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {invoice.client || invoice.clientId}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {(invoice.amount || invoice.totalAmount || 0).toLocaleString()} DH
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(invoice.paymentStatus || invoice.status)
                    }`}>
                      {getStatusIcon(invoice.paymentStatus || invoice.status)}
                      {invoice.paymentStatus || invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onViewInvoice(invoice)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Voir"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => onEditInvoice(invoice)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteInvoice(invoice)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4 className="text-lg font-semibold mb-3">Actions Rapides</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleNewInvoice}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FileText className="text-blue-600 mb-2" size={24} />
            <span className="text-sm font-medium text-blue-800">Nouvelle Facture</span>
          </button>
          
          <button 
            onClick={handleRecordPayment}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <DollarSign className="text-green-600 mb-2" size={24} />
            <span className="text-sm font-medium text-green-800">Enregistrer Paiement</span>
          </button>
          
          <button 
            onClick={handleNewExpense}
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <TrendingDown className="text-red-600 mb-2" size={24} />
            <span className="text-sm font-medium text-red-800">Nouvelle Dépense</span>
          </button>
          
          <button 
            onClick={handleMonthlyReport}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Calendar className="text-purple-600 mb-2" size={24} />
            <span className="text-sm font-medium text-purple-800">Rapport Mensuel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAccountingInterface;