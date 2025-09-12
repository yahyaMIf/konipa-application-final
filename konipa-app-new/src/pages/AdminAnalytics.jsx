import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package,
  Download, Calendar, Filter, Search, FileText, Eye, Mail, Phone,
  MessageSquare, Target, Award, AlertTriangle, Clock, CheckCircle
} from 'lucide-react';
import SalesRepDetailModal from '../components/SalesRepDetailModal';
import { statisticsService } from '../services/statisticsService';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState(null);
  const [showSalesRepModal, setShowSalesRepModal] = useState(false);
  
  // États pour les données d'analyse
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    salesReps: [],
    conversion: [],
    products: [],
    dormantClients: [],
    searchQueries: [],
    overview: {}
  });

  // Vérification du rôle admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      window.location.href = '/unauthorized';
      return;
    }
    loadAnalyticsData();
  }, [user, dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Charger les données d'analyse depuis l'API
      const [revenueResponse, salesResponse, conversionResponse, productsResponse, clientsResponse] = await Promise.all([
        statisticsService.getRevenueAnalytics(dateRange),
        statisticsService.getSalesRepAnalytics(dateRange),
        statisticsService.getConversionAnalytics(dateRange),
        statisticsService.getProductAnalytics(dateRange),
        statisticsService.getClientAnalytics(dateRange)
      ]);

      const analyticsData = {
        revenue: revenueResponse.data || [],
        salesReps: salesResponse.data || [],
        conversion: conversionResponse.data || [],
        products: productsResponse.data || [],
        dormantClients: clientsResponse.data?.dormantClients || [],
        searchQueries: clientsResponse.data?.searchQueries || [],
        overview: {
          totalRevenue: revenueResponse.data?.reduce((sum, item) => sum + item.ca, 0) || 0,
          totalOrders: revenueResponse.data?.reduce((sum, item) => sum + item.commandes, 0) || 0,
          avgOrderValue: revenueResponse.data?.length > 0 ? 
            revenueResponse.data.reduce((sum, item) => sum + item.moyenne, 0) / revenueResponse.data.length : 0,
          conversionRate: conversionResponse.data?.find(item => item.etape === 'Paiements')?.taux || 0,
          activeClients: clientsResponse.data?.activeClients || 0,
          dormantClients: clientsResponse.data?.dormantClients?.length || 0,
          topProduct: productsResponse.data?.[0]?.name || 'N/A',
          topSalesRep: salesResponse.data?.[0]?.name || 'N/A'
        }
      };
      
      setAnalyticsData(analyticsData);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const exportReport = (type) => {
    // Simulation de l'export
    const data = JSON.stringify(analyticsData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analyse & Rapports</h1>
        <div className="flex space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">3 derniers mois</option>
            <option value="1y">Dernière année</option>
          </select>
          <button
            onClick={() => exportReport('complet')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
            { id: 'revenue', label: 'Chiffre d\'affaires', icon: DollarSign },
            { id: 'salesreps', label: 'Performance Commerciaux', icon: Users },
            { id: 'conversion', label: 'Taux de conversion', icon: Target },
            { id: 'products', label: 'Produits vendus', icon: Package },
            { id: 'clients', label: 'Clients dormants', icon: Clock },
            { id: 'searches', label: 'Recherches sans résultat', icon: Search }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CA Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.totalRevenue?.toLocaleString('fr-FR')}€
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commandes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.totalOrders}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Panier Moyen</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.avgOrderValue}€
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux Conversion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.conversionRate}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Évolution du CA</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}€`, 'CA']} />
                  <Area type="monotone" dataKey="ca" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Top Commerciaux</h3>
              <div className="space-y-4">
                {analyticsData.salesReps.slice(0, 3).map((rep, index) => (
                  <div key={rep.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{rep.name}</p>
                        <p className="text-sm text-gray-600">{rep.commandes} commandes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{rep.ca.toLocaleString('fr-FR')}€</p>
                      <p className="text-sm text-gray-600">{rep.conversion}% conv.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chiffre d'affaires */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Évolution du Chiffre d'Affaires</h3>
              <button
                onClick={() => exportReport('ca')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-blue-700"
              >
                <Download className="w-3 h-3" />
                <span>Exporter</span>
              </button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ca" stroke="#3B82F6" strokeWidth={3} name="CA (€)" />
                <Line type="monotone" dataKey="moyenne" stroke="#10B981" strokeWidth={2} name="Panier moyen (€)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Répartition par mois</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commandes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panier Moyen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Évolution</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.revenue.map((item, index) => {
                    const prevItem = analyticsData.revenue[index - 1];
                    const evolution = prevItem ? ((item.ca - prevItem.ca) / prevItem.ca * 100).toFixed(1) : 0;
                    return (
                      <tr key={item.month}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{item.ca.toLocaleString('fr-FR')}€</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.commandes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.moyenne}€</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            evolution > 0 ? 'bg-green-100 text-green-800' : evolution < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {evolution > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : evolution < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                            {evolution}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance des commerciaux */}
      {activeTab === 'salesreps' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Performance des Représentants</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un représentant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => exportReport('commerciaux')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-blue-700"
                >
                  <Download className="w-3 h-3" />
                  <span>Exporter</span>
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.salesReps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ca" fill="#3B82F6" name="CA (€)" />
                <Bar dataKey="commandes" fill="#10B981" name="Commandes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsData.salesReps
              .filter(rep => 
                rep.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((rep, index) => (
              <div 
                key={rep.name} 
                className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => {
                  setSelectedSalesRep(rep);
                  setShowSalesRepModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">{rep.name}</h4>
                  <div className="flex items-center space-x-2">
                    <Award className={`w-6 h-6 ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-gray-300'
                    }`} />
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CA:</span>
                    <span className="font-bold text-green-600">{rep.ca.toLocaleString('fr-FR')}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commandes:</span>
                    <span className="font-medium">{rep.commandes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion:</span>
                    <span className="font-medium text-blue-600">{rep.conversion}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clients:</span>
                    <span className="font-medium">{rep.clients}</span>
                   </div>
                 </div>
                 <div className="mt-4 pt-3 border-t border-gray-100">
                   <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
                     <Eye className="w-4 h-4 mr-1" />
                     <span>Voir l'analyse détaillée</span>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Taux de conversion */}
      {activeTab === 'conversion' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Entonnoir de Conversion</h3>
              <button
                onClick={() => exportReport('conversion')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-blue-700"
              >
                <Download className="w-3 h-3" />
                <span>Exporter</span>
              </button>
            </div>
            <div className="space-y-4">
              {analyticsData.conversion.map((step, index) => {
                const nextStep = analyticsData.conversion[index + 1];
                const dropRate = nextStep ? ((step.nombre - nextStep.nombre) / step.nombre * 100).toFixed(1) : 0;
                return (
                  <div key={step.etape} className="relative">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : index === 2 ? 'bg-yellow-500' : 
                          index === 3 ? 'bg-orange-500' : 'bg-red-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{step.etape}</h4>
                          <p className="text-sm text-gray-600">{step.nombre.toLocaleString('fr-FR')} utilisateurs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{step.taux}%</p>
                        {nextStep && (
                          <p className="text-sm text-red-600">-{dropRate}% abandon</p>
                        )}
                      </div>
                    </div>
                    {nextStep && (
                      <div className="flex justify-center my-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Produits vendus */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Top Produits Vendus</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                />
                <button
                  onClick={() => exportReport('produits')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-blue-700"
                >
                  <Download className="w-3 h-3" />
                  <span>Exporter</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tendance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.products
                    .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((product) => (
                    <tr key={product.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.ventes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{product.ca.toLocaleString('fr-FR')}€</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stock < 30 ? 'bg-red-100 text-red-800' : product.stock < 100 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.tendance === 'up' ? 'bg-green-100 text-green-800' : 
                          product.tendance === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.tendance === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : 
                           product.tendance === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                          {product.tendance === 'up' ? 'Hausse' : product.tendance === 'down' ? 'Baisse' : 'Stable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Clients dormants */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Clients Dormants</h3>
              <button
                onClick={() => exportReport('clients-dormants')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-blue-700"
              >
                <Download className="w-3 h-3" />
                <span>Exporter</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsData.dormantClients.map((client) => (
                <div key={client.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{client.name}</h4>
                      <p className="text-sm text-gray-600">ID: {client.id}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.potential === 'high' ? 'bg-red-100 text-red-800' : 
                      client.potential === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {client.potential === 'high' ? 'Priorité haute' : 
                       client.potential === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dernière commande:</span>
                      <span className="font-medium">{new Date(client.lastOrder).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CA historique:</span>
                      <span className="font-bold text-green-600">{client.ca.toLocaleString('fr-FR')}€</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center justify-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                    <button className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center justify-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>Appel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recherches sans résultat */}
      {activeTab === 'searches' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recherches sans Résultat</h3>
              <button
                onClick={() => exportReport('recherches')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-blue-700"
              >
                <Download className="w-3 h-3" />
                <span>Exporter</span>
              </button>
            </div>
            <div className="space-y-4">
              {analyticsData.searchQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{query.query}</p>
                      <p className="text-sm text-gray-600">{new Date(query.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {query.count} recherches
                    </span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Analyser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal détaillé pour les représentants */}
      {showSalesRepModal && selectedSalesRep && (
        <SalesRepDetailModal
          salesRep={selectedSalesRep}
          isOpen={showSalesRepModal}
          onClose={() => {
            setShowSalesRepModal(false);
            setSelectedSalesRep(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminAnalytics;