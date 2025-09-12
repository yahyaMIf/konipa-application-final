const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AccountRequest = sequelize.define('AccountRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [2, 100]
    }
  },
  requestedRole: {
    type: DataTypes.ENUM('client', 'commercial', 'admin'),
    allowNull: false,
    defaultValue: 'client'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assignedRole: {
    type: DataTypes.ENUM('client', 'commercial', 'admin'),
    allowNull: true
  },
  creditLimit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  }
}, {
  tableName: 'account_requests',
  timestamps: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['status']
    },
    {
      fields: ['requested_role']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Associations
AccountRequest.associate = function (models) {
  // Association avec User pour processedBy
  AccountRequest.belongsTo(models.User, {
    foreignKey: 'processedBy',
    as: 'processor',
    allowNull: true
  });
};

module.exports = AccountRequest;