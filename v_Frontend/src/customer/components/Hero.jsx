import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ChevronRight } from "lucide-react";
import gifBackground from './vecteezy.gif'; // Import the GIF file

// Improved Horizontal Scroll Banner Component
const HorizontalScrollBanner = ({ items, speed = 30, direction = 'left', className = '' }) => {
  return (
    <div className={`flex overflow-hidden whitespace-nowrap ${className}`}>
      <div
        className="flex animate-infinite-scroll"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {items.map((item, index) => (
          <div key={index} className="flex-shrink-0 mx-4">
            {item}
          </div>
        ))}
      </div>
      <div
        className="flex animate-infinite-scroll"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {items.map((item, index) => (
          <div key={`dup-${index}`} className="flex-shrink-0 mx-4">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Banner Card Component
const BannerCard = ({ image, title, subtitle, textColor = 'text-black' }) => (
  <div className={`rounded-xl overflow-hidden shadow-lg ${background} flex items-center w-64 h-28`}>
    <div className="w-1/3 h-full">
      <img src={image} alt={title} className="h-full object-cover" />
    </div>
    <div className={`w-2/3 p-3 ${textColor}`}>
      <h3 className="font-bold text-sm">{title}</h3>
      <p className="text-xs">{subtitle}</p>
      <div className="flex items-center text-xs mt-1 font-medium">
        Shop now <ChevronRight size={12} className="ml-1" />
      </div>
    </div>
  </div>
);

// Feature Card Component with Flexbox layout
// const FeatureCard = ({ icon, title, description }) => (
//   <div className="flex flex-col bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-px">
//     <div className="flex items-center justify-center bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 mb-4">
//       {icon}
//     </div>
//     <h3 className="font-bold text-lg mb-2">{title}</h3>
//     <p className="text-gray-600 text-sm flex-grow">{description}</p>
//   </div>
// );

const Hero = () => {

  return (
    <section className="w-full bg-gradient-to-b from-white via-blue-50 to-white overflow-hidden mt-0 pb-6">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-10 md:mb-0 md:pr-6 text-center md:text-left">
            <h1 className="text-3xl md:text-6xl font-bold opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards] leading-tight font-playwrite bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              A Touch of Magic <span className="text-black font-sans block md:inline">A World of Wonder</span>
            </h1>
            <div className="flex justify-center md:justify-start space-x-4 opacity-0 animate-[fade-in_0.5s_ease-out_0.6s_forwards]">
              <Link
                to="/customer/shop"
                className="bg-black mt-10 text-white px-4 md:px-6 py-3 md:py-4 rounded-full font-semibold transition-all duration-300 hover:bg-black hover:shadow-lg hover:scale-105 flex items-center text-sm md:text-base w-40 h-12"
              >
                <ShoppingBag className="mr-2 h-6 w-6 md:h-5 md:w-5" />
                Shop Now 
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2 opacity-0 animate-[fade-in_0.5s_ease-out_0.8s_forwards]">
            <div>
              {/* GIF image replacing the video */}
              <img
                src={gifBackground}
                alt="Animated shopping experience"
                className="w-full h-auto rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;