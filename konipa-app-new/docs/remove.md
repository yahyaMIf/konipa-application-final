Tu es un ingénieur full-stack senior. Termine l’industrialisation du projet Konipa B2B en 4 volets :

Nettoyage & standardisation du code (front & back).

Synchro stricte entre le Front (pages/boutons) et le Back (endpoints réels).

Forçage d’utilisation de apiService côté front (zéro fetch en dur, zéro mock côté front).

Validation E2E des workflows clés en mode Mock Sage + rapport détaillé.

0) Pré-requis

Conserver l’architecture frontend/ et backend/ déjà en place.

Le back expose SageApiService avec MockSageApiService (actif via USE_SAGE_MOCK=true).

Tous les endpoints /sync/* existent déjà (catalog, products/:ref/stock, clients/:code, financial-status/:code, invoices, document/:id/pdf, sales-orders, orders/:sageOrderNumber/status).

1) Nettoyage & standardisation (Front)

Router & pages actives

Analyse le/les fichiers de routing (ex. src/app/App.jsx ou src/router/index.jsx).

Liste toutes les pages réellement routées et crée frontend/ACTIVE_PAGES.md.

Déplace en _archive/ tout fichier de src/pages/ non routé (dashboards en doublon, POCs, anciennes versions).

Mets à jour les imports du router si nécessaire (un seul dashboard par rôle).

Suppression des mocks front

Interdit tout import de mockData, dataService ou équivalents dans src/pages et src/components.

Supprime ces fichiers si présents OU isole-les uniquement derrière apiService (jamais importés directement par l’UI).

Ajoute deux scripts dans frontend/package.json :

{
  "scripts": {
    "guard:no-mock-in-pages": "rg -n \"mockData|dataService\" src/pages src/components && echo '❌ mock import found' && exit 1 || echo '✅ no mock'",
    "guard:no-hardcoded-api": "rg -n \"\\\\/api\\\\/\" src/pages src/components && echo '❌ direct /api usage' && exit 1 || echo '✅ endpoints-only'"
  }
}


Corrige le code jusqu’à ce que les deux guards passent en ✅.

Service d’accès API unique

Centralise tous les appels dans frontend/src/services/apiService.(js|ts) avec apiEndpoints.(js|ts).

Zéro fetch/axios direct dans une page.

Les pages n’appellent que des fonctions métier : authService, orderService, productService, etc. (qui wrap apiService).

Dépendances & builds

Exécute depcheck et désinstalle les packages non utilisés.

Assure npm run build OK sans warnings bloquants.

Met à jour .env.example du front :

VITE_API_URL=http://localhost:3001/api
VITE_USE_MOCK=false

2) Nettoyage & standardisation (Back)

Routes montées uniquement

Dans backend/src/app.js, garantis que seules ces routes sont montées :

/api/auth
/api/users
/api/clients
/api/products
/api/orders
/api/documents
/uploads (static)
/sync/* (Sage abstraction)


Supprime tout fichier de route/controller non monté.

Services Sage — injection unique

Dans app.js, injection via flag :

const useMock = process.env.USE_SAGE_MOCK === 'true';
const SageApi = useMock
  ? require('./services/sage/MockSageApiService')
  : require('./services/sage/RealSageApiService');
app.locals.sage = new SageApi(process.env.SAGE_API_BASE, process.env.SAGE_API_KEY);


Interdit tout appel direct à Sage ailleurs.

Modèles, migrations, seeders

Confirme que tous les modèles référencés par les routes existent et ont leurs migrations.

Les tables avancées (price_overrides, quotas, product_substitutes, product_stocks, transfer_requests, grouped_orders, documents, notifications, audit_logs) :

Garde uniquement celles utilisées par des endpoints réellement consommés par le front aujourd’hui.

Les autres migrations/seeders → déplacer en backend/src/_staged_migrations/ (non exécutées).

Script DB :

{
  "scripts": {
    "migrate": "sequelize db:migrate",
    "seed": "sequelize db:seed:all",
    "reset:db": "sequelize db:migrate:undo:all && sequelize db:migrate && sequelize db:seed:all"
  }
}


.env.example back minimal

PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=konipa
DB_USER=konipa
DB_PASS=konipa
USE_SAGE_MOCK=true
SAGE_API_BASE=http://sage.local/api
SAGE_API_KEY=changeme
JWT_SECRET=changeme
JWT_REFRESH_SECRET=changeme

3) Synchro stricte Front ↔ Back (mapping des actions)

Pour chaque page active (du fichier ACTIVE_PAGES.md) :

Lister les actions UI (clics/boutons/formulaires) → mapper l’endpoint backend appelé, la méthode HTTP, et la méthode MockSageApiService concernée si /sync/*.

Mettre ce mapping dans frontend/WORKFLOW_CHECK.md.

Pages & actions minimales à valider

Auth

Login → POST /api/auth/login → JWT stocké (HttpOnly ou storage selon implémentation).

Logout → clear token.

Client Dashboard

Récup stats client → /api/clients/me/summary (ou équivalent).

3 dernières commandes → /api/orders?mine=true&limit=3.

Catalogue & produit

Liste produits (pagination/filtre) → /api/products (lecture prix_base_ht depuis cache Sage + remises portail).

Détail produit (stocks multi-dépôts) → /api/products/:ref + /sync/products/:ref/stock.

Substituts → /api/products/:id/substitutes.

Ajouter au panier (panier local ou /api/orders/draft).

Panier & Checkout

Voir panier (DRAFT) → /api/orders/current.

Calcul prix final (prix_base_ht * remises portail) côté back.

Vérifier plafond “en compte” avant validation → /sync/financial-status/:clientCode.

Soumettre commande → PATCH /api/orders/:id/status SUBMITTED.

Comptabilité

Voir commandes SUBMITTED → /api/orders?status=SUBMITTED.

Valider → PATCH /api/orders/:id/status VALIDATED

Side effect : POST /sync/sales-orders → sageOrderNumber stocké en DB.

Refuser → statut REFUSED.

Comptoir

Voir VALIDATED → /api/orders?status=VALIDATED|PREPARATION|READY.

Passer à PREPARATION → PATCH /api/orders/:id/status.

Passer à READY → idem.

Passer à SHIPPED → idem + (optionnel) POST /sync/orders/:sageOrderNumber/status.

Documents

Lister factures/BL → /sync/invoices?clientCode=... et équivalent BL.

Télécharger PDF → GET /sync/document/:id/pdf (stream → download).

Chaque bouton/page doit être relié à un endpoint réel. Aucune action “présentative”.

4) Validation E2E (USE_SAGE_MOCK=true) + Rapport

Mettre USE_SAGE_MOCK=true, lancer le back + front, seeder 50 clients CLI001-CLI050, 200 produits AR001-AR200, 3 entrepôts.

Exécuter manuellement (ou via scripts d’API) ces scénarios et documenter dans WORKFLOW_CHECK.md :

Client → ajoute produits → checkout → SUBMITTED.

Comptabilité → VALIDATED → création BC via /sync/sales-orders → sageOrderNumber stocké.

Comptoir → PREPARATION → READY → SHIPPED.

Client → Mes documents : liste factures/BL + téléchargement PDF (mock).

Produits en rupture → affichage substituts.

Vérif plafond en compte : si dépassé, blocage du mode paiement en compte.

Notifications : journalisation (au moins Web/Email ; WhatsApp/SMS si clé fournie, sinon stub) + coût si simulé.

Audit logs : chaque transition de statut doit créer une entrée (qui, quand, quoi, avant/après).

Ajouter à WORKFLOW_CHECK.md :

✅ Actions OK (page → endpoint → MockSageApiService)

⚠️ Manques détectés (expliquer quoi créer/corriger)

Captures de réponses JSON (extraits) si utile

5) Livrables & critères de Done

frontend/ACTIVE_PAGES.md → liste des pages réellement routées.

frontend/WORKFLOW_CHECK.md → mapping complet UI → API → Mock Sage + résultats des scénarios E2E.

frontend/package.json avec scripts guards (et ✅ au run).

backend : routes strictes montées, services Sage injectés via flag, migrations/seeders uniquement pour ce qui est utilisé aujourd’hui (le reste en _staged_migrations/).

Build front OK, start back OK, workflows E2E fonctionnels en USE_SAGE_MOCK=true.

Aucune page n’importe de mocks front ni n’appelle /api en dur.

👉 Exécute toutes les modifications, supprime/ archive le code mort, corrige les imports, et fournis les deux rapports (ACTIVE_PAGES.md + WORKFLOW_CHECK.md).