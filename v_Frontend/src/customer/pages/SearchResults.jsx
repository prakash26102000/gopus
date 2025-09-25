import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL, getImageUrl } from '../../util';
import {
  ShoppingCart,
  Heart,
  Search,
  ListFilter,
  AlertTriangle,
  Package,
  ArrowLeft
} from 'lucide-react';
// import BackgroundParticles from '../components/BackgroundParticles';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import LoginRequiredModal from '../components/LoginRequiredModal';

// Utility function for GST calculations
const calculatePrices = (basePrice, mrp, gstRate, isInclusive) => {
  basePrice = parseFloat(basePrice) || 0;
  mrp = parseFloat(mrp) || basePrice;
  gstRate = parseFloat(gstRate) || 0;

  let priceBeforeGST, gstAmount, finalPrice;

  if (isInclusive) {
    // For inclusive GST, we need to extract GST from the given price
    priceBeforeGST = basePrice / (1 + (gstRate / 100));
    gstAmount = basePrice - priceBeforeGST;
    finalPrice = basePrice; // Final price is same as given price for inclusive
  } else {
    // For exclusive GST, we add GST to the given price
    priceBeforeGST = basePrice;
    gstAmount = basePrice * (gstRate / 100);
    finalPrice = basePrice + gstAmount;
  }

  // Calculate discount percentage if MRP is provided
  const discount = mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0;

  return {
    priceBeforeGST: Number(priceBeforeGST.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    discount,
    mrp: Number(mrp.toFixed(2))
  };
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('query') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const cartContext = useCart();
  const isLoggedIn = !!localStorage.getItem('token');
  const isCustomer = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role === 'customer';
    } catch {
      return false;
    }
  };

  // Fetch search results
  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${BASE_URL}/api/products/search`, { params: { query } });
        if (res.data.success) setProducts(res.data.products);
        else setError(res.data.message || 'Failed to fetch search results.');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'An error occurred while searching.');
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  // Fetch user favorites from API
  useEffect(() => {
    if (isLoggedIn && isCustomer()) {
      axios.get(`${BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        if (res.data && Array.isArray(res.data.favorites)) {
          const favIds = res.data.favorites.map(f => f.product.id);
          setFavorites(new Set(favIds));
        } else {
          console.error('Invalid favorites data format:', res.data);
          setFavorites(new Set());
        }
      }).catch(err => {
        console.error('Error fetching favorites:', err);
        setFavorites(new Set());
      });
    }
  }, []);

  const toggleFavorite = async (productId) => {
    if (!isLoggedIn || !isCustomer()) {
      setShowLoginModal(true);
      return;
    }

    const token = localStorage.getItem('token');
    const isFav = favorites.has(productId);
    try {
      if (!isFav) {
        await axios.post(`${BASE_URL}/api/favorites/${productId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Added to favorites');
        setFavorites(prev => new Set(prev).add(productId));
      } else {
        await axios.delete(`${BASE_URL}/api/favorites/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Removed from favorites');
        setFavorites(prev => {
          const updated = new Set(prev);
          updated.delete(productId);
          return updated;
        });
      }
      window.dispatchEvent(new Event('favoritesUpdate'));
    } catch (err) {
      console.error('Error updating favorites:', err);
      toast.error('Failed to update favorites');
    }
  };

  const handleAddToCart = (product) => {
    if (!isLoggedIn || !isCustomer()) {
      setShowLoginModal(true);
      return;
    }
    if (cartContext?.addToCart) {
      const cartProduct = {
        id: product.id,
        name: product.productName || product.name,
        price: product.price,
        image: product.imageUrl,
        description: product.description,
        categoryName: product.categoryName || product.category
      };
      cartContext.addToCart(cartProduct);
    } else {
      toast.error('Cart unavailable');
    }
  };

  const sortedProducts = React.useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'name':
        return sorted.sort((a, b) => (a.productName || a.name || '').localeCompare(b.productName || b.name || ''));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  if (!query) {
    return (
      <div className="min-h-screen relative transition-colors duration-200">
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 max-w-4xl text-center">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <Search size={32} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight mb-4">
            Search for Products
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Enter a search term in the navigation bar above to discover amazing products.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative transition-colors duration-200">
      {/* Background Elements */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Back Button and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/customer')}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title="Back to home"
              >
                <ArrowLeft size={18} className="mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </button>
            </div>

            {/* Search Results Header */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-800 to-gray-700">
                Search Results
              </h1>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-2">
                <p className="text-lg text-gray-600">
                  Results for: <span className="font-semibold text-blue-600">"{query}"</span>
                </p>
                {!loading && !error && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {products.length} {products.length === 1 ? 'product' : 'products'} found
                  </span>
                )}
              </div>
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
                <ListFilter size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error searching products</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <Package size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">No results found for "{query}"</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We couldn't find any products matching your search. Try different terms or check your spelling.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/customer')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Browse All Products
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map(product => {
              const isFav = favorites.has(product.id);
              return (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-blue-200 overflow-hidden transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {/* Product Image */}
                  <div className="relative overflow-hidden">
                    <Link to={`/customer/product/${product.id}`}>
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt={product.productName || product.name}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={e => e.target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=No+Image'}
                      />
                    </Link>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${isFav
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                      }`}
                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart size={18} className={isFav ? 'fill-current' : ''} />
                    </button>

                    {/* Discount Badge */}
                    {(() => {
                      const priceDetails = calculatePrices(
                        product.price,
                        product.mrp,
                        product.gst || 18,
                        product.gstType === 'inclusive'
                      );
                      return priceDetails.discount > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                          {priceDetails.discount}% OFF
                        </div>
                      );
                    })()}
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        <Link to={`/customer/product/${product.id}`}>
                          {product.productName || product.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {product.categoryName || product.category}
                        {product.subcategoryName || product.subcategory ? ` > ${product.subcategoryName || product.subcategory}` : ''}
                      </p>
                    </div>

                    {/* Price Section */}
                    <div className="mb-4">
                      {(() => {
                        const priceDetails = calculatePrices(
                          product.price,
                          product.mrp,
                          product.gst || 18,
                          product.gstType === 'inclusive'
                        );
                        return (
                          <>
                            <div className="flex items-baseline space-x-2 mb-1">
                              <p className="text-xl font-bold text-gray-900">₹{priceDetails.finalPrice.toLocaleString()}</p>
                              {priceDetails.mrp > priceDetails.finalPrice && (
                                <p className="text-sm text-gray-500 line-through">₹{priceDetails.mrp.toLocaleString()}</p>
                              )}
                            </div>
                            {priceDetails.mrp > priceDetails.finalPrice && (
                              <p className="text-sm font-medium text-green-600">
                                You save ₹{(priceDetails.mrp - priceDetails.finalPrice).toLocaleString()} ({priceDetails.discount}%)
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {product.gstType === 'inclusive' ? "Inclusive of GST" : `+${product.gst || 18}% GST`}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 mr-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        title={isLoggedIn && isCustomer() ? "Add to Cart" : "Login to Add"}
                      >
                        <ShoppingCart size={16} className="inline mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LoginRequiredModal show={showLoginModal} onCancel={() => setShowLoginModal(false)} />
    </div>
  );
};

export default SearchResults;
