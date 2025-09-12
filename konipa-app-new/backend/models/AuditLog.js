const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'resource'
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'resource_id'
  },
  oldValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'old_values'
  },
  newValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'new_values'
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource']
    },
    {
      fields: ['resource_id']
    },
    {
      fields: ['resource', 'resource_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['ip_address']
    }
  ]
});

// Associations
AuditLog.associate = (models) => {
  // Un log d'audit peut être associé à un utilisateur
  AuditLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

// Méthodes de classe
AuditLog.logAction = async function({
  userId,
  action,
  resource,
  resourceId,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
  metadata = null
}) {
  try {
    return await this.create({
      userId,
      action,
      resource,
      resourceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      metadata
    });
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
    throw error;
  }
};

AuditLog.getByEntity = function(resource, resourceId, options = {}) {
  const whereClause = {
    resource: resource
  };
  if (resourceId) {
    whereClause.resourceId = resourceId;
  }
  return this.findAll({
    where: whereClause,
    include: ['user'],
    order: [['created_at', 'DESC']],
    ...options
  });
};

AuditLog.getByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      userId: userId
    },
    include: ['user'],
    order: [['created_at', 'DESC']],
    ...options
  });
};

AuditLog.getByAction = function(action, options = {}) {
  return this.findAll({
    where: {
      action
    },
    include: ['user'],
    order: [['created_at', 'DESC']],
    ...options
  });
};

AuditLog.getRecent = function(limit = 100) {
  return this.findAll({
    include: ['user'],
    order: [['createdAt', 'DESC']],
    limit
  });
};

AuditLog.getStatistics = async function(startDate, endDate) {
  const { Op } = require('sequelize');
  
  const whereClause = {};
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [startDate, endDate]
    };
  }
  
  const [actionStats, resourceStats, userStats] = await Promise.all([
    // Statistiques par action
    this.findAll({
      where: whereClause,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    }),
    
    // Statistiques par resource
    this.findAll({
      where: whereClause,
      attributes: [
        'resource',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['resource'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    }),
    
    // Statistiques par utilisateur
    this.findAll({
      where: whereClause,
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userId'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['first_name', 'last_name', 'email']
      }]
    })
  ]);
  
  return {
    actions: actionStats,
    resources: resourceStats,
    topUsers: userStats
  };
};

module.exports = AuditLog;