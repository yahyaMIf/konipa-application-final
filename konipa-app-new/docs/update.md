Tu es un expert full-stack (Vue 3 / React, Vite, Node.js, Express, Sequelize, PostgreSQL/MySQL/SQLite, JWT, TailwindCSS, NestJS).
Ton rôle est de réviser et corriger complètement le projet Konipa B2B (frontend React + backend Express/Sequelize) afin de :

Supprimer toutes les actions de démonstration (mock, localStorage, data fake).

Relier chaque page du frontend aux endpoints backend réels.

Compléter le backend avec les routes manquantes.

Nettoyer la configuration pour qu’elle soit cohérente (DB, Docker).

Préparer la structure afin que, plus tard, il soit facile de remplacer le backend mock par les services web Sage 100c réels.

🎯 Objectifs globaux

Frontend

Utiliser uniquement apiService.js + apiEndpoints.js pour appeler le backend.

Supprimer toute dépendance à mockData.js et dataService.js (ou les isoler dans un mode VITE_USE_MOCK=true via .env).

Nettoyer AuthContext.jsx pour utiliser seulement authService.

Corriger toutes les pages (AdminPanel, Dashboard, Orders, Products, etc.) pour qu’elles consomment le backend.

Backend

Ajouter les routes manquantes pour coller aux besoins des pages (toggle status user, reset password, update order status, substitutes produits).

Clarifier DB : soit SQLite (dev) soit MySQL (Docker). Retirer la confusion actuelle.

Ajouter un seeding complet (users avec rôles, produits, clients, commandes).

S’assurer que chaque endpoint renvoie un JSON cohérent pour les pages React.

Préparation intégration Sage

Isoler toute la logique métier dans des services (services/sage/MockSageApiService.js + RealSageApiService.js).

Aujourd’hui, utiliser le Mock (données en DB locale).

Demain, remplacer par des appels HTTP vers Sage (mêmes signatures d’API).

📂 Travail fichier par fichier
1. Frontend
src/contexts/AuthContext.jsx

Supprimer import mockUsers.

Ne jamais fallback sur mock.

login() doit appeler authService.login(credentials) → qui appelle /api/auth/login.

Stocker uniquement user et tokens du backend.

Rafraîchir user via authService.refresh().

src/services/apiEndpoints.js

Vérifier et compléter :

USERS: LIST, CREATE, UPDATE(id), DELETE(id), TOGGLE_STATUS(id), CHANGE_PASSWORD(id)

PRODUCTS: LIST, DETAIL(id), CREATE, UPDATE(id), DELETE(id), UPLOAD_IMAGE(id), SUBSTITUTES(id)

ORDERS: LIST, DETAIL(id), CREATE, UPDATE_STATUS(id)

CLIENTS: LIST, DETAIL(id)

CATEGORIES/BRANDS idem

src/services/apiService.js

Centraliser tous les appels.

Ajouter gestion automatique du refreshToken.

Logger les erreurs en console + afficher toast UI (optionnel).

src/data/mockData.js et src/services/dataService.js

Supprimer ou isoler derrière if (import.meta.env.VITE_USE_MOCK).

Mode prod = jamais appelés.

src/pages/AdminPanel.jsx

Remplacer tous les appels /api/admin/users/... en dur par USER_ENDPOINTS.*.

Les boutons “Modifier, Supprimer, Activer/Désactiver, Reset password” doivent appeler le backend réel.

Supprimer logique locale (tableaux de mock).

src/pages/Dashboards/*

ClientDashboard → commandes réelles (/api/orders?clientId=xxx).

ComptabilitéDashboard → liste commandes status=SUBMITTED. Bouton “Valider/Refuser” = PATCH /api/orders/:id/status.

CounterDashboard → commandes status=VALIDATED à préparer. Boutons = PATCH status.

ReprésentantDashboard → liste clients (/api/clients?repId=xxx) + commandes clients.

src/pages/Catalog.jsx / ProductDetail.jsx

Liste = /api/products avec filtres (search, marque, modèle, année → query params).

Detail produit = /api/products/:id.

Bouton Ajouter au panier → ajoute dans orderDraft côté frontend (state Pinia/React Context).

Substituts = /api/products/:id/substitutes.

src/pages/Orders.jsx / OrderDetail.jsx

Historique = /api/orders filtrés par user.

Detail = /api/orders/:id.

Bouton “Recommander” = POST /api/orders avec les lignes copiées.

2. Backend
routes/users.js

CRUD existant ok. Ajouter :

PATCH /api/users/:id/toggle-status → flip isActive.

PATCH /api/users/:id/password → reset password (bcrypt).

routes/orders.js

Ajouter PATCH /api/orders/:id/status → payload {status: "VALIDATED"|"PREPARATION"|"READY"|"SHIPPED"}.

routes/products.js

Ajouter gestion substituts :

GET /api/products/:id/substitutes

POST /api/products/:id/substitutes (body = liste de refs/id).

models/ (Sequelize)

User: id, email, password, role, isActive.

Client: id, codeSage, nom, plafondCredit, encours, blocked.

Product: id, ref, name, price, stock, brandId, categoryId.

ProductSubstitute: productId, substituteId, rank.

Order: id, userId, clientId, status, total, etc.

OrderItem: orderId, productId, quantity, price.

Brand, Category: simples.

seed.js (ou dans models/index.js)

Créer au moins 1 user par rôle (admin, client, rep, compta, comptoir).

Créer 50 produits répartis en catégories/marques.

Créer 5 clients avec plafonds/encours variés.

Créer 10 commandes avec statuts différents.

app.js / server.js

Monter routes :

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/clients', require('./src/routes/clients'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/brands', require('./src/routes/brands'));


Ajouter app.use('/uploads', express.static('uploads'));.

3. DB & Config
.env

Mode simple (SQLite) :

PORT=3001
DB_PATH=./database/konipa.db
JWT_SECRET=supersecret
JWT_REFRESH_SECRET=superrefresh
CORS_ORIGIN=http://localhost:5173


Mode MySQL (Docker) :

DB_HOST=db
DB_USER=root
DB_PASS=password
DB_NAME=konipa
DB_DIALECT=mysql


⚠️ Choisir un seul mode, supprimer l’autre.

docker-compose.yml

Si MySQL: garde db + redis, modifie backend pour mysql.

Si SQLite: supprime services inutiles, ne garde que backend + frontend.

4. Préparation intégration Sage

Créer backend/src/services/sage/SageApiService.js (interface).

Créer backend/src/services/sage/MockSageApiService.js (implé actuelle = Sequelize DB).

Créer backend/src/services/sage/RealSageApiService.js (futur = appels HTTP → Sage).

Dans controllers (users, products, orders, clients), utiliser toujours SageApiService.

Paramétrer via .env:

USE_SAGE_MOCK=true
SAGE_API_BASE=http://sage.local:8080/api
SAGE_API_KEY=xxx

✅ Livraison attendue

À la fin :

Tous les écrans front appellent le backend (plus de mock direct).

Backend expose tous les endpoints nécessaires aux boutons.

DB contient des données réalistes pour tester chaque rôle.

Un simple USE_SAGE_MOCK=false permet de basculer sur la vraie API Sage.

Code prêt à être packagé en app mobile (PWA + Capacitor/Ionic si besoin).  Tu vas reprendre le projet Konipa B2B (frontend React + Vite, backend Express + Sequelize).
Objectif : supprimer tout comportement “démonstration” (mock/localStorage), câbler 100% des écrans au backend réel, compléter le backend (endpoints manquants), stabiliser la base de données, et préparer une couche d’abstraction Sage (Mock aujourd’hui, “Real” demain) pour un switch propre quand les web services seront livrés.

⚠️ Règle d’or : plus aucun composant/front ne doit appeler de mock ni de données locales (sauf si VITE_USE_MOCK=true, et dans ce cas, l’injection de mock se fait uniquement à l’intérieur d’apiService.js, jamais dans les pages).

✅ LIVRABLES ATTENDUS

Frontend :

Toutes les pages (Admin, Comptabilité, Comptoir, Client, Représentant, Catalogue, Panier, Commandes, Documents, Profil) consomment l’API via apiService.js et apiEndpoints.js.

Zéro import direct de mockData.js / dataService.js dans les pages.

AuthContext.jsx sans fallback mock (login/refresh/logout 100% API).

Erreurs et chargements gérés proprement (toasts + states).

Backend :

Endpoints alignés sur les besoins des écrans (toggle status user, reset password, update order status, substituts produits).

Seeding réaliste (utilisateurs par rôle, clients, produits, commandes).

Base SQLite (simple) ou MySQL (Docker) — choisis UNE seule voie et rends-la cohérente.

Expose /uploads (images produits).

Sage :

SageApiService (interface), MockSageApiService (utilise DB), RealSageApiService (TODO placeholders clairs, pas “…/code tronqué”).

.env: USE_SAGE_MOCK=true|false.

Qualité :

Lint OK, build OK, démarrage OK.

Script de contrôle : aucune occurrence de chaînes /api/... codées en dur dans les pages (utiliser apiEndpoints).

Script de contrôle : aucune importation de mockData.js / dataService.js dans les pages.

🧭 ARBORESCENCE (repère)
konipa_application_finale_complete/
└─ konipa-app-new/
   ├─ backend/
   │  ├─ src/
   │  │  ├─ app.js / server.js
   │  │  ├─ config/database.js
   │  │  ├─ models/ (User, Client, Product, Order, OrderItem, Brand, Category, ProductSubstitute, etc.)
   │  │  ├─ routes/ (auth.js, users.js, products.js, orders.js, clients.js, categories.js, brands.js)
   │  │  ├─ controllers/ (...Controller.js)
   │  │  ├─ middleware/ (auth, upload, error)
   │  │  ├─ services/sage/ (SageApiService.js, MockSageApiService.js, RealSageApiService.js)
   │  │  └─ seed.js (ou seeding dans models/index.js)
   │  └─ uploads/ (exposé en statique)
   └─ src/ (frontend React)
      ├─ contexts/AuthContext.jsx
      ├─ services/
      │  ├─ apiService.js
      │  ├─ apiEndpoints.js
      │  ├─ authService.js
      │  ├─ productService.js, orderService.js, userService.js, clientService.js (facultatif)
      │  ├─ dataService.js   ← à neutraliser/supprimer
      │  └─ mockData.js      ← à neutraliser/supprimer
      ├─ pages/
      │  ├─ AdminPanel.jsx
      │  ├─ Catalog.jsx
      │  ├─ ProductDetail.jsx
      │  ├─ Cart.jsx / Checkout.jsx
      │  ├─ Orders.jsx / OrderDetail.jsx
      │  ├─ dashboards/
      │  │  ├─ ClientDashboard.jsx
      │  │  ├─ AccountingDashboard.jsx
      │  │  ├─ CounterDashboard.jsx
      │  │  └─ RepresentativeDashboard.jsx
      │  └─ Documents.jsx / Profile.jsx / Login.jsx / ForgotPassword.jsx
      ├─ components/ (Table, Modal, Toast, etc.)
      └─ main.jsx / router.jsx / App.jsx

🧹 ÉTAPE 0 — NETTOYAGE AUTOMATISÉ

Désactiver mock dans les pages

Chercher dans src/pages et src/components :

imports de mockData.js et dataService.js → supprimer.

chaînes /api/ en dur → remplacer par API_ENDPOINTS.

Ajouter un script NPM de contrôle :

npm run guard:no-mock → échoue si mockData ou dataService importés dans src/pages/src/components.

npm run guard:no-hardcoded-api → échoue si /api/ trouvé hors services.

Uniformiser la base

Choix A (recommandé pour dev) : SQLite

Backend lit DB_PATH dans .env.

Supprimer la partie MySQL de docker-compose.yml (ou créer docker-compose.sqlite.yml clair).

Choix B : MySQL (Docker)

Adapter config/database.js pour MySQL (host, user, pass, dialect).

Supprimer tout mention/usage de DB_PATH.

Tu dois livrer UNE configuration cohérente (pas un mix).

🔐 ÉTAPE 1 — AUTH 100% API
FRONT — src/contexts/AuthContext.jsx

Supprimer tout fallback à mockUsers.

Implémenter :

login(email, password) → authService.login → set user + tokens.

refresh() → authService.refresh (appel automatique par apiService si 401).

logout() → authService.logout (invalide côté API si prévu + clear state).

Persister uniquement ce qui vient de l’API (pas de user mock).

Si login échoue → toast d’erreur, aucun contournement.

FRONT — src/services/apiService.js

Axios instance avec baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api", withCredentials:false.

Intercepteur response : si 401 et refreshToken présent → tenter POST /auth/refresh, mettre à jour accessToken, rejouer la requête. Sinon → logout.

Si VITE_USE_MOCK === "true" : les mocks sont gérés ici (retourner des réponses simulées) — nulle part ailleurs.

FRONT — src/services/apiEndpoints.js

Définir toutes les constantes :

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  FORGOT: '/auth/forgot',
  RESET: '/auth/reset',
};
export const USER_ENDPOINTS = {
  LIST: '/users',
  CREATE: '/users',
  UPDATE: (id) => `/users/${id}`,
  DELETE: (id) => `/users/${id}`,
  TOGGLE_STATUS: (id) => `/users/${id}/toggle-status`,
  CHANGE_PASSWORD: (id) => `/users/${id}/password`,
};
export const PRODUCT_ENDPOINTS = {
  LIST: '/products',
  DETAIL: (id) => `/products/${id}`,
  CREATE: '/products',
  UPDATE: (id) => `/products/${id}`,
  DELETE: (id) => `/products/${id}`,
  UPLOAD_IMAGE: (id) => `/products/${id}/image`,
  SUBSTITUTES: (id) => `/products/${id}/substitutes`,
};
export const ORDER_ENDPOINTS = {
  LIST: '/orders',
  DETAIL: (id) => `/orders/${id}`,
  CREATE: '/orders',
  UPDATE_STATUS: (id) => `/orders/${id}/status`,
  REORDER: (id) => `/orders/${id}/reorder`,
};
export const CLIENT_ENDPOINTS = {
  LIST: '/clients',
  DETAIL: (id) => `/clients/${id}`,
};
export const DOC_ENDPOINTS = {
  LIST: '/documents',
  PDF: (id) => `/documents/${id}/pdf`,
};
export const META_ENDPOINTS = {
  CATEGORIES: '/categories',
  BRANDS: '/brands',
  SETTINGS: '/settings',
};


Tous les composants/pages doivent importer ces endpoints au lieu d’écrire /api/... en dur.

BACK — routes/auth.js

Endpoints : POST /login, POST /refresh, POST /logout, GET /me, POST /forgot, POST /reset.

login : valide mot de passe (bcrypt), renvoie {accessToken, refreshToken, user}.

refresh : valide refreshToken (DB/whitelist optionnelle), renvoie nouveau accessToken.

logout : invalide refreshToken si tu l’enregistres.

me : renvoie user courant (id, email, role, status).

👤 ÉTAPE 2 — ADMIN UTILISATEURS (fichier par fichier)
FRONT — src/pages/AdminPanel.jsx

Remplacer toutes les URLs codées en dur /api/admin/users/... par USER_ENDPOINTS.

Boutons :

Créer → POST USER_ENDPOINTS.CREATE (payload : email, role, clientId?, firstName, lastName).

Modifier → PUT USER_ENDPOINTS.UPDATE(id).

Supprimer → DELETE USER_ENDPOINTS.DELETE(id).

Activer/Désactiver → PATCH USER_ENDPOINTS.TOGGLE_STATUS(id).

Changer MDP → PATCH USER_ENDPOINTS.CHANGE_PASSWORD(id) (payload : newPassword).

Table liste : GET USER_ENDPOINTS.LIST?role=&q=&page=&limit=.

Aucun tableau de données locales.

BACK — routes/users.js + controllers/userController.js

CRUD classique (+ pagination/filtre).

Ajouter :

PATCH /users/:id/toggle-status → inverse isActive (true/false), renvoie user.

PATCH /users/:id/password → hash bcrypt, met à jour passwordHash.

Guards : accès admin uniquement.

DTO/validations : email unique, role ∈ {admin, client, representative, accountant, counter}.

📦 ÉTAPE 3 — CATALOGUE & PRODUITS
FRONT — src/pages/Catalog.jsx

Liste produits → GET PRODUCT_ENDPOINTS.LIST avec params : q, brand, model, year, page, limit.

Ajouter au panier (si panier local) ou créer commande brouillon (si tu gères un panier côté API).

Filtres UI connectés (marque/modèle/année).

Pagination.

FRONT — src/pages/ProductDetail.jsx

Détails → GET PRODUCT_ENDPOINTS.DETAIL(id)

Stock par dépôt (si implémenté) → GET /products/:id/stock (optionnel si pas encore de dépôts)

Substituts → GET PRODUCT_ENDPOINTS.SUBSTITUTES(id)

Bouton “Ajouter au panier” → même logique que Catalog.

BACK — routes/products.js + controllers/productController.js

GET /products : recherche + filtres + pagination.

GET /products/:id : détails.

POST /products : admin only.

PUT /products/:id : admin only.

DELETE /products/:id : admin only.

POST /products/:id/image : upload (multer), enregistre chemin dans DB. Expose /uploads statique.

Substituts :

Modèle ProductSubstitute (productId, substituteId, rank)

GET /products/:id/substitutes → liste (max 5).

POST /products/:id/substitutes → admin only, payload [substituteId,...] (gère le rank automatiquement 1..5).

🛒 ÉTAPE 4 — PANIER & COMMANDES

Si tu n’as pas (encore) un “panier” persistant côté API, tu peux :

garder un panier côté front et au checkout appeler POST /orders avec les lignes, ou

créer une table Cart / CartItem côté API.
Pour aller vite, implémente directement les commandes.

FRONT — src/pages/Cart.jsx / src/pages/Checkout.jsx

Cart.jsx : liste locale des items (ou chargée de l’API si Cart implémenté).

Checkout.jsx : au clic “Valider la commande” → POST ORDER_ENDPOINTS.CREATE { clientId, transporter, lines:[{productId, qty}] } → redirige /orders/:id.

FRONT — src/pages/Orders.jsx / src/pages/OrderDetail.jsx

Liste → GET ORDER_ENDPOINTS.LIST?status=&from=&to=&page= (selon rôle, filtrage différent).

Détail → GET ORDER_ENDPOINTS.DETAIL(id) (lignes, statuts/historique).

“Recommander” → POST ORDER_ENDPOINTS.REORDER(id) → remplit panier local ou crée commande directe (au choix).

BACK — routes/orders.js + controllers/orderController.js

POST /orders → crée commande (status par défaut SUBMITTED, total calculé = somme lignes).

GET /orders → liste (filtrable par status, clientId, userId, période).

GET /orders/:id → détail + items + historique statuts (si table OrderLog).

Workflow statuts :

PATCH /orders/:id/status → payload {status: "VALIDATED"|"PREPARATION"|"READY"|"SHIPPED"|"DELIVERED"|"REFUSED"}

Comptabilité exécute VALIDATED / REFUSED

Comptoir exécute PREPARATION → READY → SHIPPED

Reorder :

POST /orders/:id/reorder → recopie les items en une nouvelle commande SUBMITTED (ou remplit un panier si tu l’as côté API).

Plus tard, quand Sage sera branché, VALIDATED pourra déclencher createSalesOrder côté Sage. Pour l’instant, MockSageApiService doit juste simuler la réussite et stocker un sageOrderNumber mock dans la commande.

🧾 ÉTAPE 5 — DOCUMENTS
FRONT — src/pages/Documents.jsx

Liste → GET DOC_ENDPOINTS.LIST?type=invoice|delivery_note&from=&to=&page=

Bouton PDF → GET DOC_ENDPOINTS.PDF(id) (stream ou url à ouvrir)

BACK — routes/documents.js + controllers/documentController.js

GET /documents → liste (type, date, montant, status).

GET /documents/:id/pdf → en dev, renvoie un PDF factice (placeholder) ou un fichier depuis /uploads/docs/.

Plus tard, RealSageApiService remplacera ces mocks avec GetInvoices, GetDeliveryNotes.

💼 ÉTAPE 6 — CLIENT 360°, REPRÉSENTANT, COMPTABILITÉ, COMPTOIR
FRONT — dashboards/ClientDashboard.jsx

“3 dernières commandes” → GET /orders?clientId=me&limit=3

“5 produits les plus commandés” → soit un endpoint analytics (/analytics/top-products?clientId=me&limit=5) soit calcul côté front sur l’historique reçu.

Raccourcis : “Nouvelle commande” → /catalog, “Mes Factures” → /documents?type=invoice, “Mes Dernières Commandes” → /orders.

FRONT — dashboards/RepresentativeDashboard.jsx

Liste clients du rep → GET /clients?repId=me

Stats perso (CA, nb commandes) → simple agrégat via /orders?repId=me (ou endpoint /analytics/rep/summary).

Devis : Mock simple → table Quote (optionnel), ou créer une commande SUBMITTED non confirmée.

FRONT — dashboards/AccountingDashboard.jsx

“Commandes soumises” → GET /orders?status=SUBMITTED

Boutons Valider/Refuser → PATCH /orders/:id/status (VALIDATED ou REFUSED)

Traçabilité : côté back, logger l’acteur (userId + rôle) dans OrderLog (ou AuditLog).

FRONT — dashboards/CounterDashboard.jsx

Files :

APPROVED/VALIDATED → à préparer

PREPARATION → en cours

READY → prêtes

Boutons :

PREPARATION → PATCH status: "PREPARATION"

READY → PATCH status: "READY"

SHIPPED → PATCH status: "SHIPPED"

Feuille de préparation PDF : endpoint mock /orders/:id/picking-sheet (fichier pdf simple).

BACK — routes/clients.js + controllers/clientController.js

GET /clients (filtre par repId, q)

GET /clients/:id (vue 360° : infos, encours mock, impayés mock, historique commandes/documents)

Si tu veux des analytics : créer /analytics/* (facultatif).

🧩 ÉTAPE 7 — ABSTRACTION SAGE (SWITCH MOCK → RÉEL)
BACK — src/services/sage/SageApiService.js

Exporter une classe interface (ou objet avec signatures) :

class SageApiService {
  async getClientList() {}
  async getClientDetails(code) {}
  async getProductCatalog() {}
  async getProductDetails(ref) {}
  async getProductStock(ref) {}
  async createSalesOrder(payload) {}
  async updateOrderStatus(id, status) {}
  async getDocument(id) {}
  async getFinancialStatus(clientId) {}
}
module.exports = SageApiService;

BACK — src/services/sage/MockSageApiService.js

Implémenter toutes ces méthodes en lisant/écrivant dans la DB locale (Sequelize) :

getFinancialStatus(clientId) → renvoyer { creditLimit, outstanding } depuis Client.

createSalesOrder → insère un champ sageOrderNumber factice sur la commande.

getDocument → renvoie chemin PDF local.

USE_SAGE_MOCK=true → injecter cette implémentation dans les contrôleurs.

BACK — src/services/sage/RealSageApiService.js

Implé structure (axios) + TODOs clairs (pas de “…”) :

const axios = require('axios');
class RealSageApiService extends SageApiService {
  constructor(baseUrl, apiKey) { super(); this.http = axios.create({ baseURL: baseUrl, headers: { 'x-api-key': apiKey } }); }
  async getClientList() { /* TODO: map réponse Sage → format interne */ }
  // idem pour toutes les méthodes
}
module.exports = RealSageApiService;

BACK — Injection selon .env

Dans app.js (ou un container.js) :

const useMock = process.env.USE_SAGE_MOCK === 'true';
const SageApi = useMock ? require('./services/sage/MockSageApiService') : require('./services/sage/RealSageApiService');
app.locals.sage = new SageApi(process.env.SAGE_API_BASE, process.env.SAGE_API_KEY);


Dans les contrôleurs qui ont besoin de Sage : const sage = req.app.locals.sage;

🗃️ ÉTAPE 8 — MODÈLES SEQUELIZE (rappels)

User: id, email (unique), passwordHash, role ∈ {admin, client, representative, accountant, counter}, isActive(bool).

Client: id, codeSage, companyName, vat, address, creditLimit, outstanding, blocked(bool), repId?

Product: id, ref(unique), name, brandId, categoryId, basePriceHT, stock (global), imageUrl.

ProductSubstitute: productId, substituteId, rank(1..5).

Order: id, clientId, placedByUserId, status ∈ {SUBMITTED, VALIDATED, PREPARATION, READY, SHIPPED, DELIVERED, REFUSED}, transporter, totalHT, totalTTC, sageOrderNumber?

OrderItem: orderId, productId, qty, unitPriceHT, discountPct, lineTotalHT.

Document: id, clientId, type ∈ {invoice, delivery_note}, number, date, amountTTC, paymentStatus, pdfPath.

Brand, Category (simples).

Si tu veux le stock par dépôt : créer Warehouse (IBN/DRB/VLT) + ProductStock (productId, warehouseId, qty) + endpoints.

🌱 ÉTAPE 9 — SEED RÉALISTE

Dans backend/src/seed.js (ou models/index.js si tu seeds là) :

Users :

admin: admin@konipa.com / Admin123!

comptable: compta@konipa.com / Compta123!

comptoir: comptoir@konipa.com / Comptoir123!

représentant: rep@konipa.com / Rep123!

client A: clientA@konipa.com / Client123! (lié à Client C001)

client B: clientB@konipa.com / Client123!

Clients : C001, C002 (creditLimit, outstanding variés).

Brands/Categories : quelques entrées.

Products : 50 items (refs, prix, brand/category, imageUrl dummy).

Substituts : 0..5 par produit.

Orders : 10 commandes (statuts variés) avec OrderItems.

Documents : 6 docs (invoices/BL) avec pdfPath pointant vers /uploads/docs/*.pdf (placeholders).

🚦 ÉTAPE 10 — ROUTAGE & MIDDLEWARE BACK

Dans backend/src/app.js (ou server.js) :

// Sécurité de base
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'], credentials: false }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/documents', require('./routes/documents'));

// 404 / error handler

🖼️ ÉTAPE 11 — UPLOAD IMAGES PRODUITS

POST /products/:id/image → multer, stocker dans uploads/products/ et Product.imageUrl = '/uploads/products/xxx.jpg'.

Front (ProductDetail.jsx) : afficher imageUrl.

Dans la liste, montrer miniatures.

🧪 ÉTAPE 12 — TESTS RAPIDES & SCRIPTS
Scripts frontend

"guard:no-mock": "rg -n \"mockData|dataService\" src/pages src/components && exit 1 || exit 0"

"guard:no-hardcoded-api": "rg -n \"\\/api\\/\" src/pages src/components && exit 1 || exit 0"

Scripts backend

"db:reset": "node ./src/seed.js"

"start:dev": "nodemon src/app.js" (ou server.js)

Parcours manuel

Login admin → AdminPanel CRUD user OK, toggle status OK, change password OK.

Catalog → liste, filtres, détails, substituts OK, upload image OK.

Panier/Checkout → POST /orders OK.

Comptabilité → Valider/Refuser OK, UI rafraîchie.

Comptoir → PREPARATION/READY/SHIPPED OK, UI rafraîchie.

Documents → liste + PDF placeholder OK.

Représentant → clients, stats, (devis mock si implémenté) OK.

Client → 3 dernières commandes, top produits, raccourcis OK.

🧷 ÉTAPE 13 — SWITCH SAGE (quand prêt)

.env : USE_SAGE_MOCK=false, SAGE_API_BASE=https://sage.example/api, SAGE_API_KEY=xxx.

app.locals.sage devient RealSageApiService.

Contrôleurs qui utilisent sage n’ont aucun changement (interfaces identiques).

Tests :

createSalesOrder au VALIDATED côté comptabilité → renvoie sageOrderNumber.

getDocument renvoie facture/BL réels.

getFinancialStatus bloque paiement “En Compte” si plafond dépassé.

🧽 ÉTAPE 14 — NETTOYAGE FINAL

Supprimer définitivement mockData.js / dataService.js si VITE_USE_MOCK=false en prod.

Supprimer tout code/commentaires morts, console.log inutiles.

Ajouter CLEANUP_REPORT.md listant :

fichiers supprimés

fichiers créés

endpoints ajoutés

choix DB (SQLite ou MySQL)

TODO restant pour RealSage (clairs, sans “…”).

💬 REMARQUES D’IMPLÉMENTATION (à respecter)

Jamais de ... / code tronqué. Si TODO → commente clairement ce qu’il reste à faire (1–2 lignes max) et retourne une valeur neutre (pas d’exception silencieuse).

Aucun accès direct à /api/... dans les pages : passer par apiEndpoints.

Aucun import de mock dans les pages : mock uniquement dans apiService quand VITE_USE_MOCK=true.

Les roles & guards côté back doivent sécuriser :

/users/* → admin

/products POST/PUT/DELETE → admin

orders PATCH status → compta/comptoir selon transitions

Les réponses API suivent { data, meta? } (listes paginées ont meta:{page,limit,total}).

📌 CHECKLIST FINALE (DoD)

 Front : plus aucun import mockData / dataService dans src/pages|components.

 Front : plus aucune string /api/ en dur dans src/pages|components.

 Auth : login/refresh/logout 100% API, plus de fallback mock.

 Admin : CRUD users + toggle status + change password → réel et persistant DB.

 Catalog/Product : liste, détail, substituts, upload image → réel.

 Orders : création + workflow statuts (Compta/Comptoir) → réel.

 Documents : listing + PDF téléchargés (mock local) → réel.

 Client/Rep dashboards : réel (données DB).

 Seed : rôles, clients, produits, commandes, docs → complet.

 DB : SQLite ou MySQL, pas les deux.

 Sage : abstraction prête, USE_SAGE_MOCK opérationnel.

 CLEANUP_REPORT.md présent.

 Lint/build OK.