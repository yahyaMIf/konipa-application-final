const { body, validationResult } = require('express-validator');

// Middleware de validation pour le login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

// Middleware de validation pour l'inscription
const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

// Middleware de validation pour la mise à jour du profil
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
];

// Middleware de validation pour le mot de passe oublié
const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
];

// Middleware de validation pour la réinitialisation du mot de passe
const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }
  next();
};

// Middleware de validation pour les commandes
const validateOrder = [
  body('client_id')
    .isInt({ min: 1 })
    .withMessage('ID client invalide'),
  body('order_date')
    .optional()
    .isISO8601()
    .withMessage('Date de commande invalide'),
  body('status')
    .optional()
    .isIn(['draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Statut invalide'),
  body('total_ht')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total HT invalide'),
  body('total_ttc')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total TTC invalide')
];

// Middleware de validation pour les lignes de commande
const validateOrderItem = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('ID produit invalide'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantité invalide'),
  body('unit_price_ht')
    .isFloat({ min: 0 })
    .withMessage('Prix unitaire HT invalide'),
  body('discount_percent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Pourcentage de remise invalide')
];

module.exports = {
  validateLogin,
  validateRegister,
  validateProfileUpdate,
  validateForgotPassword,
  validateResetPassword,
  validateOrder,
  validateOrderItem,
  handleValidationErrors
};