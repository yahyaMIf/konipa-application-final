const sequelize = require('./config/database');
const User = require('./models/User');
const Product = require('./models/Product');
const Client = require('./models/Client');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const PriceOverride = require('./models/PriceOverride');

async function syncDatabase() {
    try {
        console.log('🔄 Synchronisation de la base de données...');

        // Forcer la synchronisation (supprimer et recréer les tables)
        await sequelize.sync({ force: true });
        console.log('✅ Tables synchronisées avec les modèles Sequelize');

        // Créer un utilisateur admin
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const adminUser = await User.create({
            id: 'b3543451-c085-43d1-9ce1-2d1ad32bf620',
            email: 'admin@konipa.com',
            password_hash: hashedPassword,
            first_name: 'Admin',
            last_name: 'Konipa',
            role: 'admin',
            is_active: true
        });
        console.log('✅ Utilisateur admin créé');

        // Créer des clients de test
        const client1 = await Client.create({
            id: '550e8400-e29b-41d4-a716-446655440001',
            company_name: 'ELYAZID PIECES AUTO',
            contact_person: 'Ahmed Elyazid',
            email: 'contact@elyazid-pieces.com',
            phone: '+212 5 22 33 44 55',
            address_line1: '123 Rue Mohammed V, Casablanca',
            city: 'Casablanca',
            country: 'Morocco',
            client_code_sage: 'CLI001',
            credit_limit: 50000.00,
            outstanding_amount: 12500.00
        });

        const client2 = await Client.create({
            id: '550e8400-e29b-41d4-a716-446655440002',
            company_name: 'AUTO PARTS MAROC',
            contact_person: 'Fatima Benali',
            email: 'info@autoparts.ma',
            phone: '+212 5 24 55 66 77',
            address_line1: '456 Avenue Hassan II, Rabat',
            city: 'Rabat',
            country: 'Morocco',
            client_code_sage: 'CLI002',
            credit_limit: 30000.00,
            outstanding_amount: 8500.00
        });
        console.log('✅ Clients de test créés');

        // Créer des produits de test
        const product1 = await Product.create({
            id: '660e8400-e29b-41d4-a716-446655440001',
            name: 'Plaquettes de frein avant',
            sku: 'PF001',
            product_ref_sage: 'PF001',
            base_price_ht: 125.50,
            brand: 'Brembo',
            category: 'Freinage',
            subcategory: 'Plaquettes',
            stock_quantity: 150,
            description: 'Plaquettes de frein haute qualité',
            short_description: 'Plaquettes frein avant',
            is_active: true
        });

        const product2 = await Product.create({
            id: '660e8400-e29b-41d4-a716-446655440002',
            name: 'Filtre à huile',
            sku: 'FO002',
            product_ref_sage: 'FO002',
            base_price_ht: 45.00,
            brand: 'Mann-Filter',
            category: 'Filtres',
            subcategory: 'Huile',
            stock_quantity: 200,
            description: 'Filtre à huile moteur',
            short_description: 'Filtre huile',
            is_active: true
        });

        const product3 = await Product.create({
            id: '660e8400-e29b-41d4-a716-446655440003',
            name: 'Bougies d\'allumage',
            sku: 'BA003',
            product_ref_sage: 'BA003',
            base_price_ht: 25.75,
            brand: 'NGK',
            category: 'Moteur',
            subcategory: 'Allumage',
            stock_quantity: 300,
            description: 'Bougies d\'allumage iridium',
            short_description: 'Bougies iridium',
            is_active: true
        });
        console.log('✅ Produits de test créés');

        // Créer des commandes de test
        const order1 = await Order.create({
            id: '770e8400-e29b-41d4-a716-446655440001',
            order_number: 'ORD001',
            client_id: client1.id,
            user_id: adminUser.id,
            order_date: new Date('2024-01-15 10:30:00'),
            total_amount: 2500.00,
            status: 'pending',
            notes: 'Commande urgente'
        });

        const order2 = await Order.create({
            id: '770e8400-e29b-41d4-a716-446655440002',
            order_number: 'ORD002',
            client_id: client2.id,
            user_id: adminUser.id,
            order_date: new Date('2024-01-16 14:20:00'),
            total_amount: 1800.00,
            status: 'completed',
            notes: 'Commande livrée'
        });
        console.log('✅ Commandes de test créées');

        // Créer des articles de commande
        await OrderItem.create({
            id: '880e8400-e29b-41d4-a716-446655440001',
            order_id: order1.id,
            product_id: product1.id,
            quantity: 10,
            sku: product1.sku,
            name: product1.name,
            description: product1.description,
            price: 125.50,
            total_price: 1255.00
        });

        await OrderItem.create({
            id: '880e8400-e29b-41d4-a716-446655440002',
            order_id: order1.id,
            product_id: product2.id,
            quantity: 5,
            sku: product2.sku,
            name: product2.name,
            description: product2.description,
            price: 45.00,
            total_price: 225.00
        });

        await OrderItem.create({
            id: '880e8400-e29b-41d4-a716-446655440003',
            order_id: order2.id,
            product_id: product3.id,
            quantity: 8,
            sku: product3.sku,
            name: product3.name,
            description: product3.description,
            price: 25.75,
            total_price: 206.00
        });
        console.log('✅ Articles de commande créés');

        // Créer des tarifications
        await PriceOverride.create({
            id: '990e8400-e29b-41d4-a716-446655440001',
            client_id: client1.id,
            product_id: product1.id,
            discount_percent: 5.00,
            minimum_quantity: 10,
            valid_from: new Date(),
            created_by: adminUser.id
        });

        await PriceOverride.create({
            id: '990e8400-e29b-41d4-a716-446655440002',
            client_id: client1.id,
            product_id: product2.id,
            discount_percent: 3.00,
            minimum_quantity: 5,
            valid_from: new Date(),
            created_by: adminUser.id
        });

        await PriceOverride.create({
            id: '990e8400-e29b-41d4-a716-446655440003',
            client_id: client2.id,
            product_id: product3.id,
            discount_percent: 7.50,
            minimum_quantity: 8,
            valid_from: new Date(),
            created_by: adminUser.id
        });
        console.log('✅ Tarifications créées');

        console.log('🎉 Base de données complètement synchronisée avec succès !');
        console.log('✅ Utilisateur admin: admin@konipa.com / admin123');

    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
        await sequelize.close();
    }
}

syncDatabase();
