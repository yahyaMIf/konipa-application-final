'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_stocks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      warehouse_code_sage: {
        type: Sequelize.STRING,
        allowNull: false
      },
      warehouse_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      quantity_available: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      quantity_reserved: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      quantity_on_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      minimum_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      maximum_stock: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      last_inventory_date: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Contrainte unique pour éviter les doublons produit/entrepôt
    await queryInterface.addConstraint('product_stocks', {
      fields: ['product_id', 'warehouse_code_sage'],
      type: 'unique',
      name: 'unique_product_warehouse'
    });

    // Ajouter des index pour les performances
    await queryInterface.addIndex('product_stocks', ['product_id']);
    await queryInterface.addIndex('product_stocks', ['warehouse_code_sage']);
    await queryInterface.addIndex('product_stocks', ['quantity_available']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_stocks');
  }
};