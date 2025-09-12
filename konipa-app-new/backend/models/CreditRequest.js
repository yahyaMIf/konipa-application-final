const mongoose = require('mongoose');

const creditRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  currentLimit: {
    type: Number,
    required: true,
    default: 0
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  approvedAmount: {
    type: Number,
    default: null
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date,
    default: null
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  adminComments: {
    type: String,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  attachments: [{
    filename: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  history: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    comments: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Index pour améliorer les performances de recherche
creditRequestSchema.index({ clientId: 1, status: 1 });
creditRequestSchema.index({ requestDate: -1 });
creditRequestSchema.index({ status: 1, requestDate: -1 });

// Méthode pour ajouter une entrée à l'historique
creditRequestSchema.methods.addToHistory = function(action, performedBy, comments = '', oldValue = null, newValue = null) {
  this.history.push({
    action,
    performedBy,
    comments,
    oldValue,
    newValue
  });
};

// Méthode pour calculer le délai de traitement
creditRequestSchema.methods.getProcessingTime = function() {
  if (!this.processedDate) return null;
  return Math.ceil((this.processedDate - this.requestDate) / (1000 * 60 * 60 * 24)); // en jours
};

// Méthode statique pour obtenir les statistiques
creditRequestSchema.statics.getStats = async function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.requestDate = {};
    if (startDate) matchStage.requestDate.$gte = new Date(startDate);
    if (endDate) matchStage.requestDate.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRequested: { $sum: '$requestedAmount' },
        avgRequested: { $avg: '$requestedAmount' },
        totalApproved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$approvedAmount', 0]
          }
        }
      }
    }
  ]);
};

// Middleware pour ajouter automatiquement à l'historique lors des modifications
creditRequestSchema.pre('save', function(next) {
  if (this.isNew) {
    this.addToHistory('created', this.requestedBy, 'Demande créée');
  } else if (this.isModified('status')) {
    const action = this.status === 'approved' ? 'approved' : 
                   this.status === 'rejected' ? 'rejected' : 'updated';
    this.addToHistory(action, this.processedBy, this.adminComments || '', 
                     this.getOriginal('status'), this.status);
  }
  next();
});

module.exports = mongoose.model('CreditRequest', creditRequestSchema);