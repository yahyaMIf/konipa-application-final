'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      product_ref_sage: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      base_price_ht: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      subcategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true
      },
      barcode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      weight: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true
      },
      dimensions: {
        type: Sequelize.STRING,
        allowNull: true
      },
      unit_of_measure: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'PC'
      },
      vat_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20.00
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      technical_specs: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      minimum_order_qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
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

    // Ajouter des index pour les performances
    await queryInterface.addIndex('products', ['product_ref_sage']);
    await queryInterface.addIndex('products', ['name']);
    await queryInterface.addIndex('products', ['brand']);
    await queryInterface.addIndex('products', ['category']);
    await queryInterface.addIndex('products', ['is_active']);
    await queryInterface.addIndex('products', ['sku']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  }
};