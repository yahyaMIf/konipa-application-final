import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Eye,
  Lock,
  Database,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  Clock,
  Globe
} from 'lucide-react';

const PrivacyPage = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      icon: <Eye className="w-5 h-5" />,
      content: {
        intro: "Chez Konipa, nous nous engageons à protéger votre vie privée et vos données personnelles. Cette politique explique comment nous collectons, utilisons et protégeons vos informations.",
        points: [
          "Nous collectons uniquement les données nécessaires à nos services",
          "Vos données ne sont jamais vendues à des tiers",
          "Vous gardez le contrôle total sur vos informations",
          "Nous respectons le RGPD et la législation marocaine sur la protection des données"
        ]
      }
    },
    {
      id: 'collection',
      title: 'Collecte des Données',
      icon: <Database className="w-5 h-5" />,
      content: {
        intro: "Nous collectons différents types de données pour vous fournir nos services de manière optimale.",
        categories: [
          {
            title: "Données d'identification",
            items: ["Nom et prénom", "Adresse email", "Numéro de téléphone", "Adresse postale"]
          },
          {
            title: "Données de commande",
            items: ["Historique des achats", "Préférences produits", "Adresses de livraison", "Moyens de paiement"]
          },
          {
            title: "Données techniques",
            items: ["Adresse IP", "Type de navigateur", "Données de navigation", "Cookies"]
          },
          {
            title: "Données professionnelles",
            items: ["Raison sociale", "SIRET/RC", "Secteur d'activité", "Volume d'achats"]
          }
        ]
      }
    },
    {
      id: 'usage',
      title: 'Utilisation des Données',
      icon: <Settings className="w-5 h-5" />,
      content: {
        intro: "Vos données sont utilisées exclusivement pour améliorer votre expérience et nos services.",
        purposes: [
          {
            title: "Gestion des commandes",
            description: "Traitement, préparation et livraison de vos commandes"
          },
          {
            title: "Service client",
            description: "Support technique, SAV et réponse à vos questions"
          },
          {
            title: "Amélioration des services",
            description: "Analyse des tendances et optimisation de notre catalogue"
          },
          {
            title: "Communication",
            description: "Envoi d'informations sur vos commandes et nos nouveautés (avec votre accord)"
          },
          {
            title: "Sécurité",
            description: "Prévention de la fraude et protection de nos systèmes"
          }
        ]
      }
    },
    {
      id: 'sharing',
      title: 'Partage des Données',
      icon: <Users className="w-5 h-5" />,
      content: {
        intro: "Nous ne vendons jamais vos données. Le partage est limité aux cas suivants :",
        cases: [
          {
            title: "Partenaires de livraison",
            description: "Nom, adresse et téléphone pour la livraison de vos commandes",
            icon: <CheckCircle className="w-4 h-4 text-green-500" />
          },
          {
            title: "Prestataires de paiement",
            description: "Données nécessaires au traitement sécurisé des paiements",
            icon: <CheckCircle className="w-4 h-4 text-green-500" />
          },
          {
            title: "Obligations légales",
            description: "Transmission aux autorités compétentes si requis par la loi",
            icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />
          },
          {
            title: "Prestataires techniques",
            description: "Hébergement et maintenance de nos systèmes (sous contrat strict)",
            icon: <CheckCircle className="w-4 h-4 text-green-500" />
          }
        ]
      }
    },
    {
      id: 'security',
      title: 'Sécurité',
      icon: <Lock className="w-5 h-5" />,
      content: {
        intro: "Nous mettons en place des mesures de sécurité robustes pour protéger vos données.",
        measures: [
          {
            title: "Chiffrement SSL/TLS",
            description: "Toutes les communications sont chiffrées avec un certificat SSL 256 bits"
          },
          {
            title: "Accès restreint",
            description: "Seuls les employés autorisés ont accès aux données, selon le principe du moindre privilège"
          },
          {
            title: "Surveillance continue",
            description: "Monitoring 24/7 de nos systèmes pour détecter toute intrusion"
          },
          {
            title: "Sauvegardes sécurisées",
            description: "Sauvegardes régulières et chiffrées de toutes les données"
          },
          {
            title: "Mise à jour régulière",
            description: "Tous nos systèmes sont régulièrement mis à jour avec les derniers correctifs de sécurité"
          }
        ]
      }
    },

    {
      id: 'retention',
      title: 'Conservation',
      icon: <Clock className="w-5 h-5" />,
      content: {
        intro: "Nous conservons vos données uniquement le temps nécessaire aux finalités pour lesquelles elles ont été collectées.",
        periods: [
          {
            type: "Données de compte",
            duration: "Pendant toute la durée de votre compte + 3 ans après fermeture"
          },
          {
            type: "Données de commande",
            duration: "10 ans pour les obligations comptables et fiscales"
          },
          {
            type: "Données de navigation",
            duration: "13 mois maximum (cookies)"
          },
          {
            type: "Données de prospection",
            duration: "3 ans après le dernier contact"
          },
          {
            type: "Données de SAV",
            duration: "Durée de la garantie + 5 ans"
          }
        ]
      }
    }
  ];

  const navigationItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <Eye className="w-4 h-4" /> },
    { id: 'collection', label: 'Collecte', icon: <Database className="w-4 h-4" /> },
    { id: 'usage', label: 'Utilisation', icon: <Settings className="w-4 h-4" /> },
    { id: 'sharing', label: 'Partage', icon: <Users className="w-4 h-4" /> },
    { id: 'security', label: 'Sécurité', icon: <Lock className="w-4 h-4" /> },
    { id: 'retention', label: 'Conservation', icon: <Clock className="w-4 h-4" /> }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
            <p className="text-xl text-blue-100 mb-4">
              Votre vie privée est notre priorité
            </p>
            <p className="text-sm text-blue-200">
              Dernière mise à jour : 1er janvier 2024
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections</h3>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">{currentSection.icon}</div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentSection.title}</h2>
                </div>
              </div>

              <div className="p-6">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <div className="space-y-6">
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {currentSection.content.intro}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSection.content.points.map((point, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collection Section */}
                {activeSection === 'collection' && (
                  <div className="space-y-6">
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {currentSection.content.intro}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentSection.content.categories.map((category, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">{category.title}</h4>
                          <ul className="space-y-2">
                            {category.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-600 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usage Section */}
                {activeSection === 'usage' && (
                  <div className="space-y-6">
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {currentSection.content.intro}
                    </p>
                    <div className="space-y-4">
                      {currentSection.content.purposes.map((purpose, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <h4 className="font-semibold text-gray-900 mb-2">{purpose.title}</h4>
                          <p className="text-gray-600">{purpose.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sharing Section */}
                {activeSection === 'sharing' && (
                  <div className="space-y-6">
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {currentSection.content.intro}
                    </p>
                    <div className="space-y-4">
                      {currentSection.content.cases.map((case_, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            {case_.icon}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2">{case_.title}</h4>
                              <p className="text-gray-600">{case_.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Section */}
                {activeSection === 'security' && (
                  <div className="space-y-6">
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {currentSection.content.intro}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSection.content.measures.map((measure, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            {measure.title}
                          </h4>
                          <p className="text-gray-600 text-sm">{measure.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retention Section */}
                {activeSection === 'retention' && (
                  <div className="space-y-6">
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {currentSection.content.intro}
                    </p>
                    <div className="space-y-4">
                      {currentSection.content.periods.map((period, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{period.type}</h4>
                            <span className="text-blue-600 font-medium">{period.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-50 rounded-xl p-8 mt-8"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Questions sur la confidentialité ?</h3>
              <p className="text-gray-600 mb-6">
                Notre délégué à la protection des données est à votre disposition pour répondre à toutes vos questions.
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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;