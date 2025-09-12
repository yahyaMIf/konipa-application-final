import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Mail,
    ArrowLeft,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import logoKonipa from '../assets/logo.webp';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    // Gestion du mode sombre
    useEffect(() => {
        const savedTheme = localStorage.getItem('konipa-theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Un email de réinitialisation a été envoyé à votre adresse email.');
                setEmail('');
            } else {
                setMessage(data.error || 'Erreur lors de l\'envoi de l\'email de réinitialisation.');
            }
        } catch (err) {
            setMessage('Erreur de connexion. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode
            ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-red-900'
            : 'bg-gradient-to-br from-blue-50 via-white to-red-50'
            } flex items-center justify-center p-4`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } rounded-2xl shadow-2xl p-8 w-full max-w-md border`}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.img
                        src={logoKonipa}
                        alt="Konipa"
                        className="h-16 w-auto mx-auto mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    />
                    <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Mot de passe oublié
                    </h1>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        Entrez votre email pour recevoir un lien de réinitialisation
                    </p>
                </div>

                {/* Formulaire mot de passe oublié */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Email
                        </label>
                        <div className="relative">
                            <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'
                                }`} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    } border`}
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Message de statut */}
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm flex items-center space-x-2 ${message.includes('envoyé')
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                                }`}
                        >
                            {message.includes('envoyé') ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <span>{message}</span>
                        </motion.div>
                    )}

                    {/* Boutons */}
                    <div className="space-y-3">
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Mail className="h-5 w-5" />
                                    <span>Envoyer le lien</span>
                                </>
                            )}
                        </motion.button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${darkMode
                                ? 'text-gray-300 hover:bg-gray-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Retour à la connexion</span>
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className={`mt-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    <p>© 2024 Konipa. Tous droits réservés.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
