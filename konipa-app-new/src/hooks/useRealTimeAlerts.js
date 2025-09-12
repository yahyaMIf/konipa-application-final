import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeAlertService } from '../services/RealTimeAlertService';

/**
 * Hook personnalisé pour gérer les alertes en temps réel
 * Fournit une interface simple pour interagir avec le service d'alertes
 */
export const useRealTimeAlerts = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enableSound = true,
    filterOptions = {},
    maxAlerts = 100
  } = options;

  // États
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  // Refs
  const refreshIntervalRef = useRef(null);
  const soundEnabledRef = useRef(enableSound);

  // Mettre à jour la référence du son
  useEffect(() => {
    soundEnabledRef.current = enableSound;
  }, [enableSound]);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      const alerts = realTimeAlertService.getActiveAlerts();
      const history = realTimeAlertService.getAlertHistory(filterOptions);
      const metricsData = realTimeAlertService.getMetrics();
      
      setActiveAlerts(alerts.slice(0, maxAlerts));
      setAlertHistory(history.slice(0, maxAlerts));
      setMetrics(metricsData);
      setConnected(true);
    } catch (err) {
      setError(err.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [filterOptions, maxAlerts]);

  // Jouer un son d'alerte
  const playAlertSound = useCallback((priority = 'medium') => {
    if (!soundEnabledRef.current) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Fréquences selon la priorité
      const frequencies = {
        critical: [800, 600, 800, 600],
        high: [600, 400, 600],
        medium: [400, 300],
        low: [300]
      };
      
      const freqs = frequencies[priority] || frequencies.medium;
      
      freqs.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.2);
        }, index * 200);
      });
    } catch (error) {
      }
  }, []);

  // Gestionnaires d'événements
  const handleNewAlert = useCallback((alert) => {
    setActiveAlerts(prev => {
      const updated = [alert, ...prev];
      return updated.slice(0, maxAlerts);
    });
    
    setMetrics(prev => ({
      ...prev,
      total: (prev.total || 0) + 1,
      pending: (prev.pending || 0) + 1,
      critical: alert.priority === 'critical' ? (prev.critical || 0) + 1 : prev.critical
    }));
    
    playAlertSound(alert.priority);
  }, [maxAlerts, playAlertSound]);

  const handleAlertResolved = useCallback((alert) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
    setAlertHistory(prev => {
      const updated = [alert, ...prev];
      return updated.slice(0, maxAlerts);
    });
    
    setMetrics(prev => ({
      ...prev,
      resolved: (prev.resolved || 0) + 1,
      pending: Math.max(0, (prev.pending || 0) - 1),
      critical: alert.priority === 'critical' ? Math.max(0, (prev.critical || 0) - 1) : prev.critical
    }));
  }, [maxAlerts]);

  const handleAlertEscalated = useCallback((alert) => {
    setActiveAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
    
    setMetrics(prev => ({
      ...prev,
      escalated: (prev.escalated || 0) + 1
    }));
    
    playAlertSound('critical');
  }, [playAlertSound]);

  const handleAlertAcknowledged = useCallback((alert) => {
    setActiveAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
  }, []);

  // Configurer les listeners
  useEffect(() => {
    realTimeAlertService.addListener('alert_created', handleNewAlert);
    realTimeAlertService.addListener('alert_resolved', handleAlertResolved);
    realTimeAlertService.addListener('alert_escalated', handleAlertEscalated);
    realTimeAlertService.addListener('alert_acknowledged', handleAlertAcknowledged);

    return () => {
      realTimeAlertService.removeListener('alert_created', handleNewAlert);
      realTimeAlertService.removeListener('alert_resolved', handleAlertResolved);
      realTimeAlertService.removeListener('alert_escalated', handleAlertEscalated);
      realTimeAlertService.removeListener('alert_acknowledged', handleAlertAcknowledged);
    };
  }, [handleNewAlert, handleAlertResolved, handleAlertEscalated, handleAlertAcknowledged]);

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    refreshIntervalRef.current = setInterval(loadData, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, loadData]);

  // Actions
  const acknowledgeAlert = useCallback(async (alertId, userId = 'current_user') => {
    try {
      await realTimeAlertService.acknowledgeAlert(alertId, userId);
      await loadData(); // Recharger pour mettre à jour l'état
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, [loadData]);

  const resolveAlert = useCallback(async (alertId, resolution, userId = 'current_user') => {
    try {
      await realTimeAlertService.resolveAlert(alertId, {
        userId,
        reason: resolution,
        timestamp: new Date()
      });
      await loadData(); // Recharger pour mettre à jour l'état
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, [loadData]);

  const createAlert = useCallback(async (alertData) => {
    try {
      const alert = await realTimeAlertService.createAlert(alertData);
      return alert;
    } catch (error) {
      setError(error.message);
      return null;
    }
  }, []);

  const refreshData = useCallback(() => {
    setLoading(true);
    return loadData();
  }, [loadData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Filtres et utilitaires
  const getAlertsByPriority = useCallback((priority) => {
    return activeAlerts.filter(alert => alert.priority === priority);
  }, [activeAlerts]);

  const getAlertsByType = useCallback((type) => {
    return activeAlerts.filter(alert => alert.type === type);
  }, [activeAlerts]);

  const getCriticalAlerts = useCallback(() => {
    return activeAlerts.filter(alert => alert.priority === 'critical');
  }, [activeAlerts]);

  const getUnacknowledgedAlerts = useCallback(() => {
    return activeAlerts.filter(alert => !alert.acknowledged);
  }, [activeAlerts]);

  const getEscalatedAlerts = useCallback(() => {
    return activeAlerts.filter(alert => alert.escalated);
  }, [activeAlerts]);

  // Statistiques calculées
  const stats = {
    totalActive: activeAlerts.length,
    critical: getCriticalAlerts().length,
    unacknowledged: getUnacknowledgedAlerts().length,
    escalated: getEscalatedAlerts().length,
    byPriority: {
      critical: getAlertsByPriority('critical').length,
      high: getAlertsByPriority('high').length,
      medium: getAlertsByPriority('medium').length,
      low: getAlertsByPriority('low').length
    },
    byType: {
      SECURITY: getAlertsByType('SECURITY').length,
      SYSTEM: getAlertsByType('SYSTEM').length,
      BUSINESS: getAlertsByType('BUSINESS').length,
      INVENTORY: getAlertsByType('INVENTORY').length,
      FINANCIAL: getAlertsByType('FINANCIAL').length,
      CUSTOMER: getAlertsByType('CUSTOMER').length,
      OPERATIONAL: getAlertsByType('OPERATIONAL').length,
      PERFORMANCE: getAlertsByType('PERFORMANCE').length
    }
  };

  return {
    // États
    activeAlerts,
    alertHistory,
    metrics,
    loading,
    error,
    connected,
    stats,
    
    // Actions
    acknowledgeAlert,
    resolveAlert,
    createAlert,
    refreshData,
    clearError,
    
    // Filtres
    getAlertsByPriority,
    getAlertsByType,
    getCriticalAlerts,
    getUnacknowledgedAlerts,
    getEscalatedAlerts,
    
    // Utilitaires
    playAlertSound
  };
};

/**
 * Hook simplifié pour les notifications d'alertes
 * Utilisé pour afficher des badges ou des indicateurs simples
 */
export const useAlertNotifications = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  const updateCounts = useCallback(() => {
    const activeAlerts = realTimeAlertService.getActiveAlerts();
    const critical = activeAlerts.filter(alert => alert.priority === 'critical');
    
    setAlertCount(activeAlerts.length);
    setCriticalCount(critical.length);
  }, []);

  const handleNewAlert = useCallback((alert) => {
    setHasNewAlert(true);
    updateCounts();
    
    // Réinitialiser l'indicateur après 5 secondes
    setTimeout(() => setHasNewAlert(false), 5000);
  }, [updateCounts]);

  const handleAlertResolved = useCallback(() => {
    updateCounts();
  }, [updateCounts]);

  useEffect(() => {
    updateCounts();
    
    realTimeAlertService.addListener('alert_created', handleNewAlert);
    realTimeAlertService.addListener('alert_resolved', handleAlertResolved);

    return () => {
      realTimeAlertService.removeListener('alert_created', handleNewAlert);
      realTimeAlertService.removeListener('alert_resolved', handleAlertResolved);
    };
  }, [updateCounts, handleNewAlert, handleAlertResolved]);

  const markAsViewed = useCallback(() => {
    setHasNewAlert(false);
  }, []);

  return {
    alertCount,
    criticalCount,
    hasNewAlert,
    markAsViewed
  };
};

/**
 * Hook pour créer des alertes spécifiques
 * Fournit des méthodes simplifiées pour créer différents types d'alertes
 */
export const useAlertCreators = () => {
  const createSecurityAlert = useCallback((title, message, data = {}) => {
    return realTimeAlertService.createAlert({
      type: 'SECURITY',
      title,
      message,
      data,
      priority: 'critical'
    });
  }, []);

  const createSystemAlert = useCallback((title, message, data = {}) => {
    return realTimeAlertService.createAlert({
      type: 'SYSTEM',
      title,
      message,
      data,
      priority: 'high'
    });
  }, []);

  const createBusinessAlert = useCallback((title, message, data = {}) => {
    return realTimeAlertService.createAlert({
      type: 'BUSINESS',
      title,
      message,
      data,
      priority: 'high'
    });
  }, []);

  const createInventoryAlert = useCallback((title, message, data = {}) => {
    return realTimeAlertService.createAlert({
      type: 'INVENTORY',
      title,
      message,
      data,
      priority: 'medium'
    });
  }, []);

  const createFinancialAlert = useCallback((title, message, data = {}) => {
    return realTimeAlertService.createAlert({
      type: 'FINANCIAL',
      title,
      message,
      data,
      priority: 'high'
    });
  }, []);

  const createCustomAlert = useCallback((alertData) => {
    return realTimeAlertService.createAlert(alertData);
  }, []);

  return {
    createSecurityAlert,
    createSystemAlert,
    createBusinessAlert,
    createInventoryAlert,
    createFinancialAlert,
    createCustomAlert
  };
};

export default useRealTimeAlerts;