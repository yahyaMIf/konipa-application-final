const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Substitute = sequelize.define('Substitute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  original_product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  substitute_product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.ENUM(
      'out_of_stock',
      'discontinued',
      'better_price',
      'better_quality',
      'client_preference',
      'supplier_change',
      'other'
    ),
    allowNull: false,
    defaultValue: 'out_of_stock'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  effective_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'product_substitutes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['original_product_id']
    },
    {
      fields: ['substitute_product_id']
    },
    {
      fields: ['reason']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['effective_date']
    },
    {
      unique: true,
      fields: ['original_product_id', 'substitute_product_id']
    }
  ]
});

// Associations
Substitute.associate = (models) => {
  // Relation avec le produit original
  Substitute.belongsTo(models.Product, {
    foreignKey: 'original_product_id',
    as: 'originalProduct'
  });
  
  // Relation avec le produit de substitution
  Substitute.belongsTo(models.Product, {
    foreignKey: 'substitute_product_id',
    as: 'substituteProduct'
  });
  
  // Relation avec l'utilisateur créateur
  Substitute.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

// Méthodes personnalisées
Substitute.findByProduct = function(productId, options = {}) {
  return this.findAll({
    where: { original_product_id: productId, is_active: true },
    order: [['priority', 'ASC']],
    ...options
  });
};

Substitute.findActiveSubstitutes = function(options = {}) {
  return this.findAll({
    where: { is_active: true },
    order: [['priority', 'ASC'], ['created_at', 'DESC']],
    ...options
  });
};

Substitute.findByReason = function(reason, options = {}) {
  return this.findAll({
    where: { reason, is_active: true },
    order: [['priority', 'ASC']],
    ...options
  });
};

// Hooks
Substitute.beforeCreate((substitute, options) => {
  // Vérifier que le produit original et de substitution sont différents
  if (substitute.original_product_id === substitute.substitute_product_id) {
    throw new Error('Un produit ne peut pas être son propre substitut');
  }
});

Substitute.beforeUpdate((substitute, options) => {
  // Vérifier que le produit original et de substitution sont différents
  if (substitute.original_product_id === substitute.substitute_product_id) {
    throw new Error('Un produit ne peut pas être son propre substitut');
  }
});

module.exports = Substitute;