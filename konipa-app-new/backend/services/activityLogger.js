const { logActivity } = require('../controllers/journalController');

/**
 * Service pour enregistrer automatiquement les activités importantes
 * dans le journal d'activité
 */
class ActivityLogger {
  
  /**
   * Enregistrer une connexion utilisateur
   */
  static async logUserLogin(user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Connexion utilisateur',
        description: `${user.firstName} ${user.lastName} (${user.email}) s'est connecté`,
        type: 'auth',
        priority: 'low',
        status: 'completed'
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la connexion:', error);
    }
  }

  /**
   * Enregistrer une déconnexion utilisateur
   */
  static async logUserLogout(user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Déconnexion utilisateur',
        description: `${user.firstName} ${user.lastName} (${user.email}) s'est déconnecté`,
        type: 'auth',
        priority: 'low',
        status: 'completed'
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la déconnexion:', error);
    }
  }

  /**
   * Enregistrer la création d'une commande
   */
  static async logOrderCreated(order, user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Nouvelle commande créée',
        description: `Commande #${order.id} créée pour un montant de ${order.totalAmount}€`,
        type: 'order',
        priority: 'medium',
        status: 'completed',
        resourceId: order.id
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la création de commande:', error);
    }
  }

  /**
   * Enregistrer la validation d'une commande
   */
  static async logOrderValidated(order, user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Commande validée',
        description: `Commande #${order.id} validée par ${user.firstName} ${user.lastName}`,
        type: 'order',
        priority: 'high',
        status: 'completed',
        resourceId: order.id
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la validation de commande:', error);
    }
  }

  /**
   * Enregistrer le rejet d'une commande
   */
  static async logOrderRejected(order, user, reason, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Commande rejetée',
        description: `Commande #${order.id} rejetée par ${user.firstName} ${user.lastName}. Raison: ${reason}`,
        type: 'order',
        priority: 'high',
        status: 'completed',
        resourceId: order.id
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du rejet de commande:', error);
    }
  }

  /**
   * Enregistrer la création d'un utilisateur
   */
  static async logUserCreated(newUser, createdBy, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Nouvel utilisateur créé',
        description: `Utilisateur ${newUser.firstName} ${newUser.lastName} (${newUser.email}) créé par ${createdBy.firstName} ${createdBy.lastName}`,
        type: 'user',
        priority: 'medium',
        status: 'completed',
        resourceId: newUser.id
      }, createdBy, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la création d\'utilisateur:', error);
    }
  }

  /**
   * Enregistrer le blocage/déblocage d'un utilisateur
   */
  static async logUserStatusChanged(targetUser, newStatus, changedBy, ipAddress, userAgent) {
    try {
      const action = newStatus === 'blocked' ? 'bloqué' : 'débloqué';
      await logActivity({
        title: `Utilisateur ${action}`,
        description: `Utilisateur ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email}) ${action} par ${changedBy.firstName} ${changedBy.lastName}`,
        type: 'user',
        priority: 'high',
        status: 'completed',
        resourceId: targetUser.id
      }, changedBy, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du changement de statut utilisateur:', error);
    }
  }

  /**
   * Enregistrer la modification d'un produit
   */
  static async logProductUpdated(product, user, changes, ipAddress, userAgent) {
    try {
      const changesText = Object.keys(changes).join(', ');
      await logActivity({
        title: 'Produit modifié',
        description: `Produit ${product.name} modifié par ${user.firstName} ${user.lastName}. Champs modifiés: ${changesText}`,
        type: 'product',
        priority: 'medium',
        status: 'completed',
        resourceId: product.id,
        oldValues: changes
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la modification de produit:', error);
    }
  }

  /**
   * Enregistrer une modification de tarification
   */
  static async logPricingUpdated(client, product, oldPrice, newPrice, user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Tarification modifiée',
        description: `Prix du produit ${product.name} pour le client ${client.name} modifié de ${oldPrice}€ à ${newPrice}€ par ${user.firstName} ${user.lastName}`,
        type: 'pricing',
        priority: 'high',
        status: 'completed',
        resourceId: product.id,
        oldValues: { price: oldPrice },
        newValues: { price: newPrice }
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la modification de tarification:', error);
    }
  }

  /**
   * Enregistrer une modification de limite de crédit
   */
  static async logCreditLimitUpdated(client, oldLimit, newLimit, user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Limite de crédit modifiée',
        description: `Limite de crédit du client ${client.name} modifiée de ${oldLimit}€ à ${newLimit}€ par ${user.firstName} ${user.lastName}`,
        type: 'credit',
        priority: 'high',
        status: 'completed',
        resourceId: client.id,
        oldValues: { creditLimit: oldLimit },
        newValues: { creditLimit: newLimit }
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la modification de limite de crédit:', error);
    }
  }

  /**
   * Enregistrer une erreur système
   */
  static async logSystemError(error, context, user = null, ipAddress = null, userAgent = null) {
    try {
      await logActivity({
        title: 'Erreur système',
        description: `Erreur dans ${context}: ${error.message}`,
        type: 'error',
        priority: 'high',
        status: 'error'
      }, user, ipAddress, userAgent);
    } catch (logError) {
      console.error('Erreur lors de l\'enregistrement de l\'erreur système:', logError);
    }
  }

  /**
   * Enregistrer la création d'un client
   */
  static async logClientCreated(client, user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Nouveau client créé',
        description: `Client ${client.name} (${client.email}) créé par ${user.firstName} ${user.lastName}`,
        type: 'client',
        priority: 'medium',
        status: 'completed',
        resourceId: client.id
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la création de client:', error);
    }
  }

  /**
   * Enregistrer la modification d'un client
   */
  static async logClientUpdated(client, user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Client modifié',
        description: `Client ${client.name} (${client.email}) modifié par ${user.firstName} ${user.lastName}`,
        type: 'client',
        priority: 'medium',
        status: 'completed',
        resourceId: client.id
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la modification de client:', error);
    }
  }

  /**
   * Enregistrer la suppression d'un client
   */
  static async logClientDeleted(client, user, ipAddress, userAgent) {
    try {
      await logActivity({
        title: 'Client supprimé',
        description: `Client ${client.name} (${client.email}) supprimé par ${user.firstName} ${user.lastName}`,
        type: 'client',
        priority: 'high',
        status: 'completed',
        resourceId: client.id
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la suppression de client:', error);
    }
  }

  /**
   * Enregistrer la modification d'une commande
   */
  static async logOrderUpdated(user, order, updates, oldStatus) {
    try {
      await logActivity({
        title: 'Commande modifiée',
        description: `Commande #${order.order_number} modifiée par ${user.firstName} ${user.lastName}`,
        type: 'order',
        priority: 'medium',
        status: 'completed',
        resourceId: order.id,
        oldValues: { status: oldStatus },
        newValues: updates
      }, user);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la modification de commande:', error);
    }
  }

  /**
   * Enregistrer la suppression d'une commande
   */
  static async logOrderDeleted(user, orderData, clientData) {
    try {
      await logActivity({
        title: 'Commande supprimée',
        description: `Commande #${orderData.order_number} du client ${clientData.name} supprimée par ${user.firstName} ${user.lastName}`,
        type: 'order',
        priority: 'high',
        status: 'completed',
        resourceId: orderData.id
      }, user);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la suppression de commande:', error);
    }
  }

  /**
   * Enregistrer la création d'un produit
   */
  static async logProductCreated(userId, productId, productName) {
    try {
      await logActivity({
        title: 'Nouveau produit créé',
        description: `Produit ${productName} créé`,
        type: 'product',
        priority: 'medium',
        status: 'completed',
        resourceId: productId
      }, { id: userId });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la création de produit:', error);
    }
  }

  /**
   * Enregistrer la modification d'un produit (version simplifiée)
   */
  static async logProductUpdated(userId, productId, productName) {
    try {
      await logActivity({
        title: 'Produit modifié',
        description: `Produit ${productName} modifié`,
        type: 'product',
        priority: 'medium',
        status: 'completed',
        resourceId: productId
      }, { id: userId });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la modification de produit:', error);
    }
  }

  /**
   * Enregistrer la suppression d'un produit
   */
  static async logProductDeleted(userId, productId, productName) {
    try {
      await logActivity({
        title: 'Produit supprimé',
        description: `Produit ${productName} supprimé`,
        type: 'product',
        priority: 'high',
        status: 'completed',
        resourceId: productId
      }, { id: userId });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la suppression de produit:', error);
    }
  }

  /**
   * Enregistrer la création d'un devis
   */
  static async logQuoteCreated(user, quote, clientId) {
    try {
      await logActivity({
        title: 'Nouveau devis créé',
        description: `Devis #${quote.quote_number} créé par ${user.firstName} ${user.lastName} pour le client ID ${clientId}`,
        type: 'quote',
        priority: 'medium',
        status: 'completed',
        resourceId: quote.id
      }, user);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la création de devis:', error);
    }
  }

  /**
   * Enregistrer le traitement d'une demande de crédit
   */
  static async logCreditRequestProcessed(user, creditRequest, action, newLimit, comments) {
    try {
      const actionText = action === 'approve' ? 'approuvée' : 'rejetée';
      const description = action === 'approve' 
        ? `Demande de crédit #${creditRequest.id} ${actionText} par ${user.firstName} ${user.lastName}. Nouvelle limite: ${newLimit} DH`
        : `Demande de crédit #${creditRequest.id} ${actionText} par ${user.firstName} ${user.lastName}. ${comments || ''}`;
      
      await logActivity({
        title: `Demande de crédit ${actionText}`,
        description,
        type: 'credit',
        priority: 'high',
        status: 'completed',
        resourceId: creditRequest.id
      }, user);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du traitement de demande de crédit:', error);
    }
  }

  /**
   * Enregistrer une activité personnalisée
   */
  static async logCustomActivity(title, description, type = 'info', priority = 'medium', user = null, ipAddress = null, userAgent = null) {
    try {
      await logActivity({
        title,
        description,
        type,
        priority,
        status: 'completed'
      }, user, ipAddress, userAgent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'activité personnalisée:', error);
    }
  }
}

module.exports = ActivityLogger;