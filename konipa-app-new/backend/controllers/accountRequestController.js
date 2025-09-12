const { AccountRequest, User } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { NotificationService } = require('../services/NotificationService');
const ActivityLogger = require('../services/activityLogger');

/**
 * @desc    Get all account requests
 * @route   GET /api/account-requests
 * @access  Private (Admin only)
 */
const getAllAccountRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, role } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (role) {
            whereClause.requested_role = role;
        }

        const { count, rows: requests } = await AccountRequest.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting account requests:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des demandes de compte',
            error: error.message
        });
    }
};

/**
 * @desc    Get account request by ID
 * @route   GET /api/account-requests/:id
 * @access  Private (Admin only)
 */
const getAccountRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await AccountRequest.findByPk(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de compte non trouvée'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error getting account request:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la demande de compte',
            error: error.message
        });
    }
};

/**
 * @desc    Create account request
 * @route   POST /api/account-requests
 * @access  Public
 */
const createAccountRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { email, requested_role, company, phone, message } = req.body;

        // Vérifier si une demande existe déjà pour cet email
        const existingRequest = await AccountRequest.findOne({
            where: { email, status: { [Op.in]: ['pending', 'approved'] } }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Une demande de compte est déjà en cours pour cet email'
            });
        }

        const request = await AccountRequest.create({
            email,
            requested_role,
            company,
            phone,
            message,
            status: 'pending'
        });

        // Notifier les administrateurs
        await NotificationService.createNotification({
            type: 'account_request',
            title: 'Nouvelle demande de compte',
            message: `Nouvelle demande de compte de ${email} pour le rôle ${requested_role}`,
            recipient_role: 'admin',
            data: { request_id: request.id }
        });

        res.status(201).json({
            success: true,
            message: 'Demande de compte créée avec succès',
            data: request
        });
    } catch (error) {
        console.error('Error creating account request:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la demande de compte',
            error: error.message
        });
    }
};

/**
 * @desc    Process account request
 * @route   PUT /api/account-requests/:id/process
 * @access  Private (Admin only)
 */
const processAccountRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { status, admin_notes } = req.body;
        const adminId = req.user.id;

        const request = await AccountRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de compte non trouvée'
            });
        }

        await request.update({
            status,
            admin_notes,
            processed_by: adminId,
            processed_at: new Date()
        });

        // Notifier l'utilisateur
        await NotificationService.createNotification({
            type: 'account_request_processed',
            title: 'Demande de compte traitée',
            message: `Votre demande de compte a été ${status === 'approved' ? 'approuvée' : 'rejetée'}`,
            recipient_email: request.email,
            data: { request_id: request.id, status }
        });

        // Logger l'activité
        await ActivityLogger.logActivity({
            user_id: adminId,
            action: 'process_account_request',
            details: {
                request_id: id,
                status,
                email: request.email
            }
        });

        res.json({
            success: true,
            message: 'Demande de compte traitée avec succès',
            data: request
        });
    } catch (error) {
        console.error('Error processing account request:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du traitement de la demande de compte',
            error: error.message
        });
    }
};

/**
 * @desc    Delete account request
 * @route   DELETE /api/account-requests/:id
 * @access  Private (Admin only)
 */
const deleteAccountRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await AccountRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de compte non trouvée'
            });
        }

        await request.destroy();

        res.json({
            success: true,
            message: 'Demande de compte supprimée avec succès'
        });
    } catch (error) {
        console.error('Error deleting account request:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la demande de compte',
            error: error.message
        });
    }
};

/**
 * @desc    Approve account request
 * @route   PUT /api/account-requests/:id/approve
 * @access  Private (Admin only)
 */
const approveAccountRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;
        const adminId = req.user.id;

        const request = await AccountRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de compte non trouvée'
            });
        }

        await request.update({
            status: 'approved',
            admin_notes,
            processed_by: adminId,
            processed_at: new Date()
        });

        // Notifier l'utilisateur
        await NotificationService.createNotification({
            type: 'account_request_approved',
            title: 'Demande de compte approuvée',
            message: 'Votre demande de compte a été approuvée. Vous pouvez maintenant vous connecter.',
            recipient_email: request.email,
            data: { request_id: request.id }
        });

        // Logger l'activité
        await ActivityLogger.logActivity({
            user_id: adminId,
            action: 'approve_account_request',
            details: {
                request_id: id,
                email: request.email
            }
        });

        res.json({
            success: true,
            message: 'Demande de compte approuvée avec succès',
            data: request
        });
    } catch (error) {
        console.error('Error approving account request:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'approbation de la demande de compte',
            error: error.message
        });
    }
};

/**
 * @desc    Reject account request
 * @route   PUT /api/account-requests/:id/reject
 * @access  Private (Admin only)
 */
const rejectAccountRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;
        const adminId = req.user.id;

        const request = await AccountRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de compte non trouvée'
            });
        }

        await request.update({
            status: 'rejected',
            admin_notes,
            processed_by: adminId,
            processed_at: new Date()
        });

        // Notifier l'utilisateur
        await NotificationService.createNotification({
            type: 'account_request_rejected',
            title: 'Demande de compte rejetée',
            message: 'Votre demande de compte a été rejetée. Contactez l\'administrateur pour plus d\'informations.',
            recipient_email: request.email,
            data: { request_id: request.id }
        });

        // Logger l'activité
        await ActivityLogger.logActivity({
            user_id: adminId,
            action: 'reject_account_request',
            details: {
                request_id: id,
                email: request.email
            }
        });

        res.json({
            success: true,
            message: 'Demande de compte rejetée avec succès',
            data: request
        });
    } catch (error) {
        console.error('Error rejecting account request:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du rejet de la demande de compte',
            error: error.message
        });
    }
};

module.exports = {
    getAllAccountRequests,
    getAccountRequestById,
    createAccountRequest,
    processAccountRequest,
    deleteAccountRequest,
    approveAccountRequest,
    rejectAccountRequest
};
