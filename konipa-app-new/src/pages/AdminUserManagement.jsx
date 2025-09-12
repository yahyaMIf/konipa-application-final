import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, Eye, UserCheck, UserX, 
  Shield, Key, Download, Upload, RefreshCw, MoreVertical, Mail,
  Phone, Calendar, DollarSign, AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
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
import { toast } from 'react-hot-toast';

const AdminUserManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [accountRequests, setAccountRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showLinkSageDialog, setShowLinkSageDialog] = useState(false);
  const [linkingSageUser, setLinkingSageUser] = useState(null);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'client',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    creditLimit: 0,
    assignedRepId: ''
  });

  const [sageLink, setSageLink] = useState({
    sageClientCode: '',
    notes: ''
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
    loadUsers();
    loadAccountRequests();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('users');
      // Extraire les données de la réponse API
      const data = response.data || {};
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadAccountRequests = async () => {
    try {
      const response = await apiService.get('account-requests');
      // Extraire les données de la réponse API
      const data = response.data || {};
      setAccountRequests(data.requests || data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de compte:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (statusFilter) {
          case 'active':
            return user.status === 'active';
          case 'inactive':
            return user.status === 'inactive';
          case 'blocked':
            return user.status === 'blocked';
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      const response = await apiService.post('users', newUser);
      console.log('Create user response:', response);
      toast.success('Utilisateur créé avec succès');
      setShowCreateDialog(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'client',
        company: '',
        address: '',
        city: '',
        postalCode: '',
        creditLimit: 0,
        assignedRepId: ''
      });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleEditUser = async () => {
    try {
      const response = await apiService.put(`users/${editingUser.id}`, editingUser);
      console.log('Edit user response:', response);
      toast.success('Utilisateur modifié avec succès');
      setShowEditDialog(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error editing user:', error);
      toast.error('Erreur lors de la modification de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await apiService.delete(`users/${userId}`);
        console.log('Delete user response:', response);
        toast.success('Utilisateur supprimé avec succès');
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleToggleUserStatus = async (userId, newStatus) => {
    try {
      await apiService.patch(`users/${userId}/status`, { status: newStatus });
      toast.success(`Utilisateur ${newStatus === 'blocked' ? 'bloqué' : 'débloqué'} avec succès`);
      loadUsers();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleLinkToSage = async () => {
    try {
      await apiService.post(`users/${linkingSageUser.id}/link-sage`, sageLink);
      toast.success('Liaison Sage effectuée avec succès');
      setShowLinkSageDialog(false);
      setLinkingSageUser(null);
      setSageLink({ sageClientCode: '', notes: '' });
      loadUsers();
    } catch (error) {
      toast.error('Erreur lors de la liaison Sage');
    }
  };

  const handleApproveAccountRequest = async (requestId) => {
    try {
      await apiService.post(`account-requests/${requestId}/approve`);
      toast.success('Demande de compte approuvée');
      loadAccountRequests();
      loadUsers();
    } catch (error) {
      toast.error('Erreur lors de l\'approbation de la demande');
    }
  };

  const handleRejectAccountRequest = async (requestId) => {
    try {
      await apiService.post(`account-requests/${requestId}/reject`);
      toast.success('Demande de compte rejetée');
      loadAccountRequests();
    } catch (error) {
      toast.error('Erreur lors du rejet de la demande');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount || 0);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'commercial': return 'bg-blue-100 text-blue-800';
      case 'comptoir': return 'bg-green-100 text-green-800';
      case 'comptabilite': return 'bg-purple-100 text-purple-800';
      case 'client': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des utilisateurs...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-2">
              Gérez tous les utilisateurs de la plateforme
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Utilisateur
            </Button>
            <Button variant="outline" onClick={loadUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Demandes de Compte ({accountRequests.length})
            {accountRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500">{accountRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
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
                      placeholder="Nom, email, entreprise..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="role-filter">Rôle</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les rôles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="comptoir">Comptoir</SelectItem>
                      <SelectItem value="comptabilite">Comptabilité</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status-filter">Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="blocked">Bloqué</SelectItem>
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

          {/* Tableau des utilisateurs */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière Connexion</TableHead>
                    <TableHead>CA Généré</TableHead>
                    <TableHead>Encours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.company && (
                              <div className="text-sm text-gray-500">{user.company}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLogin ? 
                            new Date(user.lastLogin).toLocaleDateString('fr-FR') : 
                            'Jamais'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(user.totalRevenue || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(user.currentBalance || 0)}
                        </div>
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
                                setEditingUser(user);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setLinkingSageUser(user);
                                setShowLinkSageDialog(true);
                              }}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Lier à Sage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'blocked' ? (
                              <DropdownMenuItem
                                onClick={() => handleToggleUserStatus(user.id, 'active')}
                                className="text-green-600"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Débloquer
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleToggleUserStatus(user.id, 'blocked')}
                                className="text-red-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Bloquer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
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

        <TabsContent value="requests" className="space-y-6">
          {/* Demandes de création de compte */}
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Création de Compte</CardTitle>
              <CardDescription>
                Gérez les demandes de création de compte soumises par les prospects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accountRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune demande en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accountRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {request.firstName} {request.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{request.email}</p>
                          <p className="text-sm text-gray-600">{request.company}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Demandé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveAccountRequest(request.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectAccountRequest(request.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de création d'utilisateur */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un Nouvel Utilisateur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau client, représentant ou membre de l'équipe
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={newUser.firstName}
                onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={newUser.lastName}
                onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="comptoir">Comptoir</SelectItem>
                  <SelectItem value="comptabilite">Comptabilité</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                value={newUser.company}
                onChange={(e) => setNewUser({...newUser, company: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={newUser.address}
                onChange={(e) => setNewUser({...newUser, address: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={newUser.city}
                onChange={(e) => setNewUser({...newUser, city: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Code Postal</Label>
              <Input
                id="postalCode"
                value={newUser.postalCode}
                onChange={(e) => setNewUser({...newUser, postalCode: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser}>
              Créer l'Utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification d'utilisateur */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'Utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">Prénom</Label>
                <Input
                  id="edit-firstName"
                  value={editingUser.firstName || ''}
                  onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Nom</Label>
                <Input
                  id="edit-lastName"
                  value={editingUser.lastName || ''}
                  onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Rôle</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="comptoir">Comptoir</SelectItem>
                    <SelectItem value="comptabilite">Comptabilité</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditUser}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de liaison Sage */}
      <Dialog open={showLinkSageDialog} onOpenChange={setShowLinkSageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier à Sage</DialogTitle>
            <DialogDescription>
              Associez ce compte web à une fiche client Sage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sage-code">Code Client Sage</Label>
              <Input
                id="sage-code"
                value={sageLink.sageClientCode}
                onChange={(e) => setSageLink({...sageLink, sageClientCode: e.target.value})}
                placeholder="Ex: CLI001"
              />
            </div>
            <div>
              <Label htmlFor="sage-notes">Notes</Label>
              <Textarea
                id="sage-notes"
                value={sageLink.notes}
                onChange={(e) => setSageLink({...sageLink, notes: e.target.value})}
                placeholder="Notes sur la liaison..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkSageDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleLinkToSage}>
              Lier à Sage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;