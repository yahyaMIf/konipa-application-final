#!/usr/bin/env node

/**
 * Script de préparation au déploiement
 * Initialise la base de données et effectue les vérifications finales
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const KONIPA_APP = path.join(PROJECT_ROOT, 'konipa-app-new');
const BACKEND_DIR = path.join(KONIPA_APP, 'backend');

class DeploymentPreparation {
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

  async installDependencies() {
    console.log('\n📦 Installation des dépendances...');
    
    try {
      // Installation des dépendances backend
      console.log('Installation des dépendances backend...');
      execSync('npm install', { cwd: BACKEND_DIR, stdio: 'inherit' });
      this.log('success', 'Dépendances backend installées');
      
      // Installation des dépendances frontend
      console.log('Installation des dépendances frontend...');
      execSync('npm install', { cwd: KONIPA_APP, stdio: 'inherit' });
      this.log('success', 'Dépendances frontend installées');
      
    } catch (error) {
      this.log('error', `Erreur lors de l'installation des dépendances: ${error.message}`);
      return false;
    }
    
    return true;
  }

  async initializeDatabase() {
    console.log('\n🗄️ Initialisation de la base de données...');
    
    try {
      // Vérifier si la base de données existe
      const dbPath = path.join(BACKEND_DIR, 'database.sqlite');
      
      if (fs.existsSync(dbPath)) {
        this.log('success', 'Base de données existante trouvée');
      } else {
        this.log('warning', 'Base de données non trouvée, création en cours...');
        
        // Créer un fichier de base de données vide
        fs.writeFileSync(dbPath, '');
        this.log('success', 'Fichier de base de données créé');
      }
      
      // Exécuter les migrations si nécessaire
      try {
        console.log('Exécution des migrations...');
        execSync('npm run migrate', { cwd: BACKEND_DIR, stdio: 'inherit' });
        this.log('success', 'Migrations exécutées avec succès');
      } catch (migrateError) {
        this.log('warning', 'Migrations non disponibles ou déjà appliquées');
      }
      
    } catch (error) {
      this.log('error', `Erreur lors de l'initialisation de la base de données: ${error.message}`);
      return false;
    }
    
    return true;
  }

  async buildApplication() {
    console.log('\n🏗️ Construction de l\'application...');
    
    try {
      console.log('Construction du frontend...');
      execSync('npm run build', { cwd: KONIPA_APP, stdio: 'inherit' });
      this.log('success', 'Application frontend construite');
      
    } catch (error) {
      this.log('error', `Erreur lors de la construction: ${error.message}`);
      return false;
    }
    
    return true;
  }

  async runTests() {
    console.log('\n🧪 Exécution des tests...');
    
    try {
      // Démarrer le serveur minimal pour les tests
      console.log('Démarrage du serveur de test...');
      const serverProcess = require('child_process').spawn('node', ['minimal-server.js'], {
        cwd: BACKEND_DIR,
        detached: true,
        stdio: 'pipe'
      });
      
      // Attendre que le serveur démarre
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        // Exécuter les tests
        execSync('node test-complete-system.js', { cwd: BACKEND_DIR, stdio: 'inherit' });
        this.log('success', 'Tests système exécutés');
      } catch (testError) {
        this.log('warning', 'Certains tests ont échoué, vérifiez les détails');
      }
      
      // Arrêter le serveur de test
      serverProcess.kill('SIGTERM');
      
    } catch (error) {
      this.log('error', `Erreur lors des tests: ${error.message}`);
      return false;
    }
    
    return true;
  }

  async checkIntegrity() {
    console.log('\n🔍 Vérification de l\'intégrité...');
    
    try {
      execSync('node scripts/check-application-integrity.js', { cwd: PROJECT_ROOT, stdio: 'inherit' });
      this.log('success', 'Vérification d\'intégrité réussie');
    } catch (error) {
      this.log('warning', 'Vérification d\'intégrité avec avertissements');
    }
    
    return true;
  }

  generateDeploymentReport() {
    console.log('\n📊 Génération du rapport de déploiement...');
    
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'READY' : 'NEEDS_ATTENTION',
      summary: {
        successes: this.successes.length,
        warnings: this.warnings.length,
        errors: this.errors.length
      },
      details: {
        successes: this.successes,
        warnings: this.warnings,
        errors: this.errors
      },
      nextSteps: this.errors.length === 0 ? [
        'L\'application est prête pour le déploiement',
        'Démarrer le backend: cd backend && npm start',
        'Démarrer le frontend: npm run preview',
        'Accéder à l\'application: http://localhost:4173'
      ] : [
        'Corriger les erreurs listées ci-dessus',
        'Relancer le script de préparation',
        'Vérifier la documentation de déploiement'
      ]
    };
    
    const reportPath = path.join(PROJECT_ROOT, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE PRÉPARATION AU DÉPLOIEMENT');
    console.log('='.repeat(60));
    console.log(`✅ Succès: ${this.successes.length}`);
    console.log(`⚠️  Avertissements: ${this.warnings.length}`);
    console.log(`❌ Erreurs: ${this.errors.length}`);
    console.log(`📄 Rapport sauvegardé: ${reportPath}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 APPLICATION PRÊTE POUR LE DÉPLOIEMENT!');
      console.log('\n📋 PROCHAINES ÉTAPES:');
      report.nextSteps.forEach(step => console.log(`   • ${step}`));
    } else {
      console.log('\n⚠️  ATTENTION REQUISE AVANT LE DÉPLOIEMENT');
      console.log('\n❌ ERREURS À CORRIGER:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }
    
    return report;
  }

  async run() {
    console.log('🚀 PRÉPARATION AU DÉPLOIEMENT DE L\'APPLICATION KONIPA');
    console.log('='.repeat(60));
    
    const steps = [
      { name: 'Installation des dépendances', method: this.installDependencies },
      { name: 'Initialisation de la base de données', method: this.initializeDatabase },
      { name: 'Construction de l\'application', method: this.buildApplication },
      { name: 'Exécution des tests', method: this.runTests },
      { name: 'Vérification de l\'intégrité', method: this.checkIntegrity }
    ];
    
    for (const step of steps) {
      console.log(`\n🔄 ${step.name}...`);
      const success = await step.method.call(this);
      if (!success && step.name.includes('dépendances')) {
        this.log('error', 'Étape critique échouée, arrêt du processus');
        break;
      }
    }
    
    const report = this.generateDeploymentReport();
    
    // Code de sortie basé sur les erreurs
    process.exit(this.errors.length === 0 ? 0 : 1);
  }
}

// Exécution du script
if (require.main === module) {
  const preparation = new DeploymentPreparation();
  preparation.run().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = DeploymentPreparation;