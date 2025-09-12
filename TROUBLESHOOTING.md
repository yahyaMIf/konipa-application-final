# 🔧 Guide de Dépannage - Konipa Application

## 🚨 Problèmes Courants et Solutions

### 1. WebSocket essaie de se connecter sur le port 3002 au lieu de 3003

**Symptômes :**
- Erreur : `WebSocket connection to 'ws://localhost:3002/socket.io/' failed`
- Le frontend ne peut pas se connecter au WebSocket

**Solutions :**

#### Solution 1 : Redémarrage complet (Recommandé)
```bash
# Arrêter tous les processus
pkill -f "node"

# Redémarrer avec le script de nettoyage
node clear-cache-and-restart.js
```

#### Solution 2 : Nettoyage manuel du cache
```bash
# 1. Arrêter les services
pkill -f "node"

# 2. Nettoyer le cache Vite
cd konipa-app-new
rm -rf node_modules/.vite
rm -rf dist

# 3. Nettoyer le cache npm
npm cache clean --force

# 4. Redémarrer
cd backend && node start-backend.js &
cd .. && node start-frontend.cjs &
```

#### Solution 3 : Vider le cache du navigateur
1. **Chrome/Edge :** `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
2. **Firefox :** `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
3. **Safari :** `Cmd+Option+R`

### 2. Erreurs CORS

**Symptômes :**
- `Access to XMLHttpRequest has been blocked by CORS policy`
- Les requêtes API échouent

**Solution :**
Le problème est déjà résolu dans la configuration CORS du backend. Si vous voyez encore cette erreur :

```bash
# Redémarrer le backend
cd konipa-app-new/backend
node start-backend.js
```

### 3. Erreurs 404 pour les routes API

**Symptômes :**
- `GET /orders 404`
- `GET /products 404`
- `GET /notifications 404`

**Solution :**
Ces erreurs viennent de requêtes qui n'utilisent pas le préfixe `/api`. Le problème est résolu dans `apiService.js`.

### 4. Authentification Socket.IO échoue

**Symptômes :**
- `Missing auth data: { userId: undefined, role: undefined }`
- Les WebSockets ne se connectent pas

**Solution :**
Le problème est résolu dans `socketService.js` qui décode maintenant le token JWT.

### 5. Page de connexion ne s'affiche pas correctement

**Symptômes :**
- Thème incorrect
- Pas de mode sombre/clair
- Pas de fonctionnalité "mot de passe oublié"

**Solution :**
Utilisez `LoginPage.jsx` au lieu de `Login.jsx` :

```jsx
// Dans App.jsx
import LoginPage from './pages/LoginPage';

// Route
<Route path="/login" element={<LoginPage />} />
```

## 🔍 Vérification du Statut

### Script de test automatique
```bash
node check-status.js
```

### Test manuel des APIs
```bash
# Test backend
curl http://localhost:3003/api/test

# Test authentification
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@konipa.com","password":"admin123"}'
```

## 📋 Checklist de Dépannage

- [ ] Backend démarré sur le port 3003
- [ ] Frontend démarré sur le port 5173
- [ ] Base de données connectée
- [ ] Cache du navigateur vidé
- [ ] Cache Vite nettoyé
- [ ] Toutes les URLs utilisent le préfixe `/api`
- [ ] Configuration CORS correcte
- [ ] Authentification Socket.IO fonctionne

## 🚀 Redémarrage Rapide

```bash
# Script de redémarrage complet
node clear-cache-and-restart.js
```

## 📞 Support

Si les problèmes persistent :

1. Vérifiez les logs du backend dans le terminal
2. Ouvrez les outils de développement du navigateur (F12)
3. Vérifiez l'onglet Console pour les erreurs JavaScript
4. Vérifiez l'onglet Network pour les requêtes échouées

## 🔧 Configuration des Ports

- **Backend API :** 3003
- **Frontend :** 5173
- **WebSocket :** 3003 (même port que le backend)
- **Base de données :** 5432 (PostgreSQL)

## 📝 Fichiers de Configuration Importants

- `konipa-app-new/backend/app.js` - Configuration CORS
- `konipa-app-new/backend/services/socketService.js` - WebSocket
- `konipa-app-new/src/services/apiService.js` - URLs API
- `konipa-app-new/src/services/realTimeSyncService.js` - WebSocket frontend
- `konipa-app-new/vite.config.js` - Proxy Vite
