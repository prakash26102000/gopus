import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import RemoveAlert from '../components/RemoveAlert';
import axios from 'axios';
import { BASE_URL } from '../../util';


const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRemoveAlert, setShowRemoveAlert] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [finalPrice, setFinalPrice] = useState(0);

  // Helper function to get auth token
  const getAuthToken = () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) return null;
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Helper function to format image URL correctly
  const formatImageUrl = (imgUrl) => {
    if (!imgUrl) return null;
    return imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`}`;
  };
  
  // Inline SVG data URI for fallback image
  const getPlaceholderImage = () => {
    return 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" fill="none"%3E%3Crect width="150" height="150" fill="%23f5f5f5"/%3E%3Ctext x="50%" y="50%" font-family="Arial" font-size="14" fill="%23555555" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  };
  
  // Helper for API requests with auth header
  const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) return null;
    
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  };

  // Fetch cart from API on component mount only if authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      fetchCart();
    }
  }, []);
  
  // Fetch cart items from API
  const fetchCart = useCallback(async () => {
    const authConfig = getAuthConfig();
    
    if (!authConfig) {
      // Only log and set error if we're on a page that should have authentication
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/signup', '/forgotpassword', '/reset-password'];
      const isPublicPage = publicPaths.some(path => currentPath.includes(path));
      
      if (!isPublicPage) {
        console.log('No authentication token available');
        setError('Please log in to view your cart');
      }
      setCart([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${BASE_URL}/api/cart/get`, authConfig);
      
      if (response.data && response.data.success && Array.isArray(response.data.cartItems)) {
        const apiCartItems = response.data.cartItems;
        
        const frontendCartItems = apiCartItems.map(item => {
          const product = item.product || {};
          console.log('Cart item from backend:', { 
            itemId: item.id,
            productId: item.productId, 
            selectedSize: product.selectedSize,
            itemSelectedSize: item.selectedSize,
            productName: product.name 
          });
          let imageUrl = product.imageUrl || null;
          
          if (imageUrl) {
            imageUrl = formatImageUrl(imageUrl);
          } else {
            imageUrl = getPlaceholderImage();
          }
          
          return {
            id: item.id, // Use the unique cart item ID, not productId
            name: product.name,
            price: parseFloat(product.price) || 0,
            quantity: item.quantity,
            image: imageUrl,
            size: product.selectedSize || item.selectedSize || null, // The specific size selected for this cart item
            selectedSize: product.selectedSize || item.selectedSize || null, // Add selected size if available
            availableProductSizes: product.size ? product.size.split(',').map(s => s.trim()) : [], // Available sizes for the product
            availableSizes: product.size ? product.size.split(',').map(s => s.trim()) : [], // Add available sizes array
            categoryName: product.category ? product.category.toString() : 'Uncategorized',
            productId: item.productId, // Keep the actual product ID separate
            cartItemId: item.id, // Add explicit cart item ID for clarity
            brand: product.brand || '',
            description: product.description || '',
            // Use pre-calculated values from backend
            gst: parseFloat(product.gst) || 0,
            gst_type: product.gst_type || 'exclusive',
            gstRate: parseFloat(product.gst) || 0, // Keep for backward compatibility
            isGstInclusive: product.gst_type === 'inclusive', // Keep for backward compatibility
            mrp: parseFloat(product.mrp) || 0,
            // Pre-calculated GST values from backend
            priceBeforeGST: parseFloat(product.priceBeforeGST) || 0,
            gstAmount: parseFloat(product.gstAmount) || 0,
            finalPrice: parseFloat(product.finalPrice) || 0,
            discount: product.discount || 0
          };
        });
        
        setCart(frontendCartItems);
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load cart');
      }
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  const addToCart = async (product, quantity = 1, selectedSize = null) => {
    if (!product || typeof product.id === 'undefined') {
      console.error('addToCart called with invalid product:', product);
      toast.error('Could not add item to cart: Invalid product data.');
      return false;
    }

    const authConfig = getAuthConfig();
    if (!authConfig) {
      toast.error('Please log in to add items to cart');
      return false;
    }

    // Check if product has sizes available (but don't enforce selection)
    const hasLegacySizes = product.size && typeof product.size === 'string' && product.size.trim().length > 0;
    const hasNewSizes = product.productSizes && Array.isArray(product.productSizes) && product.productSizes.length > 0;
    const hasSizes = hasLegacySizes || hasNewSizes;
    
    // Show a warning if sizes are available but none selected (but still allow adding)
    if (hasSizes && !selectedSize) {
      console.log('Product has sizes available but none selected - adding as generic item');
      // We'll still proceed to add the item without size
    }

    const validQuantity = Math.max(1, Number(quantity) || 1);
    
    try {
      // Include size in the request if provided
      const payload = {
        productId: product.id,
        quantity: validQuantity,
        ...(selectedSize ? { size: selectedSize } : {})  // Backend expects 'size' field, not 'selectedSize'
      };

      console.log('Cart payload being sent:', payload);

      const response = await axios.post(`${BASE_URL}/api/cart/add`, payload, authConfig);
      
      if (response.data && response.data.success) {
        const productForToast = product;
        await fetchCart();
        const productName = (productForToast && productForToast.name) ? productForToast.name : 'Item';
        
        // Check if this was an update (item already in cart) or new addition
        if (response.data.isUpdate) {
          toast(
            `🛒 ${productName} is already in your cart!\nQuantity updated to ${response.data.newQuantity}`,
            {
              duration: 4000,
              style: {
                background: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                color: '#1e40af',
                fontWeight: '500',
                padding: '16px',
                maxWidth: '350px',
                whiteSpace: 'pre-line'
              },
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#dbeafe',
              },
            }
          );
          
          // Show a separate "View Cart" button toast
          setTimeout(() => {
            toast(
              (t) => (
                <div className="flex items-center gap-3">
                  <span>Want to view your cart?</span>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      window.location.href = '/customer/cart';
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Cart
                  </button>
                </div>
              ),
              {
                duration: 3000,
                style: {
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px'
                }
              }
            );
          }, 1000);
        } else {
          toast.success(`✅ Added: ${productName}`, {
            duration: 3000,
            style: {
              background: '#dcfce7',
              border: '2px solid #22c55e',
              borderRadius: '12px',
              color: '#15803d',
              fontWeight: '500',
              padding: '16px'
            }
          });
        }
        return true;
      } else {
        toast.error('Failed to add item to cart');
        return false;
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('Error response headers:', err.response?.headers);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
      } else if (err.response && err.response.status === 400) {
        // Handle specific 400 error messages from the backend
        const errorMessage = err.response.data?.message || 'Failed to add item to cart';
        console.error('400 Error message:', errorMessage);
        
        // Show more user-friendly messages for common errors
        if (errorMessage.includes('Size selection is required')) {
          toast.error(`Please select a size for ${product.name || 'this item'}`);
        } else if (errorMessage.includes('not available')) {
          toast.error(errorMessage);
        } else {
          toast.error(`Unable to add ${product.name || 'item'} to cart. ${errorMessage}`);
        }
      } else {
        toast.error(`Failed to add ${product.name || 'item'} to cart.`);
      }
      return false;
    }
  };

  const removeFromCart = (cartItemId) => {
    const item = cart.find(item => item.id === cartItemId);
    if (!item) return;
    
    setItemToRemove(item);
    setShowRemoveAlert(true);
  };

  const handleRemoveConfirm = async () => {
    if (!itemToRemove) return;
    
    const authConfig = getAuthConfig();
    if (!authConfig) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      const response = await axios.post(`${BASE_URL}/api/cart/remove`, {
        productId: itemToRemove.productId,
        size: itemToRemove.selectedSize
      }, authConfig);
      
      if (response.data && response.data.success) {
        await fetchCart();
        toast.success(`Removed: ${itemToRemove.name}`, {
          description: "Item removed from your cart"
        });
        
        // Remove from selected items if present
        setSelectedItems(prev => prev.filter(id => id !== itemToRemove.id));
      } else {
        toast.error('Failed to remove item from cart');
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to remove item from cart');
      }
    } finally {
      setShowRemoveAlert(false);
      setItemToRemove(null);
    }
  };

  const handleRemoveCancel = () => {
    setShowRemoveAlert(false);
    setItemToRemove(null);
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    
    // Find the cart item to get the productId
    const cartItem = cart.find(item => item.id === cartItemId);
    if (!cartItem) {
      toast.error('Cart item not found');
      return;
    }
    
    const authConfig = getAuthConfig();
    if (!authConfig) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      const response = await axios.post(`${BASE_URL}/api/cart/update`, {
        productId: cartItem.productId,
        quantity,
        size: cartItem.selectedSize
      }, authConfig);
      
      if (response.data && response.data.success) {
        await fetchCart();
      } else {
        toast.error('Failed to update cart');
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to update cart');
      }
    }
  };

  const clearCart = async () => {
    const authConfig = getAuthConfig();
    if (!authConfig) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      // Remove items one by one since there's no bulk delete endpoint
      const promises = cart.map(item => 
        axios.post(`${BASE_URL}/api/cart/remove`, {
          productId: item.productId,
          size: item.selectedSize
        }, authConfig)
      );
      
      await Promise.all(promises);
      await fetchCart();
      
      toast.success("Cart cleared", {
        description: "All items have been removed from your cart"
      });
      
      setSelectedItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to clear cart');
      }
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateItemPrice = (item) => {
    // Use pre-calculated finalPrice from backend, fallback to old calculation if not available
    return parseFloat(item.finalPrice) || parseFloat(item.price) || 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const itemTotalPrice = calculateItemPrice(item) * item.quantity;
      return total + itemTotalPrice;
    }, 0);
  };
  
  const getSelectedItemsTotal = () => {
    return cart
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + (item.finalPrice || item.price) * item.quantity, 0);
  };
  
  const toggleItemSelection = (productId) => {
    setSelectedItems(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  const selectAllItems = () => {
    setSelectedItems(cart.map(item => item.id));
  };
  
  const deselectAllItems = () => {
    setSelectedItems([]);
  };
  
  const isItemSelected = (productId) => {
    return selectedItems.includes(productId);
  };

  const getSelectedItems = () => {
    return cart.filter(item => selectedItems.includes(item.id));
  };

  const removeSelectedItemsFromCart = async () => {
    console.log('removeSelectedItemsFromCart called with selectedItems:', selectedItems);
    
    const authConfig = getAuthConfig();
    if (!authConfig) {
      toast.error('Authentication required');
      return;
    }
    
    if (selectedItems.length === 0) {
      toast.error('No items selected for removal');
      return;
    }
    
    try {
      console.log(`Attempting to remove ${selectedItems.length} items:`, selectedItems);
      
      // Remove selected items one by one
      const promises = selectedItems.map(cartItemId => {
        // Find the cart item to get its product ID and size information
        const cartItem = cart.find(item => item.id === cartItemId);
        if (!cartItem) {
          console.error('Cart item not found for ID:', cartItemId);
          return Promise.resolve({ data: { success: false, message: 'Cart item not found' } });
        }
        
        const payload = {
          productId: cartItem.productId
        };
        
        // Include size if the item has one
        if (cartItem.selectedSize) {
          payload.size = cartItem.selectedSize;
        }
        
        console.log('Cart item found:', { cartItemId: cartItem.id, productId: cartItem.productId, selectedSize: cartItem.selectedSize });
        console.log('Removing cart item ID:', cartItemId, 'with payload:', payload);
        return axios.post(`${BASE_URL}/api/cart/remove`, payload, authConfig);
      });
      
      console.log('Waiting for all removal promises to complete...');
      const results = await Promise.all(promises);
      console.log('All removal requests completed:', results.map(r => r.data));
      
      console.log('Fetching updated cart...');
      await fetchCart();
      
      // Clear selected items after removal
      setSelectedItems([]);
      console.log('Selected items cleared, removal process complete');
      
      toast.success(`Successfully removed ${selectedItems.length} items from cart`, {
        description: "Items have been removed from your cart"
      });
    } catch (err) {
      console.error('Error removing selected items from cart:', err);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to remove items from cart');
      }
    }
  };

  // New function to remove specific items from cart (used after order completion)
  const removeSpecificItemsFromCart = async (itemsToRemove) => {
    const authConfig = getAuthConfig();
    if (!authConfig) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      console.log('Removing specific items from cart:', itemsToRemove);
      
      // For items with the same product but different sizes, we need to handle them carefully
      // The backend cart/remove API expects productId and optionally size
      const promises = itemsToRemove.map(item => {
        const payload = {
          productId: item.productId || item.id // Use productId first, fallback to id
        };
        
        // If the item has a specific size, include it in the removal request
        if (item.selectedSize || item.size) {
          payload.size = item.selectedSize || item.size;
        }
        
        console.log('Removing cart item with payload:', payload);
        
        return axios.post(`${BASE_URL}/api/cart/remove`, payload, authConfig);
      });
      
      await Promise.all(promises);
      await fetchCart();
      
      console.log('Successfully removed ordered items from cart');
    } catch (err) {
      console.error('Error removing specific items from cart:', err);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
      } else {
        console.error('Failed to remove ordered items from cart');
        // Don't show error toast here as order was successful
      }
    }
  };

  // Method to initialize cart after login
  const initializeCart = useCallback(() => {
    if (isAuthenticated()) {
      fetchCart();
    }
  }, [fetchCart]);

  const value = {
    cart,
    selectedItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    isItemSelected,
    getSelectedItems,
    getSelectedItemsTotal,
    removeSelectedItemsFromCart,
    removeSpecificItemsFromCart,
    loading,
    error,
    fetchCart,
    initializeCart,
    isAuthenticated,
    getItemSize: (productId) => {
      const item = cart.find(item => item.id === productId);
      return item ? item.selectedSize : null;
    },
    getAvailableSizes: (productId) => {
      const item = cart.find(item => item.id === productId);
      return item ? item.availableSizes : [];
    }
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <RemoveAlert
        isOpen={showRemoveAlert}
        onClose={handleRemoveCancel}
        onRemove={handleRemoveConfirm}
        itemName={itemToRemove?.name}
      />
    </CartContext.Provider>
  );
};