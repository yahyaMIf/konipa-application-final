import React from 'react';
import { motion } from 'framer-motion';
import { X, Package, DollarSign, Truck, Calendar, Tag } from 'lucide-react';

const ProductDetailsModal = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  // Calcul du prix brut (simulation)
  const grossPrice = product.price * 1.3; // Prix avec marge
  const supplierPrice = product.price * 0.7; // Prix fournisseur

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Détails du produit</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex gap-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Tag className="w-4 h-4" />
                <span>Catégorie: {product.category}</span>
              </div>
              
              {/* Substitutions disponibles */}
              {product.substitutions && product.substitutions.length > 0 && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                  <h4 className="text-xs font-semibold text-orange-800 mb-1">Substitutions:</h4>
                  <div className="space-y-1">
                    {product.substitutions.map((sub, index) => (
                      <div key={index} className="text-xs text-orange-700">
                        <span className="font-medium">{sub.reference}</span>
                        {sub.brand && <span className="text-orange-600"> ({sub.brand})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Prix de vente</h4>
              </div>
              <p className="text-2xl font-bold text-blue-600">{product.price.toFixed(2)} €</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Prix brut (avec marge)</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">{grossPrice.toFixed(2)} €</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900">Prix fournisseur</h4>
              </div>
              <p className="text-2xl font-bold text-orange-600">{supplierPrice.toFixed(2)} €</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Stock disponible</h4>
              </div>
              <p className="text-2xl font-bold text-purple-600">{product.stock || 'N/A'}</p>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Informations fournisseur</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nom:</span>
                <span className="ml-2 text-gray-600">{product.supplier || 'Fournisseur Principal'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Référence:</span>
                <span className="ml-2 text-gray-600">{product.supplierRef || product.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Délai de livraison:</span>
                <span className="ml-2 text-gray-600">{product.deliveryTime || '3-5 jours'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Dernière commande:</span>
                <span className="ml-2 text-gray-600">{product.lastOrder || '15/01/2024'}</span>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Informations complémentaires</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Date d'ajout:</span>
                <span className="ml-2 text-gray-600">{product.dateAdded || '01/01/2024'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Statut:</span>
                <span className="ml-2 text-gray-600">
                  {product.isPromotion ? 'Promotion' : 
                   product.isClearance ? 'Déstockage' : 
                   product.isNew ? 'Nouveauté' : 'Standard'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Marge bénéficiaire:</span>
                <span className="ml-2 text-gray-600">
                  {((grossPrice - supplierPrice) / supplierPrice * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Rotation stock:</span>
                <span className="ml-2 text-gray-600">{product.stockRotation || 'Moyenne'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDetailsModal;