const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductStock = sequelize.define('ProductStock', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  warehouse_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Code dépôt Sage'
  },
  quantity_available: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0,
    comment: 'Quantité disponible'
  },
  quantity_reserved: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0,
    comment: 'Quantité réservée'
  },
  quantity_ordered: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0,
    comment: 'Quantité en commande'
  },
  minimum_stock: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: true,
    comment: 'Stock minimum'
  },
  maximum_stock: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: true,
    comment: 'Stock maximum'
  },
  last_inventory_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date du dernier inventaire'
  },
  cost_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Prix de revient'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Emplacement dans le dépôt'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sage_sync_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de dernière synchronisation avec Sage'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'product_stocks',
  timestamps: true,
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['warehouse_code']
    },
    {
      fields: ['product_id', 'warehouse_code'],
      unique: true
    },
    {
      fields: ['quantity_available']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Associations
ProductStock.associate = (models) => {
  ProductStock.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
};

// Méthodes d'instance
ProductStock.prototype.getTotalQuantity = function () {
  return parseFloat(this.quantity_available) + parseFloat(this.quantity_reserved);
};

ProductStock.prototype.getAvailableQuantity = function () {
  return Math.max(0, parseFloat(this.quantity_available) - parseFloat(this.quantity_reserved));
};

ProductStock.prototype.isLowStock = function () {
  if (!this.minimum_stock) return false;
  return parseFloat(this.quantity_available) <= parseFloat(this.minimum_stock);
};

ProductStock.prototype.isOverStock = function () {
  if (!this.maximum_stock) return false;
  return parseFloat(this.quantity_available) >= parseFloat(this.maximum_stock);
};

// Méthodes statiques
ProductStock.findByProduct = function (productId) {
  return this.findAll({
    where: { product_id: productId, is_active: true }
  });
};

ProductStock.findByWarehouse = function (warehouseCode) {
  return this.findAll({
    where: { warehouse_code: warehouseCode, is_active: true }
  });
};

ProductStock.getLowStockItems = function () {
  return this.findAll({
    where: {
      is_active: true,
      quantity_available: {
        [sequelize.Sequelize.Op.lte]: sequelize.Sequelize.col('minimum_stock')
      }
    },
    include: [{
      model: sequelize.models.Product,
      as: 'product'
    }]
  });
};

module.exports = ProductStock;