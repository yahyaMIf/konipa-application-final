const { Order, OrderItem, User, Client, Product } = require('../models');

const seedOrders = async () => {
  try {
    // Vérifier si des commandes existent déjà
    const existingOrders = await Order.count();
    if (existingOrders > 0) {
      console.log('Des commandes existent déjà, seeding ignoré.');
      return;
    }

    // Récupérer les utilisateurs et clients existants
    const users = await User.findAll();
    const clients = await Client.findAll();
    
    if (users.length === 0 || clients.length === 0) {
      console.log('Aucun utilisateur ou client trouvé. Veuillez d\'abord exécuter le seeding des utilisateurs et clients.');
      return;
    }

    // Créer des commandes avec différents statuts
    const ordersData = [
      {
        order_number: 'CMD-2024-001',
        client_id: clients[0]?.id,
        user_id: users.find(u => u.role === 'client')?.id || users[0]?.id,
        status: 'pending_validation',
        order_date: new Date('2024-01-15'),
        required_date: new Date('2024-01-20'),
        total_amount_ht: 2500.00,
        total_vat: 500.00,
        total_amount_ttc: 3000.00,
        delivery_address: {
          street: '123 Avenue Hassan II',
          city: 'Casablanca',
          postal_code: '20000',
          country: 'Maroc'
        }
      },
      {
        order_number: 'CMD-2024-002',
        client_id: clients[1]?.id,
        user_id: users.find(u => u.role === 'client')?.id || users[0]?.id,
        status: 'pending_validation',
        order_date: new Date('2024-01-16'),
        required_date: new Date('2024-01-22'),
        total_amount_ht: 1800.00,
        total_vat: 360.00,
        total_amount_ttc: 2160.00,
        delivery_address: {
          street: '456 Boulevard Mohammed V',
          city: 'Rabat',
          postal_code: '10000',
          country: 'Maroc'
        }
      },
      {
        order_number: 'CMD-2024-003',
        client_id: clients[0]?.id,
        user_id: users.find(u => u.role === 'comptoir')?.id || users[1]?.id,
        status: 'validated',
        order_date: new Date('2024-01-10'),
        required_date: new Date('2024-01-15'),
        total_amount_ht: 4200.00,
        total_vat: 840.00,
        total_amount_ttc: 5040.00,
        delivery_address: {
          street: '789 Rue de la Liberté',
          city: 'Casablanca',
          postal_code: '20100',
          country: 'Maroc'
        }
      },
      {
        order_number: 'CMD-2024-004',
        client_id: clients[1]?.id,
        user_id: users.find(u => u.role === 'client')?.id || users[0]?.id,
        status: 'accounting_approved',
        order_date: new Date('2024-01-12'),
        required_date: new Date('2024-01-18'),
        total_amount_ht: 3200.00,
        total_vat: 640.00,
        total_amount_ttc: 3840.00,
        delivery_address: {
          street: '321 Rue Allal Ben Abdellah',
          city: 'Fès',
          postal_code: '30000',
          country: 'Maroc'
        }
      },
      {
        order_number: 'CMD-2024-005',
        client_id: clients[0]?.id,
        user_id: users.find(u => u.role === 'comptoir')?.id || users[2]?.id,
        status: 'in_preparation',
        order_date: new Date('2024-01-08'),
        required_date: new Date('2024-01-12'),
        total_amount_ht: 1200.00,
        total_vat: 240.00,
        total_amount_ttc: 1440.00,
        delivery_address: {
          street: '654 Avenue Mohammed VI',
          city: 'Marrakech',
          postal_code: '40000',
          country: 'Maroc'
        }
      },
      {
        order_number: 'CMD-2024-006',
        client_id: clients[1]?.id,
        user_id: users.find(u => u.role === 'client')?.id || users[0]?.id,
        status: 'draft',
        order_date: new Date(),
        required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
        total_amount_ht: 500.00,
        total_vat: 100.00,
        total_amount_ttc: 600.00,
        delivery_address: {
          street: '987 Rue Ibn Battuta',
          city: 'Tanger',
          postal_code: '90000',
          country: 'Maroc'
        }
      }
    ];

    const createdOrders = await Order.bulkCreate(ordersData);
    console.log('✅ Seeding des commandes terminé avec succès!');
    console.log(`📊 ${createdOrders.length} commandes créées:`);
    
    createdOrders.forEach((order, index) => {
      console.log(`   - Commande #${order.id} (${order.status}) - ${order.total_amount_ttc}€`);
    });

    return createdOrders;

  } catch (error) {
    console.error('❌ Erreur lors du seeding des commandes:', error);
    throw error;
  }
};

module.exports = { seedOrders };