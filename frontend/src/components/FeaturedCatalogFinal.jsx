import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaGasPump, FaPalette } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './FeaturedCatalog.css';

const FeaturedCatalog = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const carouselRef = useRef(null);
  const autoScrollRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    loadVehiculos();
  }, []);

  // Auto-scroll functionality - solo si hay más de 4 elementos y el usuario no ha interactuado
  useEffect(() => {
    if (vehiculos.length > 4 && !hasUserInteracted) {
      autoScrollRef.current = setInterval(() => {
        scrollToNext();
      }, 6000); // Cambiar cada 6 segundos

      return () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current);
        }
      };
    }
  }, [vehiculos, currentIndex, hasUserInteracted]);

  const loadVehiculos = async () => {
    try {
      setLoading(true);
      // Obtener vehículos visibles en el catálogo público
      const vehiculosResponse = await axios.get('http://localhost:8000/vehiculos/catalogo/publico');
      const vehiculosDisponibles = vehiculosResponse.data.filter(vehiculo => 
        vehiculo.destacado
      );

      // Cargar imágenes para cada vehículo destacado (máximo 6)
      const vehiculosConImagenes = await Promise.all(
        vehiculosDisponibles.slice(0, 6).map(async (vehiculo) => {
          try {
            const imagenesResponse = await axios.get(`http://localhost:8000/vehiculos/${vehiculo.id}/imagenes`);
            const imagenes = imagenesResponse.data;
            const imagenPrincipal = imagenes.find(img => img.es_principal) || imagenes[0];
            
            return {
              ...vehiculo,
              foto: imagenPrincipal ? `data:image/jpeg;base64,${imagenPrincipal.imagen_data}` : 
                    'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=80'
            };
          } catch (error) {
            console.error(`Error cargando imágenes para vehículo ${vehiculo.id}:`, error);
            return {
              ...vehiculo,
              foto: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=80'
            };
          }
        })
      );

      setVehiculos(vehiculosConImagenes);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      setError('Error al cargar los vehículos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Precio a consultar';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const isNuevo = (vehiculo) => {
    // Considerar como "nuevo" si fue registrado en los últimos 30 días
    if (!vehiculo.fecha_creacion) return false;
    const fechaCreacion = new Date(vehiculo.fecha_creacion);
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return fechaCreacion > hace30Dias;
  };

  const isOferta = (vehiculo) => {
    // Considerar como "oferta" si tiene precio de venta menor al precio de compra + 20%
    if (!vehiculo.precio_compra || !vehiculo.precio_venta) return false;
    const precioConMargen = vehiculo.precio_compra * 1.2;
    return vehiculo.precio_venta < precioConMargen;
  };

  const scrollToNext = () => {
    if (carouselRef.current && vehiculos.length > 0) {
      const nextIndex = (currentIndex + 1) % vehiculos.length;
      setCurrentIndex(nextIndex);
      carouselRef.current.scrollTo({
        left: nextIndex * 320, // Ancho de una tarjeta + margen
        behavior: 'smooth'
      });
    }
  };

  const scrollToPrev = () => {
    if (carouselRef.current && vehiculos.length > 0) {
      const prevIndex = currentIndex === 0 ? vehiculos.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      carouselRef.current.scrollTo({
        left: prevIndex * 320,
        behavior: 'smooth'
      });
    }
  };

  const handleManualScroll = (direction) => {
    setHasUserInteracted(true);
    
    // Pausar auto-scroll cuando el usuario interactúa manualmente
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    
    if (direction === 'next') {
      scrollToNext();
    } else {
      scrollToPrev();
    }

    // Reanudar auto-scroll después de 10 segundos solo si hay más de 4 elementos
    setTimeout(() => {
      if (vehiculos.length > 4) {
        setHasUserInteracted(false);
      }
    }, 10000);
  };

  // Touch/Swipe handlers para móviles
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleManualScroll('next');
    }
    if (isRightSwipe) {
      handleManualScroll('prev');
    }

    // Reset touch values
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (loading) {
    return (
      <section id="catalogo" className="featured-catalog container my-5">
        <h2 className="mb-4 text-center">Nuestros vehículos destacados</h2>
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando vehículos...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="catalogo" className="featured-catalog container my-5">
        <h2 className="mb-4 text-center">Nuestros vehículos destacados</h2>
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section id="catalogo" className="featured-catalog container my-5 position-relative">
      <h2 className="mb-4 text-center fw-bold">Nuestros vehículos destacados</h2>

      {vehiculos.length > 0 ? (
        <div className="position-relative">
          {/* Botón izquierdo - mejorado */}
          {vehiculos.length > 1 && (
            <button
              className="carousel-nav-btn-improved carousel-nav-btn-left position-absolute"
              onClick={() => handleManualScroll('prev')}
              aria-label="Anterior"
              style={{
                left: '-25px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.6)';
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                e.target.style.transform = 'translateY(-50%) scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
            >
              <FaChevronLeft size={18} />
            </button>
          )}

          <div
            ref={carouselRef}
            className="d-flex gap-3 overflow-auto"
            style={{
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'pan-x'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => {
              // Pausar auto-scroll cuando el mouse está sobre el carrusel
              if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
              }
            }}
            onMouseLeave={() => {
              // Reanudar auto-scroll cuando el mouse sale del carrusel
              if (vehiculos.length > 4 && !hasUserInteracted) {
                autoScrollRef.current = setInterval(() => {
                  scrollToNext();
                }, 6000);
              }
            }}
          >
            {vehiculos.map((vehiculo) => (
              <div
                key={vehiculo.id}
                className="flex-shrink-0"
                style={{ width: '300px' }}
              >
                <Link to={`/vehiculo/${vehiculo.id}`} className="text-decoration-none">
                  <div className="catalog-card h-100">
                    <div className="card-image-container">
                      <img 
                        src={vehiculo.foto} 
                        className="card-img-top" 
                        alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                      />
                      <div className="card-overlay">
                      </div>
                    </div>

                    <div className="card-body">
                      <h5 className="card-title">{vehiculo.marca} {vehiculo.modelo}</h5>
                      
                      <div className="vehicle-details">
                        {vehiculo.cilindraje && (
                          <div className="detail-item">
                            <FaGasPump className="detail-icon" />
                            <span>Cilindraje: {vehiculo.cilindraje}</span>
                          </div>
                        )}
                        {vehiculo.color && (
                          <div className="detail-item">
                            <FaPalette className="detail-icon" />
                            <span>Color: {vehiculo.color}</span>
                          </div>
                        )}
                      </div>

                      <div className="price-section">
                        <div className="price">
                          {formatCurrency(vehiculo.precio_venta)}
                        </div>
                      </div>

                      <button className="btn btn-primary w-100 view-details-btn">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Botón derecho - mejorado */}
          {vehiculos.length > 1 && (
            <button
              className="carousel-nav-btn-improved carousel-nav-btn-right position-absolute"
              onClick={() => handleManualScroll('next')}
              aria-label="Siguiente"
              style={{
                right: '-25px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.6)';
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                e.target.style.transform = 'translateY(-50%) scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
            >
              <FaChevronRight size={18} />
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="card border-0 bg-light">
            <div className="card-body py-5">
              <i className="fas fa-motorcycle text-muted mb-3" style={{ fontSize: '3rem' }}></i>
              <h4 className="text-muted mb-3">No hay vehículos destacados</h4>
              <p className="text-muted">Los administradores aún no han seleccionado vehículos para destacar.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedCatalog;
