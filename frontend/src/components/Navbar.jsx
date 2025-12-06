import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determinar si estamos en una página con fondo claro
  const isLightBackgroundPage = location.pathname === '/catalogo' || location.pathname.startsWith('/vehiculo/');

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleCatalogClick = (e) => {
    e.preventDefault();
    navigate('/catalogo');
  };

  const handleSectionClick = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={`navbar fixed-top navbar-expand-lg ${
        scrolled ? 'navbar-dark bg-dark shadow' : 'navbar-transparent'
      } ${isLightBackgroundPage ? 'light-bg-page' : ''}`}
      style={{ transition: 'background-color 0.4s ease' }}
    >
      <div className="container-fluid">
        <a 
          href="/" 
          onClick={handleHomeClick}
          className="navbar-brand text-danger fw-bold text-decoration-none"
          style={{ cursor: 'pointer' }}
        >
          Jeros'Motos
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a 
                href="/catalogo" 
                onClick={handleCatalogClick}
                className="nav-link"
                style={{ cursor: 'pointer' }}
              >
                Catálogo
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#quienes-somos" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionClick('quienes-somos');
                }}
                className="nav-link"
                style={{ cursor: 'pointer' }}
              >
                ¿Quiénes somos?
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#contacto" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionClick('contacto');
                }}
                className="nav-link"
                style={{ cursor: 'pointer' }}
              >
                Contacto
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
