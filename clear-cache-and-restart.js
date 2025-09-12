#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧹 Nettoyage du cache et redémarrage de Konipa...');
console.log('==================================================');

// Fonction pour exécuter une commande
function runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔄 Exécution: ${command} ${args.join(' ')}`);

        const process = spawn(command, args, {
            cwd: cwd || process.cwd(),
            stdio: 'inherit',
            shell: true
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Commande terminée avec succès`);
                resolve();
            } else {
                console.log(`❌ Commande terminée avec le code ${code}`);
                reject(new Error(`Command failed with code ${code}`));
            }
        });

        process.on('error', (error) => {
            console.error(`❌ Erreur lors de l'exécution:`, error.message);
            reject(error);
        });
    });
}

async function main() {
    try {
        // 1. Arrêter tous les processus Node.js
        console.log('\n1️⃣ Arrêt des processus existants...');
        try {
            await runCommand('pkill', ['-f', 'node'], process.cwd());
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('ℹ️ Aucun processus à arrêter');
        }

        // 2. Nettoyer le cache npm
        console.log('\n2️⃣ Nettoyage du cache npm...');
        try {
            await runCommand('npm', ['cache', 'clean', '--force'], process.cwd());
        } catch (error) {
            console.log('⚠️ Erreur lors du nettoyage du cache npm:', error.message);
        }

        // 3. Nettoyer le cache Vite
        console.log('\n3️⃣ Nettoyage du cache Vite...');
        try {
            const frontendPath = path.join(process.cwd(), 'konipa-app-new');
            await runCommand('rm', ['-rf', 'node_modules/.vite'], frontendPath);
            console.log('✅ Cache Vite nettoyé');
        } catch (error) {
            console.log('⚠️ Erreur lors du nettoyage du cache Vite:', error.message);
        }

        // 4. Redémarrer le backend
        console.log('\n4️⃣ Redémarrage du backend...');
        const backendPath = path.join(process.cwd(), 'konipa-app-new', 'backend');
        const backendProcess = spawn('node', ['start-backend.js'], {
            cwd: backendPath,
            stdio: 'pipe',
            detached: true
        });

        // Attendre que le backend démarre
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 5. Redémarrer le frontend
        console.log('\n5️⃣ Redémarrage du frontend...');
        const frontendPath = path.join(process.cwd(), 'konipa-app-new');
        const frontendProcess = spawn('node', ['start-frontend.cjs'], {
            cwd: frontendPath,
            stdio: 'pipe',
            detached: true
        });

        // Attendre que le frontend démarre
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 6. Tester la connexion
        console.log('\n6️⃣ Test de la connexion...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            await runCommand('node', ['check-status.js'], process.cwd());
        } catch (error) {
            console.log('⚠️ Erreur lors du test:', error.message);
        }

        console.log('\n🎉 Redémarrage terminé !');
        console.log('🌐 Frontend: http://localhost:5173');
        console.log('🔧 Backend: http://localhost:3003');
        console.log('🔑 Login: admin@konipa.com / admin123');
        console.log('\n💡 Pour arrêter les services, utilisez Ctrl+C');

    } catch (error) {
        console.error('\n❌ Erreur lors du redémarrage:', error.message);
        process.exit(1);
    }
}

main();
