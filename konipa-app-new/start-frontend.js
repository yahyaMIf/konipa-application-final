#!/usr/bin/env node

/**
 * Script de démarrage pour le frontend Konipa
 * 
 * Fonctionnalités :
 * - Vérification des dépendances
 * - Configuration de l'environnement
 * - Démarrage du serveur de développement
 * - Proxy vers le backend
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚛️ Démarrage du Frontend Konipa...');
console.log('='.repeat(50));

// Configuration
const config = {
    port: process.env.PORT || 5173,
    apiUrl: process.env.VITE_API_URL || 'http://localhost:3003',
    nodeEnv: process.env.NODE_ENV || 'development'
};

console.log('⚙️ Configuration:');
console.log(`   Port: ${config.port}`);
console.log(`   API URL: ${config.apiUrl}`);
console.log(`   Environnement: ${config.nodeEnv}`);

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

// Vérifier la configuration
function checkConfig() {
    console.log('\n🔧 Vérification de la configuration...');

    const viteConfigPath = path.join(__dirname, 'vite.config.js');
    if (!fs.existsSync(viteConfigPath)) {
        console.error('❌ vite.config.js non trouvé');
        return false;
    }

    const srcPath = path.join(__dirname, 'src');
    if (!fs.existsSync(srcPath)) {
        console.error('❌ Dossier src non trouvé');
        return false;
    }

    console.log('✅ Configuration valide');
    return true;
}

// Démarrer le serveur de développement
function startDevServer() {
    return new Promise((resolve, reject) => {
        console.log('\n🚀 Démarrage du serveur de développement...');

        const server = spawn('npm', ['run', 'dev'], {
            cwd: __dirname,
            stdio: 'pipe',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: config.nodeEnv,
                VITE_API_URL: config.apiUrl,
                PORT: config.port
            }
        });

        server.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output.trim());

            // Détecter quand le serveur est prêt
            if (output.includes('Local:') || output.includes('ready in')) {
                console.log('\n✅ Frontend démarré avec succès !');
                console.log(`🌐 Application: http://localhost:${config.port}`);
                console.log(`📡 API Backend: ${config.apiUrl}`);
                console.log('\n💡 Appuyez sur Ctrl+C pour arrêter le serveur');
                resolve(server);
            }
        });

        server.stderr.on('data', (data) => {
            console.error(data.toString().trim());
        });

        server.on('error', (err) => {
            console.error('❌ Erreur lors du démarrage:', err);
            reject(err);
        });

        server.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Le serveur s'est arrêté avec le code ${code}`);
                reject(new Error(`Serveur arrêté avec le code ${code}`));
            }
        });
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

        // Vérifier la configuration
        if (!checkConfig()) {
            process.exit(1);
        }

        // Démarrer le serveur
        const server = await startDevServer();

        // Configurer les gestionnaires de signaux
        setupSignalHandlers(server);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Démarrer l'application
main();
