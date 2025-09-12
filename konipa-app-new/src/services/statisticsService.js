import { apiService, API_ENDPOINTS } from './apiMigration';

/**
 * Service pour la gestion des statistiques et analyses
 */
class StatisticsService {
  /**
   * Obtenir les statistiques générales
   */
  async getStatistics() {
    try {
      const response = await apiService.get(API_ENDPOINTS.STATISTICS.GENERAL);
      return response.data || {
        dailyRevenue: 0,
        transactionsToday: 0,
        averageTransaction: 0,
        customersServed: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalUsers: 0,
        activeUsers: 0
      };
    } catch (error) {
      return {
        dailyRevenue: 0,
        transactionsToday: 0,
        averageTransaction: 0,
        customersServed: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalUsers: 0,
        activeUsers: 0
      };
    }
  }

  /**
   * Obtenir les analyses de revenus
   */
  async getRevenueAnalytics(dateRange = '30d') {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.STATISTICS.REVENUE}?range=${dateRange}`);
      return {
        data: response.data || []
      };
    } catch (error) {
      return {
        data: []
      };
    }
  }

  /**
   * Obtenir les analyses des commerciaux
   */
  async getSalesRepAnalytics(dateRange = '30d') {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.STATISTICS.SALES_REP}?range=${dateRange}`);
      return {
        data: response.data || []
      };
    } catch (error) {
      return {
        data: []
      };
    }
  }

  /**
   * Obtenir les analyses de conversion
   */
  async getConversionAnalytics(dateRange = '30d') {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.STATISTICS.CONVERSION}?range=${dateRange}`);
      return {
        data: response.data || []
      };
    } catch (error) {
      return {
        data: []
      };
    }
  }

  /**
   * Obtenir les analyses des produits
   */
  async getProductAnalytics(dateRange = '30d') {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.STATISTICS.PRODUCTS}?range=${dateRange}`);
      return {
        data: response.data || []
      };
    } catch (error) {
      return {
        data: []
      };
    }
  }

  /**
   * Obtenir les analyses des clients
   */
  async getClientAnalytics(dateRange = '30d') {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.STATISTICS.CLIENTS}?range=${dateRange}`);
      return {
        data: response.data || {
          activeClients: 0,
          dormantClients: [],
          searchQueries: []
        }
      };
    } catch (error) {
      return {
        data: {
          activeClients: 0,
          dormantClients: [],
          searchQueries: []
        }
      };
    }
  }

  /**
   * Obtenir les KPI du tableau de bord
   */
  async getDashboardKPIs() {
    try {
      const response = await apiService.get(API_ENDPOINTS.STATISTICS.KPIS);
      return response.data || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        topProducts: [],
        topClients: [],
        recentActivity: []
      };
    } catch (error) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        topProducts: [],
        topClients: [],
        recentActivity: []
      };
    }
  }

  /**
   * Obtenir les statistiques POS
   */
  async getPOSStatistics() {
    try {
      const response = await apiService.get(API_ENDPOINTS.STATISTICS.POS);
      return response.data || {
        dailyRevenue: 0,
        transactionsToday: 0,
        averageTransaction: 0,
        customersServed: 0
      };
    } catch (error) {
      return {
        dailyRevenue: 0,
        transactionsToday: 0,
        averageTransaction: 0,
        customersServed: 0
      };
    }
  }

  /**
   * Obtenir les statistiques commerciales
   */
  async getCommercialStatistics(commercialId) {
    try {
      const endpoint = commercialId 
        ? `${API_ENDPOINTS.STATISTICS.COMMERCIAL}/${commercialId}`
        : API_ENDPOINTS.STATISTICS.COMMERCIAL;
      
      const response = await apiService.get(endpoint);
      return response.data || {
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        monthlyCommission: 0,
        yearlyCommission: 0,
        objectivePercentage: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    } catch (error) {
      return {
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        monthlyCommission: 0,
        yearlyCommission: 0,
        objectivePercentage: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    }
  }

  /**
   * Statistiques utilisateur pour le profil
   */
  async getUserStats(userId, userRole) {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.STATISTICS.USER_STATS}/${userId}?role=${userRole}`
      );
      return response.data || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Activités utilisateur
   */
  async getUserActivities(userId, limit = 10) {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.STATISTICS.USER_ACTIVITIES}/${userId}?limit=${limit}`
      );
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Analyses utilisateur pour AdminClientDetail
   */
  async getUserAnalytics(userId) {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.STATISTICS.USER_ANALYTICS}/${userId}`
      );
      return response.data || {};
    } catch (error) {
      return {};
    }
  }
}

// Instance unique du service
const statisticsService = new StatisticsService();

export { statisticsService };
export default statisticsService;