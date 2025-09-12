import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Mail, Smartphone, Users, Target, Send,
  Plus, Edit, Trash2, Eye, Download, Upload, Calendar,
  Filter, Search, BarChart3, TrendingUp, Clock, CheckCircle,
  AlertCircle, RefreshCw, Settings, Image, Type, Link,
  Globe, Facebook, Instagram, Twitter, Youtube, Zap,
  Bell, Star, Gift, Percent, Tag, Megaphone, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import dataService from '../services/dataService';
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
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { toast } from 'react-hot-toast';

const AdminMarketing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [banners, setBanners] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateBanner, setShowCreateBanner] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email', // email, sms, whatsapp
    subject: '',
    content: '',
    targetAudience: 'all', // all, segment, custom
    scheduledDate: '',
    isActive: true
  });
  
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    position: 'header', // header, sidebar, footer, popup
    isActive: true,
    startDate: '',
    endDate: ''
  });
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    variables: []
  });
  
  const [marketingStats, setMarketingStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
    activeBanners: 0,
    bannerClicks: 0
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
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      setLoading(true);
      
      const [campaignsResponse, bannersResponse, templatesResponse, customersResponse, statsResponse] = await Promise.all([
        dataService.marketing.getCampaigns(),
        dataService.marketing.getBanners(),
        dataService.marketing.getTemplates(),
        dataService.client.getClients(),
        dataService.marketing.getStats()
      ]);
      
      setCampaigns(campaignsResponse || []);
      setBanners(bannersResponse || []);
      setTemplates(templatesResponse || []);
      setCustomers(customersResponse || []);
      setMarketingStats(statsResponse || marketingStats);
      
    } catch (error) {
      toast.error('Erreur lors du chargement des données marketing');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const campaignData = {
        ...newCampaign,
        targetCustomers: selectedCustomers,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };
      
      await apiService.post('admin/marketing/campaigns', campaignData);
      
      setCampaigns([campaignData, ...campaigns]);
      setNewCampaign({
        name: '',
        type: 'email',
        subject: '',
        content: '',
        targetAudience: 'all',
        scheduledDate: '',
        isActive: true
      });
      setSelectedCustomers([]);
      setShowCreateCampaign(false);
      toast.success('Campagne créée avec succès');
      
    } catch (error) {
      toast.error('Erreur lors de la création de la campagne');
    }
  };

  const handleCreateBanner = async () => {
    try {
      const bannerData = {
        ...newBanner,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };
      
      await apiService.post('admin/marketing/banners', bannerData);
      
      setBanners([bannerData, ...banners]);
      setNewBanner({
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        position: 'header',
        isActive: true,
        startDate: '',
        endDate: ''
      });
      setShowCreateBanner(false);
      toast.success('Bannière créée avec succès');
      
    } catch (error) {
      toast.error('Erreur lors de la création de la bannière');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const templateData = {
        ...newTemplate,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };
      
      await apiService.post('admin/marketing/templates', templateData);
      
      setTemplates([templateData, ...templates]);
      setNewTemplate({
        name: '',
        type: 'email',
        subject: '',
        content: '',
        variables: []
      });
      setShowCreateTemplate(false);
      toast.success('Modèle créé avec succès');
      
    } catch (error) {
      toast.error('Erreur lors de la création du modèle');
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      await apiService.post(`admin/marketing/campaigns/${campaignId}/send`);
      toast.success('Campagne envoyée avec succès');
      loadMarketingData();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la campagne');
    }
  };

  const handleToggleBanner = async (bannerId, isActive) => {
    try {
      await apiService.put(`admin/marketing/banners/${bannerId}`, { isActive });
      setBanners(banners.map(banner => 
        banner.id === bannerId ? { ...banner, isActive } : banner
      ));
      toast.success(`Bannière ${isActive ? 'activée' : 'désactivée'}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la bannière');
    }
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
      draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      scheduled: { label: 'Programmée', color: 'bg-blue-100 text-blue-800' },
      sent: { label: 'Envoyée', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Échec', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <Smartphone className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesType = filterType === 'all' || campaign.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des outils marketing...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Outils Marketing & Communication</h1>
            <p className="text-gray-600 mt-1">
              Gestion des campagnes, bannières et communications clients
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" onClick={loadMarketingData}>
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
            <CardTitle className="text-sm font-medium">Campagnes</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Envoyés</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.openRate}%</div>
            <p className="text-xs text-muted-foreground">Moyenne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Clic</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.clickRate}%</div>
            <p className="text-xs text-muted-foreground">Moyenne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Taux</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bannières</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.activeBanners}</div>
            <p className="text-xs text-muted-foreground">Actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics Bannières</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.bannerClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campagnes ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="banners">Bannières ({banners.length})</TabsTrigger>
          <TabsTrigger value="templates">Modèles ({templates.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Filtres et actions pour les campagnes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher une campagne..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="scheduled">Programmée</SelectItem>
                      <SelectItem value="sent">Envoyée</SelectItem>
                      <SelectItem value="failed">Échec</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setShowCreateCampaign(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Campagne
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Programmée</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(campaign.type)}
                          <span className="capitalize">{campaign.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {campaign.targetCustomers?.length || 0} clients
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        {campaign.scheduledDate ? formatDateTime(campaign.scheduledDate) : 'Immédiat'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Ouvertures: {campaign.openRate || 0}%</div>
                          <div>Clics: {campaign.clickRate || 0}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {campaign.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredCampaigns.length === 0 && (
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune campagne trouvée</p>
                  <Button className="mt-4" onClick={() => setShowCreateCampaign(true)}>
                    Créer la première campagne
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          {/* Gestion des bannières */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bannières & Promotions</CardTitle>
                  <CardDescription>Gestion des bannières publicitaires et promotionnelles</CardDescription>
                </div>
                <Button onClick={() => setShowCreateBanner(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Bannière
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBanners.map((banner) => (
                  <Card key={banner.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {banner.imageUrl ? (
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{banner.title}</h3>
                        <Switch 
                          checked={banner.isActive}
                          onCheckedChange={(checked) => handleToggleBanner(banner.id, checked)}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{banner.description}</p>
                      <div className="space-y-2 text-xs text-gray-500">
                        <div>Position: {banner.position}</div>
                        <div>Du {formatDate(banner.startDate)} au {formatDate(banner.endDate)}</div>
                        <div>Clics: {banner.clicks || 0}</div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredBanners.length === 0 && (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune bannière trouvée</p>
                  <Button className="mt-4" onClick={() => setShowCreateBanner(true)}>
                    Créer la première bannière
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Modèles de messages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modèles de Messages</CardTitle>
                  <CardDescription>Modèles réutilisables pour vos campagnes</CardDescription>
                </div>
                <Button onClick={() => setShowCreateTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Modèle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(template.type)}
                          <h3 className="font-semibold">{template.name}</h3>
                        </div>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      
                      {template.subject && (
                        <div className="mb-2">
                          <Label className="text-xs font-medium">Sujet:</Label>
                          <p className="text-sm text-gray-600">{template.subject}</p>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <Label className="text-xs font-medium">Contenu:</Label>
                        <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                      </div>
                      
                      {template.variables?.length > 0 && (
                        <div className="mb-3">
                          <Label className="text-xs font-medium">Variables:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.variables.map((variable, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {templates.length === 0 && (
                <div className="text-center py-8">
                  <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun modèle trouvé</p>
                  <Button className="mt-4" onClick={() => setShowCreateTemplate(true)}>
                    Créer le premier modèle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analyses et rapports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Campagnes</CardTitle>
                <CardDescription>Évolution des taux d'engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mb-4" />
                  <p>Graphique des performances</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Canal</CardTitle>
                <CardDescription>Distribution des messages par type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mb-4" />
                  <p>Graphique en secteurs</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement par Segment</CardTitle>
                <CardDescription>Performance par segment client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mb-4" />
                  <p>Graphique de segments</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI des Campagnes</CardTitle>
                <CardDescription>Retour sur investissement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <TrendingUp className="h-16 w-16 mb-4" />
                  <p>Graphique ROI</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de création de campagne */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une Nouvelle Campagne</DialogTitle>
            <DialogDescription>
              Configurez votre campagne de communication
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign-name">Nom de la campagne</Label>
                <Input
                  id="campaign-name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Ex: Promotion Été 2024"
                />
              </div>
              <div>
                <Label htmlFor="campaign-type">Type de campagne</Label>
                <Select value={newCampaign.type} onValueChange={(value) => setNewCampaign({...newCampaign, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {newCampaign.type === 'email' && (
              <div>
                <Label htmlFor="campaign-subject">Sujet</Label>
                <Input
                  id="campaign-subject"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                  placeholder="Sujet de l'email"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="campaign-content">Contenu du message</Label>
              <Textarea
                id="campaign-content"
                value={newCampaign.content}
                onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                placeholder="Rédigez votre message..."
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign-audience">Audience cible</Label>
                <Select value={newCampaign.targetAudience} onValueChange={(value) => setNewCampaign({...newCampaign, targetAudience: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    <SelectItem value="active">Clients actifs</SelectItem>
                    <SelectItem value="inactive">Clients inactifs</SelectItem>
                    <SelectItem value="vip">Clients VIP</SelectItem>
                    <SelectItem value="custom">Sélection personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="campaign-schedule">Programmation</Label>
                <Input
                  id="campaign-schedule"
                  type="datetime-local"
                  value={newCampaign.scheduledDate}
                  onChange={(e) => setNewCampaign({...newCampaign, scheduledDate: e.target.value})}
                />
              </div>
            </div>
            
            {newCampaign.targetAudience === 'custom' && (
              <div>
                <Label>Sélectionner les clients</Label>
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCustomers([...selectedCustomers, customer.id]);
                          } else {
                            setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                          }
                        }}
                      />
                      <span className="text-sm">{customer.name} ({customer.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || !newCampaign.content}>
              <Plus className="h-4 w-4 mr-2" />
              Créer la Campagne
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de bannière */}
      <Dialog open={showCreateBanner} onOpenChange={setShowCreateBanner}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une Nouvelle Bannière</DialogTitle>
            <DialogDescription>
              Configurez votre bannière publicitaire
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banner-title">Titre</Label>
                <Input
                  id="banner-title"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({...newBanner, title: e.target.value})}
                  placeholder="Titre de la bannière"
                />
              </div>
              <div>
                <Label htmlFor="banner-position">Position</Label>
                <Select value={newBanner.position} onValueChange={(value) => setNewBanner({...newBanner, position: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">En-tête</SelectItem>
                    <SelectItem value="sidebar">Barre latérale</SelectItem>
                    <SelectItem value="footer">Pied de page</SelectItem>
                    <SelectItem value="popup">Pop-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="banner-description">Description</Label>
              <Textarea
                id="banner-description"
                value={newBanner.description}
                onChange={(e) => setNewBanner({...newBanner, description: e.target.value})}
                placeholder="Description de la bannière"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banner-image">URL de l'image</Label>
                <Input
                  id="banner-image"
                  value={newBanner.imageUrl}
                  onChange={(e) => setNewBanner({...newBanner, imageUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="banner-link">Lien de destination</Label>
                <Input
                  id="banner-link"
                  value={newBanner.linkUrl}
                  onChange={(e) => setNewBanner({...newBanner, linkUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banner-start">Date de début</Label>
                <Input
                  id="banner-start"
                  type="date"
                  value={newBanner.startDate}
                  onChange={(e) => setNewBanner({...newBanner, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="banner-end">Date de fin</Label>
                <Input
                  id="banner-end"
                  type="date"
                  value={newBanner.endDate}
                  onChange={(e) => setNewBanner({...newBanner, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={newBanner.isActive}
                onCheckedChange={(checked) => setNewBanner({...newBanner, isActive: checked})}
              />
              <Label>Activer immédiatement</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBanner(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateBanner} disabled={!newBanner.title}>
              <Plus className="h-4 w-4 mr-2" />
              Créer la Bannière
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de modèle */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un Nouveau Modèle</DialogTitle>
            <DialogDescription>
              Créez un modèle réutilisable pour vos campagnes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Nom du modèle</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Ex: Bienvenue nouveau client"
                />
              </div>
              <div>
                <Label htmlFor="template-type">Type</Label>
                <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {newTemplate.type === 'email' && (
              <div>
                <Label htmlFor="template-subject">Sujet</Label>
                <Input
                  id="template-subject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                  placeholder="Sujet du modèle"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="template-content">Contenu</Label>
              <Textarea
                id="template-content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                placeholder="Contenu du modèle avec variables: {{nom}}, {{email}}, etc."
                rows={6}
              />
            </div>
            
            <div>
              <Label>Variables disponibles</Label>
              <p className="text-sm text-gray-500 mb-2">
                Utilisez ces variables dans votre contenu: {'{nom}'}, {'{email}'}, {'{entreprise}'}, {'{date}'}
              </p>
              <div className="flex flex-wrap gap-2">
                {['{nom}', '{email}', '{entreprise}', '{date}', '{commande}'].map((variable) => (
                  <Badge key={variable} variant="secondary" className="cursor-pointer"
                    onClick={() => setNewTemplate({...newTemplate, content: newTemplate.content + ' {{' + variable + '}}' })}
                  >
                    {'{' + variable + '}'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.content}>
              <Plus className="h-4 w-4 mr-2" />
              Créer le Modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMarketing;