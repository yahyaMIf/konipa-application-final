const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreditRequest = sequelize.define('CreditRequest', {
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
  client_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  current_limit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  requested_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  approved_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 500]
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  request_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  processed_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  requested_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  processed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  admin_comments: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  history: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'credit_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['client_id', 'status']
    },
    {
      fields: ['request_date']
    },
    {
      fields: ['status', 'request_date']
    },
    {
      fields: ['requested_by']
    },
    {
      fields: ['processed_by']
    }
  ]
});

// Associations
CreditRequest.associate = (models) => {
  CreditRequest.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });
  
  CreditRequest.belongsTo(models.User, {
    foreignKey: 'requested_by',
    as: 'requester'
  });
  
  CreditRequest.belongsTo(models.User, {
    foreignKey: 'processed_by',
    as: 'processor'
  });
};

// Méthodes d'instance
CreditRequest.prototype.addToHistory = function(action, performedBy, comments = '', oldValue = null, newValue = null) {
  const historyEntry = {
    action,
    performedBy,
    performedAt: new Date(),
    comments,
    oldValue,
    newValue
  };
  
  if (!this.history) {
    this.history = [];
  }
  this.history.push(historyEntry);
  return this.save();
};

CreditRequest.prototype.getProcessingTime = function() {
  if (!this.processed_date) return null;
  return Math.ceil((this.processed_date - this.request_date) / (1000 * 60 * 60 * 24)); // en jours
};

// Méthodes de classe
CreditRequest.getStats = async function(startDate, endDate) {
  const whereClause = {};
  if (startDate || endDate) {
    whereClause.request_date = {};
    if (startDate) whereClause.request_date[sequelize.Sequelize.Op.gte] = new Date(startDate);
    if (endDate) whereClause.request_date[sequelize.Sequelize.Op.lte] = new Date(endDate);
  }

  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('requested_amount')), 'totalRequested'],
      [sequelize.fn('AVG', sequelize.col('requested_amount')), 'avgRequested'],
      [sequelize.fn('SUM', 
        sequelize.literal("CASE WHEN status = 'approved' THEN approved_amount ELSE 0 END")
      ), 'totalApproved']
    ],
    group: ['status'],
    raw: true
  });

  return stats;
};

// Hook pour ajouter automatiquement à l'historique
CreditRequest.addHook('beforeCreate', (creditRequest, options) => {
  if (!creditRequest.history) {
    creditRequest.history = [];
  }
  creditRequest.history.push({
    action: 'created',
    performedBy: creditRequest.requested_by,
    performedAt: new Date(),
    comments: 'Demande créée'
  });
});

CreditRequest.addHook('beforeUpdate', (creditRequest, options) => {
  if (creditRequest.changed('status')) {
    const action = creditRequest.status === 'approved' ? 'approved' : 
                   creditRequest.status === 'rejected' ? 'rejected' : 'updated';
    
    if (!creditRequest.history) {
      creditRequest.history = [];
    }
    
    creditRequest.history.push({
      action,
      performedBy: creditRequest.processed_by,
      performedAt: new Date(),
      comments: creditRequest.admin_comments || '',
      oldValue: creditRequest._previousDataValues?.status,
      newValue: creditRequest.status
    });
  }
});

module.exports = CreditRequest;