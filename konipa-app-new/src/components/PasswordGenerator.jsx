import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Settings,
  Shield,
  Zap,
  Lock
} from 'lucide-react';
import { generatePassword, evaluatePasswordStrength } from '../utils/passwordGenerator';

const PasswordGenerator = ({ onPasswordGenerated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    excludeAmbiguous: true
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const presets = [
    {
      name: 'Sécurisé',
      icon: Shield,
      config: { length: 16, includeUppercase: true, includeLowercase: true, includeNumbers: true, includeSymbols: true }
    },
    {
      name: 'Ultra Sécurisé',
      icon: Lock,
      config: { length: 24, includeUppercase: true, includeLowercase: true, includeNumbers: true, includeSymbols: true }
    },
    {
      name: 'Simple',
      icon: Zap,
      config: { length: 12, includeUppercase: true, includeLowercase: true, includeNumbers: true, includeSymbols: false }
    }
  ];

  const generateNewPassword = (customSettings = null) => {
    const config = customSettings || settings;
    const newPassword = generatePassword(config);
    setPassword(newPassword);
    return newPassword;
  };

  const handlePresetClick = (preset) => {
    setSettings(preset.config);
    generateNewPassword(preset.config);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      }
  };

  const handleUsePassword = () => {
    if (onPasswordGenerated && password) {
      onPasswordGenerated(password);
    }
  };

  const getStrengthInfo = () => {
    if (!password) return { score: 0, label: 'Aucun', color: 'text-gray-400' };
    const evaluation = evaluatePasswordStrength(password);
    return {
      score: evaluation.score,
      label: evaluation.label,
      color: evaluation.score >= 4 ? 'text-green-600' : 
             evaluation.score >= 3 ? 'text-yellow-600' : 'text-red-600'
    };
  };

  const strengthInfo = getStrengthInfo();

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Générateur de Mot de Passe
        </h3>
        <p className="text-gray-600 text-sm">
          Créez des mots de passe sécurisés et uniques
        </p>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-3">
        {presets.map((preset, index) => {
          const Icon = preset.icon;
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePresetClick(preset)}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Icon className="h-5 w-5 text-blue-600 mb-1" />
              <span className="text-xs font-medium text-gray-700">{preset.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Password Display */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            readOnly
            className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cliquez sur Générer pour créer un mot de passe"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {password && (
              <button
                onClick={copyToClipboard}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copier"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Strength Indicator */}
        {password && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Force:</span>
              <span className={`text-sm font-medium ${strengthInfo.color}`}>
                {strengthInfo.label}
              </span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-2 w-4 rounded-full ${
                    level <= strengthInfo.score
                      ? strengthInfo.score >= 4
                        ? 'bg-green-500'
                        : strengthInfo.score >= 3
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>{showAdvanced ? 'Masquer' : 'Afficher'} les options avancées</span>
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longueur: {settings.length}
              </label>
              <input
                type="range"
                min="8"
                max="64"
                value={settings.length}
                onChange={(e) => setSettings({ ...settings, length: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.includeUppercase}
                  onChange={(e) => setSettings({ ...settings, includeUppercase: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Majuscules (A-Z)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.includeLowercase}
                  onChange={(e) => setSettings({ ...settings, includeLowercase: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Minuscules (a-z)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.includeNumbers}
                  onChange={(e) => setSettings({ ...settings, includeNumbers: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Chiffres (0-9)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.includeSymbols}
                  onChange={(e) => setSettings({ ...settings, includeSymbols: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Symboles (!@#$)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.excludeSimilar}
                  onChange={(e) => setSettings({ ...settings, excludeSimilar: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Exclure similaires</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.excludeAmbiguous}
                  onChange={(e) => setSettings({ ...settings, excludeAmbiguous: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Exclure ambigus</span>
              </label>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => generateNewPassword()}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Générer</span>
        </motion.button>

        {onPasswordGenerated && password && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUsePassword}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check className="h-4 w-4" />
            <span>Utiliser</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default PasswordGenerator;