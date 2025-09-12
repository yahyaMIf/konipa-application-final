// Service pour gérer les limites de quantité par produit et par client
class ProductLimitService {
  constructor() {
    this.productLimits = new Map();
    this.clientPurchases = new Map();
    this.loadData();
  }

  // Charger les données depuis le localStorage
  loadData() {
    try {
      const limits = localStorage.getItem('productLimits');
      const purchases = localStorage.getItem('clientPurchases');
      
      if (limits) {
        this.productLimits = new Map(JSON.parse(limits));
      }
      
      if (purchases) {
        this.clientPurchases = new Map(JSON.parse(purchases));
      }
    } catch (error) {
      }
  }

  // Sauvegarder les données dans le localStorage
  saveData() {
    try {
      localStorage.setItem('productLimits', JSON.stringify(Array.from(this.productLimits.entries())));
      localStorage.setItem('clientPurchases', JSON.stringify(Array.from(this.clientPurchases.entries())));
    } catch (error) {
      }
  }

  // Définir une limite de quantité pour un produit
  setProductLimit(productId, maxQuantity, period = 'monthly') {
    if (maxQuantity < 0) {
      throw new Error('La quantité maximale doit être positive');
    }
    
    this.productLimits.set(productId, {
      maxQuantity,
      period, // 'daily', 'weekly', 'monthly', 'yearly'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    this.saveData();
  }

  // Obtenir la limite d'un produit
  getProductLimit(productId) {
    return this.productLimits.get(productId);
  }

  // Supprimer la limite d'un produit
  removeProductLimit(productId) {
    this.productLimits.delete(productId);
    this.saveData();
  }

  // Enregistrer un achat
  recordPurchase(clientId, productId, quantity) {
    const key = `${clientId}_${productId}`;
    const now = new Date();
    
    if (!this.clientPurchases.has(key)) {
      this.clientPurchases.set(key, []);
    }
    
    const purchases = this.clientPurchases.get(key);
    purchases.push({
      quantity,
      date: now.toISOString(),
      timestamp: now.getTime()
    });
    
    this.saveData();
  }

  // Calculer la quantité achetée dans une période
  getQuantityInPeriod(clientId, productId, period) {
    const key = `${clientId}_${productId}`;
    const purchases = this.clientPurchases.get(key) || [];
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    return purchases
      .filter(purchase => new Date(purchase.date) >= startDate)
      .reduce((total, purchase) => total + purchase.quantity, 0);
  }

  // Vérifier si un client peut acheter une quantité donnée
  canPurchase(clientId, productId, requestedQuantity) {
    const limit = this.getProductLimit(productId);
    
    if (!limit) {
      return { allowed: true, reason: null };
    }
    
    const currentQuantity = this.getQuantityInPeriod(clientId, productId, limit.period);
    const totalAfterPurchase = currentQuantity + requestedQuantity;
    
    if (totalAfterPurchase > limit.maxQuantity) {
      return {
        allowed: false,
        reason: `Limite dépassée. Maximum autorisé: ${limit.maxQuantity}, Déjà acheté: ${currentQuantity}, Demandé: ${requestedQuantity}`,
        maxQuantity: limit.maxQuantity,
        currentQuantity,
        availableQuantity: Math.max(0, limit.maxQuantity - currentQuantity)
      };
    }
    
    return { allowed: true, reason: null };
  }

  // Obtenir toutes les limites de produits
  getAllProductLimits() {
    return Array.from(this.productLimits.entries()).map(([productId, limit]) => ({
      productId,
      ...limit
    }));
  }

  // Obtenir l'historique des achats d'un client
  getClientPurchaseHistory(clientId) {
    const history = [];
    
    for (const [key, purchases] of this.clientPurchases.entries()) {
      if (key.startsWith(`${clientId}_`)) {
        const productId = key.split('_')[1];
        history.push({
          productId,
          purchases: purchases.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
      }
    }
    
    return history;
  }

  // Nettoyer les anciens achats (pour optimiser les performances)
  cleanOldPurchases() {
    const oneYearAgo = new Date().getTime() - 365 * 24 * 60 * 60 * 1000;
    
    for (const [key, purchases] of this.clientPurchases.entries()) {
      const filteredPurchases = purchases.filter(purchase => purchase.timestamp > oneYearAgo);
      this.clientPurchases.set(key, filteredPurchases);
    }
    
    this.saveData();
  }
}

// Instance singleton
const productLimitService = new ProductLimitService();
export default productLimitService;