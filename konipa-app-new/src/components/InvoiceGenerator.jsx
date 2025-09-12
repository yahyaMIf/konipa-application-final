import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DocumentService from '../services/DocumentService';
import { apiService } from '../services/api';

const InvoiceGenerator = ({ isOpen, onClose, orderData = null }) => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `FAC-${Date.now()}`, // Génération automatique
    date: new Date().toLocaleDateString('fr-FR'),
    time: new Date().toLocaleTimeString('fr-FR'),
    bcNumber: '',
    customerName: '',
    representative: '',
    expedition: '',
    address: '',
    postalCode: '',
    paymentMode: 'E/C:ESPECES A 60 Jours',
    ssi: '',
    pqu: '',
    cirl: '',
    products: [
      {
        reference: '',
        designation: '',
        quantity: 1,
        unitPrice: 0
      },
      {
        reference: 'x 10630-T 710657-T',
        designation: 'RENAULT CLIO II',
        quantity: 1,
        unitPrice: 52.30
      }
    ]
  });

  const printRef = useRef();

  // Données chargées depuis l'API
  const [sageClients, setSageClients] = useState([]);
  const [sageProducts, setSageProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données depuis l'API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsResponse, productsResponse] = await Promise.all([
          apiService.get('/clients'),
          apiService.get('/products')
        ]);
        
        setSageClients(clientsResponse.data?.clients || []);
        setSageProducts(productsResponse.data?.products || []);
      } catch (err) {
        setError(err.message);
        // Données de secours en cas d'erreur
        setSageClients([
          { id: 1, name: 'ELYAZID PIECES AUTO', address: 'Avenue Palestine, Kenitra', postalCode: '14000 KENITRA' },
          { id: 2, name: 'GARAGE MODERNE', address: 'Rue de Rabat, Casablanca', postalCode: '20000 CASABLANCA' }
        ]);
        setSageProducts([
          { reference: '210202CT X10452-T', designation: 'SOUFFLET DE CARDAN DACIA LODGY 12-> LOGAN II 15->', unitPrice: 45.50 },
          { reference: '10463', designation: 'SOUFFLET DECARDAN EXT DACIALOGAN 10-> SANDERO 10->', unitPrice: 38.75 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const [representatives] = useState([
    'SALAH SALAH',
    'ABDELLAH BENNANI',
    'HAMIM ALAOUI',
    'AYOUB TAZI',
    'OMAR FASSI'
  ]);

  const [isFormMode, setIsFormMode] = useState(true);

  const handleClientSelect = (client) => {
    setInvoiceData({
      ...invoiceData,
      customerName: client.name,
      address: client.address,
      postalCode: client.postalCode
    });
  };

  const handleProductSelect = (index, product) => {
    const updatedProducts = [...invoiceData.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      reference: product.reference,
      designation: product.designation,
      unitPrice: product.unitPrice
    };
    setInvoiceData({ ...invoiceData, products: updatedProducts });
  };

  const updateInvoiceData = (field, value) => {
    setInvoiceData({ ...invoiceData, [field]: value });
  };

  const updateProductData = (index, field, value) => {
    const updatedProducts = [...invoiceData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setInvoiceData({ ...invoiceData, products: updatedProducts });
  };

  const calculateSubtotal = () => {
    return invoiceData.products.reduce((sum, product) => {
      return sum + (product.quantity * product.unitPrice);
    }, 0);
  };

  const calculateTVA = (subtotal) => {
    return subtotal * 0.20;
  };

  const calculateTimbre = (subtotal) => {
    return subtotal * 0.0025;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tva = calculateTVA(subtotal);
    const timbre = calculateTimbre(subtotal);
    return subtotal + tva + timbre;
  };

  const formatMAD = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    await generatePDF();
  };

  const generatePDF = async () => {
    try {
      // Essayer d'utiliser DocumentService en premier
      try {
        await DocumentService.generateInvoice(invoiceData);
        return;
      } catch (docServiceError) {
        }
      
      // Fallback vers jsPDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // En-tête de l'entreprise
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('KONIPA SARL', margin, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Import et distribution des pièces de rechange automobiles et agricoles.', margin, 35);
      
      // Retour au texte noir
      doc.setTextColor(0, 0, 0);
      yPosition = 60;
      
      // Informations de contact
      doc.setFontSize(9);
      doc.text('Tél : 0522 60 72 72 / 0522 60 39 74', margin, yPosition);
      yPosition += 10;
      doc.text('RC.N° 333143 - CNSS N° 4623270 - patente.N° 31420009 - IF 15274947 - ICE 000183282000035', margin, yPosition);
      yPosition += 15;
      
      // Titre de la facture
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Informations de la facture
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Colonne gauche - Info facture
      doc.setFont('helvetica', 'bold');
      doc.text('Facture N°:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.invoiceNumber, margin + 30, yPosition);
      
      doc.setFont('helvetica', 'bold');
      doc.text('BC N°:', margin, yPosition + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.bcNumber, margin + 30, yPosition + 8);
      
      // Colonne droite - Date
      doc.text(`Casablanca le, ${invoiceData.date}`, pageWidth - margin - 50, yPosition);
      doc.text(invoiceData.time, pageWidth - margin - 50, yPosition + 8);
      
      yPosition += 25;
      
      // Informations client
      doc.setFont('helvetica', 'bold');
      doc.text('Client:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 8;
      doc.text(invoiceData.customerName, margin, yPosition);
      yPosition += 6;
      doc.text(invoiceData.address, margin, yPosition);
      yPosition += 6;
      doc.text(invoiceData.postalCode, margin, yPosition);
      
      // Informations commerciales (colonne droite)
      const rightColumnX = pageWidth - margin - 80;
      let rightY = yPosition - 20;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Représentant:', rightColumnX, rightY);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.representative, rightColumnX + 35, rightY);
      
      rightY += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Mode de Paiement:', rightColumnX, rightY);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.paymentMode, rightColumnX, rightY + 6);
      
      yPosition += 30;
      
      // Tableau des produits
      const tableColumns = [
        { header: 'Référence', dataKey: 'reference' },
        { header: 'Désignation', dataKey: 'designation' },
        { header: 'Qté', dataKey: 'quantity' },
        { header: 'Prix Unit.', dataKey: 'unitPrice' },
        { header: 'Total', dataKey: 'total' }
      ];
      
      const tableRows = invoiceData.products.map(product => ({
        reference: product.reference,
        designation: product.designation,
        quantity: product.quantity,
        unitPrice: `${product.unitPrice.toFixed(2)} MAD`,
        total: `${(product.quantity * product.unitPrice).toFixed(2)} MAD`
      }));
      
      doc.autoTable({
        columns: tableColumns,
        body: tableRows,
        startY: yPosition,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          2: { halign: 'center' }, // Quantité
          3: { halign: 'right' },  // Prix unitaire
          4: { halign: 'right' }   // Total
        }
      });
      
      // Calculs des totaux
      const subtotal = invoiceData.products.reduce((sum, product) => 
        sum + (product.quantity * product.unitPrice), 0);
      const tva = subtotal * 0.20;
      const timbre = subtotal * 0.0025;
      const totalTTC = subtotal + tva + timbre;
      const totalQuantity = invoiceData.products.reduce((sum, product) => 
        sum + product.quantity, 0);
      
      // Position après le tableau
      yPosition = doc.lastAutoTable.finalY + 20;
      
      // Totaux (alignés à droite)
      const totalsX = pageWidth - margin - 60;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Sous-total HT:', totalsX - 40, yPosition);
      doc.text(`${subtotal.toFixed(2)} MAD`, totalsX, yPosition);
      
      yPosition += 8;
      doc.text('TVA à 20%:', totalsX - 40, yPosition);
      doc.text(`${tva.toFixed(2)} MAD`, totalsX, yPosition);
      
      yPosition += 8;
      doc.text('Droits de timbre (0,25%):', totalsX - 40, yPosition);
      doc.text(`${timbre.toFixed(2)} MAD`, totalsX, yPosition);
      
      yPosition += 8;
      doc.text('Qté Article:', totalsX - 40, yPosition);
      doc.text(totalQuantity.toString(), totalsX, yPosition);
      
      yPosition += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL TTC:', totalsX - 40, yPosition);
      doc.text(`${totalTTC.toFixed(2)} MAD`, totalsX, yPosition);
      
      // Pied de page
      const footerY = doc.internal.pageSize.height - 30;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('RIB AWB N° : 007780000010500000393746', margin, footerY);
      
      // Sauvegarder le PDF
      doc.save(`facture-${invoiceData.invoiceNumber}.pdf`);
      
      alert('Facture PDF générée avec succès!');
    } catch (error) {
      alert('Erreur lors de la génération du PDF');
    }
  };

  const addProduct = () => {
    setInvoiceData({
      ...invoiceData,
      products: [...invoiceData.products, {
        reference: '',
        designation: '',
        quantity: 1,
        unitPrice: 0
      }]
    });
  };

  const updateProduct = (index, field, value) => {
    const updatedProducts = [...invoiceData.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setInvoiceData({
      ...invoiceData,
      products: updatedProducts
    });
  };

  const removeProduct = (index) => {
    const updatedProducts = invoiceData.products.filter((_, i) => i !== index);
    setInvoiceData({
      ...invoiceData,
      products: updatedProducts
    });
  };

  if (!isOpen) return null;

  // Affichage du chargement
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">
            <h3 className="text-lg font-semibold">Erreur de chargement</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tva = calculateTVA(subtotal);
  const timbre = calculateTimbre(subtotal);
  const total = calculateTotal();
  const totalQuantity = invoiceData.products.reduce((sum, product) => sum + product.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Générateur de Facture
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFormMode(!isFormMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                isFormMode 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isFormMode ? 'Aperçu' : 'Modifier'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isFormMode}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={isFormMode}
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={printRef} className="p-6">
          {isFormMode ? (
            // Mode Formulaire
            <div>
          {/* Company Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-800">KONIPA SARL</h1>
            <p className="text-sm text-gray-600">Import et distribution des pièces de rechange automobiles et agricoles.</p>
            <p className="text-sm text-gray-600">Tél : 0522 60 72 72 / 0522 60 39 74</p>
            <p className="text-sm text-gray-600">1451079</p>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Facture N°</label>
                <input
                  type="text"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">BC N°</label>
                <input
                  type="text"
                  value={invoiceData.bcNumber}
                  onChange={(e) => setInvoiceData({...invoiceData, bcNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">Casablanca le, {invoiceData.date}</p>
              <p className="text-sm">{invoiceData.time}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Client:</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner depuis Sage</label>
                <select
                  onChange={(e) => {
                    const client = sageClients.find(c => c.id === parseInt(e.target.value));
                    if (client) handleClientSelect(client);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                >
                  <option value="">-- Choisir un client --</option>
                  {sageClients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={invoiceData.customerName}
                onChange={(e) => updateInvoiceData('customerName', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                placeholder="Ou saisir manuellement"
              />
              <input
                type="text"
                value={invoiceData.address}
                onChange={(e) => updateInvoiceData('address', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                placeholder="Adresse"
              />
              <input
                type="text"
                value={invoiceData.postalCode}
                onChange={(e) => updateInvoiceData('postalCode', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Code postal et ville"
              />
            </div>
            <div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Nom Représentant:</label>
                <select
                  value={invoiceData.representative}
                  onChange={(e) => updateInvoiceData('representative', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">-- Choisir un représentant --</option>
                  {representatives.map(rep => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Mode de Paiement:</label>
                <select
                  value={invoiceData.paymentMode}
                  onChange={(e) => updateInvoiceData('paymentMode', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">-- Choisir mode de paiement --</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Carte bancaire">Carte bancaire</option>
                  <option value="Crédit">Crédit</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">SSI:</label>
                  <input
                    type="text"
                    value={invoiceData.ssi}
                    onChange={(e) => updateInvoiceData('ssi', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PQU:</label>
                  <input
                    type="text"
                    value={invoiceData.pqu}
                    onChange={(e) => updateInvoiceData('pqu', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Articles:</h3>
              <button
                onClick={addProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Ajouter Article
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Référence</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Désignation</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Qté</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Prix Unit.</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Total</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.products.map((product, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-3 py-2">
                        <div className="mb-1">
                          <select
                            onChange={(e) => {
                              const selectedProduct = sageProducts.find(p => p.reference === e.target.value);
                              if (selectedProduct) handleProductSelect(index, selectedProduct);
                            }}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs mb-1"
                          >
                            <option value="">-- Choisir depuis Sage --</option>
                            {sageProducts.map(sageProduct => (
                              <option key={sageProduct.reference} value={sageProduct.reference}>
                                {sageProduct.reference}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={product.reference}
                          onChange={(e) => updateProductData(index, 'reference', e.target.value)}
                          className="w-full border-0 focus:ring-0 text-sm"
                          placeholder="Ou saisir manuellement"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          value={product.designation}
                          onChange={(e) => updateProductData(index, 'designation', e.target.value)}
                          className="w-full border-0 focus:ring-0 text-sm"
                          placeholder="Désignation"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProductData(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-16 border-0 focus:ring-0 text-sm text-center"
                          min="1"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        <input
                          type="number"
                          value={product.unitPrice}
                          onChange={(e) => updateProductData(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 border-0 focus:ring-0 text-sm text-right"
                          step="0.01"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                        {formatMAD(product.quantity * product.unitPrice)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Suppr.
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span>Montant HT:</span>
                <span>{formatMAD(subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>TVA à 20%:</span>
                <span>{formatMAD(tva)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Droits de timbre (0,25%):</span>
                <span>{formatMAD(timbre)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Qté Article:</span>
                <span>{totalQuantity}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg border-b-2 border-black">
                <span>NET À PAYER:</span>
                <span>{formatMAD(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 border-t pt-4">
            <p>CIRL: {invoiceData.cirl}</p>
            <p>Adresse : 109 Rue Capitaine Thiriat, Ain Borja - Casablanca.</p>
            <p>S.A.R.L. au capital de 1.200 000,00Dhs</p>
            <p>RC.N° 333143 - CNSS N° 4623270 - patente.N° 31420009 - IF 15274947 - ICE 000183282000035</p>
            <p>RIB AWB N° : 007780000010500000393746</p>
          </div>
        </div>
          ) : (
            // Mode Aperçu
            <div>
              {/* Company Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-blue-800">KONIPA SARL</h1>
                <p className="text-sm text-gray-600">Import et distribution des pièces de rechange automobiles et agricoles.</p>
                <p className="text-sm text-gray-600">Tél : 0522 60 72 72 / 0522 60 39 74</p>
                <p className="text-sm text-gray-600">1451079</p>
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p><strong>Facture N°:</strong> {invoiceData.invoiceNumber}</p>
                  <p><strong>BC N°:</strong> {invoiceData.bcNumber}</p>
                </div>
                <div className="text-right">
                  <p>Casablanca le, {invoiceData.date}</p>
                  <p>{invoiceData.time}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Client:</h3>
                  <p>{invoiceData.customerName}</p>
                  <p>{invoiceData.address}</p>
                  <p>{invoiceData.postalCode}</p>
                </div>
                <div>
                  <p><strong>Représentant:</strong> {invoiceData.representative}</p>
                  <p><strong>Mode de Paiement:</strong> {invoiceData.paymentMode}</p>
                  <p><strong>SSI:</strong> {invoiceData.ssi}</p>
                  <p><strong>PQU:</strong> {invoiceData.pqu}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Articles:</h3>
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Référence</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Désignation</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Qté</th>
                      <th className="border border-gray-300 px-3 py-2 text-right">Prix Unit.</th>
                      <th className="border border-gray-300 px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.products.map((product, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2">{product.reference}</td>
                        <td className="border border-gray-300 px-3 py-2">{product.designation}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{product.quantity}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right">{formatMAD(product.unitPrice)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right">{formatMAD(product.quantity * product.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-6">
                <div></div>
                <div className="border border-gray-300 p-4">
                  <div className="flex justify-between py-2 border-b">
                    <span>Sous-total HT:</span>
                    <span>{formatMAD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>TVA à 20%:</span>
                    <span>{formatMAD(tva)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Droits de timbre (0,25%):</span>
                    <span>{formatMAD(timbre)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Qté Article:</span>
                    <span>{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-lg border-b-2 border-black">
                    <span>NET À PAYER:</span>
                    <span>{formatMAD(total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-600 border-t pt-4 mt-6">
                <p>CIRL: {invoiceData.cirl}</p>
                <p>Adresse : 109 Rue Capitaine Thiriat, Ain Borja - Casablanca.</p>
                <p>S.A.R.L. au capital de 1.200 000,00Dhs</p>
                <p>RC.N° 333143 - CNSS N° 4623270 - patente.N° 31420009 - IF 15274947 - ICE 000183282000035</p>
                <p>RIB AWB N° : 007780000010500000393746</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
