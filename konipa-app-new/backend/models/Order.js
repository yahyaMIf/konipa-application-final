const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  order_number: {
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft'
  },
  order_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  required_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipped_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR'
  },
  payment_status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  billing_address: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  shipping_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  internal_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  converted_from_quote_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['order_number']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['order_date']
    }
  ]
});

// Associations
Order.associate = (models) => {
  Order.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });
  
  Order.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  Order.hasMany(models.OrderItem, {
    foreignKey: 'order_id',
    as: 'orderItems'
  });
};

module.exports = Order;