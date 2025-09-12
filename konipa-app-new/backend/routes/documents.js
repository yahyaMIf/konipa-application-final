const express = require('express');
const router = express.Router();
const { Document, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Op, sequelize } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// Middleware de validation pour les documents
const documentValidation = {
  create: [
    body('title').notEmpty().withMessage('Le titre est requis'),
    body('type').isIn(['invoice', 'quote', 'order', 'delivery', 'contract', 'other'])
      .withMessage('Type de document invalide'),
    body('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'archived'])
      .withMessage('Statut invalide'),
    body('clientId').optional().isInt().withMessage('ID client invalide'),
    body('amount').optional().isDecimal().withMessage('Montant invalide'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Code devise invalide')
  ],
  update: [
    body('title').optional().notEmpty().withMessage('Le titre ne peut pas être vide'),
    body('type').optional().isIn(['invoice', 'quote', 'order', 'delivery', 'contract', 'other'])
      .withMessage('Type de document invalide'),
    body('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'archived'])
      .withMessage('Statut invalide'),
    body('clientId').optional().isInt().withMessage('ID client invalide'),
    body('amount').optional().isDecimal().withMessage('Montant invalide'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Code devise invalide')
  ]
};

// GET /api/documents - Récupérer tous les documents
router.get('/', 
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant', 'commercial', 'ceo']),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        clientId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtres
      if (type) where.type = type;
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { reference: { [Op.like]: `%${search}%` } }
        ];
      }

      // Restriction par rôle
      if (req.user.role === 'client') {
        where.clientId = req.user.id;
      }

      const documents = await Document.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        documents: documents.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: documents.count,
          pages: Math.ceil(documents.count / limit)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/documents/:id - Récupérer un document spécifique
router.get('/:id',
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant', 'commercial', 'ceo']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const document = await Document.findByPk(id, {
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'validator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      if (!document) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      // Vérifier les permissions
      if (req.user.role === 'client' && document.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      res.json(document);
    } catch (error) {
      console.error('Erreur lors de la récupération du document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// POST /api/documents - Créer un nouveau document
router.post('/',
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant', 'commercial', 'ceo']),
  upload.single('file'),
  documentValidation.create,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const documentData = {
        ...req.body,
        createdBy: req.user.id
      };

      // Ajouter les informations du fichier si présent
      if (req.file) {
        documentData.filePath = req.file.path;
        documentData.fileSize = req.file.size;
        documentData.mimeType = req.file.mimetype;
      }

      const document = await Document.create(documentData);

      // Récupérer le document avec les associations
      const createdDocument = await Document.findByPk(document.id, {
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.status(201).json(createdDocument);
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// PUT /api/documents/:id - Mettre à jour un document
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant', 'commercial', 'ceo']),
  upload.single('file'),
  documentValidation.update,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const document = await Document.findByPk(id);

      if (!document) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      // Ajouter les informations du nouveau fichier si présent
      if (req.file) {
        // Supprimer l'ancien fichier si il existe
        if (document.filePath && fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
        }
        
        updateData.filePath = req.file.path;
        updateData.fileSize = req.file.size;
        updateData.mimeType = req.file.mimetype;
      }

      await document.update(updateData, { userId: req.user.id });

      // Récupérer le document mis à jour avec les associations
      const updatedDocument = await Document.findByPk(id, {
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'updater',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.json(updatedDocument);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /api/documents/:id - Supprimer un document
router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const document = await Document.findByPk(id);

      if (!document) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      // Supprimer le fichier physique si il existe
      if (document.filePath && fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      await document.destroy();

      res.json({ message: 'Document supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// POST /api/documents/:id/validate - Valider un document
router.post('/:id/validate',
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant', 'ceo']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status = 'approved' } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Statut de validation invalide' });
      }

      const document = await Document.findByPk(id);

      if (!document) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      await document.update({
        status,
        validatedBy: req.user.id,
        validatedAt: new Date()
      });

      const validatedDocument = await Document.findByPk(id, {
        include: [
          {
            model: User,
            as: 'validator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.json(validatedDocument);
    } catch (error) {
      console.error('Erreur lors de la validation du document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/documents/:id/download - Télécharger un fichier document
router.get('/:id/download',
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant', 'commercial', 'ceo']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const document = await Document.findByPk(id);

      if (!document) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      if (!document.filePath || !fs.existsSync(document.filePath)) {
        return res.status(404).json({ error: 'Fichier non trouvé' });
      }

      // Vérifier les permissions
      if (req.user.role === 'client' && document.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const fileName = path.basename(document.filePath);
      res.download(document.filePath, fileName);
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// GET /api/documents/stats - Statistiques des documents
router.get('/stats',
  authenticateToken,
  requireRole(['admin', 'compta', 'accounting', 'accountant', 'ceo']),
  async (req, res) => {
    try {
      const stats = await Document.findAll({
        attributes: [
          'type',
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type', 'status']
      });

      const totalDocuments = await Document.count();
      const recentDocuments = await Document.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
        }
      });

      res.json({
        total: totalDocuments,
        recent: recentDocuments,
        breakdown: stats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

module.exports = router;