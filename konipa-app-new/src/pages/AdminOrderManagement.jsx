import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, Filter, Eye, Edit, Truck, CheckCircle, 
  X, Clock, AlertTriangle, Package, MapPin, Phone, Mail,
  Calendar, DollarSign, User, Building, FileText, Download,
  RefreshCw, MoreVertical, ArrowUpDown, TrendingUp, TrendingDown,
  BarChart3, PieChart, Users, Target, Zap, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { toast } from 'react-hot-toast';

const AdminOrderManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [representativeFilter, setRepresentativeFilter] = useState('all');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0
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
    loadOrders();
    loadRepresentatives();
  }, []);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, searchTerm, statusFilter, dateFilter, representativeFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.orders.getAll();
      let orders = [];
      if (response.data && response.data.orders) {
        orders = response.data.orders;
      } else if (response.data && Array.isArray(response.data)) {
        orders = response.data;
      } else if (Array.isArray(response)) {
        orders = response;
      }
      setOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRepresentatives = async () => {
    try {
      const response = await apiService.users.getAll({ role: 'representative' });
      let representatives = [];
      if (response.data && response.data.users) {
        representatives = response.data.users;
      } else if (response.data && Array.isArray(response.data)) {
        representatives = response.data;
      }
      setRepresentatives(representatives);
    } catch (error) {
      console.error('Error loading representatives:', error);
      setRepresentatives([]);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtrage par représentant
    if (representativeFilter !== 'all') {
      filtered = filtered.filter(order => order.representativeId === representativeFilter);
    }

    // Filtrage par date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
      }
    }

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      confirmed: filteredOrders.filter(o => o.status === 'confirmed').length,
      shipped: filteredOrders.filter(o => o.status === 'shipped').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      averageOrderValue: 0
    };
    
    stats.averageOrderValue = stats.total > 0 ? stats.totalRevenue / stats.total : 0;
    setOrderStats(stats);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiService.orders.updateStatus(orderId, newStatus);
      toast.success('Statut de la commande mis à jour');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      // For bulk operations, we'll update each order individually since the API doesn't have a bulk endpoint
      const promises = selectedOrders.map(orderId => 
        apiService.orders.updateStatus(orderId, newStatus)
      );
      await Promise.all(promises);
      toast.success(`${selectedOrders.length} commandes mises à jour`);
      setSelectedOrders([]);
      setShowBulkActions(false);
      loadOrders();
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      toast.error('Erreur lors de la mise à jour en lot');
    }
  };

  const handleAssignRepresentative = async (orderId, representativeId) => {
    try {
      // Since there's no specific assign endpoint, we'll update the order
      await apiService.orders.update(orderId, { representative_id: representativeId });
      toast.success('Représentant assigné avec succès');
      loadOrders();
    } catch (error) {
      console.error('Error assigning representative:', error);
      toast.error('Erreur lors de l\'assignation du représentant');
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion Globale des Commandes</h1>
            <p className="text-gray-600 mt-2">
              Vue d'ensemble et gestion de toutes les commandes
            </p>
          </div>
          <div className="flex space-x-3">
            {selectedOrders.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowBulkActions(true)}
              >
                Actions en lot ({selectedOrders.length})
              </Button>
            )}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" onClick={loadOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">Commandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Validées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expédiées</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{orderStats.shipped}</div>
            <p className="text-xs text-muted-foreground">En transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
            <p className="text-xs text-muted-foreground">Terminées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annulées</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Échecs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(orderStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(orderStats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Par commande</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Commandes ({filteredOrders.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="representatives">Performance Représentants</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="N° commande, client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status-filter">Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmées</SelectItem>
                      <SelectItem value="shipped">Expédiées</SelectItem>
                      <SelectItem value="delivered">Livrées</SelectItem>
                      <SelectItem value="cancelled">Annulées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-filter">Période</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dates</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rep-filter">Représentant</Label>
                  <Select value={representativeFilter} onValueChange={setRepresentativeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les représentants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les représentants</SelectItem>
                      {representatives.map(rep => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" size="sm" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres avancés
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des commandes */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Représentant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {order.items?.length || 0} article(s)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{order.client?.name}</div>
                            <div className="text-sm text-gray-500">{order.client?.company}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.representative ? (
                          <div className="text-sm">
                            <div className="font-medium">{order.representative.name}</div>
                            <div className="text-gray-500">{order.representative.email}</div>
                          </div>
                        ) : (
                          <Badge variant="outline">Non assigné</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                              disabled={order.status !== 'pending'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                              disabled={order.status !== 'confirmed'}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Expédier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              disabled={order.status !== 'shipped'}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Marquer livrée
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="text-red-600"
                              disabled={['delivered', 'cancelled'].includes(order.status)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Graphiques et analyses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Commandes</CardTitle>
                <CardDescription>Nombre de commandes par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mb-4" />
                  <p>Graphique des commandes par jour</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
                <CardDescription>Distribution des statuts de commandes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">En attente</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(orderStats.pending / orderStats.total) * 100} className="w-20" />
                      <span className="text-sm font-medium">{orderStats.pending}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confirmées</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(orderStats.confirmed / orderStats.total) * 100} className="w-20" />
                      <span className="text-sm font-medium">{orderStats.confirmed}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expédiées</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(orderStats.shipped / orderStats.total) * 100} className="w-20" />
                      <span className="text-sm font-medium">{orderStats.shipped}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Livrées</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(orderStats.delivered / orderStats.total) * 100} className="w-20" />
                      <span className="text-sm font-medium">{orderStats.delivered}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="representatives" className="space-y-6">
          {/* Performance des représentants */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {representatives.map((rep) => {
              const repOrders = orders.filter(order => order.representativeId === rep.id);
              const repRevenue = repOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
              
              return (
                <Card key={rep.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {rep.name}
                    </CardTitle>
                    <CardDescription>{rep.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Commandes:</span>
                        <span className="font-medium">{repOrders.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">CA généré:</span>
                        <span className="font-medium">{formatCurrency(repRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Panier moyen:</span>
                        <span className="font-medium">
                          {formatCurrency(repOrders.length > 0 ? repRevenue / repOrders.length : 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Taux de conversion:</span>
                        <span className="font-medium text-green-600">85%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog des détails de commande */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails de la Commande {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Informations complètes sur la commande
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informations Client</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nom:</span>
                      <span>{selectedOrder.client?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entreprise:</span>
                      <span>{selectedOrder.client?.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{selectedOrder.client?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Téléphone:</span>
                      <span>{selectedOrder.client?.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Adresse de Livraison</h4>
                  <div className="text-sm">
                    <p>{selectedOrder.deliveryAddress?.street}</p>
                    <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.postalCode}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Articles Commandés</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product?.designation} x{item.quantity}</span>
                        <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog des actions en lot */}
      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actions en Lot</DialogTitle>
            <DialogDescription>
              Appliquer une action à {selectedOrders.length} commande(s) sélectionnée(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => handleBulkStatusUpdate('confirmed')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer toutes les commandes
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleBulkStatusUpdate('shipped')}
            >
              <Truck className="h-4 w-4 mr-2" />
              Marquer comme expédiées
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleBulkStatusUpdate('delivered')}
            >
              <Package className="h-4 w-4 mr-2" />
              Marquer comme livrées
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkActions(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrderManagement;