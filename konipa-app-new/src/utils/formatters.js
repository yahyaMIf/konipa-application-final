// Utilitaires de formatage

/**
 * Formate un montant en dirhams marocains (MAD)
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté avec la devise
 */
export const formatMAD = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 MAD';
  }
  
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formate un nombre avec des séparateurs de milliers
 * @param {number} number - Le nombre à formater
 * @returns {string} Le nombre formaté
 */
export const formatNumber = (number) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }
  
  return new Intl.NumberFormat('fr-FR').format(number);
};

/**
 * Formate un pourcentage
 * @param {number} value - La valeur à formater en pourcentage
 * @param {number} decimals - Nombre de décimales (défaut: 1)
 * @returns {string} Le pourcentage formaté
 */
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formate une date au format français
 * @param {string|Date} date - La date à formater
 * @returns {string} La date formatée
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

/**
 * Formate une date et heure au format français
 * @param {string|Date} date - La date à formater
 * @returns {string} La date et heure formatées
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};