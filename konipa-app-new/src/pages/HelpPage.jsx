import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Search,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Book,
  Video,
  FileText,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqCategories = [
    {
      title: "Commandes et Livraisons",
      icon: <FileText className="w-5 h-5" />,
      questions: [
        {
          question: "Comment passer une commande ?",
          answer: "Pour passer une commande, vous devez être un client accepté par notre équipe. Connectez-vous à votre compte, parcourez notre catalogue, ajoutez les pièces souhaitées à votre panier et suivez le processus de commande. Vous recevrez une confirmation par email."
        },
        {
          question: "Quels sont les délais de livraison ?",
          answer: "Les délais de livraison varient selon votre localisation : 24-48h pour Casablanca, 2-3 jours pour les autres villes du Maroc. Pour les pièces sur commande, comptez 5-7 jours ouvrables."
        },
        {
          question: "Comment suivre ma commande ?",
          answer: "Vous pouvez suivre votre commande en temps réel depuis votre espace client dans la section 'Mes commandes'. Vous recevrez également des notifications par email à chaque étape."
        }
      ]
    },
    {
      title: "Paiement et Facturation",
      icon: <CheckCircle className="w-5 h-5" />,
      questions: [
        {
          question: "Quels modes de paiement acceptez-vous ?",
          answer: "Nous acceptons uniquement les paiements par chèque et en espèces (cash). Aucun paiement à la livraison n'est proposé."
        },
        {
          question: "Comment obtenir une facture ?",
          answer: "Votre facture est automatiquement générée et envoyée par email après confirmation de votre commande. Vous pouvez également la télécharger depuis votre espace client."
        },
        {
          question: "Puis-je modifier ma commande après validation ?",
          answer: "Les modifications sont possibles dans les 2 heures suivant la validation, sous réserve que la commande ne soit pas encore en préparation. Contactez-nous rapidement."
        }
      ]
    },
    {
      title: "Produits et Services",
      icon: <Book className="w-5 h-5" />,
      questions: [
        {
          question: "Comment identifier la bonne pièce pour mon véhicule ?",
          answer: "Utilisez notre outil de recherche par immatriculation ou modèle de véhicule. En cas de doute, contactez nos experts qui vous aideront à identifier la pièce exacte."
        },
        {
          question: "Proposez-vous des pièces d'occasion ?",
          answer: "Nous nous spécialisons dans les pièces neuves et reconditionnées de qualité. Toutes nos pièces sont testées et certifiées avant mise en vente."
        },
        {
          question: "Qui peut commander chez Konipa ?",
          answer: "Nous travaillons exclusivement avec des clients acceptés et validés par notre équipe. Pour devenir client, veuillez nous contacter pour une évaluation de votre dossier."
        }
      ]
    },
    {
      title: "Compte Client",
      icon: <Users className="w-5 h-5" />,
      questions: [
        {
          question: "Comment devenir client chez Konipa ?",
          answer: "Pour devenir client, vous devez être accepté par notre équipe. Contactez-nous avec vos documents d'entreprise pour une évaluation de votre dossier. Seuls les clients validés peuvent accéder à nos services."
        },
        {
          question: "J'ai oublié mon mot de passe, que faire ?",
          answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe."
        },
        {
          question: "Comment modifier mes informations personnelles ?",
          answer: "Connectez-vous à votre espace client et accédez à la section 'Mon profil' pour modifier vos informations personnelles et adresses de livraison."
        }
      ]
    }
  ];

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Téléphone",
      description: "Appelez-nous directement",
      contact: "+212 522 607 272",
      hours: "Lun-Sam 8h30-19h",
      color: "bg-blue-500"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      description: "Envoyez-nous un message",
      contact: "contact@konipa.com",
      hours: "Réponse sous 24h",
      color: "bg-green-500"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Chat en ligne",
      description: "Assistance immédiate",
      contact: "Démarrer le chat",
      hours: "Lun-Ven 9h-18h",
      color: "bg-purple-500"
    }
  ];

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <HelpCircle className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Centre d'aide</h1>
            <p className="text-xl text-blue-100 mb-8">
              Trouvez rapidement les réponses à vos questions
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans l'aide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
              
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Aucun résultat trouvé pour votre recherche.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredFaqs.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-600">{category.icon}</div>
                          <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {category.questions.map((faq, faqIndex) => {
                          const faqId = `${categoryIndex}-${faqIndex}`;
                          const isExpanded = expandedFaq === faqId;
                          
                          return (
                            <div key={faqIndex} className="p-6">
                              <button
                                onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                                className="w-full text-left flex items-center justify-between group"
                              >
                                <span className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {faq.question}
                                </span>
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                )}
                              </button>
                              
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 text-gray-600 leading-relaxed"
                                >
                                  {faq.answer}
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Contact Section */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Besoin d'aide supplémentaire ?</h3>
              
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className={`${method.color} p-3 rounded-lg text-white`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{method.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{method.description}</p>
                      <p className="text-sm font-medium text-blue-600">{method.contact}</p>
                      <p className="text-xs text-gray-500">{method.hours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Useful Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6 mt-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Liens utiles</h3>
              
              <div className="space-y-3">
                <a href="/catalog" className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-colors">
                  <Book className="w-4 h-4" />
                  <span>Catalogue produits</span>
                </a>
                <a href="/orders" className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-colors">
                  <FileText className="w-4 h-4" />
                  <span>Mes commandes</span>
                </a>
                <a href="/contact" className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>Nous contacter</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;