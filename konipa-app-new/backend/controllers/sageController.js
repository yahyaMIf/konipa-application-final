const { Client, Product, Order, OrderItem } = require('../models');
const { SageApiService } = require('../services/SageApiService');
const { MockSageApiService } = require('../services/MockSageApiService');
const AuditService = require('../services/AuditService');
const NotificationService = require('../services/NotificationService');
const { sequelize } = require('../config/database');
const config = require('../config/config');

// Utiliser le service mock ou réel selon la configuration
const sageService = config.USE_SAGE_MOCK ? new MockSageApiService() : new SageApiService();

/**
 * Synchroniser les clients depuis Sage
 */
const syncClients = async (req, res) => {
  try {
    console.log('🔄 Début de la synchronisation des clients...');

    // Récupérer les clients depuis Sage
    const sageClients = await sageService.getClients();

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const sageClient of sageClients) {
      try {
        const [client, wasCreated] = await Client.upsert({
          id: sageClient.id,
          company_name: sageClient.company_name || sageClient.name,
          email: sageClient.email,
          phone: sageClient.phone,
          address_line1: sageClient.address_line1 || sageClient.address,
          city: sageClient.city,
          postal_code: sageClient.postal_code,
          country: sageClient.country,
          client_code_sage: sageClient.client_code_sage || sageClient.sage_code,
          sage_id: sageClient.sage_id,
          sage_sync_date: new Date()
        });

        if (wasCreated) {
          created++;
          await AuditService.log({
            entity_type: 'client',
            entity_id: client.id,
            action: 'created_from_sage',
            user_id: req.user.id,
            new_values: client.toJSON()
          });
        } else {
          updated++;
          await AuditService.log({
            entity_type: 'client',
            entity_id: client.id,
            action: 'updated_from_sage',
            user_id: req.user.id,
            new_values: client.toJSON()
          });
        }
      } catch (error) {
        console.error(`Erreur lors de la synchronisation du client ${sageClient.sage_id}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      message: `Synchronisation des clients terminée`,
      stats: {
        total: sageClients.length,
        created,
        updated,
        errors
      },
      timestamp: new Date()
    };

    console.log('✅ Synchronisation des clients terminée:', result.stats);

    // Notification de fin de synchronisation
    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_completed',
      channel: 'push',
      message: `Synchronisation clients: ${created} créés, ${updated} mis à jour, ${errors} erreurs`
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des clients:', error);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_failed',
      channel: 'push',
      message: `Échec de la synchronisation des clients: ${error.message}`
    });

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des clients',
      details: error.message
    });
  }
};

/**
 * Synchroniser les produits depuis Sage
 */
const syncProducts = async (req, res) => {
  try {
    console.log('🔄 Début de la synchronisation des produits...');

    const sageProducts = await sageService.getProducts();

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const sageProduct of sageProducts) {
      try {
        const [product, wasCreated] = await Product.upsert({
          id: sageProduct.id,
          name: sageProduct.name,
          sku: sageProduct.sku,
          description: sageProduct.description,
          base_price_ht: sageProduct.price,
          vat_rate: sageProduct.vat_rate,
          brand: sageProduct.brand,
          category: sageProduct.category,
          product_ref_sage: sageProduct.product_ref_sage || sageProduct.sage_code,
          sage_product_id: sageProduct.sage_product_id || sageProduct.sage_id,
          sage_sync_date: new Date()
        });

        if (wasCreated) {
          created++;
          await AuditService.log({
            entity_type: 'product',
            entity_id: product.id,
            action: 'created_from_sage',
            user_id: req.user.id,
            new_values: product.toJSON()
          });
        } else {
          updated++;
          await AuditService.log({
            entity_type: 'product',
            entity_id: product.id,
            action: 'updated_from_sage',
            user_id: req.user.id,
            new_values: product.toJSON()
          });
        }
      } catch (error) {
        console.error(`Erreur lors de la synchronisation du produit ${sageProduct.sage_id}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      message: `Synchronisation des produits terminée`,
      stats: {
        total: sageProducts.length,
        created,
        updated,
        errors
      },
      timestamp: new Date()
    };

    console.log('✅ Synchronisation des produits terminée:', result.stats);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_completed',
      channel: 'push',
      message: `Synchronisation produits: ${created} créés, ${updated} mis à jour, ${errors} erreurs`
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des produits:', error);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_failed',
      channel: 'push',
      message: `Échec de la synchronisation des produits: ${error.message}`
    });

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des produits',
      details: error.message
    });
  }
};

/**
 * Synchroniser les commandes vers Sage
 */
const syncOrders = async (req, res) => {
  try {
    console.log('🔄 Début de la synchronisation des commandes...');

    // Récupérer les commandes non synchronisées
    const orders = await Order.findAll({
      where: {
        sage_id: null // Commandes pas encore envoyées à Sage
      },
      include: [{
        model: OrderItem,
        include: [Product]
      }, Client]
    });

    let synced = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        // Envoyer la commande à Sage
        const sageOrder = await sageService.createOrder({
          client_id: order.Client.sage_id,
          order_date: order.created_at,
          items: order.orderItems.map(item => ({
            product_id: item.Product.sage_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        });

        // Mettre à jour la commande avec l'ID Sage
        await order.update({
          sage_id: sageOrder.id,
          sage_last_sync: new Date()
        });

        synced++;

        await AuditService.log({
          entity_type: 'order',
          entity_id: order.id,
          action: 'synced_to_sage',
          user_id: req.user.id,
          new_values: { sage_id: sageOrder.id }
        });

      } catch (error) {
        console.error(`Erreur lors de la synchronisation de la commande ${order.id}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      message: 'Synchronisation des commandes terminée',
      stats: {
        total: orders.length,
        synced,
        errors
      },
      timestamp: new Date()
    };

    console.log('✅ Synchronisation des commandes terminée:', result.stats);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_completed',
      channel: 'push',
      message: `Synchronisation commandes: ${synced} envoyées, ${errors} erreurs`
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des commandes:', error);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_failed',
      channel: 'push',
      message: `Échec de la synchronisation des commandes: ${error.message}`
    });

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des commandes',
      details: error.message
    });
  }
};

/**
 * Synchroniser les prix et remises depuis Sage
 */
const syncPrices = async (req, res) => {
  try {
    console.log('🔄 Début de la synchronisation des prix...');

    // Récupérer les prix depuis Sage
    const sagePrices = await sageService.getPrices();

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const priceData of sagePrices) {
      try {
        const [priceOverride, wasCreated] = await PriceOverride.upsert({
          sage_price_id: priceData.sage_id,
          client_id: priceData.client_id,
          product_id: priceData.product_id || null,
          category_name: priceData.category_name || null,
          discount_percent: priceData.discount_percentage || null,
          fixed_price: priceData.fixed_price || null,
          minimum_quantity: priceData.minimum_quantity || 1,
          valid_from: priceData.valid_from,
          valid_until: priceData.valid_until || null,
          is_active: priceData.is_active,
          created_by: req.user.id, // Assuming the user performing sync is the creator
          sage_sync_date: new Date(),
          is_synced_to_sage: true
        });

        if (wasCreated) {
          created++;
          await AuditService.log({
            entity_type: 'price_override',
            entity_id: priceOverride.id,
            action: 'created_from_sage',
            user_id: req.user.id,
            new_values: priceOverride.toJSON()
          });
        } else {
          updated++;
          await AuditService.log({
            entity_type: 'price_override',
            entity_id: priceOverride.id,
            action: 'updated_from_sage',
            user_id: req.user.id,
            new_values: priceOverride.toJSON()
          });
        }

      } catch (error) {
        console.error(`Erreur lors de la synchronisation du prix ${priceData.sage_id}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      message: 'Synchronisation des prix terminée',
      stats: {
        total: sagePrices.length,
        created,
        updated,
        errors
      },
      timestamp: new Date()
    };

    console.log('✅ Synchronisation des prix terminée:', result.stats);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_completed',
      channel: 'push',
      message: `Synchronisation prix: ${created} créés, ${errors} erreurs`
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des prix:', error);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_failed',
      channel: 'push',
      message: `Échec de la synchronisation des prix: ${error.message}`
    });

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des prix',
      details: error.message
    });
  }
};

/**
 * Obtenir le statut de la dernière synchronisation
 */
const getLastSyncStatus = async (req, res) => {
  try {
    // Récupérer les dernières synchronisations depuis les logs d'audit
    const lastSyncs = await AuditService.getRecentLogs(10, 'synced_to_sage');

    // Compter les entités par type
    const stats = {
      clients: await Client.count({ where: { sage_last_sync: { [sequelize.Op.not]: null } } }),
      products: await Product.count({ where: { sage_last_sync: { [sequelize.Op.not]: null } } }),
      orders: await Order.count({ where: { sage_last_sync: { [sequelize.Op.not]: null } } })
    };

    res.json({
      success: true,
      lastSyncs,
      stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut de synchronisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du statut',
      details: error.message
    });
  }
};

/**
 * Synchronisation complète forcée
 */
const forceSyncAll = async (req, res) => {
  try {
    console.log('🔄 Début de la synchronisation complète...');

    const results = {
      clients: null,
      products: null,
      orders: null,
      prices: null
    };

    // Synchroniser les clients
    try {
      const clientsResult = await syncClientsInternal(req.user.id);
      results.clients = clientsResult;
    } catch (error) {
      results.clients = { success: false, error: error.message };
    }

    // Synchroniser les produits
    try {
      const productsResult = await syncProductsInternal(req.user.id);
      results.products = productsResult;
    } catch (error) {
      results.products = { success: false, error: error.message };
    }

    // Synchroniser les commandes
    try {
      const ordersResult = await syncOrdersInternal(req.user.id);
      results.orders = ordersResult;
    } catch (error) {
      results.orders = { success: false, error: error.message };
    }

    // Synchroniser les prix
    try {
      const pricesResult = await syncPricesInternal(req.user.id);
      results.prices = pricesResult;
    } catch (error) {
      results.prices = { success: false, error: error.message };
    }

    console.log('✅ Synchronisation complète terminée');

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_completed',
      channel: 'push',
      message: 'Synchronisation complète terminée',
      metadata: results
    });

    res.json({
      success: true,
      message: 'Synchronisation complète terminée',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation complète:', error);

    await NotificationService.notify({
      user_id: req.user.id,
      type: 'sync_failed',
      channel: 'push',
      message: `Échec de la synchronisation complète: ${error.message}`
    });

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation complète',
      details: error.message
    });
  }
};

// Fonctions internes pour la synchronisation complète
const syncClientsInternal = async (userId) => {
  const sageClients = await sageService.getClients();
  let created = 0, updated = 0, errors = 0;

  for (const sageClient of sageClients) {
    try {
      const [client, wasCreated] = await Client.upsert({
        id: sageClient.id,
        company_name: sageClient.company_name || sageClient.name,
        email: sageClient.email,
        phone: sageClient.phone,
        address_line1: sageClient.address_line1 || sageClient.address,
        city: sageClient.city,
        postal_code: sageClient.postal_code,
        country: sageClient.country,
        client_code_sage: sageClient.client_code_sage || sageClient.sage_code,
        sage_id: sageClient.sage_id,
        sage_sync_date: new Date()
      });

      if (wasCreated) {
        created++;
        await AuditService.log({
          entity_type: 'client',
          entity_id: client.id,
          action: 'created_from_sage',
          user_id: userId,
          new_values: client.toJSON()
        });
      } else {
        updated++;
        await AuditService.log({
          entity_type: 'client',
          entity_id: client.id,
          action: 'updated_from_sage',
          user_id: userId,
          new_values: client.toJSON()
        });
      }
    } catch (error) {
      errors++;
      console.error(`Erreur lors de la synchronisation interne du client ${sageClient.sage_id}:`, error);
    }
  }

  return { success: true, stats: { total: sageClients.length, created, updated, errors } };
};

const syncProductsInternal = async (userId) => {
  const sageProducts = await sageService.getProducts();
  let created = 0, updated = 0, errors = 0;

  for (const sageProduct of sageProducts) {
    try {
      const [product, wasCreated] = await Product.upsert({
        id: sageProduct.id,
        name: sageProduct.name,
        sku: sageProduct.sku,
        description: sageProduct.description,
        base_price_ht: sageProduct.price,
        vat_rate: sageProduct.vat_rate,
        brand: sageProduct.brand,
        category: sageProduct.category,
        product_ref_sage: sageProduct.product_ref_sage || sageProduct.sage_code,
        sage_product_id: sageProduct.sage_product_id || sageProduct.sage_id,
        sage_sync_date: new Date()
      });

      if (wasCreated) {
        created++;
        await AuditService.log({
          entity_type: 'product',
          entity_id: product.id,
          action: 'created_from_sage',
          user_id: userId,
          new_values: product.toJSON()
        });
      } else {
        updated++;
        await AuditService.log({
          entity_type: 'product',
          entity_id: product.id,
          action: 'updated_from_sage',
          user_id: userId,
          new_values: product.toJSON()
        });
      }
    } catch (error) {
      errors++;
      console.error(`Erreur lors de la synchronisation interne du produit ${sageProduct.sage_id}:`, error);
    }
  }

  return { success: true, stats: { total: sageProducts.length, created, updated, errors } };
};

const syncOrdersInternal = async (userId) => {
  const orders = await Order.findAll({
    where: {
      sage_id: null // Commandes pas encore envoyées à Sage
    },
    include: [{
      model: OrderItem,
      include: [Product]
    }, Client]
  });

  let synced = 0;
  let errors = 0;

  for (const order of orders) {
    try {
      // Envoyer la commande à Sage
      const sageOrder = await sageService.createOrder({
        client_id: order.Client.sage_id,
        order_date: order.created_at,
        items: order.orderItems.map(item => ({
          product_id: item.Product.sage_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      });

      // Mettre à jour la commande avec l'ID Sage
      await order.update({
        sage_id: sageOrder.id,
        sage_last_sync: new Date()
      });

      synced++;

      await AuditService.log({
        entity_type: 'order',
        entity_id: order.id,
        action: 'synced_to_sage',
        user_id: userId,
        new_values: { sage_id: sageOrder.id }
      });

    } catch (error) {
      console.error(`Erreur lors de la synchronisation interne de la commande ${order.id}:`, error);
      errors++;
    }
  }

  return { success: true, stats: { total: orders.length, synced, errors } };
};

const syncPricesInternal = async (userId) => {
  const sagePrices = await sageService.getPrices();
  let created = 0, updated = 0, errors = 0;

  for (const priceData of sagePrices) {
    try {
      const [priceOverride, wasCreated] = await PriceOverride.upsert({
        sage_price_id: priceData.sage_id,
        client_id: priceData.client_id,
        product_id: priceData.product_id || null,
        category_name: priceData.category_name || null,
        discount_percent: priceData.discount_percentage || null,
        fixed_price: priceData.fixed_price || null,
        minimum_quantity: priceData.minimum_quantity || 1,
        valid_from: priceData.valid_from,
        valid_until: priceData.valid_until || null,
        is_active: priceData.is_active,
        created_by: userId, // Use the provided userId
        sage_sync_date: new Date(),
        is_synced_to_sage: true
      });

      if (wasCreated) {
        created++;
        await AuditService.log({
          entity_type: 'price_override',
          entity_id: priceOverride.id,
          action: 'created_from_sage',
          user_id: userId,
          new_values: priceOverride.toJSON()
        });
      } else {
        updated++;
        await AuditService.log({
          entity_type: 'price_override',
          entity_id: priceOverride.id,
          action: 'updated_from_sage',
          user_id: userId,
          new_values: priceOverride.toJSON()
        });
      }

    } catch (error) {
      console.error(`Erreur lors de la synchronisation interne du prix ${priceData.sage_id}:`, error);
      errors++;
    }
  }

  return { success: true, stats: { total: sagePrices.length, created, updated, errors } };
};

module.exports = {
  syncClients,
  syncProducts,
  syncOrders,
  syncPrices,
  getLastSyncStatus,
  forceSyncAll
};