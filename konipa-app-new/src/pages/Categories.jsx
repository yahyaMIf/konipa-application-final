import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid,
  List,
  Search,
  Filter,
  ArrowRight,
  Package,
  Wrench,
  Zap,
  Gauge,
  Car,
  Settings,
  Shield,
  Fuel,
  Wind,
  Battery,
  Lightbulb,
  Disc
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Les données sont maintenant chargées via l'API
  const categories = [
    {
      id: 'freinage',
      name: 'Freinage',
      description: 'Disques, plaquettes, étriers et systèmes de freinage complets',
      icon: Disc,
      color: 'from-red-500 to-red-600',
      productCount: 245,
      subcategories: ['Disques de frein', 'Plaquettes', 'Étriers', 'Liquide de frein', 'Flexibles'],
      image: null,
      popularBrands: ['Brembo', 'Bosch', 'TRW', 'ATE'],
      priceRange: '25 - 800 DH'
    },
    {
      id: 'moteur',
      name: 'Moteur',
      description: 'Pièces moteur, filtres, joints et composants de performance',
      icon: Settings,
      color: 'from-blue-500 to-blue-600',
      productCount: 892,
      subcategories: ['Filtres', 'Joints', 'Pistons', 'Soupapes', 'Culasses'],
      image: null,
      popularBrands: ['Mann', 'Mahle', 'Febi', 'Gates'],
      priceRange: '15 - 2500 DH'
    },
    {
      id: 'suspension',
      name: 'Suspension',
      description: 'Amortisseurs, ressorts, silent-blocs et composants de suspension',
      icon: Gauge,
      color: 'from-green-500 to-green-600',
      productCount: 356,
      subcategories: ['Amortisseurs', 'Ressorts', 'Silent-blocs', 'Rotules', 'Barres stabilisatrices'],
      image: null,
      popularBrands: ['KYB', 'Monroe', 'Sachs', 'Bilstein'],
      priceRange: '45 - 1200 DH'
    },
    {
      id: 'transmission',
      name: 'Transmission',
      description: 'Embrayage, boîtes de vitesses et composants de transmission',
      icon: Wrench,
      color: 'from-purple-500 to-purple-600',
      productCount: 178,
      subcategories: ['Embrayage', 'Cardans', 'Différentiels', 'Boîtes de vitesses'],
      image: null,
      popularBrands: ['Valeo', 'LuK', 'Sachs', 'SKF'],
      priceRange: '80 - 1800 DH'
    },
    {
      id: 'electrique',
      name: 'Électrique',
      description: 'Batteries, alternateurs, démarreurs et composants électriques',
      icon: Zap,
      color: 'from-yellow-500 to-yellow-600',
      productCount: 423,
      subcategories: ['Batteries', 'Alternateurs', 'Démarreurs', 'Bougies', 'Bobines'],
      image: null,
      popularBrands: ['Varta', 'Bosch', 'NGK', 'Denso'],
      priceRange: '20 - 950 DH'
    },
    {
      id: 'eclairage',
      name: 'Éclairage',
      description: 'Phares, feux, ampoules et systèmes d\'éclairage',
      icon: Lightbulb,
      color: 'from-orange-500 to-orange-600',
      productCount: 267,
      subcategories: ['Phares', 'Feux arrière', 'Ampoules', 'LED', 'Clignotants'],
      image: null,
      popularBrands: ['Osram', 'Philips', 'Hella', 'Valeo'],
      priceRange: '10 - 650 DH'
    },
    {
      id: 'refroidissement',
      name: 'Refroidissement',
      description: 'Radiateurs, ventilateurs, thermostats et système de refroidissement',
      icon: Wind,
      color: 'from-cyan-500 to-cyan-600',
      productCount: 189,
      subcategories: ['Radiateurs', 'Ventilateurs', 'Thermostats', 'Pompes à eau', 'Durites'],
      image: null,
      popularBrands: ['Nissens', 'Valeo', 'Gates', 'Febi'],
      priceRange: '35 - 850 DH'
    },
    {
      id: 'carrosserie',
      name: 'Carrosserie',
      description: 'Pare-chocs, ailes, rétroviseurs et éléments de carrosserie',
      icon: Shield,
      color: 'from-gray-500 to-gray-600',
      productCount: 534,
      subcategories: ['Pare-chocs', 'Ailes', 'Rétroviseurs', 'Portes', 'Capots'],
      image: null,
      popularBrands: ['Prasco', 'Van Wezel', 'Alkar', 'Diederichs'],
      priceRange: '50 - 2000 DH'
    },
    {
      id: 'pneumatiques',
      name: 'Pneumatiques',
      description: 'Pneus, jantes, valves et accessoires de roues',
      icon: Car,
      color: 'from-indigo-500 to-indigo-600',
      productCount: 312,
      subcategories: ['Pneus été', 'Pneus hiver', 'Jantes', 'Valves', 'Équilibrage'],
      image: null,
      popularBrands: ['Michelin', 'Continental', 'Bridgestone', 'Pirelli'],
      priceRange: '200 - 3000 DH'
    },
    {
      id: 'lubrifiants',
      name: 'Lubrifiants',
      description: 'Huiles moteur, liquides de frein, antigel et produits d\'entretien',
      icon: Fuel,
      color: 'from-amber-500 to-amber-600',
      productCount: 156,
      subcategories: ['Huiles moteur', 'Liquides de frein', 'Antigel', 'Additifs', 'Graisses'],
      image: null,
      popularBrands: ['Castrol', 'Mobil', 'Total', 'Shell'],
      priceRange: '25 - 300 DH'
    },
    {
      id: 'outils',
      name: 'Outils',
      description: 'Outils de réparation, équipements et accessoires de garage',
      icon: Package,
      color: 'from-teal-500 to-teal-600',
      productCount: 89,
      subcategories: ['Clés', 'Tournevis', 'Équipements', 'Consommables', 'Sécurité'],
      image: null,
      popularBrands: ['Bosch', 'Stanley', 'Facom', 'Beta'],
      priceRange: '15 - 1500 DH'
    },
    {
      id: 'accessoires',
      name: 'Accessoires',
      description: 'Tapis, housses, porte-bagages et accessoires intérieur/extérieur',
      icon: Battery,
      color: 'from-pink-500 to-pink-600',
      productCount: 234,
      subcategories: ['Tapis', 'Housses', 'Porte-bagages', 'Barres de toit', 'Attelages'],
      image: null,
      popularBrands: ['Thule', 'Kamei', 'Walser', 'Cartrend'],
      priceRange: '20 - 800 DH'
    }
  ];

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'products':
        return b.productCount - a.productCount;
      case 'popular':
        return b.productCount - a.productCount; // Simuler la popularité par le nombre de produits
      default:
        return 0;
    }
  });

  const handleCategoryClick = (categoryId) => {
    // Naviguer vers la page de la catégorie spécifique
    navigate(`/category/${categoryId}`);
  };

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            <Grid className="w-4 h-4" />
            <span>CATÉGORIES</span>
            <Grid className="w-4 h-4" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Toutes nos Catégories
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explorez notre large gamme de pièces automobiles organisées par catégories
          </p>
        </motion.div>

        {/* Statistiques globales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total catégories</p>
                <p className="text-3xl font-bold">{categories.length}</p>
              </div>
              <Grid className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total produits</p>
                <p className="text-3xl font-bold">{totalProducts.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Marques partenaires</p>
                <p className="text-3xl font-bold">50+</p>
              </div>
              <Shield className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </motion.div>

        {/* Filtres et recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Ordre alphabétique</option>
                <option value="products">Nombre de produits</option>
                <option value="popular">Plus populaires</option>
              </select>

              {/* Mode d'affichage */}
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-background text-muted-foreground'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-background text-muted-foreground'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grille de catégories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}
        >
          <AnimatePresence>
            {sortedCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`bg-card rounded-xl shadow-lg overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group cursor-pointer ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Image/Icône */}
                  <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'}`}>
                    <div className={`w-full h-full bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                      <IconComponent className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
                        {category.productCount}
                      </span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-card-foreground group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {category.description}
                    </p>
                    
                    {/* Sous-catégories */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-card-foreground mb-2">Sous-catégories :</p>
                      <div className="flex flex-wrap gap-1">
                        {category.subcategories.slice(0, 3).map((sub, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {sub}
                          </span>
                        ))}
                        {category.subcategories.length > 3 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            +{category.subcategories.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Marques populaires */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-card-foreground mb-2">Marques populaires :</p>
                      <div className="flex flex-wrap gap-1">
                        {category.popularBrands.slice(0, 3).map((brand, idx) => (
                          <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {brand}
                          </span>
                        ))}
                        {category.popularBrands.length > 3 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            +{category.popularBrands.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Informations supplémentaires */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{category.productCount} produits</span>
                      <span>{category.priceRange}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Message si aucun résultat */}
        {sortedCategories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Grid className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Aucune catégorie trouvée
            </h3>
            <p className="text-muted-foreground">
              Essayez de modifier votre recherche
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Categories;