import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Star, ArrowLeft, Minus, Plus, CreditCard, X, ZoomIn, ChevronLeft, ChevronRight, Heart, RefreshCcw, Truck, ChevronDown, AlertTriangle, ShieldCheck, Share2, ThumbsUp, ThumbsDown, Edit } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import FocusTrap from 'focus-trap-react';
import { BASE_URL } from '../../util';
// import BackgroundParticles from '../components/BackgroundParticles';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { motion } from 'framer-motion';

// Utility to construct API URLs
const getApiUrl = (path) => `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Utility for fallback image
const getFallbackImage = () => 'https://placehold.co/600x600/f5f5f5/555555?text=No+Image';

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

// Custom hook for fetching product data
const useProductData = (id) => {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gstSettings, setGstSettings] = useState({
    rate: 18, // Default GST rate
    isInclusive: false // Default to exclusive GST
  });
  const [priceDetails, setPriceDetails] = useState(null);
  const [sizePricing, setSizePricing] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [reviewsPayload, setReviewsPayload] = useState(null);

  // Update GST settings when product data is loaded
  useEffect(() => {
    if (product && product.gst !== undefined && product.gst_type !== undefined) {
      console.log('Updating GST settings from product data:', {
        gst: product.gst,
        gst_type: product.gst_type
      });
      setGstSettings({
        rate: parseFloat(product.gst) || 0,
        isInclusive: product.gst_type === 'inclusive'
      });
    }
  }, [product]);

  // Update price details whenever product or GST settings change
  useEffect(() => {
    if (product) {
      const prices = calculatePrices(
        product.price,
        product.mrp,
        gstSettings.rate,
        gstSettings.isInclusive
      );
      setPriceDetails(prices);
    }
  }, [product, gstSettings.rate, gstSettings.isInclusive]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const productId = parseInt(id, 10);
        if (isNaN(productId)) throw new Error('Invalid product ID');

        console.log(`Fetching product data for ID: ${productId}`);
        console.log(`API URL: ${getApiUrl(`/api/products/${productId}`)}`);

        // Fetch product details using the correct endpoint
        console.log(`Fetching product data for ID: ${productId}`);
        console.log(`API URL: ${getApiUrl(`/api/products/${productId}`)}`);
        
        const productResponse = await axios.get(getApiUrl(`/api/products/${productId}`), {
          signal: controller.signal,
          timeout: 10000
        });
        
        console.log('Product response:', productResponse.data);
        let productData = productResponse.data;

        // Fetch additional data in parallel: images, specifications, sizes
        const [imagesRes, specsRes, sizesRes] = await Promise.all([
          axios.get(getApiUrl(`/api/products/${productId}/images`), { signal: controller.signal, timeout: 10000 }).catch(() => ({ data: [] })),
          axios.get(getApiUrl(`/api/products/${productId}/specifications`), { signal: controller.signal, timeout: 10000 }).catch(() => ({ data: [] })),
          axios.get(getApiUrl(`/api/products/${productId}/sizes`), { signal: controller.signal, timeout: 10000 }).catch(() => ({ data: [] }))
        ]);

        // Normalize image urls
        const images = Array.isArray(imagesRes.data) ? imagesRes.data : [];
        console.log('Fetched images:', images);
        const processedImageUrls = images.map(img => {
          const raw = img.imageUrl || img.url || img.imageurl;
          if (!raw) return null;
          if (raw.startsWith('http')) return raw;
          if (raw.startsWith('/uploads/')) return `${BASE_URL}${raw}`;
          return getApiUrl(raw);
        }).filter(Boolean);

        // Normalize sizes
        const sizes = Array.isArray(sizesRes.data) ? sizesRes.data : [];

        // Normalize specifications
        const specs = Array.isArray(specsRes.data) ? specsRes.data : [];
        const specifications = specs.map(s => ({
          keyName: s?.SpecificationKey?.keyName || s?.SpecificationKey?.keyname || s?.keyName || s?.key || 'Spec',
          value: s?.value || ''
        }));

        // Merge all data
        productData = {
          ...productData,
          images: processedImageUrls.length ? processedImageUrls.map(u => ({ imageUrl: u })) : [],
          sizes: sizes,
          specifications
        };

        
        if (!productData) throw new Error('No product data found');

        // Normalize a couple of fields for compatibility with existing UI
        const normalizedProduct = {
          ...productData,
          gst_type: productData.gst_type || productData.gstType || 'exclusive',
          specifications: Array.isArray(productData.specifications) ? productData.specifications : [],
        };
        // Also expose sizes under productSizes for existing UI expectations
        normalizedProduct.productSizes = Array.isArray(productData.sizes) ? productData.sizes : [];
        // Map rating fields: prefer top-level rating/ratingCount from backend; fallback to ratingSummary
        const topLevelRating = (productData.rating !== undefined && productData.rating !== null)
          ? parseFloat(productData.rating)
          : null;
        const topLevelCount = (productData.ratingCount !== undefined && productData.ratingCount !== null)
          ? parseInt(productData.ratingCount, 10)
          : null;

        if (!Number.isNaN(topLevelRating) && topLevelRating !== null) {
          normalizedProduct.rating = topLevelRating;
        } else if (productData.ratingSummary) {
          normalizedProduct.rating = typeof productData.ratingSummary.average === 'number'
            ? productData.ratingSummary.average
            : parseFloat(productData.ratingSummary.average) || 0;
        } else {
          normalizedProduct.rating = 0;
        }

        if (!Number.isNaN(topLevelCount) && topLevelCount !== null) {
          normalizedProduct.totalReviews = topLevelCount;
        } else if (productData.ratingSummary) {
          normalizedProduct.totalReviews = productData.ratingSummary.count || productData.ratingSummary.total || 0;
        } else {
          normalizedProduct.totalReviews = 0;
        }

        setProduct(normalizedProduct);

        // Initialize product images from the consolidated response
        const finalImageUrls = (productData.images && Array.isArray(productData.images) && productData.images.length > 0)
          ? productData.images.map(img => {
              const raw = img.imageUrl || img.url || img.imageurl;
              if (!raw) return getFallbackImage();
              if (raw.startsWith('http')) return raw;
              if (raw.startsWith('/uploads/')) return `${BASE_URL}${raw}`;
              return getApiUrl(raw);
            })
          : [getFallbackImage()];
        setProductImages(finalImageUrls);

        // Use server-precomputed sizePricing if present, otherwise compute locally
        if (productData.sizePricing && productData.sizePricing.product && Array.isArray(productData.sizePricing.sizes)) {
          setSizePricing({ success: true, ...productData.sizePricing });
          if (setCurrentPrice) {
            setCurrentPrice({
              price: productData.sizePricing.product.basePrice,
              mrp: productData.sizePricing.product.baseMrp
            });
          }
        } else {
          const basePrice = parseFloat(productData.price) || 0;
          const baseMrp = productData.mrp ? parseFloat(productData.mrp) : basePrice;
          const sizesArray = Array.isArray(productData.sizes) ? productData.sizes : [];
          const computedSizes = sizesArray.map(sz => {
            let calculatedPrice = basePrice;
            let calculatedMrp = baseMrp;
            if (!sz.price_modifier_type || sz.price_modifier_type === 'none') {
              // keep base
            } else if (sz.price_modifier_type === 'fixed') {
              calculatedPrice = parseFloat(sz.price) || basePrice;
              calculatedMrp = parseFloat(sz.mrp) || baseMrp;
            } else if (sz.price_modifier_type === 'percentage') {
              const pct = parseFloat(sz.price_modifier_value) || 0;
              const mult = 1 + (pct / 100);
              calculatedPrice = basePrice * mult;
              calculatedMrp = baseMrp * mult;
            }
            return { ...sz, calculatedPrice, calculatedMrp };
          });
          setSizePricing({ success: true, product: { id: productData.id, name: productData.productName || productData.name, basePrice, baseMrp }, sizes: computedSizes });
          if (setCurrentPrice) {
            setCurrentPrice({ price: basePrice, mrp: baseMrp });
          }
        }

        // Fetch related products from the same category/subcategory
        try {
          const relatedResponse = await axios.get(getApiUrl('/api/products'), {
            params: {
              category: productData.maincategory?.name || productData.categoryName,
              subcategory: productData.subcategoryDetails?.name || productData.subcategoryName,
              limit: 8,
              exclude: productId
            },
            signal: controller.signal,
            timeout: 10000
          });
          
          const related = Array.isArray(relatedResponse.data?.products) ? relatedResponse.data.products : 
                         Array.isArray(relatedResponse.data) ? relatedResponse.data : [];
          
          // Filter out current product and limit results
          const filteredRelated = related
            .filter(rp => rp.id !== parseInt(productId, 10))
            .slice(0, 6);
          
          // Fetch images for each related product
          const relatedWithImages = await Promise.all(
            filteredRelated.map(async (rp) => {
              try {
                const imageResponse = await axios.get(getApiUrl(`/api/products/${rp.id}/images`), {
                  signal: controller.signal,
                  timeout: 5000
                });
                
                const images = Array.isArray(imageResponse.data) ? imageResponse.data : [];
                let imageUrl = null;
                
                if (images.length > 0) {
                  const firstImage = images[0];
                  const raw = firstImage.imageUrl || firstImage.url || firstImage.imageurl;
                  if (raw) {
                    if (raw.startsWith('http')) {
                      imageUrl = raw;
                    } else if (raw.startsWith('/uploads/')) {
                      imageUrl = `${BASE_URL}${raw}`;
                    } else {
                      imageUrl = getApiUrl(raw);
                    }
                  }
                }
                
                return { 
                  ...rp, 
                  image: imageUrl || getFallbackImage(),
                  imageUrl: imageUrl || getFallbackImage()
                };
              } catch (imageError) {
                console.warn(`Could not fetch image for product ${rp.id}:`, imageError);
                return { 
                  ...rp, 
                  image: getFallbackImage(),
                  imageUrl: getFallbackImage()
                };
              }
            })
          );
          
          setRelatedProducts(relatedWithImages);
          console.log('Related products with images:', relatedWithImages);
        } catch (relatedError) {
          console.warn('Could not fetch related products:', relatedError);
          setRelatedProducts([]);
        }

        // Reviews payload from server response (prefer single full API source)
        if (productData.reviews) {
          // Attempt to extract rating stats from ratingSummary when available
          const rs = productData.ratingSummary || productData.ratings || null;
          const averageFromSummary = rs ? (typeof rs.average === 'number' ? rs.average : parseFloat(rs.average)) : null;
          // Common keys for distribution from backend variants
          const distRaw = rs && (rs.distribution || rs.ratingDistribution || rs.breakdown || rs.counts) || null;
          let normalizedDistribution = null;
          if (distRaw && typeof distRaw === 'object') {
            // Normalize keys to 1..5 if possible
            normalizedDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            Object.keys(distRaw).forEach(k => {
              const keyNum = parseInt(k, 10);
              if (normalizedDistribution[keyNum] !== undefined) {
                normalizedDistribution[keyNum] = parseInt(distRaw[k], 10) || 0;
              }
            });
          }

          setReviewsPayload({
            reviews: productData.reviews.reviews || productData.reviews || [],
            total: productData.reviews.total || productData.reviews.count || (Array.isArray(productData.reviews.reviews) ? productData.reviews.reviews.length : (Array.isArray(productData.reviews) ? productData.reviews.length : 0)),
            totalPages: productData.reviews.totalPages || productData.reviews.total_pages || 0,
            currentPage: productData.reviews.currentPage || productData.reviews.page || 1,
            averageRating: (averageFromSummary != null && !Number.isNaN(averageFromSummary)) ? averageFromSummary : undefined,
            ratingDistribution: normalizedDistribution || undefined
          });
        } else {
          setReviewsPayload(null);
        }
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') {
          console.error('Error fetching product:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
              url: error.config?.url,
              method: error.config?.method
            }
          });

          if (error.response?.status === 401) {
            const errorMessage = 'This product is not publicly accessible.';
            setError(new Error(errorMessage));
            toast.error(errorMessage);
            return;
          }

          const errorMessage = error.response?.status === 404
            ? 'Product not found'
            : error.response?.data?.message || error.message || 'Are you see the review';

          setError(new Error(errorMessage));
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    return () => controller.abort();
  }, [id]);

  return { product, relatedProducts, productImages, loading, error, sizePricing, currentPrice, setSizePricing, setCurrentPrice, reviewsPayload };
};

// Custom hook for favorites management
const useFavorites = (productId, onLoginRequired) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkIsFavorited = async () => {
      const token = localStorage.getItem('token');
      if (!token || !productId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(getApiUrl('/api/favorites'), { headers: { Authorization: `Bearer ${token}` } });
        const userFavorites = response.data?.favorites || [];
        setIsFavorited(userFavorites.some(fav => fav.productId === parseInt(productId, 10)));
      } catch (error) {
        console.error('Error fetching user favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkIsFavorited();
  }, [productId]);

  const toggleFavorite = async (productName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      onLoginRequired({ action: 'favorite', productName });
      return;
    }

    const optimisticNewState = !isFavorited;
    setIsFavorited(optimisticNewState);

    try {
      if (optimisticNewState) {
        await axios.post(getApiUrl(`/api/favorites/${productId}`), {}, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`${productName} added to favorites`);
      } else {
        await axios.delete(getApiUrl(`/api/favorites/${productId}`), { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`${productName} removed from favorites`);
      }
      window.dispatchEvent(new Event('favoritesUpdate'));
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error(`Failed to update favorites. Please try again.`);
      setIsFavorited(!optimisticNewState); // Revert on error
    }
  };

  return { isFavorited, toggleFavorite, isLoadingFavorites: isLoading };
};

// Custom hook for fetching reviews
const useProductReviews = (productId, initialPayload = null) => {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  const fetchReviews = async () => {
    if (!productId) return;

    setReviewsLoading(true);
    setReviewsError(null);

    try {
      // Try explicit public endpoint first. If unavailable, fallback to standard endpoint with optional auth.
      let response;
      try {
        response = await axios.get(getApiUrl(`/api/reviews/public/${productId}`), {
          timeout: 10000
        });
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          // Public alias not found on server, fallback to standard route
          const token = localStorage.getItem('token');
          response = await axios.get(getApiUrl(`/api/reviews/${productId}`), {
            timeout: 10000,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          });
        } else if (status === 401) {
          const token = localStorage.getItem('token');
          if (token) {
            response = await axios.get(getApiUrl(`/api/reviews/${productId}`), {
              timeout: 10000,
              headers: { Authorization: `Bearer ${token}` }
            });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      console.log('Reviews response:', response.data);
      console.log('First review user data:', response.data?.reviews?.[0]?.user);

      if (response.data && response.data.reviews) {
        setReviews(response.data.reviews);
        // Calculate review statistics
        const totalReviews = response.data.total || response.data.count || response.data.reviews.length;
        const ratings = response.data.reviews.map(review => review.rating);
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0;

        // Calculate rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
          if (distribution[rating] !== undefined) {
            distribution[rating]++;
          }
        });

        setReviewStats({
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution: distribution
        });
      } else {
        setReviews([]);
        setReviewStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
    } catch (error) {
      console.warn('Reviews fetch failed:', error?.response?.status, error?.response?.data || error?.message);

      // If unauthorized or route not available, quietly fall back to empty reviews
      if (error.response?.status === 401 || error.response?.status === 404) {
        setReviewsError(null);
        setReviews([]);
        setReviewStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      } else {
        // Non-auth errors: show a minimal message but don't block UI
        setReviewsError(error.response?.data?.message || 'Unable to load reviews right now');
        setReviews([]);
      }
    } finally {
      setReviewsLoading(false);
    }
  };

  // Seed reviews from server-provided full payload if available
  useEffect(() => {
    if (initialPayload && Array.isArray(initialPayload.reviews)) {
      setReviews(initialPayload.reviews);
      const totalReviews = initialPayload.total ?? initialPayload.reviews.length;
      // Prefer server-computed stats when available
      let averageRating;
      if (typeof initialPayload.averageRating === 'number' && !Number.isNaN(initialPayload.averageRating)) {
        averageRating = initialPayload.averageRating;
      } else {
        const ratings = initialPayload.reviews.map(r => r.rating);
        averageRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
      }
      // Normalize distribution: use provided, else compute
      let ratingDistribution = initialPayload.ratingDistribution;
      if (!ratingDistribution) {
        ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        initialPayload.reviews.forEach(rt => {
          const k = parseInt(rt.rating, 10);
          if (ratingDistribution[k] !== undefined) ratingDistribution[k]++;
        });
      }
      setReviewStats({ totalReviews, averageRating: Math.round(averageRating * 10) / 10, ratingDistribution });
      setReviewsLoading(false);
      return; // Skip network fetch when seeded
    }
    fetchReviews();
  }, [productId, initialPayload]);

  return {
    reviews,
    reviewsLoading,
    reviewsError,
    reviewStats,
    refetchReviews: fetchReviews
  };
};

// Price Details Component
const PriceDetails = ({ product }) => {
  const [priceDetails, setPriceDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (product) {
      const basePrice = parseFloat(product.price) || 0;
      const mrp = parseFloat(product.mrp) || basePrice;
      const gst = parseFloat(product.gst) || 0; // Use actual GST from backend
      const gstType = product.gst_type || product.gstType || 'exclusive'; // Use backend field

      let priceBeforeGST, gstAmount, finalPrice;

      if (gstType === 'inclusive') {
        priceBeforeGST = (basePrice * 100) / (100 + gst);
        gstAmount = basePrice - priceBeforeGST;
        finalPrice = basePrice;
      } else {
        priceBeforeGST = basePrice;
        gstAmount = (basePrice * gst) / 100;
        finalPrice = basePrice + gstAmount;
      }

      const discount = mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0;
      const savings = mrp > finalPrice ? mrp - finalPrice : 0;

      setPriceDetails({
        basePrice: Number(priceBeforeGST.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        finalPrice: Number(finalPrice.toFixed(2)),
        mrp: Number(mrp.toFixed(2)),
        discount,
        savings: Number(savings.toFixed(2)),
        gstPercentage: gst,
        isGstInclusive: gstType === 'inclusive'
      });
    }
  }, [product]);

  if (!priceDetails) return null;

  return (
    <div className="bg-white rounded-lg p-4">
      {/* Main Price Display */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">₹{priceDetails.finalPrice}</span>
          {priceDetails.mrp > priceDetails.finalPrice && (
            <span className="text-sm line-through text-gray-500">₹{priceDetails.mrp}</span>
          )}
          {priceDetails.discount > 0 && (
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {priceDetails.discount}% OFF
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          {showDetails ? 'Hide Details' : 'Price Details'}
          <svg
            className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expandable Price Details */}
      {showDetails && (
        <div className="mt-4 space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Base Price:</span>
            <span className="font-medium text-gray-900">₹{priceDetails.basePrice}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              GST ({priceDetails.gstPercentage}%) {priceDetails.isGstInclusive ? '(Inclusive)' : '(Exclusive)'}:
            </span>
            <span className="font-medium text-gray-900">₹{priceDetails.gstAmount}</span>
          </div>

          {priceDetails.mrp > priceDetails.finalPrice && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">MRP:</span>
              <span className="line-through text-gray-500">₹{priceDetails.mrp}</span>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2 mt-2 border-t">
            {priceDetails.isGstInclusive
              ? "* The price shown is inclusive of GST"
              : "* GST will be added to the base price"
            }
          </div>
        </div>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id: productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get any additional query parameters
  const queryParams = new URLSearchParams(location.search);
  const fromCategory = queryParams.get('category');
  const fromSearch = queryParams.get('search');

  // States for GST settings form
  const [showGstSettings, setShowGstSettings] = useState(false);
  const handleGstRateChange = (e) => {
    const rate = parseFloat(e.target.value) || 0;
    product.gstSettings.rate = Math.min(Math.max(rate, 0), 100); // Clamp between 0-100
    setProduct({ ...product });
  };

  const handleGstTypeChange = (isInclusive) => {
    product.gstSettings.isInclusive = isInclusive;
    setProduct({ ...product });
  };

  // Build back URL with previous filters if they exist
  const getBackUrl = () => {
    if (fromSearch) return `/customer/shop?search=${encodeURIComponent(fromSearch)}`;
    if (fromCategory) return `/customer/shop?category=${encodeURIComponent(fromCategory)}`;
    return '/customer/shop';
  };
  const { addToCart } = useCart();
  const { product, relatedProducts, productImages, loading, error, sizePricing, currentPrice, setSizePricing, setCurrentPrice, reviewsPayload } = useProductData(productId);
  const { isFavorited, toggleFavorite, isLoadingFavorites } = useFavorites(productId, (details) => {
    setCurrentPendingActionDetails(details);
    setIsLoginModalOpen(true);
  });
  const { reviews, reviewsLoading, reviewsError, reviewStats, refetchReviews } = useProductReviews(productId, reviewsPayload);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeError, setShowSizeError] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);

  // Function to handle size selection and price update
  const handleSizeSelection = async (sizeValue) => {
    console.log('handleSizeSelection called with:', sizeValue);
    console.log('sizePricing:', sizePricing);
    console.log('sizePricing.sizes:', sizePricing?.sizes);

    setSelectedSize(sizeValue);
    setShowSizeError(false);

    // Update price based on selected size
    if (sizePricing && sizePricing.sizes && setCurrentPrice) {
      const selectedSizeData = sizePricing.sizes.find(size => size.size_value === sizeValue);
      console.log('selectedSizeData:', selectedSizeData);

      if (selectedSizeData) {
        const newPrice = {
          price: selectedSizeData.calculatedPrice,
          mrp: selectedSizeData.calculatedMrp
        };
        console.log('Setting new price:', newPrice);
        setCurrentPrice(newPrice);
      }
    } else if (setCurrentPrice) {
      // Compute on-the-fly from available product sizes as a fallback
      const sizesSource = product?.productSizes || product?.sizes || [];
      const s = sizesSource.find(sz => sz.size_value === sizeValue);
      if (s) {
        const basePrice = parseFloat(product?.price) || 0;
        const baseMrp = parseFloat(product?.mrp) || basePrice;
        let calculatedPrice = basePrice;
        let calculatedMrp = baseMrp;
        if (!s.price_modifier_type || s.price_modifier_type === 'none') {
          // keep base
        } else if (s.price_modifier_type === 'fixed') {
          calculatedPrice = parseFloat(s.price) || basePrice;
          calculatedMrp = parseFloat(s.mrp) || baseMrp;
        } else if (s.price_modifier_type === 'percentage') {
          const pct = parseFloat(s.price_modifier_value) || 0;
          const mult = 1 + (pct / 100);
          calculatedPrice = basePrice * mult;
          calculatedMrp = baseMrp * mult;
        }
        setCurrentPrice({ price: calculatedPrice, mrp: calculatedMrp });
      }
    }
  };
  const [fullscreenZoom, setFullscreenZoom] = useState(1);
  const [fullscreenPosition, setFullscreenPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentPendingActionDetails, setCurrentPendingActionDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('specifications');
  const fullscreenImageRef = useRef(null);

  // Price display component
  const PriceDisplay = ({ product }) => {
    if (!product) return null;

    // Use currentPrice if available (size-based pricing), otherwise use product price
    const price = currentPrice ? currentPrice.price : (parseFloat(product.price) || 0);
    const mrp = currentPrice ? (currentPrice.mrp || price) : (parseFloat(product.mrp) || price);
    const gstRate = parseFloat(product.gst) || 0;
    const isInclusive = product.gst_type === 'inclusive';



    const priceDetails = calculatePrices(price, mrp, gstRate, isInclusive);
    const hasDiscount = priceDetails.mrp > priceDetails.finalPrice;

    return (
      <div className="mt-4 space-y-3 rounded-lg p-4 bg-gray-50">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900">
            ₹{priceDetails.finalPrice.toLocaleString()}
          </p>
          {hasDiscount && (
            <p className="text-lg text-gray-500 line-through">₹{priceDetails.mrp.toLocaleString()}</p>
          )}
          {hasDiscount && (
            <span className="text-sm font-medium bg-red-100 text-red-600 px-2 py-1 rounded">
              {priceDetails.discount}% OFF
            </span>
          )}
          {currentPrice && selectedSize && (
            <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded">
              Size: {selectedSize}
            </span>
          )}
        </div>

        {hasDiscount && (
          <p className="text-sm font-semibold text-green-600">
            You save ₹{(priceDetails.mrp - priceDetails.finalPrice).toLocaleString()}
          </p>
        )}

        <p className="text-sm text-gray-600">
          {isInclusive
            ? `Inclusive of ${gstRate}% GST (₹${priceDetails.gstAmount.toLocaleString()})`
            : `+${gstRate}% GST (₹${priceDetails.gstAmount.toLocaleString()})`}
        </p>

        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          {isInclusive
            ? `Base price: ₹${priceDetails.priceBeforeGST.toLocaleString()}`
            : `Final price: ₹${priceDetails.finalPrice.toLocaleString()}`}
        </div>
      </div>
    );
  };

  // GST Settings component
  const GstSettings = ({ gstSettings, onRateChange, onTypeChange }) => {
    return (
      <div className="mt-4 border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-3">GST Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">GST Rate (%)</label>
            <input
              type="number"
              value={gstSettings.rate}
              onChange={onRateChange}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={gstSettings.isInclusive}
                onChange={() => onTypeChange(true)}
                className="form-radio"
              />
              <span className="ml-2">Inclusive</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={!gstSettings.isInclusive}
                onChange={() => onTypeChange(false)}
                className="form-radio"
              />
              <span className="ml-2">Exclusive</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState({
    rating: 0,
    nickname: '',
    summary: '',
    review: ''
  });

  // State for editing reviews
  const [editingReview, setEditingReview] = useState(null);
  const [editReviewData, setEditReviewData] = useState({
    rating: 0,
    title: '',
    reviewText: ''
  });

  // State to track helpful/not helpful button clicks for each review
  const [reviewHelpfulness, setReviewHelpfulness] = useState({});

  // Review form handlers
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Edit review handlers
  const handleEditReviewChange = (e) => {
    const { name, value } = e.target;
    setEditReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const startEditingReview = (reviewToEdit) => {
    setEditingReview(reviewToEdit.id);
    setEditReviewData({
      rating: reviewToEdit.rating,
      title: reviewToEdit.title || '',
      reviewText: reviewToEdit.reviewText || reviewToEdit.review_text || ''
    });
  };

  const cancelEditingReview = () => {
    setEditingReview(null);
    setEditReviewData({
      rating: 0,
      title: '',
      reviewText: ''
    });
  };

  const handleUpdateReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to update your review');
        return;
      }

      // Validate required fields
      if (!editReviewData.rating || editReviewData.rating < 1) {
        toast.error('Please select a rating');
        return;
      }

      if (!editReviewData.reviewText || editReviewData.reviewText.trim().length < 5) {
        toast.error('Please write a review with at least 5 characters');
        return;
      }

      const updateData = {
        rating: parseInt(editReviewData.rating),
        reviewText: editReviewData.reviewText.trim(),
        title: editReviewData.title?.trim() || 'Review'
      };

      console.log('Updating review:', updateData);
      console.log('Review ID:', reviewId);

      await axios.put(`${BASE_URL}/api/reviews/${reviewId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Review updated successfully!');
      setEditingReview(null);
      setEditReviewData({ rating: 0, title: '', reviewText: '' });
      // Refetch reviews to show the updated review
      refetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to update your review');
      } else if (error.response?.status === 403) {
        toast.error('You can only update your own reviews');
      } else if (error.response?.status === 404) {
        toast.error('Review not found');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid review data');
      } else {
        toast.error('Are you see the review');
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to submit a review');
        return;
      }

      // Validate required fields
      if (!review.rating || review.rating < 1) {
        toast.error('Please select a rating');
        return;
      }

      if (!review.review || review.review.trim().length < 10) {
        toast.error('Please write a review with at least 10 characters');
        return;
      }

      const reviewData = {
        rating: parseInt(review.rating),
        reviewText: review.review.trim(),
        title: review.summary?.trim() || 'Review'
      };

      console.log('Submitting review:', reviewData);
      console.log('Product ID:', product.id);
      console.log('URL:', `${BASE_URL}/api/reviews/products/${product.id}/reviews`);

      await axios.post(`${BASE_URL}/api/reviews/products/${product.id}/reviews`, reviewData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setReview({ rating: 0, nickname: '', summary: '', review: '' });
      // Refetch reviews to show the new review
      refetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to submit a review');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid review data');
      } else {
        toast.error('Failed to submit review');
      }
    }
  };

  // Utility function to check if current user owns the review
  const isCurrentUserReview = (review) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      return currentUser.id && (review.userId === currentUser.id || review.user?.id === currentUser.id);
    } catch {
      return false;
    }
  };

  // Handlers for helpful/not helpful buttons
  const handleHelpfulClick = (reviewId) => {
    setReviewHelpfulness(prev => ({
      ...prev,
      [reviewId]: prev[reviewId] === 'helpful' ? null : 'helpful'
    }));
  };

  const handleNotHelpfulClick = (reviewId) => {
    setReviewHelpfulness(prev => ({
      ...prev,
      [reviewId]: prev[reviewId] === 'not-helpful' ? null : 'not-helpful'
    }));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]); // Scroll to top when productId changes

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) setQuantity(newQuantity);
  };

  const checkAuthAndExecute = (actionCallback, actionDetails) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && user?.role === 'customer') {
      // Reset size error if showing
      setShowSizeError(false);
      actionCallback();
    } else {
      setCurrentPendingActionDetails(actionDetails);
      setIsLoginModalOpen(true);
    }
  };

  const handleAddToCart = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user || user.role !== 'customer') {
      setCurrentPendingActionDetails({ actionType: 'ADD_TO_CART' });
      setIsLoginModalOpen(true);
      return;
    }

    // Check if size selection is required (either legacy size field or new productSizes)
    const hasLegacySizes = product?.size && typeof product.size === 'string' && product.size.trim().length > 0;
    const hasNewSizes = product?.productSizes && product.productSizes.length > 0;
    const hasSizes = hasLegacySizes || hasNewSizes;

    console.log('ProductDetails - Size check:', {
      hasLegacySizes,
      hasNewSizes,
      hasSizes,
      productSize: product?.size,
      productSizes: product?.productSizes,
      selectedSize
    });

    if (hasSizes && !selectedSize) {
      console.log('ProductDetails - Size selection required but not provided');
      setShowSizeError(true);
      // Scroll to size selection
      const sizeElement = document.querySelector('.size-selection');
      if (sizeElement) {
        sizeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast.error('Please select a size for this item');
      return;
    }

    // Clear any previous size errors
    setShowSizeError(false);

    // Add to cart with size if it's a fashion product
    // Ensure the product object has the correct structure for the cart
    const productForCart = {
      id: product.id,
      name: product.productName || product.name || 'Unnamed Product',
      price: currentPrice ? currentPrice.price : product.price, // Use size-based price if available
      mrp: currentPrice ? currentPrice.mrp : product.mrp, // Use size-based MRP if available
      size: product.size,
      image: productImages[0] || getFallbackImage(),
      category: product.category,
      selectedSizePrice: currentPrice, // Include size pricing info for reference
      ...product // Include all other product properties
    };

    console.log('ProductDetails - Calling addToCart with:', { productForCart, quantity, selectedSize });

    const success = await addToCart(productForCart, quantity, selectedSize);
    if (success) {
      toast.success(`${product.productName || product.name || 'Product'} added to cart successfully!`);
    } else {
      console.log('ProductDetails - addToCart returned false');
    }
  };

  // NEW: Handler function for the favorites click
  const handleToggleFavoriteClick = () => {
    if (product) {
      toggleFavorite(product.productName);
    }
  };

  const handleProceedToCheckout = () => {
    // Check if size selection is required and selected (either legacy size field or new productSizes)
    const hasLegacySizes = product?.size && typeof product.size === 'string' && product.size.trim().length > 0;
    const hasNewSizes = product?.productSizes && product.productSizes.length > 0;
    const hasSizes = hasLegacySizes || hasNewSizes;

    if (hasSizes && !selectedSize) {
      setShowSizeError(true);
      return;
    }

    const checkoutDetails = {
      actionType: 'PROCEED_TO_CHECKOUT',
      productId: product?.id,
      quantity: quantity,
      selectedSize: selectedSize,
      productName: product?.productName || product?.productname || product?.name || 'Unnamed Product',
      price: currentPrice ? currentPrice.price : product?.price,
      image: productImages[0] || getFallbackImage(),
      category: product?.categoryName || product?.category || 'Unknown'
    };

    checkAuthAndExecute(async () => {
      if (product) {
        // Build a single-item selection payload for Buy Now without touching the cart
        const singleItem = {
          id: product.id,
          productId: product.id,
          quantity: quantity,
          price: currentPrice ? currentPrice.price : product.price,
          mrp: currentPrice ? currentPrice.mrp : product.mrp,
          selectedSize: selectedSize || null,
          productName: product.productName || product.name || 'Unnamed Product',
          imageUrl: productImages[0] || getFallbackImage(),
          categoryName: product.categoryName || product.category
        };

        navigate('/customer/checkout', { state: { selectedItems: [singleItem] } });
      } else {
        toast.error('Cannot proceed to checkout: Product details are missing.');
      }
    }, { actionType: 'PROCEED_TO_CHECKOUT', productId: product?.id, quantity: quantity }); // Pass actionDetails for checkout
  };

  const handleThumbnailClick = (index) => setSelectedImage(index);

  const openFullscreenModal = () => {
    setShowFullscreenModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreenModal = () => {
    setShowFullscreenModal(false);
    document.body.style.overflow = 'auto';
    setFullscreenZoom(1);
    setFullscreenPosition({ x: 0, y: 0 });
  };

  const handleFullscreenZoom = (direction) => {
    if (direction === 'in' && fullscreenZoom < 3) {
      setFullscreenZoom(prev => Math.min(3, prev + 0.5));
    } else if (direction === 'out' && fullscreenZoom > 1) {
      setFullscreenZoom(prev => Math.max(1, prev - 0.5));
    } else if (direction === 'reset') {
      setFullscreenZoom(1);
      setFullscreenPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (fullscreenZoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - fullscreenPosition.x, y: e.clientY - fullscreenPosition.y });
    }
  };

  const handleFullscreenMouseMove = (e) => {
    if (isDragging && fullscreenZoom > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate boundaries based on zoom level
      const imageWidth = window.innerWidth;
      const imageHeight = window.innerHeight;
      const zoomedWidth = imageWidth * fullscreenZoom;
      const zoomedHeight = imageHeight * fullscreenZoom;

      // Maximum drag distance to keep image visible
      const maxX = (zoomedWidth - imageWidth) / 2;
      const maxY = (zoomedHeight - imageHeight) / 2;

      setFullscreenPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const navigateFullscreenImage = (direction) => {
    setSelectedImage(prev => {
      if (direction === 'next') return (prev + 1) % productImages.length;
      return (prev - 1 + productImages.length) % productImages.length;
    });
    // Reset zoom when changing images
    setFullscreenZoom(1);
    setFullscreenPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showFullscreenModal) return;
      switch (e.key) {
        case 'Escape': closeFullscreenModal(); break;
        case 'ArrowLeft': navigateFullscreenImage('prev'); break;
        case 'ArrowRight': navigateFullscreenImage('next'); break;
        case '+': handleFullscreenZoom('in'); break;
        case '-': handleFullscreenZoom('out'); break;
        case '0': handleFullscreenZoom('reset'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenModal, productImages.length]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('mousemove', handleFullscreenMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (showFullscreenModal) {
      window.addEventListener('mousemove', handleFullscreenMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleFullscreenMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showFullscreenModal, isDragging, dragStart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative z-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'The product you are looking for does not exist or has been removed.'}
          </p>
          <Link
            to={getBackUrl()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white relative z-0 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Product Not Found</h1>
          <p className="mb-6 text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/products" className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0">
      {/* <BackgroundParticles /> */}
      <div className="min-h-screen bg-white relative z-10">
        {/* Header Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link
                to={getBackUrl()}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to {fromSearch ? 'search results' : 'shop'}
              </Link>

              {/* Breadcrumb */}
              <nav className="hidden md:flex z-10">
                <ol className="flex items-center space-x-2 text-sm text-gray-500">
                  <li><Link to="/" className="hover:text-blue-600">Home</Link></li>
                  <li><ChevronRight size={16} className="text-gray-400" /></li>
                  {product?.categoryName && (
                    <>
                      <li><Link to={`/products?category=${product.category}`} className="hover:text-blue-600">{product.categoryName}</Link></li>
                      <li><ChevronRight size={16} className="text-gray-400" /></li>
                    </>
                  )}
                  <li className="text-gray-700 truncate max-w-[200px]">{product?.productName || 'Product'}</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* Fullscreen Image Modal */}
        {showFullscreenModal && (
          <FocusTrap>
            <div
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center "
              onClick={(e) => e.target === e.currentTarget && closeFullscreenModal()}
            >
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 transition-all z-50"
                onClick={closeFullscreenModal}
              >
                <X size={24} />
              </button>

              {productImages.length > 1 && (
                <>
                  <button
                    className="absolute left-4 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 transition-all z-50"
                    onClick={() => navigateFullscreenImage('prev')}
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    className="absolute right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 transition-all z-50"
                    onClick={() => navigateFullscreenImage('next')}
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}

              <div
                className="relative"
                onMouseDown={handleMouseDown}
                ref={fullscreenImageRef}
              >
                <img
                  src={productImages[selectedImage] || getFallbackImage()}
                  alt={`${product?.productName || 'Product'} - Full view`}
                  className="max-h-[80vh] max-w-[80vw] object-contain"
                  style={{
                    transform: `scale(${fullscreenZoom}) translate(${fullscreenPosition.x / fullscreenZoom}px, ${fullscreenPosition.y / fullscreenZoom}px)`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.2s ease'
                  }}
                  draggable="false"
                />
              </div>
            </div>
          </FocusTrap>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative">
                <div
                  className="aspect-square bg-gray-50 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                  onClick={openFullscreenModal}
                >
                  <img
                    src={productImages[selectedImage] || getFallbackImage()}
                    alt={product?.productName || 'Product image'}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = getFallbackImage(); }}
                  />
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                    <ZoomIn size={20} className="text-gray-600" />
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = getFallbackImage(); }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              {/* Brand */}
              {product?.brand && (
                <div className="text-blue-600 font-medium text-sm uppercase tracking-wide">
                  {product.brand}
                </div>
              )}

              {/* Product Title */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {product?.productName || 'Product Name'}
                </h1>
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`${i < Math.floor(reviewStats.averageRating || product?.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {(reviewStats.averageRating || product?.rating || 0).toFixed(1)}
                  </span>
                </div>
                {reviewStats.totalReviews > 0 && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                  </button>
                )}
                {reviewStats.totalReviews === 0 && !reviewsError && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    Be the first to review
                  </button>
                )}
                {reviewsError === 'Please log in to view reviews' && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    View reviews
                  </button>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1">
                {/* Dynamic Price Display with Size-based Pricing */}
                <PriceDisplay product={product} />
              </div>

              {/* Available Sizes */}
              {(product?.size || (product?.productSizes && product.productSizes.length > 0)) && (
                <div className="mt-2 mb-2 size-selection">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Size:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSize || '-'}</span>

                      {showSizeError && (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                          Please select a size
                        </span>
                      )}

                      <div className="flex flex-wrap gap-2.5">
                        {/* Show new sizes from sizes table if available */}
                        {product?.productSizes && product.productSizes.length > 0 ? (
                          // Group sizes by type for better display
                          Object.entries(
                            product.productSizes
                              .filter(size => size.is_available)
                              .reduce((acc, size) => {
                                if (!acc[size.size_type]) acc[size.size_type] = [];
                                acc[size.size_type].push(size);
                                return acc;
                              }, {})
                          ).map(([sizeType, sizes]) => (
                            <div key={sizeType} className="flex flex-col gap-1">
                              <span className="text-xs text-gray-500 capitalize">{sizeType}:</span>
                              <div className="flex flex-wrap gap-1">
                                {sizes
                                  .sort((a, b) => a.display_order - b.display_order)
                                  .map((size) => (
                                    <button
                                      key={size.id}
                                      onClick={() => handleSizeSelection(size.size_value)}
                                      className={`min-w-[40px] h-7 px-2 text-xs font-medium rounded border transition-all duration-200
                                          ${selectedSize === size.size_value
                                          ? 'bg-blue-50 border-blue-500 text-blue-600'
                                          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-500'
                                        }`}
                                    >
                                      {size.size_value}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Fallback to legacy size field
                          product.size.split(',').map((size, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSizeSelection(size.trim())}
                              className={`min-w-[40px] h-7 px-2 text-xs font-medium rounded border transition-all duration-200
                                  ${selectedSize === size.trim()
                                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-500'
                                }`}
                            >
                              {size.trim()}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Features */}
              {product?.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">About this product</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 py-2 text-center min-w-[50px]">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="p-2 hover:bg-gray-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={((product?.size && typeof product.size === 'string' && product.size.trim().length > 0) || (product?.productSizes && product.productSizes.length > 0)) && !selectedSize}
                    className={`w-full ${((product?.size && typeof product.size === 'string' && product.size.trim().length > 0) || (product?.productSizes && product.productSizes.length > 0)) && !selectedSize
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-yellow-400 hover:bg-yellow-500'
                      } text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
                  >
                    <ShoppingCart size={18} className="mr-2" />
                    {((product?.size && typeof product.size === 'string' && product.size.trim().length > 0) || (product?.productSizes && product.productSizes.length > 0)) && !selectedSize ? 'Please Select Size' : 'Add to Cart'}
                  </button>
                  
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <CreditCard size={18} className="mr-2" />
                    Buy Now
                  </button>
                </div>

                {/* Additional Actions */}
                <div className="pt-4">
                  <button
                    onClick={handleToggleFavoriteClick}
                    disabled={isLoadingFavorites}
                    className="w-full border border-gray-300 hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    <Heart size={18} className={`mr-2 ${isFavorited ? 'text-red-500 fill-current' : ''}`} />
                    {isLoadingFavorites ? 'Updating...' : isFavorited ? 'In Favorites' : 'Add to Favorites'}
                  </button>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center text-sm text-blue-800">
                  <Truck size={16} className="mr-2" />
                  <span className="font-medium">Free delivery</span>
                  <span className="ml-1">on orders over ₹5000</span>
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <RefreshCcw size={16} className="mr-2" />
                  <span className="font-medium">Easy returns</span>
                  <span className="ml-1">within 30 days</span>
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <ShieldCheck size={16} className="mr-2" />
                  <span className="font-medium">Secure packaging</span>
                  <span className="ml-1">for safe delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {['specifications', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } transition-colors`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="py-8">

              {activeTab === 'specifications' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                  {product?.specifications?.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-200">
                          {product.specifications.map((spec, index) => {
                            const keyName = spec.SpecificationKey?.keyName || spec.key || spec.keyName || 'Specification';
                            const value = spec.value || spec.spec_value || 'N/A';
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 w-1/3">
                                  {keyName}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {value}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">No specifications available for this product.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Customer Reviews</h3>
                    {/* <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Write a Review
                      </button> */}
                  </div>

                  {/* Review Statistics */}
                  {reviewStats.totalReviews > 0 && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Overall Rating */}
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {reviewStats.averageRating.toFixed(1)}
                          </div>
                          <div className="flex justify-center items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={20}
                                className={`${i < Math.floor(reviewStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-gray-600">
                            Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center space-x-2">
                              <span className="text-sm font-medium w-8">{rating}★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full"
                                  style={{
                                    width: `${reviewStats.totalReviews > 0 ? (reviewStats.ratingDistribution[rating] / reviewStats.totalReviews) * 100 : 0}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8">
                                {reviewStats.ratingDistribution[rating]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : reviewsError ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                      {/* <p className="text-gray-600 mb-2">Are you see the reviews</p> */}
                      <p className="text-gray-600 text-sm">{reviewsError}</p>
                      {/* <button
                          onClick={refetchReviews}
                          className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Try again
                        </button> */}
                    </div>
                  ) : reviewsError === 'Please log in to view reviews' ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Star size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                      <p className="text-gray-600 mb-4">Please log in to view and write reviews for this product.</p>
                      <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Log In to View Reviews
                      </button>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review, index) => (
                        <div key={review.id || index} className="border border-gray-200 rounded-lg p-6">
                          {/* Review Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {/* User Avatar */}
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {(review.user?.firstname || review.user?.name || review.user?.username || review.userName || 'Anonymous').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {review.user?.firstname && review.user?.lastname
                                    ? `${review.user.firstname} ${review.user.lastname}`
                                    : review.user?.firstname
                                      ? review.user.firstname
                                      : review.user?.name || review.user?.username || review.userName || 'Anonymous User'}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={14}
                                        className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {new Date(review.createdAt || review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Edit button - only show for user's own reviews */}
                            {isCurrentUserReview(review) && editingReview !== review.id && (
                              <button
                                onClick={() => startEditingReview(review)}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>

                          {/* Review Content or Edit Form */}
                          {editingReview === review.id ? (
                            /* Edit Form */
                            <div className="space-y-4">
                              {/* Rating Selection */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Rating *
                                </label>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setEditReviewData(prev => ({ ...prev, rating: star }))}
                                      className="focus:outline-none"
                                    >
                                      <Star
                                        size={24}
                                        className={`${star <= editReviewData.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300 hover:text-yellow-400'
                                          } transition-colors`}
                                      />
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    ({editReviewData.rating}/5)
                                  </span>
                                </div>
                              </div>

                              {/* Title */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Title (Optional)
                                </label>
                                <input
                                  type="text"
                                  name="title"
                                  value={editReviewData.title}
                                  onChange={handleEditReviewChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Brief summary of your review"
                                />
                              </div>

                              {/* Review Text */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Review *
                                </label>
                                <textarea
                                  name="reviewText"
                                  value={editReviewData.reviewText}
                                  onChange={handleEditReviewChange}
                                  rows={4}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  placeholder="Share your experience with this product..."
                                  required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Minimum 10 characters ({editReviewData.reviewText.length}/10)
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-3 pt-2">
                                <button
                                  onClick={() => handleUpdateReview(review.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                >
                                  Update Review
                                </button>
                                <button
                                  onClick={cancelEditingReview}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Display Review */
                            <>
                              {/* Review Title */}
                              {review.title && (
                                <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                              )}

                              {/* Review Text */}
                              <p className="text-gray-700 leading-relaxed">
                                {review.reviewText || review.review_text || review.comment || 'No review text provided.'}
                              </p>
                            </>
                          )}

                          {/* Review Actions - only show when not editing */}
                          {editingReview !== review.id && (
                            <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => handleHelpfulClick(review.id || index)}
                                className={`flex items-center space-x-1 text-sm transition-all duration-200 px-3 py-1.5 rounded-full ${reviewHelpfulness[review.id || index] === 'helpful'
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                                  }`}
                              >
                                <ThumbsUp size={14} className={reviewHelpfulness[review.id || index] === 'helpful' ? 'fill-current' : ''} />
                                <span>Helpful</span>
                              </button>
                              <button
                                onClick={() => handleNotHelpfulClick(review.id || index)}
                                className={`flex items-center space-x-1 text-sm transition-all duration-200 px-3 py-1.5 rounded-full ${reviewHelpfulness[review.id || index] === 'not-helpful'
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                  }`}
                              >
                                <ThumbsDown size={14} className={reviewHelpfulness[review.id || index] === 'not-helpful' ? 'fill-current' : ''} />
                                <span>Not helpful</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Star size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                      <p className="text-gray-600 mb-4">Be the first to review this product!</p>
                      {/* <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          Write the first review
                        </button> */}
                    </div>
                  )}
                </div>
              )}
            </div>


          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">You might also like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    to={`/customer/product/${relatedProduct.id}`}
                    className="group"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="aspect-square overflow-hidden bg-gray-50 relative">
                        <img
                          src={relatedProduct.image || getFallbackImage()}
                          alt={relatedProduct.productName || relatedProduct.productname}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.src = getFallbackImage(); }}
                        />
                        {relatedProduct.mrp && parseFloat(relatedProduct.mrp) > parseFloat(relatedProduct.price) && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            {Math.round(((parseFloat(relatedProduct.mrp) - parseFloat(relatedProduct.price)) / parseFloat(relatedProduct.mrp)) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {relatedProduct.productName || relatedProduct.productname}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{(parseFloat(relatedProduct.price || 0)).toLocaleString()}
                          </p>
                          {relatedProduct.mrp && parseFloat(relatedProduct.mrp) > parseFloat(relatedProduct.price) && (
                            <p className="text-sm text-gray-500 line-through">
                              ₹{parseFloat(relatedProduct.mrp).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {relatedProduct.brand && (
                          <p className="text-xs text-gray-600 mt-1">{relatedProduct.brand}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review Form Popup */}
        {showReviewForm && (
          <div className="fixed top-20 right-10 bg-white rounded-lg shadow-xl w-[500px] z-50 animate-slideIn">
            <div className="relative p-6">
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">You're wonderful reviewing:</h2>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h3 className="text-lg text-gray-600 mt-1">{product?.name}</h3>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleReviewChange({ target: { name: 'rating', value: star } })}
                        className={`text-2xl ${review.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

        <LoginRequiredModal
          show={isLoginModalOpen}
          onCancel={() => {
            setIsLoginModalOpen(false);
            setCurrentPendingActionDetails(null); // Clear pending action on cancel
          }}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            if (currentPendingActionDetails) {
              if (currentPendingActionDetails.actionType === 'ADD_TO_CART') handleAddToCart();
              else if (currentPendingActionDetails.actionType === 'PROCEED_TO_CHECKOUT') handleProceedToCheckout();
              else if (currentPendingActionDetails.action === 'favorite') toggleFavorite(currentPendingActionDetails.productName);
            }
          }}
          loginRedirectState={{
            from: location.pathname + location.search, // Include search params
            pendingAction: currentPendingActionDetails
          }}
        />
      </div>
    </div>
  );
};

export default ProductDetail;
