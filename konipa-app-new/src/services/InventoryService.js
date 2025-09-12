/**
 * Inventory Service - Handles all inventory-related operations
 */

import { productService, supplierService, categoryService } from './dataService';
import { adminJournalService } from './adminJournalService';

class InventoryService {
  constructor() {
    this.products = [];
    this.suppliers = [];
    this.categories = [];
    this.nextId = 1;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const [products, suppliers, categories] = await Promise.all([
        productService.getProducts(),
        supplierService.getSuppliers(),
        categoryService.getCategories()
      ]);
      
      this.products = products;
      this.suppliers = suppliers;
      this.categories = categories;
      this.nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      this.initialized = true;
    } catch (error) {
      this.products = [];
      this.suppliers = [];
      this.categories = [];
      this.nextId = 1;
      this.initialized = true;
    }
  }

  // Product operations
  async getAllProducts() {
    await this.initialize();
    return this.products;
  }

  async getProductById(id) {
    await this.initialize();
    const product = this.products.find(p => p.id === parseInt(id));
    return product;
  }

  async searchProducts(query) {
    await this.initialize();
    
    try {
      // Essayer d'abord la recherche via l'API
      const results = await productService.searchProducts(query);
      return results;
    } catch (error) {
      // Fallback vers la recherche locale
      const lowercaseQuery = query.toLowerCase();
      return this.products.filter(product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.sku.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
      );
    }
  }

  async addProduct(product) {
    await this.initialize();
    
    try {
      const newProduct = await productService.createProduct({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      this.products.push(newProduct);
      this.nextId = Math.max(this.nextId, newProduct.id + 1);
      
      // Logger la création de produit dans le journal Admin
      adminJournalService.logProductCreation(
        newProduct.name,
        newProduct.sku || newProduct.id.toString(),
        newProduct.price,
        {
          category: newProduct.category,
          quantity: newProduct.quantity,
          supplier: newProduct.supplier
        }
      );
      
      return newProduct;
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(id, updates) {
    await this.initialize();
    
    try {
      const oldProduct = this.products.find(p => p.id === parseInt(id));
      if (!oldProduct) throw new Error('Product not found');
      
      const updatedProduct = await productService.updateProduct(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      const index = this.products.findIndex(p => p.id === parseInt(id));
      if (index !== -1) {
        this.products[index] = updatedProduct;
      }
      
      // Logger la mise à jour de produit dans le journal admin
      adminJournalService.logProductUpdate(
        updatedProduct.name,
        updatedProduct.sku || id.toString(),
        {
          oldPrice: oldProduct.price,
          newPrice: updatedProduct.price,
          updatedFields: Object.keys(updates),
          category: updatedProduct.category
        }
      );
      
      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(id) {
    await this.initialize();
    
    try {
      const productToDelete = this.products.find(p => p.id === parseInt(id));
      if (!productToDelete) throw new Error('Product not found');
      
      await productService.deleteProduct(id);
      
      const index = this.products.findIndex(p => p.id === parseInt(id));
      if (index !== -1) {
        this.products.splice(index, 1);
      }
      
      // Logger la suppression de produit dans le journal Admin
      adminJournalService.logProductDeletion(
        productToDelete.name,
        productToDelete.sku || id.toString(),
        {
          category: productToDelete.category,
          price: productToDelete.price,
          quantity: productToDelete.quantity
        }
      );
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Stock operations
  updateStock(productId, quantity, type = 'adjustment') {
    const product = this.products.find(p => p.id === productId);
    if (!product) return Promise.reject(new Error('Product not found'));

    const oldQuantity = product.quantity;
    const newQuantity = type === 'add' 
      ? product.quantity + quantity 
      : type === 'remove' 
        ? product.quantity - quantity 
        : quantity;

    product.quantity = Math.max(0, newQuantity);
    product.updatedAt = new Date().toISOString();
    
    // Logger la mise à jour de stock dans le journal Admin
    adminJournalService.logStockUpdate(
      product.name,
      oldQuantity,
      product.quantity,
      {
        type: type,
        adjustment: quantity,
        sku: product.sku || productId.toString(),
        category: product.category
      }
    );
    
    return Promise.resolve(product);
  }

  // Category operations
  async getAllCategories() {
    await this.initialize();
    return this.categories;
  }

  addCategory(category) {
    const newCategory = {
      ...category,
      id: Math.max(...this.categories.map(c => c.id), 0) + 1,
      createdAt: new Date().toISOString()
    };
    this.categories.push(newCategory);
    return Promise.resolve(newCategory);
  }

  // Supplier operations
  async getAllSuppliers() {
    await this.initialize();
    return this.suppliers;
  }

  // Analytics
  getInventoryAnalytics() {
    const totalProducts = this.products.length;
    const totalValue = this.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const lowStockItems = this.products.filter(p => p.quantity <= p.reorderLevel).length;
    const outOfStockItems = this.products.filter(p => p.quantity === 0).length;
    const categories = [...new Set(this.products.map(p => p.category))].length;

    return Promise.resolve({
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categories,
      stockStatus: {
        inStock: this.products.filter(p => p.quantity > p.reorderLevel).length,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems
      }
    });
  }

  // Reports
  generateStockReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      products: this.products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: product.quantity,
        reorderLevel: product.reorderLevel,
        price: product.price,
        value: product.price * product.quantity,
        status: product.quantity === 0 ? 'Out of Stock' : 
                product.quantity <= product.reorderLevel ? 'Low Stock' : 'In Stock'
      })),
      summary: {
        totalProducts: this.products.length,
        totalValue: this.products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
        lowStockCount: this.products.filter(p => p.quantity <= p.reorderLevel && p.quantity > 0).length,
        outOfStockCount: this.products.filter(p => p.quantity === 0).length
      }
    };
    return Promise.resolve(report);
  }

  // Alerts
  checkLowStockAlerts() {
    const alerts = this.products
      .filter(product => product.quantity <= product.reorderLevel)
      .map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.quantity,
        reorderLevel: product.reorderLevel,
        alertType: product.quantity === 0 ? 'out_of_stock' : 'low_stock',
        message: product.quantity === 0 
          ? `${product.name} is out of stock` 
          : `${product.name} has low stock (${product.quantity} remaining)`
      }));
    return Promise.resolve(alerts);
  }

  // Search and filter
  filterProducts(filters) {
    let filtered = [...(this.products || [])];

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.supplier) {
      filtered = filtered.filter(p => p.supplier === filters.supplier);
    }

    if (filters.status) {
      switch (filters.status) {
        case 'in_stock':
          filtered = filtered.filter(p => p.quantity > p.reorderLevel);
          break;
        case 'low_stock':
          filtered = filtered.filter(p => p.quantity <= p.reorderLevel && p.quantity > 0);
          break;
        case 'out_of_stock':
          filtered = filtered.filter(p => p.quantity === 0);
          break;
      }
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= filters.minPrice);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice);
    }

    return Promise.resolve(filtered);
  }

  // Export data
  exportToCSV() {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Price', 'Supplier', 'Status'];
    const rows = this.products.map(product => [
      product.id,
      product.name,
      product.sku,
      product.category,
      product.quantity,
      product.price,
      product.supplier,
      product.quantity === 0 ? 'Out of Stock' : 
      product.quantity <= product.reorderLevel ? 'Low Stock' : 'In Stock'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return Promise.resolve(csvContent);
  }
}

export default new InventoryService();
