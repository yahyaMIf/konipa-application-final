import React, { useState, useEffect } from 'react';
import { pricingService } from '../services/dataService';

const ShoppingCart = ({ cart, onRemoveFromCart, onUpdateQuantity, total, customer }) => {
  const calculateItemPrice = async (item, selectedCustomer) => {
    if (selectedCustomer) {
      try {
        const clientPrice = await pricingService.getClientPrice(selectedCustomer.id, item.id);
        return clientPrice !== null ? clientPrice : item.price;
      } catch (error) {
        return item.price;
      }
    }
    return item.price;
  };

  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [itemPrices, setItemPrices] = useState({});

  const calculateTotal = async () => {
    let newTotal = 0;
    const newItemPrices = {};
    for (const item of cart) {
      const itemPrice = await calculateItemPrice(item, customer);
      newItemPrices[item.id] = itemPrice;
      newTotal += itemPrice * item.quantity;
    }
    setItemPrices(newItemPrices);
    setCalculatedTotal(newTotal);
  };

  useEffect(() => {
    calculateTotal();
  }, [cart, customer]);

  return (
    <div className="shopping-cart">
      <h3 className="text-lg font-semibold mb-3">Panier</h3>
      {cart.length === 0 ? (
        <p className="empty-cart text-sm text-gray-600">Votre panier est vide</p>
      ) : (
        <>
          <div className="cart-items space-y-3">
            {cart.map(item => (
              <div key={item.id} className="cart-item border rounded-lg p-3 bg-white flex items-center justify-between">
                <div className="item-info">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-xs text-gray-500">Réf: {item.reference}</p>
                </div>
                <div className="item-controls flex items-center gap-3">
                  <div className="quantity-control flex items-center gap-2">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 rounded border disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-7 h-7 rounded border disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="item-price font-semibold text-blue-600">
                    {((itemPrices[item.id] || item.price) * item.quantity).toFixed(2)} DH
                  </span>
                  <button 
                    onClick={() => onRemoveFromCart(item.id)}
                    className="remove-btn text-red-600 hover:underline text-sm"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary mt-4 border-t pt-3">
            <div className="cart-total text-right">
              <strong>Total: {calculatedTotal.toFixed(2)} DH</strong>
            </div>
            {customer && (
              <div className="customer-info text-xs text-gray-600 mt-2">
                <p>Client: {customer.company || `${customer.firstName} ${customer.lastName}`}</p>
                <p>Tarification spéciale appliquée si disponible</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;
