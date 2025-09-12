import React from 'react';
import AccountingManager from '../components/AccountingManager';

const ComptabiliteDashboard = () => {

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Comptabilité</h1>
          <p className="text-muted-foreground mt-2">Gérez vos finances et suivez vos performances</p>
        </div>
        
        {/* Composant AccountingManager */}
        <AccountingManager />
      </div>
    </div>
  );
};

export default ComptabiliteDashboard;
