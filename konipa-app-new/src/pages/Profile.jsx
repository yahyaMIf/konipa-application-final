import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  CreditCard,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Settings,
  Bell,
  Lock,
  Eye,
  Download,
  FileText,
  BarChart3,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DocumentService from '../services/DocumentService';
import statisticsService from '../services/statisticsService';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [userStats, setUserStats] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick actions handlers
  const handleDownloadData = async () => {
    try {
      // Prepare user data for PDF generation
      const userData = {
        profile: user,
        downloadDate: new Date().toISOString(),
        dataType: 'user_profile'
      };
      
      // Generate PDF using DocumentService
      await DocumentService.generateUserDataReport(userData);
      
      alert('Rapport PDF de vos données téléchargé avec succès!');
    } catch (error) {
      alert('Erreur lors de la génération du rapport de données');
    }
  };

  const handleInvoiceHistory = () => {
    // Navigate to invoice history or show modal
    alert('Redirection vers l\'historique des factures...');
    // In a real app, you would navigate to /invoices or open a modal
  };

  const handleActivityLog = () => {
    // Navigate to activity log or show modal
    alert('Affichage du journal d\'activité...');
    // In a real app, you would navigate to /activity or open a modal
  };
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '+212 6 XX XX XX XX',
    company: user?.company || '',
    address: '123 Rue Mohammed V, Casablanca',
    city: 'Casablanca',
    postalCode: '20000'
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    // Ici on sauvegarderait les données
  };

  // Chargement des données utilisateur
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [statsData, activitiesData] = await Promise.all([
        statisticsService.getUserStats(user.id, user.role),
        statisticsService.getUserActivities(user.id)
      ]);
      
      setUserStats(statsData);
      setUserActivities(activitiesData || []);
    } catch (error) {
      // Fallback vers des données par défaut
      setUserStats(getDefaultStats());
      setUserActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Données par défaut en cas d'erreur
  const getDefaultStats = () => {
    const defaultStatsByRole = {
      admin: [
        { title: 'Utilisateurs gérés', value: '0', icon: Users, color: 'blue' },
        { title: 'Systèmes surveillés', value: '0', icon: Settings, color: 'green' },
        { title: 'Alertes résolues', value: '0', icon: CheckCircle, color: 'purple' },
        { title: 'Uptime moyen', value: '0%', icon: TrendingUp, color: 'orange' }
      ],
      client: [
        { title: 'Commandes totales', value: '0', icon: Package, color: 'blue' },
        { title: 'Dépenses 2024', value: '0 DH', icon: DollarSign, color: 'green' },
        { title: 'Économies réalisées', value: '0 DH', icon: Award, color: 'purple' },
        { title: 'Fidélité', value: 'Bronze', icon: Shield, color: 'orange' }
      ],
      commercial: [
        { title: 'CA du mois', value: '0 DH', icon: TrendingUp, color: 'blue' },
        { title: 'Objectif atteint', value: '0%', icon: Target, color: 'green' },
        { title: 'Nouveaux clients', value: '0', icon: Users, color: 'purple' },
        { title: 'Devis en cours', value: '0', icon: FileText, color: 'orange' }
      ],
      compta: [
        { title: 'Factures en attente', value: '0', icon: FileText, color: 'blue' },
        { title: 'Encours client', value: '0 DH', icon: DollarSign, color: 'red' },
        { title: 'Paiements reçus', value: '0 DH', icon: CheckCircle, color: 'green' },
        { title: 'Relances envoyées', value: '0', icon: AlertCircle, color: 'orange' }
      ]
    };
    
    return defaultStatsByRole[user?.role] || [];
  };

  const roleData = {
    stats: userStats || getDefaultStats(),
    activities: userActivities
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'activity', label: 'Activité', icon: Clock },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et vos préférences</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Informations personnelles</h2>
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isEditing 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    <span>{isEditing ? 'Sauvegarder' : 'Modifier'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Activité récente</h2>
                <div className="space-y-4">
                  {roleData.activities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'warning' ? 'bg-yellow-500' :
                        activity.status === 'pending' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Mes statistiques</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roleData.stats.map((stat, index) => (
                      <div key={index} className={`bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-lg p-6 text-white`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">{stat.title}</p>
                            <p className="text-2xl font-bold mt-1">{stat.value}</p>
                          </div>
                          <stat.icon className="w-8 h-8 opacity-80" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Paramètres</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">Notifications email</p>
                        <p className="text-sm text-gray-500">Recevoir les notifications par email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">Authentification à deux facteurs</p>
                        <p className="text-sm text-gray-500">Sécurité renforcée pour votre compte</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                    <Lock className="w-4 h-4" />
                    <span>Changer le mot de passe</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{user?.firstName} {user?.lastName}</h3>
                <p className="text-gray-600">{user?.email}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                  user?.role === 'client' ? 'bg-blue-100 text-blue-800' :
                  user?.role === 'commercial' ? 'bg-green-100 text-green-800' :
                  user?.role === 'compta' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user?.role === 'admin' ? 'Administrateur' :
                   user?.role === 'client' ? 'Client' :
                   user?.role === 'commercial' ? 'Commercial' :
                   user?.role === 'compta' ? 'Comptabilité' :
                   user?.role}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleDownloadData}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Télécharger mes données</span>
                </button>
                <button 
                  onClick={handleInvoiceHistory}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Historique des factures</span>
                </button>
                <button 
                  onClick={handleActivityLog}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Journal d'activité</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

