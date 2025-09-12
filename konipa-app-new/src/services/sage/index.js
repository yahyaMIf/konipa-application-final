// Sage Services Index
// Point d'entrée principal pour tous les services Sage

// Export du factory principal
export { default as SageApiFactory, sageApiService } from './SageApiFactory';

// Export du service réel
export { default as RealSageApiService } from './RealSageApiService';

// Export de l'instance par défaut pour faciliter l'utilisation
export { sageApiService as default } from './SageApiFactory';