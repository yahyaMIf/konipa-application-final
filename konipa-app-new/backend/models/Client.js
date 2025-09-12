const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },

  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contact_person: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address_line1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Morocco'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },

  credit_limit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },

  outstanding_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  client_code_sage: {
    type: DataTypes.STRING,
    allowNull: false
  },
  representative_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  payment_terms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 30
  },
  discount_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  vat_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'active'
  },

}, {
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['company_name']
    },
    {
      fields: ['client_code_sage']
    },
    {
      fields: ['is_blocked']
    },
    {
      fields: ['representative_id']
    }
  ]
});

// Associations
Client.associate = (models) => {
  Client.hasMany(models.Order, {
    foreignKey: 'client_id',
    as: 'orders'
  });
};

module.exports = Client;