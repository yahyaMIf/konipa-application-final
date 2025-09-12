import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Target,
  Award,
  Truck,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building,
  Heart
} from 'lucide-react';

const AboutPage = () => {
  const stats = [
    {
      icon: <Users className="w-8 h-8" />,
      number: "500+",
      label: "Clients satisfaits",
      color: "bg-blue-500"
    },
    {
      icon: <Award className="w-8 h-8" />,
      number: "15+",
      label: "Années d'expérience",
      color: "bg-green-500"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      number: "10000+",
      label: "Pièces en stock",
      color: "bg-red-500"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      number: "24h",
      label: "Livraison rapide",
      color: "bg-purple-500"
    }
  ];

  const values = [
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Qualité garantie",
      description: "Nous sélectionnons rigoureusement nos fournisseurs pour vous offrir des pièces automobiles de la plus haute qualité.",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: <Clock className="w-12 h-12" />,
      title: "Service rapide",
      description: "Livraison express en 24-48h sur Casablanca et dans tout le Maroc. Votre satisfaction est notre priorité.",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Expertise technique",
      description: "Notre équipe d'experts vous conseille et vous accompagne dans le choix des pièces adaptées à votre véhicule.",
      color: "bg-red-50 text-red-600"
    },
    {
      icon: <Heart className="w-12 h-12" />,
      title: "Relation client",
      description: "Nous construisons des relations durables avec nos clients basées sur la confiance et la transparence.",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  const timeline = [
    {
      year: "2008",
      title: "Création de Konipa",
      description: "Fondation de l'entreprise avec une vision claire : démocratiser l'accès aux pièces automobiles de qualité."
    },
    {
      year: "2012",
      title: "Expansion nationale",
      description: "Extension de nos services à l'ensemble du territoire marocain avec un réseau de partenaires logistiques."
    },
    {
      year: "2018",
      title: "Digitalisation",
      description: "Lancement de notre plateforme en ligne pour faciliter les commandes et améliorer l'expérience client."
    },
    {
      year: "2023",
      title: "Innovation continue",
      description: "Intégration de nouvelles technologies pour optimiser notre service et rester à la pointe du secteur."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              À propos de <span className="text-yellow-300">Konipa</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Votre partenaire de confiance pour les pièces automobiles au Maroc depuis plus de 15 ans
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`${stat.color} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Notre Mission
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Chez Konipa, nous nous engageons à fournir des pièces automobiles de qualité supérieure 
                à des prix compétitifs, tout en offrant un service client exceptionnel. Notre objectif 
                est de devenir le partenaire privilégié des professionnels et particuliers pour tous 
                leurs besoins en pièces automobiles.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Nous croyons que chaque client mérite un service personnalisé et des conseils d'experts 
                pour maintenir ses véhicules en parfait état de fonctionnement.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <Target className="w-16 h-16 text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Notre Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                Être le leader incontesté du marché des pièces automobiles au Maroc, 
                reconnu pour notre excellence, notre innovation et notre engagement 
                envers la satisfaction client.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Valeurs</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident notre action quotidienne et notre relation avec nos clients
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className={`${value.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Histoire</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un parcours de croissance et d'innovation au service de l'automobile marocaine
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
            
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                }`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{item.year}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nous Contacter</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 bg-gray-50 rounded-xl"
            >
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Adresse</h3>
              <p className="text-gray-600">Casablanca, Maroc</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 bg-gray-50 rounded-xl"
            >
              <Phone className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600">+212 522 607 272</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-6 bg-gray-50 rounded-xl"
            >
              <Mail className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">contact@konipa.com</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;