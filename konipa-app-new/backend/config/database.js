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
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Test de la connexion
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connexion à la base de données établie avec succès.');
  })
  .catch(err => {
    console.error('❌ Impossible de se connecter à la base de données:', err);
  });

module.exports = sequelize;