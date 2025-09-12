const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, Client, User, Category, Brand } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');
const { Op, fn, col, literal } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const moment = require('moment');

// Validation middleware
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide (format ISO8601)'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide (format ISO8601)'),
  query('period')
    .optional()
    .isIn(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'])
    .withMessage('Période invalide')
];

const validateReportParams = [
  query('format')
    .optional()
    .isIn(['json', 'excel', 'pdf'])
    .withMessage('Format invalide (json, excel, pdf)'),
  query('group_by')
    .optional()
    .isIn(['day', 'week', 'month', 'quarter', 'year'])
    .withMessage('Groupement invalide'),
  query('client_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID client invalide'),
  query('sales_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID commercial invalide'),
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID catégorie invalide'),
  query('brand_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID marque invalide')
];

// Fonction utilitaire pour calculer les dates selon la période
function getDateRange(period, start_date, end_date) {
  const now = moment();
  let startDate, endDate;

  if (start_date && end_date) {
    return {
      start: moment(start_date).startOf('day').toDate(),
      end: moment(end_date).endOf('day').toDate()
    };
  }

  switch (period) {
    case 'today':
      startDate = now.clone().startOf('day');
      endDate = now.clone().endOf('day');
      break;
    case 'yesterday':
      startDate = now.clone().subtract(1, 'day').startOf('day');
      endDate = now.clone().subtract(1, 'day').endOf('day');
      break;
    case 'this_week':
      startDate = now.clone().startOf('week');
      endDate = now.clone().endOf('week');
      break;
    case 'last_week':
      startDate = now.clone().subtract(1, 'week').startOf('week');
      endDate = now.clone().subtract(1, 'week').endOf('week');
      break;
    case 'this_month':
      startDate = now.clone().startOf('month');
      endDate = now.clone().endOf('month');
      break;
    case 'last_month':
      startDate = now.clone().subtract(1, 'month').startOf('month');
      endDate = now.clone().subtract(1, 'month').endOf('month');
      break;
    case 'this_quarter':
      startDate = now.clone().startOf('quarter');
      endDate = now.clone().endOf('quarter');
      break;
    case 'last_quarter':
      startDate = now.clone().subtract(1, 'quarter').startOf('quarter');
      endDate = now.clone().subtract(1, 'quarter').endOf('quarter');
      break;
    case 'this_year':
      startDate = now.clone().startOf('year');
      endDate = now.clone().endOf('year');
      break;
    case 'last_year':
      startDate = now.clone().subtract(1, 'year').startOf('year');
      endDate = now.clone().subtract(1, 'year').endOf('year');
      break;
    default:
      // Par défaut, le mois en cours
      startDate = now.clone().startOf('month');
      endDate = now.clone().endOf('month');
  }

  return {
    start: startDate.toDate(),
    end: endDate.toDate()
  };
}

// Fonction utilitaire pour générer un fichier Excel
async function generateExcelReport(data, reportType, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType);

  // Configuration des colonnes selon le type de rapport
  switch (reportType) {
    case 'sales':
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Commande', key: 'order_number', width: 15 },
        { header: 'Client', key: 'client_name', width: 25 },
        { header: 'Commercial', key: 'sales_name', width: 20 },
        { header: 'Montant HT', key: 'total_ht', width: 15 },
        { header: 'Montant TTC', key: 'total_amount', width: 15 },
        { header: 'Statut', key: 'status', width: 15 }
      ];
      break;
    case 'products':
      worksheet.columns = [
        { header: 'Produit', key: 'product_name', width: 30 },
        { header: 'Référence', key: 'reference', width: 15 },
        { header: 'Catégorie', key: 'category_name', width: 20 },
        { header: 'Marque', key: 'brand_name', width: 20 },
        { header: 'Quantité vendue', key: 'quantity_sold', width: 15 },
        { header: 'CA généré', key: 'revenue', width: 15 }
      ];
      break;
    case 'clients':
      worksheet.columns = [
        { header: 'Client', key: 'client_name', width: 30 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Téléphone', key: 'phone', width: 15 },
        { header: 'Nb commandes', key: 'orders_count', width: 15 },
        { header: 'CA total', key: 'total_revenue', width: 15 },
        { header: 'Dernière commande', key: 'last_order_date', width: 15 }
      ];
      break;
  }

  // Ajouter les données
  data.forEach(row => {
    worksheet.addRow(row);
  });

  // Style de l'en-tête
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Définir le nom du fichier
  const filename = `rapport_${reportType}_${moment().format('YYYY-MM-DD')}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
}

// Fonction utilitaire pour générer un fichier PDF
function generatePDFReport(data, reportType, res) {
  const doc = new PDFDocument();
  const filename = `rapport_${reportType}_${moment().format('YYYY-MM-DD')}.pdf`;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // En-tête du document
  doc.fontSize(20).text(`Rapport ${reportType}`, 50, 50);
  doc.fontSize(12).text(`Généré le ${moment().format('DD/MM/YYYY à HH:mm')}`, 50, 80);
  
  let yPosition = 120;

  // Contenu selon le type de rapport
  data.forEach((item, index) => {
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    switch (reportType) {
      case 'sales':
        doc.text(`${index + 1}. Commande ${item.order_number} - ${item.client_name}`, 50, yPosition);
        doc.text(`   Date: ${item.date} | Montant: ${item.total_amount}€ | Statut: ${item.status}`, 50, yPosition + 15);
        yPosition += 40;
        break;
      case 'products':
        doc.text(`${index + 1}. ${item.product_name} (${item.reference})`, 50, yPosition);
        doc.text(`   Quantité vendue: ${item.quantity_sold} | CA: ${item.revenue}€`, 50, yPosition + 15);
        yPosition += 40;
        break;
      case 'clients':
        doc.text(`${index + 1}. ${item.client_name}`, 50, yPosition);
        doc.text(`   Commandes: ${item.orders_count} | CA: ${item.total_revenue}€`, 50, yPosition + 15);
        yPosition += 40;
        break;
    }
  });

  doc.end();
}

/**
 * @route GET /api/reports/sales
 * @desc Rapport des ventes
 * @access Private (Admin/Manager/Sales)
 */
router.get('/sales', 
  authenticateToken,
  requireRole(['admin', 'manager', 'sales']),
  [...validateDateRange, ...validateReportParams],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const {
        period = 'this_month',
        start_date,
        end_date,
        format = 'json',
        group_by = 'day',
        client_id,
        sales_id
      } = req.query;

      const dateRange = getDateRange(period, start_date, end_date);
      const whereConditions = {
        created_at: {
          [Op.between]: [dateRange.start, dateRange.end]
        },
        status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
      };

      // Filtres additionnels
      if (client_id) {
        whereConditions.client_id = client_id;
      }

      if (sales_id) {
        whereConditions.sales_user_id = sales_id;
      }

      // Restriction pour les commerciaux
      if (req.user.role === 'sales') {
        whereConditions.user_id = req.user.id;
      }

      const orders = await Order.findAll({
        where: whereConditions,
        include: [
          {
            model: Client,
            attributes: ['id', 'company_name', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'SalesUser',
            attributes: ['id', 'first_name', 'last_name']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Préparer les données pour l'export
      const salesData = orders.map(order => ({
        date: moment(order.created_at).format('DD/MM/YYYY'),
        order_number: order.order_number,
        client_name: order.Client ? 
          (order.Client.company_name || `${order.Client.first_name} ${order.Client.last_name}`) : 
          'Client supprimé',
        sales_name: order.SalesUser ? 
          `${order.SalesUser.first_name} ${order.SalesUser.last_name}` : 
          'Non assigné',
        total_ht: parseFloat(order.total_ht || 0),
        total_amount: parseFloat(order.total_amount || 0),
        status: order.status
      }));

      // Calculs de synthèse
      const summary = {
        total_orders: orders.length,
        total_revenue_ht: salesData.reduce((sum, order) => sum + order.total_ht, 0),
        total_revenue_ttc: salesData.reduce((sum, order) => sum + order.total_amount, 0),
        average_order_value: orders.length > 0 ? 
          salesData.reduce((sum, order) => sum + order.total_amount, 0) / orders.length : 0
      };

      // Retourner selon le format demandé
      if (format === 'excel') {
        return await generateExcelReport(salesData, 'sales', res);
      } else if (format === 'pdf') {
        return generatePDFReport(salesData, 'sales', res);
      }

      res.json({
        success: true,
        data: {
          summary,
          orders: salesData,
          period: {
            start: dateRange.start,
            end: dateRange.end
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport des ventes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport des ventes',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/products
 * @desc Rapport des produits les plus vendus
 * @access Private (Admin/Manager)
 */
router.get('/products', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [...validateDateRange, ...validateReportParams],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const {
        period = 'this_month',
        start_date,
        end_date,
        format = 'json',
        category_id,
        brand_id,
        limit = 50
      } = req.query;

      const dateRange = getDateRange(period, start_date, end_date);
      
      const whereConditions = {
        '$Order.created_at$': {
          [Op.between]: [dateRange.start, dateRange.end]
        },
        '$Order.status$': { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
      };

      const productWhereConditions = {};
      if (category_id) {
        productWhereConditions.category_id = category_id;
      }
      if (brand_id) {
        productWhereConditions.brand_id = brand_id;
      }

      const productStats = await OrderItem.findAll({
        attributes: [
          'product_id',
          [fn('SUM', col('quantity')), 'quantity_sold'],
          [fn('SUM', literal('quantity * price')), 'revenue']
        ],
        include: [
          {
            model: Order,
            as: 'order',
            attributes: [],
            where: {
              created_at: {
                [Op.between]: [dateRange.start, dateRange.end]
              },
              status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
            }
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku'],
            where: productWhereConditions,
            include: [
              {
                model: Category,
                attributes: ['id', 'name'],
                required: false
              },
              {
                model: Brand,
                attributes: ['id', 'name'],
                required: false
              }
            ]
          }
        ],
        group: ['product_id', 'product.id', 'product.Category.id', 'product.Brand.id'],
        order: [[fn('SUM', col('OrderItem.quantity')), 'DESC']],
        limit: parseInt(limit)
      });

      // Préparer les données pour l'export
      const productsData = productStats.map(item => ({
        product_name: item.product.name,
        reference: item.product.sku,
        category_name: item.product.Category ? item.product.Category.name : 'Sans catégorie',
        brand_name: item.product.Brand ? item.product.Brand.name : 'Sans marque',
        quantity_sold: parseInt(item.dataValues.quantity_sold),
        revenue: parseFloat(item.dataValues.revenue)
      }));

      // Calculs de synthèse
      const summary = {
        total_products_sold: productsData.length,
        total_quantity_sold: productsData.reduce((sum, product) => sum + product.quantity_sold, 0),
        total_revenue: productsData.reduce((sum, product) => sum + product.revenue, 0)
      };

      // Retourner selon le format demandé
      if (format === 'excel') {
        return await generateExcelReport(productsData, 'products', res);
      } else if (format === 'pdf') {
        return generatePDFReport(productsData, 'products', res);
      }

      res.json({
        success: true,
        data: {
          summary,
          products: productsData,
          period: {
            start: dateRange.start,
            end: dateRange.end
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport des produits:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport des produits',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/clients
 * @desc Rapport des clients
 * @access Private (Admin/Manager)
 */
router.get('/clients', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [...validateDateRange, ...validateReportParams],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const {
        period = 'this_month',
        start_date,
        end_date,
        format = 'json',
        limit = 50
      } = req.query;

      const dateRange = getDateRange(period, start_date, end_date);

      const clientStats = await Client.findAll({
        attributes: [
          'id',
          'company_name',
          'first_name',
          'last_name',
          'email',
          'phone',
          [fn('COUNT', col('Orders.id')), 'orders_count'],
          [fn('SUM', col('Orders.total_amount')), 'total_revenue'],
          [fn('MAX', col('Orders.created_at')), 'last_order_date']
        ],
        include: [
          {
            model: Order,
            attributes: [],
            where: {
              created_at: {
                [Op.between]: [dateRange.start, dateRange.end]
              },
              status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
            },
            required: true
          }
        ],
        group: ['Client.id'],
        order: [[fn('SUM', col('Orders.total_amount')), 'DESC']],
        limit: parseInt(limit)
      });

      // Préparer les données pour l'export
      const clientsData = clientStats.map(client => ({
        client_name: client.company_name || `${client.first_name} ${client.last_name}`,
        email: client.email,
        phone: client.phone,
        orders_count: parseInt(client.dataValues.orders_count),
        total_revenue: parseFloat(client.dataValues.total_revenue || 0),
        last_order_date: client.dataValues.last_order_date ? 
          moment(client.dataValues.last_order_date).format('DD/MM/YYYY') : 'N/A'
      }));

      // Calculs de synthèse
      const summary = {
        total_active_clients: clientsData.length,
        total_revenue: clientsData.reduce((sum, client) => sum + client.total_revenue, 0),
        average_revenue_per_client: clientsData.length > 0 ? 
          clientsData.reduce((sum, client) => sum + client.total_revenue, 0) / clientsData.length : 0
      };

      // Retourner selon le format demandé
      if (format === 'excel') {
        return await generateExcelReport(clientsData, 'clients', res);
      } else if (format === 'pdf') {
        return generatePDFReport(clientsData, 'clients', res);
      }

      res.json({
        success: true,
        data: {
          summary,
          clients: clientsData,
          period: {
            start: dateRange.start,
            end: dateRange.end
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport des clients:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport des clients',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/dashboard
 * @desc Données pour le tableau de bord
 * @access Private (Admin/Manager/Sales)
 */
router.get('/dashboard', 
  authenticateToken,
  requireRole(['admin', 'manager', 'sales']),
  [...validateDateRange],
  async (req, res) => {
    try {
      const {
        period = 'this_month',
        start_date,
        end_date
      } = req.query;

      const dateRange = getDateRange(period, start_date, end_date);
      const whereConditions = {
        created_at: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      };

      // Restriction pour les commerciaux
      if (req.user.role === 'sales') {
        whereConditions.user_id = req.user.id;
      }

      // Statistiques générales
      const [totalOrders, confirmedOrders, totalRevenue, pendingOrders] = await Promise.all([
        Order.count({ where: whereConditions }),
        Order.count({ 
          where: { 
            ...whereConditions, 
            status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] } 
          } 
        }),
        Order.sum('total_amount', { 
          where: { 
            ...whereConditions, 
            status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] } 
          } 
        }),
        Order.count({ 
          where: { 
            ...whereConditions, 
            status: 'pending' 
          } 
        })
      ]);

      // Évolution des ventes par jour
      const salesEvolution = await Order.findAll({
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('Order.id')), 'orders_count'],
          [fn('SUM', col('total_amount')), 'revenue']
        ],
        where: {
          ...whereConditions,
          status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
        },
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']]
      });

      // Top 5 des produits
      const topProducts = await OrderItem.findAll({
        attributes: [
          'OrderItem.product_id',
          [fn('SUM', col('OrderItem.quantity')), 'quantity_sold']
        ],
        include: [
          {
            model: Order,
            as: 'order',
            attributes: [],
            where: {
              ...whereConditions,
              status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
            }
          },
          {
            model: Product,
            as: 'product',
            attributes: [['id', 'product_id'], 'name']
          }
        ],
        group: ['OrderItem.product_id', 'product.id'],
        order: [[fn('SUM', col('OrderItem.quantity')), 'DESC']],
        limit: 5
      });

      // Top 5 des clients (seulement pour admin/manager)
      let topClients = [];
      if (req.user.role !== 'sales') {
        topClients = await Order.findAll({
          attributes: [
            'client_id',
            [fn('COUNT', col('Order.id')), 'orders_count'],
            [fn('SUM', col('total_amount')), 'total_revenue']
          ],
          include: [
            {
              model: Client,
              as: 'client',
              attributes: [['id', 'client_db_id'], 'company_name', 'client_code_sage']
            }
          ],
          where: {
            ...whereConditions,
            status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
          },
          group: ['client_id', 'client.id'],
          order: [[fn('SUM', col('total_amount')), 'DESC']],
          limit: 5
        });
      }

      res.json({
        success: true,
        data: {
          summary: {
            total_orders: totalOrders,
            confirmed_orders: confirmedOrders,
            pending_orders: pendingOrders,
            total_revenue: parseFloat(totalRevenue || 0),
            conversion_rate: totalOrders > 0 ? (confirmedOrders / totalOrders * 100) : 0
          },
          sales_evolution: salesEvolution.map(item => ({
            date: item.dataValues.date,
            orders_count: parseInt(item.dataValues.orders_count),
            revenue: parseFloat(item.dataValues.revenue || 0)
          })),
          top_products: topProducts.map(item => ({
              product_id: item.product_id,
              product_name: item.product.name,
              total_quantity: parseInt(item.dataValues.total_quantity),
              total_revenue: parseFloat(item.dataValues.total_revenue)
            })),
          top_clients: topClients.map(item => ({
            client_id: item.client_id,
            client_name: item.client.company_name,
            orders_count: parseInt(item.dataValues.orders_count),
            total_revenue: parseFloat(item.dataValues.total_revenue || 0)
          })),
          period: {
            start: dateRange.start,
            end: dateRange.end
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du tableau de bord:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du tableau de bord',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/sales-performance
 * @desc Rapport de performance des commerciaux
 * @access Private (Admin/Manager)
 */
router.get('/sales-performance', 
  authenticateToken,
  requireRole(['admin', 'manager']),
  [...validateDateRange, ...validateReportParams],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array()
        });
      }

      const {
        period = 'this_month',
        start_date,
        end_date,
        format = 'json'
      } = req.query;

      const dateRange = getDateRange(period, start_date, end_date);

      const salesPerformance = await User.findAll({
        attributes: [
          'id',
          'first_name',
          'last_name',
          'email',
          [fn('COUNT', col('SalesOrders.id')), 'orders_count'],
          [fn('SUM', col('SalesOrders.total_amount')), 'total_revenue'],
          [fn('AVG', col('SalesOrders.total_amount')), 'average_order_value']
        ],
        include: [
          {
            model: Order,
            as: 'SalesOrders',
            attributes: [],
            where: {
              created_at: {
                [Op.between]: [dateRange.start, dateRange.end]
              },
              status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
            },
            required: true
          }
        ],
        where: {
          role: 'sales',
          is_active: true
        },
        group: ['User.id'],
        order: [[fn('SUM', col('SalesOrders.total_amount')), 'DESC']]
      });

      // Préparer les données
      const performanceData = salesPerformance.map(user => ({
        sales_id: user.id,
        sales_name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        orders_count: parseInt(user.dataValues.orders_count),
        total_revenue: parseFloat(user.dataValues.total_revenue || 0),
        average_order_value: parseFloat(user.dataValues.average_order_value || 0)
      }));

      // Calculs de synthèse
      const summary = {
        total_sales_users: performanceData.length,
        total_orders: performanceData.reduce((sum, user) => sum + user.orders_count, 0),
        total_revenue: performanceData.reduce((sum, user) => sum + user.total_revenue, 0)
      };

      // Retourner selon le format demandé
      if (format === 'excel') {
        return await generateExcelReport(performanceData, 'sales_performance', res);
      } else if (format === 'pdf') {
        return generatePDFReport(performanceData, 'sales_performance', res);
      }

      res.json({
        success: true,
        data: {
          summary,
          sales_performance: performanceData,
          period: {
            start: dateRange.start,
            end: dateRange.end
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de performance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport de performance',
        error: error.message
      });
    }
  }
);

module.exports = router;