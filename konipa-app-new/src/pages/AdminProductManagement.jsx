import React, { useState, useEffect } from 'react';
import {
  Package, Search, Filter, Plus, Edit, Trash2, Eye, Star,
  AlertTriangle, CheckCircle, X, Upload, Download, RefreshCw,
  MoreVertical, Tag, Percent, Calendar, Warehouse, Link2,
  TrendingUp, TrendingDown, BarChart3, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { toast } from 'react-hot-toast';

const AdminProductManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubstitutesDialog, setShowSubstitutesDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [managingSubstitutes, setManagingSubstitutes] = useState(null);
  const [managingPromotion, setManagingPromotion] = useState(null);

  const [newProduct, setNewProduct] = useState({
    reference: '',
    designation: '',
    description: '',
    category: '',
    basePrice: 0,
    unit: 'pièce',
    minStock: 0,
    isActive: true,
    image: ''
  });

  const [substitutes, setSubstitutes] = useState({
    productId: '',
    substitutes: ['', '', '', '', '']
  });

  const [promotion, setPromotion] = useState({
    productId: '',
    type: 'percentage', // percentage, fixed, quantity
    value: 0,
    startDate: '',
    endDate: '',
    maxQuantityPerClient: 0,
    isActive: true,
    description: ''
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
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Synchroniser le token avec apiService
      if (user?.token) {
        apiService.setToken(user.token);
      }

      const response = await apiService.products.getAll();
      let products = [];
      
      // Handle different response formats from backend
      if (response.data && response.data.products) {
        products = response.data.products;
      } else if (response.data && Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      } else if (Array.isArray(response)) {
        products = response;
      }
      
      setProducts(products);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Synchroniser le token avec apiService
      if (user?.token) {
        apiService.setToken(user.token);
      }

      const response = await apiService.products.getCategories();
      let categories = [];
      
      // Handle different response formats from backend
      if (response.data && response.data.categories) {
        categories = response.data.categories;
      } else if (response.data && Array.isArray(response.data)) {
        categories = response.data;
      } else if (Array.isArray(response)) {
        categories = response;
      }
      
      setCategories(categories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Filtrage par stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const totalStock = (product.stocks || []).reduce((sum, stock) => sum + stock.quantity, 0);
        switch (stockFilter) {
          case 'low':
            return totalStock <= product.minStock;
          case 'out':
            return totalStock === 0;
          case 'available':
            return totalStock > 0;
          default:
            return true;
        }
      });
    }

    setFilteredProducts(filtered);
  };

  const handleCreateProduct = async () => {
    try {
      await apiService.products.create(newProduct);
      toast.success('Produit créé avec succès');
      setShowCreateDialog(false);
      setNewProduct({
        reference: '',
        designation: '',
        description: '',
        category: '',
        basePrice: 0,
        unit: 'pièce',
        minStock: 0,
        isActive: true,
        image: ''
      });
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      toast.error('Erreur lors de la création du produit');
    }
  };

  const handleEditProduct = async () => {
    try {
      await apiService.products.update(editingProduct.id, editingProduct);
      toast.success('Produit modifié avec succès');
      setShowEditDialog(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la modification du produit:', error);
      toast.error('Erreur lors de la modification du produit');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await apiService.products.delete(productId);
        toast.success('Produit supprimé avec succès');
        loadProducts();
      } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        toast.error('Erreur lors de la suppression du produit');
      }
    }
  };

  const handleSaveSubstitutes = async () => {
    try {
      await apiService.post(`products/${substitutes.productId}/substitutes`, {
        substitutes: substitutes.substitutes.filter(sub => sub.trim() !== '')
      });
      toast.success('Substituts sauvegardés avec succès');
      setShowSubstitutesDialog(false);
      setManagingSubstitutes(null);
      setSubstitutes({ productId: '', substitutes: ['', '', '', '', ''] });
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des substituts:', error);
      toast.error('Erreur lors de la sauvegarde des substituts');
    }
  };

  const handleSavePromotion = async () => {
    try {
      await apiService.post(`products/${promotion.productId}/promotions`, promotion);
      toast.success('Promotion créée avec succès');
      setShowPromotionDialog(false);
      setManagingPromotion(null);
      setPromotion({
        productId: '',
        type: 'percentage',
        value: 0,
        startDate: '',
        endDate: '',
        maxQuantityPerClient: 0,
        isActive: true,
        description: ''
      });
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la création de la promotion:', error);
      toast.error('Erreur lors de la création de la promotion');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount || 0);
  };

  const getStockStatus = (product) => {
    const totalStock = (product.stocks || []).reduce((sum, stock) => sum + stock.quantity, 0);
    if (totalStock === 0) return { status: 'Rupture', color: 'bg-red-100 text-red-800' };
    if (totalStock <= product.minStock) return { status: 'Stock faible', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Disponible', color: 'bg-green-100 text-green-800' };
  };

  const getTotalStock = (product) => {
    return (product.stocks || []).reduce((sum, stock) => sum + stock.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des produits...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits & Catalogue</h1>
            <p className="text-gray-600 mt-2">
              Gérez votre catalogue de produits, stocks et promotions
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Produit
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button variant="outline" onClick={loadProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.isActive).length} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {products.filter(p => getTotalStock(p) <= p.minStock).length}
            </div>
            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => getTotalStock(p) === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Produits en rupture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotions Actives</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.hasActivePromotion).length}
            </div>
            <p className="text-xs text-muted-foreground">Offres en cours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Produits ({filteredProducts.length})</TabsTrigger>
          <TabsTrigger value="stocks">Gestion des Stocks</TabsTrigger>
          <TabsTrigger value="promotions">Promotions Actives</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Filtres et recherche */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Référence, désignation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category-filter">Catégorie</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stock-filter">Stock</Label>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les stocks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les stocks</SelectItem>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="low">Stock faible</SelectItem>
                      <SelectItem value="out">Rupture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des produits */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix HT</TableHead>
                    <TableHead>Stock Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const totalStock = getTotalStock(product);

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.designation}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.designation}</div>
                              <div className="text-sm text-gray-500">{product.reference}</div>
                              {product.hasActivePromotion && (
                                <Badge className="mt-1 bg-green-100 text-green-800">
                                  <Percent className="h-3 w-3 mr-1" />
                                  Promotion
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(product.basePrice)}
                          </div>
                          <div className="text-sm text-gray-500">/{product.unit}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{totalStock}</div>
                          <div className="text-sm text-gray-500">
                            Min: {product.minStock}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.status}
                          </Badge>
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
                                  setEditingProduct(product);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setManagingSubstitutes(product);
                                  setSubstitutes({
                                    productId: product.id,
                                    substitutes: product.substitutes || ['', '', '', '', '']
                                  });
                                  setShowSubstitutesDialog(true);
                                }}
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                Substituts
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setManagingPromotion(product);
                                  setPromotion({
                                    ...promotion,
                                    productId: product.id
                                  });
                                  setShowPromotionDialog(true);
                                }}
                              >
                                <Percent className="h-4 w-4 mr-2" />
                                Promotion
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocks" className="space-y-6">
          {/* Gestion des stocks par entrepôt */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Warehouse className="h-5 w-5 mr-2" />
                  Ibn Tachfine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Produits en stock:</span>
                    <span className="font-medium">245</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Valeur totale:</span>
                    <span className="font-medium">{formatCurrency(125000)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Ruptures:</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Warehouse className="h-5 w-5 mr-2" />
                  Drb Omar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Produits en stock:</span>
                    <span className="font-medium">189</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Valeur totale:</span>
                    <span className="font-medium">{formatCurrency(98000)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Ruptures:</span>
                    <span className="font-medium">8</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Warehouse className="h-5 w-5 mr-2" />
                  La Villette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Produits en stock:</span>
                    <span className="font-medium">312</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Valeur totale:</span>
                    <span className="font-medium">{formatCurrency(156000)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Ruptures:</span>
                    <span className="font-medium">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6">
          {/* Liste des promotions actives */}
          <Card>
            <CardHeader>
              <CardTitle>Promotions Actives</CardTitle>
              <CardDescription>
                Gérez les offres spéciales et promotions en cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.filter(p => p.hasActivePromotion).map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.designation}</h4>
                        <p className="text-sm text-gray-600">{product.reference}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-green-100 text-green-800">
                            -20% jusqu'au 31/12/2024
                          </Badge>
                          <Badge variant="outline">
                            Max 10 unités/client
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Désactiver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de création de produit */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un Nouveau Produit</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau produit au catalogue
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={newProduct.reference}
                onChange={(e) => setNewProduct({ ...newProduct, reference: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="designation">Désignation</Label>
              <Input
                id="designation"
                value={newProduct.designation}
                onChange={(e) => setNewProduct({ ...newProduct, designation: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="basePrice">Prix de base HT</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="unit">Unité</Label>
              <Select value={newProduct.unit} onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pièce">Pièce</SelectItem>
                  <SelectItem value="kg">Kilogramme</SelectItem>
                  <SelectItem value="litre">Litre</SelectItem>
                  <SelectItem value="mètre">Mètre</SelectItem>
                  <SelectItem value="m²">Mètre carré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="minStock">Stock minimum</Label>
              <Input
                id="minStock"
                type="number"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateProduct}>
              Créer le Produit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de gestion des substituts */}
      <Dialog open={showSubstitutesDialog} onOpenChange={setShowSubstitutesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestion des Substituts</DialogTitle>
            <DialogDescription>
              Définissez jusqu'à 5 produits de substitution
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {substitutes.substitutes.map((substitute, index) => (
              <div key={index}>
                <Label htmlFor={`substitute-${index}`}>Substitut {index + 1}</Label>
                <Input
                  id={`substitute-${index}`}
                  value={substitute}
                  onChange={(e) => {
                    const newSubstitutes = [...substitutes.substitutes];
                    newSubstitutes[index] = e.target.value;
                    setSubstitutes({ ...substitutes, substitutes: newSubstitutes });
                  }}
                  placeholder="Référence du produit substitut"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubstitutesDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSubstitutes}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de promotion */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une Promotion</DialogTitle>
            <DialogDescription>
              Définissez une offre spéciale pour ce produit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="promo-type">Type de promotion</Label>
              <Select value={promotion.type} onValueChange={(value) => setPromotion({ ...promotion, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage de réduction</SelectItem>
                  <SelectItem value="fixed">Montant fixe de réduction</SelectItem>
                  <SelectItem value="quantity">Offre quantité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="promo-value">Valeur</Label>
              <Input
                id="promo-value"
                type="number"
                value={promotion.value}
                onChange={(e) => setPromotion({ ...promotion, value: parseFloat(e.target.value) })}
                placeholder={promotion.type === 'percentage' ? 'Ex: 20 pour 20%' : 'Montant en MAD'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Date de début</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={promotion.startDate}
                  onChange={(e) => setPromotion({ ...promotion, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Date de fin</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={promotion.endDate}
                  onChange={(e) => setPromotion({ ...promotion, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="max-quantity">Quantité maximum par client</Label>
              <Input
                id="max-quantity"
                type="number"
                value={promotion.maxQuantityPerClient}
                onChange={(e) => setPromotion({ ...promotion, maxQuantityPerClient: parseInt(e.target.value) })}
                placeholder="0 = illimité"
              />
            </div>
            <div>
              <Label htmlFor="promo-description">Description</Label>
              <Textarea
                id="promo-description"
                value={promotion.description}
                onChange={(e) => setPromotion({ ...promotion, description: e.target.value })}
                placeholder="Description de la promotion..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromotionDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePromotion}>
              Créer la Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductManagement;