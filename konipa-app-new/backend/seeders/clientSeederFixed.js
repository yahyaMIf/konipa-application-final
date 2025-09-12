const { Client } = require('../models');

const seedClients = async () => {
    try {
        // Vérifier si des clients existent déjà
        const existingClients = await Client.count();
        if (existingClients > 0) {
            console.log('Des clients existent déjà, seeding ignoré.');
            return;
        }

        const clientsData = [
            {
                id: '550e8400-e29b-41d4-a716-446655440201',
                company_name: 'Entreprise ABC',
                client_code_sage: 'CLI001',
                contact_person: 'Mohammed Idrissi',
                email: 'contact@entreprise-abc.com',
                phone: '+212600000005',
                address_line1: '123 Avenue Mohammed V',
                city: 'Marrakech',
                postal_code: '40000',
                country: 'Maroc',
                vat_number: '123456789',
                credit_limit: 50000.00,
                outstanding_amount: 15000.00,
                payment_terms: 30,
                is_active: true,
                status: 'active'
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440202',
                company_name: 'Société XYZ',
                client_code_sage: 'CLI002',
                contact_person: 'Aicha Benjelloun',
                email: 'contact@societe-xyz.com',
                phone: '+212600000006',
                address_line1: '456 Rue Hassan II',
                city: 'Fès',
                postal_code: '30000',
                country: 'Maroc',
                vat_number: '987654321',
                credit_limit: 75000.00,
                outstanding_amount: 25000.00,
                payment_terms: 45,
                is_active: true,
                status: 'active'
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440203',
                company_name: 'Commerce DEF',
                client_code_sage: 'CLI003',
                contact_person: 'Youssef Chraibi',
                email: 'contact@commerce-def.com',
                phone: '+212600000007',
                address_line1: '789 Boulevard Zerktouni',
                city: 'Agadir',
                postal_code: '80000',
                country: 'Maroc',
                vat_number: '456789123',
                credit_limit: 30000.00,
                outstanding_amount: 5000.00,
                payment_terms: 15,
                is_active: false,
                status: 'inactive'
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440204',
                company_name: 'Industrie GHI',
                client_code_sage: 'CLI004',
                contact_person: 'Fatima Alami',
                email: 'contact@industrie-ghi.com',
                phone: '+212600000008',
                address_line1: '321 Rue de la Liberté',
                city: 'Casablanca',
                postal_code: '20000',
                country: 'Maroc',
                vat_number: '789123456',
                credit_limit: 100000.00,
                outstanding_amount: 45000.00,
                payment_terms: 60,
                is_active: true,
                status: 'active'
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440205',
                company_name: 'Services JKL',
                client_code_sage: 'CLI005',
                contact_person: 'Omar Tazi',
                email: 'contact@services-jkl.com',
                phone: '+212600000009',
                address_line1: '654 Avenue des Nations Unies',
                city: 'Rabat',
                postal_code: '10000',
                country: 'Maroc',
                vat_number: '321654987',
                credit_limit: 25000.00,
                outstanding_amount: 0.00,
                payment_terms: 30,
                is_active: true,
                status: 'active'
            }
        ];

        const createdClients = await Client.bulkCreate(clientsData);
        console.log('✅ Seeding des clients terminé avec succès!');
        console.log(`📊 ${createdClients.length} clients créés:`);

        createdClients.forEach((client, index) => {
            console.log(`   - ${client.company_name} (${client.client_code_sage}) - Limite: ${client.credit_limit}€`);
        });

        return createdClients;

    } catch (error) {
        console.error('❌ Erreur lors du seeding des clients:', error);
        throw error;
    }
};

module.exports = { seedClients };
