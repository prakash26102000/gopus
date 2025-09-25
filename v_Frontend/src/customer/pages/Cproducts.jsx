import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Filter, Search, X, ShoppingCart, Laptop, Smartphone, Gift, Home, Watch, Dumbbell, Camera, ShoppingBag, Shirt, Car, Utensils, Baby, Music, Book, Headphones, Heart, HeartPulse } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { BASE_URL } from '../../util';
// import BackgroundParticles from '../components/BackgroundParticles';
import LoginRequiredModal from '../components/LoginRequiredModal';


const ProductsPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');
  const searchParam = queryParams.get('search');
  const navigate = useNavigate();

  // Get cart functionality from context
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(categoryParam ? parseInt(categoryParam, 10) : null);
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [sortOption, setSortOption] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Track if any filters are active
  const hasFilters = selectedCategory !== null || searchQuery || sortOption !== 'default' || minPrice || maxPrice;

  // Authentication helper functions
  const isLoggedIn = localStorage.getItem('token') && localStorage.getItem('user');

  const isCustomer = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role === 'customer';
    } catch {
      return false;
    }
  };

  // Handle add to cart with authentication check
  const handleAddToCart = (product) => {
    if (!isLoggedIn || !isCustomer()) {
      // Instead of modal, redirect to login with state.from
      navigate('/login', {
        state: { from: location.pathname + location.search }
      });
      return;
    }

    const productToAdd = {
      id: product.id,
      name: product.productName,
      price: product.price,
      mrp: product.mrp,
      image: product.imageUrl?.startsWith('http')
        ? product.imageUrl
        : product.imageUrl ? `${BASE_URL}${product.imageUrl}` : 'https://via.placeholder.com/300?text=No+Image',
      categoryName: getCategoryName(product.category)
    };

    console.log('[Cproducts.jsx] Attempting to add to cart:', productToAdd);
    addToCart(productToAdd);
    navigate('/customer/cart');
  };

  // Handle login modal close
  const handleLoginModalClose = () => {
    setShowLoginModal(false);
  };

  // Make filter sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsFilterSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch categories once when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/categories`);
        if (response.data && response.data.mainCategories && Array.isArray(response.data.mainCategories)) {
          setCategories(response.data.mainCategories);

          // Create category map for lookup by ID
          const categoryMapping = {};
          response.data.mainCategories.forEach(category => {
            categoryMapping[category.id] = category.name;
          });
          setCategoryMap(categoryMapping);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  // Apply client-side filtering whenever filters change
  useEffect(() => {
    if (allProducts.length > 0) {
      let filtered = [...allProducts];

      // Category filter
      if (selectedCategory !== null) {
        filtered = filtered.filter(product => product.category === selectedCategory);
      }

      // Price filter
      if (minPrice) {
        filtered = filtered.filter(product => parseFloat(product.price) >= parseFloat(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter(product => parseFloat(product.price) <= parseFloat(maxPrice));
      }

      setProducts(filtered);
    }
  }, [selectedCategory, allProducts, minPrice, maxPrice]);

  // Fetch products when search or sort changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        // Always fetch all products, we'll filter client-side
        let url = `${BASE_URL}/api/products?_=${timestamp}`;

        console.log('Fetching all products from URL:', url);

        const response = await axios.get(url);

        if (response.data && Array.isArray(response.data)) {
          // Fetch images for each product in parallel
          const productsWithImages = await Promise.all(
            response.data.map(async (product) => {
              try {
                // Get product images
                const imagesResponse = await axios.get(`${BASE_URL}/api/products/${product.id}/images`);

                if (imagesResponse.data && Array.isArray(imagesResponse.data) && imagesResponse.data.length > 0) {
                  return {
                    ...product,
                    imageUrl: imagesResponse.data[0].imageUrl || imagesResponse.data[0].url
                  };
                }
                return product;
              } catch (imageError) {
                console.error(`Error fetching images for product ${product.id}:`, imageError);
                return product;
              }
            })
          );

          // Apply sorting
          let sortedProducts = [...productsWithImages];
          switch (sortOption) {
            case 'price-asc':
              sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
              break;
            case 'price-desc':
              sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
              break;
            case 'name-asc':
              sortedProducts.sort((a, b) => a.productName.localeCompare(b.productName));
              break;
            case 'name-desc':
              sortedProducts.sort((a, b) => b.productName.localeCompare(a.productName));
              break;
            case 'rating-desc':
              sortedProducts.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
              break;
            default:
              // Default sorting (no specific order)
              break;
          }

          // Store all products
          setAllProducts(sortedProducts);

          // Filter products based on selected category
          if (selectedCategory !== null) {
            const filtered = sortedProducts.filter(product => product.category === selectedCategory);
            setProducts(filtered);
          } else {
            setProducts(sortedProducts);
          }
        } else {
          setError('Invalid response format from server');
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.response?.data?.message || 'Error fetching products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, sortOption]); // Removed selectedCategory since we handle it separately

  const handleCategoryChange = (categoryId) => {
    console.log('handleCategoryChange called with categoryId:', categoryId);
    setSelectedCategory(categoryId);
    console.log('selectedCategory set to:', categoryId);
    // Clear search when selecting a category
    setSearchQuery('');

    // We now handle filtering based on the selectedCategory in a separate useEffect
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSortOption('default');
    setMinPrice('');
    setMaxPrice('');
    // Update URL params
    const params = new URLSearchParams(location.search);
    params.delete('category');
    navigate({ search: params.toString() });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const getCategoryName = (categoryId) => {
    return categoryMap[categoryId] || 'Uncategorized';
  };

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

  // Product Card Component
  const ProductCard = ({ product }) => {
    const { id, productName, imageUrl, price, rating, brand, category, mrp, gst = 18, gstType = 'exclusive' } = product;

    // Get the category name from our mapping
    const categoryName = getCategoryName(category);

    // Construct the full image URL or use placeholder
    const fullImageUrl = imageUrl?.startsWith('http')
      ? imageUrl
      : imageUrl ? `${BASE_URL}${imageUrl}` : 'https://via.placeholder.com/300?text=No+Image';
      
    // Calculate prices with GST
    const priceDetails = calculatePrices(price, mrp, gst, gstType === 'inclusive');
    const hasDiscount = priceDetails.mrp > priceDetails.finalPrice;

    return (
      <div className="bg-white rounded-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-md relative z-100">
        {/* Product Image with Category Tag */}
        <Link to={`/customer/product/${id}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={fullImageUrl}
              alt={productName}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
              }}
            />

            {/* Category Tag */}
            <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md font-medium text-gray-800">
              {categoryName}
            </div>
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Brand Name */}
          <div className="flex justify-between items-start">
              <Link to={`/customer/product/${id}`} className="block flex-grow">
                <h3 className="font-bold text-sm text-gray-900 mb-1">
                  {brand || 'Brand'}
                </h3>
                <div className="text-gray-600 text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                  {productName}
                </div>
              </Link>
              <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="bg-blue-500 text-white px-2 py-1.5 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 flex-shrink-0"
                  title={isLoggedIn && isCustomer() ? "Add to Cart" : "Login to Add to Cart"}
                >
                  <ShoppingCart size={16} color='white' />
                  Add
              </button>
          </div>
          

          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex items-center mr-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">({rating?.toFixed(1) || 0})</span>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start">
                <div className="flex items-baseline gap-2">
                  {hasDiscount && (
                    <p className="text-sm text-gray-500 line-through">
                      ₹{priceDetails.mrp.toLocaleString()}
                    </p>
                  )}
                  <p className="font-semibold text-gray-900">
                    ₹{priceDetails.finalPrice.toLocaleString()}
                  </p>
                </div>
                {hasDiscount && (
                  <p className="text-xs font-medium text-green-600">
                    You save ₹{(priceDetails.mrp - priceDetails.finalPrice).toFixed(2)} ({priceDetails.discount}%)
                  </p>
                )}
                {/* <p className="text-xs text-gray-500 mt-1">
                  {gstType === 'inclusive' ? "Incl. GST" : `+${gst}% GST`}
                </p> */}
              </div>
              {/* <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                className="bg-blue-500 text-white px-2 py-1.5 rounded-full ml-3 text-xs font-medium hover:bg-blue-700 hover:border-radius-100 transition-colors flex items-center gap-1"
                title={isLoggedIn && isCustomer() ? "Add to Cart" : "Login to Add to Cart"}
              >
                <ShoppingCart size={16} color='white' />
                Add
              </button> */}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Particles as true background */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        {/* <BackgroundParticles count={30} /> */}
      </div>
      {/* Main Product Section */}
      <div className="relative z-10 flex flex-col w-full">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {selectedCategory
                ? `${getCategoryName(selectedCategory)} Products`
                : searchQuery
                  ? `Search Results: "${searchQuery}"`
                  : 'All Products'}
            </h1>
            <div className="mt-4 md:mt-0 flex items-center space-x-2 w-full md:w-auto">
              <button
                onClick={toggleFilters}
                className="md:hidden flex items-center bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                aria-label="Show filters"
              >
                <Filter size={18} className="mr-2" />
                <span>Filters</span>
                {(selectedCategory !== null || sortOption !== 'default') && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-shop-primary text-white text-xs flex items-center justify-center">
                    ✓
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row">
            {/* Filters - Mobile (Drawer) */}
            {showFilters && (
              <div className="md:hidden fixed inset-0 z-[1000] overflow-hidden">
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
                  onClick={toggleFilters}
                  aria-hidden="true"
                ></div>
                <div 
                  className={`fixed left-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}
                >
                  <div className="sticky top-0 bg-white z-50 border-b border-gray-200 px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                      <div className="flex items-center gap-4">
                        {hasFilters && (
                          <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                          >
                            Clear all
                          </button>
                        )}
                        <button
                          onClick={toggleFilters}
                          className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100/80 active:bg-gray-200/80 transition-colors"
                          aria-label="Close filters"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="p-4">
                      <FilterContent
                        categories={categories}
                        selectedCategory={selectedCategory}
                        handleCategoryChange={(categoryId) => {
                          handleCategoryChange(categoryId);
                          toggleFilters();
                        }}
                        sortOption={sortOption}
                        setSortOption={setSortOption}
                        clearFilters={clearFilters}
                        hasFilters={hasFilters}
                        minPrice={minPrice}
                        setMinPrice={setMinPrice}
                        maxPrice={maxPrice}
                        setMaxPrice={setMaxPrice}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Filters - Desktop (Sidebar) */}
            <aside className="hidden md:block w-64 flex-shrink-0 mr-8">
              <div className="bg-white rounded-lg shadow-sm p-5 sticky top-24">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <FilterContent
                  categories={categories}
                  selectedCategory={selectedCategory}
                  handleCategoryChange={handleCategoryChange}
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  clearFilters={clearFilters}
                  hasFilters={hasFilters}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                />
              </div>
            </aside>
            {/* Products */}
            <div className="flex-1">
              {loading ? (
                // Loading skeleton grid
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-6">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/3 mt-2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                // Error message
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : products.length === 0 ? (
                // No products found
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-600 mb-4">No products found matching your criteria.</p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                // Products grid
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile filter button */}
      <div className={`lg:hidden fixed bottom-6 right-6 z-30 transition-transform duration-300 ${isFilterSticky ? 'translate-y-0' : 'translate-y-20'}`}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-shop-primary to-blue-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
        >
          {showFilters ? <X size={20} /> : <Filter size={20} />}
        </button>
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        show={showLoginModal}
        onCancel={handleLoginModalClose}
      />
    </div>
  );
};

// Category Icons mapping
const categoryIcons = {
  'Electronics': Laptop,
  'Fashion': Shirt,
  'Home & Kitchen': Home,
  'Beauty Care': HeartPulse,
  'Groceries': ShoppingBag,
  'Medical products': HeartPulse,
  'Stationery': Book,
  'Baby Products': Baby,
  'default': ShoppingBag
};

// Filter Component
const FilterContent = ({
  categories,
  selectedCategory,
  handleCategoryChange,
  clearFilters,
  hasFilters,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice
}) => (
  <div className="space-y-6">
    {/* Price Filter */}
    <div className="rounded-xl p-4">
      <h3 className="font-semibold text-gray-800 text-lg mb-4">Price Range</h3>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <span className="text-gray-500">to</span>
        <div className="flex-1">
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>

    {/* Categories Filter */}
    <div className="rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">Categories</h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-blue-50/80"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all ${
            selectedCategory === null
              ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
              : 'hover:bg-gray-50 text-gray-700 active:bg-gray-100'
          }`}
        >
          <span className="mr-3 text-blue-600">
            <ShoppingBag size={20} strokeWidth={2} />
          </span>
          <span>All Categories</span>
          {selectedCategory === null && (
            <span className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          )}
        </button>

        <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2 -mr-2 custom-scrollbar space-y-2">
          {categories.map(category => {
            // Convert category name to lowercase for case-insensitive matching
            const categoryName = category.name ? category.name.trim().toLowerCase() : '';

            // Find matching icon key (case-insensitive and trimmed)
            const iconKey = Object.keys(categoryIcons).find(
              key => key.toLowerCase() === categoryName
            );

            const icon = iconKey ? categoryIcons[iconKey] : categoryIcons.default;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                    : 'hover:bg-gray-50 text-gray-700 active:bg-gray-100'
                }`}
              >
                <span className={`mr-3 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                  {React.createElement(icon, { size: 20, strokeWidth: 2 })}
                </span>
                <span className="truncate">{category.name}</span>
                {isSelected && (
                  <span className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

export default ProductsPage;