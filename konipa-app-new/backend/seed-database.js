const { sequelize } = require('./models');
const { seedUsers } = require('./seeders/userSeeder');
const { seedClients } = require('./seeders/clientSeeder');
const { seedProducts } = require('./seeders/productSeeder');
const { seedOrders } = require('./seeders/orderSeeder');

const seedDatabase = async () => {
    try {
        console.log('🌱 Démarrage du seeding de la base de données...');

        // Synchroniser la base de données
        console.log('🔄 Synchronisation de la base de données...');
        await sequelize.sync({ force: true });
        console.log('✅ Base de données synchronisée');

        // Seeder les utilisateurs
        console.log('👥 Seeding des utilisateurs...');
        await seedUsers();

        // Seeder les clients
        console.log('🏢 Seeding des clients...');
        await seedClients();

        // Seeder les produits
        console.log('📦 Seeding des produits...');
        await seedProducts();

        // Seeder les commandes
        console.log('🛒 Seeding des commandes...');
        await seedOrders();

        console.log('🎉 Seeding terminé avec succès!');
        console.log('📊 Données de test créées:');
        console.log('   - Utilisateurs (admin, comptabilité, comptoir, représentant, clients)');
        console.log('   - Clients avec limites de crédit');
        console.log('   - Produits avec stocks');
        console.log('   - Commandes avec différents statuts');

    } catch (error) {
        console.error('❌ Erreur lors du seeding:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
};

// Exécuter le seeding si le script est appelé directement
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('✅ Script de seeding terminé');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
