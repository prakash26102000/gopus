import React from 'react';
import Hero from '../components/Hero';
import CategoryIcons from '../components/CategoryIcons';
import OfferBanner from '../components/Offerbanner';
// import BackgroundParticles from '../components/BackgroundParticles';
import FeaturedProducts from '../components/FeaturedProducts';
import TopRatedProducts from '../components/TopRatedProducts';
import WhyChooseUs from '../components/WhyChooseUs';
import PartnerLogos from '../components/PartnerLogos';
import AllProducts from '../components/Allproducts';
import BackgroundDecor from '../components/BackgroundDecor';
import LazySection from '../components/LazySection';

const Home = () => {
  return (
    <div className="flex flex-col relative w-full min-h-screen bg-white">
      {/* Decorative background */}
      <BackgroundDecor />
      {/* <BackgroundParticles count={30} /> */}

      {/* Category Icons */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CategoryIcons />
      </div>

      {/* Offer Banner / Hero */}
      <div className="container mx-auto px-0 sm:px-6 lg:px-8">
        <OfferBanner />
        {/* <Hero /> */}
      </div>

      {/* Featured Products */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <FeaturedProducts />
      </div>

      {/* Top Rated Products */}
      <LazySection fallback={<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <TopRatedProducts />
        </div>
      </LazySection>

      {/* All Products */}
      <LazySection fallback={<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10"><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <AllProducts />
        </div>
      </LazySection>

      {/* Partners */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PartnerLogos />
      </div>

      {/* Why Choose Us */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <WhyChooseUs />
      </div>
    </div>
  );
};

export default Home;
