import React, { useState } from 'react';

const PaymentProcessing = ({ total, onProcessPayment, disabled }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    const amount = parseFloat(amountReceived);
    if (Number.isNaN(amount) || amount < total) {
      alert('Veuillez saisir un montant reçu valide (>= total).');
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const order = onProcessPayment(paymentMethod, amount);
      setProcessing(false);
      setAmountReceived('');
      alert(`Paiement traité avec succès ! Commande #${order.id}`);
    }, 500);
  };

  const change = amountReceived ? parseFloat(amountReceived || '0') - total : 0;

  return (
    <div className="payment-processing p-4 bg-white rounded-lg shadow-md border">
      <h4 className="text-lg font-semibold mb-3">Paiement</h4>

      <div className="payment-method mb-3">
        <label className="block text-sm text-gray-600 mb-1">Méthode de paiement</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          disabled={disabled}
          className="w-full border rounded px-3 py-2"
        >
          <option value="cash">Espèces</option>
          <option value="check">Chèque</option>
          <option value="transfer">Virement</option>
        </select>
      </div>

      <div className="payment-amount mb-3">
        <label className="block text-sm text-gray-600 mb-1">Montant reçu</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amountReceived}
          onChange={(e) => setAmountReceived(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">Total à payer</span>
        <span className="font-semibold">{total.toFixed(2)} DH</span>
      </div>

      {amountReceived && (
        <div className="change-calculation flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Monnaie à rendre</span>
          <span className={`font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change.toFixed(2)} DH
          </span>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={disabled || processing || !amountReceived || parseFloat(amountReceived || '0') < total}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 rounded transition-colors"
      >
        {processing ? 'Traitement...' : 'Encaisser'}
      </button>
    </div>
  );
};

export default PaymentProcessing;
