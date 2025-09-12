const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  quote_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'quotes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['quote_number']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['status']
    }
  ]
});

Quote.associate = (models) => {
  Quote.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });
  Quote.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  Quote.hasMany(models.QuoteItem, {
    foreignKey: 'quote_id',
    as: 'quoteItems'
  });
};

module.exports = Quote;