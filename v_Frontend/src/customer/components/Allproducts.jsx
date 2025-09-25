import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../util';
// LoginRequiredModal not used; unauthenticated users are redirected to /login
import SmartPagination from '../../components/SmartPagination';
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

// ProductCard component
const ProductCard = ({ product, categoryMap, isFeatured }) => {
  const { id, productName, imageUrl, price, mrp, rating, category, brand } = product;
  const navigate = useNavigate();
  const location = useLocation();
  // Removed modal; we redirect to /login
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [productSizes, setProductSizes] = useState([]);
  const [hasSizes, setHasSizes] = useState(false);
  
  // GST calculation state - same pattern as ProductDetails
  const [priceDetails, setPriceDetails] = useState({
    priceBeforeGST: 0,
    gstAmount: 0,
    finalPrice: 0,
    discount: 0,
    mrp: 0
  });

  // Calculate prices with GST when product data changes
  useEffect(() => {
    if (product) {
      const basePrice = parseFloat(product.price) || 0;
      const mrpValue = parseFloat(product.mrp) || basePrice;
      const gst = parseFloat(product.gst) || 0;
      const gstType = product.gst_type || product.gstType || 'exclusive';

      let priceBeforeGST, gstAmount, finalPrice;

      if (gstType === 'inclusive') {
        // For inclusive GST, extract GST from the given price
        priceBeforeGST = basePrice / (1 + (gst / 100));
        gstAmount = basePrice - priceBeforeGST;
        finalPrice = basePrice;
      } else {
        // For exclusive GST, add GST to the given price
        priceBeforeGST = basePrice;
        gstAmount = basePrice * (gst / 100);
        finalPrice = basePrice + gstAmount;
      }

      // Calculate discount percentage if MRP is provided
      const discount = mrpValue > finalPrice ? Math.round(((mrpValue - finalPrice) / mrpValue) * 100) : 0;

      setPriceDetails({
        priceBeforeGST: Number(priceBeforeGST.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        finalPrice: Number(finalPrice.toFixed(2)),
        discount,
        mrp: Number(mrpValue.toFixed(2))
      });
    }
  }, [product]);

  const hasDiscount = priceDetails.mrp > priceDetails.finalPrice;

  // Fetch product sizes
  useEffect(() => {
    // Only fetch sizes for featured cards to avoid N+1 requests across large grids
    if (!isFeatured) return;
    const fetchProductSizes = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/products/${id}/sizes`);
        if (response.data && response.data.length > 0) {
          setProductSizes(response.data);
          setHasSizes(true);
        } else {
          setProductSizes([]);
          setHasSizes(false);
        }
      } catch (error) {
        console.error('Error fetching product sizes:', error);
        setProductSizes([]);
        setHasSizes(false);
      }
    };

    if (id) {
      fetchProductSizes();
    }
  }, [id, isFeatured]);

  useEffect(() => {
    // Only check favorites for featured cards to reduce per-card network calls
    if (!isFeatured) return;
    const token = localStorage.getItem('token');
    const fetchFavoritesStatus = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Check different possible data structures
        let favoriteIds = [];
        
        if (res.data) {
          // Try different possible data structures
          if (res.data.favorites) { // If the API returns favorites array
            favoriteIds = res.data.favorites.map(fav => fav.productId || fav.reviewedProductId);
          } else if (res.data.favorite) { // If the API returns favorite array
            favoriteIds = res.data.favorite.map(fav => fav.productId || fav.reviewedProductId);
          } else if (res.data && Array.isArray(res.data)) { // If the API returns array directly
            favoriteIds = res.data.map(fav => fav.productId || fav.reviewedProductId);
          }
        }

        setIsFavorite(favoriteIds.includes(id));
      } catch (err) {
        console.error('Failed to fetch favorites', err);
      }
    };

    if (token) fetchFavoritesStatus();
  }, [id, isFeatured]);


  // Construct the full image URL
  const fullImageUrl = imageUrl?.startsWith('http')
    ? imageUrl
    : `${BASE_URL}${imageUrl}`;

  const categoryName = categoryMap[category] || 'Uncategorized';

  const checkAuthAndExecute = (action) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user && user.role === 'customer') {
      action();
    } else {
      navigate('/login', { state: { from: location }, replace: false });
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    checkAuthAndExecute(() => {
      try {
        if (addToCart) {
          const itemToAdd = {
            id: id,
            name: productName || 'Unnamed Product',
            price: priceDetails.finalPrice,
            mrp: priceDetails.mrp,
            image: fullImageUrl,
            categoryName: categoryName || 'Unknown Category',
            quantity: 1
          };
          addToCart(itemToAdd, 1);
        }
      } catch (err) {
        console.error('Error adding product to cart:', err);
        toast.error('Failed to add product to cart');
      }
    });
  };

  const toggleFavorites = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    checkAuthAndExecute(async () => {
      const token = localStorage.getItem('token');
      try {
        if (!isFavorite) {
          await axios.post(`${BASE_URL}/api/favorites/${id}`, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          toast.success(`${productName} added to favorites`);
          setIsFavorite(true);
        } else {
          await axios.delete(`${BASE_URL}/api/favorites/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          toast.success(`${productName} removed from favorites`);
          setIsFavorite(false);
        }

        window.dispatchEvent(new Event('favoritesUpdate'));
      } catch (err) {
        console.error('Error updating favorites:', err);
        toast.error('Unable to update favorites');
      }
    });
  };



  return (
    <div className={`bg-white rounded-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-md relative ${isFeatured ? 'featured-product' : ''}`}>
      <div className={`relative aspect-square overflow-hidden bg-gray-100`}>
        <Link to={`/customer/product/${id}`}>
          <img
            src={fullImageUrl}
            alt={productName}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            onError={(e) => {
              e.target.src = '#';
            }}
          />
        </Link>

        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white/80 backdrop-blur-sm text-xs sm:text-sm px-2 py-1 rounded-md font-medium text-gray-800">
          {categoryName}
        </div>

        <button
          onClick={toggleFavorites}
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${isFavorite ? 'bg-red-50' : 'bg-white/80 hover:bg-white'}`}
        >
          <Heart
            size={14}
            className={`${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
          />
        </button>

        {hasDiscount && (
          <div className="absolute top-10 sm:top-12 right-2 sm:right-3 bg-red-500 text-white text-xs sm:text-sm font-semibold px-2 py-1 rounded-md">
            {priceDetails.discount}% OFF
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
            {brand || 'Brand'}
          </h3>
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>

        <Link to={`/customer/product/${id}`} className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {productName}
        </Link>

        {/* Size Information */}
        {/* {hasSizes && productSizes.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {productSizes.slice(0, 4).map((size, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border"
                >
                  {size.size_value}
                </span>
              ))}
              {productSizes.length > 4 && (
                <span className="text-xs text-gray-500">+{productSizes.length - 4} more</span>
              )}
            </div>
            <p className="text-xs text-blue-600 mt-1">Multiple sizes available</p>
          </div>
        )} */}

        <div className="flex items-center mb-3">
          <div className="flex items-center mr-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={`${i < Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-500">({rating?.toFixed(1) || 0})</span>
        </div>

        <div className="mt-auto">
          <div className="h-12 sm:h-14 flex items-center">
            <div>
              <div className="flex items-baseline gap-1 sm:gap-2">
                {hasSizes && productSizes.length > 0 && (
                  <span className="text-xs text-gray-500">Starting from</span>
                )}
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  ₹{priceDetails.finalPrice.toLocaleString()}
                </p>
                {hasDiscount && (
                  <p className="text-xs sm:text-sm text-gray-500 line-through">₹{priceDetails.mrp.toLocaleString()}</p>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs sm:text-sm font-semibold text-green-600">
                  You save ₹{(priceDetails.mrp - priceDetails.finalPrice).toLocaleString()}
                </p>
              )}
              {/* <p className="text-[10px] text-gray-500">
                {product.gst_type === 'inclusive' || product.gstType === 'inclusive'
                  ? `Inclusive of ${parseFloat(product.gst) || 0}% GST (₹${priceDetails.gstAmount.toLocaleString()})` 
                  : `+${parseFloat(product.gst) || 0}% GST (₹${priceDetails.gstAmount.toLocaleString()})`}
              </p> */}
            </div>
          </div>
        </div>
      </div>
      {/* Modal removed */}
    </div>
  );
};

// Memoize to avoid unnecessary re-renders when parent updates
const MemoProductCard = React.memo(ProductCard);

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 3,
    total: 0
  });


  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/categories`);
      if (response.data && response.data.mainCategories) {
        const categoryMapping = {};
        response.data.mainCategories.forEach(category => {
          categoryMapping[category.id] = category.name;
        });
        setCategoryMap(categoryMapping);
        setCategories(response.data.mainCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  // Fetch products with pagination (no filters), reduced initial limit and cancellation
  const fetchProducts = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch a reasonable chunk instead of the entire catalog
      const response = await axios.get(`${BASE_URL}/api/products?limit=120&includeOutOfStock=true`, { signal });

      if (response.data) {
        const productsData = Array.isArray(response.data) ? response.data : response.data.products || [];
        const filteredProducts = productsData;

        // Calculate pagination and only fetch images for the current page slice
        const PAGE_SIZE = 24;
        const total = filteredProducts.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const currentPage = Math.min(pagination.currentPage, totalPages);
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageSlice = filteredProducts.slice(start, end);

        // Update pagination totals if changed
        if (!signal?.aborted) {
          setPagination(prev => ({ ...prev, currentPage, totalPages, total }));
        }

        // Fetch images only for the current page slice
        const pageWithImages = await Promise.all(
          pageSlice.map(async (product) => {
            try {
              const imagesResponse = await axios.get(`${BASE_URL}/api/products/${product.id}/images`, { signal });
              return {
                ...product,
                imageUrl: imagesResponse.data?.[0]?.imageUrl || imagesResponse.data?.[0]?.url || null
              };
            } catch (error) {
              if (axios.isCancel?.(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return { ...product, imageUrl: null };
              }
              console.error(`Error fetching images for product ${product.id}:`, error);
              return { ...product, imageUrl: null };
            }
          })
        );

        if (!signal?.aborted) {
          setProducts(pageWithImages);
        }
      } else {
        if (!signal?.aborted) setProducts([]);
      }
    } catch (error) {
      if (axios.isCancel?.(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        // ignore
      } else {
        console.error("Error fetching products:", error);
        if (!signal?.aborted) {
          setError(error.response?.data?.message || "Failed to load products. Please try again later.");
          setProducts([]);
        }
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [pagination.currentPage]);

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  // Fetch products on page change with cancellation
  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  // Filters removed: no handlers

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative-overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-4">
          {/* Header and Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 relative">All Products</h1>

          </div>

          {/* Filters removed */}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, index) => (
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
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              {/* Featured Section with Products and Banner */}
              {products.length > 0 && (
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row gap-6 ">
                    {/* Featured Products - Left Side */}
                    <div className="w-full md:w-2/3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 h-full">
                        {products.slice(0, 2).map((product) => (
                          <div key={product.id} className="aspect-[4/5] w-full">
                            <MemoProductCard
                              product={product}
                              categoryMap={categoryMap}
                              isFeatured={true}
                              className="h-full w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Banner - Right Side */}
                    <div className="md:w-5/6">
                      <div className="bg-[#f5f5f5] rounded-lg overflow-hidden h-full">
                        <div className="h-full flex flex-col justify-between">
                          <div>
                            <img
                              src="https://img.freepik.com/free-psd/e-commerce-flat-design-youtube-banner_23-2151267937.jpg?semt=ais_hybrid&w=740"
                              alt="Fashion Banner"
                              className="w-full h-auto relative object-cover"
                            />

                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Products Grid */}
              <div className="mt-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {products.slice(2).map((product) => (
                    <MemoProductCard key={product.id} product={product} categoryMap={categoryMap} />
                  ))}
                </div>
              </div>

              {/* Empty State */}
              {products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No products available at the moment.</p>
                </div>
              )}

              {/* Pagination */}
              {/* {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <SmartPagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                    maxVisiblePages={5}
                  />
                </div>
              )} */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;