const { Quote, QuoteItem, Client, User, Product } = require('../models');
const { Op } = require('sequelize');
const AuditService = require('../services/AuditService');
const ActivityLogger = require('../services/activityLogger');
const sequelize = require('../config/database');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

class QuoteController {
  // Obtenir tous les devis
  async getAllQuotes(req, res) {
    try {
      const { page = 1, limit = 10, status, clientId, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;

      const whereConditions = {};

      if (status) {
        whereConditions.status = status;
      }

      if (clientId) {
        whereConditions.client_id = clientId;
      }

      if (search) {
        whereConditions[Op.or] = [
          { quote_number: { [Op.iLike]: `%${search}%` } },
          { '$client.company_name$': { [Op.iLike]: `%${search}%` } },
          { '$creator.first_name$': { [Op.iLike]: `%${search}%` } },
          { '$creator.last_name$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: quotes } = await Quote.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'email', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: QuoteItem,
            as: 'quoteItems',
            attributes: ['id', 'quantity', 'unit_price']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      // Calculer items_count et total_amount pour chaque devis
      const formattedQuotes = quotes.map(quote => {
        const items_count = quote.quoteItems ? quote.quoteItems.length : 0;
        const total_amount = quote.quoteItems ? quote.quoteItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) : 0;
        return {
          ...quote.toJSON(),
          items_count,
          total_amount
        };
      });

      res.json({
        success: true,
        data: formattedQuotes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des devis:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des devis',
        error: error.message
      });
    }
  }

  // Obtenir un devis par ID
  async getQuoteById(req, res) {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'email', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: QuoteItem,
            as: 'quoteItems',
            include: [{ 
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'product_ref_sage']
            }],
            order: [['created_at', 'ASC']]
          }
        ]
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Devis non trouvé'
        });
      }

      // Format the response to match the original structure
      const formattedQuote = {
        ...quote.toJSON(),
        client_name: quote.client ? quote.client.company_name : null,
        client_email: quote.client ? quote.client.email : null,
        client_phone: quote.client ? quote.client.phone : null,
        items: quote.quoteItems.map(item => ({
          ...item.toJSON(),
          product_name: item.product ? item.product.name : null,
          product_reference: item.product ? item.product.product_ref_sage : null,
        }))
      };

      res.json({
        success: true,
        data: formattedQuote
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du devis:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du devis',
        error: error.message
      });
    }
  }

  // Créer un nouveau devis
  async createQuote(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { client_id, valid_until, notes, items } = req.body;
      const created_by = req.user.id;
      
      // Générer un numéro de devis
      const quote_number = await this.generateQuoteNumber();
      
      // Créer le devis
      const quote = await Quote.create({
        quote_number,
        client_id,
        valid_until,
        notes,
        status: 'draft',
        created_by
      }, { transaction });
      
      // Ajouter les articles
      if (items && items.length > 0) {
        for (const item of items) {
          const product = await Product.findByPk(item.product_id);
          if (!product) {
            await transaction.rollback();
            return res.status(404).json({
              success: false,
              message: `Produit non trouvé: ${item.product_id}`
            });
          }
          await QuoteItem.create({
            quote_id: quote.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price || product.base_price_ht // Use provided price or product base price
          }, { transaction });
        }
      }

      await transaction.commit();

      // Enregistrer l'activité de création de devis
      try {
        await ActivityLogger.logQuoteCreated(req.user, quote, client_id);
      } catch (activityError) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
      }

      res.status(201).json({
        success: true,
        data: quote,
        message: 'Devis créé avec succès'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erreur lors de la création du devis:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du devis'
      });
    }
  }

  // Exporter un devis en PDF
  async exportQuoteToPDF(req, res) {
    try {
      const { id } = req.params;
      
      // Récupérer le devis avec ses détails
      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'phone', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: QuoteItem,
            as: 'quoteItems',
            include: [{ 
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'product_ref_sage']
            }]
          }
        ]
      });
      
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Devis non trouvé'
        });
      }
      
      // Créer le PDF
      const doc = new PDFDocument();
      
      // Configuration des headers pour le téléchargement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="devis_${quote.quote_number}.pdf"`);
      
      // Pipe le PDF vers la réponse
      doc.pipe(res);
      
      // En-tête du document
      doc.fontSize(20).text('DEVIS', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Numéro: ${quote.quote_number}`, { align: 'left' });
      doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}`, { align: 'left' });
      
      if (quote.valid_until) {
        doc.text(`Valide jusqu'au: ${new Date(quote.valid_until).toLocaleDateString('fr-FR')}`, { align: 'left' });
      }
      
      // Informations client
      doc.fontSize(14).text('Client:', { align: 'left' });
      doc.fontSize(12).text(`${quote.client.company_name}`, { align: 'left' });
      doc.text(`${quote.client.email}`, { align: 'left' });
      
      if (quote.client.phone) {
        doc.text(`${quote.client.phone}`, { align: 'left' });
      }
      
      // Tableau des articles
      let yPosition = 260;
      doc.fontSize(14).text('Articles:', { align: 'left' });
      yPosition += 30;
      
      // En-têtes du tableau
      doc.fontSize(10);
      doc.text('Produit', 50, yPosition);
      doc.text('Référence', 200, yPosition);
      doc.text('Qté', 300, yPosition);
      doc.text('Prix unitaire', 350, yPosition);
      doc.text('Total', 450, yPosition);
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;
      
      let totalAmount = 0;
      
      // Articles
      for (const item of quote.quoteItems) {
        const itemTotal = item.quantity * item.unit_price;
        totalAmount += itemTotal;
        
        doc.text(item.product.name || 'N/A', 50, yPosition);
        doc.text(item.product.product_ref_sage || 'N/A', 200, yPosition);
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`${item.unit_price.toFixed(2)} €`, 350, yPosition);
        doc.text(`${itemTotal.toFixed(2)} €`, 450, yPosition);
        
        yPosition += 20;
      }
      
      // Total
      yPosition += 10;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 20;
      doc.fontSize(12).text(`Total: ${totalAmount.toFixed(2)} €`, { align: 'right' });
      
      // Notes
      if (quote.notes) {
        yPosition += 40;
        doc.fontSize(12).text('Notes:', { align: 'left' });
        yPosition += 20;
        doc.fontSize(10).text(quote.notes, { align: 'left', width: 500 });
      }
      
      doc.end();
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export PDF'
      });
    }
  }

  // Exporter un devis en Excel
  async exportQuoteToExcel(req, res) {
    try {
      const { id } = req.params;
      
      // Récupérer le devis avec ses détails
      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'phone', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: QuoteItem,
            as: 'quoteItems',
            include: [{ 
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'product_ref_sage']
            }]
          }
        ]
      });
      
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Devis non trouvé'
        });
      }
      
      // Créer le workbook Excel
      const wb = XLSX.utils.book_new();
      
      // Feuille des informations générales
      const quoteInfo = [
        ['Numéro de devis', quote.quote_number],
        ['Date de création', new Date(quote.createdAt).toLocaleDateString('fr-FR')],
        ['Valide jusqu\'au', quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'N/A'],
        ['Statut', quote.status],
        ['Client', quote.client.company_name],
        ['Email client', quote.client.email],
        ['Téléphone client', quote.client.phone || 'N/A'],
        ['Notes', quote.notes || 'N/A']
      ];
      
      const wsInfo = XLSX.utils.aoa_to_sheet(quoteInfo);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');
      
      // Feuille des articles
      const itemsData = [
        ['Produit', 'Référence', 'Quantité', 'Prix unitaire', 'Total']
      ];
      
      let totalAmount = 0;
      
      for (const item of quote.quoteItems) {
        const itemTotal = item.quantity * item.unit_price;
        totalAmount += itemTotal;
        
        itemsData.push([
          item.product.name || 'N/A',
          item.product.product_ref_sage || 'N/A',
          item.quantity,
          item.unit_price,
          itemTotal
        ]);
      }
      
      // Ajouter le total
      itemsData.push(['', '', '', 'TOTAL:', totalAmount]);
      
      const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, wsItems, 'Articles');
      
      // Générer le buffer Excel
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Configuration des headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="devis_${quote.quote_number}.xlsx"`);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export Excel'
      });
    }
  }

  // Export en masse
  async bulkExportQuotes(req, res) {
    try {
      const { quoteIds, format = 'excel' } = req.body;
      
      if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Liste des IDs de devis requise'
        });
      }
      
      if (format === 'excel') {
        await this.bulkExportToExcel(quoteIds, res);
      } else if (format === 'pdf') {
        await this.bulkExportToPDF(quoteIds, res);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Format non supporté. Utilisez "excel" ou "pdf"'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export en masse:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export en masse'
      });
    }
  }

  // Méthodes utilitaires
  async getQuoteWithDetails(id) {
    try {
      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'company_name', 'phone', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: QuoteItem,
            as: 'quoteItems',
            include: [{ 
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'product_ref_sage']
            }]
          }
        ]
      });
      
      if (!quote) {
        return null;
      }
      
      // Format the response to match the original structure
      const formattedQuote = {
        ...quote.toJSON(),
        client_name: quote.client ? quote.client.company_name : null,
        client_email: quote.client ? quote.client.email : null,
        client_phone: quote.client ? quote.client.phone : null,
        items: quote.quoteItems.map(item => ({
          ...item.toJSON(),
          product_name: item.product ? item.product.name : null,
          product_reference: item.product ? item.product.product_ref_sage : null,
        }))
      };
      
      return formattedQuote;
    } catch (error) {
      console.error('Erreur lors de la récupération du devis:', error);
      return null;
    }
  }

  async generateQuoteNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Compter les devis du mois
    const count = await Quote.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(year, new Date().getMonth(), 1)
        }
      }
    });
    
    return `DEV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }

  async bulkExportToExcel(quoteIds, res) {
    const wb = XLSX.utils.book_new();
    
    // Récupérer tous les devis
    const quotes = await Quote.findAll({
      where: {
        id: { [Op.in]: quoteIds }
      },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'company_name', 'email']
        },
        {
          model: QuoteItem,
          as: 'quoteItems',
          attributes: ['quantity', 'unit_price']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Feuille de résumé des devis
    const summaryData = [
      ['Numéro', 'Client', 'Date', 'Statut', 'Montant total']
    ];
    
    for (const quote of quotes) {
      // Calculer le montant total
      const total = quote.quoteItems ? quote.quoteItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) : 0;
      
      summaryData.push([
        quote.quote_number,
        quote.client ? quote.client.company_name : 'N/A',
        new Date(quote.createdAt).toLocaleDateString('fr-FR'),
        quote.status,
        parseFloat(total)
      ]);
    }
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
    
    // Générer le buffer Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Configuration des headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="devis_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(excelBuffer);
  }

  async bulkExportToPDF(quoteIds, res) {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="devis_export_${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    const quotes = await Quote.findAll({
      where: {
        id: { [Op.in]: quoteIds }
      },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'company_name', 'phone', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: QuoteItem,
          as: 'quoteItems',
          include: [{ 
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'product_ref_sage']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    for (const [index, quote] of quotes.entries()) {
      if (index > 0) {
        doc.addPage();
      }

      doc.fontSize(20).text('DEVIS', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(14).text(`Commande #${quote.quote_number}`, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10);
      doc.text(`Client: ${quote.client ? quote.client.company_name : 'N/A'}`);
      doc.text(`Utilisateur: ${quote.creator ? `${quote.creator.first_name} ${quote.creator.last_name}` : 'N/A'}`);
      doc.text(`Statut: ${quote.status}`);
      doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}`);
      doc.text(`Valide jusqu'au: ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'N/A'}`);
      doc.text(`Notes: ${quote.notes || 'N/A'}`);

      if (quote.quoteItems && quote.quoteItems.length > 0) {
        doc.moveDown();
        doc.text('Articles:', { underline: true });

        let totalAmount = 0;
        for (const item of quote.quoteItems) {
          const itemTotal = item.quantity * item.unit_price;
          totalAmount += itemTotal;
          doc.text(`- ${item.product ? item.product.name : 'Produit inconnu'} (${item.quantity} x ${item.unit_price || 0} €)`);
        }
        doc.text(`Total articles: ${totalAmount.toFixed(2)} €`);
      }
      doc.moveDown();
    }
    doc.end();
  }

  // Autres méthodes du contrôleur (stubs pour les routes existantes)
  async getMyQuotes(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [], message: 'À implémenter' });
  }

  async getClientQuotes(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [], message: 'À implémenter' });
  }

  async getQuoteStats(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {}, message: 'À implémenter' });
  }

  async updateQuote(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async updateQuoteStatus(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async deleteQuote(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async getQuoteItems(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [], message: 'À implémenter' });
  }

  async addQuoteItem(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async updateQuoteItem(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async removeQuoteItem(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async sendQuote(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async acceptQuote(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async rejectQuote(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async convertToOrder(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async duplicateQuote(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async calculateQuoteTotals(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async getQuoteDocuments(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [], message: 'À implémenter' });
  }

  async addQuoteDocument(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: 'À implémenter' });
  }

  async getConversionReport(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {}, message: 'À implémenter' });
  }

  async getPerformanceReport(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {}, message: 'À implémenter' });
  }
}

module.exports = new QuoteController();