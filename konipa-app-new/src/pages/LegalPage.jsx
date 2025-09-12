import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, Shield, Users, Building, Phone, Mail, MapPin } from 'lucide-react';
import logoKonipa from '../assets/logo.webp';

const LegalPage = () => {
    const [darkMode, setDarkMode] = useState(false);

    // Gestion du mode sombre
    useEffect(() => {
        const savedTheme = localStorage.getItem('konipa-theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode
            ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-red-900'
            : 'bg-gradient-to-br from-blue-50 via-white to-red-50'
            }`}>
            {/* Header */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } border-b shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <img src={logoKonipa} alt="Konipa" className="h-12 w-auto" />
                            <div>
                                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    Mentions Légales
                                </h1>
                                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    Informations légales et réglementaires
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.history.back()}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${darkMode
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } rounded-2xl shadow-xl p-8 border`}
                >
                    {/* Informations de l'entreprise */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Building className="h-6 w-6 mr-2 text-blue-600" />
                            Informations de l'entreprise
                        </h2>
                        <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Raison sociale :</h3>
                                    <p>KONIPA SARL</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Forme juridique :</h3>
                                    <p>Société à Responsabilité Limitée</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Capital social :</h3>
                                    <p>100 000 MAD</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">RCS :</h3>
                                    <p>Casablanca B 123456</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">SIRET :</h3>
                                    <p>12345678901234</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">TVA Intracommunautaire :</h3>
                                    <p>MA123456789</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Siège social */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <MapPin className="h-6 w-6 mr-2 text-red-600" />
                            Siège social
                        </h2>
                        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p>123 Avenue Mohammed V</p>
                            <p>20000 Casablanca</p>
                            <p>Maroc</p>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Phone className="h-6 w-6 mr-2 text-green-600" />
                            Contact
                        </h2>
                        <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                <span>+212 5 22 12 34 56</span>
                            </div>
                            <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                <span>contact@konipa.ma</span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>www.konipa.ma</span>
                            </div>
                        </div>
                    </section>

                    {/* Directeur de publication */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Users className="h-6 w-6 mr-2 text-purple-600" />
                            Directeur de publication
                        </h2>
                        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p>M. Admin Konipa</p>
                            <p>Directeur Général</p>
                        </div>
                    </section>

                    {/* Hébergement */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Shield className="h-6 w-6 mr-2 text-orange-600" />
                            Hébergement
                        </h2>
                        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p>Le site est hébergé par :</p>
                            <p>Amazon Web Services (AWS)</p>
                            <p>Région : Europe (Paris)</p>
                        </div>
                    </section>

                    {/* Propriété intellectuelle */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <FileText className="h-6 w-6 mr-2 text-indigo-600" />
                            Propriété intellectuelle
                        </h2>
                        <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p>
                                L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
                            </p>
                            <p>
                                La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
                            </p>
                        </div>
                    </section>

                    {/* Responsabilité */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Scale className="h-6 w-6 mr-2 text-red-600" />
                            Responsabilité
                        </h2>
                        <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p>
                                Les informations contenues sur ce site sont aussi précises que possible et le site remis à jour à différentes périodes de l'année, mais peut toutefois contenir des inexactitudes ou des omissions.
                            </p>
                            <p>
                                Si vous constatez une lacune, erreur ou ce qui parait être un dysfonctionnement, merci de bien vouloir le signaler par email, à l'adresse contact@konipa.ma, en décrivant le problème de la manière la plus précise possible.
                            </p>
                        </div>
                    </section>

                    {/* Droit applicable */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Scale className="h-6 w-6 mr-2 text-blue-600" />
                            Droit applicable
                        </h2>
                        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p>
                                Tout litige en relation avec l'utilisation du site www.konipa.ma est soumis au droit marocain. Il est fait attribution exclusive de juridiction aux tribunaux compétents de Casablanca.
                            </p>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            © 2024 Konipa. Tous droits réservés. Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LegalPage;
