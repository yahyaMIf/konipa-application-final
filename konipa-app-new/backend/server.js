const { app } = require('./app');
// Trigger nodemon restart
const http = require('http');
const config = require('./config/config');
const { syncDatabase, sequelize } = require('./models');
const socketService = require('./services/socketService');
const { ErrorAlertHandler } = require('./middleware/errorAlertMiddleware');

// Créer le serveur HTTP
const server = http.createServer(app);

// Initialiser le service Socket.IO unifié
const io = socketService.initialize(server);

// Exposer le service Socket.IO pour les autres services
app.set('socketService', socketService);
global.socketService = socketService;

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Test de la connexion à la base de données
    console.log('🔄 Test de la connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès');
    // Synchronisation désactivée pour éviter les conflits de schéma
    // await syncDatabase({ force: false });

    // Démarrage du serveur
    const PORT = config.server?.port || process.env.PORT || 3002;
    server.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📡 WebSocket activé`);
      console.log(`🌐 CORS configuré pour: ${config.cors?.origin || process.env.FRONTEND_URL}`);
      console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion des erreurs non capturées avec alertes
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  ErrorAlertHandler.handleUncaughtException(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  ErrorAlertHandler.handleUnhandledRejection(reason, promise);
  process.exit(1);
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

// Démarrer le serveur
startServer();

module.exports = { app, server, io };