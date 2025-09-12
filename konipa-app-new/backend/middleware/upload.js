const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, baseName + '-' + uniqueSuffix + extension);
  }
});

// Filtre pour les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  // Types de fichiers autorisés
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'text/plain': true,
    'text/csv': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Types autorisés: images (JPEG, PNG, GIF, WebP), PDF, documents Word/Excel, fichiers texte.'), false);
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Maximum 5 fichiers
  }
});

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximum autorisée: 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers. Maximum autorisé: 5 fichiers'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Champ de fichier inattendu'
      });
    }
  }
  
  if (error.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Erreur lors de l\'upload du fichier'
  });
};

// Middleware pour un seul fichier
const single = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (error) {
        return handleUploadError(error, req, res, next);
      }
      next();
    });
  };
};

// Middleware pour plusieurs fichiers
const multiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (error) => {
      if (error) {
        return handleUploadError(error, req, res, next);
      }
      next();
    });
  };
};

// Middleware pour plusieurs champs de fichiers
const fields = (fieldsConfig) => {
  return (req, res, next) => {
    upload.fields(fieldsConfig)(req, res, (error) => {
      if (error) {
        return handleUploadError(error, req, res, next);
      }
      next();
    });
  };
};

// Fonction utilitaire pour supprimer un fichier
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return false;
  }
};

// Fonction utilitaire pour obtenir l'URL du fichier
const getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

module.exports = {
  upload,
  single,
  multiple,
  fields,
  handleUploadError,
  deleteFile,
  getFileUrl
};