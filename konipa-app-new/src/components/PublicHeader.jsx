import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Menu, X, HelpCircle, FileText, Shield } from 'lucide-react';
import logoKonipa from '../assets/logo.webp';

const PublicHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigationItems = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home className="h-4 w-4" />,
      showIcon: true
    },
    {
      to: "/help",
      label: "Aide",
      icon: <HelpCircle className="h-4 w-4" />,
      showIcon: false
    },
    {
      to: "/terms",
      label: "Conditions générales",
      icon: <FileText className="h-4 w-4" />,
      showIcon: false
    },
    {
      to: "/privacy",
      label: "Politique de confidentialité",
      icon: <Shield className="h-4 w-4" />,
      showIcon: false
    }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et nom */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img src={logoKonipa} alt="Konipa" className="h-8 w-auto" />
            <span className="text-xl font-bold text-gradient-konipa hidden sm:block">
              KONIPA
            </span>
          </Link>
          
          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                {item.showIcon && item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bouton menu mobile */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link 
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors font-medium"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;