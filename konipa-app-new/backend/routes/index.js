const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./auth');
const userRoutes = require('./users');
const clientRoutes = require('./clients');
const categoryRoutes = require('./categories');
const brandRoutes = require('./brands');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const substituteRoutes = require('./substitutes');
const documentRoutes = require('./documents');
const journalRoutes = require('./journal');

// Configuration des routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/substitutes', substituteRoutes);
router.use('/documents', documentRoutes);
router.use('/journal', journalRoutes);

// Route de santé
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route par défaut
router.get('/', (req, res) => {
  res.json({ 
    message: 'API Konipa - Backend',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      clients: '/api/clients',
      categories: '/api/categories',
      brands: '/api/brands',
      products: '/api/products',
      orders: '/api/orders',
      substitutes: '/api/substitutes',
      documents: '/api/documents',
      journal: '/api/journal',
      health: '/api/health'
    }
  });
});

module.exports = router;