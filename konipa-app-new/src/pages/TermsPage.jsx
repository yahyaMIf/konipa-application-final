import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone
} from 'lucide-react';

const TermsPage = () => {
  const sections = [
    {
      id: 'definitions',
      title: '1. Définitions',
      icon: <FileText className="w-5 h-5" />,
      content: [
        "Konipa : La société Konipa, spécialisée dans la distribution de pièces automobiles, dont le siège social est situé Rue de l'Adjudant Elouakili Med, Casablanca 20250, Maroc.",
        "Client : Toute personne physique ou morale qui passe commande sur le site web ou en magasin.",
        "Produits : Les pièces automobiles, accessoires et services proposés par Konipa.",
        "Site : Le site web accessible à l'adresse www.konipa.com et l'application mobile associée."
      ]
    },
    {
      id: 'scope',
      title: '2. Champ d\'application',
      icon: <Shield className="w-5 h-5" />,
      content: [
        "Les présentes conditions générales s'appliquent à toutes les commandes passées sur notre site web, notre application mobile ou en magasin.",
        "Elles régissent les relations contractuelles entre Konipa et ses clients.",
        "Toute commande implique l'acceptation sans réserve des présentes conditions générales.",
        "Konipa se réserve le droit de modifier ces conditions à tout moment, les modifications prenant effet dès leur publication."
      ]
    },
    {
      id: 'orders',
      title: '3. Commandes et Prix',
      icon: <CheckCircle className="w-5 h-5" />,
      content: [
        "Konipa travaille exclusivement avec des clients acceptés et validés par notre équipe.",
        "Les prix sont indiqués en dirhams marocains (MAD) toutes taxes comprises.",
        "Les prix peuvent être modifiés à tout moment mais seront confirmés au moment de la validation de la commande.",
        "La commande n'est définitive qu'après confirmation de paiement et validation par nos services.",
        "Konipa se réserve le droit d'annuler toute commande en cas d'indisponibilité du produit ou d'erreur manifeste de prix.",
        "Seuls les clients disposant d'un compte validé par notre équipe peuvent passer commande."
      ]
    },
    {
      id: 'payment',
      title: '4. Modalités de Paiement',
      icon: <CheckCircle className="w-5 h-5" />,
      content: [
        "Konipa accepte uniquement les paiements par chèque et espèces.",
        "Le paiement contre-remboursement n'est pas accepté.",
        "Les chèques doivent être établis à l'ordre de 'Konipa' et remis lors de la commande ou de la livraison.",
        "Le paiement en espèces doit être effectué intégralement lors de la remise de la commande.",
        "Toute commande non payée dans les délais impartis sera automatiquement annulée."
      ]
    },
    {
      id: 'delivery',
      title: '5. Livraison',
      icon: <Clock className="w-5 h-5" />,
      content: [
        "Délais de livraison : 24-48h pour Casablanca, 2-3 jours pour les autres villes du Maroc.",
        "Les délais sont donnés à titre indicatif et peuvent varier selon la disponibilité des produits.",
        "La livraison est effectuée à l'adresse indiquée par le client lors de la commande.",
        "Le client doit vérifier l'état du colis à la réception et signaler tout dommage immédiatement.",
        "Les frais de livraison sont calculés selon la zone géographique et le poids du colis."
      ]
    },

    {
      id: 'liability',
      title: '6. Responsabilité',
      icon: <AlertTriangle className="w-5 h-5" />,
      content: [
        "Konipa ne peut être tenue responsable des dommages indirects ou immatériels.",
        "La responsabilité de Konipa est limitée au montant de la commande concernée.",
        "Le client est responsable de la compatibilité des pièces avec son véhicule.",
        "Konipa recommande fortement de faire installer les pièces par un professionnel qualifié.",
        "En cas de doute sur la compatibilité, le client doit contacter nos services avant commande."
      ]
    },
    {
      id: 'data',
      title: '7. Protection des Données',
      icon: <Shield className="w-5 h-5" />,
      content: [
        "Les données personnelles sont collectées et traitées conformément à notre politique de confidentialité.",
        "Les données sont utilisées uniquement pour le traitement des commandes et l'amélioration de nos services.",
        "Le client dispose d'un droit d'accès, de rectification et de suppression de ses données.",
        "Les données ne sont jamais vendues ou transmises à des tiers sans consentement.",
        "Les données sont stockées de manière sécurisée et supprimées après la durée légale de conservation."
      ]
    },
    {
      id: 'law',
      title: '8. Droit Applicable',
      icon: <FileText className="w-5 h-5" />,
      content: [
        "Les présentes conditions générales sont régies par le droit marocain.",
        "Tout litige sera soumis aux tribunaux compétents de Casablanca.",
        "En cas de traduction des présentes conditions, seule la version française fait foi.",
        "Si une clause s'avérait nulle, les autres clauses resteraient applicables.",
        "Les présentes conditions annulent et remplacent toutes conditions antérieures."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <FileText className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Conditions Générales de Vente</h1>
            <p className="text-xl text-gray-300 mb-4">
              Conditions applicables à tous les achats effectués chez Konipa
            </p>
            <p className="text-sm text-gray-400">
              Dernière mise à jour : 1er janvier 2024
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Préambule</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les présentes conditions générales de vente (CGV) régissent les relations contractuelles 
              entre la société Konipa et ses clients dans le cadre de la vente de pièces automobiles 
              et services associés.
            </p>
            <p className="text-gray-600 leading-relaxed">
              En passant commande, le client reconnaît avoir pris connaissance des présentes conditions 
              générales et les accepter sans réserve.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600">{section.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-gray-600 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-blue-50 rounded-xl p-8 mt-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact</h3>
            <p className="text-gray-600 mb-4">
              Pour toute question concernant ces conditions générales, vous pouvez nous contacter :
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 text-white p-2 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">contact@konipa.com</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 text-white p-2 rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Téléphone</p>
                  <p className="text-gray-600">+212 522 607 272</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">
                <strong>Adresse :</strong> Rue de l'Adjudant Elouakili Med, Casablanca 20250, Maroc<br />
                <strong>RC :</strong> 123456 | <strong>IF :</strong> 7890123 | <strong>ICE :</strong> 001234567890123
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;