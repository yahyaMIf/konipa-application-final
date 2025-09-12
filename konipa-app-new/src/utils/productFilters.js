// Utilitaires pour filtrer les produits par type

/**
 * Filtre les produits par type
 * @param {Array} products - Liste des produits
 * @param {string} productType - Type de produit ('promo', 'destockage', 'nouveaute', 'normal')
 * @returns {Array} Produits filtrés
 */
export const filterProductsByType = (products, productType) => {
  if (!products || !Array.isArray(products)) {
    return [];
  }
  
  return products.filter(product => product.productType === productType);
};

/**
 * Obtient les produits en promotion
 * @param {Array} products - Liste des produits
 * @returns {Array} Produits en promotion
 */
export const getPromoProducts = (products) => {
  return filterProductsByType(products, 'promo');
};

/**
 * Obtient les produits en déstockage
 * @param {Array} products - Liste des produits
 * @returns {Array} Produits en déstockage
 */
export const getDestockageProducts = (products) => {
  return filterProductsByType(products, 'destockage');
};

/**
 * Obtient les nouveaux produits
 * @param {Array} products - Liste des produits
 * @returns {Array} Nouveaux produits
 */
export const getNouveauteProducts = (products) => {
  return filterProductsByType(products, 'nouveaute');
};

/**
 * Obtient les produits normaux (sans catégorie spéciale)
 * @param {Array} products - Liste des produits
 * @returns {Array} Produits normaux
 */
export const getNormalProducts = (products) => {
  return filterProductsByType(products, 'normal');
};

/**
 * Obtient tous les types de produits disponibles
 * @returns {Array} Types de produits
 */
export const getProductTypes = () => {
  return [
    { value: 'normal', label: 'Normal' },
    { value: 'promo', label: 'Promotion' },
    { value: 'destockage', label: 'Déstockage' },
    { value: 'nouveaute', label: 'Nouveauté' }
  ];
};

/**
 * Obtient le label d'un type de produit
 * @param {string} productType - Type de produit
 * @returns {string} Label du type
 */
export const getProductTypeLabel = (productType) => {
  const types = getProductTypes();
  const type = types.find(t => t.value === productType);
  return type ? type.label : 'Normal';
};