import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import SubstituteList from './SubstituteList';
import SubstituteForm from './SubstituteForm';
import { useAuth } from '../../contexts/AuthContext';

const Substitutes = ({ productId, productName, onBack }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'form'
  const [editingSubstituteId, setEditingSubstituteId] = useState(null);

  const handleAddSubstitute = () => {
    setEditingSubstituteId(null);
    setCurrentView('form');
  };

  const handleEditSubstitute = (substitute) => {
    setEditingSubstituteId(substitute.id);
    setCurrentView('form');
  };

  const handleFormSuccess = () => {
    setCurrentView('list');
    setEditingSubstituteId(null);
  };

  const handleFormCancel = () => {
    setCurrentView('list');
    setEditingSubstituteId(null);
  };

  const canManageSubstitutes = () => {
    return user && ['admin', 'manager'].includes(user.role);
  };

  if (!productId) {
    return (
      <Alert severity="error">
        Aucun produit sélectionné pour gérer les substituts.
      </Alert>
    );
  }

  const renderHeader = () => {
    if (currentView === 'form') {
      return (
        <Box mb={3}>
          <Typography variant="h5" component="h1" gutterBottom>
            {editingSubstituteId ? 'Modifier le substitut' : 'Ajouter un substitut'}
          </Typography>
          {productName && (
            <Typography variant="subtitle1" color="text.secondary">
              Pour le produit : {productName}
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          {onBack && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              variant="outlined"
              size="small"
            >
              Retour
            </Button>
          )}
          
          <Box>
            <Typography variant="h5" component="h1">
              Produits de substitution
            </Typography>
            {productName && (
              <Typography variant="subtitle1" color="text.secondary">
                Pour le produit : {productName}
              </Typography>
            )}
          </Box>
        </Box>

        {!canManageSubstitutes() && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Vous pouvez consulter les substituts mais pas les modifier.
          </Alert>
        )}
      </Box>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'form':
        return (
          <SubstituteForm
            productId={productId}
            substituteId={editingSubstituteId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        );

      case 'list':
      default:
        return (
          <SubstituteList
            productId={productId}
            onEdit={handleEditSubstitute}
            onAdd={handleAddSubstitute}
          />
        );
    }
  };

  return (
    <Box>
      {renderHeader()}
      {renderContent()}
    </Box>
  );
};

export default Substitutes;