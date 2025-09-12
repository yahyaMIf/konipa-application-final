import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cookie, Shield, Settings, Eye, Trash2, CheckCircle } from 'lucide-react';
import logoKonipa from '../assets/logo.webp';

const CookiesPage = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [cookiePreferences, setCookiePreferences] = useState({
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false
    });

    // Gestion du mode sombre
    useEffect(() => {
        const savedTheme = localStorage.getItem('konipa-theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const handleCookieToggle = (type) => {
        if (type === 'necessary') return; // Les cookies nécessaires ne peuvent pas être désactivés

        setCookiePreferences(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const savePreferences = () => {
        localStorage.setItem('cookie-preferences', JSON.stringify(cookiePreferences));
        // Ici vous pourriez envoyer les préférences au serveur
        alert('Préférences de cookies sauvegardées !');
    };

    const acceptAll = () => {
        setCookiePreferences({
            necessary: true,
            analytics: true,
            marketing: true,
            functional: true
        });
    };

    const rejectAll = () => {
        setCookiePreferences({
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false
        });
    };

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
                                    Politique des Cookies
                                </h1>
                                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    Gestion de vos préférences de cookies
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
                    {/* Introduction */}
                    <section className="mb-8">
                        <div className="flex items-center mb-4">
                            <Cookie className="h-8 w-8 text-orange-500 mr-3" />
                            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                Qu'est-ce qu'un cookie ?
                            </h2>
                        </div>
                        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p className="mb-4">
                                Un cookie est un petit fichier texte stocké sur votre ordinateur, tablette ou smartphone
                                lorsque vous visitez notre site web. Les cookies nous permettent de reconnaître votre
                                appareil et de mémoriser vos préférences.
                            </p>
                            <p>
                                Nous utilisons des cookies pour améliorer votre expérience sur notre site, analyser
                                l'utilisation du site et personnaliser le contenu.
                            </p>
                        </div>
                    </section>

                    {/* Types de cookies */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Settings className="h-6 w-6 mr-2 text-blue-600" />
                            Types de cookies utilisés
                        </h2>

                        <div className="space-y-6">
                            {/* Cookies nécessaires */}
                            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Shield className="h-6 w-6 text-green-500 mr-3" />
                                        <div>
                                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                Cookies nécessaires
                                            </h3>
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                Essentiels au fonctionnement du site
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                        <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'
                                            }`}>
                                            Toujours actifs
                                        </span>
                                    </div>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    Ces cookies sont nécessaires au fonctionnement du site web et ne peuvent pas être désactivés.
                                    Ils incluent les cookies de session, d'authentification et de sécurité.
                                </p>
                            </div>

                            {/* Cookies analytiques */}
                            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Eye className="h-6 w-6 text-blue-500 mr-3" />
                                        <div>
                                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                Cookies analytiques
                                            </h3>
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                Nous aident à comprendre l'utilisation du site
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cookiePreferences.analytics}
                                            onChange={() => handleCookieToggle('analytics')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    Ces cookies nous permettent de compter les visites et les sources de trafic afin d'améliorer
                                    les performances de notre site. Toutes les informations collectées sont anonymisées.
                                </p>
                            </div>

                            {/* Cookies fonctionnels */}
                            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Settings className="h-6 w-6 text-purple-500 mr-3" />
                                        <div>
                                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                Cookies fonctionnels
                                            </h3>
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                Améliorent les fonctionnalités du site
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cookiePreferences.functional}
                                            onChange={() => handleCookieToggle('functional')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    Ces cookies permettent au site de se souvenir des choix que vous faites (comme votre nom
                                    d'utilisateur, langue ou région) et fournissent des fonctionnalités améliorées et plus personnelles.
                                </p>
                            </div>

                            {/* Cookies marketing */}
                            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Cookie className="h-6 w-6 text-orange-500 mr-3" />
                                        <div>
                                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                Cookies marketing
                                            </h3>
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                Utilisés pour la publicité personnalisée
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cookiePreferences.marketing}
                                            onChange={() => handleCookieToggle('marketing')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                    </label>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    Ces cookies peuvent être définis par nos partenaires publicitaires pour créer un profil
                                    de vos intérêts et vous montrer des publicités pertinentes sur d'autres sites.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Gérer vos préférences
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={acceptAll}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-red-700 transition-all"
                            >
                                Accepter tous les cookies
                            </button>
                            <button
                                onClick={rejectAll}
                                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                            >
                                Rejeter tous les cookies
                            </button>
                            <button
                                onClick={savePreferences}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                            >
                                Sauvegarder mes préférences
                            </button>
                        </div>
                    </section>

                    {/* Informations supplémentaires */}
                    <section className="mb-8">
                        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Informations supplémentaires
                        </h2>
                        <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            <p>
                                Vous pouvez modifier vos préférences de cookies à tout moment en revenant sur cette page.
                                Notez que désactiver certains cookies peut affecter le fonctionnement du site.
                            </p>
                            <p>
                                Pour plus d'informations sur notre utilisation des cookies, consultez notre
                                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline ml-1">
                                    politique de confidentialité
                                </a>.
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

export default CookiesPage;
