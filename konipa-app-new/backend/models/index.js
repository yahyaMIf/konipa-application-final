const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Import des modèles
const User = require('./User');
const Client = require('./Client');
const Product = require('./Product');
const ProductStock = require('./ProductStock');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const PriceOverride = require('./PriceOverride');
const Document = require('./Document');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const UserSession = require('./UserSession');
const Brand = require('./Brand');
const Category = require('./Category');
const Quota = require('./Quota');
const UserClient = require('./UserClient');
const CreditRequest = require('./CreditRequest_sequelize');
const ProductSubstitute = require('./Substitute');
const AccountRequest = require('./AccountRequest');
const Quote = require('./Quote');
const QuoteItem = require('./QuoteItem');

// Tous les modèles sont maintenant importés depuis des fichiers séparés

// Créer l'objet models pour les associations
const models = {
  User,
  Client,
  Product,
  Order,
  OrderItem,
  PriceOverride,
  Document,
  ProductStock,
  Notification,
  AuditLog,
  UserSession,
  Brand,
  Category,
  Quota,
  UserClient,
  CreditRequest,
  ProductSubstitute,
  AccountRequest,
  Quote,
  QuoteItem,
  sequelize,
  Sequelize: require('sequelize')
};

// Appeler les associations pour tous les modèles
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate && modelName !== 'ProductSubstitute') {
    models[modelName].associate(models);
  }
});
// Note: ProductSubstitute associations are handled in src/models/index.js

// Fonction de synchronisation de la base de données
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Base de données synchronisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation de la base de données:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Sequelize: require('sequelize'),
  syncDatabase,
  User,
  Client,
  Product,
  Order,
  OrderItem,
  PriceOverride,
  Document,
  ProductStock,
  Notification,
  AuditLog,
  UserSession,
  Brand,
  Category,
  Quota,
  UserClient,
  CreditRequest,
  ProductSubstitute,
  AccountRequest,
  Quote,
  QuoteItem
};