const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'order_created',
      'order_validated',
      'order_rejected',
      'order_approved',
      'order_ready',
      'order_shipped',
      'order_delivered',
      'payment_received',
      'stock_low',
      'client_blocked',
      'credit_limit_exceeded',
      'credit_request',
      'document_generated',
      'system_alert',
      'password_reset_request',
      'user_activated',
      'user_deactivated',
      'user_blocked',
      'user_unblocked'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  related_entity_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  related_entity_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      name: 'notifications_is_read_idx',
      fields: ['is_read']
    },
    {
      fields: ['is_sent']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['related_entity_type', 'related_entity_id']
    }
  ]
});

// Associations
Notification.associate = (models) => {
  // Une notification appartient à un utilisateur
  Notification.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Méthodes d'instance
Notification.prototype.markAsRead = function() {
  this.is_read = true;
  this.read_at = new Date();
  return this.save();
};

Notification.prototype.markAsSent = function() {
  this.is_sent = true;
  this.sent_at = new Date();
  return this.save();
};

// Méthodes de classe
Notification.findUnreadByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      is_read: false
    },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Notification.findByType = function(type, options = {}) {
  return this.findAll({
    where: { type },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Notification.findByPriority = function(priority, options = {}) {
  return this.findAll({
    where: { priority },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Notification.createForUser = async function(userId, notificationData) {
  return this.create({
    user_id: userId,
    ...notificationData
  });
};

Notification.createForMultipleUsers = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    ...notificationData
  }));
  
  return this.bulkCreate(notifications);
};

Notification.cleanupExpired = async function() {
  const now = new Date();
  return this.destroy({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lt]: now
      }
    }
  });
};

module.exports = Notification;