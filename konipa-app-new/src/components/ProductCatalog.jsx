import React from 'react';
import { pricingService } from '../services/dataService';

const ProductCatalog = ({ products, onAddToCart, selectedCustomer }) => {
  const getDisplayedPrice = async (product) => {
    if (selectedCustomer) {
      try {
        const clientPrice = await pricingService.getClientPrice(selectedCustomer.id, product.id);
        return clientPrice ?? product.price;
      } catch (error) {
        return product.price;
      }
    }
    return product.price;
  };

  return (
    <div className="product-catalog">
      <h3 className="text-lg font-semibold mb-3">Produits</h3>
      <div className="products-grid grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {products.map(product => {
          const [displayedPrice, setDisplayedPrice] = React.useState(product.price);
          
          React.useEffect(() => {
            const loadPrice = async () => {
              const price = await getDisplayedPrice(product);
              setDisplayedPrice(price);
            };
            loadPrice();
          }, [selectedCustomer, product.id]);

          return (
            <div key={product.id} className="product-card border rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="product-image bg-gray-100 h-36 flex items-center justify-center">
                <img src={product.image || '/default-product.jpg'} alt={product.name} className="h-24 w-24 object-contain" />
              </div>
              <div className="product-info p-3">
                <h4 className="font-medium">{product.name}</h4>
                <p className="product-reference text-xs text-gray-500">Réf: {product.reference}</p>
                <div className="product-details flex items-center justify-between mt-2">
                  <span className="product-price font-semibold text-blue-600">
                    {displayedPrice.toFixed(2)} DH
                  </span>
                  <span className={`product-stock text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <button 
                  onClick={() => onAddToCart({ ...product, price: displayedPrice })}
                  disabled={product.stock === 0}
                  className="add-to-cart-btn mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm py-2 rounded"
                >
                  {product.stock > 0 ? 'Ajouter au panier' : 'Rupture'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductCatalog;
