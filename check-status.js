#!/usr/bin/env node

/**
 * Script de vérification du statut de Konipa Application
 * 
 * Ce script vérifie :
 * - Le statut du backend
 * - Le statut du frontend
 * - Les APIs principales
 * - L'authentification
 */

const axios = require('axios');

const config = {
    backendUrl: 'http://localhost:3003',
    frontendUrl: 'http://localhost:5173',
    timeout: 5000
};

console.log('🔍 Vérification du statut de Konipa Application...');
console.log('='.repeat(60));

// Fonction pour tester une URL
async function testUrl(name, url, expectedStatus = 200) {
    try {
        console.log(`\n🧪 Test: ${name}`);
        console.log(`📍 URL: ${url}`);

        const response = await axios.get(url, { timeout: config.timeout });

        if (response.status === expectedStatus) {
            console.log(`✅ Succès (${response.status})`);
            return { success: true, data: response.data };
        } else {
            console.log(`❌ Échec - Status attendu: ${expectedStatus}, reçu: ${response.status}`);
            return { success: false, error: `Status ${response.status}` };
        }
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Fonction pour tester l'authentification
async function testAuth() {
    try {
        console.log(`\n🔐 Test: Authentification`);
        console.log(`📍 URL: ${config.backendUrl}/api/auth/login`);

        const response = await axios.post(`${config.backendUrl}/api/auth/login`, {
            email: 'admin@konipa.com',
            password: 'admin123'
        }, { timeout: config.timeout });

        if (response.data.success) {
            console.log(`✅ Authentification réussie`);
            return { success: true, token: response.data.accessToken };
        } else {
            console.log(`❌ Échec de l'authentification`);
            return { success: false, error: response.data.message };
        }
    } catch (error) {
        console.log(`❌ Erreur d'authentification: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Fonction pour tester les APIs avec authentification
async function testApiWithAuth(name, endpoint, token) {
    try {
        console.log(`\n📡 Test: ${name}`);
        console.log(`📍 URL: ${config.backendUrl}${endpoint}`);

        const response = await axios.get(`${config.backendUrl}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: config.timeout
        });

        if (response.data.success !== false) {
            console.log(`✅ Succès`);
            return { success: true, data: response.data };
        } else {
            console.log(`❌ Échec - ${response.data.message}`);
            return { success: false, error: response.data.message };
        }
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Fonction principale
async function main() {
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Test 1: Backend API de test
    results.total++;
    const backendTest = await testUrl('Backend API', `${config.backendUrl}/api/test`);
    if (backendTest.success) results.passed++; else results.failed++;

    // Test 2: Backend Health
    results.total++;
    const healthTest = await testUrl('Backend Health', `${config.backendUrl}/health`);
    if (healthTest.success) results.passed++; else results.failed++;

    // Test 3: Frontend
    results.total++;
    const frontendTest = await testUrl('Frontend', config.frontendUrl);
    if (frontendTest.success) results.passed++; else results.failed++;

    // Test 4: Authentification
    results.total++;
    const authTest = await testAuth();
    if (authTest.success) results.passed++; else results.failed++;

    // Si l'authentification fonctionne, tester les APIs protégées
    if (authTest.success && authTest.token) {
        const token = authTest.token;

        // Test 5: API Utilisateurs
        results.total++;
        const usersTest = await testApiWithAuth('API Utilisateurs', '/api/users', token);
        if (usersTest.success) results.passed++; else results.failed++;

        // Test 6: API Produits
        results.total++;
        const productsTest = await testApiWithAuth('API Produits', '/api/products', token);
        if (productsTest.success) results.passed++; else results.failed++;

        // Test 7: API Clients
        results.total++;
        const clientsTest = await testApiWithAuth('API Clients', '/api/clients', token);
        if (clientsTest.success) results.passed++; else results.failed++;

        // Test 8: API Commandes
        results.total++;
        const ordersTest = await testApiWithAuth('API Commandes', '/api/orders', token);
        if (ordersTest.success) results.passed++; else results.failed++;

        // Test 9: API Dashboard
        results.total++;
        const dashboardTest = await testApiWithAuth('API Dashboard', '/api/dashboard/stats', token);
        if (dashboardTest.success) results.passed++; else results.failed++;

        // Test 10: API Notifications
        results.total++;
        const notificationsTest = await testApiWithAuth('API Notifications', '/api/notifications', token);
        if (notificationsTest.success) results.passed++; else results.failed++;
    }

    // Résumé des tests
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    console.log(`Total: ${results.total}`);
    console.log(`✅ Réussis: ${results.passed}`);
    console.log(`❌ Échoués: ${results.failed}`);
    console.log(`📈 Taux de réussite: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
        console.log('\n🎉 Tous les tests sont passés avec succès !');
        console.log('\n🌐 Accès à l\'application:');
        console.log(`   Frontend: ${config.frontendUrl}`);
        console.log(`   Backend: ${config.backendUrl}`);
        console.log(`   Login: admin@konipa.com / admin123`);
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) ont échoué. Vérifiez les logs ci-dessus.`);
    }

    console.log('\n💡 Pour arrêter les services, utilisez Ctrl+C dans les terminaux où ils tournent');
}

// Exécuter les tests
main().catch(console.error);
