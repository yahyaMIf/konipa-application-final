'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('brands', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sage_brand_id: {
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
    await queryInterface.addIndex('brands', ['name']);
    await queryInterface.addIndex('brands', ['is_active']);
    await queryInterface.addIndex('brands', ['sage_brand_id']);
    await queryInterface.addIndex('brands', ['is_synced_to_sage']);
    await queryInterface.addIndex('brands', ['sort_order']);

    // Ajouter les contraintes
    await queryInterface.addConstraint('brands', {
      fields: ['name'],
      type: 'check',
      name: 'brands_name_not_empty',
      where: {
        name: {
          [Sequelize.Op.ne]: ''
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('brands');
  }
};