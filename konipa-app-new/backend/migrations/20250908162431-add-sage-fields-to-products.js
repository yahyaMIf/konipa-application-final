'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'sage_product_id', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    
    await queryInterface.addColumn('products', 'is_synced_to_sage', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    
    await queryInterface.addColumn('products', 'sage_sync_date', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('products', 'sage_sync_error', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'sage_product_id');
    await queryInterface.removeColumn('products', 'is_synced_to_sage');
    await queryInterface.removeColumn('products', 'sage_sync_date');
    await queryInterface.removeColumn('products', 'sage_sync_error');
  }
};
