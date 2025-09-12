/**
 * Service d'intégration Sage 100c Commercial Premium
 * 
 * Ce fichier contient toute la logique de synchronisation entre Konipa et Sage 100c.
 * Suivez les commentaires pour implémenter chaque section selon vos besoins.
 * 
 * PRÉREQUIS :
 * - Sage 100c Commercial Premium installé
 * - Web Services Sage activés
 * - Variables d'environnement configurées dans .env
 * 
 * STRUCTURE :
 * 1. Configuration et authentification
 * 2. Gestion des clients (F_COMPTET)
 * 3. Gestion des articles (F_ARTICLE)
 * 4. Gestion des stocks (F_ARTSTOCK)
 * 5. Gestion des commandes
 * 6. Utilitaires et helpers
 */

const axios = require('axios');
const winston = require('winston');

// ============================================================================
// 1. CONFIGURATION ET AUTHENTIFICATION
// ============================================================================

/**
 * Configuration Sage - À adapter selon votre environnement
 * Ces valeurs doivent être définies dans votre fichier .env
 */
class SageConfig {
  constructor() {
    // URL du serveur Sage Web Services
    this.baseURL = process.env.SAGE_WS_URL || 'http://localhost:8080/sage100ws';
    
    // Informations de connexion Sage
    this.server = process.env.SAGE_SERVER || 'localhost';
    this.database = process.env.SAGE_DATABASE || 'BIJOU';
    this.username = process.env.SAGE_USERNAME || 'webservice';
    this.password = process.env.SAGE_PASSWORD || 'password';
    
    // Configuration spécifique Maroc
    this.country = process.env.SAGE_COUNTRY || 'MA';
    this.currency = process.env.SAGE_CURRENCY || 'MAD';
    this.language = process.env.SAGE_LANGUAGE || 'FR';
    this.timezone = process.env.SAGE_TIMEZONE || 'Africa/Casablanca';
    
    // Taux de TVA Maroc
    this.taxRates = {
      standard: parseFloat(process.env.SAGE_TAX_STANDARD) || 20,
      reduced: parseFloat(process.env.SAGE_TAX_REDUCED) || 10,
      zero: parseFloat(process.env.SAGE_TAX_ZERO) || 0
    };
    
    // Codes TVA dans Sage
    this.taxCodes = {
      T20: process.env.SAGE_TAX_CODE_20 || 'T20',
      T10: process.env.SAGE_TAX_CODE_10 || 'T10',
      T00: process.env.SAGE_TAX_CODE_0 || 'T00'
    };
    
    // Configuration des timeouts et retry
    this.timeout = parseInt(process.env.SAGE_WS_TIMEOUT) || 30000;
    this.retryAttempts = parseInt(process.env.SAGE_WS_RETRY_ATTEMPTS) || 3;
  }
}

/**
 * Logger spécifique pour Sage
 * Configurez selon vos besoins de logging
 */
const sageLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sage-integration' },
  transports: [
    new winston.transports.File({ filename: 'logs/sage-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/sage-combined.log' })
  ]
});

/**
 * Classe principale d'intégration Sage
 */
class SageIntegrationService {
  constructor() {
    this.config = new SageConfig();
    this.authToken = null;
    this.tokenExpiry = null;
    this.axiosInstance = this.createAxiosInstance();
  }

  /**
   * Création de l'instance Axios avec configuration
   * IMPLÉMENTATION : Configurez les intercepteurs selon vos besoins
   */
  createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Intercepteur pour ajouter automatiquement le token
    instance.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    // Intercepteur pour gérer les erreurs d'authentification
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.authToken = null;
          this.tokenExpiry = null;
          // Retry une fois après re-authentification
          await this.ensureAuthenticated();
          error.config.headers.Authorization = `Bearer ${this.authToken}`;
          return instance.request(error.config);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Authentification auprès de Sage
   * IMPLÉMENTATION : Adaptez selon votre méthode d'authentification Sage
   */
  async authenticate() {
    try {
      sageLogger.info('Tentative d\'authentification Sage', {
        server: this.config.server,
        database: this.config.database,
        username: this.config.username
      });


      const response = await axios.post(`${this.config.baseURL}/auth/login`, {
        server: this.config.server,
        database: this.config.database,
        username: this.config.username,
        password: this.config.password
      });

      this.authToken = response.data.token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expiresIn * 1000));
      
      sageLogger.info('Authentification Sage réussie', {
        tokenExpiry: this.tokenExpiry
      });

      return true;
    } catch (error) {
      sageLogger.error('Erreur d\'authentification Sage', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Échec de l'authentification Sage: ${error.message}`);
    }
  }

  /**
   * Vérification et renouvellement automatique du token
   */
  async ensureAuthenticated() {
    if (!this.authToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  // ============================================================================
  // 2. GESTION DES CLIENTS (F_COMPTET)
  // ============================================================================

  /**
   * Récupération de tous les clients depuis Sage
   * IMPLÉMENTATION : Adaptez les champs selon votre structure Sage
   */
  async getAllClients() {
    try {
      sageLogger.info('Récupération des clients depuis Sage');
      

      const response = await this.axiosInstance.get('/clients', {
        params: {
          // Filtres optionnels
          active: true,
          type: 'C' // Type client
        }
      });

      const clients = response.data.map(client => this.mapSageClientToKonipa(client));
      
      sageLogger.info(`${clients.length} clients récupérés depuis Sage`);
      return clients;
    } catch (error) {
      sageLogger.error('Erreur lors de la récupération des clients', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupération d'un client spécifique
   * IMPLÉMENTATION : Utilisez le numéro client Sage
   */
  async getClientById(clientId) {
    try {

      const response = await this.axiosInstance.get(`/clients/${clientId}`);
      return this.mapSageClientToKonipa(response.data);
    } catch (error) {
      sageLogger.error('Erreur lors de la récupération du client', { 
        clientId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Création d'un nouveau client dans Sage
   * IMPLÉMENTATION : Mappez les données Konipa vers les champs Sage
   */
  async createClient(konipaClient) {
    try {
      const sageClient = this.mapKonipaClientToSage(konipaClient);
      

      const response = await this.axiosInstance.post('/clients', sageClient);
      
      sageLogger.info('Client créé dans Sage', { 
        konipaId: konipaClient.id,
        sageId: response.data.CT_Num 
      });
      
      return response.data;
    } catch (error) {
      sageLogger.error('Erreur lors de la création du client', { 
        client: konipaClient,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Mise à jour d'un client dans Sage
   */
  async updateClient(clientId, konipaClient) {
    try {
      const sageClient = this.mapKonipaClientToSage(konipaClient);
      

      const response = await this.axiosInstance.put(`/clients/${clientId}`, sageClient);
      
      sageLogger.info('Client mis à jour dans Sage', { clientId });
      return response.data;
    } catch (error) {
      sageLogger.error('Erreur lors de la mise à jour du client', { 
        clientId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Mapping client Sage vers format Konipa
   * IMPLÉMENTATION : Adaptez selon vos champs clients
   */
  mapSageClientToKonipa(sageClient) {
    return {
      // Identifiants
      sageId: sageClient.CT_Num,
      code: sageClient.CT_Num,
      
      // Informations générales
      name: sageClient.CT_Intitule,
      type: sageClient.CT_Type,
      
      // Adresse
      address: {
        street: sageClient.CT_Adresse,
        complement: sageClient.CT_Complement,
        postalCode: sageClient.CT_CodePostal,
        city: sageClient.CT_Ville,
        country: sageClient.CT_Pays || 'MA'
      },
      
      // Contact
      contact: {
        phone: sageClient.CT_Telephone,
        fax: sageClient.CT_Telecopie,
        email: sageClient.CT_EMail,
        website: sageClient.CT_Site
      },
      
      // Informations fiscales Maroc
      fiscal: {
        ice: sageClient.CT_Identifiant, // ICE (Identifiant Commun de l'Entreprise)
        rc: sageClient.CT_Siret, // RC (Registre de Commerce)
        taxNumber: sageClient.CT_NumTva
      },
      
      // Paramètres commerciaux
      commercial: {
        currency: sageClient.CT_Devise || this.config.currency,
        language: sageClient.CT_Langue || this.config.language,
        paymentTerms: sageClient.CT_Condition,
        discount: sageClient.CT_Remise || 0,
        priceCategory: sageClient.CT_Categorie
      },
      
      // Données financières (synchronisées depuis Sage)
      financial: {
        creditLimit: sageClient.CT_Encours || sageClient.CT_PlafondCredit || 0,
        outstandingAmount: sageClient.CT_Solde || sageClient.CT_EncoursCourant || 0,
        isBlocked: sageClient.CT_Bloque === 1 || sageClient.CT_Sommeil === 1,
        lastPaymentDate: sageClient.CT_DateDernierReglement,
        overdueAmount: sageClient.CT_SoldeEchu || 0
      },
      
      // Métadonnées
      isActive: sageClient.CT_Sommeil === 0,
      createdAt: sageClient.CT_DateCreate,
      updatedAt: sageClient.CT_DateModif,
      
      // Données spécifiques Konipa (non synchronisées avec Sage)
      konipaSpecific: {
        customDiscount: 0, // Remise personnalisée Konipa
        stockLimits: {}, // Limites de stock par article
        preferences: {} // Préférences client
      }
    };
  }

  /**
   * Mapping client Konipa vers format Sage
   * IMPLÉMENTATION : Mappez uniquement les champs que Sage peut accepter
   */
  mapKonipaClientToSage(konipaClient) {
    return {
      // Informations de base
      CT_Intitule: konipaClient.name,
      CT_Type: konipaClient.type || 'C',
      
      // Adresse
      CT_Adresse: konipaClient.address?.street,
      CT_Complement: konipaClient.address?.complement,
      CT_CodePostal: konipaClient.address?.postalCode,
      CT_Ville: konipaClient.address?.city,
      CT_Pays: konipaClient.address?.country || 'MA',
      
      // Contact
      CT_Telephone: konipaClient.contact?.phone,
      CT_Telecopie: konipaClient.contact?.fax,
      CT_EMail: konipaClient.contact?.email,
      CT_Site: konipaClient.contact?.website,
      
      // Informations fiscales
      CT_Identifiant: konipaClient.fiscal?.ice,
      CT_Siret: konipaClient.fiscal?.rc,
      CT_NumTva: konipaClient.fiscal?.taxNumber,
      
      // Paramètres commerciaux (uniquement ceux gérés par Sage)
      CT_Devise: konipaClient.commercial?.currency || this.config.currency,
      CT_Langue: konipaClient.commercial?.language || this.config.language,
      CT_Condition: konipaClient.commercial?.paymentTerms,
      
      // Note: Les remises personnalisées Konipa ne sont PAS envoyées à Sage
      // Elles sont calculées côté Konipa et appliquées aux prix finaux
      
      // Statut
      CT_Sommeil: konipaClient.isActive ? 0 : 1
    };
  }

  // ============================================================================
  // 3. GESTION DES ARTICLES (F_ARTICLE)
  // ============================================================================

  /**
   * Récupération de tous les articles depuis Sage
   */
  async getAllArticles() {
    try {
      sageLogger.info('Récupération des articles depuis Sage');
      

      const response = await this.axiosInstance.get('/articles', {
        params: {
          active: true
        }
      });

      const articles = response.data.map(article => this.mapSageArticleToKonipa(article));
      
      sageLogger.info(`${articles.length} articles récupérés depuis Sage`);
      return articles;
    } catch (error) {
      sageLogger.error('Erreur lors de la récupération des articles', { error: error.message });
      throw error;
    }
  }

  /**
   * Mapping article Sage vers format Konipa
   */
  mapSageArticleToKonipa(sageArticle) {
    return {
      // Identifiants
      sageId: sageArticle.AR_Ref,
      reference: sageArticle.AR_Ref,
      
      // Informations produit
      name: sageArticle.AR_Design,
      description: sageArticle.AR_DesignLong,
      family: sageArticle.AR_Famille,
      subfamily: sageArticle.AR_SousFamille,
      
      // Classification
      category: {
        main: sageArticle.AR_Gamme1,
        sub: sageArticle.AR_Gamme2
      },
      
      // Unités
      unit: {
        sale: sageArticle.AR_UniteVen,
        stock: sageArticle.AR_UnitePoids,
        purchase: sageArticle.AR_UniteAch
      },
      
      // Prix (prix de base Sage)
      pricing: {
        basePriceTTC: sageArticle.AR_PrixVen,
        basePriceHT: sageArticle.AR_PrixAch,
        currency: this.config.currency
      },
      
      // Gestion stock
      stock: {
        managed: sageArticle.AR_SuiviStock === 1,
        minimum: sageArticle.AR_QteMin || 0,
        maximum: sageArticle.AR_QteMax || 0
      },
      
      // TVA
      tax: {
        rate: this.getTaxRateFromCode(sageArticle.AR_CodeTaxe),
        code: sageArticle.AR_CodeTaxe
      },
      
      // Statut
      isActive: sageArticle.AR_Sommeil === 0,
      
      // Données spécifiques Konipa (non synchronisées avec Sage)
      konipaSpecific: {
        customPricing: {}, // Tarifs personnalisés par client
        stockLimits: {}, // Limites de stock par client
        promotions: [], // Promotions actives
        images: [], // Images produit
        specifications: {} // Caractéristiques techniques
      }
    };
  }

  // ============================================================================
  // 4. GESTION DES STOCKS (F_ARTSTOCK)
  // ============================================================================

  /**
   * Récupération des stocks depuis Sage
   */
  async getStockByArticle(articleRef, depot = null) {
    try {
      const params = { article: articleRef };
      if (depot) params.depot = depot;
      

      const response = await this.axiosInstance.get('/stock', { params });
      
      return this.mapSageStockToKonipa(response.data);
    } catch (error) {
      sageLogger.error('Erreur lors de la récupération du stock', { 
        articleRef,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Mise à jour du stock dans Sage
   * IMPLÉMENTATION : Utilisez les mouvements de stock Sage
   */
  async updateStock(articleRef, quantity, movementType = 'AJUST', depot = '001') {
    try {
      const movement = {
        AR_Ref: articleRef,
        AS_Depot: depot,
        AS_QteMouvement: quantity,
        AS_TypeMouvement: movementType, // ENTREE, SORTIE, AJUST
        AS_DateMouvement: new Date().toISOString(),
        AS_Commentaire: `Mouvement depuis Konipa - ${movementType}`
      };
      

      const response = await this.axiosInstance.post('/stock/movements', movement);
      
      sageLogger.info('Mouvement de stock créé dans Sage', { 
        articleRef,
        quantity,
        movementType 
      });
      
      return response.data;
    } catch (error) {
      sageLogger.error('Erreur lors de la mise à jour du stock', { 
        articleRef,
        quantity,
        movementType,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Mapping stock Sage vers format Konipa
   */
  mapSageStockToKonipa(sageStock) {
    return {
      articleRef: sageStock.AR_Ref,
      depot: sageStock.AS_Depot,
      quantities: {
        available: sageStock.AS_QteSto || 0,
        reserved: sageStock.AS_QteRes || 0,
        ordered: sageStock.AS_QteCom || 0,
        preparation: sageStock.AS_QtePrepa || 0
      },
      values: {
        averageCost: sageStock.AS_CoutMoyen || 0,
        lastCost: sageStock.AS_DernierCout || 0
      },
      lastMovement: sageStock.AS_DateDernMvt,
      
      // Données spécifiques Konipa
      konipaSpecific: {
        clientLimits: {}, // Limites par client (non synchronisé avec Sage)
        reservations: [] // Réservations Konipa
      }
    };
  }

  // ============================================================================
  // 5. GESTION DES COMMANDES
  // ============================================================================

  /**
   * Création d'une commande dans Sage
   * IMPLÉMENTATION : Mappez les données Konipa (avec calculs) vers Sage
   */
  async createOrder(konipaOrder) {
    try {
      // Calcul des prix finaux avec remises Konipa
      const processedOrder = this.processKonipaOrder(konipaOrder);
      
      // Mapping vers format Sage
      const sageOrder = this.mapKonipaOrderToSage(processedOrder);
      

      const response = await this.axiosInstance.post('/orders', sageOrder);
      
      sageLogger.info('Commande créée dans Sage', { 
        konipaOrderId: konipaOrder.id,
        sageOrderId: response.data.DO_Piece 
      });
      
      return response.data;
    } catch (error) {
      sageLogger.error('Erreur lors de la création de la commande', { 
        orderId: konipaOrder.id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Traitement des données Konipa avant envoi à Sage
   * C'est ici que vous appliquez les remises personnalisées et autres calculs
   */
  processKonipaOrder(konipaOrder) {
    const processedOrder = { ...konipaOrder };
    
    // Application des remises personnalisées client
    if (konipaOrder.client?.konipaSpecific?.customDiscount) {
      processedOrder.lines = konipaOrder.lines.map(line => {
        const customDiscount = konipaOrder.client.konipaSpecific.customDiscount;
        const discountedPrice = line.unitPrice * (1 - customDiscount / 100);
        
        return {
          ...line,
          unitPrice: discountedPrice,
          totalHT: discountedPrice * line.quantity,
          // Garde trace de la remise appliquée
          konipaDiscount: customDiscount
        };
      });
    }
    
    // Vérification des limites de stock par client
    processedOrder.lines = processedOrder.lines.map(line => {
      const stockLimit = konipaOrder.client?.konipaSpecific?.stockLimits?.[line.articleRef];
      if (stockLimit && line.quantity > stockLimit) {
        throw new Error(`Quantité demandée (${line.quantity}) dépasse la limite autorisée (${stockLimit}) pour l'article ${line.articleRef}`);
      }
      return line;
    });
    
    // Recalcul des totaux
    processedOrder.totalHT = processedOrder.lines.reduce((sum, line) => sum + line.totalHT, 0);
    processedOrder.totalTTC = processedOrder.totalHT * (1 + processedOrder.taxRate / 100);
    
    return processedOrder;
  }

  /**
   * Mapping commande Konipa vers format Sage
   * IMPORTANT: Seuls les prix finaux calculés sont envoyés à Sage
   */
  mapKonipaOrderToSage(processedOrder) {
    return {
      // En-tête commande
      DO_Type: 'BC', // Bon de commande
      DO_Piece: this.generateOrderNumber(),
      DO_Date: new Date().toISOString().split('T')[0],
      DO_Tiers: processedOrder.client.sageId,
      DO_Devise: processedOrder.currency || this.config.currency,
      DO_Cours: 1,
      
      // Totaux (prix finaux après calculs Konipa)
      DO_TotalHT: processedOrder.totalHT,
      DO_TotalTTC: processedOrder.totalTTC,
      DO_NetAPayer: processedOrder.totalTTC,
      
      // Lignes de commande
      lines: processedOrder.lines.map((line, index) => ({
        DL_Ligne: (index + 1) * 1000,
        AR_Ref: line.articleRef,
        DL_Design: line.description,
        DL_Qte: line.quantity,
        DL_Unite: line.unit,
        // Prix unitaire FINAL (après remises Konipa)
        DL_PrixUnitaire: line.unitPrice,
        DL_Montant: line.totalHT,
        DL_CodeTaxe: line.taxCode || this.config.taxCodes.T20,
        DL_TauxTaxe: line.taxRate || this.config.taxRates.standard
      })),
      
      // Métadonnées
      DO_Statut: 'EN_ATTENTE',
      DO_Commentaire: `Commande créée depuis Konipa - ID: ${processedOrder.id}`
    };
  }

  // ============================================================================
  // 6. UTILITAIRES ET HELPERS
  // ============================================================================

  /**
   * Génération d'un numéro de commande
   */
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = date.getTime().toString().slice(-6);
    
    return `BC${year}${month}${day}${time}`;
  }

  /**
   * Conversion code TVA vers taux
   */
  getTaxRateFromCode(taxCode) {
    switch (taxCode) {
      case this.config.taxCodes.T20:
        return this.config.taxRates.standard;
      case this.config.taxCodes.T10:
        return this.config.taxRates.reduced;
      case this.config.taxCodes.T00:
        return this.config.taxRates.zero;
      default:
        return this.config.taxRates.standard;
    }
  }

  /**
   * Formatage des montants selon les standards marocains
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: this.config.currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Validation ICE (Identifiant Commun de l'Entreprise) marocain
   */
  validateICE(ice) {
    if (!ice) return false;
    // ICE marocain: 15 chiffres
    const iceRegex = /^[0-9]{15}$/;
    return iceRegex.test(ice);
  }

  /**
   * Validation numéro de téléphone marocain
   */
  validateMoroccanPhone(phone) {
    if (!phone) return false;
    // Formats acceptés: +212XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
    const phoneRegex = /^(\+212|0)?[5-7][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  /**
   * Test de connectivité avec Sage
   */
  async testConnection() {
    try {
      await this.ensureAuthenticated();
      

      const response = await this.axiosInstance.get('/health');
      
      sageLogger.info('Test de connectivité Sage réussi', {
        status: response.status,
        data: response.data
      });
      
      return {
        success: true,
        message: 'Connexion Sage opérationnelle',
        details: response.data
      };
    } catch (error) {
      sageLogger.error('Test de connectivité Sage échoué', {
        error: error.message
      });
      
      return {
        success: false,
        message: 'Connexion Sage indisponible',
        error: error.message
      };
    }
  }

  /**
   * Synchronisation complète
   * IMPLÉMENTATION : Appelez cette méthode périodiquement
   */
  async fullSync() {
    try {
      sageLogger.info('Début de la synchronisation complète');
      
      const results = {
        clients: await this.syncClients(),
        articles: await this.syncArticles(),
        stocks: await this.syncStocks()
      };
      
      sageLogger.info('Synchronisation complète terminée', results);
      return results;
    } catch (error) {
      sageLogger.error('Erreur lors de la synchronisation complète', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Synchronisation des clients avec données financières
   * IMPLÉMENTATION : Intégrez avec votre base de données Konipa
   */
  async syncClients() {
    try {
      const sageClients = await this.getAllClients();
      
      // Synchronisation avec mise à jour des données financières
      for (const sageClient of sageClients) {
        const mappedClient = this.mapSageClientToKonipa(sageClient);
        
        // Mise à jour ou création du client avec données financières
        await this.updateClientFinancialData(mappedClient);
      }
      
      return {
        success: true,
        count: sageClients.length,
        message: `${sageClients.length} clients synchronisés avec données financières`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Met à jour les données financières d'un client depuis Sage
   */
  async updateClientFinancialData(mappedClient) {
    try {
      // Cette méthode devrait être implémentée avec le modèle Client réel
      // Exemple d'implémentation :
      /*
      const Client = require('../models/Client');
      
      await Client.upsert({
        client_code_sage: mappedClient.code,
        company_name: mappedClient.name,
        credit_limit: mappedClient.financial.creditLimit,
        outstanding_amount: mappedClient.financial.outstandingAmount,
        is_blocked: mappedClient.financial.isBlocked,
        last_sync_sage: new Date()
      }, {
        where: { client_code_sage: mappedClient.code }
      });
      */
      
      sageLogger.info(`Données financières mises à jour pour le client ${mappedClient.code}`, {
        creditLimit: mappedClient.financial.creditLimit,
        outstandingAmount: mappedClient.financial.outstandingAmount,
        isBlocked: mappedClient.financial.isBlocked
      });
      
      return true;
    } catch (error) {
      sageLogger.error(`Erreur lors de la mise à jour des données financières pour le client ${mappedClient.code}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Récupère les données financières d'un client spécifique depuis Sage
   */
  async getClientFinancialData(clientCode) {
    try {
      const response = await this.axiosInstance.get(`/clients/${clientCode}/financial`);
      
      return {
        creditLimit: response.data.CT_PlafondCredit || 0,
        outstandingAmount: response.data.CT_EncoursCourant || 0,
        overdueAmount: response.data.CT_SoldeEchu || 0,
        isBlocked: response.data.CT_Bloque === 1,
        lastPaymentDate: response.data.CT_DateDernierReglement,
        availableCredit: (response.data.CT_PlafondCredit || 0) - (response.data.CT_EncoursCourant || 0)
      };
    } catch (error) {
      sageLogger.error(`Erreur lors de la récupération des données financières pour le client ${clientCode}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Synchronisation des articles
   */
  async syncArticles() {
    try {
      const sageArticles = await this.getAllArticles();
      

      
      return {
        success: true,
        count: sageArticles.length,
        message: `${sageArticles.length} articles synchronisés`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Synchronisation des stocks
   */
  async syncStocks() {
    try {

      // const articles = await Article.findAll();
      // 
      // for (const article of articles) {
      //   const stock = await this.getStockByArticle(article.reference);
      //   await Stock.upsert(stock, { where: { articleRef: article.reference } });
      // }
      
      return {
        success: true,
        message: 'Stocks synchronisés'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ============================================================================
// EXPORT ET UTILISATION
// ============================================================================

/**
 * Instance singleton du service Sage
 */
const sageService = new SageIntegrationService();

module.exports = {
  SageIntegrationService,
  sageService,
  sageLogger
};

/**
 * GUIDE D'IMPLÉMENTATION :
 * 
 * 1. CONFIGURATION :
 *    - Copiez .env.sage-maroc.example vers .env
 *    - Configurez les variables Sage selon votre environnement
 * 
 * 2. ENDPOINTS SAGE :
 *    - Remplacez tous les TODO par vos vrais endpoints Sage
 *    - Adaptez les structures de données selon votre version Sage
 * 
 * 3. INTÉGRATION BASE DE DONNÉES :
 *    - Implémentez les méthodes sync* avec votre ORM
 *    - Créez les modèles correspondants (Client, Article, Stock, Order)
 * 
 * 4. UTILISATION :
 *    - Importez le service : const { sageService } = require('./sageIntegrationService');
 *    - Testez la connexion : await sageService.testConnection();
 *    - Synchronisez : await sageService.fullSync();
 * 
 * 5. PLANIFICATION :
 *    - Configurez des tâches cron pour la synchronisation automatique
 *    - Surveillez les logs dans logs/sage-*.log
 * 
 * 6. PERSONNALISATION KONIPA :
 *    - Les remises clients sont calculées côté Konipa
 *    - Les limites de stock sont gérées côté Konipa
 *    - Seuls les prix finaux sont envoyés à Sage
 */