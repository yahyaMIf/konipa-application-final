'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sage_category_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      is_synced_to_sage: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      sage_sync_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sage_sync_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Ajouter les index
    await queryInterface.addIndex('categories', ['name']);
    await queryInterface.addIndex('categories', ['parent_id']);
    await queryInterface.addIndex('categories', ['is_active']);
    await queryInterface.addIndex('categories', ['sage_category_id']);
    await queryInterface.addIndex('categories', ['is_synced_to_sage']);
    await queryInterface.addIndex('categories', ['sort_order']);
    
    // Index composé pour la hiérarchie
    await queryInterface.addIndex('categories', ['parent_id', 'sort_order']);
    await queryInterface.addIndex('categories', ['parent_id', 'name']);

    // Ajouter les contraintes
    await queryInterface.addConstraint('categories', {
      fields: ['name'],
      type: 'check',
      name: 'categories_name_not_empty',
      where: {
        name: {
          [Sequelize.Op.ne]: ''
        }
      }
    });

    // Contrainte pour éviter les références circulaires (une catégorie ne peut pas être son propre parent)
    await queryInterface.addConstraint('categories', {
      fields: ['id', 'parent_id'],
      type: 'check',
      name: 'categories_no_self_reference',
      where: {
        [Sequelize.Op.or]: [
          { parent_id: null },
          {
            [Sequelize.Op.not]: {
              id: { [Sequelize.Op.col]: 'parent_id' }
            }
          }
        ]
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('categories');
  }
};