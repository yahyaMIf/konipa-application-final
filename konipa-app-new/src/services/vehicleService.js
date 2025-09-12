class VehicleService {
  constructor() {
    this.vehicles = {
      brands: ['Renault', 'Peugeot', 'Citroën', 'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Nissan', 'Ford'],
      models: {
        'Renault': ['Clio', 'Mégane', 'Scenic', 'Captur', 'Kadjar'],
        'Peugeot': ['208', '308', '3008', '5008', '2008'],
        'Citroën': ['C3', 'C4', 'C5 Aircross', 'Berlingo', 'Jumpy'],
        'Volkswagen': ['Golf', 'Polo', 'Tiguan', 'Passat', 'T-Roc'],
        'BMW': ['Série 1', 'Série 3', 'Série 5', 'X1', 'X3'],
        'Mercedes': ['Classe A', 'Classe C', 'Classe E', 'GLA', 'GLC'],
        'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5'],
        'Toyota': ['Yaris', 'Corolla', 'C-HR', 'RAV4', 'Prius'],
        'Nissan': ['Micra', 'Qashqai', 'X-Trail', 'Juke', 'Leaf'],
        'Ford': ['Fiesta', 'Focus', 'Kuga', 'Mondeo', 'EcoSport']
      },
      years: Array.from({ length: 25 }, (_, i) => 2024 - i)
    };
  }

  // Get all vehicle brands
  getBrands() {
    return this.vehicles.brands;
  }

  // Get models for a specific brand
  getModels(brand) {
    return this.vehicles.models[brand] || [];
  }

  // Get all available years
  getYears() {
    return this.vehicles.years;
  }

  // Get all vehicle data
  getVehicles() {
    return this.vehicles;
  }

  // Search vehicles by query
  searchVehicles(query) {
    if (!query) return this.vehicles;
    
    const lowerQuery = query.toLowerCase();
    const filteredBrands = this.vehicles.brands.filter(brand => 
      brand.toLowerCase().includes(lowerQuery)
    );
    
    const filteredModels = {};
    Object.keys(this.vehicles.models).forEach(brand => {
      const models = this.vehicles.models[brand].filter(model => 
        model.toLowerCase().includes(lowerQuery)
      );
      if (models.length > 0) {
        filteredModels[brand] = models;
      }
    });
    
    return {
      brands: filteredBrands,
      models: filteredModels,
      years: this.vehicles.years
    };
  }
}

export const vehicleService = new VehicleService();
export default vehicleService;