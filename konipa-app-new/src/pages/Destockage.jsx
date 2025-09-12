import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaRegHeart, FaEye, FaEdit } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/dataService';
import { getDestockageProducts } from '../utils/productFilters';
import ProductDetailsModal from '../components/ProductDetailsModal';
import ProductEditModal from '../components/ProductEditModal';

const Destockage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);

  // Fonction pour gérer l'ajout au panier de manière asynchrone
  const handleAddToCart = async (product) => {
    await addToCart(product);
  };
  const [favorites, setFavorites] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les favoris depuis le localStorage
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites && mountedRef.current) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Charger les produits de déstockage
  useEffect(() => {
    if (!mountedRef.current || loadedRef.current) return;
    
    const loadProducts = async () => {
      try {
        if (!mountedRef.current) return;
        setLoading(true);
        const allProducts = await productService.getProducts();
        const destockageProducts = getDestockageProducts(allProducts);
        if (mountedRef.current) {
          setProducts(destockageProducts);
          loadedRef.current = true;
        }
      } catch (error) {
        if (mountedRef.current) {
          setProducts([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadProducts();
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleDetailsClick = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleProductSave = (updatedProduct) => {

    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const isAdminRole = user && ['admin', 'accounting'].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Déstockage
          </h1>
          <p className="text-xl opacity-90">
            Profitez de nos offres de déstockage à prix réduits
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12">
        {/* Indicateur de chargement */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des produits en déstockage...</span>
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold text-gray-600 mb-4">
                  Aucun produit en déstockage pour le moment
                </h3>
                <p className="text-gray-500">
                  Revenez bientôt pour découvrir nos offres de déstockage
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Déstockage
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  >
                    {favorites.includes(product.id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-red-600">
                        {product.price}€
                      </span>
                      {product.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          {product.originalPrice}€
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {!isAdminRole && (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FaShoppingCart />
                        <span>Ajouter</span>
                      </button>
                    )}
                    
                    {isAdminRole && (
                      <>
                        <button
                          onClick={() => handleDetailsClick(product)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <FaEye />
                          <span>Voir détails</span>
                        </button>
                        <button
                          onClick={() => handleEditClick(product)}
                          className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <FaEdit />
                          <span>Modifier</span>
                        </button>
                      </>
                    )}
                    
                    <Link
                      to={`/product/${product.id}`}
                      className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      <FaEye />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>
            )}
          </>
        )}
      </div>

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Product Edit Modal */}
      {showEditModal && selectedProduct && (
        <ProductEditModal
          product={selectedProduct}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSave={handleProductSave}
        />
      )}
    </div>
  );
};

export default Destockage;