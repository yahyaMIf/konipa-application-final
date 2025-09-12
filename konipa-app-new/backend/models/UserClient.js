const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserClient = sequelize.define('UserClient', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('manager', 'viewer', 'editor'),
    allowNull: false,
    defaultValue: 'viewer',
    comment: 'Rôle de l\'utilisateur pour ce client spécifique'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  assigned_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur qui a assigné cette relation'
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  last_access: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière fois que l\'utilisateur a accédé aux données de ce client'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Permissions spécifiques pour ce client (JSON)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes sur cette assignation'
  }
}, {
  tableName: 'user_clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'client_id'],
      name: 'unique_user_client'
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['assigned_by']
    },
    {
      fields: ['assigned_at']
    },
    {
      fields: ['last_access']
    }
  ]
});

// Méthodes d'instance
UserClient.prototype.activate = function() {
  this.is_active = true;
  return this.save();
};

UserClient.prototype.deactivate = function() {
  this.is_active = false;
  return this.save();
};

UserClient.prototype.updateLastAccess = function() {
  this.last_access = new Date();
  return this.save();
};

UserClient.prototype.updateRole = function(newRole, updatedBy) {
  this.role = newRole;
  this.assigned_by = updatedBy;
  this.assigned_at = new Date();
  return this.save();
};

UserClient.prototype.hasPermission = function(permission) {
  if (!this.permissions) return false;
  return this.permissions.includes(permission);
};

UserClient.prototype.addPermission = function(permission) {
  if (!this.permissions) {
    this.permissions = [];
  }
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
    return this.save();
  }
  return Promise.resolve(this);
};

UserClient.prototype.removePermission = function(permission) {
  if (!this.permissions) return Promise.resolve(this);
  
  const index = this.permissions.indexOf(permission);
  if (index > -1) {
    this.permissions.splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

UserClient.prototype.canManage = function() {
  return this.role === 'manager';
};

UserClient.prototype.canEdit = function() {
  return ['manager', 'editor'].includes(this.role);
};

UserClient.prototype.canView = function() {
  return ['manager', 'editor', 'viewer'].includes(this.role) && this.is_active;
};

// Méthodes de classe
UserClient.findByUser = function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.User,
        as: 'assignedBy'
      }
    ],
    order: [['assigned_at', 'DESC']]
  });
};

UserClient.findByClient = function(clientId) {
  return this.findAll({
    where: {
      client_id: clientId,
      is_active: true
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user'
      },
      {
        model: sequelize.models.User,
        as: 'assignedBy'
      }
    ],
    order: [['role', 'ASC'], ['assigned_at', 'DESC']]
  });
};

UserClient.findByUserAndClient = function(userId, clientId) {
  return this.findOne({
    where: {
      user_id: userId,
      client_id: clientId,
      is_active: true
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.User,
        as: 'user'
      }
    ]
  });
};

UserClient.findManagers = function(clientId) {
  return this.findAll({
    where: {
      client_id: clientId,
      role: 'manager',
      is_active: true
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user'
      }
    ]
  });
};

UserClient.findByRole = function(role) {
  return this.findAll({
    where: {
      role: role,
      is_active: true
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user'
      },
      {
        model: sequelize.models.Client,
        as: 'client'
      }
    ],
    order: [['assigned_at', 'DESC']]
  });
};

UserClient.getInactiveAssignments = function() {
  return this.findAll({
    where: {
      is_active: false
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user'
      },
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.User,
        as: 'assignedBy'
      }
    ],
    order: [['updated_at', 'DESC']]
  });
};

UserClient.getRecentAssignments = function(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  return this.findAll({
    where: {
      assigned_at: {
        [sequelize.Sequelize.Op.gte]: since
      }
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user'
      },
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.User,
        as: 'assignedBy'
      }
    ],
    order: [['assigned_at', 'DESC']]
  });
};

// Associations
UserClient.associate = function(models) {
  UserClient.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  UserClient.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });
  
  UserClient.belongsTo(models.User, {
    foreignKey: 'assigned_by',
    as: 'assignedBy'
  });
};

module.exports = UserClient;