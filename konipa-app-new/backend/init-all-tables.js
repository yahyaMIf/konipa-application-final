const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la base de données PostgreSQL
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'konipa_db',
    username: process.env.DB_USER || 'konipa_user',
    password: process.env.DB_PASSWORD || 'konipa_password',
    logging: console.log,
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    }
});

async function initAllTables() {
    try {
        // Test de connexion
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données établie');

        // Supprimer toutes les tables existantes
        await sequelize.query('DROP TABLE IF EXISTS order_items CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS orders CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS products CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS clients CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS users CASCADE;');
        console.log('✅ Tables existantes supprimées');

        // Créer la table users
        await sequelize.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(20),
        client_code_sage VARCHAR(50),
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        is_blocked BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Table users créée');

        // Créer la table clients
        await sequelize.query(`
      CREATE TABLE clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        credit_limit DECIMAL(15,2) DEFAULT 0,
        outstanding_amount DECIMAL(15,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Table clients créée');

        // Créer la table products
        await sequelize.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        product_ref_sage VARCHAR(100),
        base_price_ht DECIMAL(10,2) NOT NULL,
        brand VARCHAR(100),
        category VARCHAR(100),
        stock_quantity INTEGER DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Table products créée');

        // Créer la table orders
        await sequelize.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Table orders créée');

        // Créer la table order_items
        await sequelize.query(`
      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Table order_items créée');

        // Créer la table pricing
        await sequelize.query(`
      CREATE TABLE pricing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id),
        product_id UUID REFERENCES products(id),
        discount_percent DECIMAL(5,2) DEFAULT 0,
        minimum_quantity INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Table pricing créée');

        // Créer un utilisateur admin par défaut
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await sequelize.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
      VALUES (
        'b3543451-c085-43d1-9ce1-2d1ad32bf620',
        'admin@konipa.com',
        $1,
        'Admin',
        'Konipa',
        'admin',
        true
      );
    `, {
            bind: [hashedPassword]
        });
        console.log('✅ Utilisateur admin créé');

        // Créer des données de test
        await sequelize.query(`
      INSERT INTO clients (id, company_name, contact_person, email, phone, address, credit_limit, outstanding_amount)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'ELYAZID PIECES AUTO', 'Ahmed Elyazid', 'contact@elyazid-pieces.com', '+212 5 22 33 44 55', '123 Rue Mohammed V, Casablanca', 50000.00, 12500.00),
        ('550e8400-e29b-41d4-a716-446655440002', 'AUTO PARTS MAROC', 'Fatima Benali', 'info@autoparts.ma', '+212 5 24 55 66 77', '456 Avenue Hassan II, Rabat', 30000.00, 8500.00);
    `);
        console.log('✅ Clients de test créés');

        await sequelize.query(`
      INSERT INTO products (id, name, product_ref_sage, base_price_ht, brand, category, stock_quantity, description)
      VALUES 
        ('660e8400-e29b-41d4-a716-446655440001', 'Plaquettes de frein avant', 'PF001', 125.50, 'Brembo', 'Freinage', 150, 'Plaquettes de frein haute qualité'),
        ('660e8400-e29b-41d4-a716-446655440002', 'Filtre à huile', 'FO002', 45.00, 'Mann-Filter', 'Filtres', 200, 'Filtre à huile moteur'),
        ('660e8400-e29b-41d4-a716-446655440003', 'Bougies d''allumage', 'BA003', 25.75, 'NGK', 'Moteur', 300, 'Bougies d''allumage iridium');
    `);
        console.log('✅ Produits de test créés');

        await sequelize.query(`
      INSERT INTO orders (id, client_id, order_date, total_amount, status)
      VALUES 
        ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-01-15 10:30:00', 2500.00, 'pending'),
        ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-01-16 14:20:00', 1800.00, 'completed');
    `);
        console.log('✅ Commandes de test créées');

        await sequelize.query(`
      INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
      VALUES 
        ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 10, 125.50, 1255.00),
        ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 5, 45.00, 225.00),
        ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 8, 25.75, 206.00);
    `);
        console.log('✅ Articles de commande créés');

        await sequelize.query(`
      INSERT INTO pricing (id, client_id, product_id, discount_percent, minimum_quantity)
      VALUES 
        ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 5.00, 10),
        ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 3.00, 5),
        ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 7.50, 8);
    `);
        console.log('✅ Tarifications créées');

        console.log('✅ Base de données complètement initialisée avec succès');
        console.log('✅ Utilisateur admin: admin@konipa.com / admin123');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    } finally {
        await sequelize.close();
    }
}

initAllTables();
