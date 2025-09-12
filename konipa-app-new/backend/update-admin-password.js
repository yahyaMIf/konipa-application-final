const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/database');
const User = require('./models/User');

async function updateAdminPassword() {
    try {
        console.log('🔄 Mise à jour du mot de passe admin...');

        // Générer un nouveau hash pour admin123
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('🔐 Nouveau hash généré:', hashedPassword);

        // Mettre à jour l'utilisateur admin
        const [updatedRows] = await User.update(
            { password_hash: hashedPassword },
            { where: { email: 'admin@konipa.com' } }
        );

        if (updatedRows > 0) {
            console.log('✅ Mot de passe admin mis à jour avec succès');

            // Vérifier que la mise à jour a fonctionné
            const user = await User.findOne({ where: { email: 'admin@konipa.com' } });
            if (user) {
                const isValid = await bcrypt.compare(newPassword, user.password_hash);
                console.log('🔐 Vérification du nouveau mot de passe:', isValid ? '✅ VALIDE' : '❌ INVALIDE');
            }
        } else {
            console.log('❌ Aucun utilisateur trouvé pour la mise à jour');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
    } finally {
        await sequelize.close();
    }
}

updateAdminPassword();
