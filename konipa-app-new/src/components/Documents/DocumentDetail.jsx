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
  Grid,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  GetApp as DownloadIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DocumentService from '../../services/DocumentService';
import { useAuth } from '../../contexts/AuthContext';

const DocumentDetail = ({ documentId, onEdit, onBack }) => {
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentService.getDocument(documentId);
      
      if (result.success) {
        setDocument(result.data);
        setError('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      const result = await DocumentService.updateDocumentStatus(documentId, newStatus);
      
      if (result.success) {
        setSuccess(`Statut mis à jour avec succès`);
        setDocument(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setActionLoading(true);
      const result = await DocumentService.generatePDF(documentId);
      
      if (result.success) {
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(new Blob([result.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${document.documentNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
    } finally {
      setActionLoading(false);
    }
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

  const canEditDocument = () => {
    return document && DocumentService.canEditDocument(document) && 
           (user?.role === 'admin' || document.createdBy === user?.id);
  };

  const getAvailableActions = () => {
    if (!document) return [];
    
    const actions = [];
    
    if (document.status === 'draft') {
      actions.push({
        label: 'Marquer comme envoyé',
        icon: <SendIcon />,
        action: () => handleStatusChange('sent'),
        color: 'primary'
      });
    }
    
    if (document.type === 'invoice' && document.status === 'sent') {
      actions.push({
        label: 'Marquer comme payé',
        icon: <PaymentIcon />,
        action: () => handleStatusChange('paid'),
        color: 'success'
      });
    }
    
    if (!['paid', 'cancelled'].includes(document.status)) {
      actions.push({
        label: 'Annuler',
        icon: <CancelIcon />,
        action: () => handleStatusChange('cancelled'),
        color: 'error'
      });
    }
    
    return actions;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !document) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Retour
        </Button>
      </Box>
    );
  }

  if (!document) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Document non trouvé
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Retour
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              {document.documentNumber}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {DocumentService.getTypeLabel(document.type)}
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Télécharger PDF">
            <IconButton onClick={handleDownloadPDF} disabled={actionLoading}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Imprimer">
            <IconButton onClick={() => window.print()}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          
          {canEditDocument() && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => onEdit && onEdit(document.id)}
            >
              Modifier
            </Button>
          )}
          
          {getAvailableActions().map((action, index) => (
            <Button
              key={index}
              variant="contained"
              color={action.color}
              startIcon={action.icon}
              onClick={action.action}
              disabled={actionLoading}
              size="small"
            >
              {action.label}
            </Button>
          ))}
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

      <Grid container spacing={3}>
        {/* Informations principales */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations du document
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {DocumentService.getTypeLabel(document.type)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Statut
                  </Typography>
                  <Chip
                    label={DocumentService.getStatusLabel(document.status)}
                    color={getStatusColor(document.status)}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date d'émission
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(document.issueDate)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date d'échéance
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(document.dueDate)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Devise
                  </Typography>
                  <Typography variant="body1">
                    {document.currency || 'EUR'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Créé le
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(document.createdAt)}
                  </Typography>
                </Grid>
                
                {document.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {document.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations client */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client
              </Typography>
              
              {document.client ? (
                <Box>
                  <Typography variant="body1" fontWeight="medium" gutterBottom>
                    {document.client.companyName || document.client.contactName}
                  </Typography>
                  
                  {document.client.email && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {document.client.email}
                    </Typography>
                  )}
                  
                  {document.client.phone && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {document.client.phone}
                    </Typography>
                  )}
                  
                  {document.client.address && (
                    <Typography variant="body2" color="text.secondary">
                      {document.client.address}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Informations client non disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Articles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Articles
          </Typography>
          
          {document.items && document.items.length > 0 ? (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell align="right">Quantité</TableCell>
                    <TableCell align="right">Prix unitaire</TableCell>
                    <TableCell align="right">Remise</TableCell>
                    <TableCell align="right">TVA</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {document.items.map((item, index) => {
                    const itemSubtotal = item.quantity * item.unitPrice;
                    const discountAmount = itemSubtotal * (item.discount || 0) / 100;
                    const itemTotal = itemSubtotal - discountAmount;
                    const itemVat = itemTotal * (item.vatRate || 20) / 100;
                    const totalWithVat = itemTotal + itemVat;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.product?.name || item.productName || 'Produit inconnu'}
                          </Typography>
                          {item.product?.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {item.product.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {item.quantity}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.unitPrice, document.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {item.discount ? `${item.discount}%` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {item.vatRate || 20}%
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(totalWithVat, document.currency)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
              Aucun article
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Totaux */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Totaux
          </Typography>
          
          <Grid container justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Sous-total :</Typography>
                <Typography fontWeight="medium">
                  {formatCurrency(document.subtotal || 0, document.currency)}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>TVA :</Typography>
                <Typography fontWeight="medium">
                  {formatCurrency(document.vatAmount || 0, document.currency)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total :</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(document.total || 0, document.currency)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DocumentDetail;