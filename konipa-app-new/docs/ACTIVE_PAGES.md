# ACTIVE_PAGES.md - Analyse du Routing Frontend

## Vue d'ensemble
Ce document liste toutes les pages actives dans l'application Konipa B2B avec leur statut, rôles requis et composants associés.

## Pages Publiques (Non authentifiées)

### Authentification
- `/login` → `LoginPage` - Page de connexion
- `/forgot-password` → `ForgotPasswordPage` - Mot de passe oublié
- `/reset-password/:token` → `ResetPasswordPage` - Réinitialisation mot de passe
- ~~`/register`~~ → `RegisterPage` - **DÉSACTIVÉ** (inscription publique interdite)

### Pages Informatives
- `/help` → `HelpPage` - Page d'aide
- `/terms` → `TermsPage` - Conditions d'utilisation
- `/privacy` → `PrivacyPage` - Politique de confidentialité
- `/about` → `AboutPage` - À propos
- `/contact` → `ContactPage` - Contact

## Pages Authentifiées

### Navigation Principale
- `/` → `HomePage` - Page d'accueil (avec ProtectedRoute)
- `/catalog` → `Catalog` - Catalogue produits (avec ProtectedRoute)
- `/product/:id` → `ProductDetail` - Détail produit (avec ProtectedRoute)
- `/cart` → `Cart` - Panier (avec ProtectedRoute)
- `/checkout` → `Checkout` - Commande (avec ProtectedRoute)

### Gestion Utilisateur
- `/profile` → `ProfilePage` - Profil utilisateur
- `/old-profile` → `Profile` - Ancien profil (legacy)
- `/favorites` → `Favorites` - Favoris
- `/orders` → `Orders` - Mes commandes

### Dashboards par Rôle

#### Client
- `/client` → `ClientDashboard` - Dashboard client

#### Commercial
- `/commercial` → `CommercialDashboard` - Dashboard commercial
- `/all-orders` → `AllOrders` - Toutes les commandes

#### POS (Point de Vente)
- `/pos` → `POSDashboard` - Dashboard POS
- `/counter` → `CounterDashboard` - Dashboard comptoir

#### Comptabilité
- `/comptabilite` → `ComptabiliteDashboard` - Dashboard comptabilité
- `/unpaid-management` → `UnpaidManagement` - Gestion impayés
- `/enhanced-unpaid` → `EnhancedUnpaidManagement` - Gestion impayés avancée

#### CEO
- `/ceo` → `CEODashboard` - Dashboard CEO

### Administration

#### Gestion Générale
- `/admin-dashboard` → `AdminDashboard` - Dashboard admin principal
- `/admin-settings` → `AdminSettings` - Paramètres admin
- `/admin-panel` → `AdminPanel` - Panel admin (legacy)
- `/user-management` → `UserManagement` - Gestion utilisateurs

#### Modules Admin Spécialisés
- `/admin/users` → `AdminUsers` - Gestion utilisateurs avancée
- `/admin/products` → `AdminProducts` - Gestion produits
- `/admin/orders` → `AdminOrders` - Gestion commandes
- `/admin/client/:id` → `AdminClient360` - Vue client 360°
- `/admin/marketing` → `AdminMarketing` - Marketing
- `/admin/analytics` → `AdminAnalytics` - Analytics

### Catalogue Spécialisé
- `/nouveautes` → `Nouveautes` - Nouveautés
- `/promotions` → `Promotions` - Promotions
- `/destockage` → `Destockage` - Déstockage
- `/categories` → `Categories` - Catégories

### Fonctionnalités Avancées
- `/integrations` → `Integrations` - Intégrations (Sage, etc.)
- `/order-management` → `OrderManagement` - Gestion commandes
- `/order-tracking` → `OrderTracking` - Suivi commandes
- `/documents` → `Documents` - Documents
- `/substitutes/:productId?` → `Substitutes` - Produits de substitution

## Redirections
- `/*` → Redirection vers `/` (page d'accueil)

## Analyse des Permissions

### Pages sans restriction spécifique
- Pages publiques (login, help, terms, etc.)
- Pages de base (catalog, product, cart, profile)

### Pages avec ProtectedRoute
- Toutes les pages authentifiées utilisent `ProtectedRoute`
- Vérification des rôles via `hasPermission()` et `hasAnyRole()`

### Dashboards par rôle
- **Client** : `/client`
- **Commercial** : `/commercial`, `/all-orders`
- **POS** : `/pos`, `/counter`
- **Comptabilité** : `/comptabilite`, `/unpaid-management`, `/enhanced-unpaid`
- **CEO** : `/ceo`
- **Admin** : `/admin-*`, `/user-management`

## Recommandations de Nettoyage

### Pages Legacy à Examiner
1. `/old-profile` vs `/profile` - Unifier
2. `/admin-panel` vs `/admin-dashboard` - Choisir une approche
3. `/unpaid-management` vs `/enhanced-unpaid` - Consolider

### Pages Potentiellement Redondantes
- Multiples dashboards admin (`AdminDashboard`, `AdminPanel`, `UnifiedAdminDashboard`)
- Gestion utilisateurs (`UserManagement` vs `AdminUsers`)

### Vérifications Nécessaires
1. Toutes les pages ont-elles des composants fonctionnels ?
2. Les permissions sont-elles correctement implémentées ?
3. Y a-t-il des pages non utilisées ?

## Statut des Composants
- ✅ **Actif** : Page fonctionnelle et routée
- ⚠️ **Legacy** : Page ancienne à examiner
- ❌ **Désactivé** : Page commentée/désactivée
- 🔍 **À vérifier** : Existence du composant à confirmer

---
*Généré le : $(date)*
*Projet : Konipa B2B Application*