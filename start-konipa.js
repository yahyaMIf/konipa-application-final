#!/usr/bin/env node

/**
 * Script de démarrage complet pour Konipa Application
 * 
 * Ce script démarre :
 * 1. Le serveur backend (Node.js + Express + PostgreSQL)
 * 2. Le serveur frontend (Vite + React)
 * 3. La base de données (PostgreSQL)
 * 4. Les services de synchronisation
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Démarrage de Konipa Application...');
console.log('='.repeat(60));

// Vérifier si nous sommes dans le bon répertoire
const projectRoot = __dirname;
const backendPath = path.join(projectRoot, 'konipa-app-new', 'backend');
const frontendPath = path.join(projectRoot, 'konipa-app-new', 'frontend');

console.log('📁 Répertoire du projet:', projectRoot);
console.log('📁 Backend:', backendPath);
console.log('📁 Frontend:', frontendPath);

// Vérifier l'existence des dossiers
if (!fs.existsSync(backendPath)) {
    console.error('❌ Dossier backend non trouvé:', backendPath);
    process.exit(1);
}

if (!fs.existsSync(frontendPath)) {
    console.error('❌ Dossier frontend non trouvé:', frontendPath);
    process.exit(1);
}

// Fonction pour démarrer un service
function startService(name, command, args, cwd, env = {}) {
    console.log(`\n🔧 Démarrage de ${name}...`);

    const service = spawn(command, args, {
        cwd: cwd,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, ...env }
    });

    service.stdout.on('data', (data) => {
        console.log(`[${name}] ${data.toString().trim()}`);
    });

    service.stderr.on('data', (data) => {
        console.error(`[${name}] ${data.toString().trim()}`);
    });

    service.on('error', (err) => {
        console.error(`❌ Erreur ${name}:`, err.message);
    });

    service.on('exit', (code) => {
        if (code !== 0) {
            console.error(`❌ ${name} s'est arrêté avec le code ${code}`);
        }
    });

    return service;
}

// Démarrer les services
console.log('\n📦 Installation des dépendances...');

// Installer les dépendances backend
console.log('📦 Installation des dépendances backend...');
exec('npm install', { cwd: backendPath }, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Erreur installation backend:', error);
        return;
    }
    console.log('✅ Dépendances backend installées');
});

// Installer les dépendances frontend
console.log('📦 Installation des dépendances frontend...');
exec('npm install', { cwd: frontendPath }, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Erreur installation frontend:', error);
        return;
    }
    console.log('✅ Dépendances frontend installées');
});

// Attendre un peu puis démarrer les services
setTimeout(() => {
    console.log('\n🚀 Démarrage des services...');

    // Démarrer le backend
    const backend = startService(
        'Backend',
        'node',
        ['server.js'],
        backendPath,
        { NODE_ENV: 'development', PORT: '3003' }
    );

    // Démarrer le frontend
    const frontend = startService(
        'Frontend',
        'npm',
        ['run', 'dev'],
        frontendPath,
        { VITE_API_URL: 'http://localhost:3003' }
    );

    // Gestion des signaux d'arrêt
    process.on('SIGINT', () => {
        console.log('\n🛑 Arrêt de tous les services...');
        backend.kill('SIGINT');
        frontend.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Arrêt de tous les services...');
        backend.kill('SIGTERM');
        frontend.kill('SIGTERM');
        process.exit(0);
    });

    console.log('\n✅ Services démarrés avec succès !');
    console.log('📡 Backend API: http://localhost:3003');
    console.log('🌐 Frontend: http://localhost:5173');
    console.log('🔑 Login admin: admin@konipa.com / admin123');
    console.log('\n💡 Appuyez sur Ctrl+C pour arrêter tous les services');

}, 5000);

// Afficher les informations du projet
console.log('\n📋 Informations du projet:');
console.log('🏢 Nom: Konipa Application');
console.log('📝 Version: 1.0.0');
console.log('🔧 Backend: Node.js + Express + PostgreSQL');
console.log('⚛️ Frontend: React + Vite + TypeScript');
console.log('🔐 Authentification: JWT');
console.log('📊 Base de données: PostgreSQL');
console.log('🌐 CORS: Configuré pour le développement');
