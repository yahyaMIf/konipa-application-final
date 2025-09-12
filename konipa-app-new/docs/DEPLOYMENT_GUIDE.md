# 🚀 Guide de Déploiement - Konipa Application

## 📋 Prérequis

### Environnement de Développement
- **Node.js:** v18+ (recommandé v20+)
- **npm:** v9+
- **Base de données:** SQLite (développement) / PostgreSQL (production)
- **Sage:** Connexion API configurée

### Variables d'Environnement

#### Frontend (.env.local)
```bash
# URLs de l'API et WebSocket
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# Configuration de l'environnement
VITE_ENVIRONMENT=development
VITE_VERSION=1.0.0
```

#### Backend (.env)
```bash
# Configuration du serveur
NODE_ENV=development
PORT=3000

# Configuration JWT
JWT_SECRET=your_jwt_secret_key_here

# Configuration CORS
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Configuration de la base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=konipa_db
DB_USER=konipa_user
DB_PASSWORD=your_password

# Configuration Sage (optionnel)
SAGE_API_URL=https://your-sage-instance.com/api
SAGE_API_KEY=your_sage_api_key
SAGE_USERNAME=your_sage_username
SAGE_PASSWORD=your_sage_password
```

## 🏗️ Installation et Configuration

### 1. Installation des Dépendances

```bash
# Installation des dépendances du projet principal
npm install

# Installation des dépendances backend
cd backend
npm install
cd ..
```

### 2. Configuration de la Base de Données

```bash
# Développement (SQLite)
cd backend
npm run db:migrate
npm run db:seed

# Production (PostgreSQL)
# 1. Créer la base de données PostgreSQL
# 2. Configurer les variables d'environnement
# 3. Exécuter les migrations
npm run db:migrate:prod
npm run db:seed:prod
```

### 3. Configuration Sage

1. **Obtenir les Credentials Sage:**
   - URL de l'API Sage
   - Clé API
   - Nom d'utilisateur et mot de passe

2. **Tester la Connexion:**
   ```bash
   # Démarrer le backend
   cd backend
   npm start
   
   # Tester la connexion Sage
   curl http://localhost:3000/api/sage/test
   ```

## 🔗 Endpoints API

### Endpoints Principaux

#### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh` - Renouvellement du token
- `GET /api/auth/me` - Informations utilisateur actuel

#### Santé du Système
- `GET /api/health` - Vérification de l'état du serveur
- `GET /api/dev/ping-notif` - Test des notifications WebSocket

#### Gestion des Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Création d'utilisateur
- `PUT /api/users/:id` - Modification d'utilisateur
- `DELETE /api/users/:id` - Suppression d'utilisateur

#### WebSocket
- `ws://localhost:3000/notifications?token=JWT_TOKEN` - Connexion WebSocket pour notifications temps réel

### Exemples d'Utilisation

```bash
# Test de santé
curl http://localhost:3000/api/health

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@konipa.com","password":"admin123"}'

# Test des notifications
curl "http://localhost:3000/api/dev/ping-notif?message=Test&userId=123"
```

## 🧪 Tests et Validation

### Scripts de Test Automatisés

#### 1. Tests de Santé Complets
```bash
# Exécuter tous les tests de santé
./health-tests.sh
```

Ce script teste :
- ✅ Health Check du serveur
- ✅ Authentification
- ✅ Endpoint de notifications
- ✅ Disponibilité de wscat pour tests WebSocket
- ✅ Configuration des variables d'environnement

#### 2. Test WebSocket Automatisé
```bash
# Test complet de la connexion WebSocket
node test-websocket.cjs
```

Ce script teste :
- ✅ Authentification JWT
- ✅ Connexion WebSocket avec token
- ✅ Envoi/réception de messages
- ✅ Fermeture propre de la connexion

### Tests Manuels

#### Test WebSocket avec wscat
```bash
# Installer wscat si nécessaire
npm install -g wscat

# Se connecter avec un token JWT
wscat -c 'ws://localhost:3000/notifications?token=YOUR_JWT_TOKEN'
```

#### Test des Notifications
```bash
# Notification à tous les utilisateurs
curl "http://localhost:3000/api/dev/ping-notif?message=Hello%20World"

# Notification à un utilisateur spécifique
curl "http://localhost:3000/api/dev/ping-notif?message=Hello&userId=123"

# Notification à un rôle
curl "http://localhost:3000/api/dev/ping-notif?message=Hello&role=admin"
```

### Validation de l'Installation

1. **Vérifier que les serveurs démarrent :**
   ```bash
   # Backend
   cd backend && npm start
   # Frontend
   npm run dev
   ```

2. **Tester les endpoints critiques :**
   ```bash
   ./health-tests.sh
   ```

3. **Vérifier la connectivité WebSocket :**
   ```bash
   node test-websocket.cjs
   ```

4. **Accéder à l'application :**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/api/health

## 🚀 Déploiement

### Développement

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm start
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

### Production

#### Option 1: Déploiement Manuel

```bash
# 1. Build du frontend
npm run build

# 2. Build du backend
cd backend
npm run build

# 3. Démarrage en production
NODE_ENV=production npm start
```

#### Option 2: Docker

```bash
# Build et démarrage avec Docker Compose
docker-compose up -d
```

#### Option 3: Déploiement Cloud

**Heroku:**
```bash
# Configuration Heroku
heroku create konipa-app
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_secret

# Déploiement
git push heroku main
```

**Vercel (Frontend) + Railway (Backend):**
```bash
# Frontend sur Vercel
vercel --prod

# Backend sur Railway
railway login
railway new
railway up
```

## 🔧 Configuration Avancée

### Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS

```bash
# Certbot pour Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring et Logs

### Logs Application

```bash
# Logs backend
tail -f backend/logs/app.log

# Logs avec PM2
pm2 logs konipa-backend
```

### Monitoring Base de Données

```bash
# PostgreSQL
psql -h localhost -U konipa_user -d konipa_db -c "SELECT * FROM pg_stat_activity;"

# SQLite
sqlite3 backend/database.sqlite ".tables"
```

### Health Checks

```bash
# Backend Health
curl http://localhost:3001/api/health

# Sage Connection
curl http://localhost:3001/api/sage/test

# Database Connection
curl http://localhost:3001/api/db/status
```

## 🔒 Sécurité

### Checklist Sécurité

- [ ] Variables d'environnement sécurisées
- [ ] JWT secrets forts
- [ ] HTTPS activé
- [ ] CORS configuré
- [ ] Rate limiting activé
- [ ] Validation des inputs
- [ ] Logs de sécurité
- [ ] Backup base de données

### Backup

```bash
# Backup PostgreSQL
pg_dump -h localhost -U konipa_user konipa_db > backup_$(date +%Y%m%d).sql

# Backup SQLite
cp backend/database.sqlite backup/database_$(date +%Y%m%d).sqlite
```

## 🚨 Dépannage

### Problèmes Courants

#### 1. Erreur de Connexion Base de Données
```bash
# Vérifier la connexion
psql -h localhost -U konipa_user -d konipa_db

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

#### 2. Erreur Sage API
```bash
# Tester la connexion Sage
curl -X POST http://localhost:3001/api/sage/test \
  -H "Content-Type: application/json"

# Vérifier les logs
tail -f backend/logs/sage.log
```

#### 3. Erreur CORS
```javascript
// backend/src/app.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

#### 4. Port déjà utilisé
```bash
# Trouver le processus
lsof -i :3001

# Tuer le processus
kill -9 <PID>
```

## 📈 Performance

### Optimisations

1. **Frontend:**
   - Code splitting
   - Lazy loading
   - Image optimization
   - CDN pour les assets

2. **Backend:**
   - Connection pooling
   - Cache Redis
   - Compression gzip
   - Rate limiting

3. **Base de Données:**
   - Index optimisés
   - Requêtes optimisées
   - Connection pooling
   - Backup réguliers

## 📞 Support

### Contacts
- **Développement:** dev@konipa.com
- **Support:** support@konipa.com
- **Urgences:** +33 1 23 45 67 89

### Documentation
- **API:** http://localhost:3001/api-docs
- **Frontend:** /docs/frontend.md
- **Backend:** /docs/backend.md
- **Sage Integration:** /docs/sage-integration.md

---

**Version:** 1.0.0  
**Dernière mise à jour:** $(date +%Y-%m-%d)  
**Statut:** ✅ Production Ready