const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quota = sequelize.define('Quota', {
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
    }
  },
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nom de la catégorie pour le quota'
  },
  quota_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Montant du quota en euros',
    validate: {
      min: 0
    }
  },
  quota_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: 'Quantité maximale autorisée',
    validate: {
      min: 0
    }
  },
  period_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  period_end: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStart(value) {
        if (value <= this.period_start) {
          throw new Error('La date de fin doit être postérieure à la date de début');
        }
      }
    }
  },
  used_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  used_quantity: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
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
  }
}, {
  tableName: 'quotas',
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
      fields: ['period_start']
    },
    {
      fields: ['period_end']
    },
    {
      fields: ['created_by']
    },
    {
      unique: true,
      fields: ['client_id', 'product_id', 'period_start'],
      name: 'unique_client_product_period'
    },
    {
      unique: true,
      fields: ['client_id', 'category_name', 'period_start'],
      name: 'unique_client_category_period'
    }
  ],
  validate: {
    productOrCategory() {
      if (!this.product_id && !this.category_name) {
        throw new Error('Un quota doit être associé soit à un produit soit à une catégorie');
      }
      if (this.product_id && this.category_name) {
        throw new Error('Un quota ne peut pas être associé à la fois à un produit et à une catégorie');
      }
    }
  }
});

// Méthodes d'instance
Quota.prototype.getRemainingAmount = function() {
  return Math.max(0, parseFloat(this.quota_amount) - parseFloat(this.used_amount));
};

Quota.prototype.getRemainingQuantity = function() {
  if (!this.quota_quantity) return null;
  return Math.max(0, parseFloat(this.quota_quantity) - parseFloat(this.used_quantity));
};

Quota.prototype.getUsagePercentage = function() {
  const amountPercentage = (parseFloat(this.used_amount) / parseFloat(this.quota_amount)) * 100;
  
  if (this.quota_quantity) {
    const quantityPercentage = (parseFloat(this.used_quantity) / parseFloat(this.quota_quantity)) * 100;
    return Math.max(amountPercentage, quantityPercentage);
  }
  
  return amountPercentage;
};

Quota.prototype.isExpired = function() {
  return new Date() > this.period_end;
};

Quota.prototype.isValid = function() {
  const now = new Date();
  return this.is_active && now >= this.period_start && now <= this.period_end;
};

Quota.prototype.canUse = function(amount, quantity = null) {
  if (!this.isValid()) return false;
  
  const remainingAmount = this.getRemainingAmount();
  if (amount > remainingAmount) return false;
  
  if (quantity && this.quota_quantity) {
    const remainingQuantity = this.getRemainingQuantity();
    if (quantity > remainingQuantity) return false;
  }
  
  return true;
};

Quota.prototype.useQuota = function(amount, quantity = null) {
  if (!this.canUse(amount, quantity)) {
    throw new Error('Quota insuffisant');
  }
  
  this.used_amount = parseFloat(this.used_amount) + parseFloat(amount);
  if (quantity && this.quota_quantity) {
    this.used_quantity = parseFloat(this.used_quantity) + parseFloat(quantity);
  }
  
  return this.save();
};

Quota.prototype.getType = function() {
  return this.product_id ? 'product' : 'category';
};

Quota.prototype.getDescription = function() {
  const type = this.getType();
  if (type === 'product') {
    return `Quota produit (ID: ${this.product_id})`;
  } else {
    return `Quota catégorie: ${this.category_name}`;
  }
};

// Méthodes de classe
Quota.findActiveForClient = function(clientId) {
  return this.findAll({
    where: {
      client_id: clientId,
      is_active: true,
      period_start: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      period_end: {
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.Product,
        as: 'product',
        required: false
      },
      {
        model: sequelize.models.User,
        as: 'creator'
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

Quota.findForProduct = function(clientId, productId) {
  return this.findOne({
    where: {
      client_id: clientId,
      product_id: productId,
      is_active: true,
      period_start: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      period_end: {
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    }
  });
};

Quota.findForCategory = function(clientId, categoryName) {
  return this.findOne({
    where: {
      client_id: clientId,
      category_name: categoryName,
      is_active: true,
      period_start: {
        [sequelize.Sequelize.Op.lte]: new Date()
      },
      period_end: {
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    }
  });
};

Quota.getExpiring = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.findAll({
    where: {
      is_active: true,
      period_end: {
        [sequelize.Sequelize.Op.between]: [new Date(), futureDate]
      }
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.Product,
        as: 'product',
        required: false
      }
    ],
    order: [['period_end', 'ASC']]
  });
};

Quota.getOverused = function() {
  return this.findAll({
    where: {
      is_active: true,
      [sequelize.Sequelize.Op.or]: [
        {
          used_amount: {
            [sequelize.Sequelize.Op.gt]: sequelize.col('quota_amount')
          }
        },
        {
          used_quantity: {
            [sequelize.Sequelize.Op.gt]: sequelize.col('quota_quantity')
          }
        }
      ]
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.Product,
        as: 'product',
        required: false
      }
    ]
  });
};

// Associations
Quota.associate = function(models) {
  Quota.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });
  
  Quota.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
  
  Quota.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = Quota;