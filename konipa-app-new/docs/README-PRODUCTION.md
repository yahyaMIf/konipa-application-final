# Application Konipa - Version Production

## Déploiement

### Prérequis
- Node.js 18+
- npm ou yarn
- SQLite3

### Installation
```bash
# Installer les dépendances
npm install

# Installer les dépendances backend
cd backend && npm install && cd ..

# Construire l'application
npm run build
```

### Démarrage
```bash
# Démarrer le backend
cd backend && npm start &

# Démarrer le frontend
npm run preview
```

### Nouveaux Composants

#### Documents
- **Route**: `/documents`
- **Permissions**: admin, compta, accounting, accountant, commercial, ceo
- **Fonctionnalités**: CRUD complet des documents

#### Substitutes
- **Route**: `/substitutes` ou `/substitutes/:productId`
- **Permissions**: admin, commercial, ceo
- **Fonctionnalités**: Gestion des produits de substitution

### API Endpoints

#### Documents
- `GET /api/documents` - Liste des documents
- `POST /api/documents` - Créer un document
- `PUT /api/documents/:id` - Modifier un document
- `DELETE /api/documents/:id` - Supprimer un document

#### Substitutes
- `GET /api/substitutes` - Liste des substituts
- `GET /api/substitutes/product/:productId` - Substituts d'un produit
- `POST /api/substitutes` - Créer un substitut
- `PUT /api/substitutes/:id` - Modifier un substitut
- `DELETE /api/substitutes/:id` - Supprimer un substitut

### Base de Données

Nouvelles tables ajoutées:
- `Documents` - Gestion des documents
- `Substitutes` - Gestion des produits de substitution

### Tests

Pour exécuter les tests manuels:
```bash
node scripts/check-application-integrity.js
```

Consulter le guide de tests manuels: `scripts/manual-testing-guide.md`

### Maintenance

Pour nettoyer et optimiser l'application:
```bash
node scripts/cleanup-and-optimize.js
```

### Support

Pour toute question ou problème, consulter la documentation technique ou contacter l'équipe de développement.
