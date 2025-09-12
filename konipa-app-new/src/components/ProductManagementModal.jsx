import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Save, Upload, Eye } from 'lucide-react';
import { getProductTypes } from '../utils/productFilters';
import { productService } from '../services/dataService';

const ProductManagementModal = ({ isOpen, onClose, products = [], onProductsUpdate }) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    originalPrice: '',
    grossPrice: '',
    stock: '',
    category: '',
    subcategory: '',
    supplier: '',
    productType: 'normal',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProductType, setFilterProductType] = useState('all');

  const productTypes = getProductTypes();
  const categories = ['Freinage', 'Moteur', 'Suspension', 'Électrique', 'Filtration', 'Éclairage'];

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name || '',
        brand: selectedProduct.brand || '',
        description: selectedProduct.description || '',
        price: selectedProduct.price || '',
        originalPrice: selectedProduct.originalPrice || '',
        grossPrice: selectedProduct.grossPrice || '',
        stock: selectedProduct.stock || '',
        category: selectedProduct.category || '',
        subcategory: selectedProduct.subcategory || '',
        supplier: selectedProduct.supplier || '',
        productType: selectedProduct.productType || 'normal',
        image: selectedProduct.image || ''
      });
      setImagePreview(selectedProduct.image || '');
    } else {
      resetForm();
    }
  }, [selectedProduct]);

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      description: '',
      price: '',
      originalPrice: '',
      grossPrice: '',
      stock: '',
      category: '',
      subcategory: '',
      supplier: '',
      productType: 'normal',
      image: ''
    });
    setImagePreview('');
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setImagePreview(imageUrl);
        setFormData(prev => ({
          ...prev,
          image: imageUrl
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.brand.trim()) newErrors.brand = 'La marque est requise';
    if (!formData.description.trim()) newErrors.description = 'La description est requise';
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Le prix doit être un nombre positif';
    }
    if (!formData.category) newErrors.category = 'La catégorie est requise';
    if (!formData.supplier.trim()) newErrors.supplier = 'Le fournisseur est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      grossPrice: formData.grossPrice ? parseFloat(formData.grossPrice) : null,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      isNew: formData.productType === 'nouveaute'
    };

    try {
      if (selectedProduct) {
        // Update existing product
        await productService.updateProduct(selectedProduct.id, productData);
      } else {
        // Add new product
        await productService.createProduct(productData);
      }
      
      // Notify parent to reload products
      onProductsUpdate([]);
      
      resetForm();
      setSelectedProduct(null);
      setActiveTab('list');
    } catch (error) {
      alert('Erreur lors de la sauvegarde du produit: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setActiveTab('edit');
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await productService.deleteProduct(productId);
        
        // Notify parent to reload products
        onProductsUpdate([]);
      } catch (error) {
        alert('Erreur lors de la suppression du produit: ' + (error.message || 'Erreur inconnue'));
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesProductType = filterProductType === 'all' || product.productType === filterProductType;
    
    return matchesSearch && matchesCategory && matchesProductType;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Gestion des Produits
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedProduct(null);
              resetForm();
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Liste des Produits
          </button>
          <button
            onClick={() => {
              setActiveTab('add');
              setSelectedProduct(null);
              resetForm();
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'add'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Ajouter un Produit
          </button>
          {activeTab === 'edit' && (
            <button
              className="px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50"
            >
              Modifier le Produit
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'list' && (
            <div>
              {/* Filters */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom ou marque..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Produit
                  </label>
                  <select
                    value={filterProductType}
                    onChange={(e) => setFilterProductType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tous les types</option>
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Image</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Nom</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Marque</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Prix</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Catégorie</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Stock</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {product.name}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.brand}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.price}€
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.category}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.productType === 'promo' ? 'bg-green-100 text-green-800' :
                            product.productType === 'destockage' ? 'bg-red-100 text-red-800' :
                            product.productType === 'nouveaute' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {productTypes.find(t => t.value === product.productType)?.label || 'Normal'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.stock || 0}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun produit trouvé
                </div>
              )}
            </div>
          )}

          {(activeTab === 'add' || activeTab === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image du Produit
                  </label>
                  <div className="flex items-center space-x-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choisir une image</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du Produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nom du produit"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marque *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.brand ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Marque"
                  />
                  {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Description du produit"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix de Vente (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Prix de vente"
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix Original (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prix original (optionnel)"
                  />
                </div>

                {/* Gross Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix Brut (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="grossPrice"
                    value={formData.grossPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prix brut (optionnel)"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quantité en stock"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sous-catégorie
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sous-catégorie (optionnel)"
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fournisseur *
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.supplier ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nom du fournisseur"
                  />
                  {errors.supplier && <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>}
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Produit
                  </label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setSelectedProduct(null);
                    setActiveTab('list');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{activeTab === 'edit' ? 'Mettre à jour' : 'Ajouter'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagementModal;