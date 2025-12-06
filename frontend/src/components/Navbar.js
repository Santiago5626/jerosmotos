import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = ({ isHome }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true); // fixed navbar with dark background on non-home pages
      return;
    }
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 0) {  // Cambiado para que cambie al hacer scroll desde el inicio
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const handleToggle = () => {
    setMenuOpen(!menuOpen);
  };

  // Detectar si es móvil para condicionar el fondo blanco solo en móvil cuando el menú está abierto
  const isMobile = window.innerWidth < 992; // Bootstrap lg breakpoint

  return (
    <nav
      className={`navbar fixed-top navbar-expand-lg ${
        scrolled || (menuOpen && isMobile) ? 'navbar-light bg-white shadow' : 'navbar-dark bg-transparent'
      }`}
      style={{ transition: 'background-color 0.4s ease' }}
    >
      <div className="container-fluid">
        <a className="navbar-brand text-danger fw-bold" href="#hero">
          Jeros'Motos
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={handleToggle}
          style={{ backgroundColor: 'transparent' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className={`nav-link ${scrolled || (menuOpen && isMobile) ? 'text-dark' : 'text-white'}`} href="#catalogo">
                Catálogo
              </a>
            </li>
            <li className="nav-item">
              <a className={`nav-link ${scrolled || (menuOpen && isMobile) ? 'text-dark' : 'text-white'}`} href="#quienes-somos">
                ¿Quiénes somos?
              </a>
            </li>
            <li className="nav-item">
              <a className={`nav-link ${scrolled || (menuOpen && isMobile) ? 'text-dark' : 'text-white'}`} href="#contacto">
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
