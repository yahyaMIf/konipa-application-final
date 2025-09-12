import React from 'react';

const DailySummary = ({ dailySales }) => {
  const today = new Date().toDateString();
  const todaySales = dailySales.filter(sale => 
    new Date(sale.date).toDateString() === today
  );

  const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = todaySales.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const paymentBreakdown = todaySales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    return acc;
  }, {});

  return (
    <div className="daily-summary">
      <h4>Today's Summary</h4>
      <div className="summary-stats">
        <div className="stat-card">
          <span className="stat-label">Total Sales</span>
          <span className="stat-value">${totalSales.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Orders</span>
          <span className="stat-value">{totalOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Order</span>
          <span className="stat-value">${averageOrderValue.toFixed(2)}</span>
        </div>
      </div>

      {Object.keys(paymentBreakdown).length > 0 && (
        <div className="payment-breakdown">
          <h5>Payment Methods</h5>
          {Object.entries(paymentBreakdown).map(([method, amount]) => (
            <div key={method} className="payment-item">
              <span className="payment-method">{method}</span>
              <span className="payment-amount">${amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailySummary;
