import { apiService } from './api.js';
import adminJournalService from './adminJournalService.js';
import { ceoJournalService } from './ceoJournalService.js';

// Alias pour compatibilité
const brandAPI = {
  getBrands: () => apiService.products.getBrands(),
  createBrand: (data) => apiService.post('/brands', data),
  updateBrand: (id, data) => apiService.put(`/brands/${id}`, data),
  deleteBrand: (id) => apiService.delete(`/brands/${id}`)
};

/**
 * Service de gestion des marques
 * Utilise la couche d'abstraction Sage via accountingService
 */
class BrandService {
  constructor() {
    this.brands = [];
    this.isLoaded = false;
  }

  /**
   * Charger les marques depuis l'API
   */
  async loadBrands() {
    try {
      const response = await brandAPI.getBrands();
      this.brands = response.brands || response || [];
      this.isLoaded = true;
      return this.brands;
    } catch (error) {
      // Fallback vers des données par défaut
      this.brands = this.getDefaultBrands();
      this.isLoaded = true;
      return this.brands;
    }
  }

  /**
   * Sauvegarder une marque via l'API
   */
  async saveBrand(brandData) {
    try {
      const savedBrand = await brandAPI.createBrand(brandData);
      await ceoJournalService.logEvent({
        type: 'brand_created',
        brandId: savedBrand.id,
        brandName: savedBrand.name
      });
      return savedBrand;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer toutes les marques
   */
  async getAllBrands() {
    if (!this.isLoaded) {
      await this.loadBrands();
    }
    return this.brands;
  }

  /**
   * Récupérer une marque par ID
   */
  async getBrandById(id) {
    if (!this.isLoaded) {
      await this.loadBrands();
    }
    return this.brands.find(brand => brand.id === id);
  }

  /**
   * Ajouter une nouvelle marque
   */
  async addBrand(brandData) {
    try {
      const newBrand = {
        id: Date.now().toString(),
        name: brandData.name,
        description: brandData.description || '',
        logo: brandData.logo || '',
        website: brandData.website || '',
        country: brandData.country || '',
        isActive: brandData.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const savedBrand = await this.saveBrand(newBrand);
      
      // Recharger les données
      await this.loadBrands();

      return savedBrand;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour une marque
   */
  async updateBrand(id, brandData) {
    try {
      
      const brandIndex = this.brands.findIndex(brand => brand.id === id);
      if (brandIndex !== -1) {
        this.brands[brandIndex] = {
          ...this.brands[brandIndex],
          ...brandData,
          updatedAt: new Date().toISOString()
        };
      }
      
      // Recharger les données
      await this.loadBrands();
      
      return this.brands[brandIndex];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprimer une marque
   */
  async deleteBrand(id) {
    try {
      
      this.brands = this.brands.filter(brand => brand.id !== id);
      
      // Recharger les données
      await this.loadBrands();
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rechercher des marques
   */
  async searchBrands(query) {
    if (!this.isLoaded) {
      await this.loadBrands();
    }
    
    const searchTerm = query.toLowerCase();
    return this.brands.filter(brand => 
      brand.name.toLowerCase().includes(searchTerm) ||
      brand.description.toLowerCase().includes(searchTerm) ||
      brand.country.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Filtrer les marques par statut
   */
  async getBrandsByStatus(isActive = true) {
    if (!this.isLoaded) {
      await this.loadBrands();
    }
    return this.brands.filter(brand => brand.isActive === isActive);
  }

  /**
   * Obtenir les statistiques des marques
   */
  async getBrandStatistics() {
    if (!this.isLoaded) {
      await this.loadBrands();
    }
    
    const total = this.brands.length;
    const active = this.brands.filter(brand => brand.isActive).length;
    const inactive = total - active;
    
    const countries = [...new Set(this.brands.map(brand => brand.country).filter(Boolean))];
    
    return {
      total,
      active,
      inactive,
      countries: countries.length,
      countryList: countries
    };
  }

  /**
   * Données par défaut des marques
   */
  getDefaultBrands() {
    return [
      {
        id: '1',
        name: 'Apple',
        description: 'Technologie et innovation',
        logo: '',
        website: 'https://www.apple.com',
        country: 'États-Unis',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Samsung',
        description: 'Électronique et technologie',
        logo: '',
        website: 'https://www.samsung.com',
        country: 'Corée du Sud',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Sony',
        description: 'Électronique et divertissement',
        logo: '',
        website: 'https://www.sony.com',
        country: 'Japon',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export default new BrandService();