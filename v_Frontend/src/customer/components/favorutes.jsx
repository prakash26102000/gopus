import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Trash2, ShoppingBag, Heart } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BASE_URL, getImageUrl } from '../../util';
import LoginRequiredModal from './LoginRequiredModal';
import { useCart } from '../context/CartContext';

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

const FavoritesItem = ({ product, onRemove, onAddToCart }) => {
  const {
    id,
    productname,
    brand,
    price,
    mrp,
    rating,
    gst = 18,
    gstType = 'exclusive',
    productimages,
    category
  } = product;

  const imageUrl = getImageUrl(productimages?.[0]?.imageurl);
  const priceDetails = calculatePrices(price, mrp, gst, gstType === 'inclusive');
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="relative">
        {/* <button
          onClick={() => onRemove(id)}
          className="absolute top-2 right-2 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-600 transition-all"
          title="Remove from favorites"
        >
          <Trash2 size={14} className="" />
        </button> */}
        <Link to={`/customer/product/${id}`}>
          <div className="relative w-full h-36 sm:h-44 overflow-hidden">
            <img
              src={imageUrl || 'https://placehold.co/300x200/EEE/999?text=No+Image'}
              alt={productname}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        </Link>
        {priceDetails.discount > 0 && (
          <div className="absolute top-2 right-12 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {priceDetails.discount}% OFF
          </div>
        )}
      </div>

      <div className="p-3 flex-grow flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
          <span className="text-xs font-medium text-gray-600">{brand || 'Brand'}</span>
          {/* <span className="text-xs bg-blue-100 px-2 py-1 rounded-full text-blue-600">{category}</span> */}
        </div>

        <Link
          to={`/customer/product/${id}`}
          className="text-base font-medium mb-2 hover:text-blue-600 line-clamp-2 transition-colors"
        >
          {productname}
        </Link>

        <div className="flex items-center mb-2">
          <div className="flex items-center mr-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={`${i < Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({rating?.toFixed(1) || 0})</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-gray-800">₹{priceDetails.finalPrice.toLocaleString()}</span>
              {priceDetails.mrp > priceDetails.finalPrice && (
                <span className="text-gray-400 text-xs line-through">₹{priceDetails.mrp.toLocaleString()}</span>
              )}
            </div>
            {priceDetails.discount > 0 && (
              <span className="text-xs text-green-600">
                You save ₹{(priceDetails.mrp - priceDetails.finalPrice).toLocaleString()}
              </span>
            )}
            {/* <span className="text-xs text-gray-500 mt-0.5">
              {gstType === 'inclusive' ? "Incl. GST" : `+${gst}% GST`}
            </span> */}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-1">
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-blue-600 text-white px-2 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-1 transition-all"
          >
            <ShoppingCart size={14} /> Add
          </button>
          <button
            onClick={() => onRemove(id)}
            className="flex-1 text-red-500 hover:text-red-600 px-2 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-all"
            title="Remove from favorites"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
};


const Favorites = () => {
  const navigate = useNavigate();
  const [favoritesItems, setFavoritesItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { addToCart } = useCart();

  // Check for token and customer role
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user?.role !== 'customer') {
      setShowLoginModal(true);
    }
  }, []);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BASE_URL}/api/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFavoritesItems(response.data.favorites);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setError("Failed to fetch favorites");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // Remove from favorites
  const handleRemoveFromFavorites = async (productId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${BASE_URL}/api/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavoritesItems(prev => prev.filter(p => p.productId !== productId));
      toast.success("Removed from favorites");
      window.dispatchEvent(new CustomEvent('favoritesUpdate'));
    } catch (err) {
      toast.error("Error removing from favorites");
    }
  };

  // Add to cart
  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success("Added to cart");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">My Favorites</h1>
        <button
          onClick={() => navigate('/customer/shop')}
          className="mt-3 sm:mt-0 bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 sm:gap-3 transition-all"
        >
          <ShoppingBag size={16} /> Continue Shopping
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your favorites...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all"
          >
            Try Again
          </button>
        </div>
      ) : favoritesItems.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="mx-auto text-gray-400 mb-8" size={64} />
          <h2 className="text-xl sm:text-2xl text-gray-800 mb-4">Your favorites list is empty.</h2>
          <p className="text-gray-500 mb-6">
            Start adding products to your favorites by clicking the heart icon on product pages.
          </p>
          <button
            onClick={() => navigate('/customer/shop')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-4">
          {favoritesItems.map(fav => (
            <FavoritesItem
              key={fav.id}
              product={fav.product}
              onRemove={() => handleRemoveFromFavorites(fav.productId)}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
      <LoginRequiredModal
        show={showLoginModal}
        onCancel={() => navigate('/customer/home')}
      />
    </div>
  );
};

export default Favorites;
