#!/usr/bin/env node

/**
 * Script de démarrage optimisé pour le backend Konipa
 * 
 * Fonctionnalités :
 * - Vérification des dépendances
 * - Synchronisation de la base de données
 * - Démarrage du serveur
 * - Gestion des erreurs
 * - Logs détaillés
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du Backend Konipa...');
console.log('='.repeat(50));

// Configuration
const config = {
    port: process.env.PORT || 3003,
    nodeEnv: process.env.NODE_ENV || 'development',
    dbSync: process.argv.includes('--sync') || process.argv.includes('--force-sync'),
    reset: process.argv.includes('--reset')
};

console.log('⚙️ Configuration:');
console.log(`   Port: ${config.port}`);
console.log(`   Environnement: ${config.nodeEnv}`);
console.log(`   Synchronisation DB: ${config.dbSync}`);
console.log(`   Reset: ${config.reset}`);

// Vérifier les dépendances
function checkDependencies() {
    return new Promise((resolve, reject) => {
        console.log('\n🔍 Vérification des dépendances...');

        const packageJsonPath = path.join(__dirname, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            reject(new Error('package.json non trouvé'));
            return;
        }

        const nodeModulesPath = path.join(__dirname, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log('📦 Installation des dépendances...');
            exec('npm install', { cwd: __dirname }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log('✅ Dépendances installées');
                resolve();
            });
        } else {
            console.log('✅ Dépendances trouvées');
            resolve();
        }
    });
}

// Synchroniser la base de données
function syncDatabase() {
    return new Promise((resolve, reject) => {
        if (!config.dbSync && !config.reset) {
            console.log('⏭️ Synchronisation de la base de données ignorée');
            resolve();
            return;
        }

        console.log('\n🔄 Synchronisation de la base de données...');

        const script = config.reset ? 'seed-database-fixed.js' : 'seed-database-fixed.js';
        const scriptPath = path.join(__dirname, script);

        if (!fs.existsSync(scriptPath)) {
            console.log('⚠️ Script de synchronisation non trouvé, utilisation de la synchronisation automatique');
            resolve();
            return;
        }

        exec(`node ${script}`, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Erreur de synchronisation:', error.message);
                reject(error);
                return;
            }
            console.log('✅ Base de données synchronisée');
            resolve();
        });
    });
}

// Démarrer le serveur
function startServer() {
    return new Promise((resolve, reject) => {
        console.log('\n🚀 Démarrage du serveur...');

        const server = spawn('node', ['server.js'], {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: config.nodeEnv,
                PORT: config.port
            }
        });

        server.on('error', (err) => {
            console.error('❌ Erreur lors du démarrage du serveur:', err);
            reject(err);
        });

        server.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Le serveur s'est arrêté avec le code ${code}`);
                reject(new Error(`Serveur arrêté avec le code ${code}`));
            }
        });

        // Attendre un peu pour vérifier que le serveur démarre
        setTimeout(() => {
            console.log('✅ Serveur démarré avec succès !');
            console.log(`📡 API disponible sur: http://localhost:${config.port}`);
            console.log(`🔑 Login admin: admin@konipa.com / admin123`);
            console.log(`📊 Dashboard: http://localhost:${config.port}/api/dashboard/stats`);
            console.log('\n💡 Appuyez sur Ctrl+C pour arrêter le serveur');
            resolve(server);
        }, 3000);
    });
}

// Gestion des signaux d'arrêt
function setupSignalHandlers(server) {
    process.on('SIGINT', () => {
        console.log('\n🛑 Arrêt du serveur...');
        if (server) {
            server.kill('SIGINT');
        }
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Arrêt du serveur...');
        if (server) {
            server.kill('SIGTERM');
        }
        process.exit(0);
    });
}

// Fonction principale
async function main() {
    try {
        // Vérifier les dépendances
        await checkDependencies();

        // Synchroniser la base de données si demandé
        await syncDatabase();

        // Démarrer le serveur
        const server = await startServer();

        // Configurer les gestionnaires de signaux
        setupSignalHandlers(server);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Démarrer l'application
main();
