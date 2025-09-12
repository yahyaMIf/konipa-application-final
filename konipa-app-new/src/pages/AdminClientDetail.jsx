import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  ShoppingCart,
  Heart,
  MessageSquare,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Gift,
  Tag,
  Truck,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Award,
  Shield,
  Bell
} from 'lucide-react';
import UserService from '../services/userService';
import OrderService from '../services/orderService';
import { ProductService } from '../services/ProductService';
import { ReviewService } from '../services/ReviewService';
import { StatisticsService } from '../services/statisticsService';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  // États principaux
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Données des onglets
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [segments, setSegments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // Statistiques client
  const [clientStats, setClientStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
    favoriteCategory: '',
    loyaltyPoints: 0,
    lifetimeValue: 0,
    riskScore: 0,
    satisfactionScore: 0,
    engagementScore: 0
  });
  
  // Onglets disponibles
  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'orders', label: 'Commandes', icon: Package },
    { id: 'reviews', label: 'Avis', icon: Star },
    { id: 'wishlist', label: 'Liste de souhaits', icon: Heart },
    { id: 'addresses', label: 'Adresses', icon: MapPin },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'analytics', label: 'Analytiques', icon: BarChart3 },
    { id: 'segments', label: 'Segments', icon: Target },
    { id: 'recommendations', label: 'Recommandations', icon: Zap }
  ];
  
  // Chargement des données
  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);
  
  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientData, ordersData, reviewsData, wishlistData, addressesData, paymentsData, communicationsData, analyticsData, segmentsData, recommendationsData] = await Promise.all([
        UserService.getUser(clientId),
        OrderService.getUserOrders(clientId),
        ReviewService.getUserReviews(clientId),
        ProductService.getUserWishlist(clientId),
        UserService.getUserAddresses(clientId),
        UserService.getUserPaymentMethods(clientId),
        UserService.getUserCommunications(clientId),
        StatisticsService.getUserAnalytics(clientId),
        UserService.getUserSegments(clientId),
        UserService.getUserRecommendations(clientId)
      ]);
      
      setClient(clientData);
      setOrders(ordersData || []);
      setReviews(reviewsData || []);
      setWishlist(wishlistData || []);
      setAddresses(addressesData || []);
      setPaymentMethods(paymentsData || []);
      setCommunications(communicationsData || []);
      setAnalytics(analyticsData || {});
      setSegments(segmentsData || []);
      setRecommendations(recommendationsData || []);
      
      // Calculer les statistiques client
      calculateClientStats(ordersData, reviewsData, analyticsData);
    } catch (err) {
      setError('Erreur lors du chargement des données client');
      } finally {
      setLoading(false);
    }
  };
  
  const calculateClientStats = (ordersData, reviewsData, analyticsData) => {
    const totalOrders = ordersData?.length || 0;
    const totalSpent = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = ordersData?.length > 0 ? ordersData[0]?.createdAt : null;
    const averageRating = reviewsData?.length > 0 ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length : 0;
    
    setClientStats({
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      favoriteCategory: analyticsData?.favoriteCategory || 'Non définie',
      loyaltyPoints: analyticsData?.loyaltyPoints || 0,
      lifetimeValue: analyticsData?.lifetimeValue || totalSpent,
      riskScore: analyticsData?.riskScore || 0,
      satisfactionScore: averageRating,
      engagementScore: analyticsData?.engagementScore || 0
    });
  };
  
  // Fonctions utilitaires
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.active;
  };
  
  const getRiskColor = (score) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Actions client
  const handleSendEmail = () => {
    // Logique d'envoi d'email

  };
  
  const handleEditClient = () => {
    // Logique d'édition client

  };
  
  const handleSuspendClient = () => {
    if (window.confirm('Êtes-vous sûr de vouloir suspendre ce client ?')) {
      // Logique de suspension

    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !client) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-700">{error || 'Client non trouvé'}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Retour
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              {client.avatar ? (
                <img src={client.avatar} alt={client.name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-600" />
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">{client.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : client.status === 'suspended' ? 'Suspendu' : 'En attente'}
                </span>
                <span className="text-sm text-gray-500">Client depuis {formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleSendEmail}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer un email
          </button>
          
          <button
            onClick={handleEditClient}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </button>
          
          <button
            onClick={handleSuspendClient}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Suspendre
          </button>
        </div>
      </div>
      
      {/* Métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{clientStats.totalOrders}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total dépensé</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(clientStats.totalSpent)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Panier moyen</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(clientStats.averageOrderValue)}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Points fidélité</p>
              <p className="text-2xl font-bold text-orange-600">{clientStats.loyaltyPoints}</p>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Score de risque</p>
              <p className={`text-2xl font-bold ${getRiskColor(clientStats.riskScore)}`}>{clientStats.riskScore}%</p>
            </div>
            <AlertTriangle className={`h-8 w-8 ${getRiskColor(clientStats.riskScore)}`} />
          </div>
        </div>
      </div>
      
      {/* Onglets */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {/* Contenu des onglets */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-3" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <span>{client.phone || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <span>Né(e) le {client.birthDate ? formatDate(client.birthDate) : 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                      <span>{client.city || 'Non renseigné'}, {client.country || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Scores et métriques</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valeur vie client:</span>
                      <span className="font-semibold">{formatCurrency(clientStats.lifetimeValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Score satisfaction:</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-semibold">{clientStats.satisfactionScore.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Score engagement:</span>
                      <span className="font-semibold">{clientStats.engagementScore}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Catégorie préférée:</span>
                      <span className="font-semibold">{clientStats.favoriteCategory}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Activité récente */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">Commande #{order.id}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(order.total)}</p>
                        <p className="text-sm text-gray-500">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Historique des commandes</h3>
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Commande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
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
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Avis et évaluations</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{review.product?.name}</h4>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'wishlist' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Liste de souhaits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <img
                      src={item.product?.image || '/default-product.jpg'}
                      alt={item.product?.name}
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                    <h4 className="font-medium text-gray-900 mb-1">{item.product?.name}</h4>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(item.product?.price)}</p>
                    <p className="text-sm text-gray-500 mt-1">Ajouté le {formatDate(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'addresses' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{address.type}</h4>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Par défaut</span>
                      )}
                    </div>
                    <p className="text-gray-700">{address.street}</p>
                    <p className="text-gray-700">{address.city}, {address.postalCode}</p>
                    <p className="text-gray-700">{address.country}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de paiement</h3>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{method.type} •••• {method.lastFour}</p>
                          <p className="text-sm text-gray-500">Expire {method.expiryMonth}/{method.expiryYear}</p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Par défaut</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'communications' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des communications</h3>
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div key={comm.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="font-medium text-gray-900">{comm.type}</span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(comm.createdAt)}</span>
                    </div>
                    <p className="text-gray-700">{comm.subject}</p>
                    <p className="text-sm text-gray-500 mt-1">Statut: {comm.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Analytiques client</h3>
              
              {/* Graphiques d'analyse */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 border rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Évolution des commandes</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analytics.ordersOverTime || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-white p-4 border rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Répartition par catégorie</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={analytics.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {(analytics.categoryDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'segments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Segments client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((segment) => (
                  <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{segment.name}</h4>
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Confiance: {segment.confidence}%</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        segment.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {segment.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'recommendations' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommandations</h3>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Zap className="h-5 w-5 text-yellow-500 mr-3" />
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Impact estimé: {rec.estimatedImpact}</span>
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Appliquer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClientDetail;