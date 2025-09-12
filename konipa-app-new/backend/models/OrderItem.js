const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
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
  sku: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0
  },
  vat_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20
  },
  vat_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  weight: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: true
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['product_id']
    }
  ]
});

// Hooks pour calculer automatiquement les totaux
OrderItem.addHook('beforeSave', (orderItem) => {
  // Calculer le montant de la remise
  const baseAmount = orderItem.quantity * orderItem.price;
  orderItem.discount_amount = baseAmount * (orderItem.discount_percent / 100);
  
  // Calculer le montant HT après remise
  const amountAfterDiscount = baseAmount - orderItem.discount_amount;
  
  // Calculer la TVA
  orderItem.vat_amount = amountAfterDiscount * (orderItem.vat_rate / 100);
  
  // Calculer le total TTC
  orderItem.total_price = amountAfterDiscount + orderItem.vat_amount;
});

// Associations
OrderItem.associate = (models) => {
  // Une ligne de commande appartient à une commande
  OrderItem.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
  
  // Une ligne de commande appartient à un produit
  OrderItem.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
};

// Méthodes d'instance
OrderItem.prototype.canBeModified = function() {
  return ['pending'].includes(this.status);
};

OrderItem.prototype.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

OrderItem.prototype.getRemainingQuantity = function() {
  return this.quantity - this.quantity_delivered;
};

OrderItem.prototype.getShippingProgress = function() {
  if (this.quantity === 0) return 0;
  return (this.quantity_shipped / this.quantity) * 100;
};

OrderItem.prototype.getDeliveryProgress = function() {
  if (this.quantity === 0) return 0;
  return (this.quantity_delivered / this.quantity) * 100;
};

OrderItem.prototype.isFullyDelivered = function() {
  return this.quantity_delivered >= this.quantity;
};

OrderItem.prototype.isPartiallyDelivered = function() {
  return this.quantity_delivered > 0 && this.quantity_delivered < this.quantity;
};

// Méthodes de classe
OrderItem.findByOrder = function(orderId) {
  return this.findAll({
    where: { order_id: orderId },
    include: ['product'],
    order: [['created_at', 'ASC']]
  });
};

OrderItem.findByProduct = function(productId, limit = 50) {
  return this.findAll({
    where: { product_id: productId },
    include: ['order'],
    order: [['created_at', 'DESC']],
    limit
  });
};

OrderItem.getNeedingSync = function() {
  return this.findAll({
    where: {
      is_synced_to_sage: false,
      status: ['confirmed']
    },
    include: ['order', 'product']
  });
};

OrderItem.getByStatus = function(status) {
  return this.findAll({
    where: { status },
    include: ['order', 'product'],
    order: [['created_at', 'DESC']]
  });
};

OrderItem.getPendingDeliveries = function() {
  return this.findAll({
    where: {
      status: ['confirmed', 'shipped'],
      quantity_delivered: {
        [sequelize.Op.lt]: sequelize.col('quantity')
      }
    },
    include: ['order', 'product'],
    order: [['created_at', 'ASC']]
  });
};

OrderItem.getTopProducts = function(startDate, endDate, limit = 10) {
  return this.findAll({
    attributes: [
      'product_id',
      'product_name',
      'product_ref_sage',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      [sequelize.fn('SUM', sequelize.col('total_ht')), 'total_amount'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'order_count']
    ],
    where: {
      created_at: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      status: {
        [sequelize.Op.ne]: 'cancelled'
      }
    },
    group: ['product_id', 'product_name', 'product_ref_sage'],
    order: [[sequelize.fn('SUM', sequelize.col('total_ht')), 'DESC']],
    limit
  });
};

module.exports = OrderItem;