// Service de Webhooks pour Konipa
// Gestion des événements en temps réel et intégrations externes

import { adminJournalService } from './adminJournalService';

class WebhookService {
  constructor() {
    this.webhooks = new Map();
    this.eventQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 seconde
  }

  // Enregistrement d'un webhook
  registerWebhook(id, config) {
    const webhook = {
      id,
      url: config.url,
      events: config.events || [],
      headers: config.headers || {},
      secret: config.secret,
      active: config.active !== false,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      successCount: 0,
      failureCount: 0
    };

    this.webhooks.set(id, webhook);

    // Logger l'enregistrement du webhook
    adminJournalService.logConfigurationChange({
      changeType: 'Webhook enregistré',
      webhookId: id,
      url: config.url,
      events: config.events,
      active: webhook.active,
      timestamp: new Date().toISOString()
    });
    
    return webhook;
  }

  // Suppression d'un webhook
  unregisterWebhook(id) {
    const deleted = this.webhooks.delete(id);
    if (deleted) {

    }
    return deleted;
  }

  // Déclenchement d'un événement
  async triggerEvent(eventType, data) {

    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      attempts: 0
    };

    // Ajouter à la queue
    this.eventQueue.push(event);

    // Traiter la queue si pas déjà en cours
    if (!this.isProcessing) {
      this.processEventQueue();
    }

    return event.id;
  }

  // Traitement de la queue d'événements
  async processEventQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this.processEvent(event);
    }

    this.isProcessing = false;

  }

  // Traitement d'un événement individuel
  async processEvent(event) {
    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => 
        webhook.active && 
        (webhook.events.length === 0 || webhook.events.includes(event.type))
      );

    if (relevantWebhooks.length === 0) {

      return;
    }

    // Envoyer à tous les webhooks pertinents
    const promises = relevantWebhooks.map(webhook => 
      this.sendWebhook(webhook, event)
    );

    await Promise.allSettled(promises);
  }

  // Envoi d'un webhook
  async sendWebhook(webhook, event) {
    const payload = {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      webhook_id: webhook.id
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Konipa-Webhook/1.0',
      'X-Konipa-Event': event.type,
      'X-Konipa-Delivery': event.id,
      ...webhook.headers
    };

    // Ajouter signature si secret fourni
    if (webhook.secret) {
      headers['X-Konipa-Signature'] = this.generateSignature(payload, webhook.secret);
    }

    let attempt = 0;
    let success = false;

    while (attempt < this.retryAttempts && !success) {
      attempt++;
      
      try {

        // Envoi HTTP réel
        const response = await this.makeHttpRequest(webhook.url, {
          headers: headers,
          body: payload
        });

        if (response.ok) {
          webhook.successCount++;
          webhook.lastTriggered = new Date().toISOString();
          success = true;

          // Logger le succès du webhook
          adminJournalService.logSystemEvent({
            eventType: 'Webhook envoyé avec succès',
            webhookId: webhook.id,
            url: webhook.url,
            eventType: event.type,
            attempt: attempt,
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        :`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // Backoff exponentiel
        } else {
          webhook.failureCount++;
          // Logger l'échec définitif du webhook
          adminJournalService.logSystemError({
            errorType: 'Échec webhook définitif',
            webhookId: webhook.id,
            url: webhook.url,
            eventType: event.type,
            attempts: this.retryAttempts,
            lastError: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return success;
  }

  // Génération de signature HMAC
  generateSignature(payload, secret) {
    // Simulation de signature HMAC-SHA256
    const data = JSON.stringify(payload);
    return `sha256=${Buffer.from(data + secret).toString('base64')}`;
  }

  // Requête HTTP réelle
  async makeHttpRequest(url, options) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(options.body),
        timeout: 10000 // 10 secondes
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Utilitaire de délai
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Événements prédéfinis pour Konipa
  
  // Événements de commande
  async orderCreated(orderData) {
    return this.triggerEvent('order.created', {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      customerId: orderData.customerId,
      totalAmount: orderData.totalAmount,
      items: orderData.items,
      status: orderData.status,
      createdAt: orderData.createdAt
    });
  }

  async orderStatusChanged(orderId, oldStatus, newStatus) {
    return this.triggerEvent('order.status_changed', {
      orderId,
      oldStatus,
      newStatus,
      changedAt: new Date().toISOString()
    });
  }

  async orderShipped(orderData) {
    return this.triggerEvent('order.shipped', {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      trackingNumber: orderData.trackingNumber,
      carrier: orderData.carrier,
      shippedAt: new Date().toISOString()
    });
  }

  // Événements de stock
  async stockLevelLow(productData) {
    return this.triggerEvent('inventory.stock_low', {
      productId: productData.id,
      productName: productData.name,
      currentStock: productData.stock,
      minStock: productData.minStock,
      alertLevel: 'warning'
    });
  }

  async stockLevelCritical(productData) {
    return this.triggerEvent('inventory.stock_critical', {
      productId: productData.id,
      productName: productData.name,
      currentStock: productData.stock,
      minStock: productData.minStock,
      alertLevel: 'critical'
    });
  }

  // Événements de client
  async customerRegistered(customerData) {
    return this.triggerEvent('customer.registered', {
      customerId: customerData.id,
      email: customerData.email,
      company: customerData.company,
      registeredAt: customerData.createdAt
    });
  }

  // Événements de paiement
  async paymentReceived(paymentData) {
    return this.triggerEvent('payment.received', {
      paymentId: paymentData.id,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      method: paymentData.method,
      status: paymentData.status,
      receivedAt: new Date().toISOString()
    });
  }

  // Événements système
  async systemAlert(alertData) {
    return this.triggerEvent('system.alert', {
      alertType: alertData.type,
      severity: alertData.severity,
      message: alertData.message,
      details: alertData.details,
      timestamp: new Date().toISOString()
    });
  }

  // Méthodes de gestion
  
  getWebhookStats() {
    const stats = {
      totalWebhooks: this.webhooks.size,
      activeWebhooks: 0,
      totalSuccess: 0,
      totalFailures: 0,
      queueLength: this.eventQueue.length
    };

    this.webhooks.forEach(webhook => {
      if (webhook.active) stats.activeWebhooks++;
      stats.totalSuccess += webhook.successCount;
      stats.totalFailures += webhook.failureCount;
    });

    return stats;
  }

  getWebhookList() {
    return Array.from(this.webhooks.values());
  }

  getWebhook(id) {
    return this.webhooks.get(id);
  }

  updateWebhook(id, updates) {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      Object.assign(webhook, updates);

      return webhook;
    }
    return null;
  }

  // Test d'un webhook
  async testWebhook(id) {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      throw new Error(`Webhook ${id} non trouvé`);
    }

    const testEvent = {
      id: `test_${Date.now()}`,
      type: 'webhook.test',
      data: {
        message: 'Test webhook from Konipa',
        webhookId: id,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      attempts: 0
    };

    const success = await this.sendWebhook(webhook, testEvent);
    
    return {
      webhookId: id,
      success,
      testEventId: testEvent.id,
      timestamp: testEvent.timestamp
    };
  }
}

// Instance singleton
const webhookService = new WebhookService();

// Configuration des webhooks par défaut pour la démo
webhookService.registerWebhook('sage_integration', {
  url: 'https://api.sage.konipa.com/webhooks/orders',
  events: ['order.created', 'order.status_changed'],
  headers: {
    'Authorization': 'Bearer sage_api_token'
  },
  secret: 'sage_webhook_secret'
});

webhookService.registerWebhook('inventory_alerts', {
  url: 'https://alerts.konipa.com/webhooks/inventory',
  events: ['inventory.stock_low', 'inventory.stock_critical'],
  headers: {
    'X-API-Key': 'inventory_api_key'
  }
});

webhookService.registerWebhook('customer_notifications', {
  url: 'https://notifications.konipa.com/webhooks/customers',
  events: ['order.shipped', 'payment.received'],
  headers: {
    'Authorization': 'Bearer notification_token'
  }
});

export default webhookService;

