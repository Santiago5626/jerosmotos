import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaGasPump, FaPalette, FaCalendarAlt, FaShieldAlt, FaWhatsapp, FaShare, FaVideo, FaPlay, FaTimes, FaChevronLeft, FaChevronRight, FaExpand } from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../config';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer';
import 'bootstrap/dist/css/bootstrap.min.css';

const VehicleDetail = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [media, setMedia] = useState([]);
  const [mainMedia, setMainMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadVehicleData();
  }, [id]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);

      // Cargar datos del vehículo
      const vehicleResponse = await axios.get(`${API_URL}/vehiculos/${id}`);
      const vehicleData = vehicleResponse.data;
      setVehicle(vehicleData);

      // Cargar imágenes del vehículo (temporalmente usando el endpoint existente)
      try {
        const imagenesResponse = await axios.get(`${API_URL}/vehiculos/${id}/imagenes`);
        const imagenesData = imagenesResponse.data;

        if (imagenesData.length > 0) {
          const mediaFormateada = imagenesData.map(img => ({
            ...img,
            url: `data:image/jpeg;base64,${img.imagen_data}`,
            tipo: 'imagen'
          }));

          setMedia(mediaFormateada);

          // Establecer media principal (primera imagen principal o primera imagen)
          const mediaPrincipal = mediaFormateada.find(item => item.es_principal) || mediaFormateada[0];
          setMainMedia(mediaPrincipal);
        } else {
          // Imagen por defecto si no hay imágenes
          const defaultMedia = {
            url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80',
            tipo: 'imagen',
            es_principal: true
          };
          setMedia([defaultMedia]);
          setMainMedia(defaultMedia);
        }
      } catch (imageError) {
        console.error('Error cargando imágenes:', imageError);
        // Imagen por defecto si hay error
        const defaultMedia = {
          url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80',
          tipo: 'imagen',
          es_principal: true
        };
        setMedia([defaultMedia]);
        setMainMedia(defaultMedia);
      }

    } catch (error) {
      console.error('Error cargando vehículo:', error);
      setError('Error al cargar la información del vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = (mediaItem) => {
    setMainMedia(mediaItem);
    const index = media.findIndex(item => item === mediaItem);
    setCurrentImageIndex(index);
  };

  const openModal = () => {
    setShowModal(true);
    const index = media.findIndex(item => item === mainMedia);
    setCurrentImageIndex(index);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % media.length;
    setCurrentImageIndex(nextIndex);
    setMainMedia(media[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = currentImageIndex === 0 ? media.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(prevIndex);
    setMainMedia(media[prevIndex]);
  };

  // Manejar teclas del teclado para el modal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showModal) return;

      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showModal, currentImageIndex, media]);

  const handleContactClick = () => {
    const message = `Hola, quiero saber más de este vehículo: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/573112256767?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareClick = async () => {
    const currentUrl = window.location.href;

    try {
      // Intentar usar la API nativa de compartir si está disponible
      if (navigator.share) {
        await navigator.share({
          title: `${vehicle.marca} ${vehicle.modelo} - Jeros'Motos`,
          text: `Mira este vehículo en Jeros'Motos: ${vehicle.marca} ${vehicle.modelo}`,
          url: currentUrl
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(currentUrl);

        // Mostrar mensaje de confirmación
        const button = document.querySelector('[aria-label="Compartir vehículo"]');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check me-2"></i>¡Copiado!';
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-success');

        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('btn-success');
          button.classList.add('btn-outline-primary');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      // Fallback manual si falla todo
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      alert('Link copiado al portapapeles');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Precio a consultar';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <>
        <Navbar isHome={false} />
        <div style={{ marginTop: '100px' }}></div>
        <div className="container my-4">
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando información del vehículo...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !vehicle) {
    return (
      <>
        <Navbar isHome={false} />
        <div style={{ marginTop: '20px' }}></div>
        <div className="container my-3">
          <div className="alert alert-danger text-center" role="alert">
            {error || 'Vehículo no encontrado'}
          </div>
          <div className="text-center">
            <button className="btn btn-primary" onClick={() => window.history.back()}>
              ← Volver al catálogo
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar isHome={false} />
      <div style={{ marginTop: '50px' }}></div>
      <div className="container my-3">
        <div className="row g-4">
          {/* Galería de media (imágenes y videos) mejorada */}
          <div className="col-md-8">
            <div className="position-relative">
              {/* Imagen principal */}
              <div
                className="position-relative rounded-3 shadow-lg overflow-hidden"
                style={{
                  height: '500px',
                  cursor: 'zoom-in',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                }}
                onClick={openModal}
              >
                {mainMedia && mainMedia.tipo === 'imagen' ? (
                  <img
                    src={mainMedia.url}
                    alt={`${vehicle.marca} ${vehicle.modelo}`}
                    className="w-100 h-100"
                    style={{
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                ) : mainMedia && mainMedia.tipo === 'video' ? (
                  <video
                    src={mainMedia.url}
                    controls
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  >
                    Tu navegador no soporta el elemento de video.
                  </video>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center text-muted">
                      <FaVideo size={48} className="mb-3" />
                      <p>No hay contenido disponible</p>
                    </div>
                  </div>
                )}

                {/* Botón de expandir */}
                <button
                  className="btn btn-dark btn-sm position-absolute"
                  style={{
                    top: '15px',
                    right: '15px',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
                  }}
                  aria-label="Ver imagen en pantalla completa"
                >
                  <FaExpand size={14} />
                </button>

                {/* Contador de imágenes */}
                {media.length > 1 && (
                  <div
                    className="position-absolute bg-dark text-white px-3 py-1 rounded-pill"
                    style={{
                      bottom: '15px',
                      right: '15px',
                      fontSize: '0.85rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {currentImageIndex + 1} / {media.length}
                  </div>
                )}

                {/* Botones de navegación */}
                {media.length > 1 && (
                  <>
                    <button
                      className="btn btn-dark position-absolute"
                      style={{
                        left: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: 'none',
                        backdropFilter: 'blur(10px)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      aria-label="Imagen anterior"
                    >
                      <FaChevronLeft size={16} />
                    </button>
                    <button
                      className="btn btn-dark position-absolute"
                      style={{
                        right: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: 'none',
                        backdropFilter: 'blur(10px)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      aria-label="Imagen siguiente"
                    >
                      <FaChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              {media.length > 1 && (
                <div className="d-flex gap-2 mt-3 overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  {media.map((mediaItem, idx) => (
                    <div
                      key={idx}
                      className="position-relative flex-shrink-0"
                      style={{
                        width: '80px',
                        height: '80px',
                        cursor: 'pointer',
                        border: mediaItem === mainMedia ? '3px solid #25D366' : '2px solid transparent',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden',
                        opacity: mediaItem === mainMedia ? 1 : 0.7
                      }}
                      onClick={() => handleMediaClick(mediaItem)}
                      onMouseEnter={(e) => {
                        if (mediaItem !== mainMedia) {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (mediaItem !== mainMedia) {
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                      aria-label={`${mediaItem.tipo} ${idx + 1} del vehículo`}
                    >
                      {mediaItem.tipo === 'imagen' ? (
                        <img
                          src={mediaItem.url}
                          alt={`${vehicle.marca} ${vehicle.modelo} ${idx + 1}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="w-100 h-100 bg-dark d-flex align-items-center justify-content-center"
                        >
                          <FaPlay style={{ color: 'white', fontSize: '20px' }} />
                        </div>
                      )}
                      {mediaItem.tipo === 'video' && (
                        <div
                          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                        >
                          <FaVideo style={{ color: 'white', fontSize: '14px' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Información del vehículo */}
          <div className="col-md-4">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="mb-3">
                <h1 className="h2 text-success fw-bold mb-2">{vehicle.marca} {vehicle.modelo}</h1>
              </div>

              <div className="mb-3">
                <h5 className="text-muted mb-2">Especificaciones</h5>
                <div className="row g-2">
                  {vehicle.cilindraje && (
                    <div className="col-12">
                      <div className="d-flex align-items-center p-2 bg-light rounded-2">
                        <FaGasPump className="text-primary me-2" size={18} />
                        <div>
                          <small className="text-muted d-block">Cilindraje</small>
                          <strong className="small">{vehicle.cilindraje}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                  {vehicle.color && (
                    <div className="col-12">
                      <div className="d-flex align-items-center p-2 bg-light rounded-2">
                        <FaPalette className="text-primary me-2" size={18} />
                        <div>
                          <small className="text-muted d-block">Color</small>
                          <strong className="small">{vehicle.color}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <h5 className="text-muted mb-2">Documentación</h5>
                <div className="row g-2">
                  <div className="col-12">
                    <div className="d-flex align-items-center p-2 border rounded-2">
                      <FaShieldAlt className="text-warning me-2" size={14} />
                      <div className="flex-grow-1">
                        <small className="text-muted">SOAT vence</small>
                        <div className="fw-medium small">{formatDate(vehicle.soat_vencimiento)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-center p-2 border rounded-2">
                      <FaShieldAlt className="text-info me-2" size={14} />
                      <div className="flex-grow-1">
                        <small className="text-muted">Tecnomecánica vence</small>
                        <div className="fw-medium small">{formatDate(vehicle.tecno_vencimiento)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-center p-3 bg-success bg-opacity-10 rounded-3">
                  <h3 className="text-success fw-bold mb-0">{formatCurrency(vehicle.precio_venta)}</h3>
                  <small className="text-muted">Precio de venta</small>
                </div>
              </div>

              <div className="d-grid gap-2 mt-auto">
                <button
                  className="btn btn-success btn-lg"
                  onClick={handleContactClick}
                  aria-label="Preguntar por este vehículo"
                >
                  <FaWhatsapp className="me-2" />
                  Preguntar por este vehículo
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleShareClick}
                  aria-label="Compartir vehículo"
                >
                  <FaShare className="me-2" />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de zoom para imágenes */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
          }}
          onClick={closeModal}
        >
          <div className="position-relative w-100 h-100 d-flex align-items-center justify-content-center p-4">
            {/* Botón cerrar */}
            <button
              className="btn btn-light position-absolute"
              style={{
                top: '20px',
                right: '20px',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                zIndex: 10001
              }}
              onClick={closeModal}
              aria-label="Cerrar modal"
            >
              <FaTimes size={20} />
            </button>

            {/* Imagen en el modal */}
            <div className="position-relative" style={{ maxWidth: '90%', maxHeight: '90%' }}>
              {media[currentImageIndex] && media[currentImageIndex].tipo === 'imagen' ? (
                <img
                  src={media[currentImageIndex].url}
                  alt={`${vehicle.marca} ${vehicle.modelo} - Imagen ${currentImageIndex + 1}`}
                  className="img-fluid rounded-3 shadow-lg"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : media[currentImageIndex] && media[currentImageIndex].tipo === 'video' ? (
                <video
                  src={media[currentImageIndex].url}
                  controls
                  className="rounded-3 shadow-lg"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              ) : null}
            </div>

            {/* Navegación en el modal */}
            {media.length > 1 && (
              <>
                <button
                  className="btn btn-light position-absolute"
                  style={{
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    zIndex: 10001
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  aria-label="Imagen anterior"
                >
                  <FaChevronLeft size={24} />
                </button>
                <button
                  className="btn btn-light position-absolute"
                  style={{
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    zIndex: 10001
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  aria-label="Imagen siguiente"
                >
                  <FaChevronRight size={24} />
                </button>
              </>
            )}

            {/* Contador en el modal */}
            {media.length > 1 && (
              <div
                className="position-absolute bg-dark text-white px-4 py-2 rounded-pill"
                style={{
                  bottom: '30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1rem',
                  zIndex: 10001
                }}
              >
                {currentImageIndex + 1} / {media.length}
              </div>
            )}

            {/* Miniaturas en el modal */}
            {media.length > 1 && (
              <div
                className="position-absolute d-flex gap-2 overflow-auto px-4"
                style={{
                  bottom: '80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: '80%',
                  zIndex: 10001
                }}
              >
                {media.map((mediaItem, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0"
                    style={{
                      width: '60px',
                      height: '60px',
                      cursor: 'pointer',
                      border: idx === currentImageIndex ? '3px solid #25D366' : '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      opacity: idx === currentImageIndex ? 1 : 0.6,
                      transition: 'all 0.3s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                      setMainMedia(mediaItem);
                    }}
                    onMouseEnter={(e) => {
                      if (idx !== currentImageIndex) {
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (idx !== currentImageIndex) {
                        e.currentTarget.style.opacity = '0.6';
                      }
                    }}
                  >
                    {mediaItem.tipo === 'imagen' ? (
                      <img
                        src={mediaItem.url}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-100 h-100 bg-dark d-flex align-items-center justify-content-center">
                        <FaPlay style={{ color: 'white', fontSize: '16px' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default VehicleDetail;
