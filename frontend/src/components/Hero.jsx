import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';
import fondo from '../assets/fondo.jpg';

const Hero = () => {
  return (
<section className="hero-section" style={{ backgroundImage: `url(${fondo})` }}>
  <div className="hero-overlay"></div>
  <div className="container hero-content d-flex flex-column justify-content-center align-items-center h-100">
    <img src={require('../assets/logo-jerosmotos.png')} alt="Logo Jeros'Motos" className="hero-logo mb-3" />
    <h1 className="hero-slogan">Tu aliado en compra, venta y empeño de vehiculos</h1>
    <div className="hero-buttons mt-4">
      <Link to="/catalogo" className="btn btn-catalogo btn-lg hero-btn me-3">Ver catálogo</Link>
      <a href="https://wa.me/573112256767" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg hero-btn">Contáctanos por WhatsApp</a>
    </div>
  </div>
</section>
  );
};

export default Hero;
