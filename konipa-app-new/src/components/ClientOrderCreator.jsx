import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, ShoppingCart, User, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { productService, userService, pricingService, orderService } from '../services/dataService';

const ClientOrderCreator = ({ onClose, onOrderCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Sélection client, 2: Sélection produits, 3: Confirmation
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsData, productsData] = await Promise.all([
          userService.getUsers().then(users => users.filter(user => user.role === 'client')),
          productService.getProducts()
        ]);
        setClients(clientsData);
        setProducts(productsData);
      } catch (error) {
        setClients([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductPrice = async (product) => {
    if (selectedClient) {
      try {
        const clientPrice = await pricingService.getClientPrice(selectedClient.id, product.id);
        return clientPrice || product.price;
      } catch (error) {
        }
    }
    return product.price;
  };

  const addToOrder = async (product) => {
    const existingItem = orderItems.find(item => item.id === product.id);
    if (existingItem) {
      setOrderItems(prev => prev.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const clientPrice = await getProductPrice(product);
      setOrderItems(prev => [...prev, {
        ...product,
        quantity: 1,
        clientPrice: clientPrice
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.id !== productId));
    } else {
      setOrderItems(prev => prev.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getOrderTotal = () => {
    return orderItems.reduce((total, item) => total + (item.clientPrice * item.quantity), 0);
  };

  const createOrder = async () => {
    if (!selectedClient || orderItems.length === 0) {
      alert('Veuillez sélectionner un client et ajouter des produits');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email,
        items: orderItems.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.clientPrice,
          total: item.clientPrice * item.quantity
        })),
        total: getOrderTotal(),
        status: 'pending',
        source: 'accountant',
        createdBy: user.id,
        createdByRole: 'accountant',
        metadata: {
          createdByAccountant: true,
          accountantId: user?.id,
          accountantName: user?.name,
          clientName: selectedClient.name,
          clientEmail: selectedClient.email
        },
        notes: orderNotes || `Commande créée par le comptable ${user?.name || 'Comptable'} pour le client ${selectedClient.name}`,
        createdAt: new Date().toISOString()
      };

      const newOrder = await orderService.createOrder(orderData);
      
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }
      
      alert('Commande créée avec succès!');
      onClose();
    } catch (error) {
      alert('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const renderClientSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sélectionner un client</h3>
      
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredClients.map(client => (
          <div
            key={client.id}
            onClick={() => {
              setSelectedClient(client);
              setStep(2);
              setSearchTerm('');
            }}
            className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300"
          >
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-gray-500">{client.email}</p>
                <p className="text-xs text-gray-400">{client.company || 'Particulier'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProductSelection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ajouter des produits</h3>
        <div className="text-sm text-gray-600">
          Client: <span className="font-medium">{selectedClient?.name}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liste des produits */}
        <div className="space-y-2">
          <h4 className="font-medium">Produits disponibles</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredProducts.map(product => {
              const price = product.price; // Will be updated when added to cart
              const inCart = orderItems.find(item => item.id === product.id);
              
              return (
                <div key={product.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.brand}</p>
                      <p className="text-sm font-semibold text-green-600">
                        {price.toFixed(2)} € {price !== product.price && (
                          <span className="text-xs text-gray-400 line-through ml-1">
                            {product.price.toFixed(2)} €
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => addToOrder(product)}
                      disabled={inCart}
                      className={`px-3 py-1 rounded text-sm ${
                        inCart 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {inCart ? 'Ajouté' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panier */}
        <div className="space-y-2">
          <h4 className="font-medium">Panier ({orderItems.length} articles)</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun produit sélectionné</p>
            ) : (
              orderItems.map(item => (
                <div key={item.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.brand}</p>
                      <p className="text-sm font-semibold text-green-600">
                        {item.clientPrice.toFixed(2)} € × {item.quantity} = {(item.clientPrice * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {orderItems.length > 0 && (
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Total:</span>
                <span>{getOrderTotal().toFixed(2)} €</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Confirmer la commande</h3>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Informations client</h4>
        <p><strong>Nom:</strong> {selectedClient?.name}</p>
        <p><strong>Email:</strong> {selectedClient?.email}</p>
        <p><strong>Entreprise:</strong> {selectedClient?.company || 'Particulier'}</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Résumé de la commande</h4>
        <div className="space-y-2">
          {orderItems.map(item => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name} × {item.quantity}</span>
              <span>{(item.clientPrice * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div className="border-t pt-2 font-semibold flex justify-between">
            <span>Total:</span>
            <span>{getOrderTotal().toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Notes ou instructions spéciales..."
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Créer une commande client</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center mb-6">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2">Client</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2">Produits</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2">Confirmation</span>
          </div>
        </div>

        {/* Contenu selon l'étape */}
        <div className="mb-6">
          {step === 1 && renderClientSelection()}
          {step === 2 && renderProductSelection()}
          {step === 3 && renderConfirmation()}
        </div>

        {/* Boutons de navigation */}
        <div className="flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Précédent
              </button>
            )}
          </div>
          <div className="space-x-2">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !selectedClient || step === 2 && orderItems.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={createOrder}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Créer la commande
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderCreator;