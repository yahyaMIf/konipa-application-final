const { Category } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
const getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ]
        } : {};

        const { count, rows: categories } = await Category.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                categories,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories',
            error: error.message
        });
    }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Private
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error getting category:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la catégorie',
            error: error.message
        });
    }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private (Admin only)
 */
const createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { name, description, icon_url, parent_id } = req.body;

        const category = await Category.create({
            name,
            description,
            icon_url,
            parent_id
        });

        res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la catégorie',
            error: error.message
        });
    }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin only)
 */
const updateCategory = async (req, res) => {
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
        const { name, description, icon_url, parent_id } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        await category.update({
            name,
            description,
            icon_url,
            parent_id
        });

        res.json({
            success: true,
            message: 'Catégorie mise à jour avec succès',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la catégorie',
            error: error.message
        });
    }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin only)
 */
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        await category.destroy();

        res.json({
            success: true,
            message: 'Catégorie supprimée avec succès'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la catégorie',
            error: error.message
        });
    }
};

/**
 * @desc    Get category tree
 * @route   GET /api/categories/tree
 * @access  Private
 */
const getCategoryTree = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;

        const whereClause = includeInactive === 'true' ? {} : { is_active: true };

        const categories = await Category.findAll({
            where: whereClause,
            order: [['parent_id', 'ASC'], ['name', 'ASC']]
        });

        // Construire l'arbre hiérarchique
        const categoryMap = new Map();
        const rootCategories = [];

        // Créer un map de toutes les catégories
        categories.forEach(category => {
            categoryMap.set(category.id, { ...category.toJSON(), children: [] });
        });

        // Construire la hiérarchie
        categories.forEach(category => {
            const categoryData = categoryMap.get(category.id);
            if (category.parent_id) {
                const parent = categoryMap.get(category.parent_id);
                if (parent) {
                    parent.children.push(categoryData);
                }
            } else {
                rootCategories.push(categoryData);
            }
        });

        res.json({
            success: true,
            data: rootCategories
        });
    } catch (error) {
        console.error('Error getting category tree:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'arbre des catégories',
            error: error.message
        });
    }
};

/**
 * @desc    Get category products
 * @route   GET /api/categories/:id/products
 * @access  Private
 */
const getCategoryProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
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
        console.error('Error getting category products:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits de la catégorie',
            error: error.message
        });
    }
};

/**
 * @desc    Move category
 * @route   PUT /api/categories/:id/move
 * @access  Private (Admin only)
 */
const moveCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { parent_id } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        await category.update({ parent_id });

        res.json({
            success: true,
            message: 'Catégorie déplacée avec succès',
            data: category
        });
    } catch (error) {
        console.error('Error moving category:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du déplacement de la catégorie',
            error: error.message
        });
    }
};

/**
 * @desc    Get category children
 * @route   GET /api/categories/:id/children
 * @access  Private
 */
const getCategoryChildren = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        const children = await Category.findAll({
            where: { parent_id: id },
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            data: children
        });
    } catch (error) {
        console.error('Error getting category children:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories enfants',
            error: error.message
        });
    }
};

/**
 * @desc    Get category breadcrumb
 * @route   GET /api/categories/:id/breadcrumb
 * @access  Private
 */
const getCategoryBreadcrumb = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        const breadcrumb = [];
        let currentCategory = category;

        while (currentCategory) {
            breadcrumb.unshift({
                id: currentCategory.id,
                name: currentCategory.name
            });

            if (currentCategory.parent_id) {
                currentCategory = await Category.findByPk(currentCategory.parent_id);
            } else {
                currentCategory = null;
            }
        }

        res.json({
            success: true,
            data: breadcrumb
        });
    } catch (error) {
        console.error('Error getting category breadcrumb:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du fil d\'Ariane',
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryTree,
    getCategoryProducts,
    moveCategory,
    getCategoryChildren,
    getCategoryBreadcrumb
};
