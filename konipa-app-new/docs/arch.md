1) Ce qui vient de Sage (ou mocké pour l’instant)

Source de vérité : Sage (via services web). En dev → MockSageApi renvoie les mêmes formes de réponses.

A. Référentiels (lecture depuis Sage)

Clients

clientCode (clé Sage), raison sociale, adresses, TVA, contacts

Plafond de crédit, encours, impayés (montants & échéances)

Statut commercial (actif/bloqué/comptable) — si géré dans Sage

Articles / Catalogue

Réf (AR_Ref), désignation, famille/catégorie, marque si disponible

Prix de base HT (tarif public/base)

Stocks par entrepôt (multi-dépôts)

Entrepôts (codes dépôts)

Documents comptables

Factures (liste + PDF), BL (liste + PDF), règlements (si utile)

Commandes / BL / Factures existantes (historique “officiel”)

B. Transactions (écriture vers Sage)

Création de Bon de Commande (quand la compta valide dans le portail)

Retourne numéro BC Sage

Mise à jour statut / transformation (ex. expédition)

Selon le process retenu (BL/Facturation)

(Optionnel) Demandes de transfert inter-entrepôts si vous décidez de les tracer dans Sage

C. Services web côté Sage (contrat minimal)

GetClientList() / GetClientDetails(clientCode)

GetFullCatalog() / GetProductDetails(productRef)

GetProductStock(productRef) → par dépôt

GetFinancialStatus(clientCode) → plafond, encours, impayés

GetInvoices(clientCode) / GetDeliveryNotes(clientCode) + GetDocument(documentId) (PDF)

CreateSalesOrder(orderPayload) → renvoie sageOrderNumber

UpdateOrderStatus(sageOrderNumber, status)

MOCK: implémenter ces méthodes côté portail avec une DB locale (mêmes signatures), et flag .env USE_SAGE_MOCK=true|false pour switcher plus tard.

2) Ce qui est stocké (et piloté) par le Portail

Source de vérité : Portail (PostgreSQL). C’est toute la vie web + logique métier que Sage n’a pas.

A. Identités & Accès web

Utilisateurs web (Admin, Client web, Représentant, Comptabilité, Comptoir)

email, password hash, role, statut actif/inactif

Lien vers Sage (clientCode) si “Client web”

Attribution client(s) ↔ représentant(s) (portefeuille)

Sessions / Tokens (JWT), refresh tokens (optionnel)

B. Paramétrage & logiques métier

Remises personnalisées par client / article (ou par famille)

Plafonds de stock par client / article (quotas cumulés)

Substituts (associations manuelles de 0..5 refs / article)

Offres / promotions (dates, plafonds, segments)

Transporteurs affichés au checkout

Rôles/permissions spécifiques au portail

C. Cycle de commande “web”

Commandes Portail (avec statut web : SUBMITTED → VALIDATED → PREPARATION → READY → SHIPPED → DELIVERED/REFUSED)

Les lignes avec prix final calculé par le portail : prix_base_Sage * remises_portail

Lien éventuel vers sageOrderNumber après validation compta

Consolidation 19h (groupement multi-commandes client/jour)

Transferts inter-entrepôts (workflow web)

Demandes, validations, historique (si gérés côté portail)

Devis web (pour représentant) + liens de conversion → commande

Paniers sauvegardés / favoris / paniers types (si utilisés)

D. Données “expériences” & traçabilité

Logs d’actions (qui a validé, qui a préparé, qui a expédié)

Notifications (WhatsApp/SMS/Email) envoyées (journal + coût)

Activité web (dernière connexion, paniers abandonnés)

KPI & Analytics (top produits, clients dormants, recherches sans résultat)

E. Documents “web”

Liens vers documents Sage (PDF) ou copies locales si vous les mettez en cache (optionnel)

Feuilles de préparation (PDF générés par le portail)

3) Qui calcule quoi ? (responsabilités claires)
Sujet	Source	Détails
Prix de base HT	Sage	Tarif de référence par article (AR_Ref)
Remise personnalisée	Portail	Par client/article (ou famille) – gérée et stockée dans le portail
Prix final web	Portail	Calcul : prix_base * (1 - remises cumulées)
Stock par entrepôt	Sage	Lecture temps réel; mise en cache côté portail possible (TTL court)
Plafond crédit & encours	Sage	Lecture avant checkout; le portail bloque la commande “En Compte” si dépassement
Quotas client/article	Portail	Appliqués côté portail (cumulés par période)
Statut de commande comptable	Portail + Sage	“VALIDATED” sur portail ⇒ CreateSalesOrder côté Sage ⇒ retour sageOrderNumber
Statut logistique (prépa/ prête / expédiée)	Portail	Avec traçabilité (comptoir)
Documents (Factures/BL)	Sage	Liste & PDF depuis Sage; le portail affiche/télécharge
4) Identifiants & liens (pour éviter les collisions)

Client : le portail stocke clientId interne + clientCode Sage (clé naturelle).

Produit : productId interne + productRef (AR_Ref) Sage.

Commande Portail : orderId interne; après validation compta, stocker sageOrderNumber.

Entrepôt : le portail stocke le code dépôt Sage tel quel (clé stable).

Documents : documentId interne + sageDocumentNumber le cas échéant.

5) Stratégie de synchro (simple et robuste)
Lecture (Sage → Portail)

Catalogue complet : au démarrage + CRON (ex. toutes les 2–4 h) + on-demand si besoin

Prix de base : inclus avec le catalogue (pas recalculé côté portail)

Stock : lecture à la demande (détail produit) + CRON (TTL 2–5 min selon charge)

Clients : à la connexion d’un client / depuis l’admin (GetClientDetails)

Financier (plafond/encours) : au checkout (et rafraîchi si panier > X min)

Documents : à l’ouverture de la page “Mes Documents” (pagination)

Écriture (Portail → Sage)

CreateSalesOrder uniquement quand la comptabilité VALIDE la commande (statut “VALIDATED” côté portail)

UpdateOrderStatus si vous souhaitez refléter une expédition web dans Sage (optionnel selon votre process)

En dev / mock : tout ça passe par MockSageApiService qui simule les réponses et écrit dans la DB du portail.

6) Tables Portail (suggestion minimale)

users (id, email, password_hash, role, is_active, …)

clients (id, client_code_sage, company_name, vat, address, credit_limit?, outstanding?, blocked?)

products (id, product_ref_sage, name, base_price_ht, brand_id, category_id, image_url, …)

product_substitutes (product_id, substitute_id, rank)

price_overrides (client_id, product_id, discount_pct)

quotas (client_id, product_id, period, qty_limit)

orders (id, client_id, placed_by_user_id, status_web, transporter, total_ht, total_ttc, sage_order_number?)

order_items (order_id, product_id, qty, unit_price_ht, discount_pct, line_total_ht)

grouped_orders (id, client_id, date, status, …) + grouped_order_items (optionnel si vous consolidez physiquement)

transfer_requests (id, from_warehouse, to_warehouse, product_id, qty, status, order_id?)

documents (id, client_id, type, number, date, amount_ttc, payment_status, pdf_url/pdf_path)

notifications (id, user_id/client_id, channel, template, payload, cost, status, sent_at)

audit_logs (id, actor_user_id, action, entity, entity_id, metadata, created_at)

Les champs *_sage gardent les clés de correspondance. Les colonnes “?” sont optionnelles si vous ne voulez pas persister localement ce que Sage sait déjà — mais pratiques pour cache / audit.

7) Contrats d’API (résumé)
Portail → lecture Sage (mock aujourd’hui)

GET /sync/catalog/full

GET /sync/products/:ref + /stock

GET /sync/clients/:clientCode

GET /sync/financial-status/:clientCode

GET /sync/invoices?clientCode=... / GET /sync/delivery-notes?clientCode=...

GET /sync/document/:id/pdf

Portail → écriture Sage

POST /sync/sales-orders → {clientCode, lines:[{ref, qty, unitPriceHT}], transporter, paymentMode:"EN_COMPTE", approvedBy:"userName"}
⇒ { sageOrderNumber }

POST /sync/orders/:sageOrderNumber/status → {status}

Côté portail (interne) : l’UI ne touche pas /sync/* directement; elle consomme des endpoints “métier” (/catalog, /orders, /documents). Les contrôleurs appellent la couche SageApiService interne.

8) Mock propre (pour avancer maintenant)

Implémente toutes les méthodes SageApiService en Mock :

Lire/écrire dans la DB Portail

Générer des sageOrderNumber fictifs ("BC-" + year + rand), des PDF placeholder

GetFinancialStatus calculé depuis clients.credit_limit & clients.outstanding que vous seederez

Flag .env : USE_SAGE_MOCK=true (dev), false (prod avec web services)

9) En cas de divergence (conflits)

Clé absolue : Sage gagne pour tout ce qui est comptable/financier (encours, impayés, documents).

Le portail gagne pour tout ce qui est web & métier (substituts, quotas, remises custom, workflow de préparation, consolidation 19h, notifications).

Lors d’un changement de statut impactant Sage (validation compta), écrire dans Sage puis répercuter localement le sageOrderNumber.

TL;DR

Sage fournit : clients, prix de base, stocks, documents, états financiers, BC officiels.

Le Portail gère : users web, remises/quotas, commandes web (workflow), consolidation 19h, transferts, substituts, marketing, notifications, audit.

Aujourd’hui on mock les services Sage avec la DB du portail (même API).

Demain, on bascule USE_SAGE_MOCK=false → mêmes contrats, Sage réel.

Si tu veux, je te génère maintenant la liste JSON des schémas (tables + endpoints) prête pour tes migrations et pour briefer le prestataire Sage.