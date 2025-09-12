#!/usr/bin/env node

/**
 * Script de contrôle d'intégrité de l'application Konipa
 * Vérifie que tous les composants, services et routes sont correctement configurés
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const KONIPA_APP = path.join(PROJECT_ROOT, 'konipa-app-new');

class ApplicationIntegrityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    switch (type) {
      case 'error':
        this.errors.push(logMessage);
        console.error(`❌ ${message}`);
        break;
      case 'warning':
        this.warnings.push(logMessage);
        console.warn(`⚠️  ${message}`);
        break;
      case 'success':
        this.successes.push(logMessage);
        console.log(`✅ ${message}`);
        break;
      default:
        console.log(`ℹ️  ${message}`);
    }
  }

  checkFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.log('success', `${description} existe: ${filePath}`);
      return true;
    } else {
      this.log('error', `${description} manquant: ${filePath}`);
      return false;
    }
  }

  checkDirectoryExists(dirPath, description) {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      this.log('success', `${description} existe: ${dirPath}`);
      return true;
    } else {
      this.log('error', `${description} manquant: ${dirPath}`);
      return false;
    }
  }

  checkPackageJson() {
    console.log('\n🔍 Vérification des fichiers package.json...');
    
    const packageJsonPath = path.join(KONIPA_APP, 'package.json');
    if (this.checkFileExists(packageJsonPath, 'package.json principal')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Vérifier les dépendances critiques
        const criticalDeps = [
          'react', 'react-dom', 'react-router-dom',
          'framer-motion', 'lucide-react',
          'express', 'sequelize', 'sqlite3'
        ];
        
        criticalDeps.forEach(dep => {
          if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
            this.log('success', `Dépendance ${dep} trouvée`);
          } else {
            this.log('warning', `Dépendance ${dep} manquante`);
          }
        });
      } catch (error) {
        this.log('error', `Erreur lors de la lecture du package.json: ${error.message}`);
      }
    }
  }

  checkBackendStructure() {
    console.log('\n🔍 Vérification de la structure backend...');
    
    const backendPath = path.join(KONIPA_APP, 'backend');
    this.checkDirectoryExists(backendPath, 'Répertoire backend');
    
    // Vérifier les fichiers critiques du backend
    const backendFiles = [
      'server.js',
      'package.json',
      'database.sqlite'
    ];
    
    backendFiles.forEach(file => {
      this.checkFileExists(path.join(backendPath, file), `Backend ${file}`);
    });
    
    // Vérifier les répertoires backend
    const backendDirs = [
      'controllers',
      'models',
      'routes',
      'middleware',
      'services'
    ];
    
    backendDirs.forEach(dir => {
      this.checkDirectoryExists(path.join(backendPath, dir), `Backend ${dir}`);
    });
  }

  checkFrontendStructure() {
    console.log('\n🔍 Vérification de la structure frontend...');
    
    const srcPath = path.join(KONIPA_APP, 'src');
    this.checkDirectoryExists(srcPath, 'Répertoire src');
    
    // Vérifier les fichiers critiques du frontend
    const frontendFiles = [
      'App.jsx',
      'main.jsx',
      'index.css'
    ];
    
    frontendFiles.forEach(file => {
      this.checkFileExists(path.join(srcPath, file), `Frontend ${file}`);
    });
    
    // Vérifier les répertoires frontend
    const frontendDirs = [
      'components',
      'pages',
      'services',
      'contexts',
      'hooks'
    ];
    
    frontendDirs.forEach(dir => {
      this.checkDirectoryExists(path.join(srcPath, dir), `Frontend ${dir}`);
    });
  }

  checkNewComponents() {
    console.log('\n🔍 Vérification des nouveaux composants...');
    
    const componentsPath = path.join(KONIPA_APP, 'src', 'components');
    
    // Vérifier les composants Documents
    const documentsPath = path.join(componentsPath, 'Documents');
    if (this.checkDirectoryExists(documentsPath, 'Composants Documents')) {
      const documentFiles = [
        'index.js',
        'Documents.jsx',
        'DocumentList.jsx',
        'DocumentForm.jsx',
        'DocumentDetail.jsx'
      ];
      
      documentFiles.forEach(file => {
        this.checkFileExists(path.join(documentsPath, file), `Document ${file}`);
      });
    }
    
    // Vérifier les composants Substitutes
    const substitutesPath = path.join(componentsPath, 'Substitutes');
    if (this.checkDirectoryExists(substitutesPath, 'Composants Substitutes')) {
      const substituteFiles = [
        'index.js',
        'Substitutes.jsx',
        'SubstituteList.jsx',
        'SubstituteForm.jsx'
      ];
      
      substituteFiles.forEach(file => {
        this.checkFileExists(path.join(substitutesPath, file), `Substitute ${file}`);
      });
    }
  }

  checkServices() {
    console.log('\n🔍 Vérification des services...');
    
    const servicesPath = path.join(KONIPA_APP, 'src', 'services');
    
    // Vérifier les nouveaux services
    const newServices = [
      'documentService.js',
      'substituteService.js'
    ];
    
    newServices.forEach(service => {
      this.checkFileExists(path.join(servicesPath, service), `Service ${service}`);
    });
    
    // Vérifier les services critiques existants
    const criticalServices = [
      'apiService.js',
      'authService.js',
      'ProductService.js',
      'ClientService.js'
    ];
    
    criticalServices.forEach(service => {
      this.checkFileExists(path.join(servicesPath, service), `Service critique ${service}`);
    });
  }

  checkAppJsxIntegration() {
    console.log('\n🔍 Vérification de l\'intégration dans App.jsx...');
    
    const appJsxPath = path.join(KONIPA_APP, 'src', 'App.jsx');
    if (this.checkFileExists(appJsxPath, 'App.jsx')) {
      try {
        const appContent = fs.readFileSync(appJsxPath, 'utf8');
        
        // Vérifier les imports
        if (appContent.includes('import { Documents }')) {
          this.log('success', 'Import Documents trouvé dans App.jsx');
        } else {
          this.log('error', 'Import Documents manquant dans App.jsx');
        }
        
        if (appContent.includes('import { Substitutes }')) {
          this.log('success', 'Import Substitutes trouvé dans App.jsx');
        } else {
          this.log('error', 'Import Substitutes manquant dans App.jsx');
        }
        
        // Vérifier les routes
        if (appContent.includes('path="/documents"')) {
          this.log('success', 'Route /documents trouvée dans App.jsx');
        } else {
          this.log('error', 'Route /documents manquante dans App.jsx');
        }
        
        if (appContent.includes('path="/substitutes')) {
          this.log('success', 'Route /substitutes trouvée dans App.jsx');
        } else {
          this.log('error', 'Route /substitutes manquante dans App.jsx');
        }
        
      } catch (error) {
        this.log('error', `Erreur lors de la lecture d'App.jsx: ${error.message}`);
      }
    }
  }

  checkBackendModels() {
    console.log('\n🔍 Vérification des modèles backend...');
    
    const modelsPath = path.join(KONIPA_APP, 'backend', 'models');
    
    // Vérifier les nouveaux modèles
    const newModels = [
      'Document.js',
      'Substitute.js'
    ];
    
    newModels.forEach(model => {
      this.checkFileExists(path.join(modelsPath, model), `Modèle ${model}`);
    });
  }

  checkBackendRoutes() {
    console.log('\n🔍 Vérification des routes backend...');
    
    const routesPath = path.join(KONIPA_APP, 'backend', 'routes');
    
    // Vérifier les nouvelles routes
    const newRoutes = [
      'documents.js',
      'substitutes.js'
    ];
    
    newRoutes.forEach(route => {
      this.checkFileExists(path.join(routesPath, route), `Route ${route}`);
    });
  }

  async checkServerStatus() {
    console.log('\n🔍 Vérification du statut des serveurs...');
    
    try {
      // Vérifier le serveur backend
      const backendResponse = await fetch('http://localhost:3001/api/health');
      if (backendResponse.ok) {
        this.log('success', 'Serveur backend accessible');
      } else {
        this.log('warning', 'Serveur backend répond mais avec erreur');
      }
    } catch (error) {
      this.log('warning', 'Serveur backend non accessible (peut être normal si non démarré)');
    }
    
    try {
      // Vérifier le serveur frontend
      const frontendResponse = await fetch('http://localhost:5173/');
      if (frontendResponse.ok) {
        this.log('success', 'Serveur frontend accessible');
      } else {
        this.log('warning', 'Serveur frontend répond mais avec erreur');
      }
    } catch (error) {
      this.log('warning', 'Serveur frontend non accessible (peut être normal si non démarré)');
    }
  }

  generateReport() {
    console.log('\n📊 RAPPORT D\'INTÉGRITÉ');
    console.log('=' .repeat(50));
    console.log(`✅ Succès: ${this.successes.length}`);
    console.log(`⚠️  Avertissements: ${this.warnings.length}`);
    console.log(`❌ Erreurs: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERREURS CRITIQUES:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  AVERTISSEMENTS:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    // Sauvegarder le rapport
    const reportPath = path.join(PROJECT_ROOT, 'integrity-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        successes: this.successes.length,
        warnings: this.warnings.length,
        errors: this.errors.length
      },
      details: {
        successes: this.successes,
        warnings: this.warnings,
        errors: this.errors
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
    
    return this.errors.length === 0;
  }

  async run() {
    console.log('🚀 Démarrage du contrôle d\'intégrité de l\'application Konipa\n');
    
    this.checkPackageJson();
    this.checkBackendStructure();
    this.checkFrontendStructure();
    this.checkNewComponents();
    this.checkServices();
    this.checkAppJsxIntegration();
    this.checkBackendModels();
    this.checkBackendRoutes();
    await this.checkServerStatus();
    
    const success = this.generateReport();
    
    if (success) {
      console.log('\n🎉 Contrôle d\'intégrité réussi! L\'application est prête.');
      process.exit(0);
    } else {
      console.log('\n💥 Contrôle d\'intégrité échoué. Veuillez corriger les erreurs.');
      process.exit(1);
    }
  }
}

// Exécution du script
if (require.main === module) {
  const checker = new ApplicationIntegrityChecker();
  checker.run().catch(error => {
    console.error('❌ Erreur lors du contrôle d\'intégrité:', error);
    process.exit(1);
  });
}

module.exports = ApplicationIntegrityChecker;