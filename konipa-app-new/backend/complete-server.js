const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));

// Import des routes (seulement les essentielles)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const pricingRoutes = require('./routes/pricing');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pricing', pricingRoutes);

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

// Démarrage du serveur
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`🚀 Serveur Konipa démarré sur le port ${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

