import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Pagination,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DocumentService from '../../services/DocumentService';
import ClientService from '../../services/ClientService';
import { useAuth } from '../../contexts/AuthContext';

const DocumentList = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const limit = 10;
  
  // Filtres
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Menu actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Dialog de confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  useEffect(() => {
    loadDocuments();
    loadClients();
  }, [page, filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...filters
      };
      
      // Nettoyer les paramètres vides
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const result = await DocumentService.getDocuments(params);
      
      if (result.success) {
        setDocuments(result.data.documents || []);
        setTotalPages(result.data.totalPages || 1);
        setTotalDocuments(result.data.total || 0);
        setError('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    // Ouvrir le document en mode lecture seule
    setSelectedDocument(document);
    setIsFormOpen(true);
  };

  const handleEditDocument = (document) => {
    // Ouvrir le document en mode édition
    setSelectedDocument(document);
    setIsFormOpen(true);
  };

  const loadClients = async () => {
    try {
      const result = await ClientService.getClients({ limit: 1000 });
      if (result.success) {
        setClients(result.data.clients || []);
      }
    } catch (err) {
      }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1); // Reset à la première page
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      clientId: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setPage(1);
  };

  const handleMenuOpen = (event, document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleStatusChange = async (documentId, newStatus) => {
    try {
      const result = await DocumentService.updateDocumentStatus(documentId, newStatus);
      
      if (result.success) {
        setSuccess(`Statut mis à jour avec succès`);
        loadDocuments();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
    }
    handleMenuClose();
  };

  const handleDeleteClick = (document) => {
    setDocumentToDelete(document);
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    try {
      const result = await DocumentService.deleteDocument(documentToDelete.id);
      
      if (result.success) {
        setSuccess('Document supprimé avec succès');
        loadDocuments();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de la suppression du document');
    }
    
    setDeleteDialog(false);
    setDocumentToDelete(null);
  };

  const handleDownloadPDF = async (documentId) => {
    try {
      const result = await DocumentService.generatePDF(documentId);
      
      if (result.success) {
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(new Blob([result.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `document-${documentId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      sent: 'info',
      viewed: 'warning',
      accepted: 'success',
      rejected: 'error',
      paid: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  const canEditDocument = (document) => {
    return DocumentService.canEditDocument(document) && 
           (user?.role === 'admin' || document.createdBy === user?.id);
  };

  const canDeleteDocument = (document) => {
    return DocumentService.canDeleteDocument(document) && 
           (user?.role === 'admin' || document.createdBy === user?.id);
  };

  return (
    <Box>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsFormOpen(true)}
        >
          Nouveau document
        </Button>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={showFilters ? 2 : 0}>
            <TextField
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtres
            </Button>
            {Object.values(filters).some(v => v) && (
              <Button
                variant="text"
                onClick={clearFilters}
                size="small"
              >
                Effacer
              </Button>
            )}
          </Box>

          {showFilters && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {DocumentService.getTypeOptions().map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {DocumentService.getStatusOptions().map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={filters.clientId}
                    onChange={(e) => handleFilterChange('clientId', e.target.value)}
                    label="Client"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {clients.map(client => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.companyName || client.contactName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date de début"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date de fin"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Tableau des documents */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Date émission</TableCell>
                      <TableCell>Date échéance</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucun document trouvé
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      documents.map((document) => (
                        <TableRow key={document.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {document.documentNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {DocumentService.getTypeLabel(document.type)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {document.client?.companyName || document.client?.contactName || 'Client inconnu'}
                            </Typography>
                            {document.client?.email && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {document.client.email}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(document.issueDate)}</TableCell>
                          <TableCell>{formatDate(document.dueDate)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(document.total, document.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={DocumentService.getStatusLabel(document.status)}
                              color={getStatusColor(document.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, document)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              )}

              {/* Informations de pagination */}
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Affichage de {Math.min((page - 1) * limit + 1, totalDocuments)} à{' '}
                  {Math.min(page * limit, totalDocuments)} sur {totalDocuments} documents
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Menu d'actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDocument(selectedDocument)}>
          <ViewIcon sx={{ mr: 1 }} />
          Voir
        </MenuItem>
        
        {selectedDocument && canEditDocument(selectedDocument) && (
          <MenuItem onClick={() => handleEditDocument(selectedDocument)}>
            <EditIcon sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
        )}
        
        <MenuItem onClick={() => handleDownloadPDF(selectedDocument?.id)}>
          <DownloadIcon sx={{ mr: 1 }} />
          Télécharger PDF
        </MenuItem>
        
        {selectedDocument?.status === 'draft' && (
          <MenuItem onClick={() => handleStatusChange(selectedDocument.id, 'sent')}>
            <SendIcon sx={{ mr: 1 }} />
            Marquer comme envoyé
          </MenuItem>
        )}
        
        {selectedDocument?.type === 'invoice' && selectedDocument?.status === 'sent' && (
          <MenuItem onClick={() => handleStatusChange(selectedDocument.id, 'paid')}>
            <PaymentIcon sx={{ mr: 1 }} />
            Marquer comme payé
          </MenuItem>
        )}
        
        {selectedDocument && !['paid', 'cancelled'].includes(selectedDocument.status) && (
          <MenuItem onClick={() => handleStatusChange(selectedDocument.id, 'cancelled')}>
            <CancelIcon sx={{ mr: 1 }} />
            Annuler
          </MenuItem>
        )}
        
        {selectedDocument && canDeleteDocument(selectedDocument) && (
          <MenuItem onClick={() => handleDeleteClick(selectedDocument)} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le document {documentToDelete?.documentNumber} ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentList;