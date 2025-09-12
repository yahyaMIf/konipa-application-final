const { Product } = require('../models');

const seedProducts = async () => {
    try {
        // Vérifier si des produits existent déjà
        const existingProducts = await Product.count();
        if (existingProducts > 0) {
            console.log('Des produits existent déjà, seeding ignoré.');
            return;
        }

        // Données des produits de test corrigées
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
                min_stock_level: 5,
                max_stock_level: 50,
                weight: 1.45,
                dimensions: '32.6 x 23.4 x 1.99 cm',
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
                min_stock_level: 3,
                max_stock_level: 30,
                weight: 6.2,
                dimensions: '61.1 x 18.1 x 36.8 cm',
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
                category: 'Mobilier',
                brand: 'OfficePro',
                base_price_ht: 899.99,
                vat_rate: 20.00,
                stock: 8,
                min_stock_level: 2,
                max_stock_level: 15,
                weight: 45.5,
                dimensions: '160 x 80 x 73 cm',
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
                category: 'Mobilier',
                brand: 'OfficePro',
                base_price_ht: 1299.99,
                vat_rate: 20.00,
                stock: 12,
                min_stock_level: 3,
                max_stock_level: 20,
                weight: 18.2,
                dimensions: '68 x 68 x 96 cm',
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
                category: 'Fournitures',
                brand: 'SupplyMax',
                base_price_ht: 8.99,
                vat_rate: 20.00,
                stock: 200,
                min_stock_level: 50,
                max_stock_level: 500,
                weight: 2.5,
                dimensions: '21 x 29.7 x 5.2 cm',
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
                category: 'Électronique',
                brand: 'TechCorp',
                base_price_ht: 299.99,
                vat_rate: 20.00,
                stock: 18,
                min_stock_level: 5,
                max_stock_level: 35,
                weight: 7.8,
                dimensions: '35.7 x 36 x 18.3 cm',
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
                category: 'Électronique',
                brand: 'TechCorp',
                base_price_ht: 1399.99,
                vat_rate: 20.00,
                stock: 10,
                min_stock_level: 2,
                max_stock_level: 20,
                weight: 0.682,
                dimensions: '28.06 x 21.49 x 0.64 cm',
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
                category: 'Mobilier',
                brand: 'OfficePro',
                base_price_ht: 399.99,
                vat_rate: 20.00,
                stock: 6,
                min_stock_level: 2,
                max_stock_level: 12,
                weight: 42.0,
                dimensions: '90 x 40 x 180 cm',
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
            console.log(`   - ${product.name} (${product.sku}) - ${product.base_price_ht}€`);
        });

        return createdProducts;

    } catch (error) {
        console.error('❌ Erreur lors du seeding des produits:', error);
        throw error;
    }
};

module.exports = { seedProducts };
