const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Route pour les statistiques du dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Statistiques mockées pour le moment
    const stats = {
      totalSales: 125000,
      totalOrders: 342,
      totalClients: 89,
      totalProducts: 156,
      salesGrowth: 12.5,
      ordersGrowth: 8.3,
      clientsGrowth: 15.2,
      productsGrowth: 5.7,
      recentSales: [
        { date: '2025-01-20', amount: 5200 },
        { date: '2025-01-21', amount: 4800 },
        { date: '2025-01-22', amount: 6100 },
        { date: '2025-01-23', amount: 5500 },
        { date: '2025-01-24', amount: 7200 }
      ],
      topProducts: [
        { id: 1, name: 'Produit A', sales: 25000 },
        { id: 2, name: 'Produit B', sales: 18500 },
        { id: 3, name: 'Produit C', sales: 15200 }
      ],
      topClients: [
        { id: 1, name: 'Client Premium', orders: 45 },
        { id: 2, name: 'Client Gold', orders: 32 },
        { id: 3, name: 'Client Silver', orders: 28 }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// Route pour les statistiques de ventes
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const salesStats = {
      totalRevenue: 125000,
      monthlyRevenue: 45000,
      dailyAverage: 1500,
      salesByMonth: [
        { month: 'Jan', revenue: 35000 },
        { month: 'Feb', revenue: 42000 },
        { month: 'Mar', revenue: 38000 },
        { month: 'Apr', revenue: 45000 }
      ]
    };

    res.json({
      success: true,
      data: salesStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de ventes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de ventes',
      error: error.message
    });
  }
});

// Route pour les statistiques générales
router.get('/general', authenticateToken, async (req, res) => {
  try {
    const generalStats = {
      totalUsers: 150,
      activeUsers: 120,
      totalRevenue: 125000,
      monthlyGrowth: 12.5,
      conversionRate: 3.2,
      averageOrderValue: 365
    };

    res.json({
      success: true,
      data: generalStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques générales:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques générales',
      error: error.message
    });
  }
});

// Route pour les statistiques des commerciaux
router.get('/sales-rep', authenticateToken, async (req, res) => {
  try {
    const salesRepStats = {
      totalSalesReps: 12,
      activeSalesReps: 10,
      topPerformers: [
        { id: 1, name: 'Jean Dupont', revenue: 25000, target: 30000 },
        { id: 2, name: 'Marie Martin', revenue: 22000, target: 25000 },
        { id: 3, name: 'Pierre Durand', revenue: 20000, target: 22000 }
      ],
      averagePerformance: 85.5
    };

    res.json({
      success: true,
      data: salesRepStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques commerciaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques commerciaux',
      error: error.message
    });
  }
});

// Route pour les statistiques de conversion
router.get('/conversion', authenticateToken, async (req, res) => {
  try {
    const conversionStats = {
      visitorToLead: 15.2,
      leadToCustomer: 22.8,
      overallConversion: 3.5,
      funnelData: [
        { stage: 'Visiteurs', count: 10000 },
        { stage: 'Leads', count: 1520 },
        { stage: 'Prospects', count: 456 },
        { stage: 'Clients', count: 104 }
      ]
    };

    res.json({
      success: true,
      data: conversionStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de conversion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de conversion',
      error: error.message
    });
  }
});

// Route pour les KPIs
router.get('/kpis', authenticateToken, async (req, res) => {
  try {
    const kpis = {
      revenue: { current: 125000, target: 150000, growth: 12.5 },
      orders: { current: 342, target: 400, growth: 8.3 },
      clients: { current: 89, target: 100, growth: 15.2 },
      satisfaction: { current: 4.2, target: 4.5, growth: 2.4 }
    };

    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des KPIs',
      error: error.message
    });
  }
});

// Route pour les statistiques POS
router.get('/pos', authenticateToken, async (req, res) => {
  try {
    const posStats = {
      totalTransactions: 1250,
      dailyRevenue: 8500,
      averageTicket: 68,
      topSellingProducts: [
        { id: 1, name: 'Produit POS A', quantity: 45 },
        { id: 2, name: 'Produit POS B', quantity: 32 },
        { id: 3, name: 'Produit POS C', quantity: 28 }
      ]
    };

    res.json({
      success: true,
      data: posStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques POS:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques POS',
      error: error.message
    });
  }
});

// Route pour les statistiques commerciales par ID
router.get('/commercial/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const commercialStats = {
      commercialId: id,
      revenue: 25000,
      target: 30000,
      orders: 45,
      clients: 12,
      performance: 83.3,
      monthlyTrend: [
        { month: 'Jan', revenue: 20000 },
        { month: 'Feb', revenue: 22000 },
        { month: 'Mar', revenue: 25000 }
      ]
    };

    res.json({
      success: true,
      data: commercialStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques commercial:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques commercial',
      error: error.message
    });
  }
});

// Route pour les statistiques utilisateur
router.get('/user-stats', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.query;
    const userStats = {
      userId: userId || req.user.id,
      role: role || req.user.role,
      stats: {
        admin: {
          'Utilisateurs gérés': 150,
          'CA du mois': '€125,000',
          'Commandes totales': 342,
          'Taux de croissance': '12.5%'
        },
        client: {
          'Commandes passées': 25,
          'Montant total': '€15,250',
          'Dernière commande': '2025-01-24',
          'Points fidélité': 1250
        },
        commercial: {
          'CA réalisé': '€25,000',
          'Objectif mensuel': '€30,000',
          'Clients gérés': 12,
          'Taux de réussite': '83.3%'
        },
        compta: {
          'Factures traitées': 156,
          'Montant facturé': '€125,000',
          'Factures en attente': 12,
          'Taux de recouvrement': '95.2%'
        }
      }[role || req.user.role] || {}
    };

    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques utilisateur',
      error: error.message
    });
  }
});

// Route pour les activités utilisateur
router.get('/user-activities', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const activities = [
      {
        id: 1,
        type: 'order',
        description: 'Nouvelle commande créée',
        timestamp: new Date().toISOString(),
        status: 'success'
      },
      {
        id: 2,
        type: 'client',
        description: 'Client ajouté au système',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'info'
      },
      {
        id: 3,
        type: 'report',
        description: 'Rapport mensuel généré',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'success'
      }
    ];

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des activités utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités utilisateur',
      error: error.message
    });
  }
});

// Route pour les analyses utilisateur
router.get('/user-analytics', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const analytics = {
      userId: userId || req.user.id,
      loginFrequency: 'Daily',
      averageSessionDuration: '45 minutes',
      mostUsedFeatures: ['Dashboard', 'Orders', 'Clients'],
      performanceMetrics: {
        efficiency: 85,
        accuracy: 92,
        productivity: 78
      },
      weeklyActivity: [
        { day: 'Lun', hours: 8 },
        { day: 'Mar', hours: 7.5 },
        { day: 'Mer', hours: 8.5 },
        { day: 'Jeu', hours: 8 },
        { day: 'Ven', hours: 7 }
      ]
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analyses utilisateur',
      error: error.message
    });
  }
});

module.exports = router;