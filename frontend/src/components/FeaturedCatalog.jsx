import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './FeaturedCatalog.css';

const FeaturedCatalog = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const carouselRef = useRef(null);

  useEffect(() => {
    loadVehiculos();
  }, []);

  const loadVehiculos = async () => {
    try {
      setLoading(true);
      // Obtener vehículos disponibles
      const vehiculosResponse = await axios.get('http://localhost:8000/vehiculos/');
      const vehiculosDisponibles = vehiculosResponse.data.filter(vehiculo => 
        vehiculo.estado === 'disponible' && vehiculo.destacado
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

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -320, // Ancho de una tarjeta + margen
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 320, // Ancho de una tarjeta + margen
        behavior: 'smooth'
      });
    }
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
    <section id="catalogo" className="featured-catalog container my-5">
      <h2 className="mb-4 text-center fw-bold">Nuestros vehículos destacados</h2>
      <div className="row justify-content-center">
        {vehiculos.length > 0 ? (
          vehiculos.map((vehiculo) => (
            <div key={vehiculo.id} className="col-lg-4 col-md-6 mb-4">
              <Link to={`/vehiculo/${vehiculo.id}`} className="text-decoration-none">
                <div className="card moto-card h-100 shadow-sm border-0 position-relative overflow-hidden" 
                     style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = 'translateY(-5px)';
                       e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                     }}>
                  
                  <div className="position-relative overflow-hidden">
                    <img 
                      src={vehiculo.foto} 
                      className="card-img-top" 
                      alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                      style={{ 
                        height: '280px', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                    
                    {/* Badges superiores */}
                    <div className="position-absolute top-0 start-0 m-2">
                      {isNuevo(vehiculo) && (
                        <span className="badge bg-danger me-1 mb-1 px-2 py-1">
                          <i className="fas fa-star me-1"></i>Nuevo
                        </span>
                      )}
                      {isOferta(vehiculo) && (
                        <span className="badge bg-warning text-dark me-1 mb-1 px-2 py-1">
                          <i className="fas fa-tag me-1"></i>En oferta
                        </span>
                      )}
                    </div>

                    {/* Badge de estado */}
                    <div className="position-absolute top-0 end-0 m-2">
                      <span className={`badge px-2 py-1 ${
                        vehiculo.estado === 'disponible' ? 'bg-success' :
                        vehiculo.estado === 'vendido' ? 'bg-primary' :
                        vehiculo.estado === 'empeño' ? 'bg-warning text-dark' :
                        'bg-secondary'
                      }`}>
                        {vehiculo.estado === 'disponible' ? 'Disponible' :
                         vehiculo.estado === 'vendido' ? 'Vendido' :
                         vehiculo.estado === 'empeño' ? 'En empeño' :
                         vehiculo.estado}
                      </span>
                    </div>

                    {/* Overlay gradient */}
                    <div className="position-absolute bottom-0 start-0 w-100" 
                         style={{
                           background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                           height: '60px'
                         }}>
                    </div>
                  </div>

                  <div className="card-body d-flex flex-column p-4">
                    {/* Título del vehículo */}
                    <h5 className="card-title fw-bold mb-2 text-dark" 
                        style={{ fontSize: '1.25rem', lineHeight: '1.3' }}>
                      {vehiculo.marca} {vehiculo.modelo}
                    </h5>

                    {/* Precio destacado */}
                    <div className="mb-3">
                      <h4 className="text-danger fw-bold mb-1" style={{ fontSize: '1.5rem' }}>
                        {formatCurrency(vehiculo.precio_venta)}
                      </h4>
                      {vehiculo.precio_compra && vehiculo.precio_venta < vehiculo.precio_compra * 1.2 && (
                        <small className="text-muted text-decoration-line-through">
                          {formatCurrency(vehiculo.precio_compra * 1.2)}
                        </small>
                      )}
                    </div>

                    {/* Detalles del vehículo */}
                    <div className="mb-3 flex-grow-1">
                      {vehiculo.cilindraje && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-tachometer-alt text-muted me-2"></i>
                          <span className="text-muted small">Cilindraje: <strong>{vehiculo.cilindraje}</strong></span>
                        </div>
                      )}
                      {vehiculo.color && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-palette text-muted me-2"></i>
                          <span className="text-muted small">Color: <strong>{vehiculo.color}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Botón de acción mejorado */}
                    <div className="mt-auto">
                      <div className="btn btn-danger w-100 fw-bold py-2 d-flex align-items-center justify-content-center"
                           style={{ 
                             background: 'linear-gradient(45deg, #dc3545, #c82333)',
                             border: 'none',
                             borderRadius: '8px',
                             transition: 'all 0.3s ease'
                           }}
                           onMouseEnter={(e) => {
                             e.target.style.background = 'linear-gradient(45deg, #c82333, #a71e2a)';
                             e.target.style.transform = 'translateY(-1px)';
                           }}
                           onMouseLeave={(e) => {
                             e.target.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
                             e.target.style.transform = 'translateY(0)';
                           }}>
                        <i className="fas fa-eye me-2"></i>
                        Ver detalles
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <div className="card border-0 bg-light">
              <div className="card-body py-5">
                <i className="fas fa-motorcycle text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <h4 className="text-muted mb-3">No hay vehículos destacados</h4>
                <p className="text-muted">Los administradores aún no han seleccionado vehículos para destacar.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCatalog;
