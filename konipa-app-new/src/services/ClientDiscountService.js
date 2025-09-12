// Service pour gérer les réductions spécifiques par client
import { adminJournalService } from './adminJournalService';

class ClientDiscountService {
  constructor() {
    this.clientDiscounts = new Map();
    this.loadClientDiscounts();
  }

  // Charger les réductions clients depuis le localStorage
  loadClientDiscounts() {
    try {
      const saved = localStorage.getItem('clientDiscounts');
      if (saved) {
        const data = JSON.parse(saved);
        this.clientDiscounts = new Map(data);
      }
    } catch (error) {
      }
  }

  // Sauvegarder les réductions clients dans le localStorage
  saveClientDiscounts() {
    try {
      const data = Array.from(this.clientDiscounts.entries());
      localStorage.setItem('clientDiscounts', JSON.stringify(data));
    } catch (error) {
      }
  }

  // Définir une réduction pour un client
  setClientDiscount(clientId, discountPercentage) {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Le pourcentage de réduction doit être entre 0 et 100');
    }
    
    const oldDiscount = this.getClientDiscount(clientId);
    
    this.clientDiscounts.set(clientId, {
      percentage: discountPercentage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Logger la modification de réduction client
    adminJournalService.logConfigurationChange({
      changeType: 'Réduction client modifiée',
      clientId: clientId,
      oldDiscount: oldDiscount.percentage,
      newDiscount: discountPercentage,
      timestamp: new Date().toISOString()
    });
    
    this.saveClientDiscounts();
  }

  // Obtenir la réduction d'un client
  getClientDiscount(clientId) {
    return this.clientDiscounts.get(clientId) || { percentage: 0 };
  }

  // Supprimer la réduction d'un client
  removeClientDiscount(clientId) {
    this.clientDiscounts.delete(clientId);
    this.saveClientDiscounts();
  }

  // Calculer le prix avec réduction pour un client
  calculateDiscountedPrice(clientId, originalPrice) {
    const discount = this.getClientDiscount(clientId);
    const discountAmount = (originalPrice * discount.percentage) / 100;
    return originalPrice - discountAmount;
  }

  // Obtenir tous les clients avec réductions
  getAllClientDiscounts() {
    return Array.from(this.clientDiscounts.entries()).map(([clientId, discount]) => ({
      clientId,
      ...discount
    }));
  }

  // Mettre à jour une réduction existante
  updateClientDiscount(clientId, newPercentage) {
    if (this.clientDiscounts.has(clientId)) {
      const existing = this.clientDiscounts.get(clientId);
      this.clientDiscounts.set(clientId, {
        ...existing,
        percentage: newPercentage,
        updatedAt: new Date().toISOString()
      });
      this.saveClientDiscounts();
    } else {
      throw new Error('Client non trouvé');
    }
  }
}

// Instance singleton
const clientDiscountService = new ClientDiscountService();
export default clientDiscountService;