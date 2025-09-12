import { apiService, API_ENDPOINTS } from './apiMigration';

class IntegrationService {
  // Webhooks
  async getWebhooks() {
    try {
      return await apiService.get(API_ENDPOINTS.INTEGRATIONS.WEBHOOKS.LIST);
    } catch (error) {
      return [];
    }
  }

  async createWebhook(webhookData) {
    try {
      return await apiService.post(API_ENDPOINTS.INTEGRATIONS.WEBHOOKS.CREATE, webhookData);
    } catch (error) {
      throw error;
    }
  }

  async updateWebhook(webhookId, webhookData) {
    try {
      return await apiService.put(
        API_ENDPOINTS.INTEGRATIONS.WEBHOOKS.UPDATE.replace(':id', webhookId),
        webhookData
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteWebhook(webhookId) {
    try {
      return await apiService.delete(
        API_ENDPOINTS.INTEGRATIONS.WEBHOOKS.DELETE.replace(':id', webhookId)
      );
    } catch (error) {
      throw error;
    }
  }

  async testWebhook(webhookId) {
    try {
      return await apiService.post(
        API_ENDPOINTS.INTEGRATIONS.WEBHOOKS.TEST.replace(':id', webhookId)
      );
    } catch (error) {
      throw error;
    }
  }

  // API Keys
  async getApiKeys() {
    try {
      return await apiService.get(API_ENDPOINTS.INTEGRATIONS.API_KEYS.LIST);
    } catch (error) {
      return [];
    }
  }

  async createApiKey(keyData) {
    try {
      return await apiService.post(API_ENDPOINTS.INTEGRATIONS.API_KEYS.CREATE, keyData);
    } catch (error) {
      throw error;
    }
  }

  async revokeApiKey(keyId) {
    try {
      return await apiService.delete(
        API_ENDPOINTS.INTEGRATIONS.API_KEYS.REVOKE.replace(':id', keyId)
      );
    } catch (error) {
      throw error;
    }
  }

  // Intégrations tierces
  async getThirdPartyIntegrations() {
    try {
      return await apiService.get(API_ENDPOINTS.INTEGRATIONS.THIRD_PARTY.LIST);
    } catch (error) {
      return [];
    }
  }

  async enableIntegration(integrationId, config) {
    try {
      return await apiService.post(
        API_ENDPOINTS.INTEGRATIONS.THIRD_PARTY.ENABLE.replace(':id', integrationId),
        config
      );
    } catch (error) {
      throw error;
    }
  }

  async disableIntegration(integrationId) {
    try {
      return await apiService.post(
        API_ENDPOINTS.INTEGRATIONS.THIRD_PARTY.DISABLE.replace(':id', integrationId)
      );
    } catch (error) {
      throw error;
    }
  }

  async testIntegration(integrationId) {
    try {
      return await apiService.post(
        API_ENDPOINTS.INTEGRATIONS.THIRD_PARTY.TEST.replace(':id', integrationId)
      );
    } catch (error) {
      throw error;
    }
  }

  // Logs d'intégration
  async getIntegrationLogs(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `${API_ENDPOINTS.INTEGRATIONS.LOGS}?${params}` : API_ENDPOINTS.INTEGRATIONS.LOGS;
      return await apiService.get(url);
    } catch (error) {
      return [];
    }
  }

  // Synchronisation
  async syncData(syncType, options = {}) {
    try {
      return await apiService.post(API_ENDPOINTS.INTEGRATIONS.SYNC, {
        type: syncType,
        options
      });
    } catch (error) {
      throw error;
    }
  }

  async getSyncStatus() {
    try {
      return await apiService.get(API_ENDPOINTS.INTEGRATIONS.SYNC_STATUS);
    } catch (error) {
      return null;
    }
  }

  // Configuration
  async getIntegrationConfig() {
    try {
      return await apiService.get(API_ENDPOINTS.INTEGRATIONS.CONFIG);
    } catch (error) {
      return {};
    }
  }

  async updateIntegrationConfig(config) {
    try {
      return await apiService.put(API_ENDPOINTS.INTEGRATIONS.CONFIG, config);
    } catch (error) {
      throw error;
    }
  }
}

export default new IntegrationService();