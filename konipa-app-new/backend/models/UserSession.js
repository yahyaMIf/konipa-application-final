const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserSession = sequelize.define('UserSession', {
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
  session_token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['session_token']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['last_activity']
    }
  ]
});

// Associations
UserSession.associate = (models) => {
  // Une session appartient à un utilisateur
  UserSession.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Hooks
UserSession.addHook('beforeUpdate', (session) => {
  session.last_activity = new Date();
});

// Méthodes d'instance
UserSession.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

UserSession.prototype.isValid = function() {
  return this.is_active && !this.isExpired();
};

UserSession.prototype.updateActivity = async function() {
  this.last_activity = new Date();
  return await this.save();
};

UserSession.prototype.deactivate = async function() {
  this.is_active = false;
  return await this.save();
};

// Méthodes de classe
UserSession.createSession = async function(userId, sessionToken, options = {}) {
  console.log('🔄 UserSession.createSession appelée');
  console.log('🔄 userId:', userId);
  console.log('🔄 sessionToken:', sessionToken.substring(0, 20) + '...');
  console.log('🔄 options:', options);
  
  const {
    refreshToken = null,
    ipAddress = null,
    userAgent = null,
    expiresIn = 24 * 60 * 60 * 1000 // 24 heures par défaut
  } = options;
  
  const expiresAt = new Date(Date.now() + expiresIn);
  
  const sessionData = {
    user_id: userId,
    session_token: sessionToken,
    refresh_token: refreshToken,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt
  };
  
  console.log('🔄 Données de session à créer:', sessionData);
  
  try {
    const result = await this.create(sessionData);
    console.log('✅ Session créée avec succès:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la création de session:', error);
    throw error;
  }
};

UserSession.findByToken = function(sessionToken) {
  return this.findOne({
    where: {
      session_token: sessionToken,
      is_active: true
    },
    include: ['user']
  });
};

UserSession.findActiveByUser = function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: {
        [sequelize.Op.gt]: new Date()
      }
    },
    order: [['last_activity', 'DESC']]
  });
};

UserSession.cleanupExpired = async function() {
  const expiredSessions = await this.findAll({
    where: {
      [sequelize.Op.or]: [
        { expires_at: { [sequelize.Op.lt]: new Date() } },
        { is_active: false }
      ]
    }
  });
  
  if (expiredSessions.length > 0) {
    await this.destroy({
      where: {
        id: expiredSessions.map(session => session.id)
      }
    });
  }
  
  return expiredSessions.length;
};

UserSession.deactivateAllForUser = async function(userId, exceptSessionId = null) {
  const whereClause = {
    user_id: userId,
    is_active: true
  };
  
  if (exceptSessionId) {
    whereClause.id = {
      [sequelize.Op.ne]: exceptSessionId
    };
  }
  
  return await this.update(
    { is_active: false },
    { where: whereClause }
  );
};

UserSession.getActiveSessionsCount = async function(userId) {
  return await this.count({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: {
        [sequelize.Op.gt]: new Date()
      }
    }
  });
};

UserSession.getSessionStatistics = async function(startDate, endDate) {
  const { Op } = require('sequelize');
  
  const whereClause = {};
  if (startDate && endDate) {
    whereClause.created_at = {
      [Op.between]: [startDate, endDate]
    };
  }
  
  const [totalSessions, activeSessions, expiredSessions] = await Promise.all([
    this.count({ where: whereClause }),
    this.count({
      where: {
        ...whereClause,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      }
    }),
    this.count({
      where: {
        ...whereClause,
        [Op.or]: [
          { expires_at: { [Op.lt]: new Date() } },
          { is_active: false }
        ]
      }
    })
  ]);
  
  return {
    total: totalSessions,
    active: activeSessions,
    expired: expiredSessions
  };
};

module.exports = UserSession;