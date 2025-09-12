// Service pour le journal Admin - suivi des activités quotidiennes
import { apiService } from './api';

class AdminJournalService {
  constructor() {
    this.activities = [];
    // Ne pas charger automatiquement - attendre que l'utilisateur soit connecté
  }

  // Charger les activités depuis l'API backend
  async loadActivities() {
    try {
      const token = localStorage.getItem('konipa_access_token');
      if (!token) {
        // Token d'authentification requis
        return;
      }

      const response = await apiService.get('/journal/activities');

      if (response.success) {
        // Le contrôleur retourne journalEntries, pas activities
        this.activities = response.data.journalEntries || [];
      } else {
        throw new Error(`Erreur API: ${response.error}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // Sauvegarder les activités via l'API backend
  async saveActivities() {
    try {
      const token = localStorage.getItem('konipa_access_token');
      if (!token) {
        // Token d'authentification requis - sauvegarde ignorée
        return; // Ne pas lever d'erreur, juste ignorer la sauvegarde
      }

      const response = await apiService.post('/journal/activities', { activities: this.activities });
      
      // Vérifier si la réponse indique un succès
      if (response && !response.success) {
        const errorMessage = response.message || response.error || 'Erreur inconnue';
        throw new Error(`Erreur API: ${errorMessage}`);
      }
    } catch (error) {
      // Ne pas relancer l'erreur pour éviter de casser l'application
      return;
    }
  }

  // Ajouter une nouvelle activité
  async logActivity(type, description, details = {}) {
    const activity = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR'),
      type,
      description,
      details,
      user: details.user || 'Système'
    };

    this.activities.unshift(activity);

    // Limiter à 1000 activités pour éviter une surcharge
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(0, 1000);
    }

    // Vérifier l'authentification avant de sauvegarder
    const token = localStorage.getItem('konipa_access_token');
    if (token) {
      await this.saveActivities();
    }
    return activity;
  }

  // Obtenir les activités d'une date spécifique
  getActivitiesByDate(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.activities.filter(activity => activity.date === targetDate);
  }

  // Obtenir toutes les activités
  getAllActivities() {
    return this.activities;
  }

  // Obtenir les activités par type
  getActivitiesByType(type, date = null) {
    let filtered = this.activities.filter(activity => activity.type === type);
    if (date) {
      filtered = filtered.filter(activity => activity.date === date);
    }
    return filtered;
  }

  // Obtenir un résumé des activités du jour
  getDailySummary(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dailyActivities = this.getActivitiesByDate(targetDate);

    const summary = {
      date: targetDate,
      totalActivities: dailyActivities.length,
      byType: {},
      timeline: dailyActivities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    };

    // Compter par type
    dailyActivities.forEach(activity => {
      summary.byType[activity.type] = (summary.byType[activity.type] || 0) + 1;
    });

    return summary;
  }

  // Méthodes spécifiques pour différents types d'activités

  // === ACTIVITÉS COMPTABLES ===
  async logAccountingActivity(action, details) {
    return await this.logActivity('accounting', `Activité comptable: ${action}`, details);
  }

  // === GESTION DES COMMANDES ===
  async logOrderCreation(orderNumber, customer, amount, details) {
    return await this.logActivity('order_creation', 
      `Nouvelle commande ${orderNumber} créée pour ${customer} (${amount} MAD)`, 
      { orderNumber, customer, amount, ...details }
    );
  }

  async logOrderValidation(orderNumber, action, details) {
    return await this.logActivity('order_validation', 
      `Commande ${orderNumber}: ${action}`, 
      { orderNumber, ...details }
    );
  }

  async logOrderStatusChange(orderNumber, oldStatus, newStatus, details) {
    return await this.logActivity('order_status', 
      `Commande ${orderNumber}: ${oldStatus} → ${newStatus}`, 
      { orderNumber, oldStatus, newStatus, ...details }
    );
  }

  async logOrderCancellation(orderNumber, reason, details) {
    return await this.logActivity('order_cancellation', 
      `Commande ${orderNumber} annulée: ${reason}`, 
      { orderNumber, reason, ...details }
    );
  }

  // === GESTION DES FACTURES ===
  async logInvoiceGeneration(invoiceRef, orderNumber, amount, details) {
    return await this.logActivity('invoice_generation', 
      `Facture ${invoiceRef} générée pour commande ${orderNumber} (${amount} MAD)`, 
      { invoiceRef, orderNumber, amount, ...details }
    );
  }

  async logInvoiceValidation(invoiceRef, action, details) {
    return await this.logActivity('invoice_validation', 
      `Facture ${invoiceRef}: ${action}`, 
      { invoiceRef, ...details }
    );
  }

  async logUnpaidInvoiceActivity(action, invoiceRef, details) {
    return await this.logActivity('unpaid_invoice', 
      `Facture impayée ${invoiceRef}: ${action}`, 
      { invoiceRef, ...details }
    );
  }

  async logPaymentReceived(invoiceRef, amount, paymentMethod, details) {
    return await this.logActivity('payment_received', 
      `Paiement reçu pour facture ${invoiceRef}: ${amount} MAD (${paymentMethod})`, 
      { invoiceRef, amount, paymentMethod, ...details }
    );
  }

  // === GESTION DES UTILISATEURS ===
  async logUserLogin(username, details) {
    return await this.logActivity('user_login', 
      `Connexion utilisateur: ${username}`, 
      { username, ...details }
    );
  }

  async logUserLogout(username, details) {
    return await this.logActivity('user_logout', 
      `Déconnexion utilisateur: ${username}`, 
      { username, ...details }
    );
  }

  async logUserCreation(username, role, details) {
    return await this.logActivity('user_creation', 
      `Nouvel utilisateur créé: ${username} (${role})`, 
      { username, role, ...details }
    );
  }

  async logUserActivity(action, username, details) {
    return await this.logActivity('user_activity', 
      `Utilisateur ${username}: ${action}`, 
      { username, ...details }
    );
  }

  async logAccountBlocked(username, reason, details) {
    return await this.logActivity('account_blocked', 
      `Compte bloqué: ${username} - ${reason}`, 
      { username, reason, ...details }
    );
  }

  async logAccountUnblocked(username, details) {
    return await this.logActivity('account_unblocked', 
      `Compte débloqué: ${username}`, 
      { username, ...details }
    );
  }

  async logPasswordReset(username, details) {
    return await this.logActivity('password_reset', 
      `Mot de passe réinitialisé pour: ${username}`, 
      { username, ...details }
    );
  }

  // === GESTION DES PRODUITS ===
  async logProductCreation(productName, sku, price, details) {
    return await this.logActivity('product_creation', 
      `Nouveau produit créé: ${productName} (${sku}) - ${price} MAD`, 
      { productName, sku, price, ...details }
    );
  }

  async logProductUpdate(productName, changes, details) {
    return await this.logActivity('product_update', 
      `Produit modifié: ${productName} - ${changes}`, 
      { productName, changes, ...details }
    );
  }

  async logProductDeletion(productName, sku, details) {
    return await this.logActivity('product_deletion', 
      `Produit supprimé: ${productName} (${sku})`, 
      { productName, sku, ...details }
    );
  }

  async logStockUpdate(productName, oldStock, newStock, details) {
    return await this.logActivity('stock_update', 
      `Stock mis à jour pour ${productName}: ${oldStock} → ${newStock}`, 
      { productName, oldStock, newStock, ...details }
    );
  }

  // === GESTION DES CLIENTS ===
  async logClientCreation(clientName, email, details) {
    return await this.logActivity('client_creation', 
      `Nouveau client créé: ${clientName} (${email})`, 
      { clientName, email, ...details }
    );
  }

  async logClientUpdate(clientName, changes, details) {
    return await this.logActivity('client_update', 
      `Client modifié: ${clientName} - ${changes}`, 
      { clientName, changes, ...details }
    );
  }

  async logThresholdUpdate(clientName, oldThreshold, newThreshold, details) {
    return await this.logActivity('threshold_update', 
      `Seuil CA modifié pour ${clientName}: ${oldThreshold} → ${newThreshold} MAD`, 
      { clientName, oldThreshold, newThreshold, ...details }
    );
  }

  // === ÉVÉNEMENTS SYSTÈME ===
  async logSystemEvent(eventType, details) {
    return await this.logActivity('system_event', 
      `Événement système: ${eventType}`, 
      { eventType, ...details }
    );
  }

  async logSystemError(errorType, details) {
    return await this.logActivity('system_error', 
      `Erreur système: ${errorType}`, 
      { errorType, ...details }
    );
  }

  async logUserStatusChange(userId, username, oldStatus, newStatus, details) {
    return await this.logActivity('user_status_change', 
      `Statut utilisateur ${username}: ${oldStatus} → ${newStatus}`, 
      { userId, username, oldStatus, newStatus, ...details }
    );
  }

  async logConfigurationChange(changeType, details) {
    return await this.logActivity('configuration_change', 
      `Configuration modifiée: ${changeType}`, 
      { changeType, ...details }
    );
  }

  async logReportGeneration(reportType, details) {
    return await this.logActivity('report_generation', 
      `Rapport généré: ${reportType}`, 
      { reportType, ...details }
    );
  }

  async logCreditLimitUpdate(clientName, oldLimit, newLimit, details) {
    return await this.logActivity('credit_limit_update', 
      `Limite de crédit modifiée pour ${clientName}: ${oldLimit} → ${newLimit} MAD`, 
      { clientName, oldLimit, newLimit, ...details }
    );
  }

  // === SYSTÈME ET SÉCURITÉ ===
  async logSystemError(error, context, details) {
    return await this.logActivity('system_error', 
      `Erreur système: ${error}`, 
      { error, context, ...details }
    );
  }

  async logSecurityAlert(alertType, description, details) {
    return await this.logActivity('security_alert', 
      `Alerte sécurité (${alertType}): ${description}`, 
      { alertType, description, ...details }
    );
  }

  async logSageSync(status, details) {
    return await this.logActivity('sage_sync', 
      `Synchronisation Sage: ${status}`, 
      details
    );
  }

  async logBackup(status, details) {
    return await this.logActivity('backup', 
      `Sauvegarde: ${status}`, 
      details
    );
  }

  // === RAPPORTS ET EXPORTS ===
  async logReportGeneration(reportType, period, details) {
    return await this.logActivity('report_generation', 
      `Rapport généré: ${reportType} (${period})`, 
      { reportType, period, ...details }
    );
  }

  async logDataExport(exportType, format, details) {
    return await this.logActivity('data_export', 
      `Export de données: ${exportType} (${format})`, 
      { exportType, format, ...details }
    );
  }

  // === CONFIGURATION ===
  async logConfigurationChange(setting, oldValue, newValue, details) {
    return await this.logActivity('configuration_change', 
      `Configuration modifiée: ${setting} (${oldValue} → ${newValue})`, 
      { setting, oldValue, newValue, ...details }
    );
  }

  // Nettoyer les anciennes activités (garder seulement les 30 derniers jours)
  cleanOldActivities(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    this.activities = this.activities.filter(activity => activity.date >= cutoffDateString);
    
    // Vérifier l'authentification avant de sauvegarder
    const token = localStorage.getItem('konipa_access_token');
    if (token) {
      this.saveActivities();
    }
  }

  // Exporter les activités en CSV
  exportToCSV(startDate = null, endDate = null) {
    let activitiesToExport = this.activities;

    if (startDate) {
      activitiesToExport = activitiesToExport.filter(activity => activity.date >= startDate);
    }
    if (endDate) {
      activitiesToExport = activitiesToExport.filter(activity => activity.date <= endDate);
    }

    const headers = ['Date', 'Heure', 'Type', 'Description', 'Utilisateur', 'Détails'];
    const csvContent = [
      headers.join(','),
      ...activitiesToExport.map(activity => [
        activity.date,
        activity.time,
        activity.type,
        `"${activity.description}"`,
        activity.user,
        `"${JSON.stringify(activity.details)}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Obtenir les statistiques
  getStatistics(days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentActivities = this.activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= startDate && activityDate <= endDate;
    });

    const stats = {
      totalActivities: recentActivities.length,
      averagePerDay: Math.round(recentActivities.length / days),
      byType: {},
      byDay: {},
      mostActiveDay: null,
      mostActiveType: null
    };

    // Statistiques par type
    recentActivities.forEach(activity => {
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
      stats.byDay[activity.date] = (stats.byDay[activity.date] || 0) + 1;
    });

    // Jour le plus actif
    let maxActivities = 0;
    Object.entries(stats.byDay).forEach(([date, count]) => {
      if (count > maxActivities) {
        maxActivities = count;
        stats.mostActiveDay = { date, count };
      }
    });

    // Type le plus fréquent
    let maxTypeCount = 0;
    Object.entries(stats.byType).forEach(([type, count]) => {
      if (count > maxTypeCount) {
        maxTypeCount = count;
        stats.mostActiveType = { type, count };
      }
    });

    return stats;
  }

  // Méthodes pour le temps réel
  getActivitiesCount() {
    return this.activities.length;
  }

  getActivitiesSince(timestamp) {
    return this.activities.filter(activity => 
      new Date(activity.timestamp) > new Date(timestamp)
    );
  }

  async checkForNewActivities(lastCheckTime) {
    try {
      // Vérifier d'abord localement
      const localNewActivities = this.getActivitiesSince(lastCheckTime);
      
      // Puis vérifier sur le serveur
      const token = localStorage.getItem('konipa_access_token');
      if (token) {
        const response = await apiService.post('/journal/activities/since', {
          timestamp: lastCheckTime
        });
        
        if (response.success) {
          const serverNewActivities = response.data.activities || [];
          // Fusionner et dédupliquer les activités
          const allNewActivities = [...localNewActivities];
          
          serverNewActivities.forEach(serverActivity => {
            if (!allNewActivities.find(local => local.id === serverActivity.id)) {
              allNewActivities.push(serverActivity);
            }
          });
          
          // Ajouter les nouvelles activités du serveur au stockage local
          serverNewActivities.forEach(activity => {
            if (!this.activities.find(existing => existing.id === activity.id)) {
              this.activities.unshift(activity);
            }
          });
          
          // Maintenir la limite de 1000 activités
          if (this.activities.length > 1000) {
            this.activities = this.activities.slice(0, 1000);
          }
          
          await this.saveActivities();
          return allNewActivities;
        }
      }
      
      return localNewActivities;
    } catch (error) {
      // En cas d'erreur, retourner les activités locales
      return this.getActivitiesSince(lastCheckTime);
    }
  }

  async refreshActivities() {
    try {
      await this.loadActivities();
      return this.activities;
    } catch (error) {
      return this.activities;
    }
  }
}

// Instance singleton
const adminJournalService = new AdminJournalService();

// Le nettoyage sera fait lors de la première connexion utilisateur

// Export nommé et par défaut pour compatibilité
export { adminJournalService };
export default adminJournalService;