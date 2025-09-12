import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SalesRepDetailModal = ({ isOpen, onClose, salesRep }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && salesRep) {
      setLoading(true);
      // Charger les données réelles du représentant
      const loadSalesRepData = async () => {
        try {
          // Structure de données par défaut si aucune donnée n'est disponible
          const defaultData = {
            personalInfo: {
              name: salesRep?.name || 'Représentant',
              email: salesRep?.email || 'commercial@konipa.com',
              phone: salesRep?.phone || '+212 6 12 34 56 78',
              region: salesRep?.region || 'Maroc',
              startDate: salesRep?.startDate || new Date().toISOString().split('T')[0],
              manager: salesRep?.manager || 'Manager',
              status: salesRep?.status || 'Actif'
            },
            monthlyPerformance: [],
            clientDistribution: [],
            productCategories: [],
            weeklyActivity: [],
            topClients: [],
            kpis: {
              conversionRate: 0,
              avgOrderValue: 0,
              clientRetention: 0,
              callsPerDay: 0,
              emailsPerDay: 0,
              meetingsPerWeek: 0,
              quotaAttainment: 0
            }
          };
          
          setDetailedData(defaultData);
        } catch (error) {
          setDetailedData(null);
        } finally {
          setLoading(false);
        }
      };
      
      loadSalesRepData();
    }
  }, [isOpen, salesRep]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'activity', label: 'Activité', icon: Activity }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getPerformanceColor = (value, target) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{salesRep?.name}</h2>
                <p className="text-blue-100">Représentant Commercial</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r">
              <div className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Informations personnelles */}
              <div className="p-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Informations</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{detailedData.personalInfo.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{detailedData.personalInfo.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{detailedData.personalInfo.region}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Depuis {detailedData.personalInfo.startDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Vue d'ensemble */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Indicateurs Clés</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">CA Total</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(salesRep?.ca || 0)}
                              </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Commandes</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {salesRep?.commandes || 0}
                              </p>
                            </div>
                            <ShoppingCart className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Taux Conversion</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {detailedData.kpis.conversionRate}%
                              </p>
                            </div>
                            <Target className="w-8 h-8 text-purple-600" />
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Atteinte Objectif</p>
                              <p className={`text-2xl font-bold ${
                                detailedData.kpis.quotaAttainment >= 100 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {detailedData.kpis.quotaAttainment}%
                              </p>
                            </div>
                            <Award className="w-8 h-8 text-yellow-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h4 className="text-lg font-semibold mb-4">Répartition des Clients</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <RechartsPieChart>
                            <Pie
                              data={detailedData.clientDistribution}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}%`}
                            >
                              {detailedData.clientDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h4 className="text-lg font-semibold mb-4">Ventes par Catégorie</h4>
                        <div className="space-y-3">
                          {detailedData.productCategories.map((category) => (
                            <div key={category.category} className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium">{category.category}</span>
                                  <span className="text-sm text-gray-600">
                                    {formatCurrency(category.ca)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${category.pourcentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance */}
                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Évolution Mensuelle</h3>
                      <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={detailedData.monthlyPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => {
                              if (name === 'ca' || name === 'objectif') {
                                return [formatCurrency(value), name === 'ca' ? 'CA Réalisé' : 'Objectif'];
                              }
                              return [value, name === 'commandes' ? 'Commandes' : 'Clients'];
                            }} />
                            <Legend />
                            <Line type="monotone" dataKey="ca" stroke="#3B82F6" strokeWidth={3} name="CA Réalisé" />
                            <Line type="monotone" dataKey="objectif" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" name="Objectif" />
                            <Line type="monotone" dataKey="commandes" stroke="#10B981" strokeWidth={2} name="Commandes" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Panier Moyen</span>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(detailedData.kpis.avgOrderValue)}</p>
                        <p className="text-sm text-green-600">+12% vs mois dernier</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Rétention Client</span>
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-xl font-bold">{detailedData.kpis.clientRetention}%</p>
                        <p className="text-sm text-blue-600">+5% vs mois dernier</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Appels/Jour</span>
                          <Phone className="w-4 h-4 text-purple-600" />
                        </div>
                        <p className="text-xl font-bold">{detailedData.kpis.callsPerDay}</p>
                        <p className="text-sm text-purple-600">Objectif: 15</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clients */}
                {activeTab === 'clients' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Top Clients</h3>
                      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Client
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CA
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Commandes
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dernière Commande
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {detailedData.topClients.map((client, index) => (
                              <tr key={client.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                      <span className="text-blue-600 font-semibold text-sm">
                                        {client.name.charAt(0)}
                                      </span>
                                    </div>
                                    <span className="font-medium text-gray-900">{client.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  {formatCurrency(client.ca)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {client.commandes}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {new Date(client.lastOrder).toLocaleDateString('fr-FR')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activité */}
                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Activité Hebdomadaire</h3>
                      <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={detailedData.weeklyActivity}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="appels" fill="#3B82F6" name="Appels" />
                            <Bar dataKey="emails" fill="#10B981" name="Emails" />
                            <Bar dataKey="rdv" fill="#F59E0B" name="RDV" />
                            <Bar dataKey="ventes" fill="#EF4444" name="Ventes" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Appels/Semaine</span>
                          <Phone className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-xl font-bold">69</p>
                        <p className="text-sm text-blue-600">+8% vs semaine dernière</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Emails/Semaine</span>
                          <Mail className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xl font-bold">45</p>
                        <p className="text-sm text-green-600">+3% vs semaine dernière</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">RDV/Semaine</span>
                          <Calendar className="w-4 h-4 text-yellow-600" />
                        </div>
                        <p className="text-xl font-bold">17</p>
                        <p className="text-sm text-yellow-600">+2 vs semaine dernière</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Ventes/Semaine</span>
                          <Award className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-xl font-bold">12</p>
                        <p className="text-sm text-red-600">+4 vs semaine dernière</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesRepDetailModal;