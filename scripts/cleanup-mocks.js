#!/usr/bin/env node
/**
 * Script de nettoyage automatisé pour la refonte Konipa B2B
 * Désactive les mocks et uniformise la base de données
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'konipa-app-new');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'konipa-backend');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`)
};

// Fonction pour lire un fichier
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log.warning(`Impossible de lire le fichier: ${filePath}`);
    return null;
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log.error(`Impossible d'écrire le fichier: ${filePath}`);
    return false;
  }
}

// Fonction pour créer un répertoire
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.success(`Répertoire créé: ${dirPath}`);
  }
}

// 1. Nettoyer les imports de mockData
function cleanMockImports() {
  log.step('Nettoyage des imports de mockData...');
  
  const filesToClean = [
    path.join(FRONTEND_ROOT, 'src/contexts/AuthContext.jsx'),
    path.join(FRONTEND_ROOT, 'src/pages/CEODashboard.jsx'),
    path.join(FRONTEND_ROOT, 'src/pages/CommercialDashboard.jsx'),
    path.join(FRONTEND_ROOT, 'src/pages/ComptabiliteDashboard.jsx'),
    path.join(FRONTEND_ROOT, 'src/pages/ClientDashboard.jsx'),
    path.join(FRONTEND_ROOT, 'src/pages/AdminPanel.jsx')
  ];
  
  filesToClean.forEach(filePath => {
    const content = readFile(filePath);
    if (content) {
      // Supprimer les imports de mockData
      let cleanedContent = content
        .replace(/import.*from.*['"].*mockData['"];?\n?/g, '')
        .replace(/import.*mockData.*from.*['"].*['"];?\n?/g, '')
        .replace(/import.*{.*mockData.*}.*from.*['"].*['"];?\n?/g, '')
        .replace(/import.*{[^}]*mock[^}]*}.*from.*['"].*['"];?\n?/gi, '')
        .replace(/,\s*mockUsers/g, '')
        .replace(/,\s*mockProducts/g, '')
        .replace(/,\s*mockOrders/g, '')
        .replace(/,\s*commercialPerformanceData/g, '');
      
      if (cleanedContent !== content) {
        writeFile(filePath, cleanedContent);
        log.success(`Nettoyé: ${path.basename(filePath)}`);
      }
    }
  });
}

// 2. Créer le fichier de configuration d'environnement
function createEnvironmentFile() {
  log.step('Création du fichier d\'environnement...');
  
  const envContent = `# Configuration Konipa B2B - Refonte
# Base de données unifiée
VITE_API_URL=http://localhost:3001
VITE_FRONTEND_URL=http://localhost:5173

# Base de données MySQL (Docker)
VITE_DB_HOST=localhost
VITE_DB_PORT=3306
VITE_DB_NAME=konipa_b2b
VITE_DB_USER=root
VITE_DB_PASSWORD=password

# Désactivation des mocks
VITE_ENABLE_MOCKS=false
VITE_ENABLE_MOCK_FALLBACK=false

# Configuration Sage (à configurer plus tard)
VITE_SAGE_ENABLED=false
VITE_SAGE_API_URL=
VITE_SAGE_USERNAME=
VITE_SAGE_PASSWORD=
VITE_SAGE_DATABASE=
VITE_SAGE_TIMEOUT=30000

# Sécurité
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
`;
  
  const envPath = path.join(FRONTEND_ROOT, '.env.local');
  writeFile(envPath, envContent);
  log.success('Fichier .env.local créé');
}

// 3. Mettre à jour le fichier de configuration existant
function updateConfigFile() {
  log.step('Mise à jour du fichier de configuration...');
  
  const configPath = path.join(FRONTEND_ROOT, 'src/services/config.js');
  const content = readFile(configPath);
  
  if (content) {
    const newContent = `/**
 * Configuration centralisée pour Konipa B2B
 * Utilise les variables d'environnement et la nouvelle configuration
 */
import { API_BASE_URL, MOCK_CONFIG } from '../config/environment';

// URL de base de l'API
export { API_BASE_URL };

// Configuration des mocks (désactivée)
export const ENABLE_MOCKS = false;
export const ENABLE_MOCK_FALLBACK = false;

// Configuration de l'authentification
export const AUTH_CONFIG = {
  tokenKey: 'konipa_access_token',
  refreshTokenKey: 'konipa_refresh_token',
  userKey: 'konipa_user',
  sessionExpiryKey: 'konipa_session_expiry'
};

// Configuration par défaut
export default {
  apiBaseUrl: API_BASE_URL,
  enableMocks: false,
  enableMockFallback: false,
  auth: AUTH_CONFIG
};
`;
    
    writeFile(configPath, newContent);
    log.success('Fichier config.js mis à jour');
  }
}

// 4. Créer le script de migration de base de données
function createMigrationScript() {
  log.step('Création du script de migration de base de données...');
  
  ensureDir(path.join(PROJECT_ROOT, 'database'));
  ensureDir(path.join(PROJECT_ROOT, 'database/migrations'));
  ensureDir(path.join(PROJECT_ROOT, 'database/seeds'));
  
  const migrationContent = `-- Migration initiale pour Konipa B2B
-- Création des tables principales

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  role ENUM('ceo', 'commercial', 'accountant', 'pos', 'counter', 'client', 'admin') NOT NULL,
  isActive BOOLEAN DEFAULT true,
  lastLogin DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  permissions JSON,
  city VARCHAR(100),
  phone VARCHAR(20),
  address TEXT
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  companyName VARCHAR(255),
  contactPerson VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postalCode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'France',
  creditLimit DECIMAL(10,2) DEFAULT 0,
  currentBalance DECIMAL(10,2) DEFAULT 0,
  discountPercentage DECIMAL(5,2) DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  brand VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  stock INT DEFAULT 0,
  minStock INT DEFAULT 0,
  maxStock INT DEFAULT 1000,
  isActive BOOLEAN DEFAULT true,
  imageUrl VARCHAR(500),
  weight DECIMAL(8,3),
  dimensions VARCHAR(100),
  barcode VARCHAR(100),
  supplier VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderNumber VARCHAR(50) UNIQUE NOT NULL,
  clientId INT,
  userId INT,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  totalAmount DECIMAL(10,2) NOT NULL,
  discountAmount DECIMAL(10,2) DEFAULT 0,
  taxAmount DECIMAL(10,2) DEFAULT 0,
  shippingAddress TEXT,
  billingAddress TEXT,
  notes TEXT,
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  paymentMethod VARCHAR(50),
  paymentStatus ENUM('pending', 'paid', 'partial', 'failed') DEFAULT 'pending',
  deliveryDate DATE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_client ON orders(clientId);
CREATE INDEX idx_orders_date ON orders(createdAt);
`;
  
  const migrationPath = path.join(PROJECT_ROOT, 'database/migrations/001_initial_schema.sql');
  writeFile(migrationPath, migrationContent);
  log.success('Script de migration créé');
}

// 5. Créer le script de seeding
function createSeedScript() {
  log.step('Création du script de seeding...');
  
  const seedContent = `-- Données de test pour Konipa B2B
-- Insertion des utilisateurs de base

INSERT INTO users (email, password, firstName, lastName, role, isActive, permissions, city, phone) VALUES
('ceo@konipa.com', '$2b$10$hash_for_password123', 'Jean', 'Dupont', 'ceo', true, '[]', 'Paris', '+33123456789'),
('commercial@konipa.com', '$2b$10$hash_for_password123', 'Marie', 'Martin', 'commercial', true, '[]', 'Lyon', '+33123456790'),
('comptable@konipa.com', '$2b$10$hash_for_password123', 'Pierre', 'Durand', 'accountant', true, '[]', 'Marseille', '+33123456791'),
('admin@konipa.com', '$2b$10$hash_for_password123', 'Sophie', 'Bernard', 'admin', true, '[]', 'Toulouse', '+33123456792'),
('client@konipa.com', '$2b$10$hash_for_password123', 'Paul', 'Moreau', 'client', true, '[]', 'Nice', '+33123456793');

-- Insertion des clients
INSERT INTO clients (userId, companyName, contactPerson, email, phone, address, city, postalCode, creditLimit, discountPercentage) VALUES
(5, 'Entreprise ABC', 'Paul Moreau', 'client@konipa.com', '+33123456793', '123 Rue de la Paix', 'Nice', '06000', 10000.00, 5.00),
(NULL, 'Société XYZ', 'Jacques Petit', 'contact@xyz.com', '+33123456794', '456 Avenue des Champs', 'Cannes', '06400', 15000.00, 10.00),
(NULL, 'Groupe DEF', 'Isabelle Grand', 'info@def.com', '+33123456795', '789 Boulevard du Commerce', 'Antibes', '06600', 20000.00, 15.00);

-- Insertion des produits
INSERT INTO products (sku, name, description, category, brand, price, cost, stock, minStock, imageUrl, supplier) VALUES
('PROD001', 'Produit Premium A', 'Description du produit premium A', 'Électronique', 'BrandA', 299.99, 150.00, 50, 10, '/images/prod001.jpg', 'Fournisseur A'),
('PROD002', 'Produit Standard B', 'Description du produit standard B', 'Électronique', 'BrandB', 199.99, 100.00, 75, 15, '/images/prod002.jpg', 'Fournisseur B'),
('PROD003', 'Produit Spécial C', 'Description du produit spécial C', 'Accessoires', 'BrandC', 149.99, 75.00, 30, 5, '/images/prod003.jpg', 'Fournisseur C'),
('PROD004', 'Produit Deluxe D', 'Description du produit deluxe D', 'Premium', 'BrandD', 499.99, 250.00, 20, 3, '/images/prod004.jpg', 'Fournisseur D'),
('PROD005', 'Produit Basic E', 'Description du produit basic E', 'Standard', 'BrandE', 99.99, 50.00, 100, 20, '/images/prod005.jpg', 'Fournisseur E');

-- Insertion des commandes de test
INSERT INTO orders (orderNumber, clientId, userId, status, totalAmount, shippingAddress, notes, priority, paymentMethod) VALUES
('ORD-2024-001', 1, 2, 'confirmed', 599.98, '123 Rue de la Paix, 06000 Nice', 'Commande urgente', 'high', 'credit'),
('ORD-2024-002', 2, 2, 'processing', 349.98, '456 Avenue des Champs, 06400 Cannes', 'Livraison standard', 'normal', 'cash'),
('ORD-2024-003', 3, 2, 'pending', 799.97, '789 Boulevard du Commerce, 06600 Antibes', 'Commande importante', 'high', 'credit');

-- Insertion des articles de commande
INSERT INTO order_items (orderId, productId, quantity, unitPrice, totalPrice) VALUES
(1, 1, 2, 299.99, 599.98),
(2, 2, 1, 199.99, 199.99),
(2, 3, 1, 149.99, 149.99),
(3, 4, 1, 499.99, 499.99),
(3, 1, 1, 299.99, 299.99);
`;
  
  const seedPath = path.join(PROJECT_ROOT, 'database/seeds/001_initial_data.sql');
  writeFile(seedPath, seedContent);
  log.success('Script de seeding créé');
}

// 6. Créer le script de démarrage unifié
function createStartupScript() {
  log.step('Création du script de démarrage unifié...');
  
  const startupContent = `#!/bin/bash
# Script de démarrage unifié pour Konipa B2B

echo "🚀 Démarrage de Konipa B2B - Mode Refonte"

# Vérifier que Docker est démarré
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Démarrer les services Docker
echo "📦 Démarrage des services Docker..."
docker-compose up -d mysql redis

# Attendre que MySQL soit prêt
echo "⏳ Attente de MySQL..."
while ! docker-compose exec mysql mysqladmin ping -h"localhost" --silent; do
    sleep 1
done

# Exécuter les migrations si nécessaire
echo "🗄️ Vérification de la base de données..."
docker-compose exec mysql mysql -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS konipa_b2b;"

# Démarrer le backend
echo "🔧 Démarrage du backend..."
cd konipa-backend && npm run dev &
BACKEND_PID=$!

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
while ! curl -s http://localhost:3001/health > /dev/null; do
    sleep 1
done

# Démarrer le frontend
echo "🎨 Démarrage du frontend..."
cd ../konipa-app-new && npm run dev &
FRONTEND_PID=$!

echo "✅ Tous les services sont démarrés!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "🗄️ Adminer: http://localhost:8080"
echo "📊 Redis Commander: http://localhost:8081"

echo "Press Ctrl+C to stop all services"
wait
`;
  
  const startupPath = path.join(PROJECT_ROOT, 'start-refonte.sh');
  writeFile(startupPath, startupContent);
  
  // Rendre le script exécutable
  try {
    execSync(`chmod +x "${startupPath}"`);
    log.success('Script de démarrage créé et rendu exécutable');
  } catch (error) {
    log.warning('Script créé mais impossible de le rendre exécutable');
  }
}

// 7. Mettre à jour le docker-compose pour la refonte
function updateDockerCompose() {
  log.step('Mise à jour du docker-compose...');
  
  const dockerComposePath = path.join(PROJECT_ROOT, 'docker-compose.yml');
  const content = readFile(dockerComposePath);
  
  if (content) {
    // Ajouter des commentaires pour indiquer la refonte
    const updatedContent = `# Docker Compose pour Konipa B2B - Version Refonte
# Base de données unifiée MySQL + Redis
# Mocks désactivés, API backend réelle

${content}`;
    
    writeFile(dockerComposePath, updatedContent);
    log.success('Docker-compose mis à jour');
  }
}

// Fonction principale
function main() {
  console.log(`${colors.magenta}🔧 KONIPA B2B - SCRIPT DE REFONTE${colors.reset}`);
  console.log(`${colors.magenta}======================================${colors.reset}\n`);
  
  log.info('Début du nettoyage automatisé...');
  
  try {
    // Étapes de nettoyage
    cleanMockImports();
    createEnvironmentFile();
    updateConfigFile();
    createMigrationScript();
    createSeedScript();
    createStartupScript();
    updateDockerCompose();
    
    console.log(`\n${colors.green}✅ NETTOYAGE TERMINÉ AVEC SUCCÈS!${colors.reset}`);
    console.log(`${colors.cyan}📋 Prochaines étapes:${colors.reset}`);
    console.log(`   1. Exécuter: ./start-refonte.sh`);
    console.log(`   2. Vérifier que les services démarrent correctement`);
    console.log(`   3. Tester l'authentification sans mocks`);
    console.log(`   4. Continuer avec l'étape 1 de la refonte\n`);
    
  } catch (error) {
    log.error(`Erreur lors du nettoyage: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  cleanMockImports,
  createEnvironmentFile,
  updateConfigFile,
  createMigrationScript,
  createSeedScript,
  createStartupScript,
  updateDockerCompose
};