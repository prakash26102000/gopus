import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Tag, Store, Truck, Star } from 'lucide-react';
import axios from 'axios'; // Added for API calls
import { BASE_URL } from '../../util'; // Added for API base URL
import { Link } from 'react-router-dom';
import banner from '../assets/banner.png'; // Local banner image

const OfferBanner = () => {
  const [dynamicDescriptionImageUrl, setDynamicDescriptionImageUrl] = useState(null);

  // const icons = [
  //   { icon: <Tag className="w-6 h-6 mr-2" />, text: 'Great Discounts' },
  //   { icon: <ShoppingBag className="w-6 h-6 mr-2" />, text: 'New Arrivals' },
  //   { icon: <Store className="w-6 h-6 mr-2" />, text: 'Shop Local' },
  //   { icon: <Truck className="w-6 h-6 mr-2" />, text: 'Fast Delivery' },
  //   { icon: <Star className="w-6 h-6 mr-2" />, text: 'Top Rated' },
  //   { icon: <Tag className="w-6 h-6 mr-2" />, text: 'Great Discounts' },
  //   { icon: <ShoppingBag className="w-6 h-6 mr-2" />, text: 'New Arrivals' },
  //   { icon: <Store className="w-6 h-6 mr-2" />, text: 'Shop Local' },
  //   { icon: <Truck className="w-6 h-6 mr-2" />, text: 'Fast Delivery' },
  //   { icon: <Star className="w-6 h-6 mr-2" />, text: 'Top Rated' },
  // ];

  useEffect(() => {
    const fetchDescriptionImage = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/banner/getbanner`);
        if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          const banner = response.data.data[0];
          const descImgPath = banner.bannerimageurl;
          if (descImgPath) {
            const fullUrl = descImgPath.startsWith('http')
              ? descImgPath
              : `${BASE_URL}/uploads/${descImgPath.startsWith('/') ? descImgPath.substring(1) : descImgPath}`;
            setDynamicDescriptionImageUrl(fullUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching banner description image:', error);
      }
    };

    fetchDescriptionImage();
  }, []);

  return (
    <>
      <div className="relative text-gray-800 rounded-2xl overflow-hidden p-3 sm:p-4">
        {dynamicDescriptionImageUrl && (
          <div className="w-full mt-0 sm:mt-1 sm:mb-1">
            <Link to="/customer/shop">
              <img
                src={dynamicDescriptionImageUrl}
                alt="Special Offer Details"
                className="w-full h-auto sm:h-[50vh] overflow-hidden rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Link>
          </div>
        )}
      </div>
      {/* <div className="relative z-10 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto">
        <div className="w-full md:w-2/3 text-center md:text-left  md:mb-0">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 md:mb-4 tracking-tight text-gray-900">
            Exclusive Offers!
          </h2>
          <p className="text-base sm:text-lg mb-6 md:mb-8 text-gray-700">
            Don't wait — these <span className="font-semibold text-blue-500">limited-time offers</span> are flying off the shelves!
          </p>
        </div>
        <img src={banner} alt="Special Offer Details" className="w-40 h-40 object-contain rounded-lg mr-20 hidden md:block" />
      </div> */}

    </>
  );
};

export default OfferBanner;
