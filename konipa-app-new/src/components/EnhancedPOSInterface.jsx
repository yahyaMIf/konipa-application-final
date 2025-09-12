import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Package, Users, DollarSign, Clock, Printer, Download } from 'lucide-react';
import DocumentService from '../services/DocumentService';

const EnhancedPOSInterface = ({ 
  posStats, 
  dailySales, 
  products, 
  onStockAlert, 
  onGenerateReport 
}) => {
  const [alerts, setAlerts] = useState([]);
  const [reportType, setReportType] = useState('daily');
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    // Check for low stock alerts
    const lowStockItems = products.filter(product => product.stock <= 10);
    const newAlerts = lowStockItems.map(item => ({
      id: item.id,
      type: 'stock',
      message: `Stock faible: ${item.name} (${item.stock} unités)`,
      severity: item.stock <= 5 ? 'critical' : 'warning',
      timestamp: new Date().toISOString()
    }));
    setAlerts(newAlerts);
  }, [products]);

  const generateDailyReport = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = dailySales.filter(sale => 
      sale.date.split('T')[0] === today
    );
    
    const reportData = {
      date: today,
      totalSales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
      transactionCount: todaySales.length,
      averageTransaction: todaySales.length > 0 
        ? todaySales.reduce((sum, sale) => sum + sale.total, 0) / todaySales.length 
        : 0,
      topProducts: getTopProducts(todaySales),
      paymentMethods: getPaymentMethodBreakdown(todaySales),
      hourlyBreakdown: getHourlyBreakdown(todaySales)
    };
    
    try {
      // Essayer d'utiliser DocumentService en premier
      await DocumentService.generateDailyReport(reportData);
    } catch (error) {
      // Fallback vers le callback existant
      onGenerateReport?.(reportData, 'daily');
    }
  };

  const getTopProducts = (sales) => {
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (productSales[item.id]) {
          productSales[item.id].quantity += item.quantity;
          productSales[item.id].revenue += item.totalPrice || (item.price * item.quantity);
        } else {
          productSales[item.id] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.totalPrice || (item.price * item.quantity)
          };
        }
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getPaymentMethodBreakdown = (sales) => {
    const methods = {};
    sales.forEach(sale => {
      if (methods[sale.paymentMethod]) {
        methods[sale.paymentMethod] += sale.total;
      } else {
        methods[sale.paymentMethod] = sale.total;
      }
    });
    return methods;
  };

  const getHourlyBreakdown = (sales) => {
    const hourly = {};
    sales.forEach(sale => {
      const hour = new Date(sale.date).getHours();
      if (hourly[hour]) {
        hourly[hour] += sale.total;
      } else {
        hourly[hour] = sale.total;
      }
    });
    return hourly;
  };

  return (
    <div className="enhanced-pos-interface">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section mb-4">
          <h4 className="flex items-center gap-2 text-orange-600 mb-2">
            <AlertTriangle size={20} />
            Alertes ({alerts.length})
          </h4>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical' 
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-yellow-50 border-yellow-500 text-yellow-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{alert.message}</span>
                  <button 
                    onClick={() => onStockAlert(alert)}
                    className="text-sm underline hover:no-underline"
                  >
                    Gérer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Stats Cards */}
      <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-blue-800">
                {posStats.dailyRevenue?.toLocaleString() || 0} DH
              </p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp size={16} className="text-green-500 mr-1" />
            <span className="text-green-600">+12% vs hier</span>
          </div>
        </div>

        <div className="stat-card bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Transactions</p>
              <p className="text-2xl font-bold text-green-800">
                {posStats.transactionsToday || 0}
              </p>
            </div>
            <Clock className="text-green-500" size={24} />
          </div>
          <div className="mt-2 text-sm text-green-600">
            Moyenne: {(posStats.averageTransaction || 0).toLocaleString()} DH
          </div>
        </div>

        <div className="stat-card bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Clients Servis</p>
              <p className="text-2xl font-bold text-purple-800">
                {posStats.customersServed || 0}
              </p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
          <div className="mt-2 text-sm text-purple-600">
            Taux de satisfaction: 98%
          </div>
        </div>

        <div className="stat-card bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Produits Actifs</p>
              <p className="text-2xl font-bold text-orange-800">
                {products.filter(p => p.stock > 0).length}
              </p>
            </div>
            <Package className="text-orange-500" size={24} />
          </div>
          <div className="mt-2 text-sm text-orange-600">
            {alerts.length} alertes stock
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions mb-6">
        <h4 className="text-lg font-semibold mb-3">Actions Rapides</h4>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generateDailyReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Rapport Journalier
          </button>
          
          <button 
            onClick={() => setShowReports(!showReports)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <TrendingUp size={16} />
            Analyses
          </button>
          
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Printer size={16} />
            Imprimer Résumé
          </button>
        </div>
      </div>

      {/* Reports Section */}
      {showReports && (
        <div className="reports-section bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Rapports et Analyses</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="report-card bg-white p-4 rounded border">
              <h5 className="font-medium mb-2">Ventes par Heure</h5>
              <div className="text-sm text-gray-600">
                Pic de vente: 14h-16h (35% du CA)
              </div>
            </div>
            
            <div className="report-card bg-white p-4 rounded border">
              <h5 className="font-medium mb-2">Méthodes de Paiement</h5>
              <div className="text-sm text-gray-600">
                Espèces: 60% | Carte: 35% | Chèque: 5%
              </div>
            </div>
            
            <div className="report-card bg-white p-4 rounded border">
              <h5 className="font-medium mb-2">Produits Populaires</h5>
              <div className="text-sm text-gray-600">
                Top 3: Café, Croissant, Sandwich
              </div>
            </div>
            
            <div className="report-card bg-white p-4 rounded border">
              <h5 className="font-medium mb-2">Performance</h5>
              <div className="text-sm text-gray-600">
                Objectif journalier: 85% atteint
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPOSInterface;