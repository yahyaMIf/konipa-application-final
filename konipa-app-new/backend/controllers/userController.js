const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const XLSX = require('xlsx');
const { NotificationService } = require('../services/NotificationService');
const ActivityLogger = require('../services/activityLogger');

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'created_at', 'updated_at']
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
      message: 'Erreur serveur lors de la récupération du profil'
    });
  }
};

/**
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: userId }
        }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre utilisateur'
        });
      }
    }

    // Mettre à jour l'utilisateur
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email
    });

    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du profil'
    });
  }
};

/**
 * @desc    Changer le mot de passe de l'utilisateur connecté
 * @route   PUT /api/users/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe'
    });
  }
};

/**
 * @desc    Supprimer le compte de l'utilisateur connecté
 * @route   DELETE /api/users/account
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Supprimer l'utilisateur
    await user.destroy();

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du compte'
    });
  }
};

/**
 * @desc    Créer un nouvel utilisateur
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, dateOfBirth, gender, isActive = true } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    // Le mot de passe sera haché par le hook beforeSave du modèle User
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      dateOfBirth,
      gender,
      isActive
    });

    // Enregistrer l'activité de création d'utilisateur
    try {
      await ActivityLogger.logUserCreated(user, req.user, req.ip, req.get('User-Agent'));
    } catch (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
    }

    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'utilisateur'
    });
  }
};

/**
 * @desc    Mettre à jour un utilisateur (pour les admins)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, phone, dateOfBirth, gender, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: id }
        }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre utilisateur'
        });
      }
    }

    // Mettre à jour l'utilisateur
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      role: role || user.role,
      phone: phone || user.phone,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      gender: gender || user.gender,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    // Enregistrer l'activité de modification d'utilisateur
    try {
      await ActivityLogger.logUserUpdated(user, req.user, req.ip, req.get('User-Agent'));
    } catch (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
    }

    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de l\'utilisateur'
    });
  }
};

/**
 * @desc    Supprimer un utilisateur (pour les admins)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de son propre compte
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de l\'utilisateur'
    });
  }
};

/**
 * @desc    Activer un utilisateur (pour les admins)
 * @route   PUT /api/users/:id/activate
 * @access  Private/Admin
 */
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user; // Utilisateur admin qui effectue l'action

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await user.update({ isActive: true });

    // Créer une notification pour les admins
    await NotificationService.notifyUserActivationChange(user, 'activated', adminUser);

    // Enregistrer l'activité de déblocage d'utilisateur
    try {
      await ActivityLogger.logUserStatusChanged(user, 'activated', adminUser, req.ip, req.get('User-Agent'));
    } catch (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
    }

    res.json({
      success: true,
      message: 'Utilisateur activé avec succès',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'activation de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'activation de l\'utilisateur'
    });
  }
};

/**
 * @desc    Désactiver un utilisateur (pour les admins)
 * @route   PUT /api/users/:id/deactivate
 * @access  Private/Admin
 */
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user; // Utilisateur admin qui effectue l'action

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la désactivation de son propre compte
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    await user.update({ isActive: false });

    // Créer une notification pour les admins
    await NotificationService.notifyUserActivationChange(user, 'deactivated', adminUser);

    // Enregistrer l'activité de blocage d'utilisateur
    try {
      await ActivityLogger.logUserStatusChanged(user, 'deactivated', adminUser, req.ip, req.get('User-Agent'));
    } catch (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
    }

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la désactivation de l\'utilisateur'
    });
  }
};

/**
 * @desc    Réinitialiser le mot de passe d'un utilisateur (pour les admins)
 * @route   PUT /api/users/:id/reset-password
 * @access  Private/Admin
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réinitialisation du mot de passe'
    });
  }
};

/**
 * @desc    Supprimer l'avatar de l'utilisateur connecté
 * @route   DELETE /api/users/profile/avatar
 * @access  Private
 */
const deleteUserAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'avatar (remettre à null)
    await user.update({ avatar: null });

    res.json({
      success: true,
      message: 'Avatar supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de l\'avatar'
    });
  }
};

/**
 * @desc    Obtenir les statistiques des utilisateurs
 * @route   GET /api/users/stats/summary
 * @access  Private (Admin/Manager)
 */
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });

    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        recentUsers
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};

/**
 * @desc    Obtenir les utilisateurs par rôle
 * @route   GET /api/users/role/:role
 * @access  Private (Admin)
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Vérifier que le rôle est valide
    const validRoles = ['admin', 'manager', 'employee', 'user', 'ceo'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    const users = await User.findAll({
      where: { role },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs par rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
};

/**
 * @desc    Obtenir les commandes d'un utilisateur
 * @route   GET /api/users/:id/orders
 * @access  Private (Admin/Manager ou propriétaire)
 */
const getUserOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier les permissions
    if (userRole !== 'admin' && userRole !== 'manager' && userId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const whereClause = { userId: id };
    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    // Note: Cette fonction nécessite un modèle Order qui n'existe peut-être pas encore
    // Pour l'instant, on retourne une réponse vide
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
      },
      message: 'Aucune commande trouvée (modèle Order non implémenté)'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des commandes'
    });
  }
};

/**
 * @desc    Changer le statut d'un utilisateur (actif/inactif/bloqué)
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUserId = req.user.id;
    const adminUser = req.user; // Utilisateur admin qui effectue l'action

    // Empêcher la modification de son propre statut
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre statut'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Stocker l'ancien statut pour les notifications
    const oldIsBlocked = user.isBlocked || false;

    // Mapper les statuts vers les champs de la base de données
    let updateData = {};
    switch (status) {
      case 'active':
        updateData = { isActive: true, isBlocked: false };
        break;
      case 'inactive':
        updateData = { isActive: false, isBlocked: false };
        break;
      case 'blocked':
        updateData = { isActive: false, isBlocked: true };
        break;
    }

    await user.update(updateData);

    // Créer des notifications pour les changements de statut de blocage
    const newIsBlocked = updateData.isBlocked || false;
    if (oldIsBlocked !== newIsBlocked) {
      const action = newIsBlocked ? 'blocked' : 'unblocked';
      await NotificationService.notifyUserStatusChange(user, action, adminUser);
    }

    // Enregistrer l'activité de changement de statut
    try {
      await ActivityLogger.logUserStatusChanged(user, status, adminUser, req.ip, req.get('User-Agent'));
    } catch (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
    }

    res.json({
      success: true,
      message: `Statut de l'utilisateur mis à jour vers: ${status}`,
      data: {
        id: user.id,
        email: user.email,
        status: status,
        isActive: updateData.isActive,
        isBlocked: updateData.isBlocked || false
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut'
    });
  }
};

/**
 * @desc    Obtenir la liste des utilisateurs (pour les admins)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    // Construire les conditions de recherche
    const whereConditions = {};

    if (search) {
      whereConditions[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      whereConditions.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereConditions,
      attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'createdAt', 'updatedAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        hasNext: offset + users.length < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
};

/**
 * @desc    Obtenir un utilisateur par ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'createdAt', 'updatedAt']
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
      message: 'Erreur serveur lors de la récupération de l\'utilisateur'
    });
  }
};

/**
 * @desc Exporter les utilisateurs en Excel
 * @route GET /api/users/export
 * @access Private (Admin only)
 */
const exportUsers = async (req, res) => {
  try {
    const { format = 'excel', role, status } = req.query;

    // Construire les conditions de filtrage
    const whereConditions = {};

    if (role) {
      whereConditions.role = role;
    }

    if (status) {
      whereConditions.status = status;
    }

    // Récupérer les utilisateurs
    const users = await User.findAll({
      where: whereConditions,
      attributes: [
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'role',
        'is_active',
        'createdAt',
        'last_login_at'
      ],
      order: [['createdAt', 'DESC']]
    });

    if (format === 'excel') {
      // Créer le workbook Excel
      const wb = XLSX.utils.book_new();

      // Préparer les données pour Excel
      const userData = [
        ['ID', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Date de création', 'Dernière connexion']
      ];

      users.forEach(user => {
        userData.push([
          user.id,
          `${user.first_name} ${user.last_name}`,
          user.email,
          user.phone || 'N/A',
          user.role,
          user.is_active,
          user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A',
          user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR') : 'Jamais'
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(userData);
      XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');

      // Générer le buffer Excel
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Configuration des headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_export_${new Date().toISOString().split('T')[0]}.xlsx"`);

      res.send(excelBuffer);
    } else if (format === 'csv') {
      // Export CSV
      const csvData = [
        'ID,Nom,Email,Téléphone,Rôle,Statut,Date de création,Dernière connexion'
      ];

      users.forEach(user => {
        const row = [
          user.id,
          `"${user.first_name} ${user.last_name}"`,
          user.email,
          user.phone || 'N/A',
          user.role,
          user.is_active,
          user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A',
          user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR') : 'Jamais'
        ];
        csvData.push(row.join(','));
      });

      const csvContent = csvData.join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_export_${new Date().toISOString().split('T')[0]}.csv"`);

      res.send('\uFEFF' + csvContent); // BOM pour UTF-8
    } else {
      return res.status(400).json({
        success: false,
        message: 'Format non supporté. Utilisez "excel" ou "csv"'
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'export des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des utilisateurs'
    });
  }
};

module.exports = {
  getProfile,
  getUserProfile: getProfile, // Alias pour compatibilité
  updateProfile,
  updateUserProfile: updateProfile, // Alias pour compatibilité
  changePassword,
  deleteAccount,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  resetUserPassword,
  deleteUserAvatar,
  getUserStats,
  getUsersByRole,
  getUserOrders,
  updateUserStatus,
  getUsers,
  getAllUsers: getUsers, // Alias pour compatibilité
  getUserById,
  exportUsers
};