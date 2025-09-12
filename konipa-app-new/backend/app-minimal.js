const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const documentRoutes = require('./routes/documents');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const statisticsRoutes = require('./routes/statistics');
const reportsRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync');
const pricingRoutes = require('./routes/pricing');
const brandRoutes = require('./routes/brands');
const categoryRoutes = require('./routes/categories');
const creditRequestRoutes = require('./routes/creditRequests');
const accountRequestRoutes = require('./routes/accountRequests');
const substituteRoutes = require('./routes/substitutes');
const uploadRoutes = require('./routes/upload-simple');
const quotesRoutes = require('./routes/quotes');
const invoicesRoutes = require('./routes/invoices');
const journalRoutes = require('./routes/journal');
const searchRoutes = require('./routes/search');
const alertsRoutes = require('./routes/alerts');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/credit-requests', creditRequestRoutes);
app.use('/api/account-requests', accountRequestRoutes);
app.use('/api/substitutes', substituteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/alerts', alertsRoutes);

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Test route works' });
});

// Route de santé
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Serveur Konipa en ligne',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
