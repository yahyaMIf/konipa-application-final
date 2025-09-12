import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import DocumentService from '../../services/DocumentService';
import ClientService from '../../services/ClientService';
import ProductService from '../../services/ProductService';
import { useAuth } from '../../contexts/AuthContext';

const DocumentForm = ({ documentId, onSave, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    type: 'quote',
    clientId: '',
    orderId: '',
    issueDate: new Date(),
    dueDate: null,
    currency: 'EUR',
    notes: '',
    items: []
  });
  
  // Données de référence
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // État des totaux
  const [totals, setTotals] = useState({
    subtotal: 0,
    vatAmount: 0,
    total: 0
  });
  
  // Dialog d'ajout de produit
  const [productDialog, setProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productDiscount, setProductDiscount] = useState(0);
  
  const isEditing = Boolean(documentId);

  useEffect(() => {
    loadReferenceData();
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const loadReferenceData = async () => {
    try {
      const [clientsResult, productsResult] = await Promise.all([
        ClientService.getClients({ limit: 1000 }),
        ProductService.getProducts({ limit: 1000 })
      ]);
      
      if (clientsResult.success) {
        setClients(clientsResult.data.clients || []);
      }
      
      if (productsResult.success) {
        setProducts(productsResult.data.products || []);
      }
    } catch (err) {
      }
  };

  const loadDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentService.getDocument(documentId);
      
      if (result.success) {
        const doc = result.data;
        setFormData({
          type: doc.type,
          clientId: doc.clientId,
          orderId: doc.orderId || '',
          issueDate: new Date(doc.issueDate),
          dueDate: doc.dueDate ? new Date(doc.dueDate) : null,
          currency: doc.currency || 'EUR',
          notes: doc.notes || '',
          items: doc.items || []
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!formData.items || formData.items.length === 0) {
      setTotals({ subtotal: 0, vatAmount: 0, total: 0 });
      return;
    }
    
    const calculated = DocumentService.calculateDocumentTotals(formData.items);
    setTotals(calculated);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Recalculer le total de la ligne
    const item = newItems[index];
    const itemSubtotal = item.quantity * item.unitPrice;
    const discountAmount = itemSubtotal * (item.discount || 0) / 100;
    const itemTotal = itemSubtotal - discountAmount;
    const itemVat = itemTotal * (item.vatRate || 20) / 100;
    
    newItems[index] = {
      ...item,
      totalPrice: itemTotal + itemVat
    };
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const newItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: productQuantity,
      unitPrice: selectedProduct.price || 0,
      discount: productDiscount,
      vatRate: 20, // TVA par défaut
      totalPrice: 0 // Sera calculé automatiquement
    };
    
    // Calculer le total de la ligne
    const itemSubtotal = newItem.quantity * newItem.unitPrice;
    const discountAmount = itemSubtotal * (newItem.discount || 0) / 100;
    const itemTotal = itemSubtotal - discountAmount;
    const itemVat = itemTotal * (newItem.vatRate || 20) / 100;
    newItem.totalPrice = itemTotal + itemVat;
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    // Reset du dialog
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductDiscount(0);
    setProductDialog(false);
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validation = DocumentService.validateDocumentData(formData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const documentData = {
        ...formData,
        issueDate: formData.issueDate.toISOString().split('T')[0],
        dueDate: formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : null,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total
      };
      
      let result;
      if (isEditing) {
        result = await DocumentService.updateDocument(documentId, documentData);
      } else {
        result = await DocumentService.createDocument(documentData);
      }
      
      if (result.success) {
        setSuccess(`Document ${isEditing ? 'mis à jour' : 'créé'} avec succès`);
        if (onSave) {
          onSave(result.data);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`Erreur lors de la ${isEditing ? 'mise à jour' : 'création'} du document`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box>
        {/* En-tête */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {isEditing ? 'Modifier le document' : 'Nouveau document'}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              sx={{ mr: 2 }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Box>
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

        <form onSubmit={handleSubmit}>
          {/* Informations générales */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations générales
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Type de document</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      label="Type de document"
                    >
                      {DocumentService.getTypeOptions().map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Client</InputLabel>
                    <Select
                      value={formData.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      label="Client"
                      required
                    >
                      {clients.map(client => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.companyName || client.contactName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Date d'émission"
                    value={formData.issueDate}
                    onChange={(date) => handleInputChange('issueDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Date d'échéance"
                    value={formData.dueDate}
                    onChange={(date) => handleInputChange('dueDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Devise</InputLabel>
                    <Select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      label="Devise"
                    >
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Notes ou commentaires..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Articles
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setProductDialog(true)}
                >
                  Ajouter un article
                </Button>
              </Box>
              
              {formData.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  Aucun article ajouté. Cliquez sur "Ajouter un article" pour commencer.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Produit</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Prix unitaire</TableCell>
                        <TableCell align="right">Remise (%)</TableCell>
                        <TableCell align="right">TVA (%)</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.productName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, step: 0.01 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>
                              }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, max: 100, step: 0.01 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.vatRate || 20}
                              onChange={(e) => handleItemChange(index, 'vatRate', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, max: 100, step: 0.01 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(item.totalPrice || 0, formData.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Totaux */}
          {formData.items.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Totaux
                </Typography>
                
                <Grid container spacing={2} justifyContent="flex-end">
                  <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Sous-total :</Typography>
                      <Typography fontWeight="medium">
                        {formatCurrency(totals.subtotal, formData.currency)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>TVA :</Typography>
                      <Typography fontWeight="medium">
                        {formatCurrency(totals.vatAmount, formData.currency)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Total :</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(totals.total, formData.currency)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </form>

        {/* Dialog d'ajout de produit */}
        <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un article</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => `${option.name} - ${formatCurrency(option.price || 0)}`}
                  value={selectedProduct}
                  onChange={(e, newValue) => setSelectedProduct(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Produit"
                      placeholder="Rechercher un produit..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantité"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseFloat(e.target.value) || 1)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Remise (%)"
                  value={productDiscount}
                  onChange={(e) => setProductDiscount(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProductDialog(false)}>Annuler</Button>
            <Button
              onClick={handleAddProduct}
              variant="contained"
              disabled={!selectedProduct}
            >
              Ajouter
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DocumentForm;