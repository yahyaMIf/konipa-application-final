const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const sageApiService = require('../services/sageApiService');

/**
 * @route GET /api/invoices
 * @desc Récupère toutes les factures pour l'utilisateur connecté
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, client } = req.user;
    
    let invoices = [];
    
    if (role === 'client' && client) {
      // Pour un client, récupérer ses factures via Sage
      invoices = await sageApiService.getInvoices(client.code);
    } else if (role === 'admin' || role === 'commercial') {
      // Pour admin/commercial, récupérer toutes les factures (mockées pour le moment)
      invoices = [
        {
          id: 'INV-2025-001',
          clientCode: 'CLI001',
          clientName: 'Garage Martin',
          amount: 1250.00,
          status: 'paid',
          date: '2025-01-15',
          dueDate: '2025-02-15',
          items: [
            { description: 'Plaquettes de frein', quantity: 2, unitPrice: 45.00, total: 90.00 },
            { description: 'Disques de frein', quantity: 2, unitPrice: 580.00, total: 1160.00 }
          ]
        },
        {
          id: 'INV-2025-002',
          clientCode: 'CLI002',
          clientName: 'Auto Service Plus',
          amount: 850.00,
          status: 'pending',
          date: '2025-01-20',
          dueDate: '2025-02-20',
          items: [
            { description: 'Filtre à huile', quantity: 5, unitPrice: 25.00, total: 125.00 },
            { description: 'Huile moteur 5W30', quantity: 10, unitPrice: 72.50, total: 725.00 }
          ]
        }
      ];
    }
    
    res.json({
      status: 'SUCCESS',
      data: invoices
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur lors de la récupération des factures',
      error: error.message
    });
  }
});

/**
 * @route GET /api/invoices/:id
 * @desc Récupère une facture spécifique
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Facture mockée pour le moment
    const invoice = {
      id: id,
      clientCode: 'CLI001',
      clientName: 'Garage Martin',
      amount: 1250.00,
      status: 'paid',
      date: '2025-01-15',
      dueDate: '2025-02-15',
      items: [
        { description: 'Plaquettes de frein', quantity: 2, unitPrice: 45.00, total: 90.00 },
        { description: 'Disques de frein', quantity: 2, unitPrice: 580.00, total: 1160.00 }
      ],
      paymentHistory: [
        { date: '2025-01-16', amount: 1250.00, method: 'virement', reference: 'VIR-2025-001' }
      ]
    };
    
    res.json({
      status: 'SUCCESS',
      data: invoice
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur lors de la récupération de la facture',
      error: error.message
    });
  }
});

module.exports = router;