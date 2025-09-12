// Utilitaire pour la gestion de la devise - Dirham Marocain (MAD)

/**
 * Formate un montant en dirham marocain
 * @param {number} amount - Le montant à formater
 * @param {object} options - Options de formatage
 * @returns {string} - Le montant formaté en MAD
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    locale = 'fr-MA',
    currency = 'MAD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 DH';
  }

  if (showSymbol) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(amount);
  } else {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits
    }).format(amount);
  }
};

/**
 * Formate un montant en dirham avec le symbole DH
 * @param {number} amount - Le montant à formater
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} - Le montant formaté avec DH
 */
export const formatMAD = (amount, decimals = 2) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 DH';
  }
  
  return `${amount.toLocaleString('fr-MA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} DH`;
};

/**
 * Convertit un prix d'une autre devise vers MAD
 * @param {number} amount - Le montant à convertir
 * @param {string} fromCurrency - Devise source (EUR, USD, etc.)
 * @param {number} exchangeRate - Taux de change vers MAD
 * @returns {number} - Le montant converti en MAD
 */
export const convertToMAD = (amount, fromCurrency = 'EUR', exchangeRate = 10.8) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  
  // Taux de change approximatifs vers MAD
  const rates = {
    'EUR': 10.8,
    'USD': 10.0,
    'GBP': 12.5,
    'MAD': 1.0
  };
  
  const rate = rates[fromCurrency] || exchangeRate;
  return amount * rate;
};

/**
 * Parse un montant depuis une chaîne formatée
 * @param {string} formattedAmount - Montant formaté (ex: "1 234,56 DH")
 * @returns {number} - Le montant numérique
 */
export const parseMAD = (formattedAmount) => {
  if (typeof formattedAmount !== 'string') {
    return 0;
  }
  
  // Supprimer les espaces, DH, MAD et autres caractères non numériques
  const cleanAmount = formattedAmount
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleanAmount);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calcule la TVA marocaine (20%)
 * @param {number} amountHT - Montant hors taxes
 * @returns {object} - Objet avec montant HT, TVA et TTC
 */
export const calculateTVA = (amountHT) => {
  const tvaRate = 0.20; // 20% TVA au Maroc
  const tvaAmount = amountHT * tvaRate;
  const amountTTC = amountHT + tvaAmount;
  
  return {
    amountHT: amountHT,
    tvaAmount: tvaAmount,
    amountTTC: amountTTC,
    tvaRate: tvaRate
  };
};

/**
 * Alias pour calculateTVA pour compatibilité avec le service de rapports
 */
export const calculateVAT = calculateTVA;

/**
 * Calcule le montant TTC à partir du montant HT
 * @param {number} amountHT - Montant hors taxes
 * @param {number} rate - Taux de TVA (par défaut 20%)
 * @returns {number} - Montant toutes taxes comprises
 */
export const calculateTTC = (amountHT, rate = 0.20) => {
  if (typeof amountHT !== 'number' || isNaN(amountHT)) {
    return 0;
  }
  
  return amountHT * (1 + rate);
};

/**
 * Calcule le montant HT à partir du montant TTC
 * @param {number} amountTTC - Montant toutes taxes comprises
 * @param {number} rate - Taux de TVA (par défaut 20%)
 * @returns {number} - Montant hors taxes
 */
export const calculateHT = (amountTTC, rate = 0.20) => {
  if (typeof amountTTC !== 'number' || isNaN(amountTTC)) {
    return 0;
  }
  
  return amountTTC / (1 + rate);
};

/**
 * Calcule une remise
 * @param {number} amount - Montant de base
 * @param {number} discountPercent - Pourcentage de remise
 * @returns {number} - Montant de la remise
 */
export const calculateDiscount = (amount, discountPercent) => {
  if (typeof amount !== 'number' || typeof discountPercent !== 'number' || isNaN(amount) || isNaN(discountPercent)) {
    return 0;
  }
  
  return amount * (discountPercent / 100);
};

/**
 * Applique une remise à un montant
 * @param {number} amount - Montant de base
 * @param {number} discountPercent - Pourcentage de remise
 * @returns {number} - Montant après remise
 */
export const applyDiscount = (amount, discountPercent) => {
  if (typeof amount !== 'number' || typeof discountPercent !== 'number' || isNaN(amount) || isNaN(discountPercent)) {
    return amount || 0;
  }
  
  return amount - calculateDiscount(amount, discountPercent);
};

/**
 * Arrondit un montant à 2 décimales
 * @param {number} amount - Montant à arrondir
 * @returns {number} - Montant arrondi
 */
export const roundAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  
  return Math.round(amount * 100) / 100;
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur à formater en pourcentage
 * @param {number} decimals - Nombre de décimales
 * @returns {string} - Pourcentage formaté
 */
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

// Constantes pour la devise
export const CURRENCY = {
  CODE: 'MAD',
  SYMBOL: 'DH',
  NAME: 'Dirham Marocain',
  LOCALE: 'fr-MA',
  TVA_RATE: 0.20
};

export default {
  formatCurrency,
  formatMAD,
  convertToMAD,
  parseMAD,
  calculateTVA,
  calculateVAT,
  calculateTTC,
  calculateHT,
  calculateDiscount,
  applyDiscount,
  roundAmount,
  formatPercentage,
  CURRENCY
};