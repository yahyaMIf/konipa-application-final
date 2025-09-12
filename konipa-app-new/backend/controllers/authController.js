const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const config = require('../config/config');
const { validationResult } = require('express-validator');
const { NotificationService } = require('../services/NotificationService');
const ActivityLogger = require('../services/activityLogger');

// Fonction pour générer les tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

// Login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Chercher l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le statut de l'utilisateur
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Mettre à jour la dernière connexion
    await user.update({ lastLogin: new Date() });

    // Enregistrer l'activité de connexion
    try {
      await ActivityLogger.logUserLogin(user, req.ip, req.get('User-Agent'));
    } catch (logError) {
      console.error('Erreur lors de l\'enregistrement de la connexion:', logError);
      // Ne pas faire échouer la connexion pour une erreur de log
    }

    // Définir les cookies HttpOnly
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    let token = req.cookies?.refresh_token;

    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Refresh token invalide'
        });
      }

      // Vérifier que l'utilisateur existe toujours
      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Utilisateur non trouvé ou désactivé'
        });
      }

      // Générer de nouveaux tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      // Mettre à jour les cookies
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken
      });
    });

  } catch (error) {
    console.error('Erreur lors du refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Enregistrer l'activité de déconnexion si l'utilisateur est authentifié
    if (req.user) {
      try {
        await ActivityLogger.logUserLogout(req.user, req.ip, req.get('User-Agent'));
      } catch (logError) {
        console.error('Erreur lors de l\'enregistrement de la déconnexion:', logError);
        // Ne pas faire échouer la déconnexion pour une erreur de log
      }
    }

    // Supprimer les cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await user.update({
      firstName,
      lastName,
      email
    });

    res.json({
      success: true,
      message: 'Profil mis à jour',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });

    if (user) {
      // Créer une notification pour l'admin
      try {
        const adminUsers = await User.findAll({
          where: { role: 'admin' },
          attributes: ['id', 'email', 'first_name', 'last_name']
        });

        for (const admin of adminUsers) {
          await NotificationService.createNotification({
            userId: admin.id,
            type: 'password_reset_request',
            title: 'Demande de réinitialisation de mot de passe',
            message: `L'utilisateur ${user.first_name} ${user.last_name} (${user.email}) a demandé une réinitialisation de mot de passe. Veuillez le contacter pour lui fournir son code d'accès.`,
            data: {
              requestingUser: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                clientCodeSage: user.client_code_sage
              },
              requestTime: new Date().toISOString()
            },
            priority: 'high'
          });
        }

        console.log(`[AUTH] Demande de réinitialisation de mot de passe pour ${email} - Admin notifié`);
      } catch (notificationError) {
        console.error('Erreur lors de la création de la notification admin:', notificationError);
      }
    }

    // Pour des raisons de sécurité, on retourne toujours success
    res.json({
      success: true,
      message: 'Si cet email existe, l\'administrateur a été notifié de votre demande'
    });

  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Create Password Request
const createPasswordRequest = async (req, res) => {
  try {
    const { identifier, requestType } = req.body;

    // Rechercher l'utilisateur par email ou code client Sage
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { client_code_sage: identifier }
        ]
      }
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'utilisateur existe
      return res.json({
        success: true,
        message: 'Si cet identifiant existe, votre demande a été envoyée aux administrateurs.'
      });
    }

    // Créer une notification pour tous les admins si l'utilisateur existe
    if (user) {
      await NotificationService.notifyByRole('admin', {
        title: 'Nouvelle demande d\'assistance mot de passe',
        message: `${user.first_name || 'Utilisateur'} ${user.last_name || ''} (${user.email}) demande une assistance pour ${requestType === 'view' ? 'voir' : 'changer'} son mot de passe.`,
        type: 'system_alert',
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: `${user.first_name} ${user.last_name}`,
          requestType: requestType,
          timestamp: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: 'Votre demande a été envoyée aux administrateurs. Vous recevrez une réponse prochainement.'
    });

  } catch (error) {
    console.error('Erreur create password request:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Get Password Requests
const getPasswordRequests = async (req, res) => {
  try {
    res.json({
      success: true,
      requests: []
    });

  } catch (error) {
    console.error('Erreur get password requests:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Process Password Request
const processPasswordRequest = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Demande traitée'
    });

  } catch (error) {
    console.error('Erreur process password request:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Register Session
const registerSession = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Session enregistrée'
    });

  } catch (error) {
    console.error('Erreur register session:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Unregister Session
const unregisterSession = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Session supprimée'
    });

  } catch (error) {
    console.error('Erreur unregister session:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  createPasswordRequest,
  getPasswordRequests,
  processPasswordRequest,
  registerSession,
  unregisterSession
};