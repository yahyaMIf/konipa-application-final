const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  sage_category_id: {
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
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sage_category_id']
    },
    {
      fields: ['is_synced_to_sage']
    },
    {
      fields: ['sort_order']
    }
  ]
});

// Méthodes d'instance
Category.prototype.activate = function() {
  this.is_active = true;
  return this.save();
};

Category.prototype.deactivate = function() {
  this.is_active = false;
  return this.save();
};

Category.prototype.updateSageSync = function(success, error = null) {
  this.is_synced_to_sage = success;
  this.sage_sync_date = new Date();
  this.sage_sync_error = error;
  return this.save();
};

Category.prototype.getFullPath = async function() {
  let path = [this.name];
  let current = this;
  
  while (current.parent_id) {
    current = await Category.findByPk(current.parent_id);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }
  
  return path.join(' > ');
};

// Méthodes de classe
Category.findActive = function() {
  return this.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

Category.findRootCategories = function() {
  return this.findAll({
    where: {
      parent_id: null,
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

Category.findByParent = function(parentId) {
  return this.findAll({
    where: {
      parent_id: parentId,
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

Category.findBySageId = function(sageId) {
  return this.findOne({
    where: { sage_category_id: sageId }
  });
};

Category.getNeedingSync = function() {
  return this.findAll({
    where: {
      is_synced_to_sage: false,
      is_active: true
    },
    order: [['created_at', 'ASC']]
  });
};

Category.getWithSyncErrors = function() {
  return this.findAll({
    where: {
      sage_sync_error: {
        [sequelize.Sequelize.Op.ne]: null
      }
    },
    order: [['sage_sync_date', 'DESC']]
  });
};

Category.getHierarchy = async function() {
  const categories = await this.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
  
  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat.toJSON(),
        children: buildTree(cat.id)
      }));
  };
  
  return buildTree();
};

// Associations
Category.associate = function(models) {
  // Note: Les produits utilisent un champ string 'category' au lieu d'une clé étrangère
  // Pas d'association directe avec Product définie ici
  
  Category.belongsTo(Category, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  Category.hasMany(Category, {
    foreignKey: 'parent_id',
    as: 'children'
  });
};

module.exports = Category;