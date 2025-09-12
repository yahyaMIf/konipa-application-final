-- Migration initiale pour Konipa B2B
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
