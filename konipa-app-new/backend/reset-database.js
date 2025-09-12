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

async function resetDatabase() {
    try {
        // Test de connexion
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données établie');

        // Supprimer la table users si elle existe
        await sequelize.query('DROP TABLE IF EXISTS users CASCADE;');
        console.log('✅ Table users supprimée');

        // Créer la table users avec la bonne structure
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
        console.log('✅ Table users créée avec la bonne structure');

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

        console.log('✅ Base de données réinitialisée avec succès');
        console.log('✅ Utilisateur admin créé: admin@konipa.com / admin123');

    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
    } finally {
        await sequelize.close();
    }
}

resetDatabase();
