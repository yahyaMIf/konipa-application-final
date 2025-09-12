const { Client, Product, User, Order, PriceOverride } = require('../models');
const bcrypt = require('bcrypt');

const testDataSeeder = {
  async seed() {
    try {
      console.log('🌱 Création des données de test...');

      // 1. Créer des clients de test
      const clients = await Client.bulkCreate([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          company_name: 'ELYAZID PIECES AUTO',
          contact_person: 'Ahmed Elyazid',
          email: 'contact@elyazid-pieces.com',
          phone: '0123456789',
          address_line1: '123 Rue de l'Automobile',
          city: 'Kenitra',
          postal_code: '14000',
          client_code_sage: 'CLI001',
          credit_limit: 50000.00,
          outstanding_amount: 12500.00,
          discount_rate: 5.00,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          company_name: 'GARAGE MODERNE',
          contact_person: 'Fatima Zahra',
          email: 'info@garage-moderne.fr',
          phone: '0987654321',
          address_line1: '456 Avenue des Mécaniciens',
          city: 'Casablanca',
          postal_code: '20000',
          client_code_sage: 'CLI002',
          credit_limit: 75000.00,
          outstanding_amount: 32000.00,
          discount_rate: 7.50,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          company_name: 'AUTO SERVICES PLUS',
          contact_person: 'Mohammed Alami',
          email: 'contact@autoservicesplus.com',
          phone: '0456789123',
          address_line1: '789 Boulevard des Réparations',
          city: 'Rabat',
          postal_code: '10000',
          client_code_sage: 'CLI003',
          credit_limit: 100000.00,
          outstanding_amount: 45000.00,
          discount_rate: 10.00,
          is_active: true
        }
      ]);

      console.log('✅ Clients créés:', clients.length);

      // 2. Créer des produits de test
      const products = await Product.bulkCreate([
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          name: 'Plaquettes de frein avant',
          product_ref_sage: 'PF001',
          description: 'Plaquettes de frein haute qualité',
          category: 'Freinage',
          brand: 'Brembo',
          base_price_ht: 125.50,
          cost_price: 85.00,
          stock_quantity: 150,
          min_stock: 20,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          name: 'Filtre à huile',
          product_ref_sage: 'FO002',
          description: 'Filtre à huile moteur',
          category: 'Filtration',
          brand: 'Mann Filter',
          base_price_ht: 45.25,
          cost_price: 28.00,
          stock_quantity: 300,
          min_stock: 50,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440013',
          name: 'Amortisseurs avant',
          product_ref_sage: 'AM003',
          description: 'Amortisseurs avant complets',
          category: 'Suspension',
          brand: 'Monroe',
          base_price_ht: 350.00,
          cost_price: 220.00,
          stock_quantity: 25,
          min_stock: 5,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440014',
          name: 'Kit embrayage',
          product_ref_sage: 'KE004',
          description: 'Kit embrayage complet',
          category: 'Transmission',
          brand: 'Valeo',
          base_price_ht: 425.00,
          cost_price: 280.00,
          stock_quantity: 12,
          min_stock: 3,
          is_active: true
        }
      ]);

      console.log('✅ Produits créés:', products.length);

      // 3. Créer des tarifications de test
      const pricing = await PriceOverride.bulkCreate([
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          client_id: '550e8400-e29b-41d4-a716-446655440001',
          product_id: '550e8400-e29b-41d4-a716-446655440011',
          discount_percent: 5.00,
          minimum_quantity: 10,
          is_active: true,
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440022',
          client_id: '550e8400-e29b-41d4-a716-446655440001',
          product_id: '550e8400-e29b-41d4-a716-446655440012',
          discount_percent: 7.50,
          minimum_quantity: 50,
          is_active: true,
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440023',
          client_id: '550e8400-e29b-41d4-a716-446655440002',
          product_id: '550e8400-e29b-41d4-a716-446655440013',
          discount_percent: 10.00,
          minimum_quantity: 2,
          is_active: true,
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440024',
          client_id: '550e8400-e29b-41d4-a716-446655440002',
          category_name: 'Freinage',
          discount_percent: 8.00,
          minimum_quantity: 5,
          is_active: true,
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440025',
          client_id: '550e8400-e29b-41d4-a716-446655440003',
          product_id: '550e8400-e29b-41d4-a716-446655440014',
          discount_percent: 12.00,
          minimum_quantity: 1,
          is_active: true,
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        }
      ]);

      console.log('✅ Tarifications créées:', pricing.length);

      // 4. Créer des commandes de test
      const orders = await Order.bulkCreate([
        {
          id: '550e8400-e29b-41d4-a716-446655440031',
          client_id: '550e8400-e29b-41d4-a716-446655440001',
          order_number: 'CMD-2024-001',
          total_amount: 2450.75,
          status: 'pending',
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440032',
          client_id: '550e8400-e29b-41d4-a716-446655440002',
          order_number: 'CMD-2024-002',
          total_amount: 1875.00,
          status: 'approved',
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440033',
          client_id: '550e8400-e29b-41d4-a716-446655440003',
          order_number: 'CMD-2024-003',
          total_amount: 3200.50,
          status: 'rejected',
          created_by: 'b3543451-c085-43d1-9ce1-2d1ad32bf620'
        }
      ]);

      console.log('✅ Commandes créées:', orders.length);

      console.log('🎉 Données de test créées avec succès !');
      return {
        clients: clients.length,
        products: products.length,
        pricing: pricing.length,
        orders: orders.length
      };

    } catch (error) {
      console.error('❌ Erreur lors de la création des données de test:', error);
      throw error;
    }
  }
};

module.exports = testDataSeeder;
