import { realTimeAlertService } from '../RealTimeAlertService';
import { syncService } from '../syncService';
import { statusVerificationService } from '../statusVerificationService';
import apiService from '../apiService';

/**
 * Démarre tous les services temps réel
 * @param {Object} userData - Données utilisateur
 * @param {Function} handleStatusChange - Callback pour les changements de statut
 */
export function startAll(userData, handleStatusChange) {
  const isAuthenticated = apiService.isAuthenticated();
  if (!isAuthenticated) {
    // Utilisateur non authentifié - services temps réel non démarrés
    return;
  }

  try {
    // Démarrer le service de synchronisation
    if (syncService && typeof syncService.start === 'function') {
      syncService.start(userData);
      }

    // Démarrer le service de vérification de statut
    if (statusVerificationService && typeof statusVerificationService.start === 'function') {
      statusVerificationService.start(userData, handleStatusChange);
      }

    // Démarrer le service d'alertes temps réel
    if (realTimeAlertService && typeof realTimeAlertService.start === 'function') {
      realTimeAlertService.start();
      }

    } catch (error) {
    }
}

/**
 * Arrête tous les services temps réel
 */
export function stopAll() {
  try {
    // Arrêter le service de synchronisation
    if (syncService && typeof syncService.stop === 'function') {
      syncService.stop();
      }

    // Arrêter le service de vérification de statut
    if (statusVerificationService && typeof statusVerificationService.stop === 'function') {
      statusVerificationService.stop();
      }

    // Arrêter le service d'alertes temps réel
    if (realTimeAlertService && typeof realTimeAlertService.stop === 'function') {
      realTimeAlertService.stop();
      }

    } catch (error) {
    }
}

/**
 * Redémarre tous les services temps réel
 * @param {Object} userData - Données utilisateur
 * @param {Function} handleStatusChange - Callback pour les changements de statut
 */
export function restartAll(userData, handleStatusChange) {
  stopAll();
  
  // Petit délai pour s'assurer que les services sont bien arrêtés
  setTimeout(() => {
    startAll(userData, handleStatusChange);
  }, 100);
}

/**
 * Redémarre uniquement le service de synchronisation
 * @param {Object} userData - Données utilisateur
 */
export function restartSync(userData) {
  try {
    if (syncService && typeof syncService.stop === 'function') {
      syncService.stop();
    }
    if (syncService && typeof syncService.start === 'function') {
      syncService.start(userData);
    }
    } catch (error) {
    }
}

export default {
  startAll,
  stopAll,
  restartAll,
  restartSync
};