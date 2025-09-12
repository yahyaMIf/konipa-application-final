const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Route pour les statistiques générales du dashboard
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Statistiques mockées pour le moment - à remplacer par de vraies données
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

    console.log('[DASHBOARD] Statistiques générales demandées par:', req.user.email);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// Route pour les graphiques de revenus
router.get('/charts/revenue', authenticateToken, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Données mockées pour les revenus
    const revenueData = {
      totalRevenue: 125000,
      monthlyRevenue: 45000,
      dailyAverage: 1500,
      growth: 12.5,
      chartData: [
        { date: '2025-01-01', revenue: 3200, orders: 12 },
        { date: '2025-01-02', revenue: 2800, orders: 10 },
        { date: '2025-01-03', revenue: 4100, orders: 15 },
        { date: '2025-01-04', revenue: 3500, orders: 13 },
        { date: '2025-01-05', revenue: 5200, orders: 18 },
        { date: '2025-01-06', revenue: 4800, orders: 16 },
        { date: '2025-01-07', revenue: 6100, orders: 22 }
      ]
    };

    console.log('[DASHBOARD] Données de revenus demandées pour la période:', range);
    
    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de revenus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de revenus',
      error: error.message
    });
  }
});

// Route pour les graphiques des commerciaux
router.get('/charts/sales-rep', authenticateToken, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Données mockées pour les commerciaux
    const salesRepData = {
      totalSalesReps: 12,
      activeSalesReps: 10,
      topPerformers: [
        { id: 1, name: 'Jean Dupont', revenue: 25000, target: 30000, achievement: 83.3 },
        { id: 2, name: 'Marie Martin', revenue: 22000, target: 25000, achievement: 88.0 },
        { id: 3, name: 'Pierre Durand', revenue: 20000, target: 22000, achievement: 90.9 }
      ],
      averagePerformance: 85.5,
      chartData: [
        { name: 'Jean Dupont', sales: 25000, target: 30000 },
        { name: 'Marie Martin', sales: 22000, target: 25000 },
        { name: 'Pierre Durand', sales: 20000, target: 22000 },
        { name: 'Sophie Leroy', sales: 18000, target: 20000 },
        { name: 'Marc Dubois', sales: 16000, target: 18000 }
      ]
    };

    console.log('[DASHBOARD] Données des commerciaux demandées pour la période:', range);
    
    res.json({
      success: true,
      data: salesRepData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données commerciaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données commerciaux',
      error: error.message
    });
  }
});

// Route pour les graphiques de conversion
router.get('/charts/conversion', authenticateToken, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Données mockées pour la conversion
    const conversionData = {
      visitorToLead: 15.2,
      leadToCustomer: 22.8,
      overallConversion: 3.5,
      funnelData: [
        { stage: 'Visiteurs', count: 10000, percentage: 100 },
        { stage: 'Leads', count: 1520, percentage: 15.2 },
        { stage: 'Prospects', count: 456, percentage: 4.56 },
        { stage: 'Clients', count: 104, percentage: 1.04 }
      ],
      chartData: [
        { date: '2025-01-01', visitors: 450, leads: 68, customers: 15 },
        { date: '2025-01-02', visitors: 380, leads: 57, customers: 13 },
        { date: '2025-01-03', visitors: 520, leads: 79, customers: 18 },
        { date: '2025-01-04', visitors: 410, leads: 62, customers: 14 },
        { date: '2025-01-05', visitors: 480, leads: 73, customers: 17 }
      ]
    };

    console.log('[DASHBOARD] Données de conversion demandées pour la période:', range);
    
    res.json({
      success: true,
      data: conversionData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de conversion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de conversion',
      error: error.message
    });
  }
});

// Route pour les graphiques des produits
router.get('/charts/products', authenticateToken, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Données mockées pour les produits
    const productData = {
      totalProducts: 156,
      activeProducts: 142,
      topSellingProducts: [
        { id: 1, name: 'Produit A', sales: 25000, quantity: 120, category: 'Électronique' },
        { id: 2, name: 'Produit B', sales: 18500, quantity: 95, category: 'Informatique' },
        { id: 3, name: 'Produit C', sales: 15200, quantity: 78, category: 'Accessoires' },
        { id: 4, name: 'Produit D', sales: 12800, quantity: 65, category: 'Électronique' },
        { id: 5, name: 'Produit E', sales: 10500, quantity: 52, category: 'Informatique' }
      ],
      categoryPerformance: [
        { category: 'Électronique', sales: 45000, products: 45 },
        { category: 'Informatique', sales: 38000, products: 52 },
        { category: 'Accessoires', sales: 25000, products: 35 },
        { category: 'Mobilier', sales: 17000, products: 24 }
      ]
    };

    console.log('[DASHBOARD] Données des produits demandées pour la période:', range);
    
    res.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données produits',
      error: error.message
    });
  }
});

// Route pour les graphiques des clients
router.get('/charts/clients', authenticateToken, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Données mockées pour les clients
    const clientData = {
      totalClients: 89,
      activeClients: 76,
      newClients: 12,
      topClients: [
        { id: 1, name: 'Client Premium', revenue: 15000, orders: 45, type: 'Premium' },
        { id: 2, name: 'Client Gold', revenue: 12000, orders: 32, type: 'Gold' },
        { id: 3, name: 'Client Silver', revenue: 9500, orders: 28, type: 'Silver' },
        { id: 4, name: 'Client Bronze', revenue: 7200, orders: 22, type: 'Bronze' },
        { id: 5, name: 'Client Standard', revenue: 5800, orders: 18, type: 'Standard' }
      ],
      clientsByType: [
        { type: 'Premium', count: 8, revenue: 45000 },
        { type: 'Gold', count: 15, revenue: 38000 },
        { type: 'Silver', count: 25, revenue: 28000 },
        { type: 'Bronze', count: 22, revenue: 18000 },
        { type: 'Standard', count: 19, revenue: 12000 }
      ]
    };

    console.log('[DASHBOARD] Données des clients demandées pour la période:', range);
    
    res.json({
      success: true,
      data: clientData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données clients',
      error: error.message
    });
  }
});

// Route pour les analyses utilisateur
router.get('/charts/user', authenticateToken, async (req, res) => {
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
        { day: 'Lun', hours: 8, sessions: 3 },
        { day: 'Mar', hours: 7.5, sessions: 2 },
        { day: 'Mer', hours: 8.5, sessions: 4 },
        { day: 'Jeu', hours: 8, sessions: 3 },
        { day: 'Ven', hours: 7, sessions: 2 }
      ]
    };

    console.log('[DASHBOARD] Analyses utilisateur demandées pour:', userId || req.user.email);
    
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