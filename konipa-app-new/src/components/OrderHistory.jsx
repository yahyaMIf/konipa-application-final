import React from 'react';

const OrderHistory = ({ orders, onViewInvoice, onShowInvoice }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffa500',
      processing: '#007bff',
      shipped: '#28a745',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="order-history">
      <h3>Order History</h3>
      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">{order.id}</span>
                <span 
                  className="order-status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>
              
              <div className="order-details">
                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
                <p>Items: {order.items.length}</p>
                <p>Total: ${order.total.toFixed(2)}</p>
                <p>Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</p>
              </div>

              <div className="order-actions">
                <button 
                  onClick={() => {
                    onViewInvoice(order);
                    onShowInvoice(true);
                  }}
                  className="view-invoice-btn"
                >
                  View Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
