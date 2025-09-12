/**
 * Générateur de mots de passe sécurisés
 * Permet de créer des mots de passe avec différents niveaux de complexité
 */

// Caractères disponibles pour la génération
const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  specialSymbols: '~`!@#$%^&*()_+-=[]{}\\|;:\'",./<>?'
};

// Configurations prédéfinies
export const PASSWORD_PRESETS = {
  simple: {
    name: 'Simple',
    description: 'Lettres et chiffres uniquement',
    length: 8,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true
  },
  medium: {
    name: 'Moyen',
    description: 'Lettres, chiffres et symboles basiques',
    length: 12,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  },
  strong: {
    name: 'Fort',
    description: 'Tous les caractères avec longueur étendue',
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    includeSpecialSymbols: true,
    excludeSimilar: false
  },
  custom: {
    name: 'Personnalisé',
    description: 'Configuration personnalisée',
    length: 12,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true
  }
};

// Caractères similaires à exclure si demandé
const SIMILAR_CHARS = 'il1Lo0O';

/**
 * Génère un mot de passe selon les options spécifiées
 * @param {Object} options - Options de génération
 * @returns {string} Le mot de passe généré
 */
export function generatePassword(options = {}) {
  const {
    length = 12,
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSymbols = false,
    includeSpecialSymbols = false,
    excludeSimilar = true,
    mustIncludeAll = true
  } = options;

  // Construire l'ensemble de caractères disponibles
  let availableChars = '';
  const requiredChars = [];

  if (includeLowercase) {
    const chars = excludeSimilar ? 
      CHAR_SETS.lowercase.replace(/[il]/g, '') : 
      CHAR_SETS.lowercase;
    availableChars += chars;
    if (mustIncludeAll) requiredChars.push(getRandomChar(chars));
  }

  if (includeUppercase) {
    const chars = excludeSimilar ? 
      CHAR_SETS.uppercase.replace(/[LO]/g, '') : 
      CHAR_SETS.uppercase;
    availableChars += chars;
    if (mustIncludeAll) requiredChars.push(getRandomChar(chars));
  }

  if (includeNumbers) {
    const chars = excludeSimilar ? 
      CHAR_SETS.numbers.replace(/[10]/g, '') : 
      CHAR_SETS.numbers;
    availableChars += chars;
    if (mustIncludeAll) requiredChars.push(getRandomChar(chars));
  }

  if (includeSymbols) {
    availableChars += CHAR_SETS.symbols;
    if (mustIncludeAll) requiredChars.push(getRandomChar(CHAR_SETS.symbols));
  }

  if (includeSpecialSymbols) {
    availableChars += CHAR_SETS.specialSymbols;
    if (mustIncludeAll) requiredChars.push(getRandomChar(CHAR_SETS.specialSymbols));
  }

  if (!availableChars) {
    throw new Error('Au moins un type de caractère doit être sélectionné');
  }

  if (length < requiredChars.length) {
    throw new Error(`La longueur doit être d'au moins ${requiredChars.length} caractères`);
  }

  // Générer le mot de passe
  let password = '';
  
  // Ajouter les caractères requis
  password += requiredChars.join('');
  
  // Compléter avec des caractères aléatoires
  for (let i = requiredChars.length; i < length; i++) {
    password += getRandomChar(availableChars);
  }

  // Mélanger le mot de passe pour éviter les patterns prévisibles
  return shuffleString(password);
}

/**
 * Obtient un caractère aléatoire d'une chaîne
 * @param {string} chars - Chaîne de caractères
 * @returns {string} Caractère aléatoire
 */
function getRandomChar(chars) {
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

/**
 * Mélange les caractères d'une chaîne
 * @param {string} str - Chaîne à mélanger
 * @returns {string} Chaîne mélangée
 */
function shuffleString(str) {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}

/**
 * Évalue la force d'un mot de passe
 * @param {string} password - Mot de passe à évaluer
 * @returns {Object} Résultat de l'évaluation
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      level: 'Très faible',
      feedback: ['Le mot de passe ne peut pas être vide'],
      color: 'red'
    };
  }

  let score = 0;
  const feedback = [];
  
  // Longueur
  if (password.length >= 8) score += 1;
  else feedback.push('Utilisez au moins 8 caractères');
  
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Types de caractères
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Ajoutez des lettres minuscules');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Ajoutez des lettres majuscules');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Ajoutez des chiffres');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Ajoutez des symboles');
  
  // Patterns communs
  if (!/(..).*\1/.test(password)) score += 1;
  else feedback.push('Évitez les répétitions de caractères');
  
  if (!/123|abc|qwe|asd|zxc/i.test(password)) score += 1;
  else feedback.push('Évitez les séquences communes');

  // Déterminer le niveau
  let level, color;
  if (score <= 2) {
    level = 'Très faible';
    color = 'red';
  } else if (score <= 4) {
    level = 'Faible';
    color = 'orange';
  } else if (score <= 6) {
    level = 'Moyen';
    color = 'yellow';
  } else if (score <= 8) {
    level = 'Fort';
    color = 'green';
  } else {
    level = 'Très fort';
    color = 'emerald';
  }

  return {
    score,
    level,
    feedback: feedback.length > 0 ? feedback : ['Excellent mot de passe !'],
    color,
    percentage: Math.min(100, (score / 9) * 100)
  };
}

/**
 * Génère plusieurs mots de passe selon un preset
 * @param {string} presetName - Nom du preset
 * @param {number} count - Nombre de mots de passe à générer
 * @returns {Array} Liste de mots de passe
 */
export function generateMultiplePasswords(presetName = 'medium', count = 5) {
  const preset = PASSWORD_PRESETS[presetName] || PASSWORD_PRESETS.medium;
  const passwords = [];
  
  for (let i = 0; i < count; i++) {
    const password = generatePassword(preset);
    const strength = evaluatePasswordStrength(password);
    passwords.push({
      password,
      strength,
      id: `pwd_${Date.now()}_${i}`
    });
  }
  
  return passwords;
}

/**
 * Copie un texte dans le presse-papiers
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} Succès de l'opération
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    return false;
  }
}