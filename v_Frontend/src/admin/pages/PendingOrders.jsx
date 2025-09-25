import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaCheck, FaTimes, FaTruck, FaChevronDown, FaChevronUp, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import AdminVerifyModal from '../AdminVerifyModal';
import { BASE_URL } from '../../util';
import { toast } from 'react-hot-toast';

const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [trackingId, setTrackingId] = useState("");
  const [courierCompany, setCourierCompany] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showAdminVerify, setShowAdminVerify] = useState(false);
  const [adminVerifying, setAdminVerifying] = useState(false);
  const [adminVerifyError, setAdminVerifyError] = useState("");
  const [pendingRejectReason, setPendingRejectReason] = useState("");
  const [expandedOrderDetails, setExpandedOrderDetails] = useState(null);
  const [imageLoadingModal, setImageLoadingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const user = JSON.parse(localStorage.getItem('user'));

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Invalid Date';
    }
  }, []);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/orders/getall`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log('Raw orders from API:', response.data);

        if (response.data && Array.isArray(response.data)) {
          const formattedOrders = response.data.map(order => {
            const orderItems = (order.orderItems && Array.isArray(order.orderItems)) ? order.orderItems.map((item, index) => {
              console.log(`Order ID: ${order.id}, Item Index: ${index}, Raw item.priceatpurchase:`, item.priceatpurchase, `(Type: ${typeof item.priceatpurchase})`);
              const priceAtPurchase = parseFloat(item.priceatpurchase);
              console.log(`Order ID: ${order.id}, Item Index: ${index}, Parsed priceAtPurchase:`, priceAtPurchase, `(IsNaN: ${isNaN(priceAtPurchase)})`);
              const quantity = parseInt(item.quantity, 10);
              
              let productId = item.product?.id; 
              if (!productId) productId = item.product_id; 
              if (!productId) productId = item.productId; 
              if (!productId) productId = item.id; 
              
              if (!productId) {
                console.warn('[PendingOrders] fetchOrders: Still could not determine productId for item. Raw item data:', JSON.stringify(item));
              }

              return {
                productId: productId, 
                productName: item.product?.productname || item.productName || "Product",
                quantity: !isNaN(quantity) ? quantity : 0,
                price: !isNaN(priceAtPurchase) ? priceAtPurchase : 0,
                selectedSize: item.selectedSize || null, // Include selected size
                // Include GST data from backend
                priceBeforeGST: item.priceBeforeGST || 0,
                gstAmount: item.gstAmount || 0,
                finalPrice: item.finalPrice || priceAtPurchase,
                gstRate: item.gstRate || 0,
                gstType: item.gstType || 'exclusive'
              };
            }) : [];

            // Use backend calculated totals instead of frontend calculation
            const subtotal = order.priceBreakdown?.subtotalBeforeGST || 0;
            const tax = order.priceBreakdown?.totalGSTAmount || 0;
            const shipping = subtotal < 1000 && subtotal > 0 ? 150 : 0;
            const total = (order.priceBreakdown?.grandTotal || 0) + shipping;

            const shippingAddress = {
              street: order.address || 'N/A',
              city: order.city || 'N/A',
              state: order.state || 'N/A',
              zipCode: order.pincode || 'N/A',
              country: order.country || 'N/A'
            };

            return {
              id: order.id.toString(),
              orderDate: formatDate(order.createdAt),
              customerName: order.fullname || (order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'Unknown'),
              contactNumber: order.phonenumber || "Not provided",
              status: order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : "Unknown",
              customerDetails: {
                email: order.email || (order.user ? order.user.email : 'Unknown'),
                registeredSince: order.user ? formatDate(order.user.createdAt) : 'Unknown'
              },
              shippingAddress,
              orderDetails: orderItems,
              priceDetails: {
                subtotal,
                tax,
                shipping,
                total
              },
              paymentDetails: {
                method: order.paymentmode || "N/A",
                status: "Pending", 
                transactionId: order.id ? `TXN-${order.id}-${Date.now().toString().slice(-4)}` : `TXN-ERR-${Date.now().toString().slice(-4)}`
              },
              trackingId: order.trackingid || "",
              courierCompany: order.couriercompany || "",
              rejectReason: order.rejectreason || ""
            };
          });
          console.log('Formatted orders for state:', formattedOrders);
          setOrders(formattedOrders);
        } else {
          console.error("Data from API is not an array or is empty:", response.data);
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]); 
      } finally {
        setLoading(false);
      }
    };    fetchOrders();
  }, [formatDate]);

  const handleApprove = (orderId) => {
    setCurrentOrderId(orderId);
    const currentOrder = orders.find(o => o.id === orderId);
    setTrackingId(currentOrder?.trackingId || "");
    setCourierCompany(currentOrder?.courierCompany || "");
    setShowTrackingModal(true);
  };

  const handleReject = (orderId) => {
    setCurrentOrderId(orderId);
    const currentOrder = orders.find(o => o.id === orderId);
    setRejectReason(currentOrder?.rejectReason || "");
    setShowRejectModal(true);
  };

  const submitApproval = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/orders/update/${currentOrderId}`, 
        { 
          status: 'dispatched', 
          trackingid: trackingId,
          couriercompany: courierCompany
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (response.data && response.data.order) {
        setOrders(orders.map(order => 
          order.id === currentOrderId 
            ? { ...order, 
                status: response.data.order.status.charAt(0).toUpperCase() + response.data.order.status.slice(1), 
                trackingId: response.data.order.trackingid, 
                courierCompany: response.data.order.couriercompany
              } 
            : order
        ));
        setShowTrackingModal(false);
        toast.success("Order status updated to Dispatched.");
      } else {
        toast.error(response.data?.message || "Failed to update order status.");
      }
      
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.response?.data?.message || "Failed to update order status. Please try again.");
    }
  };

  const submitRejection = () => {
    setShowRejectModal(false);
    setPendingRejectReason(rejectReason);
    setShowAdminVerify(true);
    setAdminVerifyError("");
  };

  const handleAdminVerify = async (password) => {
    setAdminVerifying(true);
    setAdminVerifyError("");
    try {
      const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: user?.email,
        password
      });
      
      if (adminLoginResponse.data && adminLoginResponse.data.user && adminLoginResponse.data.user.role === 'admin') {
        const updateResponse = await axios.post(`${BASE_URL}/api/orders/update/${currentOrderId}`, 
          { 
            status: 'cancelled', 
            rejectreason: pendingRejectReason
          }, 
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        
        if (updateResponse.data && updateResponse.data.order) {
          setOrders(orders.map(order =>
            order.id === currentOrderId
              ? { ...order, 
                  status: updateResponse.data.order.status.charAt(0).toUpperCase() + updateResponse.data.order.status.slice(1), 
                  rejectReason: updateResponse.data.order.rejectreason 
                }
              : order
          ));
          toast.success("Order status updated to Cancelled.");
          setShowAdminVerify(false);
          setCurrentOrderId(null);
          setPendingRejectReason("");
        } else {
          setAdminVerifyError(updateResponse.data?.message || 'Failed to update order after verification.');
        }

      } else {
        setAdminVerifyError('Invalid admin credentials.');
      }
    } catch (err) {
      setAdminVerifyError(
        err.response?.data?.message || 'Invalid admin credentials or server error.'
      );
    } finally {
      setAdminVerifying(false);
    }
  };

  const handleAdminCancel = () => {
    setShowAdminVerify(false);
    setPendingRejectReason("");
    setAdminVerifyError("");
  };

  const handleViewDetails = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setExpandedOrderDetails(null);
    } else {
      setExpandedOrder(orderId);
      setActiveTab({ ...activeTab, [orderId]: 'customerDetails' });
      setImageLoadingModal(true);
      setExpandedOrderDetails(null);

      const orderToExpand = orders.find(o => o.id === orderId);

      if (orderToExpand && orderToExpand.orderDetails && orderToExpand.orderDetails.length > 0) {
        try {
          const itemsWithImages = await Promise.all(
            orderToExpand.orderDetails.map(async (item) => {
              console.log('[PendingOrders] Preparing to fetch image for item.productId:', item.productId, 'Product Name:', item.productName);
              if (!item.productId) {
                console.error(`[PendingOrders] handleViewDetails: Skipping image fetch for product '${item.productName}' because its productId is undefined. Item details:`, item);
                return { ...item, imageUrl: null };
              }
              try {
                const imageResponse = await axios.get(`${BASE_URL}/api/products/${item.productId}/images`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                console.log(`[PendingOrders] Image API response for productId ${item.productId}:`, imageResponse.data);
                const imageUrl = imageResponse.data?.[0]?.url || null;
                return { ...item, imageUrl: imageUrl ? `${BASE_URL}${imageUrl}` : null };
              } catch (error) {
                console.error(`Error fetching image for product ${item.productId}:`, error);
                return { ...item, imageUrl: null }; 
              }
            })
          );
          setExpandedOrderDetails({ ...orderToExpand, orderDetails: itemsWithImages });
        } catch (error) {
          console.error("Error processing product images for order:", error);
          setExpandedOrderDetails(orderToExpand); 
        }
      } else {
        setExpandedOrderDetails(orderToExpand); 
      }
      setImageLoadingModal(false); 
    }
  };

  const toggleTab = (orderId, tabName) => {
    setActiveTab({...activeTab, [orderId]: activeTab[orderId] === tabName ? null : tabName});
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>;
      case 'processing':
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{status}</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>;
      case 'shipped':
      case 'dispatched':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Shipped</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.contactNumber.toLowerCase().includes(searchLower) ||
      (order.trackingId && order.trackingId.toLowerCase().includes(searchLower))
    );
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/orders/getall`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.data && Array.isArray(response.data)) {
        const formattedOrders = response.data.map(order => {
          const orderItems = (order.orderItems && Array.isArray(order.orderItems)) ? order.orderItems.map(item => {
            const priceAtPurchase = parseFloat(item.priceatpurchase);
            const quantity = parseInt(item.quantity, 10);
            
            let productId = item.product?.id; 
            if (!productId) productId = item.product_id; 
            if (!productId) productId = item.productId; 
            if (!productId) productId = item.id; 
            
            return {
              productId: productId,
              productName: item.product?.productname || item.productName || "Product",
              quantity: !isNaN(quantity) ? quantity : 0,
              price: !isNaN(priceAtPurchase) ? priceAtPurchase : 0,
              // Include GST data from backend
              priceBeforeGST: item.priceBeforeGST || 0,
              gstAmount: item.gstAmount || 0,
              finalPrice: item.finalPrice || priceAtPurchase,
              gstRate: item.gstRate || 0,
              gstType: item.gstType || 'exclusive'
            };
          }) : [];

          // Use backend calculated totals instead of frontend calculation
          const subtotal = order.priceBreakdown?.subtotalBeforeGST || 0;
          const tax = order.priceBreakdown?.totalGSTAmount || 0;
          const shipping = subtotal < 1000 && subtotal > 0 ? 150 : 0;
          const total = (order.priceBreakdown?.grandTotal || 0) + shipping;
          
          const shippingAddress = {
            street: order.address || 'N/A',
            city: order.city || 'N/A',
            state: order.state || 'N/A',
            zipCode: order.pincode || 'N/A',
            country: order.country || 'N/A'
          };

          return {
            id: order.id.toString(),
            orderDate: formatDate(order.createdAt),
            customerName: order.fullname || (order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'Unknown'),
            contactNumber: order.phonenumber || "Not provided",
            status: order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : "Unknown",
            customerDetails: {
              email: order.email || (order.user ? order.user.email : 'Unknown'),
              registeredSince: order.user ? formatDate(order.user.createdAt) : 'Unknown'
            },
            shippingAddress,
            orderDetails: orderItems,
            priceDetails: {
              subtotal,
              tax,
              shipping,
              total
            },
            paymentDetails: {
              method: order.paymentmode || "N/A",
              status: "Pending",
              transactionId: order.id ? `TXN-${order.id}-${Date.now().toString().slice(-4)}` : `TXN-ERR-${Date.now().toString().slice(-4)}`
            },
            trackingId: order.trackingid || "",
            courierCompany: order.couriercompany || "",
            rejectReason: order.rejectreason || ""
          };
        });
        setOrders(formattedOrders);
      } else {
        toast.error("Failed to fetch orders or data is not in expected format.");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(error.response?.data?.message || "Error fetching orders. Please try again.");
      setOrders([]); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3 sm:p-4 mt-12 sm:mt-0">
      <div className="max-w-7xl mx-auto">
        <div className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm min-h-screen border border-gray-100">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 flex items-center">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Order Management</span>
            <span className="ml-4 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">Admin</span>
          </h2>
          <p className="text-gray-500 mb-8">Manage and track your orders efficiently</p>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-black px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h5 className="text-lg font-semibold text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Pending Orders
                </h5>
                <div className="relative w-96">
                  <input
                    type="text"
                    placeholder="Search by Order ID, Customer Name, Contact or Tracking ID"
                    className="w-full px-4 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg 
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className='bg-white/70 backdrop-blur-md border-b border-gray-100'>
              <div className="flex items-center justify-between p-4">
                <h5 className="text-lg font-semibold text-gray-700">Orders List</h5>
                <button 
                  onClick={handleRefresh}
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6v6h6M20 18v-6h-6m-4 4H4m16-8h-4" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders
                        .filter(order => order.status.toLowerCase() === 'pending')
                        .map((order, index) => (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{order.id}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-500">{order.orderDate}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700 font-medium">{order.customerName}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-sm text-gray-500">{order.contactNumber}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-white">
                              <div className="flex space-x-2 justify-end">
                                <button
                                  onClick={() => handleViewDetails(order.id)}
                                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors duration-150 shadow-sm hover:shadow"
                                  title="View Details"
                                >
                                  <FaEye className="h-4 w-4" />
                                </button>
                                {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing') && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(order.id)}
                                      className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors duration-150 shadow-sm hover:shadow"
                                      title="Approve Order"
                                    >
                                      <FaCheck className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReject(order.id)}
                                      className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors duration-150 shadow-sm hover:shadow"
                                      title="Reject Order"
                                    >
                                      <FaTimes className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedOrder === order.id && (
                            <tr>
                              <td colSpan="7" className="p-0">
                                <div className="fixed inset-0 z-50 overflow-y-auto">
                                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm" aria-hidden="true"></div>
                                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>
                                    <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full sm:p-6">
                                      <div className="sm:flex sm:items-start justify-between">
                                        <h3 className="text-2xl font-bold leading-6 text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                          Order Details
                                        </h3>
                                        <button
                                          type="button"
                                          className="rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                          onClick={() => setExpandedOrder(null)}
                                        >
                                          <span className="sr-only">Close</span>
                                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                      <div className="mt-4">
                                        <div className="flex flex-wrap border-b border-gray-200">
                                          {['customerDetails', 'shippingAddress', 'orderDetails', 'priceDetails', 'paymentDetails'].map((tab) => {
                                            const tabLabels = {
                                              customerDetails: 'Customer Details',
                                              shippingAddress: 'Shipping Address',
                                              orderDetails: 'Order Details',
                                              priceDetails: 'Price Details',
                                              paymentDetails: 'Payment Details'
                                            };
                                            return (
                                              <button 
                                                key={tab}
                                                className={`px-6 py-3 text-center transition-all duration-200 ${
                                                  activeTab[order.id] === tab 
                                                    ? 'bg-white text-blue-600 border-b-2 border-blue-500 font-medium' 
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                                onClick={() => toggleTab(order.id, tab)}
                                              >
                                                {tabLabels[tab]}
                                              </button>
                                            );
                                          })}
                                        </div>
                                        <div className="p-6">
                                          {activeTab[order.id] === 'customerDetails' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h4 className="text-lg font-medium text-gray-700 mb-4">Customer Information</h4>
                                                <div className="space-y-3">
                                                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                    <span className="text-sm font-medium text-gray-600">Name:</span>
                                                    <span className="text-sm text-gray-800 col-span-2">{order.customerName}</span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                    <span className="text-sm font-medium text-gray-600">Contact Number:</span>
                                                    <span className="text-sm text-gray-800 col-span-2">{order.contactNumber}</span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                    <span className="text-sm font-medium text-gray-600">Email:</span>
                                                    <span className="text-sm text-gray-800 col-span-2">{order.customerDetails.email}</span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                    <span className="text-sm font-medium text-gray-600">Registered Since:</span>
                                                    <span className="text-sm text-gray-800 col-span-2">{order.customerDetails.registeredSince}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h4 className="text-lg font-medium text-gray-700 mb-4">Order Summary</h4>
                                                <div className="space-y-3">
                                                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                    <span className="text-sm font-medium text-gray-600">Order ID:</span>
                                                    <span className="text-sm text-gray-800 col-span-2">{order.id}</span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                    <span className="text-sm font-medium text-gray-600">Order Date:</span>
                                                    <span className="text-sm text-gray-800 col-span-2">{order.orderDate}</span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                    <span className="text-sm font-medium text-gray-600">Status:</span>
                                                    <span className="text-sm text-gray-800 col-span-2">{order.status}</span>
                                                  </div>
                                                  {order.trackingId && (
                                                    <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                      <span className="text-sm font-medium text-gray-600">Tracking ID:</span>
                                                      <span className="text-sm text-gray-800 col-span-2">{order.trackingId}</span>
                                                    </div>
                                                  )}
                                                  {order.courierCompany && (
                                                    <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                      <span className="text-sm font-medium text-gray-600">Courier Company:</span>
                                                      <span className="text-sm text-gray-800 col-span-2">{order.courierCompany}</span>
                                                    </div>
                                                  )}
                                                  {order.rejectReason && (
                                                    <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                      <span className="text-sm font-medium text-gray-600">Reject Reason:</span>
                                                      <span className="text-sm text-gray-800 col-span-2">{order.rejectReason}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {activeTab[order.id] === 'shippingAddress' && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                              <h4 className="text-lg font-medium text-gray-700 mb-4">Shipping Address</h4>
                                              <div className="space-y-3">
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Street:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">{order.shippingAddress.street}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">City:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">{order.shippingAddress.city}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">State:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">{order.shippingAddress.state}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Zip Code:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">{order.shippingAddress.zipCode}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Country:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">{order.shippingAddress.country}</span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {activeTab[order.id] === 'orderDetails' && (() => {
                                            const currentDisplayOrder = expandedOrderDetails && expandedOrderDetails.id === order.id ? expandedOrderDetails : order;
                                            
                                            if (!currentDisplayOrder || !Array.isArray(currentDisplayOrder.orderDetails)) {
                                              return <p className="text-sm text-gray-500 p-4">No order items to display or items are in an unexpected format.</p>;
                                            }

                                            return (
                                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h4 className="text-lg font-medium text-gray-700 mb-4">Order Items</h4>
                                                {imageLoadingModal && currentDisplayOrder.id === expandedOrder ? (
                                                  <div className="flex justify-center items-center p-4">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                    <p className="ml-2 text-sm text-gray-600">Loading product images...</p>
                                                  </div>
                                                ) : currentDisplayOrder.orderDetails.length > 0 ? (
                                                  <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-100">
                                                      <thead className="bg-gray-100">
                                                        <tr>
                                                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                                          <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                          <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody className="bg-white divide-y divide-gray-200">
                                                        {currentDisplayOrder.orderDetails.map((item, itemIndex) => (
                                                          <tr key={itemIndex} className="border-b border-gray-200 hover:bg-gray-50">
                                                            <td className="py-3 px-4">
                                                              {item.imageUrl ? (
                                                                <img src={item.imageUrl} alt={item.productName} className="h-16 w-16 object-cover rounded-md shadow-sm" />
                                                              ) : (
                                                                <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                                                  <FaEye className="h-6 w-6" />
                                                                </div>
                                                              )}
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-gray-700">
                                                              <div>
                                                                {item.productName}
                                                                {item.selectedSize && (
                                                                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                                    Size: {item.selectedSize}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-gray-700 text-center">{item.quantity}</td>
                                                            <td className="py-3 px-4 text-sm text-gray-700 text-right">₹{typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}</td>
                                                            <td className="py-3 px-4 text-sm text-gray-700 text-right">₹{typeof item.price === 'number' && typeof item.quantity === 'number' ? (item.price * item.quantity).toFixed(2) : 'N/A'}</td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                ) : (
                                                  <p className="text-sm text-gray-500 p-4">This order has no items.</p>
                                                )}
                                              </div>
                                            );
                                          })()}
                                          {activeTab[order.id] === 'priceDetails' && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                              <h4 className="text-lg font-medium text-gray-700 mb-4">Price Details</h4>
                                              <div className="space-y-3">
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">₹{order.priceDetails.subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Tax:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">₹{order.priceDetails.tax.toFixed(2)}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Shipping:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">₹{order.priceDetails.shipping.toFixed(2)}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 pt-2">
                                                  <span className="text-sm font-medium text-gray-600">Total:</span>
                                                  <span className="text-sm font-bold text-blue-600 col-span-2">₹{order.priceDetails.total.toFixed(2)}</span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {activeTab[order.id] === 'paymentDetails' && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                              <h4 className="text-lg font-medium text-gray-700 mb-4">Payment Details</h4>
                                              <div className="space-y-3">
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                                                  <span className="text-sm text-gray-800 col-span-2">{order.paymentDetails.method}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                                  <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                                                  <span className={`text-sm col-span-2 ${order.paymentDetails.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {order.paymentDetails.status}
                                                  </span>
                                                </div>

                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="7" className="px-6 py-4">
                          <div className="flex justify-end items-center text-sm">
                            <span className="font-medium mr-2 text-gray-600">Total pending:</span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                              {filteredOrders.filter(order => order.status.toLowerCase() === 'pending').length}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {showTrackingModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Enter Shipping Details</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="courierCompany">
                    Courier Company
                  </label>
                  <input
                    id="courierCompany"
                    type="text"
                    className="shadow-sm appearance-none border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={courierCompany}
                    onChange={(e) => setCourierCompany(e.target.value)}
                    placeholder="Enter courier company name"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="trackingId">
                    Tracking ID
                  </label>
                  <input
                    id="trackingId"
                    type="text"
                    className="shadow-sm appearance-none border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter tracking ID"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-150"
                    onClick={() => setShowTrackingModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 ${!trackingId.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                    onClick={submitApproval}
                    disabled={!trackingId.trim()}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showRejectModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Enter Rejection Reason</h3>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="rejectReason">
                    Reason for Rejection
                  </label>
                  <textarea
                    id="rejectReason"
                    className="shadow-sm appearance-none border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                    rows="4"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-150"
                    onClick={() => setShowRejectModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 ${!rejectReason.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                    onClick={submitRejection}
                    disabled={!rejectReason.trim()}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
          <AdminVerifyModal
            show={showAdminVerify}
            onCancel={handleAdminCancel}
            onVerify={handleAdminVerify}
            verifying={adminVerifying}
            error={adminVerifyError}
          />
        </div>
      </div>
    </div>
  );
};

export default PendingOrders;
