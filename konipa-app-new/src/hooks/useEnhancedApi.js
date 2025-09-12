// Hook personnalisé pour utiliser l'API améliorée avec gestion des erreurs et chargement
import React, { useContext, useMemo } from 'react';
import { LoadingContext } from '../components/GlobalLoadingManager';
import { createApiWrapper } from '../services/enhancedApiService';

/**
 * Hook pour utiliser l'API améliorée avec gestion automatique des erreurs et du chargement
 * @returns {Object} API wrapper avec gestion des erreurs et chargement
 */
export const useEnhancedApi = () => {
  const loadingManager = useContext(LoadingContext);
  
  if (!loadingManager) {
    throw new Error('useEnhancedApi must be used within a LoadingProvider');
  }
  
  // Créer le wrapper API avec le gestionnaire de chargement
  const enhancedApi = useMemo(() => {
    return createApiWrapper(loadingManager);
  }, [loadingManager]);
  
  return enhancedApi;
};

/**
 * Hook pour les opérations asynchrones avec gestion automatique des états
 * @param {string} key - Clé unique pour identifier l'opération
 * @param {Object} options - Options de configuration
 * @returns {Object} Fonctions et états pour l'opération
 */
export const useAsyncOperation = (key, options = {}) => {
  const {
    startLoading,
    stopLoading,
    setSuccess,
    setError,
    addNotification,
    isLoading,
    getLoadingState
  } = useContext(LoadingContext);
  
  if (!startLoading) {
    throw new Error('useAsyncOperation must be used within a LoadingProvider');
  }
  
  const {
    loadingMessage = 'Chargement...',
    successMessage = null,
    errorMessage = 'Une erreur est survenue',
    showLoading = true,
    showSuccess = false,
    showError = true,
    silent = false
  } = options;
  
  // État de l'opération
  const operationState = getLoadingState(key);
  
  // Fonction pour exécuter une opération asynchrone
  const execute = async (asyncFunction) => {
    try {
      if (showLoading && !silent) {
        startLoading(key, loadingMessage);
      }
      
      const result = await asyncFunction();
      
      if (showLoading && !silent) {
        if (showSuccess && successMessage) {
          setSuccess(key, successMessage);
        } else {
          stopLoading(key);
        }
      }
      
      return result;
    } catch (error) {
      if (showLoading && !silent) {
        if (showError) {
          const message = error.response?.data?.message || error.message || errorMessage;
          setError(key, message);
        } else {
          stopLoading(key);
        }
      } else if (showError && !silent) {
        const message = error.response?.data?.message || error.message || errorMessage;
        addNotification(message, 'error');
      }
      
      throw error;
    }
  };
  
  // Fonction pour réinitialiser l'état
  const reset = () => {
    stopLoading(key);
  };
  
  return {
    execute,
    reset,
    isLoading: isLoading(key),
    state: operationState,
    // Raccourcis pour les états courants
    loading: operationState?.type === 'loading',
    success: operationState?.type === 'success',
    error: operationState?.type === 'error',
    message: operationState?.message
  };
};

/**
 * Hook pour les formulaires avec gestion automatique des états
 * @param {string} formKey - Clé unique pour identifier le formulaire
 * @param {Function} submitFunction - Fonction de soumission du formulaire
 * @param {Object} options - Options de configuration
 * @returns {Object} Fonctions et états pour le formulaire
 */
export const useFormSubmission = (formKey, submitFunction, options = {}) => {
  const {
    loadingMessage = 'Envoi en cours...',
    successMessage = 'Opération réussie !',
    errorMessage = 'Erreur lors de l\'envoi',
    showSuccess = true,
    resetOnSuccess = false,
    onSuccess,
    onError
  } = options;
  
  const {
    execute,
    reset,
    isLoading,
    state,
    loading,
    success,
    error,
    message
  } = useAsyncOperation(formKey, {
    loadingMessage,
    successMessage,
    errorMessage,
    showSuccess
  });
  
  // Fonction de soumission du formulaire
  const handleSubmit = async (formData) => {
    try {
      const result = await execute(() => submitFunction(formData));
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      if (resetOnSuccess) {
        setTimeout(reset, 2000); // Reset après 2 secondes
      }
      
      return result;
    } catch (err) {
      if (onError) {
        onError(err);
      }
      throw err;
    }
  };
  
  return {
    handleSubmit,
    reset,
    isSubmitting: isLoading,
    submissionState: state,
    loading,
    success,
    error,
    message
  };
};

/**
 * Hook pour les opérations de données avec cache simple
 * @param {string} dataKey - Clé unique pour identifier les données
 * @param {Function} fetchFunction - Fonction pour récupérer les données
 * @param {Object} options - Options de configuration
 * @returns {Object} Données, fonctions et états
 */
export const useDataOperation = (dataKey, fetchFunction, options = {}) => {
  const {
    loadingMessage = 'Chargement des données...',
    errorMessage = 'Erreur lors du chargement',
    autoFetch = true,
    silent = false
  } = options;
  
  const {
    execute,
    reset,
    isLoading,
    state,
    loading,
    success,
    error,
    message
  } = useAsyncOperation(dataKey, {
    loadingMessage,
    errorMessage,
    silent
  });
  
  // Données en cache (simple)
  const [data, setData] = React.useState(null);
  
  // Fonction pour récupérer les données
  const fetchData = async (forceRefresh = false) => {
    if (!forceRefresh && data && success) {
      return data; // Retourner les données en cache
    }
    
    try {
      const result = await execute(fetchFunction);
      setData(result);
      return result;
    } catch (err) {
      setData(null);
      throw err;
    }
  };
  
  // Auto-fetch au montage si activé
  React.useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]);
  
  // Fonction pour rafraîchir les données
  const refresh = () => fetchData(true);
  
  // Fonction pour réinitialiser
  const resetData = () => {
    setData(null);
    reset();
  };
  
  return {
    data,
    fetchData,
    refresh,
    reset: resetData,
    isLoading,
    state,
    loading,
    success,
    error,
    message,
    hasData: !!data
  };
};

export default useEnhancedApi;