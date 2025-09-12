#!/usr/bin/env node

/**
 * Script de démarrage complet pour Konipa Application
 * 
 * Ce script démarre :
 * 1. Le serveur backend (Node.js + Express + PostgreSQL)
 * 2. Le serveur frontend (Vite + React)
 * 3. Gère les dépendances et la configuration
 * 4. Affiche les informations de connexion
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Démarrage de Konipa Application Complète...');
console.log('='.repeat(60));

// Configuration
const config = {
    backendPort: 3003,
    frontendPort: 5173,
    backendPath: path.join(__dirname, 'konipa-app-new', 'backend'),
    frontendPath: path.join(__dirname, 'konipa-app-new'),
    delay: 5000 // Délai entre le démarrage du backend et du frontend
};

console.log('⚙️ Configuration:');
console.log(`   Backend: http://localhost:${config.backendPort}`);
console.log(`   Frontend: http://localhost:${config.frontendPort}`);
console.log(`   Backend Path: ${config.backendPath}`);
console.log(`   Frontend Path: ${config.frontendPath}`);

// Vérifier l'existence des dossiers
function checkDirectories() {
    console.log('\n🔍 Vérification des dossiers...');

    if (!fs.existsSync(config.backendPath)) {
        console.error('❌ Dossier backend non trouvé:', config.backendPath);
        return false;
    }

    if (!fs.existsSync(config.frontendPath)) {
        console.error('❌ Dossier frontend non trouvé:', config.frontendPath);
        return false;
    }

    console.log('✅ Dossiers trouvés');
    return true;
}

// Installer les dépendances
function installDependencies() {
    return new Promise((resolve, reject) => {
        console.log('\n📦 Installation des dépendances...');

        // Installer les dépendances backend
        console.log('📦 Installation des dépendances backend...');
        exec('npm install', { cwd: config.backendPath }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Erreur installation backend:', error.message);
                reject(error);
                return;
            }
            console.log('✅ Dépendances backend installées');

            // Installer les dépendances frontend
            console.log('📦 Installation des dépendances frontend...');
            exec('npm install', { cwd: config.frontendPath }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Erreur installation frontend:', error.message);
                    reject(error);
                    return;
                }
                console.log('✅ Dépendances frontend installées');
                resolve();
            });
        });
    });
}

// Démarrer le backend
function startBackend() {
    return new Promise((resolve, reject) => {
        console.log('\n🔧 Démarrage du backend...');

        const backend = spawn('node', ['start-backend.js'], {
            cwd: config.backendPath,
            stdio: 'pipe',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: 'development',
                PORT: config.backendPort
            }
        });

        backend.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[Backend] ${output.trim()}`);

            // Détecter quand le backend est prêt
            if (output.includes('Serveur démarré') || output.includes('API disponible')) {
                console.log('✅ Backend démarré avec succès !');
                resolve(backend);
            }
        });

        backend.stderr.on('data', (data) => {
            console.error(`[Backend] ${data.toString().trim()}`);
        });

        backend.on('error', (err) => {
            console.error('❌ Erreur backend:', err);
            reject(err);
        });

        backend.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Backend arrêté avec le code ${code}`);
                reject(new Error(`Backend arrêté avec le code ${code}`));
            }
        });
    });
}

// Démarrer le frontend
function startFrontend() {
    return new Promise((resolve, reject) => {
        console.log('\n⚛️ Démarrage du frontend...');

        const frontend = spawn('node', ['start-frontend.cjs'], {
            cwd: config.frontendPath,
            stdio: 'pipe',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: 'development',
                VITE_API_URL: `http://localhost:${config.backendPort}`,
                PORT: config.frontendPort
            }
        });

        frontend.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[Frontend] ${output.trim()}`);

            // Détecter quand le frontend est prêt
            if (output.includes('Application:') || output.includes('ready in')) {
                console.log('✅ Frontend démarré avec succès !');
                resolve(frontend);
            }
        });

        frontend.stderr.on('data', (data) => {
            console.error(`[Frontend] ${data.toString().trim()}`);
        });

        frontend.on('error', (err) => {
            console.error('❌ Erreur frontend:', err);
            reject(err);
        });

        frontend.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Frontend arrêté avec le code ${code}`);
                reject(new Error(`Frontend arrêté avec le code ${code}`));
            }
        });
    });
}

// Afficher les informations de connexion
function showConnectionInfo() {
    console.log('\n🎉 Konipa Application démarrée avec succès !');
    console.log('='.repeat(60));
    console.log('📡 Backend API: http://localhost:' + config.backendPort);
    console.log('🌐 Frontend: http://localhost:' + config.frontendPort);
    console.log('🔑 Login admin: admin@konipa.com / admin123');
    console.log('📊 Dashboard: http://localhost:' + config.backendPort + '/api/dashboard/stats');
    console.log('📋 Documentation: Voir TEST_REPORT.md dans le dossier backend');
    console.log('\n💡 Appuyez sur Ctrl+C pour arrêter tous les services');
    console.log('='.repeat(60));
}

// Gestion des signaux d'arrêt
function setupSignalHandlers(backend, frontend) {
    process.on('SIGINT', () => {
        console.log('\n🛑 Arrêt de tous les services...');
        if (backend) {
            backend.kill('SIGINT');
        }
        if (frontend) {
            frontend.kill('SIGINT');
        }
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Arrêt de tous les services...');
        if (backend) {
            backend.kill('SIGTERM');
        }
        if (frontend) {
            frontend.kill('SIGTERM');
        }
        process.exit(0);
    });
}

// Fonction principale
async function main() {
    try {
        // Vérifier les dossiers
        if (!checkDirectories()) {
            process.exit(1);
        }

        // Installer les dépendances
        await installDependencies();

        // Démarrer le backend
        const backend = await startBackend();

        // Attendre un peu avant de démarrer le frontend
        console.log(`\n⏳ Attente de ${config.delay / 1000} secondes avant le démarrage du frontend...`);
        await new Promise(resolve => setTimeout(resolve, config.delay));

        // Démarrer le frontend
        const frontend = await startFrontend();

        // Afficher les informations de connexion
        showConnectionInfo();

        // Configurer les gestionnaires de signaux
        setupSignalHandlers(backend, frontend);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Démarrer l'application
main();
