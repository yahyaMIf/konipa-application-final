'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('credit_requests', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      client_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      current_limit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      requested_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      approved_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      request_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      processed_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      requested_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      processed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      admin_comments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
        allowNull: false
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      history: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
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
    await queryInterface.addIndex('credit_requests', ['client_id', 'status']);
    await queryInterface.addIndex('credit_requests', ['request_date']);
    await queryInterface.addIndex('credit_requests', ['status', 'request_date']);
    await queryInterface.addIndex('credit_requests', ['requested_by']);
    await queryInterface.addIndex('credit_requests', ['processed_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('credit_requests');
  }
};