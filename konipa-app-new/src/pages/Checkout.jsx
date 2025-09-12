import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/dataService';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Shield, 
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatMAD } from '../utils/currency';

const Checkout = () => {
  const { items, recordPurchases, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Informations de livraison
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Maroc',
    
    // Informations de paiement
    paymentMethod: 'comptoir', // Paiement au comptoir par défaut
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Options de livraison
    deliveryOption: 'sh2t', // Transporteur marocain par défaut
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const cartItems = [
    {
      id: 1,
      name: 'Disque de frein avant',
      brand: 'BREMBO',
      reference: 'BR-09.A429.11',
      price: 89.9,
      quantity: 2
    },
    {
      id: 4,
      name: 'Filtre à huile',
      brand: 'MANN',
      reference: 'W712/75',
      price: 12.9,
      quantity: 1
    },
    {
      id: 8,
      name: 'Ressort de suspension',
      brand: 'EIBACH',
      reference: 'E10-15-021-02-22',
      price: 67,
      quantity: 1
    }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + shipping;

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (!formData.firstName) newErrors.firstName = 'Prénom requis';
      if (!formData.lastName) newErrors.lastName = 'Nom requis';
      if (!formData.email) newErrors.email = 'Email requis';
      if (!formData.phone) newErrors.phone = 'Téléphone requis';
      if (!formData.address) newErrors.address = 'Adresse requise';
      if (!formData.city) newErrors.city = 'Ville requise';
      if (!formData.postalCode) newErrors.postalCode = 'Code postal requis';
    }
    
    if (stepNumber === 2) {
      if (formData.paymentMethod === 'card') {
        if (!formData.cardNumber) newErrors.cardNumber = 'Numéro de carte requis';
        if (!formData.expiryDate) newErrors.expiryDate = 'Date d\'expiration requise';
        if (!formData.cvv) newErrors.cvv = 'CVV requis';
        if (!formData.cardName) newErrors.cardName = 'Nom sur la carte requis';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(step)) {
      try {
        // Mapper les méthodes de paiement frontend vers backend
        const paymentMethodMapping = {
          'card': 'credit_card',
          'comptoir': 'comptoir',
          'compte': 'compte',
          'transfer': 'bank_transfer'
        };

        // Créer la commande avec les données du panier et du formulaire
        const orderData = {
          clientId: user?.id || 'guest',
          clientName: `${formData.firstName} ${formData.lastName}`,
          clientEmail: formData.email,
          items: items.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          })),
          total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: formData.company,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            phone: formData.phone,
            email: formData.email
          },
          paymentMethod: paymentMethodMapping[formData.paymentMethod] || formData.paymentMethod,
          shippingMethod: formData.shippingMethod,
          notes: formData.notes || ''
        };

        // Sauvegarder la commande
        const newOrder = await orderService.createOrder(orderData);

        // Enregistrer les achats pour les clients
        if (user && user.role === 'client') {
          recordPurchases();
        }
        
        // Vider le panier après finalisation
        clearCart();
        
        // Aller à l'étape de confirmation
         setStep(4);
       } catch (error) {
         // Afficher une erreur à l'utilisateur
         alert('Erreur lors de la finalisation de la commande. Veuillez réessayer.');
       }
     }
   };

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl shadow-sm p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">Commande confirmée !</h1>
            <p className="text-gray-600 mb-6">
              Votre commande #KNP-2024-001 a été enregistrée avec succès.
            </p>
            
            <div className="bg-muted rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total payé :</span>
                    <span className="font-semibold ml-2">{formatMAD(total)}</span>
                  </div>
                <div>
                  <span className="text-gray-600">Livraison :</span>
                  <span className="font-semibold ml-2">24-48h</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link
                to="/orders"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                Suivre ma commande
              </Link>
              <Link
                to="/catalog"
                className="w-full bg-muted text-muted-foreground py-3 px-4 rounded-lg font-semibold hover:bg-muted/80 transition-colors inline-block"
              >
                Continuer mes achats
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour au panier</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Finaliser ma commande</h1>
          
          {/* Indicateur d'étapes */}
          <div className="flex items-center space-x-4 mt-6">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                <span className={`ml-2 text-sm ${
                  step >= stepNumber ? 'text-blue-600 font-semibold' : 'text-gray-500'
                }`}>
                  {stepNumber === 1 && 'Livraison'}
                  {stepNumber === 2 && 'Paiement'}
                  {stepNumber === 3 && 'Confirmation'}
                </span>
                {stepNumber < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl shadow-sm p-6">
              {/* Étape 1: Informations de livraison */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xl font-semibold text-foreground mb-6">Informations de livraison</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Votre prénom"
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Votre nom"
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Entreprise
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => updateFormData('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nom de votre entreprise"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="votre@email.com"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="+212 6 XX XX XX XX"
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Adresse *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.address ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Numéro et nom de rue"
                      />
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Ville *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.city ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Casablanca"
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => updateFormData('postalCode', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.postalCode ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="20000"
                      />
                      {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                    </div>
                  </div>
                  
                  {/* Options de livraison */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Transporteurs disponibles</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                        <input
                          type="radio"
                          name="delivery"
                          value="sh2t"
                          checked={formData.deliveryOption === 'sh2t'}
                          onChange={(e) => updateFormData('deliveryOption', e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">SH2T Express</span>
                            <span className="text-green-600 font-semibold">{formatMAD(45)}</span>
                          </div>
                          <p className="text-sm text-gray-600">Livraison rapide dans tout le Maroc - 24-48h</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                        <input
                          type="radio"
                          name="delivery"
                          value="jad"
                          checked={formData.deliveryOption === 'jad'}
                          onChange={(e) => updateFormData('deliveryOption', e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">JAD Transport</span>
                            <span className="font-semibold">{formatMAD(35)}</span>
                          </div>
                          <p className="text-sm text-gray-600">Service économique - 2-3 jours ouvrés</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                        <input
                          type="radio"
                          name="delivery"
                          value="ghazala"
                          checked={formData.deliveryOption === 'ghazala'}
                          onChange={(e) => updateFormData('deliveryOption', e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Ghazala Logistics</span>
                            <span className="font-semibold">{formatMAD(40)}</span>
                          </div>
                          <p className="text-sm text-gray-600">Service premium avec suivi GPS - 1-2 jours</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Étape 2: Paiement */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xl font-semibold text-foreground mb-6">Informations de paiement</h2>
                  
                  {/* Méthodes de paiement */}
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="payment"
                        value="comptoir"
                        checked={formData.paymentMethod === 'comptoir'}
                        onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                        className="text-blue-600"
                      />
                      <Building className="h-5 w-5 ml-3 text-gray-600" />
                      <div className="ml-3 flex-1">
                        <span className="font-medium">Paiement au comptoir</span>
                        <p className="text-sm text-gray-600">Payez directement lors de la récupération de votre commande</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="payment"
                        value="compte"
                        checked={formData.paymentMethod === 'compte'}
                        onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                        className="text-blue-600"
                      />
                      <CreditCard className="h-5 w-5 ml-3 text-gray-600" />
                      <div className="ml-3 flex-1">
                        <span className="font-medium">Paiement sur compte</span>
                        <p className="text-sm text-gray-600">Facturation sur votre compte client professionnel</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                        className="text-blue-600"
                      />
                      <CreditCard className="h-5 w-5 ml-3 text-green-600" />
                      <div className="ml-3 flex-1">
                        <span className="font-medium">Carte de crédit/débit</span>
                        <p className="text-sm text-gray-600">Paiement sécurisé par carte bancaire</p>
                      </div>
                    </label>
                  </div>
                  
                  {/* Informations supplémentaires pour paiement sur compte */}
                  {formData.paymentMethod === 'compte' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-blue-900">Paiement sur compte professionnel</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Cette commande sera facturée sur votre compte client. 
                            Vous recevrez une facture avec les conditions de paiement habituelles.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Informations pour paiement par carte */}
                  {formData.paymentMethod === 'card' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start mb-4">
                        <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-blue-900">Informations de carte bancaire</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Saisissez les informations de votre carte de crédit ou débit.
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Numéro de carte *
                          </label>
                          <input
                            type="text"
                            value={formData.cardNumber}
                            onChange={(e) => updateFormData('cardNumber', e.target.value)}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength="19"
                          />
                          {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date d'expiration *
                          </label>
                          <input
                            type="text"
                            value={formData.expiryDate}
                            onChange={(e) => updateFormData('expiryDate', e.target.value)}
                            placeholder="MM/AA"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength="5"
                          />
                          {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVV *
                          </label>
                          <input
                            type="text"
                            value={formData.cvv}
                            onChange={(e) => updateFormData('cvv', e.target.value)}
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength="4"
                          />
                          {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom sur la carte *
                          </label>
                          <input
                            type="text"
                            value={formData.cardName}
                            onChange={(e) => updateFormData('cardName', e.target.value)}
                            placeholder="Nom tel qu'il apparaît sur la carte"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Informations pour paiement au comptoir */}
                  {formData.paymentMethod === 'comptoir' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Building className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-green-900">Paiement au comptoir</h4>
                          <p className="text-sm text-green-700 mt-1">
                            Vous pourrez régler votre commande directement lors de la récupération. 
                            Moyens de paiement acceptés : espèces, chèque.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Étape 3: Confirmation */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xl font-semibold text-foreground mb-6">Confirmation de commande</h2>
                  
                  {/* Résumé livraison */}
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-foreground mb-3">Adresse de livraison</h3>
                    <div className="text-sm text-gray-600">
                      <p>{formData.firstName} {formData.lastName}</p>
                      {formData.company && <p>{formData.company}</p>}
                      <p>{formData.address}</p>
                      <p>{formData.postalCode} {formData.city}</p>
                      <p>{formData.country}</p>
                      <p className="mt-2">
                        <strong>Email :</strong> {formData.email}<br />
                        <strong>Téléphone :</strong> {formData.phone}
                      </p>
                    </div>
                  </div>
                  
                  {/* Résumé paiement */}
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-foreground mb-3">Mode de paiement</h3>
                    <div className="text-sm text-gray-600">

                      {formData.paymentMethod === 'transfer' && (
                        <p>Virement bancaire</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Articles commandés */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Articles commandés</h3>
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-border">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.brand} • {item.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatMAD(item.price * item.quantity)}</p>
                          <p className="text-sm text-gray-600">Qté: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Boutons de navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-6 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    Précédent
                  </button>
                )}
                
                <div className="ml-auto">
                  {step < 3 ? (
                    <button
                      onClick={nextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Suivant
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Finaliser la commande
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Résumé de commande */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Résumé</h2>
              
              {/* Articles */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-600">Qté: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatMAD(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              {/* Totaux */}
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatMAD(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>{shipping === 0 ? 'Gratuite' : formatMAD(shipping)}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatMAD(total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Avantages */}
              <div className="space-y-2 text-xs text-muted-foreground">

                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Paiement 100% sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

