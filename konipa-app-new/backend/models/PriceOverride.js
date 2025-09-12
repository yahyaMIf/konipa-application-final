const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PriceOverride = sequelize.define('PriceOverride', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    },
    comment: 'Si null, la remise s\'applique à la catégorie'
  },
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nom de la catégorie pour remise par catégorie'
  },
  discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Pourcentage de remise (0-100)'
  },
  fixed_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Prix fixe (alternative au pourcentage)'
  },
  minimum_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 1,
    comment: 'Quantité minimum pour bénéficier de la remise'
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Si null, remise permanente'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur qui a créé la remise'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes sur la remise'
  },
  // Champs Sage
  sage_price_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'ID de la remise dans Sage'
  },
  is_synced_to_sage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sage_sync_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sage_sync_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Priorité pour résoudre les conflits
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Plus le nombre est élevé, plus la priorité est haute'
  }
}, {
  tableName: 'price_overrides',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['category_name']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['valid_from']
    },
    {
      fields: ['valid_until']
    },
    {
      fields: ['sage_price_id']
    },
    {
      fields: ['is_synced_to_sage']
    },
    {
      fields: ['priority']
    },
    {
      // Index composé pour optimiser les recherches de remises
      fields: ['client_id', 'product_id', 'is_active']
    },
    {
      fields: ['client_id', 'category_name', 'is_active']
    }
  ],
  validate: {
    // Validation pour s'assurer qu'on a soit product_id soit category_name
    productOrCategory() {
      if (!this.product_id && !this.category_name) {
        throw new Error('Une remise doit être associée soit à un produit soit à une catégorie');
      }
      if (this.product_id && this.category_name) {
        throw new Error('Une remise ne peut pas être associée à la fois à un produit et à une catégorie');
      }
    },
    // Validation pour s'assurer qu'on a soit discount_percent soit fixed_price
    discountOrFixedPrice() {
      if (!this.discount_percent && !this.fixed_price) {
        throw new Error('Une remise doit avoir soit un pourcentage soit un prix fixe');
      }
      if (this.discount_percent && this.fixed_price) {
        throw new Error('Une remise ne peut pas avoir à la fois un pourcentage et un prix fixe');
      }
    },
    // Validation des dates
    validDates() {
      if (this.valid_until && this.valid_from > this.valid_until) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
    }
  }
});

// Associations
PriceOverride.associate = (models) => {
  // Une remise appartient à un client
  PriceOverride.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });
  
  // Une remise peut être associée à un produit
  PriceOverride.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
  
  // Note: category_name est un champ texte, pas une relation
  
  // Une remise est créée par un utilisateur
  PriceOverride.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

// Méthodes d'instance
PriceOverride.prototype.isValid = function(date = new Date()) {
  if (!this.is_active) return false;
  if (this.valid_from > date) return false;
  if (this.valid_until && this.valid_until < date) return false;
  return true;
};

PriceOverride.prototype.calculatePrice = function(basePrice, quantity = 1) {
  if (!this.isValid()) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercent: 0,
      totalPrice: basePrice * quantity
    };
  }
  
  if (quantity < this.minimum_quantity) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercent: 0,
      totalPrice: basePrice * quantity,
      reason: `Quantité minimum requise: ${this.minimum_quantity}`
    };
  }
  
  let finalPrice;
  let discountAmount;
  let discountPercent;
  
  if (this.fixed_price) {
    finalPrice = this.fixed_price;
    discountAmount = basePrice - finalPrice;
    discountPercent = (discountAmount / basePrice) * 100;
  } else {
    discountPercent = this.discount_percent;
    discountAmount = basePrice * (discountPercent / 100);
    finalPrice = basePrice - discountAmount;
  }
  
  return {
    basePrice,
    finalPrice: Math.max(0, finalPrice), // Prix ne peut pas être négatif
    discountAmount,
    discountPercent,
    totalPrice: Math.max(0, finalPrice) * quantity
  };
};

PriceOverride.prototype.getType = function() {
  if (this.product_id) return 'product';
  if (this.category_name) return 'category';
  return 'unknown';
};

PriceOverride.prototype.getDescription = async function() {
  if (this.product_id) {
    const { Product } = require('./index');
    const product = await Product.findByPk(this.product_id);
    return `Remise sur le produit: ${product ? product.name : 'Produit inconnu'}`;
  }
  
  if (this.category_name) {
    return `Remise sur la catégorie: ${this.category_name}`;
  }
  
  return 'Remise inconnue';
};

// Méthodes de classe
PriceOverride.findActiveForClient = function(clientId, date = new Date()) {
  return this.findAll({
    where: {
      client_id: clientId,
      is_active: true,
      valid_from: { [sequelize.Op.lte]: date },
      [sequelize.Op.or]: [
        { valid_until: null },
        { valid_until: { [sequelize.Op.gte]: date } }
      ]
    },
    include: ['product'],
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

PriceOverride.findForProduct = function(clientId, productId, date = new Date()) {
  return this.findOne({
    where: {
      client_id: clientId,
      product_id: productId,
      is_active: true,
      valid_from: { [sequelize.Op.lte]: date },
      [sequelize.Op.or]: [
        { valid_until: null },
        { valid_until: { [sequelize.Op.gte]: date } }
      ]
    },
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

PriceOverride.findForCategory = function(clientId, categoryName, date = new Date()) {
  return this.findOne({
    where: {
      client_id: clientId,
      category_name: categoryName,
      product_id: null,
      is_active: true,
      valid_from: { [sequelize.Op.lte]: date },
      [sequelize.Op.or]: [
        { valid_until: null },
        { valid_until: { [sequelize.Op.gte]: date } }
      ]
    },
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

PriceOverride.getNeedingSync = function() {
  return this.findAll({
    where: {
      is_synced_to_sage: false,
      is_active: true
    },
    include: ['client', 'product']
  });
};

PriceOverride.getExpiring = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.findAll({
    where: {
      is_active: true,
      valid_until: {
        [sequelize.Op.between]: [new Date(), futureDate]
      }
    },
    include: ['client', 'product'],
    order: [['valid_until', 'ASC']]
  });
};

PriceOverride.getBestPriceForProduct = async function(clientId, productId, quantity = 1, date = new Date()) {
  // Chercher d'abord une remise spécifique au produit
  const productOverride = await this.findForProduct(clientId, productId, date);
  if (productOverride && quantity >= productOverride.minimum_quantity) {
    return productOverride;
  }
  
  // Chercher une remise par catégorie
  const { Product } = require('./index');
  const product = await Product.findByPk(productId);
  if (product && product.category_name) {
    const categoryOverride = await this.findForCategory(clientId, product.category_name, date);
    if (categoryOverride && quantity >= categoryOverride.minimum_quantity) {
      return categoryOverride;
    }
  }
  
  return null;
};

module.exports = PriceOverride;