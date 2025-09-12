/**
 * Parser intelligent pour les désignations de produits automobiles
 * Extrait marque, modèle, année(s) et type de pièce
 */

export interface ParsedDesignation {
  marque: string;
  modele: string;
  annees: string[];
  typePiece: string;
  original: string;
  confidence: number; // Score de confiance du parsing (0-1)
}

// Dictionnaire des marques automobiles courantes
const MARQUES_AUTO = [
  'RENAULT', 'PEUGEOT', 'CITROEN', 'VOLKSWAGEN', 'AUDI', 'BMW', 'MERCEDES',
  'FORD', 'OPEL', 'FIAT', 'TOYOTA', 'NISSAN', 'HONDA', 'HYUNDAI', 'KIA',
  'SKODA', 'SEAT', 'VOLVO', 'MAZDA', 'MITSUBISHI', 'SUZUKI', 'DACIA',
  'ALFA ROMEO', 'LANCIA', 'JAGUAR', 'LAND ROVER', 'MINI', 'SMART',
  'PORSCHE', 'LEXUS', 'INFINITI', 'ACURA', 'CADILLAC', 'CHEVROLET',
  'DODGE', 'JEEP', 'CHRYSLER', 'BUICK', 'GMC', 'LINCOLN', 'MERCURY'
];

// Types de pièces automobiles courantes
const TYPES_PIECES = [
  'AMORTISSEUR', 'FREIN', 'DISQUE', 'PLAQUETTE', 'FILTRE', 'HUILE',
  'BOUGIE', 'COURROIE', 'JOINT', 'ROULEMENT', 'ROTULE', 'SILENT BLOC',
  'EMBRAYAGE', 'VOLANT MOTEUR', 'RADIATEUR', 'THERMOSTAT', 'POMPE',
  'ALTERNATEUR', 'DEMARREUR', 'BATTERIE', 'PHARE', 'FEU', 'CLIGNOTANT',
  'RETROVISEUR', 'PARE CHOC', 'AILE', 'CAPOT', 'PORTIERE', 'VITRE',
  'ESSUIE GLACE', 'BALAI', 'PNEU', 'JANTE', 'MOYEU', 'ETRIER',
  'MAITRE CYLINDRE', 'SERVO FREIN', 'ABS', 'ESP', 'AIRBAG',
  'CEINTURE', 'SIEGE', 'VOLANT', 'PEDALE', 'LEVIER', 'CABLE',
  'DURITE', 'TUYAU', 'RESERVOIR', 'BOUCHON', 'CAPTEUR', 'SONDE',
  'CALCULATEUR', 'RELAIS', 'FUSIBLE', 'FAISCEAU', 'CONNECTEUR'
];

// Modèles courants par marque
const MODELES_PAR_MARQUE: { [key: string]: string[] } = {
  'RENAULT': ['CLIO', 'MEGANE', 'SCENIC', 'LAGUNA', 'ESPACE', 'TWINGO', 'KANGOO', 'MASTER', 'TRAFIC', 'CAPTUR', 'KADJAR'],
  'PEUGEOT': ['206', '207', '208', '306', '307', '308', '406', '407', '408', '508', '607', '807', '1007', '2008', '3008', '5008'],
  'CITROEN': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C8', 'XSARA', 'PICASSO', 'BERLINGO', 'JUMPER', 'JUMPY'],
  'VOLKSWAGEN': ['GOLF', 'POLO', 'PASSAT', 'TOURAN', 'TIGUAN', 'TOUAREG', 'CADDY', 'TRANSPORTER', 'CRAFTER'],
  'AUDI': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'TT'],
  'BMW': ['SERIE 1', 'SERIE 3', 'SERIE 5', 'SERIE 7', 'X1', 'X3', 'X5', 'Z4'],
  'MERCEDES': ['CLASSE A', 'CLASSE B', 'CLASSE C', 'CLASSE E', 'CLASSE S', 'CLA', 'CLS', 'GLA', 'GLC', 'GLE'],
  'FORD': ['FIESTA', 'FOCUS', 'MONDEO', 'KUGA', 'GALAXY', 'S-MAX', 'TRANSIT', 'RANGER'],
  'OPEL': ['CORSA', 'ASTRA', 'VECTRA', 'INSIGNIA', 'ZAFIRA', 'MERIVA', 'MOKKA', 'ANTARA']
};

/**
 * Normalise une chaîne pour la comparaison
 */
function normalizeString(str: string): string {
  return str.toUpperCase()
    .replace(/[ÀÁÂÃÄÅ]/g, 'A')
    .replace(/[ÈÉÊË]/g, 'E')
    .replace(/[ÌÍÎÏ]/g, 'I')
    .replace(/[ÒÓÔÕÖ]/g, 'O')
    .replace(/[ÙÚÛÜ]/g, 'U')
    .replace(/[ÇÑ]/g, 'C')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrait les années d'une chaîne
 */
function extractYears(text: string): string[] {
  const years: string[] = [];
  const yearRegex = /\b(19|20)\d{2}\b/g;
  let match;
  
  while ((match = yearRegex.exec(text)) !== null) {
    years.push(match[0]);
  }
  
  // Recherche de plages d'années (ex: 2010-2015)
  const rangeRegex = /\b(19|20)\d{2}\s*[-à]\s*(19|20)?\d{2}\b/g;
  while ((match = rangeRegex.exec(text)) !== null) {
    const range = match[0].replace(/\s/g, '');
    const [start, end] = range.split(/[-à]/);
    const startYear = parseInt(start);
    const endYear = parseInt(end.length === 2 ? start.substring(0, 2) + end : end);
    
    for (let year = startYear; year <= endYear; year++) {
      if (!years.includes(year.toString())) {
        years.push(year.toString());
      }
    }
  }
  
  return years.sort();
}

/**
 * Trouve la marque dans le texte
 */
function findMarque(text: string): { marque: string; confidence: number } {
  const normalized = normalizeString(text);
  
  for (const marque of MARQUES_AUTO) {
    if (normalized.includes(marque)) {
      // Vérifier si c'est un mot complet
      const regex = new RegExp(`\\b${marque}\\b`);
      if (regex.test(normalized)) {
        return { marque, confidence: 0.9 };
      } else {
        return { marque, confidence: 0.6 };
      }
    }
  }
  
  return { marque: '', confidence: 0 };
}

/**
 * Trouve le modèle dans le texte
 */
function findModele(text: string, marque: string): { modele: string; confidence: number } {
  const normalized = normalizeString(text);
  
  if (marque && MODELES_PAR_MARQUE[marque]) {
    for (const modele of MODELES_PAR_MARQUE[marque]) {
      if (normalized.includes(modele)) {
        const regex = new RegExp(`\\b${modele}\\b`);
        if (regex.test(normalized)) {
          return { modele, confidence: 0.9 };
        } else {
          return { modele, confidence: 0.6 };
        }
      }
    }
  }
  
  // Recherche générique de modèles (lettres + chiffres)
  const modeleRegex = /\b[A-Z]+\s*\d+[A-Z]*\b|\b\d+[A-Z]+\b/g;
  const matches = normalized.match(modeleRegex);
  
  if (matches && matches.length > 0) {
    // Exclure les années
    const filteredMatches = matches.filter(match => {
      const num = parseInt(match.replace(/[A-Z]/g, ''));
      return isNaN(num) || num < 1900 || num > new Date().getFullYear() + 5;
    });
    
    if (filteredMatches.length > 0) {
      return { modele: filteredMatches[0], confidence: 0.5 };
    }
  }
  
  return { modele: '', confidence: 0 };
}

/**
 * Trouve le type de pièce dans le texte
 */
function findTypePiece(text: string): { typePiece: string; confidence: number } {
  const normalized = normalizeString(text);
  
  for (const type of TYPES_PIECES) {
    if (normalized.includes(type)) {
      const regex = new RegExp(`\\b${type}\\b`);
      if (regex.test(normalized)) {
        return { typePiece: type, confidence: 0.9 };
      } else {
        return { typePiece: type, confidence: 0.6 };
      }
    }
  }
  
  // Recherche de mots-clés partiels
  const partialMatches = [
    { keywords: ['AMOR', 'AMORT'], type: 'AMORTISSEUR' },
    { keywords: ['FREI', 'BRAKE'], type: 'FREIN' },
    { keywords: ['DISQ'], type: 'DISQUE' },
    { keywords: ['PLAQ'], type: 'PLAQUETTE' },
    { keywords: ['FILT'], type: 'FILTRE' },
    { keywords: ['COURR'], type: 'COURROIE' },
    { keywords: ['ROULE'], type: 'ROULEMENT' },
    { keywords: ['EMBR'], type: 'EMBRAYAGE' },
    { keywords: ['RADI'], type: 'RADIATEUR' },
    { keywords: ['THER'], type: 'THERMOSTAT' },
    { keywords: ['ALTE'], type: 'ALTERNATEUR' },
    { keywords: ['DEMA'], type: 'DEMARREUR' },
    { keywords: ['BATT'], type: 'BATTERIE' },
    { keywords: ['PHAR'], type: 'PHARE' },
    { keywords: ['RETRO'], type: 'RETROVISEUR' },
    { keywords: ['PARE'], type: 'PARE CHOC' },
    { keywords: ['PNEU'], type: 'PNEU' },
    { keywords: ['JANT'], type: 'JANTE' }
  ];
  
  for (const match of partialMatches) {
    for (const keyword of match.keywords) {
      if (normalized.includes(keyword)) {
        return { typePiece: match.type, confidence: 0.7 };
      }
    }
  }
  
  return { typePiece: '', confidence: 0 };
}

/**
 * Parse une désignation de produit automobile
 */
export function parseDesignation(designation: string): ParsedDesignation {
  if (!designation || typeof designation !== 'string') {
    return {
      marque: '',
      modele: '',
      annees: [],
      typePiece: '',
      original: designation || '',
      confidence: 0
    };
  }
  
  const normalized = normalizeString(designation);
  
  // Extraction des composants
  const marqueResult = findMarque(normalized);
  const modeleResult = findModele(normalized, marqueResult.marque);
  const typePieceResult = findTypePiece(normalized);
  const annees = extractYears(normalized);
  
  // Calcul du score de confiance global
  const scores = [
    marqueResult.confidence,
    modeleResult.confidence,
    typePieceResult.confidence,
    annees.length > 0 ? 0.8 : 0
  ];
  
  const confidence = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  return {
    marque: marqueResult.marque,
    modele: modeleResult.modele,
    annees,
    typePiece: typePieceResult.typePiece,
    original: designation,
    confidence: Math.round(confidence * 100) / 100
  };
}

/**
 * Parse plusieurs désignations en lot
 */
export function parseDesignations(designations: string[]): ParsedDesignation[] {
  return designations.map(designation => parseDesignation(designation));
}

/**
 * Génère une requête de recherche optimisée à partir d'une désignation parsée
 */
export function generateSearchQuery(parsed: ParsedDesignation): string {
  const parts = [];
  
  if (parsed.marque) parts.push(parsed.marque);
  if (parsed.modele) parts.push(parsed.modele);
  if (parsed.typePiece) parts.push(parsed.typePiece);
  if (parsed.annees.length > 0) {
    if (parsed.annees.length === 1) {
      parts.push(parsed.annees[0]);
    } else {
      parts.push(`${parsed.annees[0]}-${parsed.annees[parsed.annees.length - 1]}`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Filtre les produits basé sur une désignation parsée
 */
export function filterProductsByParsedDesignation(
  products: any[],
  parsed: ParsedDesignation,
  threshold: number = 0.3
): any[] {
  if (parsed.confidence < threshold) {
    return products;
  }
  
  return products.filter(product => {
    const productText = normalizeString(
      `${product.name || ''} ${product.description || ''} ${product.brand || ''} ${product.model || ''}`
    );
    
    let matches = 0;
    let total = 0;
    
    if (parsed.marque) {
      total++;
      if (productText.includes(parsed.marque)) matches++;
    }
    
    if (parsed.modele) {
      total++;
      if (productText.includes(parsed.modele)) matches++;
    }
    
    if (parsed.typePiece) {
      total++;
      if (productText.includes(parsed.typePiece)) matches++;
    }
    
    if (parsed.annees.length > 0) {
      total++;
      const hasYear = parsed.annees.some(year => productText.includes(year));
      if (hasYear) matches++;
    }
    
    return total === 0 || (matches / total) >= threshold;
  });
}

/**
 * Suggère des termes de recherche alternatifs
 */
export function suggestAlternativeTerms(parsed: ParsedDesignation): string[] {
  const suggestions: string[] = [];
  
  // Suggestions basées sur la marque
  if (parsed.marque) {
    const synonymes: { [key: string]: string[] } = {
      'VOLKSWAGEN': ['VW', 'VOLKS'],
      'MERCEDES': ['MERCEDES-BENZ', 'BENZ'],
      'BMW': ['BAYERISCHE MOTOREN WERKE'],
      'ALFA ROMEO': ['ALFA'],
      'LAND ROVER': ['LANDROVER']
    };
    
    if (synonymes[parsed.marque]) {
      suggestions.push(...synonymes[parsed.marque]);
    }
  }
  
  // Suggestions basées sur le type de pièce
  if (parsed.typePiece) {
    const synonymesPieces: { [key: string]: string[] } = {
      'AMORTISSEUR': ['SHOCK ABSORBER', 'AMOR'],
      'FREIN': ['BRAKE', 'FREINAGE'],
      'DISQUE': ['DISC', 'DISQUE FREIN'],
      'PLAQUETTE': ['PAD', 'PLAQUETTE FREIN'],
      'FILTRE': ['FILTER'],
      'COURROIE': ['BELT', 'STRAP'],
      'ROULEMENT': ['BEARING'],
      'EMBRAYAGE': ['CLUTCH']
    };
    
    if (synonymesPieces[parsed.typePiece]) {
      suggestions.push(...synonymesPieces[parsed.typePiece]);
    }
  }
  
  return suggestions;
}

export default {
  parseDesignation,
  parseDesignations,
  generateSearchQuery,
  filterProductsByParsedDesignation,
  suggestAlternativeTerms
};