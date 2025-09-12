'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter 'credit_request' à l'ENUM du type de notification
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_notifications_type\" ADD VALUE 'credit_request';"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL ne permet pas de supprimer des valeurs d'ENUM facilement
    // Cette migration ne peut pas être facilement annulée
    console.log('Cannot easily remove ENUM value in PostgreSQL');
  }
};