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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  SwapHoriz as SwapIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import substituteService from '../../services/substituteService';
import { useAuth } from '../../contexts/AuthContext';

const SubstituteList = ({ productId, onEdit, onAdd }) => {
  const { user } = useAuth();
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState(null);
  
  // Dialog de suppression
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [substituteToDelete, setSubstituteToDelete] = useState(null);
  
  // Dialog de modification rapide
  const [quickEditDialog, setQuickEditDialog] = useState(false);
  const [editingSubstitute, setEditingSubstitute] = useState(null);
  const [editForm, setEditForm] = useState({
    reason: '',
    priority: 1,
    isActive: true
  });

  useEffect(() => {
    if (productId) {
      loadSubstitutes();
    }
  }, [productId]);

  const loadSubstitutes = async () => {
    try {
      setLoading(true);
      const result = await substituteService.getSubstitutesByProduct(productId);
      
      if (result.success) {
        setSubstitutes(result.data);
        setError('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des substituts');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, substitute) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubstitute(substitute);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubstitute(null);
  };

  const handleEdit = (substitute) => {
    handleMenuClose();
    if (onEdit) {
      onEdit(substitute);
    } else {
      // Édition rapide
      setEditingSubstitute(substitute);
      setEditForm({
        reason: substitute.reason || '',
        priority: substitute.priority || 1,
        isActive: substitute.isActive !== false
      });
      setQuickEditDialog(true);
    }
  };

  const handleDelete = (substitute) => {
    handleMenuClose();
    setSubstituteToDelete(substitute);
    setDeleteDialog(true);
  };

  const handleToggleActive = async (substitute) => {
    try {
      setActionLoading(true);
      const result = await substituteService.toggleSubstituteActive(
        substitute.id,
        !substitute.isActive
      );
      
      if (result.success) {
        setSuccess(`Substitut ${substitute.isActive ? 'désactivé' : 'activé'} avec succès`);
        loadSubstitutes();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de la modification du statut');
    } finally {
      setActionLoading(false);
    }
    handleMenuClose();
  };

  const handlePriorityChange = async (substitute, direction) => {
    try {
      setActionLoading(true);
      const newPriority = direction === 'up' ? 
        Math.max(1, substitute.priority - 1) : 
        substitute.priority + 1;
      
      const result = await substituteService.updateSubstitutePriority(
        substitute.id,
        newPriority
      );
      
      if (result.success) {
        setSuccess('Priorité mise à jour avec succès');
        loadSubstitutes();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de la modification de la priorité');
    } finally {
      setActionLoading(false);
    }
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!substituteToDelete) return;
    
    try {
      setActionLoading(true);
      const result = await substituteService.deleteSubstitute(substituteToDelete.id);
      
      if (result.success) {
        setSuccess('Substitut supprimé avec succès');
        loadSubstitutes();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
      setDeleteDialog(false);
      setSubstituteToDelete(null);
    }
  };

  const handleQuickEdit = async () => {
    if (!editingSubstitute) return;
    
    try {
      setActionLoading(true);
      const result = await substituteService.updateSubstitute(editingSubstitute.id, {
        reason: editForm.reason,
        priority: editForm.priority,
        isActive: editForm.isActive
      });
      
      if (result.success) {
        setSuccess('Substitut mis à jour avec succès');
        loadSubstitutes();
        setQuickEditDialog(false);
        setEditingSubstitute(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  const canManageSubstitutes = () => {
    return user && ['admin', 'manager'].includes(user.role);
  };

  const getReasonOptions = () => {
    return substituteService.getReasonOptions();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Produits de substitution ({substitutes.length})
        </Typography>
        
        {canManageSubstitutes() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onAdd && onAdd()}
            size="small"
          >
            Ajouter un substitut
          </Button>
        )}
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

      {/* Liste des substituts */}
      {substitutes.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
              Aucun produit de substitution configuré
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Produit de substitution</TableCell>
                <TableCell>Raison</TableCell>
                <TableCell align="center">Priorité</TableCell>
                <TableCell align="center">Statut</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {substitutes.map((substitute) => (
                <TableRow key={substitute.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={substitute.substituteProduct?.imageUrl}
                        alt={substitute.substituteProduct?.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        {substitute.substituteProduct?.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {substitute.substituteProduct?.name || 'Produit inconnu'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Réf: {substitute.substituteProduct?.reference || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {substitute.reason || '-'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      {canManageSubstitutes() && (
                        <>
                          <Tooltip title="Augmenter la priorité">
                            <IconButton
                              size="small"
                              onClick={() => handlePriorityChange(substitute, 'up')}
                              disabled={actionLoading || substitute.priority === 1}
                            >
                              <ArrowUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Typography variant="body2" fontWeight="medium" mx={1}>
                            {substitute.priority}
                          </Typography>
                          
                          <Tooltip title="Diminuer la priorité">
                            <IconButton
                              size="small"
                              onClick={() => handlePriorityChange(substitute, 'down')}
                              disabled={actionLoading}
                            >
                              <ArrowDownIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {!canManageSubstitutes() && (
                        <Typography variant="body2">
                          {substitute.priority}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={substitute.isActive !== false ? 'Actif' : 'Inactif'}
                      color={substitute.isActive !== false ? 'success' : 'default'}
                      size="small"
                      icon={substitute.isActive !== false ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(substitute.createdAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    {canManageSubstitutes() && (
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, substitute)}
                        disabled={actionLoading}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(selectedSubstitute)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Modifier
        </MenuItem>
        
        <MenuItem onClick={() => handleToggleActive(selectedSubstitute)}>
          {selectedSubstitute?.isActive !== false ? (
            <VisibilityOffIcon sx={{ mr: 1 }} fontSize="small" />
          ) : (
            <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          )}
          {selectedSubstitute?.isActive !== false ? 'Désactiver' : 'Activer'}
        </MenuItem>
        
        <MenuItem onClick={() => handleDelete(selectedSubstitute)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog de suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce substitut ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={actionLoading}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'édition rapide */}
      <Dialog open={quickEditDialog} onClose={() => setQuickEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le substitut</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Raison de substitution</InputLabel>
              <Select
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                label="Raison de substitution"
              >
                {getReasonOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Priorité"
              type="number"
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
              fullWidth
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
              }
              label="Actif"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickEditDialog(false)}>Annuler</Button>
          <Button
            onClick={handleQuickEdit}
            variant="contained"
            disabled={actionLoading}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubstituteList;