const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

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

// Import des routes (seulement les essentielles pour commencer)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const pricingRoutes = require('./routes/pricing');
const documentRoutes = require('./routes/documents');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const statisticsRoutes = require('./routes/statistics');
const reportsRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync');
// const brandRoutes = require('./routes/brands');
// const categoryRoutes = require('./routes/categories');
// const creditRequestRoutes = require('./routes/creditRequests');
// const accountRequestRoutes = require('./routes/accountRequests');
// const substituteRoutes = require('./routes/substitutes');
// const uploadRoutes = require('./routes/upload-simple');
// const quotesRoutes = require('./routes/quotes');
// const invoicesRoutes = require('./routes/invoices');
// const journalRoutes = require('./routes/journal');
// const searchRoutes = require('./routes/search');
// const alertsRoutes = require('./routes/alerts');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sync', syncRoutes);
// app.use('/api/brands', brandRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/credit-requests', creditRequestRoutes);
// app.use('/api/account-requests', accountRequestRoutes);
// app.use('/api/substitutes', substituteRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/quotes', quotesRoutes);
// app.use('/api/invoices', invoicesRoutes);
// app.use('/api/journal', journalRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/alerts', alertsRoutes);

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

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration Socket.IO
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log('🔌 Client WebSocket connecté:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔌 Client WebSocket déconnecté:', socket.id);
    });

    // Événements de synchronisation temps réel
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Client ${socket.id} a rejoint la room ${room}`);
    });

    socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`Client ${socket.id} a quitté la room ${room}`);
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
    console.log(`🚀 Serveur Konipa démarré sur le port ${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket disponible sur ws://localhost:${PORT}`);
});

module.exports = { app, server, io };
