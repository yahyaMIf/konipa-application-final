import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Truck,
  Shield,
  Award
} from 'lucide-react';
import logoKonipa from '../assets/logo.webp';

const Footer = () => {
  const { user } = useAuth();
  
  return (
    <footer className="bg-gray-900 text-white">
      {/* Section principale */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Informations entreprise */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={logoKonipa} alt="Konipa" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-gradient-konipa">KONIPA</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Votre partenaire de confiance pour les pièces automobiles au Maroc. 
              Plus de 15 ans d'expérience dans la distribution de pièces de qualité.
            </p>
            
            {/* Réseaux sociaux */}
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">+212 522 607 272</p>
                  <p className="text-gray-400 text-sm">Lun-Sam 8h30-19h</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">contact@konipa.com</p>
                  <p className="text-gray-400 text-sm">Support professionnel</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-300">Rue de l'Adjudant Elouakili Med</p>
                  <p className="text-gray-300">Casablanca 20250, Maroc</p>
                  <p className="text-gray-400 text-xs mt-1">GPS: 33.587428, -7.586790</p>
                </div>
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Horaires</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 font-medium">Lundi - Vendredi</p>
                  <p className="text-gray-400 text-sm">08h30 - 12h30 & 14h30 - 19h00</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 font-medium">Samedi</p>
                  <p className="text-gray-400 text-sm">08h30 - 13h00</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 font-medium">Dimanche</p>
                  <p className="text-gray-400 text-sm">Fermé</p>
                </div>
              </div>
            </div>
            
            {/* Support urgence */}
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-300 text-sm font-medium">Urgence 24/7</p>
              <p className="text-red-200 text-sm">+212 661 234 567</p>
            </div>
          </div>

          {/* Liens rapides */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Liens rapides</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link to="/catalog" className="text-gray-300 hover:text-white transition-colors text-sm">
                Catalogue
              </Link>
              {(user?.role === 'client' || user?.role === 'commercial') && (
                <Link to="/orders" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Mes commandes
                </Link>
              )}
              {(user?.role === 'client' || user?.role === 'commercial') && (
                <Link to="/cart" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Mon panier
                </Link>
              )}
              <Link to="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                À propos
              </Link>
              <Link to="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                Nous contacter
              </Link>
              <Link to="/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                FAQ
              </Link>
              <Link to="/help" className="text-gray-300 hover:text-white transition-colors text-sm">
                Aide
              </Link>
              <Link to="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                Conditions générales
              </Link>
              <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section avantages */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Livraison rapide</p>
                <p className="text-gray-400 text-sm">24h-48h au Maroc</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Garantie qualité</p>
                <p className="text-gray-400 text-sm">Pièces certifiées</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">15 ans d'expérience</p>
                <p className="text-gray-400 text-sm">Leader au Maroc</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm">
              © 2024 Konipa. Tous droits réservés. | RC: 333143 | IF: 15274947 | ICE: 000183282000035
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

