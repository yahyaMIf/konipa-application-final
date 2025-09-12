console.log('🚀 Démarrage du serveur...');

try {
    const express = require('express');
    console.log('✅ Express chargé');

    const app = express();
    console.log('✅ App créée');

    app.use(express.json());
    console.log('✅ Middleware JSON configuré');

    app.get('/health', (req, res) => {
        console.log('📡 Requête health reçue');
        res.json({ success: true, message: 'OK' });
    });

    app.get('/api/test', (req, res) => {
        console.log('📡 Requête API test reçue');
        res.json({ success: true, message: 'API OK' });
    });

    const PORT = 3003;
    console.log(`🔌 Tentative de démarrage sur le port ${PORT}...`);

    app.listen(PORT, () => {
        console.log(`✅ Serveur démarré avec succès sur le port ${PORT}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/health`);
        console.log(`🌐 API test: http://localhost:${PORT}/api/test`);
    });

} catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
}

