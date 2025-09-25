import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
// import BackgroundParticles from '../components/BackgroundParticles';
const OrderSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      {/* <BackgroundParticles /> */}
      <div className="bg-white p-8 rounded-xl shadow-md max-w-lg w-full text-center relative z-100">
        <div className="mb-6 text-green-500">
          <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-16 w-16" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Order Placed Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase! Your order has been received and is being processed. You will receive an email confirmation shortly.
        </p>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <Link 
            to="/customer/home" 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg flex items-center justify-center md:flex-1 transition-colors"
          >
            <Home size={18} className="mr-2" />
            Return Home
          </Link>
          <Link 
            to="/customer/shop" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center md:flex-1 transition-colors"
          >
            <ShoppingBag size={18} className="mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
