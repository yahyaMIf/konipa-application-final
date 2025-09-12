'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('price_overrides', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      product_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Si null, la remise s\'applique à la catégorie'
      },
      category_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Nom de la catégorie pour remise par catégorie'
      },
      discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Pourcentage de remise (0-100)'
      },
      fixed_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Prix fixe (alternative au pourcentage)'
      },
      minimum_quantity: {
        type: Sequelize.DECIMAL(10, 3),
        defaultValue: 1,
        comment: 'Quantité minimum pour bénéficier de la remise'
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Si null, remise permanente'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Utilisateur qui a créé la remise'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes sur la remise'
      },
      sage_price_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'ID de la remise dans Sage'
      },
      is_synced_to_sage: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sage_sync_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sage_sync_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Plus le nombre est élevé, plus la priorité est haute'
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
    await queryInterface.addIndex('price_overrides', ['client_id']);
    await queryInterface.addIndex('price_overrides', ['product_id']);
    await queryInterface.addIndex('price_overrides', ['category_name']);
    await queryInterface.addIndex('price_overrides', ['is_active']);
    await queryInterface.addIndex('price_overrides', ['valid_from']);
    await queryInterface.addIndex('price_overrides', ['valid_until']);
    await queryInterface.addIndex('price_overrides', ['sage_price_id']);
    await queryInterface.addIndex('price_overrides', ['is_synced_to_sage']);
    await queryInterface.addIndex('price_overrides', ['priority']);
    
    // Index composés pour optimiser les recherches de remises
    await queryInterface.addIndex('price_overrides', ['client_id', 'product_id', 'is_active']);
    await queryInterface.addIndex('price_overrides', ['client_id', 'category_name', 'is_active']);
    
    // Contraintes de validation
    await queryInterface.addConstraint('price_overrides', {
      fields: ['discount_percent'],
      type: 'check',
      name: 'price_overrides_discount_percent_check',
      where: {
        discount_percent: {
          [Sequelize.Op.between]: [0, 100]
        }
      }
    });
    
    await queryInterface.addConstraint('price_overrides', {
      fields: ['fixed_price'],
      type: 'check',
      name: 'price_overrides_fixed_price_check',
      where: {
        fixed_price: {
          [Sequelize.Op.gte]: 0
        }
      }
    });
    
    await queryInterface.addConstraint('price_overrides', {
      fields: ['minimum_quantity'],
      type: 'check',
      name: 'price_overrides_minimum_quantity_check',
      where: {
        minimum_quantity: {
          [Sequelize.Op.gt]: 0
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('price_overrides');
  }
};