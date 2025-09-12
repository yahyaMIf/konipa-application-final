const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.STRING,
    allowNull: true
  },

  base_price_ht: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subcategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vat_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 20.00
  },
  weight: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true
  },
  unit_of_measure: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'PC'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  technical_specs: {
    type: DataTypes.JSON,
    allowNull: true
  },
  minimum_order_qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  product_ref_sage: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  sage_product_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  is_synced_to_sage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  sage_sync_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sage_sync_error: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['product_ref_sage']
    },
    {
      fields: ['name']
    },
    {
      fields: ['brand']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sku']
    },

    {
      fields: ['is_synced_to_sage']
    }
  ]
});

// Associations
Product.associate = (models) => {
  // Un produit peut avoir plusieurs stocks par entrepôt
  Product.hasMany(models.ProductStock, {
    foreignKey: 'product_id',
    as: 'stocks'
  });
  
  // Note: Les relations avec Category et Brand sont gérées via les champs string
  // car la table products utilise des champs texte au lieu de clés étrangères
  
  // Un produit peut avoir plusieurs remises personnalisées
  Product.hasMany(models.PriceOverride, {
    foreignKey: 'product_id',
    as: 'priceOverrides'
  });
  
  // Un produit peut avoir plusieurs quotas
  Product.hasMany(models.Quota, {
    foreignKey: 'product_id',
    as: 'quotas'
  });
  
  // Un produit peut être dans plusieurs lignes de commande
  Product.hasMany(models.OrderItem, {
    foreignKey: 'product_id',
    as: 'orderItems'
  });
};

// Méthodes d'instance
Product.prototype.getPriceForClient = async function(clientId, quantity = 1) {
  const { PriceOverride } = require('./index');
  
  // Chercher une remise spécifique pour ce client et ce produit
  const specificOverride = await PriceOverride.findOne({
    where: {
      client_id: clientId,
      product_id: this.id,
      is_active: true,
      valid_from: { [sequelize.Op.lte]: new Date() },
      [sequelize.Op.or]: [
        { valid_until: null },
        { valid_until: { [sequelize.Op.gte]: new Date() } }
      ]
    },
    order: [['created_at', 'DESC']]
  });
  
  if (specificOverride) {
    const discountAmount = this.base_price_ht * (specificOverride.discount_percent / 100);
    return {
      basePrice: this.base_price_ht,
      discountPercent: specificOverride.discount_percent,
      discountAmount,
      finalPrice: this.base_price_ht - discountAmount,
      totalPrice: (this.base_price_ht - discountAmount) * quantity
    };
  }
  
  // Chercher une remise par catégorie
  if (this.category) {
    const categoryOverride = await PriceOverride.findOne({
      where: {
        client_id: clientId,
        category: this.category,
        product_id: null,
        is_active: true,
        valid_from: { [sequelize.Op.lte]: new Date() },
        [sequelize.Op.or]: [
          { valid_until: null },
          { valid_until: { [sequelize.Op.gte]: new Date() } }
        ]
      },
      order: [['created_at', 'DESC']]
    });
    
    if (categoryOverride) {
      const discountAmount = this.base_price_ht * (categoryOverride.discount_percent / 100);
      return {
        basePrice: this.base_price_ht,
        discountPercent: categoryOverride.discount_percent,
        discountAmount,
        finalPrice: this.base_price_ht - discountAmount,
        totalPrice: (this.base_price_ht - discountAmount) * quantity
      };
    }
  }
  
  // Pas de remise, prix de base
  return {
    basePrice: this.base_price_ht,
    discountPercent: 0,
    discountAmount: 0,
    finalPrice: this.base_price_ht,
    totalPrice: this.base_price_ht * quantity
  };
};

Product.prototype.getAvailableStock = async function(warehouseCode = null) {
  const { ProductStock } = require('./index');
  
  const whereClause = { product_id: this.id };
  if (warehouseCode) {
    whereClause.warehouse_code_sage = warehouseCode;
  }
  
  const stocks = await ProductStock.findAll({
    where: whereClause
  });
  
  if (warehouseCode) {
    const stock = stocks[0];
    return stock ? stock.quantity_available - stock.quantity_reserved : 0;
  }
  
  return stocks.reduce((total, stock) => {
    return total + (stock.quantity_available - stock.quantity_reserved);
  }, 0);
};



// Méthodes de classe
Product.findBySageRef = function(sageRef) {
  return this.findOne({
    where: { product_ref_sage: sageRef }
  });
};

Product.findBySageId = function(sageId) {
  return this.findOne({
    where: { sage_id: sageId }
  });
};

Product.findByBarcode = function(barcode) {
  return this.findOne({
    where: { barcode }
  });
};

Product.getNeedingSync = function(hoursThreshold = 24) {
  const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        { last_sync_sage: null },
        { last_sync_sage: { [sequelize.Op.lt]: thresholdDate } }
      ]
    }
  });
};

Product.getActiveProducts = function() {
  return this.findAll({
    where: { is_active: true },
    order: [['name', 'ASC']]
  });
};

Product.searchProducts = function(searchTerm, limit = 50) {
  return this.findAll({
    where: {
      is_active: true,
      [sequelize.Op.or]: [
        { name: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { description: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { product_ref_sage: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { barcode: { [sequelize.Op.iLike]: `%${searchTerm}%` } }
      ]
    },
    limit,
    order: [['name', 'ASC']]
  });
};

module.exports = Product;