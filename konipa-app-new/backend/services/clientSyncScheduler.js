const cron = require('node-cron');
const { SageIntegrationService } = require('./sageIntegrationService');
const { Client } = require('../models');
const logger = require('../utils/logger');
const { syncLogger } = require('../utils/syncLogger');

class ClientSyncScheduler {
  constructor() {
    this.sageService = new SageIntegrationService();
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncStats = {
      totalSynced: 0,
      successCount: 0,
      errorCount: 0,
      lastErrors: []
    };
  }

  /**
   * Démarre la synchronisation automatique
   * Par défaut: toutes les heures
   */
  start(cronExpression = '0 * * * *') {
    logger.info('Démarrage du planificateur de synchronisation clients');
    
    // Synchronisation automatique toutes les heures
    cron.schedule(cronExpression, async () => {
      if (!this.isRunning) {
        await this.syncAllClients();
      } else {
        logger.warn('Synchronisation déjà en cours, passage ignoré');
      }
    });

    // Synchronisation au démarrage (après 30 secondes)
    setTimeout(() => {
      this.syncAllClients();
    }, 30000);

    logger.info(`Planificateur configuré avec l'expression cron: ${cronExpression}`);
  }

  /**
   * Synchronise tous les clients avec Sage
   */
  async syncAllClients() {
    if (this.isRunning) {
      logger.warn('Synchronisation déjà en cours');
      return;
    }

    this.isRunning = true;
    this.lastSyncTime = new Date();
    
    logger.info('Début de la synchronisation automatique des clients');
    syncLogger.syncStart('automatic', { scheduledSync: true });

    try {
      // Récupérer tous les clients avec un code Sage
      const clients = await Client.findAll({
        where: {
          clientCodeSage: {
            [require('sequelize').Op.ne]: null
          },
          isActive: true
        }
      });

      logger.info(`${clients.length} clients à synchroniser`);

      const results = {
        total: clients.length,
        success: 0,
        errors: 0,
        details: []
      };

      // Synchroniser chaque client
      for (const client of clients) {
        try {
          await this.syncSingleClient(client);
          results.success++;
          results.details.push({
            clientId: client.id,
            clientName: client.companyName,
            status: 'success',
            syncTime: new Date()
          });

          // Petit délai pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          results.errors++;
          const errorDetail = {
            clientId: client.id,
            clientName: client.companyName,
            status: 'error',
            error: error.message,
            syncTime: new Date()
          };
          
          results.details.push(errorDetail);
          this.syncStats.lastErrors.push(errorDetail);
          
          logger.error(`Erreur synchronisation client ${client.id}:`, error);
        }
      }

      // Mettre à jour les statistiques
      this.syncStats.totalSynced += results.total;
      this.syncStats.successCount += results.success;
      this.syncStats.errorCount += results.errors;
      
      // Garder seulement les 10 dernières erreurs
      if (this.syncStats.lastErrors.length > 10) {
        this.syncStats.lastErrors = this.syncStats.lastErrors.slice(-10);
      }

      logger.info(`Synchronisation terminée: ${results.success} succès, ${results.errors} erreurs`);
      syncLogger.syncSuccess('automatic', {
        successCount: results.success,
        errorCount: results.errors,
        totalProcessed: results.success + results.errors
      });
      
      return results;

    } catch (error) {
      logger.error('Erreur lors de la synchronisation globale:', error);
      syncLogger.syncError('automatic', error, { scheduledSync: true });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Synchronise un client spécifique
   */
  async syncSingleClient(client) {
    const startTime = Date.now();
    syncLogger.clientSync(client.id, client.companyName, 'start', 'info', {
      clientCodeSage: client.clientCodeSage
    });

    try {
      if (!client.clientCodeSage) {
        const error = new Error(`Client ${client.id} n'a pas de code Sage`);
        syncLogger.clientSync(client.id, client.companyName, 'validation', 'error', {
          reason: 'missing_sage_code'
        });
        throw error;
      }

      // Sauvegarder les anciennes données pour comparaison
      const oldData = {
        creditLimit: client.creditLimit,
        outstandingAmount: client.outstandingAmount,
        isBlocked: client.isBlocked
      };

      // Récupérer les données financières depuis Sage
      syncLogger.clientSync(client.id, client.companyName, 'sage_fetch', 'info', {
        clientCodeSage: client.clientCodeSage
      });
      
      const financialData = await this.sageService.getClientFinancialData(client.clientCodeSage);
      
      if (!financialData) {
        const error = new Error(`Aucune donnée trouvée dans Sage pour le client ${client.clientCodeSage}`);
        syncLogger.clientSync(client.id, client.companyName, 'sage_fetch', 'error', {
          clientCodeSage: client.clientCodeSage,
          reason: 'no_data_found'
        });
        throw error;
      }

      // Mettre à jour le client
      await client.update({
        creditLimit: financialData.creditLimit,
        outstandingAmount: financialData.outstandingAmount,
        isBlocked: financialData.isBlocked,
        sageLastSync: new Date()
      });

      // Logger les changements de données financières
      syncLogger.financialDataSync(client.id, oldData, {
        creditLimit: financialData.creditLimit,
        outstandingAmount: financialData.outstandingAmount,
        isBlocked: financialData.isBlocked
      });

      const duration = Date.now() - startTime;
      syncLogger.clientSync(client.id, client.companyName, 'complete', 'success', {
        duration: `${duration}ms`,
        dataUpdated: {
          creditLimit: financialData.creditLimit,
          outstandingAmount: financialData.outstandingAmount,
          isBlocked: financialData.isBlocked
        }
      });

      logger.debug(`Client ${client.id} synchronisé avec succès`);
      
      return {
        success: true,
        data: financialData
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Erreur synchronisation client ${client.id}:`, error);
      syncLogger.clientSync(client.id, client.companyName, 'complete', 'error', {
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Synchronise les clients qui n'ont pas été synchronisés récemment
   */
  async syncOutdatedClients(hoursThreshold = 24) {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    const outdatedClients = await Client.findAll({
      where: {
        clientCodeSage: {
          [require('sequelize').Op.ne]: null
        },
        isActive: true,
        [require('sequelize').Op.or]: [
          { sageLastSync: null },
          { sageLastSync: { [require('sequelize').Op.lt]: thresholdDate } }
        ]
      }
    });

    logger.info(`${outdatedClients.length} clients non synchronisés depuis ${hoursThreshold}h`);

    const results = [];
    for (const client of outdatedClients) {
      try {
        await this.syncSingleClient(client);
        results.push({ clientId: client.id, status: 'success' });
      } catch (error) {
        results.push({ clientId: client.id, status: 'error', error: error.message });
      }
    }

    return results;
  }

  /**
   * Retourne les statistiques de synchronisation
   */
  getStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime
    };
  }

  /**
   * Remet à zéro les statistiques
   */
  resetStats() {
    this.syncStats = {
      totalSynced: 0,
      successCount: 0,
      errorCount: 0,
      lastErrors: []
    };
    logger.info('Statistiques de synchronisation remises à zéro');
  }

  /**
   * Force une synchronisation immédiate
   */
  async forceSyncNow() {
    logger.info('Synchronisation forcée demandée');
    syncLogger.syncStart('manual-all');
    const startTime = Date.now();
    try {
      const result = await this.syncAllClients();
      syncLogger.syncSuccess('manual-all', {
        successCount: result.success,
        errorCount: result.errors,
        totalProcessed: result.total,
        duration: Date.now() - startTime
      });
      syncLogger.syncPerformance('manual-all', Date.now() - startTime, result.total);
      return result;
    } catch (error) {
      syncLogger.syncError('manual-all', error);
      throw error;
    }
  }
}

module.exports = ClientSyncScheduler;