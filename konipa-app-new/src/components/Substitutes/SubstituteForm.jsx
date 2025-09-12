import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Autocomplete,
  Avatar,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import substituteService from '../../services/substituteService';
import ProductService from '../../services/ProductService';
import { useAuth } from '../../contexts/AuthContext';

const SubstituteForm = ({ productId, substituteId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [originalProduct, setOriginalProduct] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    originalProductId: productId || '',
    substituteProductId: '',
    reason: '',
    priority: 1,
    isActive: true,
    notes: ''
  });

  const [validation, setValidation] = useState({
    substituteProductId: '',
    reason: ''
  });

  useEffect(() => {
    if (productId) {
      loadOriginalProduct();
      searchProducts('');
    }
    
    if (substituteId) {
      loadSubstitute();
    }
  }, [productId, substituteId]);

  const loadOriginalProduct = async () => {
    try {
      const result = await ProductService.getProduct(productId);
      if (result.success) {
        setOriginalProduct(result.data);
      }
    } catch (err) {
      }
  };

  const loadSubstitute = async () => {
    try {
      setLoading(true);
      const result = await substituteService.getSubstitute(substituteId);
      
      if (result.success) {
        const substitute = result.data;
        setFormData({
          originalProductId: substitute.originalProductId,
          substituteProductId: substitute.substituteProductId,
          reason: substitute.reason || '',
          priority: substitute.priority || 1,
          isActive: substitute.isActive !== false,
          notes: substitute.notes || ''
        });
        
        // Charger le produit original si pas déjà fait
        if (!originalProduct && substitute.originalProductId) {
          const productResult = await ProductService.getProduct(substitute.originalProductId);
          if (productResult.success) {
            setOriginalProduct(productResult.data);
          }
        }
        
        // Ajouter le produit de substitution à la liste
        if (substitute.substituteProduct) {
          setAvailableProducts(prev => {
            const exists = prev.find(p => p.id === substitute.substituteProduct.id);
            if (!exists) {
              return [substitute.substituteProduct, ...prev];
            }
            return prev;
          });
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement du substitut');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query) => {
    try {
      setSearchLoading(true);
      const result = await substituteService.searchProductsForSubstitution(productId, query);
      
      if (result.success) {
        setAvailableProducts(result.data);
      }
    } catch (err) {
      } finally {
      setSearchLoading(false);
    }
  };

  const validateForm = () => {
    const newValidation = {
      substituteProductId: '',
      reason: ''
    };
    
    let isValid = true;
    
    if (!formData.substituteProductId) {
      newValidation.substituteProductId = 'Veuillez sélectionner un produit de substitution';
      isValid = false;
    }
    
    if (!formData.reason) {
      newValidation.reason = 'Veuillez indiquer la raison de la substitution';
      isValid = false;
    }
    
    setValidation(newValidation);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const submitData = {
        ...formData,
        priority: parseInt(formData.priority) || 1
      };
      
      let result;
      if (substituteId) {
        result = await substituteService.updateSubstitute(substituteId, submitData);
      } else {
        result = await substituteService.createSubstitute(submitData);
      }
      
      if (result.success) {
        setSuccess(`Substitut ${substituteId ? 'mis à jour' : 'créé'} avec succès`);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result.data);
          }
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validation[field]) {
      setValidation(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getReasonOptions = () => {
    return substituteService.getReasonOptions();
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const canManageSubstitutes = () => {
    return user && ['admin', 'manager'].includes(user.role);
  };

  if (!canManageSubstitutes()) {
    return (
      <Alert severity="error">
        Vous n'avez pas les permissions nécessaires pour gérer les substituts.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {substituteId ? 'Modifier le substitut' : 'Ajouter un substitut'}
      </Typography>

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

      {/* Produit original */}
      {originalProduct && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Produit original
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={originalProduct.imageUrl}
                alt={originalProduct.name}
                sx={{ width: 60, height: 60 }}
              >
                {originalProduct.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {originalProduct.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Réf: {originalProduct.reference}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prix: {formatCurrency(originalProduct.price)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Formulaire */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Sélection du produit de substitution */}
              <Grid item xs={12}>
                <Autocomplete
                  options={availableProducts}
                  getOptionLabel={(option) => `${option.name} (${option.reference})`}
                  value={availableProducts.find(p => p.id === formData.substituteProductId) || null}
                  onChange={(event, newValue) => {
                    handleInputChange('substituteProductId', newValue?.id || '');
                  }}
                  onInputChange={(event, newInputValue) => {
                    searchProducts(newInputValue);
                  }}
                  loading={searchLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Produit de substitution *"
                      error={!!validation.substituteProductId}
                      helperText={validation.substituteProductId}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Avatar
                        src={option.imageUrl}
                        alt={option.name}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        {option.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Réf: {option.reference} • Prix: {formatCurrency(option.price)}
                        </Typography>
                        {option.stock !== undefined && (
                          <Chip
                            label={`Stock: ${option.stock}`}
                            size="small"
                            color={option.stock > 0 ? 'success' : 'error'}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                  noOptionsText="Aucun produit trouvé"
                  loadingText="Recherche en cours..."
                />
              </Grid>

              {/* Raison de substitution */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!validation.reason}>
                  <InputLabel>Raison de substitution *</InputLabel>
                  <Select
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    label="Raison de substitution *"
                  >
                    {getReasonOptions().map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {validation.reason && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {validation.reason}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Priorité */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Priorité"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  inputProps={{ min: 1, max: 100 }}
                  fullWidth
                  helperText="Plus le nombre est faible, plus la priorité est élevée"
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Notes (optionnel)"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  fullWidth
                  placeholder="Informations complémentaires sur cette substitution..."
                />
              </Grid>

              {/* Statut actif */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                  }
                  label="Substitut actif"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Les substituts inactifs ne seront pas proposés automatiquement
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Boutons d'action */}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={loading}
              >
                Annuler
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  substituteId ? 'Mettre à jour' : 'Créer'
                )}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SubstituteForm;