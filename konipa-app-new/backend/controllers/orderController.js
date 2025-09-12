const { Order, OrderItem, Client, Product, User, Document } = require('../models');
const { Op } = require('sequelize');
const AuditService = require('../services/AuditService');
const NotificationService = require('../services/NotificationService');
const notificationService = require('../services/NotificationService');
const SageApiService = require('../services/SageApiService');
const PriceCalculationService = require('../services/PriceCalculationService');
const PDFService = require('../services/PDFService');
const ExcelService = require('../services/ExcelService');
const ActivityLogger = require('../services/activityLogger');
const sequelize = require('../config/database');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

class OrderController {
  // Obtenir toutes les commandes avec filtres
  async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        clientId,
        userId,
        startDate,
        endDate,
        search,
        sortBy = 'order_date',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};
      const include = [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'company_name', 'phone']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'base_price_ht']
          }]
        }
      ];

      // Filtres
      if (status) {
        whereClause.status = status;
      }

      if (clientId) {
        whereClause.client_id = clientId;
      }

      if (userId) {
        whereClause.user_id = userId;
      }

      if (startDate && endDate) {
        whereClause.order_date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      if (search) {
        whereClause[Op.or] = [
          { order_number: { [Op.iLike]: `%${search}%` } },
          { '$client.company_name$': { [Op.iLike]: `%${search}%` } },
          { '$client.phone$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Order.findAndCountAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
        distinct: true
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message
      });
    }
  }

  // Obtenir une commande par ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'phone', 'address']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email', 'role']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'product_ref_sage', 'base_price_ht']
            }]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la commande',
        error: error.message
      });
    }
  }

  // Créer une nouvelle commande
  async createOrder(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { client_id, items, notes, delivery_date, shipping_amount = 0 } = req.body;

      // Vérifier que le client existe
      const client = await Client.findByPk(client_id);
      if (!client) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Générer le numéro de commande
      const orderNumber = `CMD-${Date.now()}`;

      // Vérifier que les articles sont fournis et valides
      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Les articles de la commande sont requis'
        });
      }

      let total_ht = 0;
      let total_tva = 0;
      let total_ttc = 0;
      let total_discount = 0;

      // Créer la commande
      const order = await Order.create({
        order_number: orderNumber,
        client_id,
        user_id: req.user.id,
        status: 'submitted',
        order_date: new Date(),
        required_date: delivery_date,
        notes,
        shipping_amount,
        subtotal: 0, // Temporaire, sera mis à jour après calcul des articles
        tax_amount: 0, // Temporaire
        discount_amount: 0, // Temporaire
        total_amount: 0 // Temporaire
      }, { transaction });

      // Traiter chaque article de la commande
      for (const item of items) {
        const product = await Product.findByPk(item.product_id);
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: `Produit non trouvé: ${item.product_id}`
          });
        }

        // Calculer le prix unitaire (peut inclure des logiques de tarification complexes ici)
        const unitPrice = product.base_price_ht; // Utiliser le prix de base du produit

        const orderItem = await OrderItem.create({
          order_id: order.id,
          product_id: product.id,
          quantity: item.quantity,
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: unitPrice,
          original_price: product.base_price_ht,
          discount_percent: item.discount_percent || 0,
          vat_rate: product.vat_rate || 20, // Assumer 20% si non défini sur le produit
        }, { transaction });

        // Les hooks beforeSave de OrderItem calculent déjà total_price, vat_amount, discount_amount
        total_ht += (orderItem.quantity * orderItem.price) - orderItem.discount_amount;
        total_tva += orderItem.vat_amount;
        total_ttc += orderItem.total_price;
        total_discount += orderItem.discount_amount;
      }

      // Mettre à jour la commande avec les totaux calculés
      await order.update({
        subtotal: total_ht,
        tax_amount: total_tva,
        discount_amount: total_discount,
        total_amount: total_ttc + shipping_amount // Ajouter les frais de port au total TTC
      }, { transaction });

      await transaction.commit();

      // Enregistrer l'activité de création de commande
      try {
        await ActivityLogger.logOrderCreated(order, req.user, req.ip, req.get('User-Agent'));
      } catch (logError) {
        console.error('Erreur lors de l\'enregistrement de la création de commande:', logError);
        // Ne pas faire échouer la création pour une erreur de log
      }

      res.status(201).json({
        success: true,
        data: order,
        message: 'Commande créée avec succès'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erreur lors de la création de la commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la commande',
        error: error.message
      });
    }
  }

  // Mettre à jour une commande
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      const oldStatus = order.status;
      await order.update(updates);

      // Enregistrer l'activité de modification de commande
      try {
        await ActivityLogger.logOrderUpdated(req.user, order, updates, oldStatus);
      } catch (logError) {
        console.error('Erreur lors de l\'enregistrement de la modification de commande:', logError);
        // Ne pas faire échouer la modification pour une erreur de log
      }

      res.json({
        success: true,
        data: order,
        message: 'Commande mise à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la commande',
        error: error.message
      });
    }
  }

  // Supprimer une commande
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'company_name']
        }]
      });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Sauvegarder les données pour l'enregistrement d'activité
      const orderData = {
        id: order.id,
        order_number: order.order_number,
        client: order.client
      };

      await order.destroy();

      // Enregistrer l'activité de suppression de commande
      try {
        await ActivityLogger.logOrderDeleted(req.user, orderData, orderData.client);
      } catch (logError) {
        console.error('Erreur lors de l\'enregistrement de la suppression de commande:', logError);
        // Ne pas faire échouer la suppression pour une erreur de log
      }

      res.json({
        success: true,
        message: 'Commande supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la commande',
        error: error.message
      });
    }
  }

  // Exporter les commandes en Excel
  async exportOrdersToExcel(req, res) {
    try {
      const { status, clientId, startDate, endDate } = req.query;

      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (clientId) {
        whereClause.client_id = clientId;
      }

      if (startDate && endDate) {
        whereClause.order_date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'phone']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'base_price_ht']
            }]
          }
        ],
        order: [['order_date', 'DESC']]
      });

      // Créer le workbook Excel
      const wb = XLSX.utils.book_new();

      // Préparer les données pour Excel
      const orderData = [
        ['ID Commande', 'Client', 'Utilisateur', 'Statut', 'Date', 'Total HT', 'TVA', 'Total TTC', 'Nb Articles']
      ];

      orders.forEach(order => {
        const totalItems = order.orderItems ? order.orderItems.reduce((sum, item) => sum + item.quantity, 0) : 0;

        orderData.push([
          order.id,
          order.client ? order.client.company_name : 'N/A',
          order.user ? `${order.user.first_name} ${order.user.last_name}` : 'N/A',
          order.status,
          order.order_date ? new Date(order.order_date).toLocaleDateString('fr-FR') : 'N/A',
          order.total_ht || 0,
          order.total_tva || 0,
          order.total_ttc || 0,
          totalItems
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(orderData);
      XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

      // Générer le buffer Excel
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Configuration des headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="commandes_export_${new Date().toISOString().split('T')[0]}.xlsx"`);

      res.send(excelBuffer);

    } catch (error) {
      console.error('Erreur lors de l\'export Excel des commandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export Excel des commandes'
      });
    }
  }

  // Exporter les commandes en CSV
  async exportOrdersToCSV(req, res) {
    try {
      const { status, clientId, startDate, endDate } = req.query;

      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (clientId) {
        whereClause.client_id = clientId;
      }

      if (startDate && endDate) {
        whereClause.order_date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'phone']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'base_price_ht']
            }]
          }
        ],
        order: [['order_date', 'DESC']]
      });

      // Export CSV
      const csvData = [
        'ID Commande,Client,Utilisateur,Statut,Date,Total HT,TVA,Total TTC,Nb Articles'
      ];

      orders.forEach(order => {
        const totalItems = order.orderItems ? order.orderItems.reduce((sum, item) => sum + item.quantity, 0) : 0;

        const row = [
          order.id,
          order.client ? `"${order.client.company_name}"` : 'N/A',
          order.user ? `"${order.user.first_name} ${order.user.last_name}"` : 'N/A',
          order.status,
          order.order_date ? new Date(order.order_date).toLocaleDateString('fr-FR') : 'N/A',
          order.total_ht || 0,
          order.total_tva || 0,
          order.total_ttc || 0,
          totalItems
        ];
        csvData.push(row.join(','));
      });

      const csvContent = csvData.join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="commandes_export_${new Date().toISOString().split('T')[0]}.csv"`);

      res.send('\uFEFF' + csvContent); // BOM pour UTF-8

    } catch (error) {
      console.error('Erreur lors de l\'export CSV des commandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export CSV des commandes'
      });
    }
  }

  // Exporter les commandes en PDF
  async exportOrdersToPDF(req, res) {
    try {
      const { status, clientId, startDate, endDate } = req.query;

      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (clientId) {
        whereClause.client_id = clientId;
      }

      if (startDate && endDate) {
        whereClause.order_date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'phone']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'base_price_ht']
            }]
          }
        ],
        order: [['order_date', 'DESC']]
      });

      // Créer le document PDF
      const doc = new PDFDocument({ margin: 50 });

      // Configuration des headers pour le téléchargement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="commandes_export_${new Date().toISOString().split('T')[0]}.pdf"`);

      // Pipe le PDF vers la réponse
      doc.pipe(res);

      // Titre du document
      doc.fontSize(20).text('Export des Commandes', { align: 'center' });
      doc.moveDown();

      // Date d'export
      doc.fontSize(12).text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown();

      // Tableau des commandes
      orders.forEach((order, index) => {
        if (index > 0) {
          doc.addPage();
        }

        doc.fontSize(14).text(`Commande #${order.id}`, { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(10);
        doc.text(`Client: ${order.client ? order.client.company_name : 'N/A'}`);
        doc.text(`Utilisateur: ${order.user ? `${order.user.first_name} ${order.user.last_name}` : 'N/A'}`);
        doc.text(`Statut: ${order.status}`);
        doc.text(`Date: ${order.order_date ? new Date(order.order_date).toLocaleDateString('fr-FR') : 'N/A'}`);
        doc.text(`Total HT: ${order.total_ht || 0} €`);
        doc.text(`TVA: ${order.total_tva || 0} €`);
        doc.text(`Total TTC: ${order.total_ttc || 0} €`);

        if (order.orderItems && order.orderItems.length > 0) {
          doc.moveDown();
          doc.text('Articles:', { underline: true });

          order.orderItems.forEach(item => {
            doc.text(`- ${item.product ? item.product.name : 'Produit inconnu'} (${item.quantity} x ${item.unit_price || 0} €)`);
          });
        }

        doc.moveDown();
      });

      // Finaliser le PDF
      doc.end();

    } catch (error) {
      console.error('Erreur lors de l\'export PDF des commandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export PDF des commandes'
      });
    }
  }

  /**
   * Obtenir les statistiques des commandes
   */
  async getOrderStatistics(req, res) {
    try {
      const totalOrders = await Order.count();
      const pendingOrders = await Order.count({ where: { status: 'pending' } });
      const approvedOrders = await Order.count({ where: { status: 'approved' } });
      const rejectedOrders = await Order.count({ where: { status: 'rejected' } });

      const totalAmount = await Order.sum('total_amount');
      const approvedAmount = await Order.sum('total_amount', { where: { status: 'approved' } });

      res.json({
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          approvedOrders,
          rejectedOrders,
          totalAmount: totalAmount || 0,
          approvedAmount: approvedAmount || 0,
          pendingRate: totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0,
          approvalRate: totalOrders > 0 ? (approvedOrders / totalOrders) * 100 : 0
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques commandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques commandes',
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();