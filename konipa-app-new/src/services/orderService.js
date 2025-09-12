// Service de gestion des commandes
import { adminJournalService } from './adminJournalService.js';
import apiService from './apiService.js';
import { ceoJournalService } from './ceoJournalService.js';

// Alias pour compatibilité
const orderAPI = {
  getAll: (params) => apiService.orders.getAll(params),
  getById: (id) => apiService.orders.getById(id),
  create: (orderData) => apiService.orders.create(orderData),
  update: (id, orderData) => apiService.orders.update(id, orderData),
  delete: (id) => apiService.orders.delete(id),
  updateStatus: (id, status) => apiService.orders.updateStatus(id, status)
};

class OrderService {
  constructor() {
    // No local state, data is always fetched from API
  }

  // Sauvegarder une commande via l'API
  async saveOrder(orderData) {
    try {
      const savedOrder = await orderAPI.create(orderData);
      return savedOrder.data; // Assuming backend returns { data: order }
    } catch (error) {
      throw error;
    }
  }

  // Obtenir toutes les commandes
  async getAllOrders(params) {
    try {
      const response = await orderAPI.getAll(params);
      return response.data; // Assuming backend returns { data: { orders: [...], pagination: {...} } }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      throw error;
    }
  }

  // Obtenir une commande par ID
  async getOrderById(id) {
    try {
      const response = await orderAPI.getById(id);
      return response.data; // Assuming backend returns { data: order }
    } catch (error) {
      console.error(`Erreur lors du chargement de la commande ${id}:`, error);
      throw error;
    }
  }

  // Ajouter une nouvelle commande
  async addOrder(orderData) {
    try {
      const newOrder = await orderAPI.create(orderData);
      
      // Logger la création de commande
      adminJournalService.logOrderCreation(
        newOrder.data.order_number,
        newOrder.data.client_id || 'Client non spécifié',
        newOrder.data.total_amount || 0,
        {
          salesperson: newOrder.data.user_id,
          itemsCount: newOrder.data.items ? newOrder.data.items.length : 0,
          notes: newOrder.data.notes
        }
      );
      
      return newOrder.data;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour une commande
  async updateOrder(id, updatedData) {
    try {
      const response = await orderAPI.update(id, updatedData);
      return response.data; // Assuming backend returns { data: order }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la commande ${id}:`, error);
      throw error;
    }
  }

  // Supprimer une commande
  async deleteOrder(id) {
    try {
      const response = await orderAPI.delete(id);
      
      // Logger la suppression de commande
      adminJournalService.logOrderCancellation(
        id,
        'Commande supprimée',
        {
          orderId: id
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la commande ${id}:`, error);
      throw error;
    }
  }

  // Valider une commande via l'API
  async validateOrder(id, status, comments = '') {
    try {
      const response = await orderAPI.updateStatus(id, status);
      const updatedOrder = response.data || response;
      
      // Enregistrer l'activité dans le journal admin
      const order = updatedOrder;
      const actionText = status === 'approved' ? 'approuvée' : 
                        status === 'rejected' ? 'rejetée' : 'mise à jour';
      
      adminJournalService.logOrderValidation(
        order.order_number, 
        actionText, 
        { 
          client: order.client_id, 
          salesperson: order.user_id, 
          amount: order.total_amount, 
          status, 
          comments
        }
      );
      
      // Enregistrer aussi dans le journal CEO
      ceoJournalService.logOrderValidation(
        order.order_number, 
        actionText, 
        { 
          client: order.client_id, 
          salesperson: order.user_id, 
          amount: order.total_amount, 
          status, 
          comments
        }
      );
      
      return updatedOrder;
    } catch (error) {
      console.error('Erreur lors de la validation de la commande:', error);
      throw error;
    }
  }

  // Filtrer les commandes par statut
  async getOrdersByStatus(status) {
    try {
      const response = await orderAPI.getAll({ status });
      return response.data; // Assuming backend returns { data: { orders: [...] } }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes par statut:', error);
      throw error;
    }
  }

  // Rechercher des commandes
  async searchOrders(searchTerm) {
    try {
      const response = await orderAPI.getAll({ search: searchTerm });
      return response.data; // Assuming backend returns { data: { orders: [...] } }
    } catch (error) {
      console.error('Erreur lors de la recherche de commandes:', error);
      throw error;
    }
  }

  // Obtenir les commandes en attente de validation
  async getOrdersForValidation() {
    try {
      const response = await orderAPI.getAll({ status: 'submitted' });
      return response.data; // Assuming backend returns { data: { orders: [...] } }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes pour validation:', error);
      return [];
    }
  }

  // Obtenir les statistiques des commandes (nécessite un endpoint backend)
  async getOrderStatistics() {
    try {
      const response = await apiService.orders.getStats(); // Assuming a getStats endpoint exists
      return response.data; // Assuming backend returns { data: stats }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques commandes:', error);
      throw error;
    }
  }
}

// Exporter une instance unique du service
const orderService = new OrderService();
export default orderService;