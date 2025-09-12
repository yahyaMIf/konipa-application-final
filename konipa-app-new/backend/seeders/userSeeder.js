const bcrypt = require('bcrypt');
const { User } = require('../models');

const seedUsers = async () => {
  try {
    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('Des utilisateurs existent déjà, seeding ignoré.');
      return;
    }

    const users = [
      {
        email: 'admin@konipa.com',
        password_hash: await bcrypt.hash('admin123', 10),
        first_name: 'Admin',
        last_name: 'Konipa',
        role: 'admin',
        is_active: true,
        email_verified: true,
        phone: '+212600000001',
        address: 'Casablanca, Maroc',
        company: 'Konipa'
      },
      {
        email: 'comptabilite@konipa.com',
        password_hash: await bcrypt.hash('compta123', 10),
        first_name: 'Ahmed',
        last_name: 'Benali',
        role: 'accounting',
        is_active: true,
        email_verified: true,
        phone: '+212600000002',
        address: 'Casablanca, Maroc',
        company: 'Konipa'
      },
      {
        email: 'comptoir@konipa.com',
        password_hash: await bcrypt.hash('comptoir123', 10),
        first_name: 'Fatima',
        last_name: 'Alami',
        role: 'counter',
        is_active: true,
        email_verified: true,
        phone: '+212600000003',
        address: 'Casablanca, Maroc',
        company: 'Konipa'
      },
      {
        email: 'representant@konipa.com',
        password_hash: await bcrypt.hash('rep123', 10),
        first_name: 'Omar',
        last_name: 'Tazi',
        role: 'representative',
        is_active: true,
        email_verified: true,
        phone: '+212600000004',
        address: 'Rabat, Maroc',
        company: 'Konipa'
      },
      {
        email: 'client1@example.com',
        password_hash: await bcrypt.hash('client123', 10),
        first_name: 'Mohammed',
        last_name: 'Idrissi',
        role: 'client',
        is_active: true,
        email_verified: true,
        phone: '+212600000005',
        address: 'Marrakech, Maroc',
        company: 'Entreprise ABC'
      },
      {
        email: 'client2@example.com',
        password_hash: await bcrypt.hash('client123', 10),
        first_name: 'Aicha',
        last_name: 'Benjelloun',
        role: 'client',
        is_active: true,
        email_verified: true,
        phone: '+212600000006',
        address: 'Fès, Maroc',
        company: 'Société XYZ'
      },
      {
        email: 'client3@example.com',
        password_hash: await bcrypt.hash('client123', 10),
        first_name: 'Youssef',
        last_name: 'Chraibi',
        role: 'client',
        is_active: false,
        email_verified: false,
        phone: '+212600000007',
        address: 'Agadir, Maroc',
        company: 'Commerce DEF'
      }
    ];

    await User.bulkCreate(users);
    console.log('✅ Seeding des utilisateurs terminé avec succès!');
    console.log(`📊 ${users.length} utilisateurs créés:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du seeding des utilisateurs:', error);
    throw error;
  }
};

module.exports = { seedUsers };