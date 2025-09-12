const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  sage_brand_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
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
  tableName: 'brands',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sage_brand_id']
    },
    {
      fields: ['is_synced_to_sage']
    }
  ]
});

// Méthodes d'instance
Brand.prototype.activate = function() {
  this.is_active = true;
  return this.save();
};

Brand.prototype.deactivate = function() {
  this.is_active = false;
  return this.save();
};

Brand.prototype.updateSageSync = function(success, error = null) {
  this.is_synced_to_sage = success;
  this.sage_sync_date = new Date();
  this.sage_sync_error = error;
  return this.save();
};

// Méthodes de classe
Brand.findActive = function() {
  return this.findAll({
    where: { is_active: true },
    order: [['name', 'ASC']]
  });
};

Brand.findBySageId = function(sageId) {
  return this.findOne({
    where: { sage_brand_id: sageId }
  });
};

Brand.getNeedingSync = function() {
  return this.findAll({
    where: {
      is_synced_to_sage: false,
      is_active: true
    },
    order: [['created_at', 'ASC']]
  });
};

Brand.getWithSyncErrors = function() {
  return this.findAll({
    where: {
      sage_sync_error: {
        [sequelize.Sequelize.Op.ne]: null
      }
    },
    order: [['sage_sync_date', 'DESC']]
  });
};

// Associations
Brand.associate = function(models) {
  // Note: Les produits utilisent un champ string 'brand' au lieu d'une clé étrangère
  // Pas d'association directe définie ici
};

module.exports = Brand;