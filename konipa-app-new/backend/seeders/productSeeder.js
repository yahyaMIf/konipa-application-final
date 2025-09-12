const { Product, Category, Brand } = require('../models');

const seedProducts = async () => {
  try {
    // Vérifier si des produits existent déjà
    const existingProducts = await Product.count();
    if (existingProducts > 0) {
      console.log('Des produits existent déjà, seeding ignoré.');
      return;
    }

    // Créer des catégories de test si elles n'existent pas
    const categories = await Category.bulkCreate([
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Électronique',
        description: 'Produits électroniques et informatiques',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Mobilier',
        description: 'Mobilier de bureau et équipements',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Fournitures',
        description: 'Fournitures de bureau et consommables',
        is_active: true
      }
    ], { ignoreDuplicates: true });

    // Créer des marques de test si elles n'existent pas
    const brands = await Brand.bulkCreate([
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'TechCorp',
        description: 'Marque leader en technologie',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'OfficePro',
        description: 'Spécialiste du mobilier de bureau',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'SupplyMax',
        description: 'Fournitures de qualité professionnelle',
        is_active: true
      }
    ], { ignoreDuplicates: true });

    // Données des produits de test
    const productsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        sku: 'LAPTOP-001',
        name: 'Ordinateur Portable HP EliteBook 840',
        description: 'Ordinateur portable professionnel 14 pouces, Intel Core i7, 16GB RAM, 512GB SSD',
        short_description: 'Laptop professionnel haute performance',
        category: 'Électronique',
        brand: 'TechCorp',
        base_price_ht: 1299.99,
        vat_rate: 20.00,
        stock: 25,
        min_stock: 5,
        max_stock: 50,
        weight: 1.45,
        dimensions: { length: 32.6, width: 23.4, height: 1.99 },
        images: ['/images/products/laptop-hp-840.jpg'],
        specifications: {
          processor: 'Intel Core i7-1165G7',
          memory: '16GB DDR4',
          storage: '512GB SSD',
          display: '14" Full HD',
          os: 'Windows 11 Pro'
        },
        tags: ['laptop', 'professionnel', 'hp', 'intel'],
        is_active: true,
        is_featured: true,
        status: 'active',
        visibility: 'public',
        sort_order: 1
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        sku: 'MONITOR-001',
        name: 'Écran Dell UltraSharp 27"',
        description: 'Moniteur professionnel 27 pouces, résolution 4K, USB-C, réglable en hauteur',
        short_description: 'Écran 4K professionnel 27 pouces',
        category: 'Électronique',
        brand: 'TechCorp',
        base_price_ht: 599.99,
        vat_rate: 20.00,
        stock: 15,
        min_stock: 3,
        max_stock: 30,
        weight: 6.2,
        dimensions: { length: 61.1, width: 18.1, height: 36.8 },
        images: ['/images/products/monitor-dell-27.jpg'],
        specifications: {
          size: '27 pouces',
          resolution: '3840 x 2160 (4K)',
          panel: 'IPS',
          connectivity: 'USB-C, HDMI, DisplayPort',
          adjustable: true
        },
        tags: ['écran', 'monitor', '4k', 'dell', 'usb-c'],
        is_active: true,
        is_featured: false,
        status: 'active',
        visibility: 'public',
        sort_order: 2
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        sku: 'DESK-001',
        name: 'Bureau Assis-Debout Électrique',
        description: 'Bureau réglable électriquement, plateau 160x80cm, structure acier, mémoire de positions',
        short_description: 'Bureau électrique réglable en hauteur',
        category_id: '550e8400-e29b-41d4-a716-446655440002',
        brand_id: '550e8400-e29b-41d4-a716-446655440012',
        price: 899.99,
        cost_price: 649.99,
        sale_price: 799.99,
        vat_rate: 20.00,
        stock: 8,
        min_stock: 2,
        max_stock: 15,
        weight: 45.5,
        dimensions: { length: 160, width: 80, height: 73 },
        images: ['/images/products/desk-electric.jpg'],
        specifications: {
          dimensions: '160x80cm',
          height_range: '73-123cm',
          material: 'Plateau mélaminé, structure acier',
          motor: 'Moteur électrique silencieux',
          memory: '4 positions mémorisables'
        },
        tags: ['bureau', 'assis-debout', 'électrique', 'ergonomique'],
        is_active: true,
        is_featured: true,
        status: 'active',
        visibility: 'public',
        sort_order: 3
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440104',
        sku: 'CHAIR-001',
        name: 'Chaise Ergonomique Herman Miller',
        description: 'Chaise de bureau ergonomique, support lombaire, accoudoirs réglables, garantie 12 ans',
        short_description: 'Chaise ergonomique haut de gamme',
        category_id: '550e8400-e29b-41d4-a716-446655440002',
        brand_id: '550e8400-e29b-41d4-a716-446655440012',
        price: 1299.99,
        cost_price: 899.99,
        sale_price: 1199.99,
        vat_rate: 20.00,
        stock: 12,
        min_stock: 3,
        max_stock: 20,
        weight: 18.2,
        dimensions: { length: 68, width: 68, height: 96 },
        images: ['/images/products/chair-herman-miller.jpg'],
        specifications: {
          material: 'Mesh respirant, base aluminium',
          adjustments: 'Hauteur, inclinaison, accoudoirs',
          lumbar_support: 'Support lombaire réglable',
          warranty: '12 ans',
          weight_capacity: '136kg'
        },
        tags: ['chaise', 'ergonomique', 'herman-miller', 'bureau'],
        is_active: true,
        is_featured: false,
        status: 'active',
        visibility: 'public',
        sort_order: 4
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440105',
        sku: 'PAPER-001',
        name: 'Papier A4 80g - Ramette 500 feuilles',
        description: 'Papier blanc A4 80g/m², qualité premium, compatible toutes imprimantes',
        short_description: 'Ramette papier A4 80g premium',
        category_id: '550e8400-e29b-41d4-a716-446655440003',
        brand_id: '550e8400-e29b-41d4-a716-446655440013',
        price: 8.99,
        cost_price: 5.99,
        sale_price: 7.99,
        vat_rate: 20.00,
        stock: 200,
        min_stock: 50,
        max_stock: 500,
        weight: 2.5,
        dimensions: { length: 21, width: 29.7, height: 5.2 },
        images: ['/images/products/paper-a4.jpg'],
        specifications: {
          format: 'A4 (210x297mm)',
          grammage: '80g/m²',
          quantity: '500 feuilles',
          whiteness: '160 CIE',
          compatibility: 'Laser, Jet d\'encre, Photocopie'
        },
        tags: ['papier', 'a4', 'bureau', 'impression'],
        is_active: true,
        is_featured: false,
        status: 'active',
        visibility: 'public',
        sort_order: 5
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440106',
        sku: 'PRINTER-001',
        name: 'Imprimante Laser HP LaserJet Pro',
        description: 'Imprimante laser monochrome, recto-verso automatique, WiFi, 38 ppm',
        short_description: 'Imprimante laser professionnelle',
        category_id: '550e8400-e29b-41d4-a716-446655440001',
        brand_id: '550e8400-e29b-41d4-a716-446655440011',
        price: 299.99,
        cost_price: 219.99,
        sale_price: 279.99,
        vat_rate: 20.00,
        stock: 18,
        min_stock: 5,
        max_stock: 35,
        weight: 7.8,
        dimensions: { length: 35.7, width: 36, height: 18.3 },
        images: ['/images/products/printer-hp-laser.jpg'],
        specifications: {
          type: 'Laser monochrome',
          speed: '38 ppm',
          duplex: 'Automatique',
          connectivity: 'WiFi, Ethernet, USB',
          paper_capacity: '250 feuilles'
        },
        tags: ['imprimante', 'laser', 'hp', 'wifi', 'recto-verso'],
        is_active: true,
        is_featured: false,
        status: 'active',
        visibility: 'public',
        sort_order: 6
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440107',
        sku: 'TABLET-001',
        name: 'Tablette iPad Pro 12.9"',
        description: 'Tablette professionnelle 12.9 pouces, puce M2, 256GB, compatible Apple Pencil',
        short_description: 'iPad Pro 12.9" professionnel',
        category_id: '550e8400-e29b-41d4-a716-446655440001',
        brand_id: '550e8400-e29b-41d4-a716-446655440011',
        price: 1399.99,
        cost_price: 1099.99,
        sale_price: 1299.99,
        vat_rate: 20.00,
        stock: 10,
        min_stock: 2,
        max_stock: 20,
        weight: 0.682,
        dimensions: { length: 28.06, width: 21.49, height: 0.64 },
        images: ['/images/products/ipad-pro-12.jpg'],
        specifications: {
          screen: '12.9" Liquid Retina XDR',
          chip: 'Apple M2',
          storage: '256GB',
          camera: '12MP + LiDAR',
          compatibility: 'Apple Pencil, Magic Keyboard'
        },
        tags: ['tablette', 'ipad', 'apple', 'pro', 'm2'],
        is_active: true,
        is_featured: true,
        status: 'active',
        visibility: 'public',
        sort_order: 7
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440108',
        sku: 'STORAGE-001',
        name: 'Armoire de Rangement Métallique',
        description: 'Armoire 2 portes, 4 étagères réglables, serrure, dimensions 180x90x40cm',
        short_description: 'Armoire métallique 2 portes',
        category_id: '550e8400-e29b-41d4-a716-446655440002',
        brand_id: '550e8400-e29b-41d4-a716-446655440012',
        price: 399.99,
        cost_price: 279.99,
        sale_price: 359.99,
        vat_rate: 20.00,
        stock: 6,
        min_stock: 2,
        max_stock: 12,
        weight: 42.0,
        dimensions: { length: 90, width: 40, height: 180 },
        images: ['/images/products/storage-cabinet.jpg'],
        specifications: {
          material: 'Acier laqué époxy',
          doors: '2 portes battantes',
          shelves: '4 étagères réglables',
          lock: 'Serrure 2 points',
          capacity: '120kg par étagère'
        },
        tags: ['armoire', 'rangement', 'métallique', 'bureau'],
        is_active: true,
        is_featured: false,
        status: 'active',
        visibility: 'public',
        sort_order: 8
      }
    ];

    const createdProducts = await Product.bulkCreate(productsData);
    console.log('✅ Seeding des produits terminé avec succès!');
    console.log(`📊 ${createdProducts.length} produits créés:`);

    createdProducts.forEach((product, index) => {
      console.log(`   - ${product.name} (${product.sku}) - ${product.price}€`);
    });

    return createdProducts;

  } catch (error) {
    console.error('❌ Erreur lors du seeding des produits:', error);
    throw error;
  }
};

module.exports = { seedProducts };