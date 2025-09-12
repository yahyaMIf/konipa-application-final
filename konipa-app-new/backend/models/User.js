const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  client_code_sage: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'client', 'representative', 'accounting', 'counter'),
    allowNull: false,
    defaultValue: 'client'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Hooks pour hasher le mot de passe
User.addHook('beforeSave', async (user) => {
  if (user.changed('password_hash')) {
    const saltRounds = 12;
    user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
  }
});

// Associations
User.associate = (models) => {
  // Un utilisateur peut avoir plusieurs clients assignés
  User.belongsToMany(models.Client, {
    through: 'user_clients',
    foreignKey: 'user_id',
    otherKey: 'client_id',
    as: 'assignedClients'
  });
  
  // Un utilisateur peut créer plusieurs commandes
  User.hasMany(models.Order, {
    foreignKey: 'user_id',
    as: 'orders'
  });
  
  // Un utilisateur peut créer plusieurs remises
  User.hasMany(models.PriceOverride, {
    foreignKey: 'created_by',
    as: 'createdPriceOverrides'
  });
  
  // Un utilisateur peut créer plusieurs quotas
  User.hasMany(models.Quota, {
    foreignKey: 'created_by',
    as: 'createdQuotas'
  });
  
  // Un utilisateur peut recevoir plusieurs notifications
  User.hasMany(models.Notification, {
    foreignKey: 'user_id',
    as: 'notifications'
  });
};

// Méthodes d'instance
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.isManager = function() {
  return ['admin', 'manager'].includes(this.role);
};

User.prototype.isSales = function() {
  return ['admin', 'manager', 'sales'].includes(this.role);
};

User.prototype.canAccessClient = async function(clientId) {
  if (this.isManager()) return true;
  
  const assignedClients = await this.getAssignedClients();
  return assignedClients.some(client => client.id === clientId);
};

User.prototype.updateLastLogin = function() {
  return this.update({ last_login: new Date() });
};

User.prototype.resetPassword = async function(newPassword) {
  return this.update({
    password_hash: await bcrypt.hash(newPassword, 10)
  });
};

User.prototype.getPermissions = function() {
  const permissions = {
    canViewAllClients: this.isManager(),
    canCreateClients: this.isManager(),
    canEditClients: this.isManager(),
    canDeleteClients: this.isAdmin(),
    canViewAllOrders: this.isManager(),
    canCreateOrders: this.isSales(),
    canEditOrders: this.isSales(),
    canCancelOrders: this.isManager(),
    canManagePrices: this.isManager(),
    canManageQuotas: this.isManager(),
    canViewReports: this.isSales(),
    canManageUsers: this.isAdmin(),
    canSyncSage: this.isManager(),
    canViewAuditLogs: this.isManager()
  };
  
  return permissions;
};

// Méthodes de classe
User.findByEmail = function(email) {
  return this.findOne({
    where: { email: email.toLowerCase() }
  });
};

// Méthodes Sage supprimées car les colonnes n'existent plus dans la base de données

// Méthodes de recherche par token supprimées car les colonnes n'existent plus

User.getActiveUsers = function() {
  return this.findAll({
    where: { is_active: true },
    order: [['last_name', 'ASC'], ['first_name', 'ASC']]
  });
};

User.getSalesUsers = function() {
  return this.findAll({
    where: {
      role: ['sales', 'manager', 'admin'],
      is_active: true
    },
    order: [['last_name', 'ASC'], ['first_name', 'ASC']]
  });
};

User.getUsersByRole = function(role) {
  return this.findAll({
    where: { role, is_active: true },
    order: [['last_name', 'ASC'], ['first_name', 'ASC']]
  });
};

User.getUsersByTerritory = function(territory) {
  return this.findAll({
    where: {
      territory,
      is_active: true,
      role: ['sales', 'manager']
    },
    order: [['last_name', 'ASC'], ['first_name', 'ASC']]
  });
};

User.getRecentLogins = function(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.findAll({
    where: {
      last_login: {
        [sequelize.Op.gte]: since
      }
    },
    order: [['last_login', 'DESC']]
  });
};

module.exports = User;