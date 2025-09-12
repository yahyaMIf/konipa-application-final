// Base Sage API Service
// Classe de base abstraite pour les services Sage

/**
 * Classe de base abstraite pour les services Sage
 * Définit l'interface commune pour tous les services Sage
 */
class BaseSageApiService {
  constructor() {
    if (this.constructor === BaseSageApiService) {
      throw new Error('BaseSageApiService est une classe abstraite et ne peut pas être instanciée directement');
    }
  }

  // Méthodes abstraites à implémenter dans les classes dérivées
  async getCustomers() {
    throw new Error('getCustomers() doit être implémentée dans la classe dérivée');
  }

  async getCustomer(customerId) {
    throw new Error('getCustomer() doit être implémentée dans la classe dérivée');
  }

  async createCustomer(customerData) {
    throw new Error('createCustomer() doit être implémentée dans la classe dérivée');
  }

  async updateCustomer(customerId, customerData) {
    throw new Error('updateCustomer() doit être implémentée dans la classe dérivée');
  }

  async deleteCustomer(customerId) {
    throw new Error('deleteCustomer() doit être implémentée dans la classe dérivée');
  }

  async getProducts() {
    throw new Error('getProducts() doit être implémentée dans la classe dérivée');
  }

  async getProduct(productId) {
    throw new Error('getProduct() doit être implémentée dans la classe dérivée');
  }

  async createProduct(productData) {
    throw new Error('createProduct() doit être implémentée dans la classe dérivée');
  }

  async updateProduct(productId, productData) {
    throw new Error('updateProduct() doit être implémentée dans la classe dérivée');
  }

  async deleteProduct(productId) {
    throw new Error('deleteProduct() doit être implémentée dans la classe dérivée');
  }

  async getOrders() {
    throw new Error('getOrders() doit être implémentée dans la classe dérivée');
  }

  async getOrder(orderId) {
    throw new Error('getOrder() doit être implémentée dans la classe dérivée');
  }

  async createOrder(orderData) {
    throw new Error('createOrder() doit être implémentée dans la classe dérivée');
  }

  async updateOrder(orderId, orderData) {
    throw new Error('updateOrder() doit être implémentée dans la classe dérivée');
  }

  async deleteOrder(orderId) {
    throw new Error('deleteOrder() doit être implémentée dans la classe dérivée');
  }

  async getInvoices() {
    throw new Error('getInvoices() doit être implémentée dans la classe dérivée');
  }

  async getInvoice(invoiceId) {
    throw new Error('getInvoice() doit être implémentée dans la classe dérivée');
  }

  async createInvoice(invoiceData) {
    throw new Error('createInvoice() doit être implémentée dans la classe dérivée');
  }

  async updateInvoice(invoiceId, invoiceData) {
    throw new Error('updateInvoice() doit être implémentée dans la classe dérivée');
  }

  async deleteInvoice(invoiceId) {
    throw new Error('deleteInvoice() doit être implémentée dans la classe dérivée');
  }

  async getPayments() {
    throw new Error('getPayments() doit être implémentée dans la classe dérivée');
  }

  async getPayment(paymentId) {
    throw new Error('getPayment() doit être implémentée dans la classe dérivée');
  }

  async createPayment(paymentData) {
    throw new Error('createPayment() doit être implémentée dans la classe dérivée');
  }

  async updatePayment(paymentId, paymentData) {
    throw new Error('updatePayment() doit être implémentée dans la classe dérivée');
  }

  async deletePayment(paymentId) {
    throw new Error('deletePayment() doit être implémentée dans la classe dérivée');
  }

  // Méthodes utilitaires communes
  formatDate(date) {
    if (!date) return null;
    if (typeof date === 'string') {
      return new Date(date).toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    return amount.toFixed(2);
  }

  validateRequired(data, requiredFields) {
    const missing = [];
    for (const field of requiredFields) {
      if (!data[field]) {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Champs requis manquants: ${missing.join(', ')}`);
    }
  }

  // Méthode pour tester la connexion
  async testConnection() {
    throw new Error('testConnection() doit être implémentée dans la classe dérivée');
  }

  // Méthode pour synchroniser les données
  async syncData() {
    throw new Error('syncData() doit être implémentée dans la classe dérivée');
  }
}

export default BaseSageApiService;