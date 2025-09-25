import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle, ArrowLeft, CreditCard, Truck, MapPin, ShoppingBag, Tag, Info, ShieldCheck, Clock, X, ArrowRight, Plus, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { BASE_URL } from '../../util';
import PageLayout from '../components/PageLayout';
// import BackgroundParticles from '../components/BackgroundParticles';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, getTotalPrice, clearCart, removeSelectedItemsFromCart, removeSpecificItemsFromCart } = useCart();

  // Get selected items from navigation state, fallback to all cart items
  const selectedItems = location.state?.selectedItems || cart;

  // Calculate totals using pre-calculated GST values from backend
  const calculateSelectedItemsTotals = () => {
    if (!selectedItems || selectedItems.length === 0) {
      return { subtotal: 0, totalGst: 0, total: 0 };
    }

    return selectedItems.reduce((totals, item) => {
      const quantity = parseInt(item.quantity) || 0;
      // Use pre-calculated values from backend
      const priceBeforeGST = parseFloat(item.priceBeforeGST) || parseFloat(item.price) || 0;
      const gstAmount = parseFloat(item.gstAmount) || 0;
      const finalPrice = parseFloat(item.finalPrice) || parseFloat(item.price) || 0;

      return {
        subtotal: totals.subtotal + (priceBeforeGST * quantity),
        totalGst: totals.totalGst + (gstAmount * quantity),
        total: totals.total + (finalPrice * quantity)
      };
    }, { subtotal: 0, totalGst: 0, total: 0 });
  };

  // Get calculated totals
  const { subtotal: subtotalAmount, totalGst: taxAmount, total: totalAmount } = calculateSelectedItemsTotals();

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Fetch shipping charge by pincode from backend
  const getShippingChargeByPincode = async (zip, signal) => {
    const pin = String(zip || '').trim();
    if (!/^\d{6}$/.test(pin)) return 0;
    try {
      // Try query param endpoint
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/shipping/pincode`, {
        params: { pin },
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // Expect a single match or list; normalize
      let rule = null;
      if (Array.isArray(res.data)) {
        rule = res.data.find(r => String(r.pincode) === pin);
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        rule = res.data.data.find(r => String(r.pincode) === pin);
      } else if (res.data?.pincode) {
        rule = res.data;
      }
      if (rule && (rule.active !== false)) {
        const amt = Number(rule.amount) || 0;
        return Math.max(0, amt);
      }
      // No matching pincode in DB: default shipping = 100
      return 100;
    } catch (err) {
      // Fallback to fetching all and searching
      if (axios.isCancel?.(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return 0;
      try {
        const token = localStorage.getItem('token');
        const list = await axios.get(`${BASE_URL}/api/shipping/pincode`, {
          signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = Array.isArray(list.data?.data) ? list.data.data : (Array.isArray(list.data) ? list.data : []);
        const rule = data.find(r => String(r.pincode) === pin);
        if (rule && (rule.active !== false)) return Math.max(0, Number(rule.amount) || 0);
        // Still no match: default 100
        return 100;
      } catch (_) {}
      // On error and no match, use default 100
      return 100;
    }
  };



  // Redirect to cart if no items are selected
  useEffect(() => {
    if (selectedItems.length === 0) {
      navigate('/customer/cart');
      toast.error('Please select items to checkout');
    }
  }, [selectedItems, navigate]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    paymentMethod: 'cod',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  // Shipping charge derived from pincode
  const [shippingCharge, setShippingCharge] = useState(0);

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // Update shipping charge whenever pincode changes (debounced + cancelable)
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const pin = String(formData.zipCode || '').trim();
    if (/^\d{6}$/.test(pin)) {
      const t = setTimeout(async () => {
        const amt = await getShippingChargeByPincode(pin, signal);
        if (!signal.aborted) setShippingCharge(amt);
      }, 400);
      return () => {
        clearTimeout(t);
        controller.abort();
      };
    } else {
      setShippingCharge(0);
      return () => controller.abort();
    }
  }, [formData.zipCode]);

  const fetchSavedAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/addresses/get`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const addresses = Array.isArray(response.data.addresses) ? response.data.addresses : [];
      setSavedAddresses(addresses);
      // If there's a default address, select it
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setFormData(prev => ({
          ...prev,
          fullName: defaultAddress.fullname,
          email: defaultAddress.email,
          phone: defaultAddress.phone,
          address: defaultAddress.address,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipCode: defaultAddress.pincode,
          country: defaultAddress.country
        }));
      }
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
      toast.error('Failed to load saved addresses');
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address.id);
    setFormData(prev => ({
      ...prev,
      fullName: address.fullname,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.pincode,
      country: address.country
    }));
    setShowNewAddressForm(false);
  };

  const handleNewAddressClick = () => {
    if (savedAddresses.length >= 2) return;
    setShowNewAddressForm(true);
    setSelectedAddressId(null);
    setFormData(prev => ({
      ...prev,
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }));
  };

  // Save address if it's new
  const saveNewAddress = async () => {
    if (!showNewAddressForm || savedAddresses.length >= 2) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}/api/addresses/create`,
        {
          fullname: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.zipCode,
          isDefault: savedAddresses.length === 0 // Make default if it's the first address
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await fetchSavedAddresses(); // Refresh the address list
      setShowNewAddressForm(false);
      setSelectedAddressId(response.data.address.id);
      toast.success('Address saved successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handleEditClick = (address, e) => {
    e.stopPropagation();
    setEditingAddressId(address.id);
    setFormData({
      ...formData,
      fullName: address.fullname,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.pincode,
      country: address.country
    });
    setShowNewAddressForm(true);
    setIsEditing(true);
  };

  const handleDeleteAddress = async (addressId, e) => {
    e.stopPropagation();
    const addressToDelete = savedAddresses.find(addr => addr.id === addressId);
    const confirmMessage = `Are you sure you want to delete this address?\n\n${addressToDelete?.fullname}\n${addressToDelete?.address}\n${addressToDelete?.city}, ${addressToDelete?.state}`;

    if (window.confirm(confirmMessage)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${BASE_URL}/api/addresses/${addressId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Address deleted successfully');

        // If the deleted address was selected, clear the selection
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
          setFormData(prev => ({
            ...prev,
            fullName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          }));
        }

        // Refresh the address list
        await fetchSavedAddresses();

      } catch (error) {
        console.error('Error deleting address:', error);
        if (error.response?.status === 400) {
          toast.error(error.response.data.message || 'Cannot delete this address');
        } else {
          toast.error('Failed to delete address');
        }
      }
    }
  };

  const handleUpdateAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BASE_URL}/api/addresses/${editingAddressId}`,
        {
          fullname: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.zipCode
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Address updated successfully');
      setShowNewAddressForm(false);
      setIsEditing(false);
      setEditingAddressId(null);
      await fetchSavedAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Failed to update address');
    }
  };

  const handleCancelAddressForm = () => {
    setShowNewAddressForm(false);
    setIsEditing(false);
    setEditingAddressId(null);

    // Reset form data to selected address or clear it
    if (selectedAddressId) {
      const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
      if (selectedAddress) {
        setFormData(prev => ({
          ...prev,
          fullName: selectedAddress.fullname,
          email: selectedAddress.email,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.pincode,
          country: selectedAddress.country
        }));
      }
    } else {
      // Clear form data if no address is selected
      setFormData(prev => ({
        ...prev,
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createOrder = async () => {
    try {
      setIsLoading(true);

      // If showing new address form, save it first with tax calculations
      // Note: Backend currently calculates totals from order items
      // Tax information is sent for potential future use
      if (showNewAddressForm) {
        await saveNewAddress();
      }

      // Format order items to match API structure
      const items = selectedItems.map(item => ({
        productId: item.productId || item.id, // Use productId first, fallback to id for backward compatibility
        quantity: item.quantity,
        priceAtPurchase: item.price,
        gst: item.gst || 0,
        selectedSize: item.selectedSize || null // Include selected size
      }));

      console.log('Selected items for checkout:', selectedItems);
      console.log('Formatted items for API:', items);
      
      // Debug: Check for any items with invalid product IDs
      items.forEach((item, index) => {
        const originalItem = selectedItems[index];
        console.log(`Item ${index}: productId=${item.productId}, selectedSize=${item.selectedSize}, quantity=${item.quantity}`);
        console.log(`  Original item - id: ${originalItem.id}, productId: ${originalItem.productId}, cartItemId: ${originalItem.cartItemId}`);
        
        if (!item.productId || item.productId === null || item.productId === undefined) {
          console.error(`Invalid productId for item ${index}:`, originalItem);
        }
        
        // Validate that we're using the correct product ID (not cart item ID)
        if (item.productId === originalItem.id && originalItem.productId && originalItem.productId !== originalItem.id) {
          console.warn(`Warning: Using cart item ID (${originalItem.id}) instead of product ID (${originalItem.productId}) for item ${index}`);
        }
      });

      // Prepare payload for API with pre-calculated GST totals
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        addressStreet: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        paymentMode: formData.paymentMethod === 'credit-card' ? 'CARD' :
          formData.paymentMethod === 'upi' ? 'UPI' : 'COD',
        items,
        // Pre-calculated GST totals from backend
        subtotal: subtotalAmount,
        taxAmount: taxAmount,
        totalAmount: totalAmount, // This includes product price + GST (excluding shipping)
        shippingCharge: shippingCharge,
        grandTotal: totalAmount + shippingCharge
      };

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}/api/orders/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        toast.success('Order placed successfully!');

        // Remove the specific items that were ordered from the cart
        try {
          await removeSpecificItemsFromCart(selectedItems);
          console.log('Successfully removed ordered items from cart');
        } catch (error) {
          console.error('Failed to remove ordered items from cart:', error);
          // Don't block the success flow if cart cleanup fails
        }

        navigate('/customer/order-success', {
          state: { orderId: response.data.id }
        });
      }
    } catch (error) {
      console.error('Order creation error:', error);
      
      // Check if the error is due to missing products
      if (error.response?.status === 404 && error.response?.data?.message?.includes('no longer available')) {
        toast.error('Some products in your cart are no longer available. Refreshing your cart...');
        
        // Refresh the page to reload the cart without invalid items
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateAddressForm = () => {
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Handle address operations in step 1
    if (step === 1) {
      if (isEditing) {
        // Validate form before updating
        if (!validateAddressForm()) return;
        // Update existing address
        await handleUpdateAddress();
        return; // Don't proceed to next step, stay on address form
      } else if (showNewAddressForm) {
        // Validate form before saving
        if (!validateAddressForm()) return;
        // Save new address
        await saveNewAddress();
        return; // Don't proceed to next step, stay on address form
      } else {
        // Proceed to next step if address is selected
        if (!selectedAddressId && !showNewAddressForm) {
          toast.error('Please select an address or add a new one');
          return;
        }
        // Require pincode before proceeding
        const pin = String(formData.zipCode || '').trim();
        if (!pin) {
          toast.error('Please enter your pincode to continue');
          return;
        }
        setStep(step + 1);
      }
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      await createOrder();
    }
  };

  const goBack = (e) => {
    e.preventDefault();
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/customer/cart');
    }
  };

  return (
    <PageLayout>
      <div className="relative overflow-hidden">
        {/* <BackgroundParticles /> */}
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Checkout Header */}
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight relative right-28">
                Checkout
              </h1>
              <div className="w-32 h-1.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mb-6 mx-auto md:mx-0 relative right-28"></div>
              <p className="text-gray-600 max-w-2xl mx-auto md:mx-0 relative right-28">Complete your purchase securely</p>
              {/* Info banner */}
              {/* <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4 max-w-3xl relative right-28">
                <p className="font-semibold">Customer – Checkout Flow</p>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                  <li><span className="font-medium">Step 1: Delivery Details</span> – Enter your details and a valid 6-digit pincode. Shipping charge (if configured for your pincode) will be added automatically; otherwise delivery is free.</li>
                  <li><span className="font-medium">Step 2: Payment Method</span> – Choose COD, UPI, or Card. For Advance (if enabled), you pay a fixed advance now via UPI and the balance on delivery.</li>
                  <li><span className="font-medium">Step 3: Review & Place Order</span> – Summary shows item price, GST, and shipping (if any). Online payments redirect to a secure payment page; COD places order immediately.</li>
                </ul>
              </div> */}
            </div>

            {/* Steps */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center relative w-full">
                <div className="flex flex-col items-center relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${step >= 1 ? 'border-blue-400 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <MapPin size={20} />
                  </div>
                  <span className="text-sm mt-2 font-medium text-gray-700">Shipping</span>
                </div>
                <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${step > 1 ? 'bg-blue-800' : 'bg-gray-200'}`}></div>

                <div className="flex flex-col items-center relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${step >= 2 ? 'border-blue-400 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <CreditCard size={20} />
                  </div>
                  <span className="text-sm mt-2 font-medium text-gray-700">Payment</span>
                </div>
                <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${step > 2 ? 'bg-blue-800' : 'bg-gray-200'}`}></div>

                <div className="flex flex-col items-center relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${step >= 3 ? 'border-blue-400 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <CheckCircle size={20} />
                  </div>
                  <span className="text-sm mt-2 font-medium text-gray-700">Review</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
                <form onSubmit={handleSubmit}>
                  {step === 1 && (
                    <div className="space-y-5">
                      <h2 className="text-xl font-semibold mb-6 flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                        <span>Shipping Information</span>
                      </h2>

                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Your Addresses</h3>
                        <div className="space-y-3">
                          {savedAddresses.map((address) => (
                            <div
                              key={address.id}
                              className={`relative flex items-start p-4 rounded-lg border transition-all duration-200 ${editingAddressId === address.id
                                  ? 'border-orange-400 bg-orange-50'
                                  : selectedAddressId === address.id
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-blue-400'
                                } cursor-pointer`}
                              onClick={() => !isEditing && handleAddressSelect(address)}
                            >
                              <div className="flex items-center h-5 mt-1">
                                <input
                                  type="radio"
                                  checked={selectedAddressId === address.id}
                                  onChange={() => handleAddressSelect(address)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                              </div>
                              <div className="ml-3 flex-grow">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="block text-sm font-medium text-gray-900">
                                      {address.fullname}
                                    </span>
                                    {address.isDefault && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                                        Default
                                      </span>
                                    )}
                                    {editingAddressId === address.id && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-2">
                                        Editing
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      type="button"
                                      onClick={(e) => handleEditClick(address, e)}
                                      className="text-gray-400 hover:text-blue-600 focus:outline-none"
                                      title="Edit address"
                                    >
                                      <span className="sr-only">Edit</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteAddress(address.id, e)}
                                      className="text-gray-400 hover:text-red-500 focus:outline-none"
                                      title="Delete address"
                                    >
                                      <span className="sr-only">Delete</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{address.address}</p>
                                <p className="text-sm text-gray-500">{address.city}, {address.state} {address.pincode}</p>
                                <p className="text-sm text-gray-500">{address.country}</p>
                                <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                              </div>
                            </div>
                          ))}

                          {/* Add New Address Button */}
                          <button
                            type="button"
                            onClick={handleNewAddressClick}
                            className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                            disabled={savedAddresses.length >= 2}
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Address
                          </button>
                          {savedAddresses.length >= 2 && (
                            <p className="text-red-500 text-xs mt-2 text-center">You can only add up to 2 addresses.</p>
                          )}
                        </div>
                      </div>

                      {/* New Address Form */}
                      {showNewAddressForm && (
                        <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Address' : 'Add New Address'}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                              <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                                placeholder="John Doe"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                                placeholder="john@example.com"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                              placeholder="+91 98765 43210"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                              placeholder="123 Main St, Apt 4B"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                              <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                              <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                              <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Pin Code
                                <span className="ml-2 text-gray-400 cursor-help" title="We’ll automatically calculate shipping when you enter a valid 6-digit pincode.">?</span>
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <h2 className="text-xl font-semibold mb-6 flex items-center">
                        <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                        <span>Payment Method</span>
                      </h2>

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                        <div className="flex flex-col space-y-3">
                          <label className="inline-flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={formData.paymentMethod === 'cod'}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600"
                              required
                            />
                            <span className="ml-3 group-hover:text-blue-600 transition-colors">Cash on Delivery</span>
                          </label>
                          <label className="inline-flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="credit-card"
                              checked={formData.paymentMethod === 'credit-card'}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600"
                              required
                            />
                            <span className="ml-3 group-hover:text-blue-600 transition-colors">Credit Card</span>
                          </label>
                          <label className="inline-flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="upi"
                              checked={formData.paymentMethod === 'upi'}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600"
                              required
                            />
                            <span className="ml-3 group-hover:text-blue-600 transition-colors">UPI/Net Banking</span>
                          </label>
                        </div>
                      </div>

                      {formData.paymentMethod === 'credit-card' && (
                        <div className="mt-5 space-y-4 bg-blue-50 p-5 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                            <input
                              type="text"
                              name="cardNumber"
                              value={formData.cardNumber}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white"
                              placeholder="**** **** **** ****"
                              maxLength="16"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name on Card</label>
                            <input
                              type="text"
                              name="cardName"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white"
                              placeholder="John Doe"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                              <input
                                type="text"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white"
                                placeholder="MM/YY"
                                maxLength="5"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                              <input
                                type="password"
                                name="cvv"
                                value={formData.cvv}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 bg-white"
                                placeholder="***"
                                maxLength="3"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-6 flex items-center">
                        <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                        <span>Review and Confirm</span>
                      </h2>

                      <div className="space-y-5">
                        <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-100">
                          <h3 className="font-medium mb-3 text-blue-600 flex items-center">
                            <MapPin size={16} className="mr-1.5" />
                            Shipping Information
                          </h3>
                          <p className="text-gray-700">{formData.fullName}</p>
                          <p className="text-gray-700">{formData.email}</p>
                          <p className="text-gray-700">{formData.phone}</p>
                          <p className="text-gray-700">{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
                          <p className="text-gray-700">{formData.country}</p>
                        </div>

                        <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-100">
                          <h3 className="font-medium mb-3 text-blue-600 flex items-center">
                            <CreditCard size={16} className="mr-1.5" />
                            Payment Method
                          </h3>
                          <p className="text-gray-700">
                            {formData.paymentMethod === 'cod' && 'Cash on Delivery'}
                            {formData.paymentMethod === 'credit-card' && 'Credit Card'}
                            {formData.paymentMethod === 'upi' && 'UPI/Net Banking'}
                          </p>

                          {formData.paymentMethod === 'credit-card' && (
                            <p className="text-gray-700 mt-1">
                              {formData.cardNumber.replace(/\d{4}(?=.)/g, '****')} | {formData.cardName} | {formData.expiryDate}
                            </p>
                          )}
                        </div>

                        <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-100">
                          <h3 className="font-medium mb-3 text-blue-600 flex items-center">
                            <ShoppingBag size={16} className="mr-1.5" />
                            Order Items
                          </h3>
                          <div className="space-y-3">
                            {selectedItems.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                              >
                                <div className="flex items-center">
                                  <div
                                    className="w-12 h-12 rounded-md bg-cover bg-center mr-3"
                                    style={{ backgroundImage: `url(${item.image})` }}
                                  ></div>
                                  <div>
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <p>Qty: {item.quantity}</p>
                                      {item.selectedSize && (
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                          Size: {item.selectedSize}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {(parseFloat(item.mrp) > parseFloat(item.price)) && (
                                    <p className="text-sm text-gray-500 line-through">
                                      ₹{((parseFloat(item.mrp) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                                    </p>
                                  )}
                                  <p className="font-medium text-blue-600">
                                    ₹{((parseFloat(item.price) || 0) * (1 + (parseFloat(item.gst) || 0) / 100) * (parseInt(item.quantity) || 1)).toFixed(2)}
                                  </p>
                                  {(parseFloat(item.mrp) > parseFloat(item.price)) && (
                                    <p className="text-xs text-green-600 font-medium">
                                      You save ₹{(((parseFloat(item.mrp) || 0) * (1 + (parseFloat(item.gst) || 0) / 100) - (parseFloat(item.price) || 0) * (1 + (parseFloat(item.gst) || 0) / 100)) * (parseInt(item.quantity) || 1)).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                                {/* <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(totalAmount)}
                        </p> */}
                              </div>
                            ))}
                            <div className="text-right space-y-1">
                              <p className="text-sm">Shipping: {formatCurrency(shippingCharge)}</p>
                              <p className="text-lg font-bold text-black-600">
                                Grand Total : {formatCurrency(totalAmount + shippingCharge)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="inline-flex items-center bg-gray-50 p-3 rounded-lg w-full">
                          <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" required />
                          <span className="ml-2 text-gray-700 text-sm">I agree to the terms and conditions</span>

                        </label>

                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-6">
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </button>

                    <div className="flex space-x-3">
                      {(isEditing || showNewAddressForm) && (
                        <button
                          type="button"
                          onClick={handleCancelAddressForm}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading || (step === 1 && (String(formData.zipCode || '').trim().length === 0))}
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${step === 1 && (String(formData.zipCode || '').trim().length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            {isEditing ? 'Update Address' : showNewAddressForm ? 'Save Address' : 'Continue to Payment'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100 sticky top-4 mb-2">
                <div className="border-b border-gray-200 p-5 bg-gradient-to-r from-white to-blue-50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center justify-between">
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-blue-600" />
                      Order Summary
                    </div>
                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                </div>
                <div className="p-5">
                  {/* Pincode entry for shipping calculation */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter Pincode for Shipping</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                      placeholder="e.g. 624303"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shipping will be calculated based on the pincode.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <p className="text-gray-600">Subtotal ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})</p>
                      <p className="font-medium">{formatCurrency(subtotalAmount)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">GST</p>
                      <p className="font-medium">{formatCurrency(taxAmount)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">Shipping</p>
                      <p className="font-medium">{formatCurrency(shippingCharge)}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <p className="text-lg font-semibold text-gray-900">Total</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(totalAmount + shippingCharge)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800 flex items-center">
                          <CheckCircle size={16} className="mr-1.5 text-blue-600" />
                          Order Protection
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Protect your order in case of damage or loss during shipping</p>
                      </div>
                      <p className="font-medium text-blue-600">₹299.00</p>
                    </div>
                  </div> */}

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck size={16} className="mr-2" />
                      <span>Estimated delivery: 3-5 business days</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag size={16} className="mr-2" />
                      <span>Free returns within 30 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Checkout;
