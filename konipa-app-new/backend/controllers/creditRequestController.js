const { CreditRequest, Client } = require('../models');
const { validationResult } = require('express-validator');
const { syncLogger } = require('../utils/syncLogger');
const { NotificationService } = require('../services/NotificationService');
const ActivityLogger = require('../services/activityLogger');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const db = require('../config/database');

// Créer une demande d'augmentation de limite de crédit
const createCreditRequest = async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { client_id, requested_amount, reason } = req.body;
    
    // Vérifier que le client existe
    const client = await Client.findByPk(client_id);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Créer la demande
    const creditRequest = await CreditRequest.create({
      client_id: client_id,
      client_name: client.company_name,
      current_limit: client.credit_limit || 0,
      requested_amount: requested_amount,
      reason,
      status: 'pending',
      request_date: new Date(),
      requested_by: req.user?.id || client_id
    });

    // Logger l'événement
    syncLogger.syncStart('credit_request', {
      clientId: client_id,
      requestId: creditRequest.id,
      requestedAmount: requested_amount,
      currentLimit: client.credit_limit
    });

    // Envoyer des notifications aux administrateurs
    await NotificationService.notifyAdmins({
      type: 'credit_request',
      title: 'Nouvelle demande d\'augmentation de limite',
      message: `${client.company_name} demande une augmentation de limite de crédit à ${requested_amount} DH`,
      data: {
        clientId: client_id,
        requestId: creditRequest.id,
        clientName: client.company_name,
        currentLimit: client.credit_limit,
        requestedAmount: requested_amount
      }
    });

    res.status(201).json({
      success: true,
      message: 'Demande d\'augmentation créée avec succès',
      data: creditRequest
    });

  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la demande' });
  }
};

// Obtenir toutes les demandes d'augmentation
const getCreditRequests = async (req, res) => {
  try {
    console.log('🔍 Début récupération demandes de crédit');
    const { status, clientId } = req.query;
    
    let whereClause = {};
    if (status) whereClause.status = status;
    if (clientId) whereClause.client_id = clientId;

    console.log('🔍 WhereClause:', whereClause);

    const requests = await CreditRequest.findAll({
      where: whereClause,
      order: [['request_date', 'DESC']],
      include: [{
        model: Client,
        as: 'client',
        attributes: ['company_name', 'phone']
      }]
    });

    console.log('✅ Demandes trouvées:', requests.length);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('❌ Erreur détaillée lors de la récupération des demandes:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des demandes' });
  }
};

// Traiter une demande d'augmentation (approuver/rejeter)
const processCreditRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, newLimit, comments } = req.body; // action: 'approve' ou 'reject'
    
    const creditRequest = await CreditRequest.findByPk(requestId);
    if (!creditRequest) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (creditRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    // Mettre à jour la demande
    creditRequest.status = action === 'approve' ? 'approved' : 'rejected';
    creditRequest.processed_by = req.user?.id;
    creditRequest.processed_date = new Date();
    creditRequest.admin_comments = comments;
    
    if (action === 'approve' && newLimit) {
      creditRequest.approved_amount = newLimit;
      
      // Mettre à jour la limite du client
      const client = await Client.findByPk(creditRequest.client_id);
      if (client) {
        const oldLimit = client.credit_limit;
        client.credit_limit = newLimit;
        await client.save();
        
        // Logger la modification
        syncLogger.syncSuccess('credit_limit_update', {
          clientId: client.id,
          oldLimit,
          newLimit,
          requestId: creditRequest.id
        });
      }
    }

    await creditRequest.save();

    // Enregistrer l'activité de traitement de demande de crédit
    try {
      await ActivityLogger.logCreditRequestProcessed(req.user, creditRequest, action, newLimit, comments);
    } catch (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
    }

    // Notifier le client du résultat
    await NotificationService.notifyClient(creditRequest.client_id, {
      type: 'credit_request_result',
      title: action === 'approve' ? 'Demande approuvée' : 'Demande rejetée',
      message: action === 'approve' 
        ? `Votre demande d'augmentation de limite a été approuvée. Nouvelle limite: ${newLimit} DH`
        : `Votre demande d'augmentation de limite a été rejetée. ${comments || ''}`,
      data: {
        requestId: creditRequest.id,
        action,
        newLimit: action === 'approve' ? newLimit : null
      }
    });

    res.json({
      success: true,
      message: `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
      data: creditRequest
    });

  } catch (error) {
    console.error('Erreur lors du traitement de la demande:', error);
    res.status(500).json({ error: 'Erreur serveur lors du traitement de la demande' });
  }
};

// Obtenir les statistiques des demandes
const getCreditRequestStats = async (req, res) => {
  try {
    const { Op, fn, col } = require('sequelize');
    
    // Statistiques par statut
    const stats = await CreditRequest.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('requested_amount')), 'totalRequested']
      ],
      group: ['status'],
      raw: true
    });

    // Nombre de demandes en attente
    const pendingCount = await CreditRequest.count({ 
      where: { status: 'pending' } 
    });
    
    // Demandes récentes
    const recentRequests = await CreditRequest.findAll({
      order: [['request_date', 'DESC']],
      limit: 5,
      include: [{
        model: Client,
        as: 'client',
        attributes: ['name']
      }]
    });

    res.json({
      success: true,
      data: {
        stats,
        pendingCount,
        recentRequests
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
};

// Exporter les demandes de crédit vers Excel
const exportCreditRequestsToExcel = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND cr.status = $' + (params.length + 1);
      params.push(status);
    }
    
    if (startDate) {
      whereClause += ' AND cr.request_date >= $' + (params.length + 1);
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND cr.request_date <= $' + (params.length + 1);
      params.push(endDate);
    }
    
    const query = `
      SELECT 
        cr.id,
        cr.client_name,
        cr.current_limit,
        cr.requested_amount,
        cr.reason,
        cr.status,
        cr.request_date,
        cr.processed_date,
        cr.processed_by_name,
        cr.admin_notes
      FROM credit_requests cr
      ${whereClause}
      ORDER BY cr.request_date DESC
    `;
    
    const result = await db.query(query, params);
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows.map(row => ({
      'ID': row.id,
      'Client': row.client_name,
      'Limite Actuelle': row.current_limit,
      'Montant Demandé': row.requested_amount,
      'Raison': row.reason,
      'Statut': row.status,
      'Date Demande': new Date(row.request_date).toLocaleDateString('fr-FR'),
      'Date Traitement': row.processed_date ? new Date(row.processed_date).toLocaleDateString('fr-FR') : '',
      'Traité Par': row.processed_by_name || '',
      'Notes Admin': row.admin_notes || ''
    })));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Demandes de Crédit');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=demandes_credit_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel des demandes de crédit:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export Excel' });
  }
};

// Exporter les demandes de crédit vers CSV
const exportCreditRequestsToCSV = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND cr.status = $' + (params.length + 1);
      params.push(status);
    }
    
    if (startDate) {
      whereClause += ' AND cr.request_date >= $' + (params.length + 1);
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND cr.request_date <= $' + (params.length + 1);
      params.push(endDate);
    }
    
    const query = `
      SELECT 
        cr.id,
        cr.client_name,
        cr.current_limit,
        cr.requested_amount,
        cr.reason,
        cr.status,
        cr.request_date,
        cr.processed_date,
        cr.processed_by_name,
        cr.admin_notes
      FROM credit_requests cr
      ${whereClause}
      ORDER BY cr.request_date DESC
    `;
    
    const result = await db.query(query, params);
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows.map(row => ({
      'ID': row.id,
      'Client': row.client_name,
      'Limite Actuelle': row.current_limit,
      'Montant Demandé': row.requested_amount,
      'Raison': row.reason,
      'Statut': row.status,
      'Date Demande': new Date(row.request_date).toLocaleDateString('fr-FR'),
      'Date Traitement': row.processed_date ? new Date(row.processed_date).toLocaleDateString('fr-FR') : '',
      'Traité Par': row.processed_by_name || '',
      'Notes Admin': row.admin_notes || ''
    })));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Demandes de Crédit');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=demandes_credit_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Erreur lors de l\'export CSV des demandes de crédit:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export CSV' });
  }
};

module.exports = {
  createCreditRequest,
  getCreditRequests,
  processCreditRequest,
  getCreditRequestStats,
  exportCreditRequestsToExcel,
  exportCreditRequestsToCSV
};