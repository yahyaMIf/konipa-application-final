import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { FinancialService } from '@/services/FinancialService';
import { useToast } from '@/components/ui/use-toast';

export const useFinancialData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time data state
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Protection contre React StrictMode
  const strictModeProtectionRef = useRef(false);
  const connectionTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  // Financial summary query
  const { data: financialSummary, isLoading: isSummaryLoading, error: summaryError } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: FinancialService.getFinancialSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Recent transactions query
  const { data: recentTransactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: FinancialService.getRecentTransactions,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Financial alerts query
  const { data: financialAlerts, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['financial-alerts'],
    queryFn: FinancialService.getFinancialAlerts,
    refetchInterval: 60000, // Refetch every minute
  });

  // Export mutation
  const exportReportMutation = useMutation({
    mutationFn: ({ type, format }) => FinancialService.exportReport(type, format),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Report exported successfully`,
      });
      return data;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export report",
        variant: "destructive"
      });
    }
  });

  // Refresh function
  const refreshAllData = () => {
    queryClient.invalidateQueries(['financial-summary']);
    queryClient.invalidateQueries(['recent-transactions']);
    queryClient.invalidateQueries(['financial-alerts']);
    setLastUpdate(new Date());
  };

  // Real-time updates effect
  useEffect(() => {
    // Protection contre les connexions multiples en React StrictMode
    if (strictModeProtectionRef.current) {
      return;
    }
    
    strictModeProtectionRef.current = true;
    
    // Fermer la connexion existante si elle existe
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }
    
    wsRef.current = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/financial-updates`);
    
    wsRef.current.onopen = () => {
      setIsConnected(true);
      // Désactiver la protection StrictMode après connexion réussie
      connectionTimeoutRef.current = setTimeout(() => {
        strictModeProtectionRef.current = false;
      }, 1000);
    };
    
    wsRef.current.onclose = (event) => {
      setIsConnected(false);
      // Désactiver la protection StrictMode et nettoyer les timeouts
      strictModeProtectionRef.current = false;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Gestion des codes d'erreur spécifiques d'authentification
      if (event.code === 1006 || event.code === 1011 || event.code === 1008) {
        // Émettre l'événement websocket:error pour AccountDeactivationHandler
        window.dispatchEvent(new CustomEvent('websocket:error', {
          detail: { 
            code: event.code, 
            reason: event.reason,
            service: 'useFinancialData'
          }
        }));
        
        // Forcer la déconnexion de l'utilisateur
        window.dispatchEvent(new CustomEvent('auth:force-logout', { 
          detail: { reason: 'websocket_auth_error' } 
        }));
      }
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'FINANCIAL_UPDATE') {
        queryClient.invalidateQueries(['financial-summary']);
        setLastUpdate(new Date());
        
        if (data.alert) {
          toast({
            title: "Financial Update",
            description: data.message,
          });
        }
      }
    };

    wsRef.current.onerror = (error) => {
      };

    return () => {
      // Nettoyer la protection StrictMode et les timeouts
      strictModeProtectionRef.current = false;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
    };
  }, [queryClient, toast]);

  return {
    // Data
    financialSummary,
    recentTransactions,
    financialAlerts,
    
    // Loading states
    isLoading: isSummaryLoading || isTransactionsLoading || isAlertsLoading,
    isSummaryLoading,
    isTransactionsLoading,
    isAlertsLoading,
    
    // Mutations
    exportReport: exportReportMutation.mutate,
    isExporting: exportReportMutation.isLoading,
    
    // Real-time
    isConnected,
    lastUpdate,
    
    // Functions
    refreshAllData,
    
    // Errors
    summaryError,
  };
};
