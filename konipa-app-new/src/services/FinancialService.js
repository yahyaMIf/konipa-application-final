import { apiService } from './api';
import adminJournalService from './adminJournalService.js';

class FinancialService {
  // Protection contre React StrictMode pour les WebSockets
  static strictModeProtection = false;
  static connectionTimeout = null;
  
  // Get comprehensive financial summary
  static async getFinancialSummary() {
    try {
      const response = await apiService.get('/accountant/summary');
      return response.data;
    } catch (error) {
      throw new Error('Failed to load financial summary');
    }
  }

  // Get recent transactions with pagination
  static async getRecentTransactions(page = 1, limit = 50) {
    try {
      const response = await apiService.get('/accountant/transactions', {
        page, limit
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to load transactions');
    }
  }

  // Get financial alerts
  static async getFinancialAlerts() {
    try {
      const response = await apiService.get('/accountant/alerts');
      return response.data;
    } catch (error) {
      throw new Error('Failed to load alerts');
    }
  }

  // Export financial reports
  static async exportReport(type, format = 'pdf') {
    try {
      const response = await apiService.post('/accountant/export', {
        type,
        format
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${type}-${new Date().toISOString()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Logger l'export de rapport
      adminJournalService.logReportGeneration(
        `Rapport financier ${type}`,
        'Export manuel',
        {
          format: format,
          exportDate: new Date().toISOString()
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to export report');
    }
  }

  // Get financial forecast
  static async getFinancialForecast(period = '30d') {
    try {
      const response = await apiService.get('/accountant/forecast', {
        period
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to load forecast');
    }
  }

  // Get tax calculations
  static async getTaxCalculations(year = new Date().getFullYear()) {
    try {
      const response = await apiService.get('/accountant/tax-calculations', {
        year
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to load tax calculations');
    }
  }

  // Update budget
  static async updateBudget(budgetData) {
    try {
      const response = await apiService.put('/accountant/budget', budgetData);
      
      // Logger la mise à jour du budget
      adminJournalService.logConfigurationChange(
        'Budget',
        'Ancien budget',
        'Nouveau budget',
        {
          budgetData: budgetData,
          updateDate: new Date().toISOString()
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to update budget');
    }
  }

  // Get audit log
  static async getAuditLog(limit = 100) {
    try {
      const response = await apiService.get('/accountant/audit-log', {
        limit
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to load audit log');
    }
  }

  // Real-time subscription
  static subscribeToUpdates(callback) {
    // Protection contre les connexions multiples en React StrictMode
    if (this.strictModeProtection) {
      return () => {}; // Retourner une fonction de nettoyage vide
    }
    
    this.strictModeProtection = true;
    
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/financial-updates`);
    
    // Désactiver la protection après connexion réussie
    ws.onopen = () => {
      this.connectionTimeout = setTimeout(() => {
        this.strictModeProtection = false;
      }, 1000);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    ws.onclose = (event) => {
      // Nettoyer la protection StrictMode
      this.strictModeProtection = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Gestion des codes d'erreur spécifiques d'authentification
      if (event.code === 1006 || event.code === 1011 || event.code === 1008) {
        // Émettre l'événement websocket:error pour AccountDeactivationHandler
        window.dispatchEvent(new CustomEvent('websocket:error', {
          detail: { 
            code: event.code, 
            reason: event.reason,
            service: 'FinancialService'
          }
        }));
        
        // Forcer la déconnexion de l'utilisateur
        window.dispatchEvent(new CustomEvent('auth:force-logout', { 
          detail: { reason: 'websocket_auth_error' } 
        }));
      }
    };

    ws.onerror = (error) => {
      };

    return () => {
      // Nettoyer la protection StrictMode
      this.strictModeProtection = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      ws.close();
    };
  }
}

export { FinancialService };
