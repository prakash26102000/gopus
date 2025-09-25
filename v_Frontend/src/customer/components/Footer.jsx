import React from 'react';
import { Link} from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Send, ArrowRight } from 'lucide-react';
// import BackgroundParticles from './BackgroundParticles';
import { BASE_URL } from '../../util';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-20 z-50 ">
      <div className="container mx-auto px-4 w-[95%]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* About Us Column */}
          <div>
            {/* <h3 className="text-xl font-bold mb-6">GOPUS ECOM</h3> */}
            <div className="flex items-center gap-4">
                <img
                  src={`${BASE_URL}/uploads/logo/${encodeURIComponent('gopus_logo.png')}`}
                  alt="Logo"
                  className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain"
                />
            </div>
            <p className="text-gray-400 mb-6">
              Elevating everyday style with premium fashion essentials designed for modern living.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                <Facebook size={20} className="group-hover:animate-pulse" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                <Twitter size={20} className="group-hover:animate-pulse" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                <Instagram size={20} className="group-hover:animate-pulse" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                <Youtube size={20} className="group-hover:animate-pulse" />
              </a>
            </div>
          </div>

          {/* Customer Care Column */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Customer Care</h3>
            <ul className="space-y-3">
             
              <li>
                <Link to="/customer/about-us" className="text-white/80 hover:text-white transition-all duration-300 relative inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <a href="/customer/orders" className="text-white/80 hover:text-white transition-all duration-300 relative inline-block">
                  Track Your Order
                </a>
              </li>
              <li>
                <a href="/customer/contact-us" className="text-white/80 hover:text-white transition-all duration-300 relative inline-block">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Policy Column */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Policies</h3>
            <ul className="space-y-3">
              <li>
                <a href="/customer/privacy-policy" className="text-white/80 hover:text-white transition-all duration-300 relative inline-block">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/customer/term-and-conditions" className="text-white/80 hover:text-white transition-all duration-300 relative inline-block">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/customer/refund-return-policy" className="text-white/80 hover:text-white transition-all duration-300 relative inline-block">
                  Return Policy
                </a>
              </li> 
            </ul>
          </div>


        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Gopus Ecom. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="customer/term-and-conditions" className="text-sm text-white/80 hover:text-white transition-all duration-300">
              Terms
            </a>
            <a href="/customer/privacy-policy" className="text-sm text-white/80 hover:text-white transition-all duration-300">
              Privacy
            </a>
            <a href="/customer/refund-return-policy" className="text-sm text-white/80 hover:text-white transition-all duration-300">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;




