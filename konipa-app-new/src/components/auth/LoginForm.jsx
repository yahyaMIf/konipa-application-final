import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const LoginForm = ({ onRegisterClick }) => {
  const navigate = useNavigate();
  const { login, loading } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await login(formData.email, formData.password, formData.rememberMe);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Connexion réussie!' });
        
        // Redirection basée sur le rôle utilisateur
        setTimeout(() => {
          const roleRedirects = {
            admin: '/admin-dashboard',
            CEO: '/ceo',
            accountant: '/comptabilite',
            commercial: '/commercial',
            counter: '/counter',
            POS: '/pos',
            client: '/client'
          };
          
          const redirectPath = roleRedirects[result.user.role] || '/dashboard';
          navigate(redirectPath, { replace: true });
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur de connexion' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="w-full">
      {/* Message d'état */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 transition-all duration-300 ${
          message.type === 'success' 
            ? isDarkMode 
              ? 'bg-green-900/30 text-green-400 border border-green-700/50 shadow-sm' 
              : 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
            : isDarkMode 
              ? 'bg-red-900/30 text-red-400 border border-red-700/50 shadow-sm' 
              : 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 transition-colors ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.email 
                      ? isDarkMode
                        ? 'border-red-500 bg-red-900/20 focus:ring-red-500 text-red-400 placeholder-red-500/50'
                        : 'border-red-300 bg-red-50 focus:ring-red-500 text-gray-900 placeholder-gray-400'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-700/50 hover:border-blue-500 focus:bg-gray-700 focus:ring-blue-500 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white hover:border-gray-400 focus:bg-blue-50/30 focus:ring-blue-500 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className={`block text-sm font-semibold mb-2 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-14 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.password 
                      ? isDarkMode
                        ? 'border-red-500 bg-red-900/20 focus:ring-red-500 text-red-400 placeholder-red-500/50'
                        : 'border-red-300 bg-red-50 focus:ring-red-500 text-gray-900 placeholder-gray-400'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-700/50 hover:border-blue-500 focus:bg-gray-700 focus:ring-blue-500 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white hover:border-gray-400 focus:bg-blue-50/30 focus:ring-blue-500 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-200 rounded-r-xl ${
                    isDarkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className={`h-5 w-5 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`} />
                  ) : (
                    <Eye className={`h-5 w-5 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className={`h-4 w-4 rounded transition-colors ${
                    isDarkMode 
                      ? 'text-blue-500 focus:ring-blue-500 border-gray-600 bg-gray-700'
                      : 'text-blue-600 focus:ring-blue-500 border-gray-300 bg-white'
                  }`}
                />
                <label htmlFor="rememberMe" className={`ml-2 block text-sm transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Se souvenir de moi
                </label>
              </div>
              <button
                type="button"
                className={`text-sm font-medium transition-all duration-200 hover:underline ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                onClick={() => {
                  window.location.href = '/forgot-password';
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 focus:ring-red-500 shadow-red-500/25'
              : 'bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 focus:ring-blue-500 shadow-blue-500/25'
          }`}
        >
          {isSubmitting || loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              <span>Connexion en cours...</span>
            </div>
          ) : (
            <span>Se connecter</span>
          )}
        </button>
      </form>

      {/* Register Link */}
      {onRegisterClick && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <button
              type="button"
              onClick={onRegisterClick}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Créer un compte
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;