'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Renommer quantity_on_order en quantity_ordered
    await queryInterface.renameColumn('product_stocks', 'quantity_on_order', 'quantity_ordered');
    
    // Renommer warehouse_code_sage en warehouse_code
    await queryInterface.renameColumn('product_stocks', 'warehouse_code_sage', 'warehouse_code');
    
    // Supprimer warehouse_name car pas dans le modèle
    await queryInterface.removeColumn('product_stocks', 'warehouse_name');
    
    // Ajouter les colonnes manquantes
    await queryInterface.addColumn('product_stocks', 'cost_price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Prix de revient'
    });
    
    await queryInterface.addColumn('product_stocks', 'location', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Emplacement dans le dépôt'
    });
    
    await queryInterface.addColumn('product_stocks', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    
    await queryInterface.addColumn('product_stocks', 'sage_sync_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date de dernière synchronisation avec Sage'
    });
    
    await queryInterface.addColumn('product_stocks', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Inverser les changements
    await queryInterface.renameColumn('product_stocks', 'quantity_ordered', 'quantity_on_order');
    await queryInterface.renameColumn('product_stocks', 'warehouse_code', 'warehouse_code_sage');
    
    await queryInterface.addColumn('product_stocks', 'warehouse_name', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.removeColumn('product_stocks', 'cost_price');
    await queryInterface.removeColumn('product_stocks', 'location');
    await queryInterface.removeColumn('product_stocks', 'is_active');
    await queryInterface.removeColumn('product_stocks', 'sage_sync_date');
    await queryInterface.removeColumn('product_stocks', 'notes');
  }
};
