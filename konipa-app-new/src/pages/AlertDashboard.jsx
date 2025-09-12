import React from 'react';
import RoleBasedNavigation from '../components/auth/RoleBasedNavigation';
import RealTimeAlertDashboard from '../components/alerts/RealTimeAlertDashboard';

const AlertDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RoleBasedNavigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Centre d'Alertes en Temps Réel
          </h1>
          <p className="mt-2 text-gray-600">
            Surveillez et gérez toutes les alertes système en temps réel
          </p>
        </div>
        
        <RealTimeAlertDashboard />
      </div>
    </div>
  );
};

export default AlertDashboard;