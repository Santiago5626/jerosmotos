import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Badge,
  InputGroup,
  FormControl,
  Alert
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaGem, FaSearch, FaFilter, FaImage, FaTimes, FaPercent, FaMoneyBillWave, FaClock, FaCalculator } from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../../config';
import { useAuth } from '../../context/AuthContext';
import useAlert from '../../hooks/useAlert';

const ArticulosValor = () => {
  const { isAdmin } = useAuth();
  const alert = useAlert();
  const [articulos, setArticulos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState(null);
  const [articuloAbono, setArticuloAbono] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [filterFecha, setFilterFecha] = useState('');

  const [formData, setFormData] = useState({
    descripcion: '',
    valor: '',
    estado: 'empeño',
    fecha_registro: '',
    sede_id: '',
    interes_porcentaje: '0',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_documento: ''
  });

  const [abonoData, setAbonoData] = useState({
    monto: ''
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const estadoOptions = [
    { value: 'empeño', label: 'Empeño', variant: 'warning' },
    { value: 'vendido', label: 'Vendido', variant: 'success' },
    { value: 'disponible', label: 'Disponible', variant: 'primary' },
    { value: 'recuperado', label: 'Recuperado', variant: 'info' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [articulosRes, sedesRes] = await Promise.all([
        axios.get(`${API_URL}/articulos_valor/`),
        axios.get(`${API_URL}/sedes/`)
      ]);
      setArticulos(articulosRes.data);
      setSedes(sedesRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert.showError('Error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = async (articulo = null) => {
    if (articulo) {
      setEditingArticulo(articulo);
      setFormData({
        descripcion: articulo.descripcion || '',
        valor: articulo.valor || '',
        estado: articulo.estado || 'empeño',
        fecha_registro: articulo.fecha_registro || '',
        sede_id: articulo.sede_id || '',
        interes_porcentaje: articulo.interes_porcentaje || '0',
        cliente_nombre: articulo.cliente_nombre || '',
        cliente_telefono: articulo.cliente_telefono || '',
        cliente_documento: articulo.cliente_documento || ''
      });

      // Cargar imágenes existentes del artículo
      try {
        const imagenesResponse = await axios.get(`${API_URL}/articulos_valor/${articulo.id}/imagenes`);
        const imagenesExistentes = imagenesResponse.data;

        if (imagenesExistentes.length > 0) {
          const previews = imagenesExistentes.map(img => `data:image/jpeg;base64,${img.imagen_data}`);
          setImagePreviews(previews);
          setSelectedImages([]);
        } else {
          setSelectedImages([]);
          setImagePreviews([]);
        }
      } catch (error) {
        console.error('Error cargando imágenes del artículo:', error);
        setSelectedImages([]);
        setImagePreviews([]);
      }
    } else {
      setEditingArticulo(null);
      setFormData({
        descripcion: '',
        valor: '',
        estado: 'empeño',
        fecha_registro: new Date().toISOString().split('T')[0],
        sede_id: '',
        interes_porcentaje: '0',
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_documento: ''
      });
      setSelectedImages([]);
      setImagePreviews([]);
    }
    setShowModal(true);
  };

  const handleShowAbonoModal = (articulo) => {
    setArticuloAbono(articulo);
    setAbonoData({ monto: '' });
    setShowAbonoModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticulo(null);
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleCloseAbonoModal = () => {
    setShowAbonoModal(false);
    setArticuloAbono(null);
    setAbonoData({ monto: '' });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [...selectedImages, ...files];
      setSelectedImages(newImages);

      const newPreviews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newPreviews).then(newPreviewsArray => {
        setImagePreviews(prev => [...prev, ...newPreviewsArray]);
      });
    }

    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAbonoInputChange = (e) => {
    const { name, value } = e.target;
    setAbonoData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        valor: parseFloat(formData.valor),
        sede_id: formData.sede_id ? parseInt(formData.sede_id) : null,
        interes_porcentaje: parseFloat(formData.interes_porcentaje)
      };

      let articuloId;
      if (editingArticulo) {
        await axios.put(`${API_URL}/articulos_valor/${editingArticulo.id}`, dataToSend);
        articuloId = editingArticulo.id;
      } else {
        const response = await axios.post(`${API_URL}/articulos_valor/`, dataToSend);
        articuloId = response.data.id;
      }

      // Subir imágenes si hay alguna seleccionada
      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const formData = new FormData();
          formData.append('imagen', selectedImages[i]);
          formData.append('es_principal', i === 0 ? 'true' : 'false');

          await axios.post(`${API_URL}/articulos_valor/${articuloId}/imagenes`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      await loadData();
      handleCloseModal();
      alert.showSuccess('¡Éxito!', editingArticulo ? 'Artículo actualizado correctamente' : 'Artículo creado correctamente');
    } catch (error) {
      console.error('Error guardando artículo:', error);
      alert.showError('Error', error.response?.data?.detail || 'Error al guardar el artículo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbonoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.patch(
        `${API_URL}/articulos_valor/${articuloAbono.id}/abono?monto_abono=${parseFloat(abonoData.monto)}`
      );

      alert.showSuccess('¡Abono procesado!', response.data.mensaje);
      await loadData();
      handleCloseAbonoModal();
    } catch (error) {
      console.error('Error procesando abono:', error);
      alert.showError('Error', error.response?.data?.detail || 'Error al procesar el abono');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (articuloId) => {
    const result = await alert.showDeleteConfirm();
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/articulos_valor/${articuloId}`);
        await loadData();
        alert.showSuccess('¡Eliminado!', 'El artículo ha sido eliminado correctamente');
      } catch (error) {
        console.error('Error eliminando artículo:', error);
        alert.showError('Error', 'Error al eliminar el artículo');
      }
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

  // Filtrar artículos
  const filteredArticulos = articulos.filter(articulo => {
    const matchesSearch = !searchTerm ||
      articulo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articulo.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = !filterEstado || articulo.estado === filterEstado;
    const matchesSede = !filterSede || articulo.sede_id === parseInt(filterSede);
    const matchesFecha = !filterFecha || articulo.fecha_registro === filterFecha;

    return matchesSearch && matchesEstado && matchesSede && matchesFecha;
  });

  // Calcular estadísticas
  const stats = {
    total: articulos.length,
    empeños: articulos.filter(a => a.estado === 'empeño').length,
    vendidos: articulos.filter(a => a.estado === 'vendido').length,
    disponibles: articulos.filter(a => a.estado === 'disponible').length,
    recuperados: articulos.filter(a => a.estado === 'recuperado').length,
    valorTotal: articulos.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0),
    valorActualTotal: articulos.reduce((sum, a) => sum + parseFloat(a.valor_actual || a.valor || 0), 0),
    interesesTotal: articulos.reduce((sum, a) => sum + parseFloat(a.interes_acumulado || 0), 0)
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando artículos de valor...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaGem className="me-2" />
          Artículos de Valor
        </h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FaPlus className="me-2" />
          Nuevo Artículo
        </Button>
      </div>

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <h3 className="text-primary">{stats.total}</h3>
              <p className="text-muted mb-0">Total</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <h3 className="text-warning">{stats.empeños}</h3>
              <p className="text-muted mb-0">Empeños</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <h3 className="text-success">{stats.vendidos}</h3>
              <p className="text-muted mb-0">Vendidos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <h3 className="text-info">{stats.recuperados}</h3>
              <p className="text-muted mb-0">Recuperados</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Buscar por descripción o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
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
            <Col md={2}>
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
            <Col md={3}>
              <Form.Control
                type="date"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                placeholder="Filtrar por fecha"
              />
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterEstado('');
                  setFilterSede('');
                  setFilterFecha('');
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
          {filteredArticulos.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Cliente</th>
                  <th>Valor Empeño</th>
                  <th>Interés</th>
                  <th>Valor Actual</th>
                  <th>Estado</th>
                  <th>Sede</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticulos.map((articulo) => (
                  <tr key={articulo.id}>
                    <td>
                      <strong>{articulo.descripcion}</strong>
                    </td>
                    <td>
                      {articulo.cliente_nombre ? (
                        <div>
                          <div><strong>{articulo.cliente_nombre}</strong></div>
                          {articulo.cliente_telefono && (
                            <small className="text-muted">{articulo.cliente_telefono}</small>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Sin cliente</span>
                      )}
                    </td>
                    <td>
                      <strong className="text-primary">
                        {formatCurrency(articulo.valor)}
                      </strong>
                    </td>
                    <td>
                      {articulo.interes_porcentaje > 0 ? (
                        <div>
                          <Badge bg="warning">{articulo.interes_porcentaje}%</Badge>
                          {articulo.meses_transcurridos > 0 && (
                            <div>
                              <small className="text-muted">
                                {articulo.meses_transcurridos} meses
                              </small>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Sin interés</span>
                      )}
                    </td>
                    <td>
                      <strong className="text-success">
                        {formatCurrency(articulo.valor_actual || articulo.valor)}
                      </strong>
                    </td>
                    <td>{getEstadoBadge(articulo.estado)}</td>
                    <td>{getSedeName(articulo.sede_id)}</td>
                    <td>
                      <Badge bg="info">
                        {formatDate(articulo.fecha_registro)}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(articulo)}
                        >
                          <FaEdit />
                        </Button>
                        {articulo.estado === 'empeño' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleShowAbonoModal(articulo)}
                            title="Realizar abono"
                          >
                            <FaMoneyBillWave />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(articulo.id)}
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
              <FaGem size={48} className="text-muted mb-3" />
              <p className="text-muted">No hay artículos que coincidan con los filtros</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar artículo */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo de Valor'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Descripción *</Form.Label>
                  <Form.Control
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Anillo de oro, Cadena de plata, etc."
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor del Empeño *</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor"
                    value={formData.valor}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">
                    Monto prestado al cliente (el interés se suma automáticamente)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado *</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    required
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
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Interés Mensual (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="interes_porcentaje"
                    value={formData.interes_porcentaje}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">
                    Porcentaje de interés mensual (cada 32 días)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
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
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Registro *</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_registro"
                    value={formData.fecha_registro}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Información del cliente */}
            <h5 className="mb-3">Información del Cliente</h5>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_nombre"
                    value={formData.cliente_nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre completo"
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_telefono"
                    value={formData.cliente_telefono}
                    onChange={handleInputChange}
                    placeholder="Número de teléfono"
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_documento"
                    value={formData.cliente_documento}
                    onChange={handleInputChange}
                    placeholder="Número de documento"
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Sección de imágenes */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FaImage className="me-2" />
                Imágenes del Artículo
              </Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                Puedes seleccionar múltiples imágenes. Formatos soportados: JPG, PNG, GIF
              </Form.Text>
            </Form.Group>

            {/* Previsualización de imágenes */}
            {imagePreviews.length > 0 && (
              <div className="mb-3">
                <Form.Label>Previsualización de Imágenes:</Form.Label>
                <Row>
                  {imagePreviews.map((preview, index) => (
                    <Col key={index} xs={6} md={4} className="mb-3">
                      <div className="position-relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="img-fluid rounded"
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            border: '2px solid #dee2e6'
                          }}
                        />
                        {!editingArticulo && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-1"
                            onClick={() => removeImage(index)}
                            style={{
                              width: '25px',
                              height: '25px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FaTimes size={12} />
                          </Button>
                        )}
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
                editingArticulo ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal para abono */}
      <Modal show={showAbonoModal} onHide={handleCloseAbonoModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMoneyBillWave className="me-2" />
            Realizar Abono
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAbonoSubmit}>
          <Modal.Body>
            {articuloAbono && (
              <div>
                <Card className="mb-3">
                  <Card.Body>
                    <h5>{articuloAbono.descripcion}</h5>
                    <Row>
                      <Col md={6}>
                        <p><strong>Valor del Empeño:</strong> {formatCurrency(articuloAbono.valor)}</p>
                        <p><strong>Interés:</strong> {articuloAbono.interes_porcentaje}% mensual</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Meses transcurridos:</strong> {articuloAbono.meses_transcurridos || 0}</p>
                        <p><strong>Valor Actual:</strong> <span className="text-success fw-bold">{formatCurrency(articuloAbono.valor_actual || articuloAbono.valor)}</span></p>
                      </Col>
                    </Row>
                    {articuloAbono.interes_acumulado > 0 && (
                      <Alert variant="warning">
                        <FaClock className="me-2" />
                        Interés acumulado: <strong>{formatCurrency(articuloAbono.interes_acumulado)}</strong>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>

                <Form.Group className="mb-3">
                  <Form.Label>Monto del Abono *</Form.Label>
                  <Form.Control
                    type="number"
                    name="monto"
                    value={abonoData.monto}
                    onChange={handleAbonoInputChange}
                    required
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">
                    Si el monto cubre el valor actual, el artículo se marcará como recuperado.
                  </Form.Text>
                </Form.Group>
              </div>
            )}
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
                'Procesar Abono'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ArticulosValor;
