import React from 'react';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero';
import About from '../components/About';
import FeaturedCatalog from '../components/FeaturedCatalogFinal';
import WhatsAppButton from '../components/WhatsAppButton';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <>
      <Navbar isHome={true} />
      <Hero />
      <FeaturedCatalog />
      <About />
      <WhatsAppButton />
      <Footer />
    </>
  );
};

export default Home;
