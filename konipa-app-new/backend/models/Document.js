const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  document_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  document_type: {
    type: DataTypes.ENUM(
      'quote',
      'order_confirmation',
      'delivery_note',
      'invoice',
      'credit_note',
      'receipt'
    ),
    allowNull: false
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
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
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'draft',
      'sent',
      'viewed',
      'accepted',
      'rejected',
      'paid',
      'cancelled'
    ),
    allowNull: false,
    defaultValue: 'draft'
  },
  document_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_amount_ht: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_vat: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_amount_ttc: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  paid_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  viewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['document_number']
    },
    {
      fields: ['document_type']
    },
    {
      fields: ['order_id']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['status']
    },
    {
      fields: ['document_date']
    },
    {
      fields: ['due_date']
    }
  ]
});

// Associations
Document.associate = (models) => {
  // Un document appartient à un client
  Document.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });
  
  // Un document est créé par un utilisateur
  Document.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  
  // Un document peut être lié à une commande
  Document.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
};

// Méthodes d'instance
Document.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Masquer les informations sensibles si nécessaire
  if (values.metadata && values.metadata.sensitive) {
    delete values.metadata.sensitive;
  }
  
  return values;
};

// Méthodes de classe
Document.findByType = function(type, options = {}) {
  return this.findAll({
    where: { type },
    ...options
  });
};

Document.findByStatus = function(status, options = {}) {
  return this.findAll({
    where: { status },
    ...options
  });
};

Document.findByClient = function(clientId, options = {}) {
  return this.findAll({
    where: { clientId },
    ...options
  });
};

Document.findPending = function(options = {}) {
  return this.findAll({
    where: {
      status: ['draft', 'pending']
    },
    ...options
  });
};

// Hooks
Document.beforeCreate((document, options) => {
  // Générer une référence unique si non fournie
  if (!document.reference) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    document.reference = `DOC-${timestamp}-${random}`;
  }
});

Document.beforeUpdate((document, options) => {
  // Mettre à jour le champ updatedBy si fourni dans les options
  if (options.userId) {
    document.updatedBy = options.userId;
  }
});

module.exports = Document;