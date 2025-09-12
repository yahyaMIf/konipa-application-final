const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configuration du stockage Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// Filtre des types de fichiers autorisés
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé'));
    }
};

// Configuration de Multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter
});

/**
 * @desc    Upload single file
 * @route   POST /api/upload/single
 * @access  Private
 */
const uploadSingle = (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de l\'upload',
                error: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        res.json({
            success: true,
            message: 'Fichier uploadé avec succès',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                path: req.file.path,
                url: `/uploads/${req.file.filename}`
            }
        });
    });
};

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple
 * @access  Private
 */
const uploadMultiple = (req, res) => {
    upload.array('files', 10)(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de l\'upload',
                error: err.message
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: file.path,
            url: `/uploads/${file.filename}`
        }));

        res.json({
            success: true,
            message: 'Fichiers uploadés avec succès',
            data: uploadedFiles
        });
    });
};

/**
 * @desc    Serve file
 * @route   GET /api/upload/serve/:filename
 * @access  Private
 */
const serveFile = (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'Fichier non trouvé'
        });
    }

    res.sendFile(filePath);
};

/**
 * @desc    Delete file
 * @route   DELETE /api/upload/:filename
 * @access  Private
 */
const deleteFile = (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'Fichier non trouvé'
        });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({
            success: true,
            message: 'Fichier supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du fichier',
            error: error.message
        });
    }
};

/**
 * @desc    Get upload stats
 * @route   GET /api/upload/stats
 * @access  Private
 */
const getUploadStats = (req, res) => {
    const uploadPath = path.join(__dirname, '../uploads');

    if (!fs.existsSync(uploadPath)) {
        return res.json({
            success: true,
            data: {
                totalFiles: 0,
                totalSize: 0,
                files: []
            }
        });
    }

    try {
        const files = fs.readdirSync(uploadPath);
        let totalSize = 0;
        const fileStats = [];

        files.forEach(file => {
            const filePath = path.join(uploadPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
                totalSize += stats.size;
                fileStats.push({
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                });
            }
        });

        res.json({
            success: true,
            data: {
                totalFiles: fileStats.length,
                totalSize,
                files: fileStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    serveFile,
    deleteFile,
    getUploadStats,
    upload
};
