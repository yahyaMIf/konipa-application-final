import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Building, Phone, Mail, MapPin, Calendar, DollarSign,
  ShoppingCart, Package, TrendingUp, TrendingDown, Star,
  CreditCard, Clock, AlertTriangle, FileText, MessageSquare,
  Edit, Save, X, Plus, Eye, Download, RefreshCw, BarChart3,
  PieChart, Activity, Target, Zap, Users, Globe, Smartphone,
  Tablet, Monitor, ArrowLeft, ExternalLink, History, Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { toast } from 'react-hot-toast';

const AdminClient360 = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [financialData, setFinancialData] = useState({});
  const [webActivity, setWebActivity] = useState([]);
  const [notes, setNotes] = useState([]);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingClient, setEditingClient] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [clientStats, setClientStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
    favoriteCategory: '',
    loyaltyScore: 0,
    conversionRate: 0
  });

  // Vérifier si l'utilisateur est admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous devez être administrateur pour accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // Charger les données du client en parallèle
      const [clientResponse, ordersResponse] = await Promise.all([
        apiService.clients.getById(clientId),
        apiService.clients.getOrders(clientId)
      ]);
      
      // Handle different response formats
      let client = null;
      if (clientResponse.data && clientResponse.data.client) {
        client = clientResponse.data.client;
      } else if (clientResponse.data) {
        client = clientResponse.data;
      } else {
        client = clientResponse;
      }
      
      let orders = [];
      if (ordersResponse.data && ordersResponse.data.orders) {
        orders = ordersResponse.data.orders;
      } else if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
        orders = ordersResponse.data;
      } else if (Array.isArray(ordersResponse)) {
        orders = ordersResponse;
      }
      
      setClient(client);
      setOrders(orders);
      setEditingClient(client);
      
      // Set default empty data for features not yet implemented
      setFinancialData({});
      setWebActivity([]);
      setNotes([]);
      
      // Calculer les statistiques
      calculateClientStats(orders || [], client);
      
    } catch (error) {
      toast.error('Erreur lors du chargement des données client');
    } finally {
      setLoading(false);
    }
  };

  const calculateClientStats = (clientOrders, clientData) => {
    const totalOrders = clientOrders.length;
    const totalSpent = clientOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = clientOrders.length > 0 ? 
      new Date(Math.max(...clientOrders.map(order => new Date(order.createdAt)))) : null;
    
    // Calculer la catégorie favorite
    const categoryCount = {};
    clientOrders.forEach(order => {
      order.items?.forEach(item => {
        const category = item.product?.category || 'Autre';
        categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
      });
    });
    
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'Aucune'
    );
    
    // Score de fidélité basé sur la fréquence et le montant
    const daysSinceFirstOrder = clientData.createdAt ? 
      (Date.now() - new Date(clientData.createdAt)) / (1000 * 60 * 60 * 24) : 0;
    const orderFrequency = daysSinceFirstOrder > 0 ? totalOrders / (daysSinceFirstOrder / 30) : 0;
    const loyaltyScore = Math.min(100, (orderFrequency * 20) + (totalSpent / 1000));
    
    setClientStats({
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      favoriteCategory,
      loyaltyScore: Math.round(loyaltyScore),
      conversionRate: 85 // Simulé
    });
  };

  const handleUpdateClient = async () => {
    try {
      await apiService.clients.update(clientId, editingClient);
      setClient(editingClient);
      setShowEditClient(false);
      toast.success('Client mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du client');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const noteData = {
        content: newNote,
        authorId: user.id,
        clientId: clientId,
        createdAt: new Date().toISOString()
      };
      
      // TODO: Implement notes API endpoint
      // await apiService.post(`admin/clients/${clientId}/notes`, noteData);
      setNotes([noteData, ...notes]);
      setNewNote('');
      setShowAddNote(false);
      toast.success('Note ajoutée avec succès (local only)');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la note');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getLoyaltyBadge = (score) => {
    if (score >= 80) return <Badge className="bg-gold-100 text-gold-800">VIP</Badge>;
    if (score >= 60) return <Badge className="bg-green-100 text-green-800">Fidèle</Badge>;
    if (score >= 40) return <Badge className="bg-blue-100 text-blue-800">Régulier</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Nouveau</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des données client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Client introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Le client demandé n'existe pas ou n'est plus accessible.</p>
            <Button className="mt-4" onClick={() => navigate('/admin/users')}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* En-tête avec navigation */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vue Client 360°</h1>
              <p className="text-gray-600 mt-1">
                Analyse complète du client {client.name}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" onClick={loadClientData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Profil client */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={client.avatar} />
                <AvatarFallback className="text-lg">
                  {client.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold">{client.name}</h2>
                  {getLoyaltyBadge(clientStats.loyaltyScore)}
                  <Badge variant={client.isActive ? 'default' : 'secondary'}>
                    {client.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{client.company || 'Particulier'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{client.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Client depuis {formatDate(client.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button onClick={() => setShowEditClient(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques clés */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(clientStats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Dépensé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(clientStats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Par commande</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Commande</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {clientStats.lastOrderDate ? formatDate(clientStats.lastOrderDate) : 'Aucune'}
            </div>
            <p className="text-xs text-muted-foreground">Date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégorie Favorite</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{clientStats.favoriteCategory}</div>
            <p className="text-xs text-muted-foreground">Préférée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Fidélité</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.loyaltyScore}/100</div>
            <Progress value={clientStats.loyaltyScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Taux</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orders">Commandes ({orders.length})</TabsTrigger>
          <TabsTrigger value="financial">Données Financières</TabsTrigger>
          <TabsTrigger value="activity">Activité Web</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nom complet</Label>
                    <p className="text-sm">{client.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{client.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Téléphone</Label>
                    <p className="text-sm">{client.phone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Entreprise</Label>
                    <p className="text-sm">{client.company || 'Particulier'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Rôle</Label>
                    <p className="text-sm">{client.role}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Statut</Label>
                    <Badge variant={client.isActive ? 'default' : 'secondary'}>
                      {client.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                
                {client.address && (
                  <div>
                    <Label className="text-sm font-medium">Adresse</Label>
                    <p className="text-sm">
                      {client.address.street}<br />
                      {client.address.city}, {client.address.postalCode}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Résumé des commandes récentes */}
            <Card>
              <CardHeader>
                <CardTitle>Commandes Récentes</CardTitle>
                <CardDescription>Les 5 dernières commandes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Aucune commande</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Commandes</CardTitle>
              <CardDescription>Toutes les commandes du client</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{order.items?.length || 0} article(s)</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {orders.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune commande trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Données Financières</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Limite de crédit</Label>
                    <p className="text-lg font-bold">{formatCurrency(financialData.creditLimit || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Crédit utilisé</Label>
                    <p className="text-lg font-bold">{formatCurrency(financialData.usedCredit || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Crédit disponible</Label>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency((financialData.creditLimit || 0) - (financialData.usedCredit || 0))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Délai de paiement</Label>
                    <p className="text-lg font-bold">{financialData.paymentTerms || 30} jours</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium">Utilisation du crédit</Label>
                  <Progress 
                    value={((financialData.usedCredit || 0) / (financialData.creditLimit || 1)) * 100} 
                    className="mt-2" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(((financialData.usedCredit || 0) / (financialData.creditLimit || 1)) * 100)}% utilisé
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.payments?.slice(0, 5).map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{payment.reference}</div>
                        <div className="text-sm text-gray-500">{formatDate(payment.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status === 'paid' ? 'Payé' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-gray-500 py-4">Aucun paiement enregistré</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité Web</CardTitle>
              <CardDescription>Historique de navigation et d'interaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.type === 'page_view' && <Globe className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'product_view' && <Eye className="h-4 w-4 text-green-600" />}
                      {activity.type === 'cart_add' && <ShoppingCart className="h-4 w-4 text-orange-600" />}
                      {activity.type === 'search' && <Target className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{activity.title}</h4>
                        <span className="text-sm text-gray-500">{formatDateTime(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      {activity.device && (
                        <div className="flex items-center space-x-2 mt-2">
                          {activity.device === 'mobile' && <Smartphone className="h-3 w-3 text-gray-400" />}
                          {activity.device === 'tablet' && <Tablet className="h-3 w-3 text-gray-400" />}
                          {activity.device === 'desktop' && <Monitor className="h-3 w-3 text-gray-400" />}
                          <span className="text-xs text-gray-500">{activity.device}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {webActivity.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune activité web enregistrée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notes et Commentaires</h3>
            <Button onClick={() => setShowAddNote(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une note
            </Button>
          </div>
          
          <div className="space-y-4">
            {notes.map((note, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm">{note.content}</p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{note.author?.name || 'Administrateur'}</span>
                        <span>•</span>
                        <span>{formatDateTime(note.createdAt)}</span>
                      </div>
                    </div>
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {notes.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune note ajoutée</p>
                  <Button className="mt-4" onClick={() => setShowAddNote(true)}>
                    Ajouter la première note
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Commandes</CardTitle>
                <CardDescription>Nombre de commandes par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mb-4" />
                  <p>Graphique des commandes mensuelles</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Catégorie</CardTitle>
                <CardDescription>Achats par catégorie de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <PieChart className="h-16 w-16 mb-4" />
                  <p>Graphique en secteurs des catégories</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog d'édition du client */}
      <Dialog open={showEditClient} onOpenChange={setShowEditClient}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le Client</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations du client
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Nom complet</Label>
              <Input
                id="edit-name"
                value={editingClient.name || ''}
                onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingClient.email || ''}
                onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={editingClient.phone || ''}
                onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-company">Entreprise</Label>
              <Input
                id="edit-company"
                value={editingClient.company || ''}
                onChange={(e) => setEditingClient({...editingClient, company: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditClient(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateClient}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajout de note */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Note</DialogTitle>
            <DialogDescription>
              Ajouter un commentaire ou une observation sur ce client
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="new-note">Note</Label>
            <Textarea
              id="new-note"
              placeholder="Saisir votre note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNote(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClient360;