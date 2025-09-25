import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon, XCircleIcon, ClockIcon, CheckCircleIcon, RefreshCcw, ShoppingBag, Package, Star } from 'lucide-react';
import axios from 'axios';
import { BASE_URL, getImageUrl } from '../../util';
// import BackgroundParticles from '../components/BackgroundParticles';
import { toast, Toaster } from 'react-hot-toast';
import ConfirmationModal from '../../admin/ConfirmationModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Define order status types
  const orderStatuses = [
    { id: 'all', label: 'All Orders', icon: Package },
    { id: 'pending', label: 'Pending', icon: ClockIcon },
    { id: 'dispatched', label: 'Dispatched', icon: TruckIcon },
    { id: 'delivered', label: 'Delivered', icon: CheckCircleIcon },
    { id: 'cancelled', label: 'Cancelled', icon: XCircleIcon },
  ];

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => 
    activeTab === 'all' ? true : order.status === activeTab
  );

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view your orders');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/orders/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
    
    // Set up polling for near real-time updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // refresh every 30 seconds
    
    setRefreshInterval(interval);
    
    // Cleanup
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'dispatched':
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'dispatched':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  // Get tab style based on active state
  const getTabStyle = (tabId) => {
    if (activeTab === tabId) {
      return 'bg-blue-50 border-blue-200 text-blue-700';
    }
    return 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900';
  };

  // Get count of orders by status
  const getOrderCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  // Manual refresh handler
  const handleRefresh = () => {
    setLoading(true);
    fetchOrders();
  };

  const deleteOrder = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Order removed successfully.');
    } catch (err) {
      toast.error('Failed to remove order.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (product) => {
    setReviewProduct(product);
    setReviewText('');
    setReviewRating(5);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewProduct) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.post(
        `${BASE_URL}/api/reviews/${reviewProduct.productId}`,
        {
          rating: reviewRating,
          reviewText: reviewText
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShowReviewModal(false);
      toast.success('Review submitted!');
    } catch (err) {
      toast.error('Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative transition-colors duration-200">
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {/* <BackgroundParticles count={30} /> */}
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">My Orders</h1>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-pulse">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-28"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative transition-colors duration-200">
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {/* <BackgroundParticles count={30} /> */}
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight mb-8">My Orders</h1>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 mr-2" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative transition-colors duration-200">
      <Toaster position="top-center" reverseOrder={false} />
      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText="Yes, Remove"
        icon={XCircleIcon}
        iconColor="text-red-500"
      />
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        {/* <BackgroundParticles count={30} /> */}
      </div>
      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">No orders yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">You haven't placed any orders yet. Start exploring our products and make your first purchase!</p>
            <Link 
              to="/customer/shop"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Order Status Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {orderStatuses.map((status) => {
                const Icon = status.icon;
                const count = getOrderCount(status.id);
                return (
                  <button
                    key={status.id}
                    onClick={() => setActiveTab(status.id)}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 ${getTabStyle(status.id)}`}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{status.label}</span>
                    <span className="text-xs mt-1">{count} orders</span>
                  </button>
                );
              })}
            </div>

            {/* Filtered Orders */}
            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} orders</h3>
                  <p className="text-gray-600">You don't have any orders with this status.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200 relative">
                      {/* Remove Icon */}
                      <XCircleIcon
                        className="absolute top-4 right-4 w-6 h-6 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModalState({
                            isOpen: true,
                            title: 'Confirm Removal',
                            message: 'Are you sure you want to remove this order?',
                            onConfirm: () => {
                              setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                              deleteOrder(order.id);
                            },
                          });
                        }}
                      />

                      {/* Main content with padding */}
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-2">                              <h3 className="text-lg font-semibold text-gray-900">
                                {order.items && order.items[0] ? order.items[0].productName : 'No product name'}
                              </h3>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1.5 capitalize">{order.status}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
                        <div className="lg:col-span-2">
                          {/* Product Preview */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Items in this order</h4>
                            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                              {order.items && order.items.slice(0, 4).map((item, index) => (
                                <div key={index} className="flex-shrink-0 flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-100">
                                  <div className="w-50 h-50 bg-gray-100 rounded-lg overflow-hidden">
                                    {item.imageUrl ? (
                                      <img 
                                        src={getImageUrl(item.imageUrl)}
                                        alt={item.productName} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="w-full h-full flex items-center justify-center" style={{ display: item.imageUrl ? 'none' : 'flex' }}>
                                      <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                      {item.productName || `Product ID: ${item.productId}`}
                                    </p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    {item.selectedSize && (
                                      <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                        Size: {item.selectedSize}
                                      </p>
                                    )}
                                    {/* Review button for delivered orders */}
                                    {order.status === 'delivered' && (
                                      <button
                                        className="mt-2 inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                                        onClick={() => handleOpenReview({
                                          productId: item.productId,
                                          orderId: order.id,
                                          productName: item.productName
                                        })}
                                      >
                                        <Star className="w-3 h-3 mr-1.5 fill-current" />
                                        Review Product
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {order.items && order.items.length > 4 && (
                                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                  +{order.items.length - 4}
                                </div>
                              )}
                            </div>
                            <Link
                            to={`/customer/orders/${order.id}`}
                            className="mt-4 w-57 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                          >
                            <Package className="w-5 h-5 mr-2" />
                            View Details
                          </Link>
                          </div>
                        </div>

                        {/* <div className="space-y-4">
                          {/* <div className="bg-white rounded-lg p-4 border border-gray-100">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Items</span>
                                <span className="text-sm font-semibold text-gray-900">{order.totalItems}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Order Total</span>
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{order.totalAmount ? (parseFloat(order.totalAmount).toFixed(2)) : '0.00'}
                                </span>
                              </div>
                            </div>
                          </div> */}
                          
                          {/* <Link
                            to={`/customer/orders/${order.id}`}
                            className=" mt-40 w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <Package className="w-5 h-5 mr-2 " />
                            View Details
                          </Link> */}
                        </div> 
                      </div>
                    </div>
                  </React.Fragment>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
                  <p className="text-sm text-gray-500 mt-1">{reviewProduct?.productName}</p>
                </div>
              </div>
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200" 
                onClick={() => setShowReviewModal(false)}
              >
                <XCircleIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Rating Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">How would you rate this product?</label>
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-1 transition-colors duration-200 ${
                        star <= reviewRating 
                          ? 'text-yellow-400 hover:text-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      <svg className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {reviewRating === 5 && "Excellent!"}
                  {reviewRating === 4 && "Very Good"}
                  {reviewRating === 3 && "Good"}
                  {reviewRating === 2 && "Fair"}
                  {reviewRating === 1 && "Poor"}
                </p>
              </div>

              {/* Review Text Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Share your experience</label>
                <div className="relative">
                  <textarea 
                    value={reviewText} 
                    onChange={e => setReviewText(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none placeholder-gray-400" 
                    rows={4}
                    placeholder="Tell others about your experience with this product..."
                    maxLength={500}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {reviewText.length}/500
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitReview}
                disabled={!reviewText.trim() || reviewRating === 0}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;