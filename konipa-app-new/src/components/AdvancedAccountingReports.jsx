import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart,
  RadialBarChart, RadialBar, ScatterChart, Scatter
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter,
  FileText, BarChart3, PieChart as PieChartIcon, Activity, Users,
  CreditCard, AlertTriangle, CheckCircle, Eye, Printer, Mail
} from 'lucide-react';

const AdvancedAccountingReports = ({ invoices, expenses, payments, onExport }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Données pour les graphiques
  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
    { month: 'Fév', revenue: 52000, expenses: 35000, profit: 17000 },
    { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
    { month: 'Avr', revenue: 61000, expenses: 38000, profit: 23000 },
    { month: 'Mai', revenue: 55000, expenses: 36000, profit: 19000 },
    { month: 'Jun', revenue: 67000, expenses: 41000, profit: 26000 }
  ];

  const cashFlowData = [
    { date: '01/01', entrees: 15000, sorties: 12000, solde: 3000 },
    { date: '08/01', entrees: 22000, sorties: 18000, solde: 7000 },
    { date: '15/01', entrees: 18000, sorties: 15000, solde: 10000 },
    { date: '22/01', entrees: 25000, sorties: 20000, solde: 15000 },
    { date: '29/01', entrees: 20000, sorties: 16000, solde: 19000 }
  ];

  const expenseCategories = [
    { name: 'Fournitures', value: 35, amount: 25000, color: '#8884d8' },
    { name: 'Marketing', value: 25, amount: 18000, color: '#82ca9d' },
    { name: 'Transport', value: 20, amount: 14000, color: '#ffc658' },
    { name: 'Personnel', value: 15, amount: 11000, color: '#ff7300' },
    { name: 'Autres', value: 5, amount: 3500, color: '#00ff88' }
  ];

  const clientAnalysis = [
    { client: 'Entreprise ABC', revenue: 45000, invoices: 12, avgPayment: 15, status: 'excellent' },
    { client: 'Société XYZ', revenue: 32000, invoices: 8, avgPayment: 25, status: 'bon' },
    { client: 'Groupe DEF', revenue: 28000, invoices: 6, avgPayment: 45, status: 'moyen' },
    { client: 'Start-up GHI', revenue: 15000, invoices: 4, avgPayment: 60, status: 'risque' }
  ];

  const performanceMetrics = [
    { metric: 'Chiffre d\'affaires', value: 328000, change: 12.5, trend: 'up' },
    { metric: 'Marge brute', value: 195000, change: 8.3, trend: 'up' },
    { metric: 'Charges', value: 133000, change: -5.2, trend: 'down' },
    { metric: 'Résultat net', value: 62000, change: 18.7, trend: 'up' }
  ];

  const agingReport = [
    { period: '0-30 jours', amount: 45000, count: 12, percentage: 60 },
    { period: '31-60 jours', amount: 22000, count: 6, percentage: 29 },
    { period: '61-90 jours', amount: 8000, count: 2, percentage: 11 },
    { period: '+90 jours', amount: 0, count: 0, percentage: 0 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'bon': return 'text-blue-600 bg-blue-100';
      case 'moyen': return 'text-yellow-600 bg-yellow-100';
      case 'risque': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const generateReport = (type) => {
    const reportData = {
      type,
      period: selectedPeriod,
      dateRange,
      generatedAt: new Date().toISOString(),
      data: type === 'revenue' ? revenueData : 
            type === 'cashflow' ? cashFlowData :
            type === 'expenses' ? expenseCategories :
            clientAnalysis
    };
    onExport?.(reportData, 'pdf');
  };

  return (
    <div className="space-y-6">
      {/* En-tête des rapports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Rapports Avancés</h2>
          <div className="flex space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            <button
              onClick={() => generateReport(selectedReport)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {/* Métriques de performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {performanceMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.metric}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value.toLocaleString()} DH
                  </p>
                </div>
                <div className={`flex items-center space-x-1 ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? 
                    <TrendingUp className="h-4 w-4" /> : 
                    <TrendingDown className="h-4 w-4" />
                  }
                  <span className="text-sm font-medium">{Math.abs(metric.change)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sélecteur de rapports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'revenue', label: 'Revenus & Profits', icon: BarChart3 },
            { id: 'cashflow', label: 'Flux de Trésorerie', icon: Activity },
            { id: 'expenses', label: 'Analyse des Dépenses', icon: PieChartIcon },
            { id: 'clients', label: 'Analyse Clients', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedReport === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Graphiques selon le rapport sélectionné */}
        <div className="h-96">
          {selectedReport === 'revenue' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} DH`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenus" />
                <Bar dataKey="expenses" fill="#ef4444" name="Dépenses" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Profit" />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {selectedReport === 'cashflow' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} DH`, '']} />
                <Legend />
                <Area type="monotone" dataKey="entrees" stackId="1" stroke="#10b981" fill="#10b981" name="Entrées" />
                <Area type="monotone" dataKey="sorties" stackId="1" stroke="#ef4444" fill="#ef4444" name="Sorties" />
                <Line type="monotone" dataKey="solde" stroke="#3b82f6" strokeWidth={3} name="Solde" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {selectedReport === 'expenses' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [
                  `${expenseCategories.find(e => e.name === name)?.amount.toLocaleString()} DH`,
                  name
                ]} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {selectedReport === 'clients' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="client" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} DH`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Chiffre d'affaires" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Analyse détaillée des clients */}
      {selectedReport === 'clients' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse Détaillée des Clients</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chiffre d'affaires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factures
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Délai moyen
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
                {clientAnalysis.map((client, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.revenue.toLocaleString()} DH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.invoices}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.avgPayment} jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(client.status)
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rapport de vieillissement des créances */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vieillissement des Créances</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {agingReport.map((period, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">{period.period}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {period.amount.toLocaleString()} DH
              </div>
              <div className="text-sm text-gray-500">
                {period.count} factures ({period.percentage}%)
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${period.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAccountingReports;