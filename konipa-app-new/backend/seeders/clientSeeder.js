const { Client, User } = require('../models');

const seedClients = async () => {
  try {
    // Vérifier si des clients existent déjà
    const existingClients = await Client.count();
    if (existingClients > 0) {
      console.log('Des clients existent déjà, seeding ignoré.');
      return;
    }

    // Récupérer les utilisateurs clients existants
    const clientUsers = await User.findAll({
      where: { role: 'client' }
    });

    const clients = [
      {
        user_id: clientUsers[0]?.id || null,
        company_name: 'Entreprise ABC',
        client_code_sage: 'CLI001',
        sage_last_sync: null,
        siret: 'SIR001234567890',
        vat_number: 'MA123456789',
        address: '123 Rue Mohammed V',
        city: 'Casablanca',
        postal_code: '20000',
        country: 'Morocco',
        phone: '+212522123456',
        website: 'www.entreprise-abc.ma',
        industry: 'Commerce',
        client_type: 'Entreprise',
        credit_limit: 50000.00,
        current_credit: 15000.00,
        outstanding_amount: 5000.00,
        is_blocked: false,
        payment_terms: 30,
        discount_rate: 5.00,
        is_active: true,
        registration_date: new Date('2023-01-15'),
        last_order_date: new Date('2024-01-10'),
        total_orders: 25,
        total_spent: 125000.00,
        notes: 'Client fidèle depuis 2023',
        preferences: {
          delivery_method: 'standard',
          communication_language: 'fr',
          invoice_format: 'pdf'
        }
      },
      {
        user_id: clientUsers[1]?.id || null,
        company_name: 'Société XYZ',
        client_code_sage: 'CLI002',
        sage_last_sync: null,
        siret: 'SIR002345678901',
        vat_number: 'MA987654321',
        address: '456 Avenue Hassan II',
        city: 'Rabat',
        postal_code: '10000',
        country: 'Morocco',
        phone: '+212537654321',
        website: 'www.societe-xyz.ma',
        industry: 'Distribution',
        client_type: 'Grossiste',
        credit_limit: 75000.00,
        current_credit: 25000.00,
        outstanding_amount: 8000.00,
        is_blocked: false,
        payment_terms: 45,
        discount_rate: 7.50,
        is_active: true,
        registration_date: new Date('2023-03-20'),
        last_order_date: new Date('2024-01-12'),
        total_orders: 18,
        total_spent: 89000.00,
        notes: 'Grossiste avec bon potentiel',
        preferences: {
          delivery_method: 'express',
          communication_language: 'fr',
          invoice_format: 'xml'
        }
      },
      {
        user_id: null, // Client sans utilisateur associé
        company_name: 'Commerce DEF',
        client_code_sage: 'CLI003',
        sage_last_sync: null,
        siret: 'SIR003456789012',
        vat_number: 'MA456789123',
        address: '789 Boulevard Zerktouni',
        city: 'Casablanca',
        postal_code: '20100',
        country: 'Morocco',
        phone: '+212522987654',
        website: null,
        industry: 'Retail',
        client_type: 'Détaillant',
        credit_limit: 25000.00,
        current_credit: 5000.00,
        outstanding_amount: 2000.00,
        is_blocked: false,
        payment_terms: 15,
        discount_rate: 2.50,
        is_active: true,
        registration_date: new Date('2023-06-10'),
        last_order_date: new Date('2024-01-08'),
        total_orders: 12,
        total_spent: 35000.00,
        notes: 'Petit détaillant local',
        preferences: {
          delivery_method: 'standard',
          communication_language: 'fr',
          invoice_format: 'pdf'
        }
      },
      {
        user_id: null,
        company_name: 'Négoce GHI',
        client_code_sage: 'CLI004',
        sage_last_sync: null,
        siret: 'SIR004567890123',
        vat_number: 'MA789123456',
        address: '321 Rue Allal Ben Abdellah',
        city: 'Fès',
        postal_code: '30000',
        country: 'Morocco',
        phone: '+212535321654',
        website: 'www.negoce-ghi.ma',
        industry: 'Négoce',
        client_type: 'Importateur',
        credit_limit: 100000.00,
        current_credit: 40000.00,
        outstanding_amount: 12000.00,
        is_blocked: false,
        payment_terms: 60,
        discount_rate: 10.00,
        is_active: true,
        registration_date: new Date('2022-11-05'),
        last_order_date: new Date('2024-01-14'),
        total_orders: 35,
        total_spent: 180000.00,
        notes: 'Gros importateur, volumes importants',
        preferences: {
          delivery_method: 'express',
          communication_language: 'fr',
          invoice_format: 'xml'
        }
      },
      {
        user_id: clientUsers[2]?.id || null,
        company_name: 'Distribution JKL',
        client_code_sage: 'CLI005',
        sage_last_sync: null,
        siret: 'SIR005678901234',
        vat_number: 'MA321654987',
        address: '654 Avenue Mohammed VI',
        city: 'Marrakech',
        postal_code: '40000',
        country: 'Morocco',
        phone: '+212524456789',
        website: null,
        industry: 'Distribution',
        client_type: 'Distributeur',
        credit_limit: 60000.00,
        current_credit: 20000.00,
        outstanding_amount: 3000.00,
        is_blocked: true, // Client bloqué pour test
        payment_terms: 30,
        discount_rate: 5.00,
        is_active: false,
        registration_date: new Date('2023-08-15'),
        last_order_date: new Date('2023-12-20'),
        total_orders: 8,
        total_spent: 45000.00,
        notes: 'Client temporairement bloqué - problème de paiement',
        preferences: {
          delivery_method: 'standard',
          communication_language: 'fr',
          invoice_format: 'pdf'
        }
      }
    ];

    const createdClients = await Client.bulkCreate(clients);
    console.log('✅ Seeding des clients terminé avec succès!');
    console.log(`📊 ${createdClients.length} clients créés:`);
    
    createdClients.forEach((client, index) => {
      console.log(`   - ${client.company_name} (${client.client_code_sage}) - ${client.is_active ? 'Actif' : 'Inactif'}`);
    });

    return createdClients;

  } catch (error) {
    console.error('❌ Erreur lors du seeding des clients:', error);
    throw error;
  }
};

module.exports = { seedClients };