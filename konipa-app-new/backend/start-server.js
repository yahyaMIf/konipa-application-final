#!/usr/bin/env node

/**
 * Script de démarrage du serveur Konipa Backend
 * 
 * Ce script démarre le serveur backend avec toutes les fonctionnalités :
 * - Base de données PostgreSQL
 * - Authentification JWT
 * - APIs REST complètes
 * - WebSocket pour les notifications temps réel
 * - CORS configuré pour le frontend
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du serveur Konipa Backend...');
console.log('='.repeat(50));

// Démarrer le serveur
const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
});

// Gestion des signaux d'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.kill('SIGTERM');
    process.exit(0);
});

// Gestion des erreurs
server.on('error', (err) => {
    console.error('❌ Erreur lors du démarrage du serveur:', err);
    process.exit(1);
});

server.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Le serveur s'est arrêté avec le code ${code}`);
        process.exit(code);
    }
});
console.log('✅ Serveur démarré avec succès !');
console.log('📡 API disponible sur : http://localhost:3003');
console.log('🔑 Login admin : admin@konipa.com / admin123');
console.log('📊 Dashboard : http://localhost:3003/api/dashboard/stats');
console.log('📋 Documentation : Voir TEST_REPORT.md');
console.log('\n💡 Appuyez sur Ctrl+C pour arrêter le serveur');

