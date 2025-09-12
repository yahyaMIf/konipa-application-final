'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer la table quotes
    await queryInterface.createTable('quotes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      quote_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired'),
        allowNull: false,
        defaultValue: 'draft'
      },
      payment_terms: {
        type: Sequelize.ENUM('immediate', 'net_30', 'net_60', 'net_90'),
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Créer la table quote_items
    await queryInterface.createTable('quote_items', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      quote_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'quotes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Ajouter les index
    await queryInterface.addIndex('quotes', ['client_id']);
    await queryInterface.addIndex('quotes', ['status']);
    await queryInterface.addIndex('quotes', ['created_by']);
    await queryInterface.addIndex('quotes', ['createdAt']);
    await queryInterface.addIndex('quote_items', ['quote_id']);
    await queryInterface.addIndex('quote_items', ['product_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quote_items');
    await queryInterface.dropTable('quotes');
  }
};