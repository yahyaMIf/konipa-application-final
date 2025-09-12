import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Eye,
    EyeOff,
    Lock,
    CheckCircle,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import logoKonipa from '../assets/logo.webp';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const { token } = useParams();
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
        setError('');

        // Validation des mots de passe
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.error || 'Erreur lors de la réinitialisation du mot de passe');
            }
        } catch (err) {
            setError('Erreur de connexion. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
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
                        } rounded-2xl shadow-2xl p-8 w-full max-w-md border text-center`}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="mb-6"
                    >
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Mot de passe réinitialisé !
                        </h1>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                            Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

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
                        Nouveau mot de passe
                    </h1>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        Entrez votre nouveau mot de passe
                    </p>
                </div>

                {/* Formulaire de réinitialisation */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nouveau mot de passe */}
                    <div>
                        <label htmlFor="password" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Nouveau mot de passe
                        </label>
                        <div className="relative">
                            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'
                                }`} />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-10 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    } border`}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmation du mot de passe */}
                    <div>
                        <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Confirmer le mot de passe
                        </label>
                        <div className="relative">
                            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'
                                }`} />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full pl-10 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    } border`}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Message d'erreur */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
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
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Réinitialiser le mot de passe</span>
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
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
