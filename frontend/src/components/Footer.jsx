import React from 'react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer id="contacto" className="footer bg-dark text-white py-4">
      <div className="container text-center">
        <div className="mb-3">
          <img
            src={require('../assets/logo-jerosmotos.png')}
            alt="Jeros'Motos"
            style={{ maxHeight: '50px' }}
          />
        </div>
        <div className="mb-3">
          <a
            href="https://wa.me/573112256767"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white me-3"
            aria-label="WhatsApp"
          >
            <FaWhatsapp size={24} />
          </a>
          <a
            href="https://www.instagram.com/jerosmotos/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white"
            aria-label="Instagram"
          >
            <FaInstagram size={24} />
          </a>
        </div>
        <div className="mb-3">
          <p>Dirección: Cl. 35 # 20A-63, Villavicencio, Meta, Colombia</p>
          <p>
            <a
              href="https://maps.app.goo.gl/hm9DmGMt7jFw3Gbn8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Ver en Google Maps
            </a>
          </p>
        </div>
        <div>
          <p>© {new Date().getFullYear()} Jeros'Motos. Todos los derechos reservados.</p>
          <p>Desarrollado por Santiago Lobo</p>
          <div className="mt-3">
            <a
              href="/admin/login"
              className="text-muted"
              style={{ 
                fontSize: '0.85rem', 
                textDecoration: 'none',
                opacity: 0.7,
                transition: 'opacity 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
              Ingreso administrativo
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
