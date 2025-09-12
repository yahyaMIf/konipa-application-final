/**
 * Parser de désignation pour produits automobiles
 * Version backend adaptée du parseDesignation.ts frontend
 */

class DesignationParser {
  constructor() {
    // Marques automobiles courantes
    this.brands = [
      'RENAULT', 'PEUGEOT', 'CITROEN', 'VOLKSWAGEN', 'AUDI', 'BMW', 'MERCEDES',
      'FORD', 'OPEL', 'FIAT', 'TOYOTA', 'NISSAN', 'HYUNDAI', 'KIA', 'MAZDA',
      'HONDA', 'MITSUBISHI', 'SUZUKI', 'SUBARU', 'VOLVO', 'SAAB', 'SEAT',
      'SKODA', 'DACIA', 'ALFA ROMEO', 'LANCIA', 'JEEP', 'CHRYSLER', 'DODGE',
      'CHEVROLET', 'CADILLAC', 'BUICK', 'GMC', 'LINCOLN', 'MERCURY', 'JAGUAR',
      'LAND ROVER', 'MINI', 'SMART', 'PORSCHE', 'FERRARI', 'LAMBORGHINI',
      'MASERATI', 'BENTLEY', 'ROLLS ROYCE', 'ASTON MARTIN', 'LOTUS', 'MORGAN'
    ];

    // Types de pièces courantes
    this.partTypes = [
      'FILTRE', 'HUILE', 'BOUGIE', 'PLAQUETTE', 'DISQUE', 'AMORTISSEUR',
      'COURROIE', 'BATTERIE', 'ALTERNATEUR', 'DEMARREUR', 'RADIATEUR',
      'THERMOSTAT', 'POMPE', 'JOINT', 'ROULEMENT', 'ROTULE', 'SILENT BLOC',
      'EMBRAYAGE', 'VOLANT', 'CARDANS', 'TRIANGLE', 'BIELLETTE', 'BARRE',
      'STABILISATRICE', 'RESSORT', 'COUPELLE', 'BUTEE', 'CREMAILLERE',
      'DIRECTION', 'MAITRE CYLINDRE', 'ETRIER', 'FLEXIBLE', 'DURITE',
      'CAPTEUR', 'SONDE', 'INJECTEUR', 'BOBINE', 'ALLUMAGE', 'ECHAPPEMENT',
      'CATALYSEUR', 'SILENCIEUX', 'PARE CHOC', 'OPTIQUE', 'FEU', 'CLIGNOTANT',
      'RETROVISEUR', 'VITRE', 'PARE BRISE', 'ESSUIE GLACE', 'BALAI',
      'CLIMATISATION', 'CHAUFFAGE', 'VENTILATEUR', 'CONDENSEUR', 'EVAPORATEUR'
    ];

    // Modèles courants par marque
    this.models = {
      'RENAULT': ['CLIO', 'MEGANE', 'SCENIC', 'LAGUNA', 'ESPACE', 'KANGOO', 'MASTER', 'TRAFIC', 'TWINGO', 'CAPTUR', 'KADJAR'],
      'PEUGEOT': ['206', '207', '208', '306', '307', '308', '406', '407', '408', '508', '607', '807', '1007', '2008', '3008', '5008', 'PARTNER', 'BOXER'],
      'CITROEN': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C8', 'XSARA', 'PICASSO', 'BERLINGO', 'JUMPER', 'JUMPY', 'SAXO', 'ZX', 'XANTIA'],
      'VOLKSWAGEN': ['GOLF', 'POLO', 'PASSAT', 'JETTA', 'TOURAN', 'TIGUAN', 'TOUAREG', 'CADDY', 'TRANSPORTER', 'CRAFTER', 'UP', 'BEETLE'],
      'AUDI': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'TT', 'R8'],
      'BMW': ['SERIE 1', 'SERIE 3', 'SERIE 5', 'SERIE 7', 'X1', 'X3', 'X5', 'X6', 'Z3', 'Z4', 'MINI'],
      'MERCEDES': ['CLASSE A', 'CLASSE B', 'CLASSE C', 'CLASSE E', 'CLASSE S', 'CLA', 'CLS', 'GLA', 'GLK', 'ML', 'SLK', 'VITO', 'SPRINTER']
    };
  }

  /**
   * Normalise une chaîne de caractères
   */
  normalize(str) {
    if (!str) return '';
    return str.toString()
      .toUpperCase()
      .trim()
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
  extractYears(text) {
    const normalized = this.normalize(text);
    const yearRegex = /\b(19|20)\d{2}\b/g;
    const matches = normalized.match(yearRegex);
    
    if (!matches) return [];
    
    return matches
      .map(year => parseInt(year))
      .filter(year => year >= 1980 && year <= new Date().getFullYear() + 2)
      .sort((a, b) => a - b);
  }

  /**
   * Trouve la marque dans le texte
   */
  findBrand(text) {
    const normalized = this.normalize(text);
    
    for (const brand of this.brands) {
      if (normalized.includes(brand)) {
        return brand;
      }
    }
    
    return null;
  }

  /**
   * Trouve le modèle dans le texte
   */
  findModel(text, brand = null) {
    const normalized = this.normalize(text);
    
    // Si on a une marque, chercher dans ses modèles spécifiques
    if (brand && this.models[brand]) {
      for (const model of this.models[brand]) {
        if (normalized.includes(model)) {
          return model;
        }
      }
    }
    
    // Chercher dans tous les modèles
    for (const brandModels of Object.values(this.models)) {
      for (const model of brandModels) {
        if (normalized.includes(model)) {
          return model;
        }
      }
    }
    
    return null;
  }

  /**
   * Trouve le type de pièce dans le texte
   */
  findPartType(text) {
    const normalized = this.normalize(text);
    
    for (const partType of this.partTypes) {
      if (normalized.includes(partType)) {
        return partType;
      }
    }
    
    return null;
  }

  /**
   * Parse une désignation complète
   */
  parse(designation) {
    if (!designation) {
      return {
        brand: null,
        model: null,
        years: [],
        partType: null,
        confidence: 0,
        originalText: designation
      };
    }

    const normalized = this.normalize(designation);
    const brand = this.findBrand(normalized);
    const model = this.findModel(normalized, brand);
    const years = this.extractYears(normalized);
    const partType = this.findPartType(normalized);

    // Calcul du score de confiance
    let confidence = 0;
    if (brand) confidence += 0.3;
    if (model) confidence += 0.3;
    if (years.length > 0) confidence += 0.2;
    if (partType) confidence += 0.2;

    return {
      brand,
      model,
      years,
      partType,
      confidence,
      originalText: designation,
      normalizedText: normalized
    };
  }

  /**
   * Génère des requêtes de recherche optimisées
   */
  generateSearchQueries(parsedData) {
    const queries = [];
    const { brand, model, years, partType } = parsedData;

    // Requête principale
    const mainQuery = [brand, model, partType].filter(Boolean).join(' ');
    if (mainQuery) queries.push(mainQuery);

    // Requêtes avec années
    if (years.length > 0) {
      years.forEach(year => {
        const yearQuery = [brand, model, year, partType].filter(Boolean).join(' ');
        if (yearQuery !== mainQuery) queries.push(yearQuery);
      });
    }

    // Requêtes partielles
    if (brand && partType) {
      queries.push(`${brand} ${partType}`);
    }
    if (model && partType) {
      queries.push(`${model} ${partType}`);
    }

    return [...new Set(queries)]; // Supprimer les doublons
  }

  /**
   * Filtre les produits selon les critères parsés
   */
  filterProducts(products, parsedData) {
    if (!parsedData || parsedData.confidence === 0) {
      return products;
    }

    const { brand, model, years, partType } = parsedData;

    return products.filter(product => {
      let score = 0;
      const productText = this.normalize(`${product.name} ${product.description || ''} ${product.brand || ''}`);

      // Vérification de la marque
      if (brand && productText.includes(brand)) {
        score += 0.3;
      }

      // Vérification du modèle
      if (model && productText.includes(model)) {
        score += 0.3;
      }

      // Vérification des années
      if (years.length > 0) {
        const productYears = this.extractYears(productText);
        if (productYears.some(year => years.includes(year))) {
          score += 0.2;
        }
      }

      // Vérification du type de pièce
      if (partType && productText.includes(partType)) {
        score += 0.2;
      }

      // Retourner les produits avec un score minimum
      return score >= 0.2;
    }).map(product => ({
      ...product,
      relevanceScore: this.calculateRelevanceScore(product, parsedData)
    }));
  }

  /**
   * Calcule le score de pertinence d'un produit
   */
  calculateRelevanceScore(product, parsedData) {
    let score = 0;
    const productText = this.normalize(`${product.name} ${product.description || ''} ${product.brand || ''}`);
    const { brand, model, years, partType } = parsedData;

    // Score pour la marque
    if (brand && productText.includes(brand)) {
      score += 30;
    }

    // Score pour le modèle
    if (model && productText.includes(model)) {
      score += 25;
    }

    // Score pour les années
    if (years.length > 0) {
      const productYears = this.extractYears(productText);
      if (productYears.some(year => years.includes(year))) {
        score += 20;
      }
    }

    // Score pour le type de pièce
    if (partType && productText.includes(partType)) {
      score += 15;
    }

    // Bonus pour correspondance exacte
    if (productText.includes(this.normalize(parsedData.originalText))) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Génère des suggestions de recherche
   */
  generateSuggestions(partialQuery, limit = 5) {
    const normalized = this.normalize(partialQuery);
    const suggestions = new Set();

    // Suggestions de marques
    this.brands.forEach(brand => {
      if (brand.includes(normalized) || normalized.includes(brand.substring(0, 3))) {
        suggestions.add(brand);
      }
    });

    // Suggestions de types de pièces
    this.partTypes.forEach(partType => {
      if (partType.includes(normalized) || normalized.includes(partType.substring(0, 3))) {
        suggestions.add(partType);
      }
    });

    // Suggestions de modèles
    Object.values(this.models).flat().forEach(model => {
      if (model.includes(normalized) || normalized.includes(model.substring(0, 3))) {
        suggestions.add(model);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

module.exports = new DesignationParser();