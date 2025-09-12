# 🏢 Konipa Application

> Application de gestion d'entreprise moderne avec interface React et backend Node.js

## 📋 Vue d'ensemble

Konipa est une application web complète de gestion d'entreprise qui offre :

- 🔐 **Authentification sécurisée** avec JWT
- 📊 **Tableau de bord interactif** 
- 👥 **Gestion des utilisateurs** et des rôles
- 🔔 **Notifications temps réel** via WebSocket
- 🔗 **Intégration Sage** (optionnel)
- 📱 **Interface responsive** moderne

## 🚀 Démarrage Rapide

### Prérequis
- Node.js v18+ (recommandé v20+)
- npm v9+
- Base de données SQLite (dev) / PostgreSQL (prod)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd konipa-app-new

# Installer les dépendances
npm install
cd backend && npm install && cd ..

# Configuration des variables d'environnement
cp .env.example .env.local
cp backend/.env.example backend/.env

# Démarrer l'application
npm run dev
```

### Variables d'Environnement

#### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_ENVIRONMENT=development
```

#### Backend (.env)
```bash
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

## 🏗️ Architecture

### Structure du Projet
```
konipa-app-new/
├── src/                    # Code source frontend (React + Vite)
│   ├── components/         # Composants réutilisables
│   ├── pages/             # Pages de l'application
│   ├── services/          # Services API
│   └── utils/             # Utilitaires
├── backend/               # Code source backend (Node.js + Express)
│   ├── routes/            # Routes API
│   ├── middleware/        # Middlewares
│   ├── models/            # Modèles de données
│   └── services/          # Services métier
├── health-tests.sh        # Tests de santé automatisés
├── test-websocket.cjs     # Tests WebSocket
└── DEPLOYMENT_GUIDE.md    # Guide de déploiement détaillé
```

### Technologies Utilisées

#### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool moderne
- **React Router** - Navigation
- **Axios** - Client HTTP
- **WebSocket** - Communication temps réel

#### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **WebSocket** - Communication temps réel
- **JWT** - Authentification
- **SQLite/PostgreSQL** - Base de données

## 🔗 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Système
- `GET /api/health` - État du serveur
- `GET /api/dev/ping-notif` - Test notifications

### WebSocket
- `ws://localhost:3000/notifications?token=JWT_TOKEN`

## 🧪 Tests

### Tests Automatisés
```bash
# Tests de santé complets
./health-tests.sh

# Test WebSocket
node test-websocket.cjs
```

### Tests Manuels
```bash
# Test de santé
curl http://localhost:3000/api/health

# Test d'authentification
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@konipa.com","password":"admin123"}'
```

## 🚀 Déploiement

Consultez le [Guide de Déploiement](./DEPLOYMENT_GUIDE.md) pour les instructions détaillées.

### Développement
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
npm run dev
```

### Production
```bash
# Build frontend
npm run build

# Démarrer backend en production
cd backend && NODE_ENV=production npm start
```

## 🔧 Configuration

### Base de Données
- **Développement :** SQLite (automatique)
- **Production :** PostgreSQL (configuration requise)

### Authentification
- JWT avec refresh tokens
- Sessions sécurisées
- Rôles utilisateur (admin, user)

### WebSocket
- Authentification JWT obligatoire
- Notifications temps réel
- Reconnexion automatique

## 📚 Documentation

- [Guide de Déploiement](./DEPLOYMENT_GUIDE.md) - Instructions complètes
- [Tests de Santé](./health-tests.sh) - Scripts de validation
- [Test WebSocket](./test-websocket.cjs) - Validation WebSocket

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
1. Consulter le [Guide de Déploiement](./DEPLOYMENT_GUIDE.md)
2. Exécuter les tests de santé : `./health-tests.sh`
3. Vérifier les logs du serveur
4. Ouvrir une issue sur le repository

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2025