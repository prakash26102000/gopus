import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LogIn, X } from 'lucide-react';

const LoginRequiredModal = ({ show, onCancel, loginRedirectState }) => {
  const navigate = useNavigate();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  const handleLogin = () => {
    navigate('/login', { state: loginRedirectState });
  };

  return (
    <div className="fixed inset-0 z-1000">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        aria-hidden="true"
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-10">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative w-[95%] sm:w-full max-w-[90%] sm:max-w-md bg-white rounded-2xl shadow-2xl transition-all duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Modal content */}
            <div className="p-5 sm:p-6 md:p-8">
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="p-3 bg-blue-100/80 backdrop-blur-sm rounded-full mb-4">
                  <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                
                {/* Title */}
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                  Login Required
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 mb-5 max-w-[250px] sm:max-w-xs mx-auto leading-relaxed">
                  You need to be logged in to perform this action. Please log in to continue.
                </p>
                
                {/* Buttons */}
                <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Login
                  </button>
                  <button
                    onClick={onCancel}
                    className="w-full flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-700 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
                
                {/* Sign up prompt */}
                <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;