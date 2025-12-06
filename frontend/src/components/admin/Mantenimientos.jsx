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
  FormControl
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaWrench, FaSearch, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../../config';
import { useAuth } from '../../context/AuthContext';

const Mantenimientos = () => {
  const { isAdmin } = useAuth();
  const [mantenimientos, setMantenimientos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehiculo, setFilterVehiculo] = useState('');
  const [filterFecha, setFilterFecha] = useState('');

  const [formData, setFormData] = useState({
    vehiculo_id: '',
    fecha_servicio: '',
    servicio: '',
    taller: '',
    costo: '',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mantenimientosRes, vehiculosRes] = await Promise.all([
        axios.get(`${API_URL}/mantenimientos/`),
        axios.get(`${API_URL}/vehiculos/`)
      ]);
      setMantenimientos(mantenimientosRes.data);
      setVehiculos(vehiculosRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (mantenimiento = null) => {
    if (mantenimiento) {
      setEditingMantenimiento(mantenimiento);
      setFormData({
        vehiculo_id: mantenimiento.vehiculo_id || '',
        fecha_servicio: mantenimiento.fecha_servicio || '',
        servicio: mantenimiento.servicio || '',
        taller: mantenimiento.taller || '',
        costo: mantenimiento.costo || '',
        observaciones: mantenimiento.observaciones || ''
      });
    } else {
      setEditingMantenimiento(null);
      setFormData({
        vehiculo_id: '',
        fecha_servicio: new Date().toISOString().split('T')[0],
        servicio: '',
        taller: '',
        costo: '',
        observaciones: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMantenimiento(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        vehiculo_id: parseInt(formData.vehiculo_id),
        costo: formData.costo ? parseFloat(formData.costo) : null
      };

      if (editingMantenimiento) {
        await axios.put(`${API_URL}/mantenimientos/${editingMantenimiento.id}`, dataToSend);
      } else {
        await axios.post(`${API_URL}/mantenimientos/`, dataToSend);
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando mantenimiento:', error);
      setError(error.response?.data?.detail || 'Error al guardar el mantenimiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (mantenimientoId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este mantenimiento?')) {
      try {
        await axios.delete(`${API_URL}/mantenimientos/${mantenimientoId}`);
        await loadData();
      } catch (error) {
        console.error('Error eliminando mantenimiento:', error);
        setError('Error al eliminar el mantenimiento');
      }
    }
  };

  const getVehiculoInfo = (vehiculoId) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    return vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa}` : 'Vehículo no encontrado';
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

  // Filtrar mantenimientos
  const filteredMantenimientos = mantenimientos.filter(mantenimiento => {
    const vehiculoInfo = getVehiculoInfo(mantenimiento.vehiculo_id).toLowerCase();
    const matchesSearch = !searchTerm ||
      vehiculoInfo.includes(searchTerm.toLowerCase()) ||
      mantenimiento.servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mantenimiento.taller?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVehiculo = !filterVehiculo || mantenimiento.vehiculo_id === parseInt(filterVehiculo);
    const matchesFecha = !filterFecha || mantenimiento.fecha_servicio === filterFecha;

    return matchesSearch && matchesVehiculo && matchesFecha;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando mantenimientos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaWrench className="me-2" />
          Gestión de Mantenimientos
        </h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FaPlus className="me-2" />
          Nuevo Mantenimiento
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
                  placeholder="Buscar por vehículo, servicio o taller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterVehiculo}
                onChange={(e) => setFilterVehiculo(e.target.value)}
              >
                <option value="">Todos los vehículos</option>
                {vehiculos.map(vehiculo => (
                  <option key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa}
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
                  setFilterVehiculo('');
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
          {filteredMantenimientos.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Servicio</th>
                  <th>Taller</th>
                  <th>Costo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMantenimientos.map((mantenimiento) => (
                  <tr key={mantenimiento.id}>
                    <td>
                      <Badge bg="info">
                        {formatDate(mantenimiento.fecha_servicio)}
                      </Badge>
                    </td>
                    <td>
                      <strong>{getVehiculoInfo(mantenimiento.vehiculo_id)}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{mantenimiento.servicio}</strong>
                        {mantenimiento.observaciones && (
                          <div>
                            <small className="text-muted">
                              {mantenimiento.observaciones.length > 50
                                ? `${mantenimiento.observaciones.substring(0, 50)}...`
                                : mantenimiento.observaciones
                              }
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{mantenimiento.taller || 'No especificado'}</td>
                    <td>
                      <strong className="text-success">
                        {formatCurrency(mantenimiento.costo)}
                      </strong>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(mantenimiento)}
                      >
                        <FaEdit />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(mantenimiento.id)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <FaWrench size={48} className="text-muted mb-3" />
              <p className="text-muted">No hay mantenimientos que coincidan con los filtros</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar mantenimiento */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingMantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
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
                  <Form.Label>Vehículo *</Form.Label>
                  <Form.Select
                    name="vehiculo_id"
                    value={formData.vehiculo_id}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  >
                    <option value="">Seleccionar vehículo</option>
                    {vehiculos.map(vehiculo => (
                      <option key={vehiculo.id} value={vehiculo.id}>
                        {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Servicio *</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_servicio"
                    value={formData.fecha_servicio}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Servicio Realizado *</Form.Label>
              <Form.Control
                type="text"
                name="servicio"
                value={formData.servicio}
                onChange={handleInputChange}
                required
                placeholder="Ej: Cambio de aceite, Revisión general, etc."
                disabled={submitting}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Taller</Form.Label>
                  <Form.Control
                    type="text"
                    name="taller"
                    value={formData.taller}
                    onChange={handleInputChange}
                    placeholder="Nombre del taller"
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Costo</Form.Label>
                  <Form.Control
                    type="number"
                    name="costo"
                    value={formData.costo}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={submitting}
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
                value={formData.observaciones}
                onChange={handleInputChange}
                placeholder="Detalles adicionales del mantenimiento..."
                disabled={submitting}
              />
            </Form.Group>
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
                editingMantenimiento ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Mantenimientos;
