const { Brand } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all brands
 * @route   GET /api/brands
 * @access  Private
 */
const getAllBrands = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ]
        } : {};

        const { count, rows: brands } = await Brand.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                brands,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting brands:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des marques',
            error: error.message
        });
    }
};

/**
 * @desc    Get brand by ID
 * @route   GET /api/brands/:id
 * @access  Private
 */
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await Brand.findByPk(id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Marque non trouvée'
            });
        }

        res.json({
            success: true,
            data: brand
        });
    } catch (error) {
        console.error('Error getting brand:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la marque',
            error: error.message
        });
    }
};

/**
 * @desc    Create new brand
 * @route   POST /api/brands
 * @access  Private (Admin only)
 */
const createBrand = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { name, description, logo_url } = req.body;

        const brand = await Brand.create({
            name,
            description,
            logo_url
        });

        res.status(201).json({
            success: true,
            message: 'Marque créée avec succès',
            data: brand
        });
    } catch (error) {
        console.error('Error creating brand:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la marque',
            error: error.message
        });
    }
};

/**
 * @desc    Update brand
 * @route   PUT /api/brands/:id
 * @access  Private (Admin only)
 */
const updateBrand = async (req, res) => {
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
        const { name, description, logo_url } = req.body;

        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Marque non trouvée'
            });
        }

        await brand.update({
            name,
            description,
            logo_url
        });

        res.json({
            success: true,
            message: 'Marque mise à jour avec succès',
            data: brand
        });
    } catch (error) {
        console.error('Error updating brand:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la marque',
            error: error.message
        });
    }
};

/**
 * @desc    Delete brand
 * @route   DELETE /api/brands/:id
 * @access  Private (Admin only)
 */
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Marque non trouvée'
            });
        }

        await brand.destroy();

        res.json({
            success: true,
            message: 'Marque supprimée avec succès'
        });
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la marque',
            error: error.message
        });
    }
};

/**
 * @desc    Get brand products
 * @route   GET /api/brands/:id/products
 * @access  Private
 */
const getBrandProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Marque non trouvée'
            });
        }

        // Pour l'instant, retournons une liste vide
        // TODO: Implémenter la relation avec les produits
        res.json({
            success: true,
            data: {
                products: [],
                pagination: {
                    total: 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: 0
                }
            }
        });
    } catch (error) {
        console.error('Error getting brand products:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits de la marque',
            error: error.message
        });
    }
};

/**
 * @desc    Delete brand logo
 * @route   DELETE /api/brands/:id/logo
 * @access  Private (Admin only)
 */
const deleteBrandLogo = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Marque non trouvée'
            });
        }

        await brand.update({ logo_url: null });

        res.json({
            success: true,
            message: 'Logo supprimé avec succès'
        });
    } catch (error) {
        console.error('Error deleting brand logo:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du logo',
            error: error.message
        });
    }
};

/**
 * @desc    Delete brand banner
 * @route   DELETE /api/brands/:id/banner
 * @access  Private (Admin only)
 */
const deleteBrandBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Marque non trouvée'
            });
        }

        await brand.update({ banner_url: null });

        res.json({
            success: true,
            message: 'Bannière supprimée avec succès'
        });
    } catch (error) {
        console.error('Error deleting brand banner:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la bannière',
            error: error.message
        });
    }
};

module.exports = {
    getAllBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    getBrandProducts,
    deleteBrandLogo,
    deleteBrandBanner
};
