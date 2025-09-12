// Service de gestion des catégories
import { apiService } from './api.js';
import { adminJournalService } from './adminJournalService.js';

// Alias pour compatibilité
const categoryAPI = {
  getCategories: () => apiService.products.getCategories(),
  createCategory: (data) => apiService.post('/categories', data),
  updateCategory: (id, data) => apiService.put(`/categories/${id}`, data),
  deleteCategory: (id) => apiService.delete(`/categories/${id}`)
};

// Données de catégories par défaut comme fallback
const defaultCategories = [
  {
    id: 'CAT001',
    name: 'Mécanique',
    description: 'Pièces mécaniques automobiles',
    parentId: null,
    isActive: true,
    productCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CAT002',
    name: 'Filtration',
    description: 'Filtres et systèmes de filtration',
    parentId: null,
    isActive: true,
    productCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CAT003',
    name: 'Électronique',
    description: 'Composants électroniques automobiles',
    parentId: null,
    isActive: true,
    productCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CAT004',
    name: 'Carrosserie',
    description: 'Pièces de carrosserie et accessoires',
    parentId: null,
    isActive: true,
    productCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class CategoryService {
  constructor() {
    this.categories = [];
    this.isLoaded = false;
  }

  // Charger les catégories depuis l'API ou fallback
  async loadCategories() {
    try {
      const response = await categoryAPI.getCategories();
      this.categories = response.categories || response;
      this.isLoaded = true;
    } catch (error) {
      this.categories = [...defaultCategories];
      this.isLoaded = true;
    }
  }

  // Sauvegarder une catégorie via l'API
  async saveCategory(category) {
    try {
      if (category.id && category.id.startsWith('CAT')) {
        return await categoryAPI.updateCategory(category.id, category);
      } else {
        return await categoryAPI.createCategory(category);
      }
    } catch (error) {
      throw error;
    }
  }

  // Récupérer toutes les catégories
  async getCategories(params = {}) {
    if (!this.isLoaded) {
      await this.loadCategories();
    }

    let filteredCategories = [...this.categories];

    // Filtrage par statut actif
    if (params.active !== undefined) {
      filteredCategories = filteredCategories.filter(category => category.isActive === params.active);
    }

    // Filtrage par catégorie parent
    if (params.parentId !== undefined) {
      filteredCategories = filteredCategories.filter(category => category.parentId === params.parentId);
    }

    // Recherche par nom
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredCategories = filteredCategories.filter(category => 
        category.name?.toLowerCase().includes(searchTerm) ||
        category.description?.toLowerCase().includes(searchTerm)
      );
    }

    return {
      categories: filteredCategories,
      total: filteredCategories.length
    };
  }

  // Récupérer une catégorie par ID
  async getCategory(id) {
    if (!this.isLoaded) {
      await this.loadCategories();
    }

    return this.categories.find(category => category.id === id) || null;
  }

  // Récupérer les catégories principales (sans parent)
  async getMainCategories() {
    return this.getCategories({ parentId: null });
  }

  // Récupérer les sous-catégories d'une catégorie
  async getSubCategories(parentId) {
    return this.getCategories({ parentId });
  }

  // Créer une nouvelle catégorie
  async createCategory(categoryData) {
    try {
      const newCategory = {
        id: `CAT${Date.now()}`,
        ...categoryData,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder via Sage
      await this.saveCategory(newCategory);

      // Ajouter localement
      this.categories.push(newCategory);

      // Enregistrer dans le journal Admin
        await adminJournalService.logEvent({
        type: 'category_created',
        description: `Nouvelle catégorie créée: ${newCategory.name}`,
        data: { categoryId: newCategory.id, categoryName: newCategory.name }
      });

      return newCategory;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour une catégorie
  async updateCategory(id, updateData) {
    try {
      if (!this.isLoaded) {
        await this.loadCategories();
      }

      const categoryIndex = this.categories.findIndex(category => category.id === id);
      if (categoryIndex === -1) {
        throw new Error('Catégorie non trouvée');
      }

      const updatedCategory = {
        ...this.categories[categoryIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder via Sage
      await this.saveCategory(updatedCategory);

      // Mettre à jour localement
      this.categories[categoryIndex] = updatedCategory;

      // Enregistrer dans le journal Admin
        await adminJournalService.logEvent({
        type: 'category_updated',
        description: `Catégorie mise à jour: ${updatedCategory.name}`,
        data: { categoryId: id, categoryName: updatedCategory.name }
      });

      return updatedCategory;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer une catégorie
  async deleteCategory(id) {
    try {
      if (!this.isLoaded) {
        await this.loadCategories();
      }

      const categoryIndex = this.categories.findIndex(category => category.id === id);
      if (categoryIndex === -1) {
        throw new Error('Catégorie non trouvée');
      }

      const category = this.categories[categoryIndex];

      // Vérifier s'il y a des sous-catégories
      const hasSubCategories = this.categories.some(cat => cat.parentId === id);
      if (hasSubCategories) {
        throw new Error('Impossible de supprimer une catégorie qui contient des sous-catégories');
      }

      // if (category.productCount > 0) {
      //   throw new Error('Impossible de supprimer une catégorie qui contient des produits');
      // }

      // await accountingService.deleteCategory(id);

      // Supprimer localement
      this.categories.splice(categoryIndex, 1);

      // Enregistrer dans le journal Admin
        await adminJournalService.logEvent({
        type: 'category_deleted',
        description: `Catégorie supprimée: ${category.name}`,
        data: { categoryId: id, categoryName: category.name }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le nombre de produits d'une catégorie
  async updateProductCount(categoryId, count) {
    const category = await this.getCategory(categoryId);
    if (category) {
      return this.updateCategory(categoryId, { productCount: count });
    }
    return null;
  }

  // Récupérer les statistiques des catégories
  async getCategoryStatistics() {
    if (!this.isLoaded) {
      await this.loadCategories();
    }

    const totalCategories = this.categories.length;
    const activeCategories = this.categories.filter(c => c.isActive).length;
    const mainCategories = this.categories.filter(c => !c.parentId).length;
    const subCategories = this.categories.filter(c => c.parentId).length;

    return {
      totalCategories,
      activeCategories,
      inactiveCategories: totalCategories - activeCategories,
      mainCategories,
      subCategories
    };
  }
}

// Instance singleton
const categoryService = new CategoryService();
export { categoryService };
export default categoryService;