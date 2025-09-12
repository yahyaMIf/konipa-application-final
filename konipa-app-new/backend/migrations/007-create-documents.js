'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      document_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      document_type: {
        type: Sequelize.ENUM(
          'quote',
          'order_confirmation',
          'delivery_note',
          'invoice',
          'credit_note',
          'receipt'
        ),
        allowNull: false
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM(
          'draft',
          'sent',
          'viewed',
          'accepted',
          'rejected',
          'paid',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'draft'
      },
      document_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      total_amount_ht: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total_vat: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total_amount_ttc: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      paid_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      viewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      paid_at: {
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

    // Ajouter des index pour les performances
    await queryInterface.addIndex('documents', ['document_number']);
    await queryInterface.addIndex('documents', ['document_type']);
    await queryInterface.addIndex('documents', ['order_id']);
    await queryInterface.addIndex('documents', ['client_id']);
    await queryInterface.addIndex('documents', ['created_by']);
    await queryInterface.addIndex('documents', ['status']);
    await queryInterface.addIndex('documents', ['document_date']);
    await queryInterface.addIndex('documents', ['due_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  }
};