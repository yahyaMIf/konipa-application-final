const { sequelize, User, Client, Order, Category, Brand, Product } = require('../models');
const { seedUsers } = require('./userSeeder');
const { seedClients } = require('./clientSeeder');
const { seedOrders } = require('./orderSeeder');
const { seedProducts } = require('./productSeeder');

const runSeeders = async () => {
  try {
    console.log('🌱 Démarrage du seeding de la base de données...');
    
    // Vérifier la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie.');
    
    // Synchroniser les tables dans l'ordre des dépendances
    await User.sync({ alter: true });
    console.log('✅ Synchronisation de la table users terminée.');
    
    await Client.sync({ alter: true });
    console.log('✅ Synchronisation de la table clients terminée.');
    
    await Category.sync({ alter: true });
    console.log('✅ Synchronisation de la table categories terminée.');
    
    await Brand.sync({ alter: true });
    console.log('✅ Synchronisation de la table brands terminée.');
    
    await Product.sync({ alter: true });
    console.log('✅ Synchronisation de la table products terminée.');
    
    await Order.sync({ alter: true });
    console.log('✅ Synchronisation de la table orders terminée.');
    
    // Exécuter les seeders dans l'ordre des dépendances
    await seedUsers();
    await seedClients();
    await seedProducts();
    await seedOrders();
    
    console.log('🎉 Seeding terminé avec succès!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
};

// Exécuter le seeding si ce fichier est appelé directement
if (require.main === module) {
  runSeeders();
}

module.exports = { runSeeders };