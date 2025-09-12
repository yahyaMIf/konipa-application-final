/**
 * Service d'intégration Sage 100
 * Gère la synchronisation des données entre Konipa et Sage 100
 */

class SageService {
  constructor() {
    this.config = {
      mode: 'real', // Mode de production par défaut
      apiUrl: '',
      apiKey: '',
      syncEnabled: false,
      lastSync: null,
      timeout: 30000, // 30 secondes
      retryAttempts: 3,
      modules: ['Clients', 'Produits', 'Commandes', 'Factures', 'Paiements', 'Stock'],
      syncFrequency: 'manual',
      enableLogs: true,
      enableNotifications: true
    };
    
    this.syncStatus = {
      isRunning: false,
      lastError: null,
      progress: 0,
      currentOperation: null
    };
  }

  /**
   * Configuration du service Sage
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('sage_config', JSON.stringify(this.config));
  }

  loadConfig() {
    const saved = localStorage.getItem('sage_config');
    if (saved) {
      this.config = { ...this.config, ...JSON.parse(saved) };
    }
  }

  /**
   * Test de connexion à Sage 100
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Connexion réussie',
          ...data
        };
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur de connexion: ${error.message}`
      };
    }
  }

  /**
   * Synchronisation complète des données
   */
  async syncAll() {
    if (this.syncStatus.isRunning) {
      throw new Error('Une synchronisation est déjà en cours');
    }

    this.syncStatus.isRunning = true;
    this.syncStatus.progress = 0;
    this.syncStatus.lastError = null;

    try {
      const allOperations = [
        { name: 'Clients', method: 'syncClients' },
        { name: 'Produits', method: 'syncProducts' },
        { name: 'Commandes', method: 'syncOrders' },
        { name: 'Factures', method: 'syncInvoices' },
        { name: 'Paiements', method: 'syncPayments' },
        { name: 'Stock', method: 'syncStock' }
      ];

      // Filtrer les opérations selon les modules sélectionnés
      const operations = allOperations.filter(op => 
        this.config.modules && this.config.modules.includes(op.name)
      );

      if (operations.length === 0) {
        throw new Error('Aucun module sélectionné pour la synchronisation');
      }

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        this.syncStatus.currentOperation = operation.name;
        this.syncStatus.progress = Math.round((i / operations.length) * 100);

        if (this.config.enableLogs) {

        }

        await this[operation.method]();
      }

      this.config.lastSync = new Date().toISOString();
      this.updateConfig(this.config);
      
      this.syncStatus.progress = 100;
      this.syncStatus.currentOperation = 'Terminé';
      
      return {
        success: true,
        message: 'Synchronisation complète réussie',
        timestamp: this.config.lastSync
      };
    } catch (error) {
      this.syncStatus.lastError = error.message;
      throw error;
    } finally {
      this.syncStatus.isRunning = false;
    }
  }

  /**
   * Synchronisation des clients
   */
  async syncClients() {
    try {
      const response = await this.makeApiCall('/clients');
      const clients = response.data;
      
      // Traitement des clients
      let imported = 0, updated = 0, errors = 0;
      
      for (const client of clients) {
        try {
          await this.processClient(client);
          if (client.isNew) imported++;
          else updated++;
        } catch (error) {
          errors++;
          }
      }
      
      return { imported, updated, errors };
    } catch (error) {
      throw new Error(`Erreur sync clients: ${error.message}`);
    }
  }

  /**
   * Synchronisation des produits
   */
  async syncProducts() {
    try {
      const response = await this.makeApiCall('/products');
      const products = response.data;
      
      let imported = 0, updated = 0, errors = 0;
      
      for (const product of products) {
        try {
          await this.processProduct(product);
          if (product.isNew) imported++;
          else updated++;
        } catch (error) {
          errors++;
          }
      }
      
      return { imported, updated, errors };
    } catch (error) {
      throw new Error(`Erreur sync produits: ${error.message}`);
    }
  }

  /**
   * Synchronisation des commandes
   */
  async syncOrders() {
    try {
      const response = await this.makeApiCall('/orders');
      const orders = response.data;
      
      let imported = 0, updated = 0, errors = 0;
      
      for (const order of orders) {
        try {
          await this.processOrder(order);
          if (order.isNew) imported++;
          else updated++;
        } catch (error) {
          errors++;
          }
      }
      
      return { imported, updated, errors };
    } catch (error) {
      throw new Error(`Erreur sync commandes: ${error.message}`);
    }
  }

  /**
   * Synchronisation des factures
   */
  async syncInvoices() {
    try {
      const response = await this.makeApiCall('/invoices');
      const invoices = response.data;
      
      let imported = 0, updated = 0, errors = 0;
      
      for (const invoice of invoices) {
        try {
          await this.processInvoice(invoice);
          if (invoice.isNew) imported++;
          else updated++;
        } catch (error) {
          errors++;
          }
      }
      
      return { imported, updated, errors };
    } catch (error) {
      throw new Error(`Erreur sync factures: ${error.message}`);
    }
  }

  /**
   * Synchronisation des paiements
   */
  async syncPayments() {
    try {
      const response = await this.makeApiCall('/payments');
      const payments = response.data;
      
      let imported = 0, updated = 0, errors = 0;
      
      for (const payment of payments) {
        try {
          await this.processPayment(payment);
          if (payment.isNew) imported++;
          else updated++;
        } catch (error) {
          errors++;
          }
      }
      
      return { imported, updated, errors };
    } catch (error) {
      throw new Error(`Erreur sync paiements: ${error.message}`);
    }
  }

  /**
   * Synchronisation du stock
   */
  async syncStock() {
    try {
      const response = await this.makeApiCall('/stock');
      const stockItems = response.data;
      
      let imported = 0, updated = 0, errors = 0;
      
      for (const item of stockItems) {
        try {
          await this.processStockItem(item);
          if (item.isNew) imported++;
          else updated++;
        } catch (error) {
          errors++;
          }
      }
      
      return { imported, updated, errors };
    } catch (error) {
      throw new Error(`Erreur sync stock: ${error.message}`);
    }
  }

  /**
   * Méthodes utilitaires
   */
  async makeApiCall(endpoint, options = {}) {
    const url = `${this.config.apiUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: this.config.timeout,
      ...options
    };

    let lastError;
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config);
        if (response.ok) {
          return await response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.config.retryAttempts) {
          await this.delay(1000 * attempt); // Délai progressif
        }
      }
    }
    throw lastError;
  }

  async processClient(client) {
    // Logique de traitement des clients
    await this.delay(100);
  }

  async processProduct(product) {
    // Logique de traitement des produits
    await this.delay(50);
  }

  async processOrder(order) {
    // Logique de traitement des commandes
    await this.delay(150);
  }

  async processInvoice(invoice) {
    // Logique de traitement des factures
    await this.delay(120);
  }

  async processPayment(payment) {
    // Logique de traitement des paiements
    await this.delay(80);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Getters pour l'état de synchronisation
   */
  getSyncStatus() {
    return { ...this.syncStatus };
  }

  getConfig() {
    return { ...this.config };
  }

  /**
   * Traitement d'un élément de stock
   */
  async processStockItem(item) {
    // Logique de traitement d'un élément de stock
    // Mise à jour des quantités, prix, etc.
    await this.delay(50);
    return item;
  }

  /**
   * Validation de la configuration
   */
  validateConfig() {
    const errors = [];
    
    if (this.config.mode === 'real') {
      if (!this.config.apiUrl) {
        errors.push('URL de l\'API Sage requise en mode réel');
      }
      if (!this.config.apiKey) {
        errors.push('Clé API Sage requise en mode réel');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Export des données vers Sage
   */
  async exportToSage(dataType, data) {
    try {
      const response = await this.makeApiCall(`/api/export/${dataType}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      return {
        success: true,
        message: `Export ${dataType} réussi`,
        ...response
      };
    } catch (error) {
      throw new Error(`Erreur export ${dataType}: ${error.message}`);
    }
  }
}

export default new SageService();