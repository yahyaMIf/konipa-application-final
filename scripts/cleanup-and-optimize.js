#!/usr/bin/env node

/**
 * Script de nettoyage et d'optimisation finale
 * Nettoie les fichiers temporaires, optimise les imports et prépare l'application pour la production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const KONIPA_APP = path.join(PROJECT_ROOT, 'konipa-app-new');

class ApplicationCleaner {
  constructor() {
    this.cleaned = [];
    this.optimized = [];
    this.errors = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    switch (type) {
      case 'cleaned':
        this.cleaned.push(logMessage);
        console.log(`🧹 ${message}`);
        break;
      case 'optimized':
        this.optimized.push(logMessage);
        console.log(`⚡ ${message}`);
        break;
      case 'error':
        this.errors.push(logMessage);
        console.error(`❌ ${message}`);
        break;
      default:
        console.log(`ℹ️  ${message}`);
    }
  }

  cleanNodeModules() {
    console.log('\n🧹 Nettoyage des node_modules...');
    
    const nodeModulesPaths = [
      path.join(KONIPA_APP, 'node_modules'),
      path.join(KONIPA_APP, 'backend', 'node_modules')
    ];
    
    nodeModulesPaths.forEach(nmPath => {
      if (fs.existsSync(nmPath)) {
        try {
          execSync(`rm -rf "${nmPath}"`, { stdio: 'inherit' });
          this.log('cleaned', `Suppression de ${nmPath}`);
        } catch (error) {
          this.log('error', `Erreur lors de la suppression de ${nmPath}: ${error.message}`);
        }
      }
    });
  }

  cleanTempFiles() {
    console.log('\n🧹 Nettoyage des fichiers temporaires...');
    
    const tempPatterns = [
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.tmp',
      '**/*.temp',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.npm',
      '**/.eslintcache',
      '**/coverage',
      '**/.nyc_output'
    ];
    
    tempPatterns.forEach(pattern => {
      try {
        const command = `find "${KONIPA_APP}" -name "${pattern.replace('**/', '')}" -type f -delete 2>/dev/null || true`;
        execSync(command);
        this.log('cleaned', `Nettoyage des fichiers ${pattern}`);
      } catch (error) {
        // Ignorer les erreurs de find (fichiers non trouvés)
      }
    });
  }

  cleanBuildArtifacts() {
    console.log('\n🧹 Nettoyage des artefacts de build...');
    
    const buildPaths = [
      path.join(KONIPA_APP, 'dist'),
      path.join(KONIPA_APP, 'build'),
      path.join(KONIPA_APP, '.vite'),
      path.join(KONIPA_APP, 'backend', 'dist'),
      path.join(KONIPA_APP, 'backend', 'build')
    ];
    
    buildPaths.forEach(buildPath => {
      if (fs.existsSync(buildPath)) {
        try {
          execSync(`rm -rf "${buildPath}"`, { stdio: 'inherit' });
          this.log('cleaned', `Suppression de ${buildPath}`);
        } catch (error) {
          this.log('error', `Erreur lors de la suppression de ${buildPath}: ${error.message}`);
        }
      }
    });
  }

  optimizeImports() {
    console.log('\n⚡ Optimisation des imports...');
    
    const srcPath = path.join(KONIPA_APP, 'src');
    
    // Vérifier les imports inutilisés dans les nouveaux composants
    const newComponentPaths = [
      path.join(srcPath, 'components', 'Documents'),
      path.join(srcPath, 'components', 'Substitutes')
    ];
    
    newComponentPaths.forEach(componentPath => {
      if (fs.existsSync(componentPath)) {
        this.optimizeComponentImports(componentPath);
      }
    });
  }

  optimizeComponentImports(componentPath) {
    const files = fs.readdirSync(componentPath);
    
    files.forEach(file => {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        const filePath = path.join(componentPath, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Détecter les imports React inutilisés
          if (content.includes('import React') && !content.includes('React.')) {
            const optimizedContent = content.replace(
              /import React,?\s*{([^}]+)}/,
              'import {$1}'
            ).replace(
              /import React from ['"]react['"];?\n/,
              ''
            );
            
            if (optimizedContent !== content) {
              fs.writeFileSync(filePath, optimizedContent);
              this.log('optimized', `Optimisation des imports dans ${file}`);
            }
          }
          
        } catch (error) {
          this.log('error', `Erreur lors de l'optimisation de ${file}: ${error.message}`);
        }
      }
    });
  }

  validatePackageJson() {
    console.log('\n🔍 Validation du package.json...');
    
    const packageJsonPath = path.join(KONIPA_APP, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Vérifier les scripts essentiels
        const requiredScripts = ['dev', 'build', 'preview'];
        const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
        
        if (missingScripts.length > 0) {
          this.log('error', `Scripts manquants dans package.json: ${missingScripts.join(', ')}`);
        } else {
          this.log('optimized', 'Tous les scripts essentiels sont présents');
        }
        
        // Vérifier les dépendances critiques
        const criticalDeps = ['react', 'react-dom', 'react-router-dom'];
        const missingDeps = criticalDeps.filter(dep => 
          !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
        );
        
        if (missingDeps.length > 0) {
          this.log('error', `Dépendances critiques manquantes: ${missingDeps.join(', ')}`);
        } else {
          this.log('optimized', 'Toutes les dépendances critiques sont présentes');
        }
        
      } catch (error) {
        this.log('error', `Erreur lors de la validation du package.json: ${error.message}`);
      }
    }
  }

  optimizeDatabase() {
    console.log('\n⚡ Optimisation de la base de données...');
    
    const dbPath = path.join(KONIPA_APP, 'backend', 'database.sqlite');
    
    if (fs.existsSync(dbPath)) {
      try {
        // Créer une sauvegarde
        const backupPath = path.join(KONIPA_APP, 'backend', 'database.backup.sqlite');
        fs.copyFileSync(dbPath, backupPath);
        this.log('optimized', 'Sauvegarde de la base de données créée');
        
        // Optimiser la base de données SQLite
        const sqlite3 = require('sqlite3');
        const db = new sqlite3.Database(dbPath);
        
        db.run('VACUUM;', (err) => {
          if (err) {
            this.log('error', `Erreur lors de l'optimisation de la base de données: ${err.message}`);
          } else {
            this.log('optimized', 'Base de données optimisée avec VACUUM');
          }
          db.close();
        });
        
      } catch (error) {
        this.log('error', `Erreur lors de l'optimisation de la base de données: ${error.message}`);
      }
    }
  }

  createProductionReadme() {
    console.log('\n📝 Création du README de production...');
    
    const readmeContent = `# Application Konipa - Version Production

## Déploiement

### Prérequis
- Node.js 18+
- npm ou yarn
- SQLite3

### Installation
\`\`\`bash
# Installer les dépendances
npm install

# Installer les dépendances backend
cd backend && npm install && cd ..

# Construire l'application
npm run build
\`\`\`

### Démarrage
\`\`\`bash
# Démarrer le backend
cd backend && npm start &

# Démarrer le frontend
npm run preview
\`\`\`

### Nouveaux Composants

#### Documents
- **Route**: \`/documents\`
- **Permissions**: admin, compta, accounting, accountant, commercial, ceo
- **Fonctionnalités**: CRUD complet des documents

#### Substitutes
- **Route**: \`/substitutes\` ou \`/substitutes/:productId\`
- **Permissions**: admin, commercial, ceo
- **Fonctionnalités**: Gestion des produits de substitution

### API Endpoints

#### Documents
- \`GET /api/documents\` - Liste des documents
- \`POST /api/documents\` - Créer un document
- \`PUT /api/documents/:id\` - Modifier un document
- \`DELETE /api/documents/:id\` - Supprimer un document

#### Substitutes
- \`GET /api/substitutes\` - Liste des substituts
- \`GET /api/substitutes/product/:productId\` - Substituts d'un produit
- \`POST /api/substitutes\` - Créer un substitut
- \`PUT /api/substitutes/:id\` - Modifier un substitut
- \`DELETE /api/substitutes/:id\` - Supprimer un substitut

### Base de Données

Nouvelles tables ajoutées:
- \`Documents\` - Gestion des documents
- \`Substitutes\` - Gestion des produits de substitution

### Tests

Pour exécuter les tests manuels:
\`\`\`bash
node scripts/check-application-integrity.js
\`\`\`

Consulter le guide de tests manuels: \`scripts/manual-testing-guide.md\`

### Maintenance

Pour nettoyer et optimiser l'application:
\`\`\`bash
node scripts/cleanup-and-optimize.js
\`\`\`

### Support

Pour toute question ou problème, consulter la documentation technique ou contacter l'équipe de développement.
`;
    
    const readmePath = path.join(KONIPA_APP, 'README-PRODUCTION.md');
    fs.writeFileSync(readmePath, readmeContent);
    this.log('optimized', 'README de production créé');
  }

  reinstallDependencies() {
    console.log('\n📦 Réinstallation des dépendances...');
    
    try {
      // Réinstaller les dépendances principales
      console.log('Installation des dépendances principales...');
      execSync('npm install', { cwd: KONIPA_APP, stdio: 'inherit' });
      this.log('optimized', 'Dépendances principales installées');
      
      // Réinstaller les dépendances backend
      const backendPath = path.join(KONIPA_APP, 'backend');
      if (fs.existsSync(path.join(backendPath, 'package.json'))) {
        console.log('Installation des dépendances backend...');
        execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
        this.log('optimized', 'Dépendances backend installées');
      }
      
    } catch (error) {
      this.log('error', `Erreur lors de l'installation des dépendances: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 RAPPORT DE NETTOYAGE ET OPTIMISATION');
    console.log('=' .repeat(60));
    console.log(`🧹 Éléments nettoyés: ${this.cleaned.length}`);
    console.log(`⚡ Optimisations effectuées: ${this.optimized.length}`);
    console.log(`❌ Erreurs rencontrées: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERREURS:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }
    
    // Sauvegarder le rapport
    const reportPath = path.join(PROJECT_ROOT, 'cleanup-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        cleaned: this.cleaned.length,
        optimized: this.optimized.length,
        errors: this.errors.length
      },
      details: {
        cleaned: this.cleaned,
        optimized: this.optimized,
        errors: this.errors
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
    
    return this.errors.length === 0;
  }

  async run() {
    console.log('🚀 Démarrage du nettoyage et de l\'optimisation\n');
    
    this.cleanTempFiles();
    this.cleanBuildArtifacts();
    this.optimizeImports();
    this.validatePackageJson();
    this.optimizeDatabase();
    this.createProductionReadme();
    
    // Nettoyage des node_modules en dernier
    this.cleanNodeModules();
    
    // Réinstallation des dépendances
    this.reinstallDependencies();
    
    const success = this.generateReport();
    
    if (success) {
      console.log('\n🎉 Nettoyage et optimisation terminés avec succès!');
      console.log('\n📋 Prochaines étapes:');
      console.log('  1. Exécuter les tests: node scripts/check-application-integrity.js');
      console.log('  2. Effectuer les tests manuels: scripts/manual-testing-guide.md');
      console.log('  3. Construire pour la production: npm run build');
      console.log('  4. Déployer l\'application');
      process.exit(0);
    } else {
      console.log('\n💥 Nettoyage terminé avec des erreurs. Veuillez vérifier le rapport.');
      process.exit(1);
    }
  }
}

// Exécution du script
if (require.main === module) {
  const cleaner = new ApplicationCleaner();
  cleaner.run().catch(error => {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  });
}

module.exports = ApplicationCleaner;