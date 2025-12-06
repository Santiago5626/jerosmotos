import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Alert, 
  Spinner,
  Badge,
  InputGroup,
  FormControl,
  Image
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCar, FaSearch, FaFilter, FaImage, FaTimes, FaStar, FaVideo, FaPlay, FaEye, FaEyeSlash, FaHandHoldingUsd, FaMoneyBillWave } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Vehiculos = () => {
  const { isAdmin } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEmpenoModal, setShowEmpenoModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [vehiculoEmpeno, setVehiculoEmpeno] = useState(null);
  const [vehiculoAbono, setVehiculoAbono] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterSede, setFilterSede] = useState('');

  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    placa: '',
    cilindraje: '',
    color: '',
    precio_compra: '',
    precio_venta: '',
    soat_vencimiento: '',
    tecno_vencimiento: '',
    sede_id: '',
    estado: 'disponible',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_documento: '',
    observaciones_empeno: ''
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  // Estados para empeño
  const [empenoFormData, setEmpenoFormData] = useState({
    valor_empeno: '',
    interes_porcentaje: '3.0',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_documento: '',
    observaciones: ''
  });

  // Estados para abono
  const [abonoFormData, setAbonoFormData] = useState({
    monto_abono: ''
  });

  const estadoOptions = [
    { value: 'disponible', label: 'Disponible', variant: 'success' },
    { value: 'vendido', label: 'Vendido', variant: 'primary' },
    { value: 'empeño', label: 'Empeño', variant: 'warning' },
    { value: 'baja', label: 'Baja', variant: 'danger' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiculosRes, sedesRes] = await Promise.all([
        axios.get('http://localhost:8000/vehiculos/'),
        axios.get('http://localhost:8000/sedes/')
      ]);
      setVehiculos(vehiculosRes.data);
      setSedes(sedesRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = async (vehiculo = null) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      setFormData({
        marca: vehiculo.marca || '',
        modelo: vehiculo.modelo || '',
        placa: vehiculo.placa || '',
        cilindraje: vehiculo.cilindraje || '',
        color: vehiculo.color || '',
        precio_compra: vehiculo.precio_compra || '',
        precio_venta: vehiculo.precio_venta || '',
        soat_vencimiento: vehiculo.soat_vencimiento || '',
        tecno_vencimiento: vehiculo.tecno_vencimiento || '',
        sede_id: vehiculo.sede_id || '',
        estado: vehiculo.estado || 'disponible',
        cliente_nombre: vehiculo.cliente_nombre || '',
        cliente_telefono: vehiculo.cliente_telefono || '',
        cliente_documento: vehiculo.cliente_documento || '',
        observaciones_empeno: vehiculo.observaciones_empeno || ''
      });
      
      // Cargar imágenes existentes del vehículo
      try {
        const imagenesResponse = await axios.get(`http://localhost:8000/vehiculos/${vehiculo.id}/imagenes`);
        const imagenesExistentes = imagenesResponse.data;
        
        if (imagenesExistentes.length > 0) {
          // Convertir las imágenes de base64 a previsualizaciones
          const previews = imagenesExistentes.map(img => `data:image/jpeg;base64,${img.imagen_data}`);
          setImagePreviews(previews);
          // No establecemos selectedImages porque estas son imágenes existentes, no nuevas
          setSelectedImages([]);
        } else {
          setSelectedImages([]);
          setImagePreviews([]);
        }
      } catch (error) {
        console.error('Error cargando imágenes del vehículo:', error);
        setSelectedImages([]);
        setImagePreviews([]);
      }
    } else {
      setEditingVehiculo(null);
      setFormData({
        marca: '',
        modelo: '',
        placa: '',
        cilindraje: '',
        color: '',
        precio_compra: '',
        precio_venta: '',
        soat_vencimiento: '',
        tecno_vencimiento: '',
        sede_id: '',
        estado: 'disponible'
      });
      setSelectedImages([]);
      setImagePreviews([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehiculo(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setSelectedVideos([]);
    setVideoPreviews([]);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      // If estado changes to empeño, adjust precio_compra and precio_venta placeholders
      if (name === 'estado' && value === 'empeño') {
        // Optionally clear or set default values
        if (!newFormData.precio_compra) {
          newFormData.precio_compra = '';
        }
        if (!newFormData.precio_venta) {
          newFormData.precio_venta = '';
        }
      }
      return newFormData;
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Agregar las nuevas imágenes a las existentes
      const newImages = [...selectedImages, ...files];
      setSelectedImages(newImages);
      
      // Crear previsualizaciones para las nuevas imágenes
      const newPreviews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      });
      
      // Agregar las nuevas previsualizaciones a las existentes
      Promise.all(newPreviews).then(newPreviewsArray => {
        setImagePreviews(prev => [...prev, ...newPreviewsArray]);
      });
    }
    
    // Limpiar el input para permitir seleccionar los mismos archivos nuevamente si es necesario
    e.target.value = '';
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Agregar los nuevos videos a los existentes
      const newVideos = [...selectedVideos, ...files];
      setSelectedVideos(newVideos);
      
      // Crear previsualizaciones para los nuevos videos
      const newPreviews = files.map(file => {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            video.currentTime = 1; // Capturar frame en el segundo 1
          };
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve({
              thumbnail: canvas.toDataURL(),
              name: file.name,
              size: file.size
            });
          };
          video.src = URL.createObjectURL(file);
        });
      });
      
      // Agregar las nuevas previsualizaciones a las existentes
      Promise.all(newPreviews).then(newPreviewsArray => {
        setVideoPreviews(prev => [...prev, ...newPreviewsArray]);
      });
    }
    
    // Limpiar el input para permitir seleccionar los mismos archivos nuevamente si es necesario
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const removeVideo = (index) => {
    const newVideos = selectedVideos.filter((_, i) => i !== index);
    const newPreviews = videoPreviews.filter((_, i) => i !== index);
    setSelectedVideos(newVideos);
    setVideoPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Convertir valores numéricos
      const dataToSend = {
        ...formData,
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        precio_venta: formData.precio_venta ? parseFloat(formData.precio_venta) : null,
        sede_id: formData.sede_id ? parseInt(formData.sede_id) : null
      };

      let vehiculoResponse;
      if (editingVehiculo) {
        vehiculoResponse = await axios.put(`http://localhost:8000/vehiculos/${editingVehiculo.id}`, dataToSend);
      } else {
        vehiculoResponse = await axios.post('http://localhost:8000/vehiculos/', dataToSend);
      }

      const vehiculoId = editingVehiculo ? editingVehiculo.id : vehiculoResponse.data.id;

      // Si hay imágenes seleccionadas, subirlas
      if (selectedImages.length > 0) {
        // Si estamos editando y hay nuevas imágenes, preguntar si reemplazar o agregar
        if (editingVehiculo) {
          const shouldReplace = window.confirm(
            '¿Deseas reemplazar todas las imágenes existentes con las nuevas imágenes seleccionadas?\n\n' +
            'Sí = Reemplazar todas las imágenes\n' +
            'No = Agregar a las imágenes existentes'
          );
          
          if (shouldReplace) {
            // Eliminar todas las imágenes existentes
            try {
              const existingImages = await axios.get(`http://localhost:8000/vehiculos/${vehiculoId}/imagenes`);
              for (const img of existingImages.data) {
                await axios.delete(`http://localhost:8000/vehiculos/${vehiculoId}/imagenes/${img.id}`);
              }
            } catch (error) {
              console.warn('Error eliminando imágenes existentes:', error);
            }
          }
        }
        
        // Subir las nuevas imágenes
        for (let i = 0; i < selectedImages.length; i++) {
          const imageFormData = new FormData();
          imageFormData.append('imagen', selectedImages[i]);
          
          // Solo marcar como principal si es la primera imagen Y (es un vehículo nuevo O se están reemplazando las imágenes)
          const esPrincipal = i === 0 && (!editingVehiculo || window.confirm('¿Deseas que la primera imagen nueva sea la imagen principal?'));
          imageFormData.append('es_principal', esPrincipal ? 'true' : 'false');
          
          await axios.post(`http://localhost:8000/vehiculos/${vehiculoId}/imagenes`, imageFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      // Si hay videos seleccionados, subirlos
      if (selectedVideos.length > 0) {
        // Subir los nuevos videos
        for (let i = 0; i < selectedVideos.length; i++) {
          const videoFormData = new FormData();
          videoFormData.append('video', selectedVideos[i]);
          videoFormData.append('titulo', `Video ${i + 1} - ${selectedVideos[i].name}`);
          videoFormData.append('orden', i.toString());
          
          try {
            await axios.post(`http://localhost:8000/vehiculos/${vehiculoId}/videos`, videoFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          } catch (error) {
            console.warn(`Error subiendo video ${i + 1}:`, error);
            // Continuar con el siguiente video aunque uno falle
          }
        }
      }
      
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando vehículo:', error);
      setError(error.response?.data?.detail || 'Error al guardar el vehículo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehiculoId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      try {
        await axios.delete(`http://localhost:8000/vehiculos/${vehiculoId}`);
        await loadData();
      } catch (error) {
        console.error('Error eliminando vehículo:', error);
        setError('Error al eliminar el vehículo');
      }
    }
  };

  const handleToggleDestacado = async (vehiculoId) => {
    try {
      await axios.patch(`http://localhost:8000/vehiculos/${vehiculoId}/destacar`);
      await loadData();
    } catch (error) {
      console.error('Error cambiando estado destacado:', error);
      setError(error.response?.data?.detail || 'Error al cambiar el estado destacado');
    }
  };

  const handleToggleVisibilidad = async (vehiculoId) => {
    try {
      await axios.patch(`http://localhost:8000/vehiculos/${vehiculoId}/visibilidad`);
      await loadData();
    } catch (error) {
      console.error('Error cambiando visibilidad en catálogo:', error);
      setError(error.response?.data?.detail || 'Error al cambiar la visibilidad en el catálogo');
    }
  };

  // Funciones para empeño
  const handleShowEmpenoModal = (vehiculo) => {
    setVehiculoEmpeno(vehiculo);
    setEmpenoFormData({
      valor_empeno: '',
      interes_porcentaje: '3.0',
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_documento: '',
      observaciones: ''
    });
    setShowEmpenoModal(true);
  };

  const handleCloseEmpenoModal = () => {
    setShowEmpenoModal(false);
    setVehiculoEmpeno(null);
    setError('');
  };

  const handleEmpenoInputChange = (e) => {
    const { name, value } = e.target;
    setEmpenoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmpenoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const dataToSend = {
        ...empenoFormData,
        valor_empeno: parseFloat(empenoFormData.valor_empeno),
        interes_porcentaje: parseFloat(empenoFormData.interes_porcentaje),
        usuario_id: 1, // TODO: Obtener del contexto de autenticación
        sede_id: vehiculoEmpeno.sede_id
      };

      await axios.post(`http://localhost:8000/vehiculos/${vehiculoEmpeno.id}/empenar`, dataToSend);
      await loadData();
      handleCloseEmpenoModal();
    } catch (error) {
      console.error('Error empeñando vehículo:', error);
      setError(error.response?.data?.detail || 'Error al empeñar el vehículo');
    } finally {
      setSubmitting(false);
    }
  };

  // Funciones para abono
  const handleShowAbonoModal = async (vehiculo) => {
    setVehiculoAbono(vehiculo);
    setAbonoFormData({
      monto_abono: ''
    });
    
    // Cargar datos del empeño
    try {
      const response = await axios.get(`http://localhost:8000/vehiculos/${vehiculo.id}/empeno`);
      setVehiculoAbono({...vehiculo, ...response.data});
    } catch (error) {
      console.error('Error cargando datos del empeño:', error);
      setError('Error al cargar los datos del empeño');
    }
    
    setShowAbonoModal(true);
  };

  const handleCloseAbonoModal = () => {
    setShowAbonoModal(false);
    setVehiculoAbono(null);
    setError('');
  };

  const handleAbonoInputChange = (e) => {
    const { name, value } = e.target;
    setAbonoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAbonoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await axios.patch(
        `http://localhost:8000/vehiculos/${vehiculoAbono.id}/abono?monto_abono=${parseFloat(abonoFormData.monto_abono)}`
      );
      
      // Mostrar resultado del abono
      alert(response.data.mensaje);
      
      await loadData();
      handleCloseAbonoModal();
    } catch (error) {
      console.error('Error procesando abono:', error);
      setError(error.response?.data?.detail || 'Error al procesar el abono');
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoInfo = estadoOptions.find(opt => opt.value === estado);
    return (
      <Badge bg={estadoInfo?.variant || 'secondary'}>
        {estadoInfo?.label || estado}
      </Badge>
    );
  };

  const getSedeName = (sedeId) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : 'Sin sede';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  // Filtrar vehículos
  const filteredVehiculos = vehiculos.filter(vehiculo => {
    const matchesSearch = !searchTerm || 
      vehiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.placa?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = !filterEstado || vehiculo.estado === filterEstado;
    const matchesSede = !filterSede || vehiculo.sede_id === parseInt(filterSede);

    return matchesSearch && matchesEstado && matchesSede;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando vehículos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaCar className="me-2" />
          Gestión de Vehículos
        </h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FaPlus className="me-2" />
          Nuevo Vehículo
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Buscar por marca, modelo o placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                {estadoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterSede}
                onChange={(e) => setFilterSede(e.target.value)}
              >
                <option value="">Todas las sedes</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterEstado('');
                  setFilterSede('');
                }}
              >
                <FaFilter className="me-1" />
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {filteredVehiculos.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Marca/Modelo</th>
                  <th>Estado</th>
                  <th>Destacado</th>
                  <th>Visible</th>
                  <th>Sede</th>
                  <th>Precio Venta</th>
                  <th>SOAT</th>
                  <th>Tecno</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id}>
                    <td>
                      <strong>{vehiculo.placa || 'Sin placa'}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{vehiculo.marca} {vehiculo.modelo}</strong>
                        <br />
                        <small className="text-muted">
                          {vehiculo.cilindraje} - {vehiculo.color}
                        </small>
                      </div>
                    </td>
                    <td>{getEstadoBadge(vehiculo.estado)}</td>
                    <td>
                      <Button
                        variant={vehiculo.destacado ? "warning" : "outline-warning"}
                        size="sm"
                        onClick={() => handleToggleDestacado(vehiculo.id)}
                        title={vehiculo.destacado ? "Quitar destacado" : "Destacar vehículo"}
                      >
                        <FaStar />
                      </Button>
                    </td>
                    <td>
                      <Button
                        variant={vehiculo.visible_catalogo ? "success" : "outline-secondary"}
                        size="sm"
                        onClick={() => handleToggleVisibilidad(vehiculo.id)}
                        title={vehiculo.visible_catalogo ? "Ocultar del catálogo" : "Mostrar en catálogo"}
                      >
                        {vehiculo.visible_catalogo ? <FaEye /> : <FaEyeSlash />}
                      </Button>
                    </td>
                    <td>{getSedeName(vehiculo.sede_id)}</td>
                    <td>{formatCurrency(vehiculo.precio_venta)}</td>
                    <td>
                      <small className={vehiculo.soat_vencimiento && new Date(vehiculo.soat_vencimiento) < new Date() ? 'text-danger' : ''}>
                        {formatDate(vehiculo.soat_vencimiento)}
                      </small>
                    </td>
                    <td>
                      <small className={vehiculo.tecno_vencimiento && new Date(vehiculo.tecno_vencimiento) < new Date() ? 'text-danger' : ''}>
                        {formatDate(vehiculo.tecno_vencimiento)}
                      </small>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(vehiculo)}
                          title="Editar vehículo"
                        >
                          <FaEdit />
                        </Button>
                        
                        {vehiculo.estado === 'empeño' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleShowAbonoModal(vehiculo)}
                            title="Realizar abono"
                          >
                            <FaMoneyBillWave />
                          </Button>
                        )}
                        
                        {isAdmin && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(vehiculo.id)}
                            title="Eliminar vehículo"
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <FaCar size={48} className="text-muted mb-3" />
              <p className="text-muted">No hay vehículos que coincidan con los filtros</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar vehículo */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca *</Form.Label>
                  <Form.Control
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Modelo *</Form.Label>
                  <Form.Control
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Placa</Form.Label>
                  <Form.Control
                    type="text"
                    name="placa"
                    value={formData.placa}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cilindraje</Form.Label>
                  <Form.Control
                    type="text"
                    name="cilindraje"
                    value={formData.cilindraje}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    {estadoOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {formData.estado === 'empeño' ? 'Valor a Empeñar *' : 'Precio Compra'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="precio_compra"
                    value={formData.precio_compra}
                    onChange={handleInputChange}
                    disabled={submitting}
                    placeholder={formData.estado === 'empeño' ? 'Ej: 500000' : 'Precio de compra'}
                    required={formData.estado === 'empeño'}
                  />
                  {formData.estado === 'empeño' && (
                    <Form.Text className="text-muted">
                      Valor que se prestará al cliente por el vehículo
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {formData.estado === 'empeño' ? 'Tasa de Interés (%) *' : 'Precio Venta'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step={formData.estado === 'empeño' ? '0.1' : '1'}
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    disabled={submitting}
                    placeholder={formData.estado === 'empeño' ? 'Ej: 3.0' : 'Precio de venta'}
                    required={formData.estado === 'empeño'}
                  />
                  {formData.estado === 'empeño' && (
                    <Form.Text className="text-muted">
                      Porcentaje de interés mensual (cada 32 días)
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* Campos adicionales para empeño */}
            {formData.estado === 'empeño' && (
              <>
                <Alert variant="warning" className="mb-3">
                  <strong>Modo Empeño:</strong> Complete la información del cliente para registrar el empeño del vehículo.
                </Alert>
                
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Cliente *</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_nombre"
                    value={formData.cliente_nombre || ''}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    placeholder="Nombre completo del cliente"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono del Cliente</Form.Label>
                      <Form.Control
                        type="text"
                        name="cliente_telefono"
                        value={formData.cliente_telefono || ''}
                        onChange={handleInputChange}
                        disabled={submitting}
                        placeholder="Ej: 3001234567"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Documento del Cliente</Form.Label>
                      <Form.Control
                        type="text"
                        name="cliente_documento"
                        value={formData.cliente_documento || ''}
                        onChange={handleInputChange}
                        disabled={submitting}
                        placeholder="Ej: 12345678"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Observaciones del Empeño</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observaciones_empeno"
                    value={formData.observaciones_empeno || ''}
                    onChange={handleInputChange}
                    disabled={submitting}
                    placeholder="Observaciones adicionales sobre el empeño..."
                  />
                </Form.Group>
              </>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vencimiento SOAT</Form.Label>
                  <Form.Control
                    type="date"
                    name="soat_vencimiento"
                    value={formData.soat_vencimiento}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vencimiento Tecnomecánica</Form.Label>
                  <Form.Control
                    type="date"
                    name="tecno_vencimiento"
                    value={formData.tecno_vencimiento}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Sede</Form.Label>
              <Form.Select
                name="sede_id"
                value={formData.sede_id}
                onChange={handleInputChange}
                disabled={submitting}
              >
                <option value="">Seleccionar sede</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Sección de imágenes */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FaImage className="me-2" />
                Imágenes del Vehículo
              </Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                Puedes seleccionar múltiples imágenes. La primera imagen será la principal.
              </Form.Text>
            </Form.Group>

            {/* Sección de videos */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FaVideo className="me-2" />
                Videos del Vehículo
              </Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoChange}
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                Puedes seleccionar múltiples videos. Formatos soportados: MP4, AVI, MOV, WMV.
              </Form.Text>
            </Form.Group>

            {/* Previsualización de imágenes */}
            {imagePreviews.length > 0 && (
              <div className="mb-3">
                <Form.Label>Previsualización de Imágenes:</Form.Label>
                <Row>
                  {imagePreviews.map((preview, index) => (
                    <Col key={index} xs={6} md={4} lg={3} className="mb-3">
                      <div className="position-relative">
                        <Image
                          src={preview}
                          thumbnail
                          style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                        />
                        {index === 0 && (
                          <Badge 
                            bg="primary" 
                            className="position-absolute top-0 start-0 m-1"
                          >
                            Principal
                          </Badge>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-1"
                          onClick={() => removeImage(index)}
                          disabled={submitting}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Previsualización de videos */}
            {videoPreviews.length > 0 && (
              <div className="mb-3">
                <Form.Label>Previsualización de Videos:</Form.Label>
                <Row>
                  {videoPreviews.map((preview, index) => (
                    <Col key={index} xs={6} md={4} lg={3} className="mb-3">
                      <div className="position-relative">
                        <div
                          style={{
                            width: '100%',
                            height: '120px',
                            backgroundImage: `url(${preview.thumbnail})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid #dee2e6',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaPlay 
                            size={24} 
                            style={{ 
                              color: 'white', 
                              backgroundColor: 'rgba(0,0,0,0.7)', 
                              borderRadius: '50%', 
                              padding: '8px' 
                            }} 
                          />
                        </div>
                        <Badge 
                          bg="info" 
                          className="position-absolute top-0 start-0 m-1"
                        >
                          <FaVideo className="me-1" />
                          Video
                        </Badge>
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-1"
                          onClick={() => removeVideo(index)}
                          disabled={submitting}
                        >
                          <FaTimes />
                        </Button>
                        <div 
                          className="position-absolute bottom-0 start-0 end-0 p-1"
                          style={{ 
                            backgroundColor: 'rgba(0,0,0,0.7)', 
                            color: 'white', 
                            fontSize: '0.75rem',
                            borderBottomLeftRadius: '0.375rem',
                            borderBottomRightRadius: '0.375rem'
                          }}
                        >
                          {preview.name}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Guardando...
                </>
              ) : (
                editingVehiculo ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal para empeñar vehículo */}
      <Modal show={showEmpenoModal} onHide={handleCloseEmpenoModal} size="md" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHandHoldingUsd className="me-2" />
            Empeñar Vehículo
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEmpenoSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}
            
            {vehiculoEmpeno && (
              <Alert variant="info">
                <strong>Vehículo:</strong> {vehiculoEmpeno.marca} {vehiculoEmpeno.modelo} - {vehiculoEmpeno.placa}
              </Alert>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor del Empeño *</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_empeno"
                    value={empenoFormData.valor_empeno}
                    onChange={handleEmpenoInputChange}
                    required
                    disabled={submitting}
                    placeholder="Ej: 500000"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Interés Mensual (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="interes_porcentaje"
                    value={empenoFormData.interes_porcentaje}
                    onChange={handleEmpenoInputChange}
                    disabled={submitting}
                    placeholder="Ej: 3.0"
                  />
                  <Form.Text className="text-muted">
                    Porcentaje de interés mensual (cada 32 días)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Nombre del Cliente *</Form.Label>
              <Form.Control
                type="text"
                name="cliente_nombre"
                value={empenoFormData.cliente_nombre}
                onChange={handleEmpenoInputChange}
                required
                disabled={submitting}
                placeholder="Nombre completo del cliente"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_telefono"
                    value={empenoFormData.cliente_telefono}
                    onChange={handleEmpenoInputChange}
                    disabled={submitting}
                    placeholder="Ej: 3001234567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_documento"
                    value={empenoFormData.cliente_documento}
                    onChange={handleEmpenoInputChange}
                    disabled={submitting}
                    placeholder="Ej: 12345678"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observaciones"
                value={empenoFormData.observaciones}
                onChange={handleEmpenoInputChange}
                disabled={submitting}
                placeholder="Observaciones adicionales sobre el empeño..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseEmpenoModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="warning" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Empeñando...
                </>
              ) : (
                <>
                  <FaHandHoldingUsd className="me-2" />
                  Empeñar Vehículo
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal para realizar abono */}
      <Modal show={showAbonoModal} onHide={handleCloseAbonoModal} size="md" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMoneyBillWave className="me-2" />
            Realizar Abono
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAbonoSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}
            
            {vehiculoAbono && (
              <>
                <Alert variant="info">
                  <strong>Vehículo:</strong> {vehiculoAbono.marca} {vehiculoAbono.modelo} - {vehiculoAbono.placa}
                  <br />
                  <strong>Cliente:</strong> {vehiculoAbono.cliente_nombre}
                </Alert>

                <Card className="mb-3">
                  <Card.Body>
                    <h6>Información del Empeño</h6>
                    <Row>
                      <Col md={6}>
                        <p><strong>Valor Inicial:</strong> {formatCurrency(vehiculoAbono.valor_empeno)}</p>
                        <p><strong>Interés:</strong> {vehiculoAbono.interes_porcentaje}% mensual</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Fecha Empeño:</strong> {formatDate(vehiculoAbono.fecha_empeno)}</p>
                        <p><strong>Meses Transcurridos:</strong> {vehiculoAbono.meses_transcurridos}</p>
                      </Col>
                    </Row>
                    <hr />
                    <Row>
                      <Col md={6}>
                        <p><strong>Interés Acumulado:</strong> {formatCurrency(vehiculoAbono.interes_acumulado)}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Valor Total a Pagar:</strong> 
                          <span className="text-danger fw-bold"> {formatCurrency(vehiculoAbono.valor_actual)}</span>
                        </p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Monto del Abono *</Form.Label>
              <Form.Control
                type="number"
                name="monto_abono"
                value={abonoFormData.monto_abono}
                onChange={handleAbonoInputChange}
                required
                disabled={submitting}
                placeholder="Ingrese el monto del abono"
              />
              <Form.Text className="text-muted">
                Si el monto es igual o mayor al valor total, el vehículo será recuperado automáticamente.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseAbonoModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="success" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Procesando...
                </>
              ) : (
                <>
                  <FaMoneyBillWave className="me-2" />
                  Realizar Abono
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Vehiculos;
