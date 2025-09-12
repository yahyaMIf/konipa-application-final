import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import DocumentList from './DocumentList';
import DocumentForm from './DocumentForm';
import DocumentDetail from './DocumentDetail';
import { useAuth } from '../../contexts/AuthContext';

const Documents = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'form', 'detail'
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Filtres par type de document
  const documentTypes = [
    { value: '', label: 'Tous les documents', icon: <DescriptionIcon /> },
    { value: 'quote', label: 'Devis', icon: <AssignmentIcon /> },
    { value: 'invoice', label: 'Factures', icon: <ReceiptIcon /> }
  ];

  const handleCreateDocument = (type = null) => {
    setEditingDocument(null);
    setCurrentView('form');
    // Si un type spécifique est demandé, on peut le passer au formulaire
  };

  const handleEditDocument = (documentId) => {
    setEditingDocument(documentId);
    setCurrentView('form');
  };

  const handleViewDocument = (documentId) => {
    setSelectedDocumentId(documentId);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedDocumentId(null);
    setEditingDocument(null);
  };

  const handleFormSuccess = () => {
    setCurrentView('list');
    setEditingDocument(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilterByTab = () => {
    return documentTypes[activeTab]?.value || '';
  };

  const canCreateDocument = () => {
    return user && ['admin', 'manager', 'employee'].includes(user.role);
  };

  const renderHeader = () => {
    if (currentView === 'form') {
      return (
        <Box mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            {editingDocument ? 'Modifier le document' : 'Nouveau document'}
          </Typography>
        </Box>
      );
    }

    if (currentView === 'detail') {
      return null; // Le header est géré dans DocumentDetail
    }

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Documents
          </Typography>
          
          {canCreateDocument() && (
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleCreateDocument()}
              >
                Nouveau document
              </Button>
            </Box>
          )}
        </Box>

        {/* Onglets pour filtrer par type */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            {documentTypes.map((type, index) => (
              <Tab
                key={index}
                icon={type.icon}
                label={type.label}
                iconPosition="start"
                sx={{
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '0.95rem'
                }}
              />
            ))}
          </Tabs>
        </Paper>
      </Box>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'form':
        return (
          <DocumentForm
            documentId={editingDocument}
            onSuccess={handleFormSuccess}
            onCancel={handleBackToList}
          />
        );

      case 'detail':
        return (
          <DocumentDetail
            documentId={selectedDocumentId}
            onEdit={handleEditDocument}
            onBack={handleBackToList}
          />
        );

      case 'list':
      default:
        return (
          <DocumentList
            onEdit={handleEditDocument}
            onView={handleViewDocument}
            typeFilter={getFilterByTab()}
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

export default Documents;