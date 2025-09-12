'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_clients', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      role: {
        type: Sequelize.ENUM('manager', 'viewer', 'editor'),
        allowNull: false,
        defaultValue: 'viewer',
        comment: 'Rôle de l\'utilisateur pour ce client spécifique'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Utilisateur qui a assigné cette relation'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      last_access: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Dernière fois que l\'utilisateur a accédé aux données de ce client'
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Permissions spécifiques pour ce client (JSON)'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes sur cette assignation'
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

    // Index unique pour éviter les doublons user-client
    await queryInterface.addIndex('user_clients', {
      fields: ['user_id', 'client_id'],
      unique: true,
      name: 'unique_user_client'
    });

    // Index simples pour les requêtes fréquentes
    await queryInterface.addIndex('user_clients', ['user_id']);
    await queryInterface.addIndex('user_clients', ['client_id']);
    await queryInterface.addIndex('user_clients', ['role']);
    await queryInterface.addIndex('user_clients', ['is_active']);
    await queryInterface.addIndex('user_clients', ['assigned_by']);
    await queryInterface.addIndex('user_clients', ['assigned_at']);
    await queryInterface.addIndex('user_clients', ['last_access']);

    // Index composés pour les requêtes complexes
    await queryInterface.addIndex('user_clients', ['user_id', 'is_active']);
    await queryInterface.addIndex('user_clients', ['client_id', 'is_active']);
    await queryInterface.addIndex('user_clients', ['client_id', 'role']);
    await queryInterface.addIndex('user_clients', ['role', 'is_active']);
    await queryInterface.addIndex('user_clients', ['assigned_by', 'assigned_at']);
    await queryInterface.addIndex('user_clients', ['last_access', 'is_active']);

    // Index pour les requêtes de performance
    await queryInterface.addIndex('user_clients', ['user_id', 'client_id', 'is_active']);
    await queryInterface.addIndex('user_clients', ['client_id', 'role', 'is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_clients');
  }
};