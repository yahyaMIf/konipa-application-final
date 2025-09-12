'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quotas', {
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
      product_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Nom de la catégorie pour le quota'
      },
      quota_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Montant du quota en euros'
      },
      quota_quantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        comment: 'Quantité maximale autorisée'
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: false
      },
      used_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
      },
      used_quantity: {
        type: Sequelize.DECIMAL(10, 3),
        defaultValue: 0,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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
      notes: {
        type: Sequelize.TEXT,
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

    // Ajouter les index simples
    await queryInterface.addIndex('quotas', ['client_id']);
    await queryInterface.addIndex('quotas', ['product_id']);
    await queryInterface.addIndex('quotas', ['category_name']);
    await queryInterface.addIndex('quotas', ['is_active']);
    await queryInterface.addIndex('quotas', ['period_start']);
    await queryInterface.addIndex('quotas', ['period_end']);
    await queryInterface.addIndex('quotas', ['created_by']);

    // Index composés pour les requêtes fréquentes
    await queryInterface.addIndex('quotas', ['client_id', 'is_active']);
    await queryInterface.addIndex('quotas', ['client_id', 'period_start', 'period_end']);
    await queryInterface.addIndex('quotas', ['product_id', 'is_active']);
    await queryInterface.addIndex('quotas', ['category_name', 'is_active']);
    await queryInterface.addIndex('quotas', ['period_end', 'is_active']);

    // Index uniques pour éviter les doublons
    await queryInterface.addIndex('quotas', {
      fields: ['client_id', 'product_id', 'period_start'],
      unique: true,
      name: 'unique_client_product_period',
      where: {
        product_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addIndex('quotas', {
      fields: ['client_id', 'category_name', 'period_start'],
      unique: true,
      name: 'unique_client_category_period',
      where: {
        category_name: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // Ajouter les contraintes de validation
    await queryInterface.addConstraint('quotas', {
      fields: ['quota_amount'],
      type: 'check',
      name: 'quotas_quota_amount_positive',
      where: {
        quota_amount: {
          [Sequelize.Op.gte]: 0
        }
      }
    });

    await queryInterface.addConstraint('quotas', {
      fields: ['quota_quantity'],
      type: 'check',
      name: 'quotas_quota_quantity_positive',
      where: {
        [Sequelize.Op.or]: [
          { quota_quantity: null },
          {
            quota_quantity: {
              [Sequelize.Op.gte]: 0
            }
          }
        ]
      }
    });

    await queryInterface.addConstraint('quotas', {
      fields: ['used_amount'],
      type: 'check',
      name: 'quotas_used_amount_positive',
      where: {
        used_amount: {
          [Sequelize.Op.gte]: 0
        }
      }
    });

    await queryInterface.addConstraint('quotas', {
      fields: ['used_quantity'],
      type: 'check',
      name: 'quotas_used_quantity_positive',
      where: {
        used_quantity: {
          [Sequelize.Op.gte]: 0
        }
      }
    });

    await queryInterface.addConstraint('quotas', {
      fields: ['period_start', 'period_end'],
      type: 'check',
      name: 'quotas_period_end_after_start',
      where: {
        period_end: {
          [Sequelize.Op.gt]: Sequelize.col('period_start')
        }
      }
    });

    // Contrainte pour s'assurer qu'un quota est associé soit à un produit soit à une catégorie
    await queryInterface.addConstraint('quotas', {
      fields: ['product_id', 'category_name'],
      type: 'check',
      name: 'quotas_product_or_category',
      where: {
        [Sequelize.Op.or]: [
          {
            [Sequelize.Op.and]: [
              { product_id: { [Sequelize.Op.ne]: null } },
              { category_name: null }
            ]
          },
          {
            [Sequelize.Op.and]: [
              { product_id: null },
              { category_name: { [Sequelize.Op.ne]: null } }
            ]
          }
        ]
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quotas');
  }
};