# 🚀 Guide de Démarrage Rapide - Konipa Application

## 📋 Prérequis

- **Node.js** v18+ (recommandé v24+)
- **npm** v8+
- **PostgreSQL** (optionnel, simulation incluse)

## ⚡ Démarrage Ultra-Rapide

### Option 1: Démarrage Complet (Recommandé)
```bash
# Dans le dossier racine du projet
node start-all.js
```

### Option 2: Démarrage Séparé

#### Backend uniquement
```bash
cd konipa-app-new/backend
node start-backend.js
```

#### Frontend uniquement
```bash
cd konipa-app-new/frontend
node start-frontend.js
```

## 🌐 Accès à l'Application

Une fois démarrée, l'application sera disponible sur :

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3003
- **Dashboard** : http://localhost:3003/api/dashboard/stats

## 🔑 Connexion

**Compte administrateur :**
- **Email** : admin@konipa.com
- **Mot de passe** : admin123

## 📊 Fonctionnalités Disponibles

### ✅ Backend (100% Fonctionnel)
- 🔐 **Authentification JWT** - Login, tokens, refresh
- 👥 **Gestion des utilisateurs** - CRUD complet
- 📦 **Gestion des produits** - CRUD avec validation
- 🏢 **Gestion des clients** - CRUD avec codes Sage
- 📋 **Gestion des commandes** - CRUD avec articles
- 📊 **Dashboard** - Statistiques en temps réel
- 🔔 **Notifications** - Système de notifications
- 📈 **Rapports** - Analytics et statistiques
- 🔄 **Synchronisation Sage** - Intégration ERP
- 📁 **Upload de fichiers** - Gestion des documents

### ✅ Frontend (Intégré)
- ⚛️ **React 19** - Framework moderne
- 🎨 **UI/UX** - Interface utilisateur complète
- 📱 **Responsive** - Mobile et desktop
- 🔄 **Temps réel** - WebSocket intégré
- 📊 **Dashboard** - Tableaux de bord interactifs
- 📋 **Formulaires** - Validation en temps réel

## 🛠️ Commandes Utiles

### Backend
```bash
# Démarrer le serveur
npm start

# Mode développement avec rechargement
npm run dev

# Synchroniser la base de données
npm run sync

# Réinitialiser la base de données
npm run reset
```

### Frontend
```bash
# Démarrer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser la build
npm run preview
```

## 🔧 Configuration

### Variables d'environnement

**Backend** (`.env` dans `konipa-app-new/backend/`) :
```env
NODE_ENV=development
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=konipa_db
DB_USER=konipa_user
DB_PASS=konipa_password
JWT_SECRET=your-super-secret-jwt-key
```

**Frontend** (automatique) :
```env
VITE_API_URL=http://localhost:3003
```

## 📁 Structure du Projet

```
konipa_application_finale_complete 6/
├── start-all.js                 # 🚀 Démarrage complet
├── start-konipa.js             # 🚀 Démarrage alternatif
├── QUICK_START.md              # 📋 Ce guide
├── konipa-app-new/
│   ├── backend/                # 🔧 Backend Node.js
│   │   ├── start-backend.js    # 🚀 Démarrage backend
│   │   ├── server.js           # 🖥️ Serveur principal
│   │   ├── app.js              # 📱 Application Express
│   │   ├── controllers/        # 🎮 Contrôleurs API
│   │   ├── models/             # 🗄️ Modèles de données
│   │   ├── routes/             # 🛣️ Routes API
│   │   ├── services/           # ⚙️ Services métier
│   │   └── TEST_REPORT.md      # 📊 Rapport de tests
│   └── frontend/               # ⚛️ Frontend React
│       ├── start-frontend.js   # 🚀 Démarrage frontend
│       ├── src/                # 📁 Code source
│       ├── public/             # 🌐 Assets publics
│       └── vite.config.js      # ⚙️ Configuration Vite
```

## 🐛 Résolution de Problèmes

### Problème : Port déjà utilisé
```bash
# Trouver le processus utilisant le port
lsof -i :3003
lsof -i :5173

# Arrêter le processus
kill -9 <PID>
```

### Problème : Dépendances manquantes
```bash
# Réinstaller les dépendances
cd konipa-app-new/backend && npm install
cd konipa-app-new/frontend && npm install
```

### Problème : Base de données
```bash
# Réinitialiser la base de données
cd konipa-app-new/backend
npm run reset
```

## 📞 Support

- **Documentation complète** : Voir `TEST_REPORT.md`
- **Logs** : Vérifier la console pour les erreurs
- **API** : Tester avec `http://localhost:3003/api/test`

## 🎉 Félicitations !

Votre application Konipa est maintenant prête à être utilisée ! 

**Prochaines étapes :**
1. Connectez-vous avec le compte admin
2. Explorez le dashboard
3. Créez des utilisateurs, produits et clients
4. Testez les fonctionnalités avancées

---
**Version :** 1.0.0  
**Dernière mise à jour :** 8 Janvier 2025
