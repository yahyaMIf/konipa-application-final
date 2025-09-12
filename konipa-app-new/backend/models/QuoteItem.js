const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuoteItem = sequelize.define('QuoteItem', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  quote_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'quotes',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  }
}, {
  tableName: 'quote_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['quote_id']
    },
    {
      fields: ['product_id']
    }
  ]
});

QuoteItem.associate = (models) => {
  QuoteItem.belongsTo(models.Quote, {
    foreignKey: 'quote_id',
    as: 'quote'
  });
  QuoteItem.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
};

module.exports = QuoteItem;