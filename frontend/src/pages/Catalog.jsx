import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGasPump, FaPalette, FaSearch, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer';
import './Catalog.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Catalog = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [filteredVehiculos, setFilteredVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    loadVehiculos();
  }, []);

  useEffect(() => {
    filterVehiculos();
  }, [vehiculos, searchTerm, filterEstado, filterMarca]);

  const loadVehiculos = async () => {
    try {
      setLoading(true);
      // Obtener vehículos visibles en el catálogo público
      const response = await axios.get('http://localhost:8000/vehiculos/catalogo/publico');
      const vehiculosData = response.data;
      
      // Ya están filtrados por el endpoint, solo los disponibles y visibles
      const vehiculosDisponibles = vehiculosData;
      
      // Cargar imágenes para cada vehículo
      const vehiculosConImagenes = await Promise.all(
        vehiculosDisponibles.map(async (vehiculo) => {
          try {
            const imagenesResponse = await axios.get(`http://localhost:8000/vehiculos/${vehiculo.id}/imagenes`);
            const imagenes = imagenesResponse.data;
            
            // Buscar imagen principal o tomar la primera
            const imagenPrincipal = imagenes.find(img => img.es_principal) || imagenes[0];
            
            return {
              ...vehiculo,
              imagen: imagenPrincipal ? `data:image/jpeg;base64,${imagenPrincipal.imagen_data}` : null,
              totalImagenes: imagenes.length
            };
          } catch (imageError) {
            console.error(`Error cargando imágenes para vehículo ${vehiculo.id}:`, imageError);
            return {
              ...vehiculo,
              imagen: null,
              totalImagenes: 0
            };
          }
        })
      );
      
      setVehiculos(vehiculosConImagenes);
      
      // Extraer marcas únicas para el filtro
      const marcasUnicas = [...new Set(vehiculosConImagenes.map(v => v.marca))].sort();
      setMarcas(marcasUnicas);
      
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      setError('Error al cargar el catálogo de vehículos');
    } finally {
      setLoading(false);
    }
  };

  const filterVehiculos = () => {
    let filtered = vehiculos;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(vehiculo =>
        vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehiculo.color && vehiculo.color.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por marca
    if (filterMarca) {
      filtered = filtered.filter(vehiculo => vehiculo.marca === filterMarca);
    }

    setFilteredVehiculos(filtered);
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Precio a consultar';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterMarca('');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ marginTop: '80px' }}></div>
        <div className="container my-5">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando catálogo...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{ marginTop: '80px' }}></div>
        <div className="container my-5">
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ marginTop: '80px' }}></div>
      
      <div className="catalog-page">
        <div className="container py-5">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="catalog-title">Catálogo Completo</h1>
            <p className="catalog-subtitle">Descubre todos nuestros vehículos disponibles</p>
          </div>

          {/* Filtros */}
          <div className="filters-section mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Buscar por marca, modelo o color..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select filter-select"
                  value={filterMarca}
                  onChange={(e) => setFilterMarca(e.target.value)}
                >
                  <option value="">Todas las marcas</option>
                  {marcas.map(marca => (
                    <option key={marca} value={marca}>{marca}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={clearFilters}
                >
                  <FaFilter className="me-2" />
                  Limpiar filtros
                </button>
              </div>
              <div className="col-md-2">
                <div className="results-count">
                  <span className="badge bg-primary">{filteredVehiculos.length} vehículos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de vehículos */}
          {filteredVehiculos.length === 0 ? (
            <div className="no-results">
              <div className="text-center py-5">
                <FaSearch size={64} className="text-muted mb-3" />
                <h3 className="text-muted">No se encontraron vehículos</h3>
                <p className="text-muted">Intenta ajustar los filtros de búsqueda</p>
                <button className="btn btn-primary" onClick={clearFilters}>
                  Ver todos los vehículos
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {filteredVehiculos.map((vehiculo, index) => (
                <div key={vehiculo.id} className="col-lg-4 col-md-6">
                  <Link 
                    to={`/vehiculo/${vehiculo.id}`} 
                    className="text-decoration-none"
                  >
                    <div className={`catalog-card ${index < 6 ? 'animate-in' : ''}`}>
                      <div className="card-image-container">
                        <img
                          src={vehiculo.imagen || 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80'}
                          alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                          className="card-img-top"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80';
                          }}
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
          )}
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Catalog;
