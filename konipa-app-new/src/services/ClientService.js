// Service de gestion des clients
import { apiService } from './api.js';
import adminJournalService from './adminJournalService.js';
import { ceoJournalService } from './ceoJournalService.js';

// Alias pour compatibilité
const clientAPI = {
  getClients: () => apiService.clients.getAll(),
  getClient: (id) => apiService.clients.getById(id),
  createClient: (data) => apiService.clients.create(data),
  updateClient: (id, data) => apiService.clients.update(id, data),
  deleteClient: (id) => apiService.clients.delete(id),
  searchClients: (query) => apiService.clients.search(query)
};

class ClientService {
  constructor() {
    // No local state, data is always fetched from API
  }

  // Obtenir tous les clients
  async getAllClients(params) {
    try {
      const response = await clientAPI.getClients(params);
      return response.data.clients; // Assuming backend returns { data: { clients: [...] } }
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  }

  // Alias pour getClients (compatibilité)
  async getClients(params) {
    return await this.getAllClients(params);
  }

  // Obtenir un client par ID
  async getClientById(id) {
    try {
      const response = await clientAPI.getClient(id);
      return response.data; // Assuming backend returns { data: client }
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  }

  // Créer un nouveau client
  async createClient(clientData) {
    try {
      const newClient = await clientAPI.createClient(clientData);
      
      // Enregistrer dans le journal Admin
      adminJournalService.addEntry({
        type: 'client_created',
        title: `Nouveau client ${newClient.data.company_name}`,
        description: `Client créé - ${newClient.data.email || 'Email non renseigné'}`,
        metadata: {
          clientId: newClient.data.id,
          clientName: newClient.data.company_name,
          clientType: newClient.data.type || 'standard'
        }
      });
      
      return newClient.data;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour un client
  async updateClient(id, clientData) {
    try {
      const updatedClient = await clientAPI.updateClient(id, clientData);
      
      // Enregistrer dans le journal CEO
      ceoJournalService.addEntry({
        type: 'client_updated',
        title: `Client ${updatedClient.data.company_name} mis à jour`,
        description: `Informations client modifiées`,
        metadata: {
          clientId: updatedClient.data.id,
          clientName: updatedClient.data.company_name
        }
      });
      
      return updatedClient.data;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer un client
  async deleteClient(id) {
    try {
      const response = await clientAPI.deleteClient(id);
      
      // Enregistrer dans le journal CEO
      ceoJournalService.addEntry({
        type: 'client_deleted',
        title: `Client ${id} supprimé`,
        description: `Client supprimé de la base de données`,
        metadata: {
          clientId: id
        }
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Rechercher des clients
  async searchClients(searchTerm) {
    try {
      const response = await clientAPI.searchClients(searchTerm);
      return response.data.clients; // Assuming backend returns { data: { clients: [...] } }
    } catch (error) {
      console.error('Erreur lors de la recherche de clients:', error);
      throw error;
    }
  }

  // Filtrer les clients par type (nécessite un endpoint backend)
  async getClientsByType(type) {
    try {
      const response = await clientAPI.getClients({ type }); // Assuming backend supports type filter
      return response.data.clients;
    } catch (error) {
      console.error('Erreur lors du filtrage des clients par type:', error);
      throw error;
    }
  }

  // Obtenir les clients actifs (nécessite un endpoint backend)
  async getActiveClients() {
    try {
      const response = await clientAPI.getClients({ status: 'active' }); // Assuming backend supports status filter
      return response.data.clients;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients actifs:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des clients (nécessite un endpoint backend)
  async getClientStatistics() {
    try {
      const response = await apiService.clients.getStats(); // Assuming a getStats endpoint exists
      return response.data; // Assuming backend returns { data: stats }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques clients:', error);
      throw error;
    }
  }
}

// Exporter une instance unique du service
const clientService = new ClientService();
export default clientService;