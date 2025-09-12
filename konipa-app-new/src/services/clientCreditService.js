/**
 * Service de gestion des limites de crédit client
 * Permet aux comptables et admin de définir et gérer les limites de chiffre d'affaires par client
 */

import { formatMAD } from '../utils/currency';
import { adminJournalService } from './adminJournalService';
import apiService from './apiService';

export class ClientCreditService {

  /**
   * Récupère tous les clients avec leurs limites de crédit
   */
  static async getAllClients() {
    try {
      const data = await apiService.clients.getAll();
      const clients = data.data?.clients || data.clients || [];
      return Array.isArray(clients) ? clients.map(client => ({
        ...client,
        availableCredit: (client.creditLimit || 0) - (client.currentAmount || 0),
        utilizationRate: client.creditLimit ? Math.round(((client.currentAmount || 0) / client.creditLimit) * 100) : 0
      })) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Récupère un client par son ID
   */
  static async getClientById(clientId) {
    try {
      const data = await apiService.clients.getById(clientId);
      const client = data.data?.client || data.client || data;
      if (!client) return null;
      
      return {
        ...client,
        availableCredit: (client.creditLimit || 0) - (client.currentAmount || 0),
        utilizationRate: client.creditLimit ? Math.round(((client.currentAmount || 0) / client.creditLimit) * 100) : 0
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Met à jour la limite de crédit d'un client
   */
  static async updateCreditLimit(clientId, newLimit, reason, approvedBy, approverName) {
    try {
      const data = await apiService.clients.updateCreditLimit(clientId, newLimit);
      
      const updatedClient = data.data?.client || data.client || data;
        
        // Logger la mise à jour de limite de crédit dans le journal Admin
        adminJournalService.logCreditLimitUpdate(
          updatedClient.name,
          updatedClient.id,
          updatedClient.previousLimit || 0,
          newLimit,
          {
            reason: reason,
            approvedBy: approvedBy,
            approverName: approverName,
            utilizationRate: updatedClient.utilizationRate,
            riskLevel: updatedClient.riskLevel
          }
        );

        return updatedClient;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ajoute un nouveau client
   */
  static async addClient(clientData) {
    try {
      const data = await apiService.clients.create(clientData);
      return data.data?.client || data.client || data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un client
   */
  static async deleteClient(clientId) {
    try {
      const data = await apiService.clients.delete(clientId);
      return data.data?.client || data.client || data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtient les statistiques globales de crédit
   */
  static async getGlobalStats() {
    try {
      const data = await apiService.clients.getStats();
      return data.data || data;
    } catch (error) {
      return {
        totalClients: 0,
        activeClients: 0,
        inactiveClients: 0,
        newClientsThisMonth: 0,
        newClientsLastMonth: 0,
        growthRate: 0
      };
    }
  }

  /**
   * Filtre les clients selon différents critères
   */
  static async filterClients(filters = {}) {
    try {
      const queryParams = {};
      
      if (filters.status) queryParams.status = filters.status;
      if (filters.searchTerm) queryParams.search = filters.searchTerm;
      // Ajouter d'autres paramètres supportés par l'API existante
      if (filters.page) queryParams.page = filters.page;
      if (filters.limit) queryParams.limit = filters.limit;
      if (filters.sortBy) queryParams.sortBy = filters.sortBy;
      if (filters.sortOrder) queryParams.sortOrder = filters.sortOrder;

      const data = await apiService.clients.getAll(queryParams);
      let clients = data.data?.clients || data.clients || [];
      
      // Appliquer les filtres côté client pour les critères non supportés par l'API
      if (filters.minCreditLimit || filters.maxCreditLimit || 
          filters.utilizationMin !== undefined || filters.utilizationMax !== undefined ||
          filters.riskLevel) {
        clients = clients.filter(client => {
          if (filters.minCreditLimit && (client.creditLimit || 0) < filters.minCreditLimit) return false;
          if (filters.maxCreditLimit && (client.creditLimit || 0) > filters.maxCreditLimit) return false;
          if (filters.utilizationMin !== undefined) {
            const utilization = client.creditLimit ? ((client.currentAmount || 0) / client.creditLimit) * 100 : 0;
            if (utilization < filters.utilizationMin) return false;
          }
          if (filters.utilizationMax !== undefined) {
            const utilization = client.creditLimit ? ((client.currentAmount || 0) / client.creditLimit) * 100 : 0;
            if (utilization > filters.utilizationMax) return false;
          }
          if (filters.riskLevel && client.riskLevel !== filters.riskLevel) return false;
          return true;
        });
      }
      
      return clients;
    } catch (error) {
      return [];
    }
  }

  /**
   * Génère un rapport de crédit
   */
  static async generateCreditReport(filters = {}) {
    try {
      const queryParams = {};
      
      if (filters.status) queryParams.status = filters.status;
      if (filters.riskLevel) queryParams.riskLevel = filters.riskLevel;
      if (filters.minCreditLimit) queryParams.minCreditLimit = filters.minCreditLimit;
      if (filters.maxCreditLimit) queryParams.maxCreditLimit = filters.maxCreditLimit;
      if (filters.minUtilization) queryParams.minUtilization = filters.minUtilization;
      if (filters.maxUtilization) queryParams.maxUtilization = filters.maxUtilization;
      if (filters.searchTerm) queryParams.search = filters.searchTerm;

      const data = await apiService.get('/clients/report', queryParams);
      return data.data?.report || data.report || data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Télécharge un rapport de crédit au format CSV
   */
  static async downloadCreditReport(filters = {}) {
    try {
      const queryParams = {};
      
      if (filters.status) queryParams.status = filters.status;
      if (filters.riskLevel) queryParams.riskLevel = filters.riskLevel;
      if (filters.minCreditLimit) queryParams.minCreditLimit = filters.minCreditLimit;
      if (filters.maxCreditLimit) queryParams.maxCreditLimit = filters.maxCreditLimit;
      if (filters.minUtilization) queryParams.minUtilization = filters.minUtilization;
      if (filters.maxUtilization) queryParams.maxUtilization = filters.maxUtilization;
      if (filters.searchTerm) queryParams.search = filters.searchTerm;
      queryParams.format = 'csv';

      // Pour le téléchargement de fichier, nous devons utiliser fetch directement
      // car apiService convertit automatiquement en JSON
      const token = localStorage.getItem('konipa_access_token');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      const queryString = new URLSearchParams(queryParams).toString();
      const response = await fetch(`/clients/report/download?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rapport_credit_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return true;
      } else {
        throw new Error('Erreur lors du téléchargement du rapport');
      }
    } catch (error) {
      throw error;
    }
  }
}

export default ClientCreditService;