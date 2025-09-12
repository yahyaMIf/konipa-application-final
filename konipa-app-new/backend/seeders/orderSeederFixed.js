const { Order, OrderItem, User, Client, Product } = require('../models');

const seedOrders = async () => {
    try {
        // Vérifier si des commandes existent déjà
        const existingOrders = await Order.count();
        if (existingOrders > 0) {
            console.log('Des commandes existent déjà, seeding ignoré.');
            return;
        }

        // Récupérer les utilisateurs et clients
        const users = await User.findAll();
        const clients = await Client.findAll();
        const products = await Product.findAll();

        if (users.length === 0 || clients.length === 0 || products.length === 0) {
            console.log('❌ Impossible de créer des commandes: utilisateurs, clients ou produits manquants');
            return;
        }

        const ordersData = [
            {
                id: '550e8400-e29b-41d4-a716-446655440301',
                order_number: 'CMD-2024-001',
                client_id: clients[0].id,
                user_id: users.find(u => u.role === 'client').id,
                status: 'submitted',
                order_date: new Date('2024-01-15'),
                required_date: new Date('2024-01-25'),
                total_ht: 1599.98,
                total_ttc: 1919.98,
                vat_amount: 320.00,
                notes: 'Commande urgente pour nouveau projet',
                payment_method: 'credit',
                shipping_address: clients[0].address_line1 + ', ' + clients[0].city
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440302',
                order_number: 'CMD-2024-002',
                client_id: clients[1].id,
                user_id: users.find(u => u.role === 'client').id,
                status: 'validated',
                order_date: new Date('2024-01-16'),
                required_date: new Date('2024-01-30'),
                total_ht: 899.99,
                total_ttc: 1079.99,
                vat_amount: 180.00,
                notes: 'Commande standard',
                payment_method: 'credit',
                shipping_address: clients[1].address_line1 + ', ' + clients[1].city
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440303',
                order_number: 'CMD-2024-003',
                client_id: clients[2].id,
                user_id: users.find(u => u.role === 'client').id,
                status: 'preparation',
                order_date: new Date('2024-01-17'),
                required_date: new Date('2024-02-01'),
                total_ht: 299.99,
                total_ttc: 359.99,
                vat_amount: 60.00,
                notes: 'Commande en préparation',
                payment_method: 'credit',
                shipping_address: clients[2].address_line1 + ', ' + clients[2].city
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440304',
                order_number: 'CMD-2024-004',
                client_id: clients[3].id,
                user_id: users.find(u => u.role === 'client').id,
                status: 'ready',
                order_date: new Date('2024-01-18'),
                required_date: new Date('2024-02-05'),
                total_ht: 1299.99,
                total_ttc: 1559.99,
                vat_amount: 260.00,
                notes: 'Commande prête à expédier',
                payment_method: 'credit',
                shipping_address: clients[3].address_line1 + ', ' + clients[3].city
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440305',
                order_number: 'CMD-2024-005',
                client_id: clients[4].id,
                user_id: users.find(u => u.role === 'client').id,
                status: 'shipped',
                order_date: new Date('2024-01-19'),
                shipped_date: new Date('2024-01-20'),
                total_ht: 8.99,
                total_ttc: 10.79,
                vat_amount: 1.80,
                notes: 'Commande expédiée',
                payment_method: 'credit',
                shipping_address: clients[4].address_line1 + ', ' + clients[4].city
            }
        ];

        const createdOrders = await Order.bulkCreate(ordersData);

        // Créer les items de commande
        const orderItemsData = [
            // Commande 1
            {
                order_id: createdOrders[0].id,
                product_id: products[0].id, // Laptop
                quantity: 1,
                sku: products[0].sku,
                name: products[0].name,
                description: products[0].description,
                price: 1299.99,
                original_price: 1299.99,
                vat_rate: 20.00,
                vat_amount: 259.99,
                total_price: 1559.98
            },
            {
                order_id: createdOrders[0].id,
                product_id: products[1].id, // Monitor
                quantity: 1,
                sku: products[1].sku,
                name: products[1].name,
                description: products[1].description,
                price: 599.99,
                original_price: 599.99,
                vat_rate: 20.00,
                vat_amount: 120.00,
                total_price: 719.99
            },
            // Commande 2
            {
                order_id: createdOrders[1].id,
                product_id: products[2].id, // Desk
                quantity: 1,
                sku: products[2].sku,
                name: products[2].name,
                description: products[2].description,
                price: 899.99,
                original_price: 899.99,
                vat_rate: 20.00,
                vat_amount: 180.00,
                total_price: 1079.99
            },
            // Commande 3
            {
                order_id: createdOrders[2].id,
                product_id: products[5].id, // Printer
                quantity: 1,
                sku: products[5].sku,
                name: products[5].name,
                description: products[5].description,
                price: 299.99,
                original_price: 299.99,
                vat_rate: 20.00,
                vat_amount: 60.00,
                total_price: 359.99
            },
            // Commande 4
            {
                order_id: createdOrders[3].id,
                product_id: products[3].id, // Chair
                quantity: 1,
                sku: products[3].sku,
                name: products[3].name,
                description: products[3].description,
                price: 1299.99,
                original_price: 1299.99,
                vat_rate: 20.00,
                vat_amount: 260.00,
                total_price: 1559.99
            },
            // Commande 5
            {
                order_id: createdOrders[4].id,
                product_id: products[4].id, // Paper
                quantity: 1,
                sku: products[4].sku,
                name: products[4].name,
                description: products[4].description,
                price: 8.99,
                original_price: 8.99,
                vat_rate: 20.00,
                vat_amount: 1.80,
                total_price: 10.79
            }
        ];

        await OrderItem.bulkCreate(orderItemsData);

        console.log('✅ Seeding des commandes terminé avec succès!');
        console.log(`📊 ${createdOrders.length} commandes créées:`);

        createdOrders.forEach((order, index) => {
            console.log(`   - ${order.order_number} (${order.status}) - ${order.total_ttc}€`);
        });

        return createdOrders;

    } catch (error) {
        console.error('❌ Erreur lors du seeding des commandes:', error);
        throw error;
    }
};

module.exports = { seedOrders };
