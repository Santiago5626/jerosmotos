import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEye, FaMoneyBillWave, FaCar, FaGem, FaEdit, FaTrash } from 'react-icons/fa';
import API_URL from '../../config';

const Transacciones = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingTransaccion, setEditingTransaccion] = useState(null);
  const [deletingTransaccion, setDeletingTransaccion] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    tipo: 'venta_vehiculo',
    vehiculo_id: '',
    articulo_id: '',
    precio_venta: '',
    precio_compra: '',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_documento: '',
    observaciones: ''
  });

  const [filtros, setFiltros] = useState({
    tipo: '',
    sede_id: '',
    usuario_id: ''
  });

  useEffect(() => {
    cargarTransacciones();
    cargarVehiculos();
    cargarArticulos();
    cargarSedes();
    cargarUsuarios();
    cargarUsuarioActual();
  }, []);

  const cargarUsuarioActual = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/usuarios/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error al cargar usuario actual:', error);
    }
  };

  const cargarTransacciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.sede_id) params.append('sede_id', filtros.sede_id);
      if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);

      const response = await fetch(`${API_URL}/transacciones?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransacciones(data);
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  };

  const cargarVehiculos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehiculos/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVehiculos(data);
        console.log('Vehículos cargados:', data);
      }
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    }
  };

  const cargarArticulos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/articulos_valor/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setArticulos(data);
        console.log('Artículos cargados:', data);
      } else {
        console.error('Error en respuesta de artículos:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar artículos:', error);
    }
  };

  const cargarSedes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sedes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSedes(data);
      }
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        precio_venta: parseFloat(formData.precio_venta),
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        vehiculo_id: formData.vehiculo_id ? parseInt(formData.vehiculo_id) : null,
        articulo_id: formData.articulo_id ? parseInt(formData.articulo_id) : null
      };

      const response = await fetch(`${API_URL}/transacciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Transacción registrada exitosamente. Ganancia: $${result.ganancia?.toLocaleString()}`);
        setShowModal(false);
        cargarTransacciones();
        cargarVehiculos(); // Recargar para actualizar estados
        cargarArticulos();
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al registrar transacción');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'venta_vehiculo',
      vehiculo_id: '',
      articulo_id: '',
      precio_venta: '',
      precio_compra: '',
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_documento: '',
      observaciones: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Si cambia el tipo de transacción, limpiar los campos relacionados
    if (name === 'tipo') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        vehiculo_id: '',
        articulo_id: '',
        precio_compra: ''
      }));
    } else if (name === 'articulo_id') {
      // Cuando se selecciona un artículo, llenar automáticamente el precio de compra
      const articuloSeleccionado = articulos.find(a => a.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        [name]: value,
        precio_compra: articuloSeleccionado ? articuloSeleccionado.valor.toString() : ''
      }));
    } else if (name === 'vehiculo_id') {
      // Cuando se selecciona un vehículo, llenar automáticamente el precio de compra
      const vehiculoSeleccionado = vehiculos.find(v => v.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        [name]: value,
        precio_compra: vehiculoSeleccionado ? vehiculoSeleccionado.precio_compra?.toString() || '' : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const aplicarFiltros = () => {
    cargarTransacciones();
  };

  const getTipoBadge = (tipo) => {
    const tipos = {
      'venta_vehiculo': { variant: 'success', text: 'Venta Vehículo', icon: FaCar },
      'venta_articulo': { variant: 'primary', text: 'Venta Artículo', icon: FaGem },
      'empeño_articulo': { variant: 'warning', text: 'Empeño', icon: FaGem },
      'recuperacion_empeño': { variant: 'info', text: 'Recuperación', icon: FaGem }
    };

    const config = tipos[tipo] || { variant: 'secondary', text: tipo, icon: FaMoneyBillWave };
    const IconComponent = config.icon;

    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {config.text}
      </Badge>
    );
  };

  const handleEditTransaccion = (transaccion) => {
    setEditingTransaccion(transaccion);
    setFormData({
      tipo: transaccion.tipo,
      vehiculo_id: transaccion.vehiculo_id || '',
      articulo_id: transaccion.articulo_id || '',
      precio_venta: transaccion.precio_venta.toString(),
      precio_compra: transaccion.precio_compra ? transaccion.precio_compra.toString() : '',
      cliente_nombre: transaccion.cliente_nombre || '',
      cliente_telefono: transaccion.cliente_telefono || '',
      cliente_documento: transaccion.cliente_documento || '',
      observaciones: transaccion.observaciones || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteTransaccion = (transaccion) => {
    setDeletingTransaccion(transaccion);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        precio_venta: parseFloat(formData.precio_venta),
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        vehiculo_id: formData.vehiculo_id ? parseInt(formData.vehiculo_id) : null,
        articulo_id: formData.articulo_id ? parseInt(formData.articulo_id) : null
      };

      const response = await fetch(`${API_URL}/transacciones/${editingTransaccion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Transacción actualizada exitosamente. Ganancia: $${result.ganancia?.toLocaleString()}`);
        setShowEditModal(false);
        setEditingTransaccion(null);
        cargarTransacciones();
        cargarVehiculos();
        cargarArticulos();
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al actualizar transacción');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/transacciones/${deletingTransaccion.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Transacción eliminada exitosamente');
        setShowDeleteModal(false);
        setDeletingTransaccion(null);
        cargarTransacciones();
        cargarVehiculos(); // Recargar para actualizar estados
        cargarArticulos();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al eliminar transacción');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>💰 Transacciones</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FaPlus className="me-2" />
              Nueva Transacción
            </Button>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filtros */}
      <Row className="mb-4">
        <Col md={currentUser?.rol === 'administrador' ? 8 : 6}>
          <Card>
            <Card.Body>
              <h5>Filtros</h5>
              <Row>
                <Col md={currentUser?.rol === 'administrador' ? 4 : 6}>
                  <Form.Group>
                    <Form.Label>Tipo de Transacción</Form.Label>
                    <Form.Select
                      name="tipo"
                      value={filtros.tipo}
                      onChange={handleFiltroChange}
                    >
                      <option value="">Todos los tipos</option>
                      <option value="venta_vehiculo">Venta Vehículo</option>
                      <option value="venta_articulo">Venta Artículo</option>
                      <option value="empeño_articulo">Empeño</option>
                      <option value="recuperacion_empeño">Recuperación</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={currentUser?.rol === 'administrador' ? 4 : 6}>
                  <Form.Group>
                    <Form.Label>Sede</Form.Label>
                    <Form.Select
                      name="sede_id"
                      value={filtros.sede_id}
                      onChange={handleFiltroChange}
                    >
                      <option value="">Todas las sedes</option>
                      {sedes.map(sede => (
                        <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                {currentUser?.rol === 'administrador' && (
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Usuario/Vendedor</Form.Label>
                      <Form.Select
                        name="usuario_id"
                        value={filtros.usuario_id}
                        onChange={handleFiltroChange}
                      >
                        <option value="">Todos los usuarios</option>
                        {usuarios.map(usuario => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nombre} ({usuario.rol})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
              </Row>
              <Button variant="outline-primary" onClick={aplicarFiltros} className="mt-2">
                Aplicar Filtros
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla de Transacciones */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Item</th>
                    <th>Cliente</th>
                    <th>Precio Venta</th>
                    <th>Ganancia</th>
                    <th>Usuario</th>
                    {currentUser?.rol === 'administrador' && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map(transaccion => (
                    <tr key={transaccion.id}>
                      <td>{transaccion.id}</td>
                      <td>{new Date(transaccion.fecha_transaccion).toLocaleDateString()}</td>
                      <td>{getTipoBadge(transaccion.tipo)}</td>
                      <td>
                        {transaccion.vehiculo_info || transaccion.articulo_info || 'N/A'}
                      </td>
                      <td>{transaccion.cliente_nombre || 'N/A'}</td>
                      <td className="text-success fw-bold">
                        ${transaccion.precio_venta?.toLocaleString()}
                      </td>
                      <td className={`fw-bold ${transaccion.ganancia >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${transaccion.ganancia?.toLocaleString()}
                      </td>
                      <td>{transaccion.usuario_nombre}</td>
                      {currentUser?.rol === 'administrador' && (
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEditTransaccion(transaccion)}
                              title="Editar transacción"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteTransaccion(transaccion)}
                              title="Eliminar transacción"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>

              {transacciones.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">No hay transacciones registradas</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Nueva Transacción */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nueva Transacción</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Transacción *</Form.Label>
                  <Form.Select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="venta_vehiculo">Venta Vehículo</option>
                    <option value="venta_articulo">Venta Artículo</option>
                    <option value="recuperacion_empeño">Recuperación Empeño</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Venta *</Form.Label>
                  <Form.Control
                    type="number"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                {formData.tipo === 'venta_vehiculo' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Vehículo *</Form.Label>
                    <Form.Select
                      name="vehiculo_id"
                      value={formData.vehiculo_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar vehículo...</option>
                      {vehiculos.filter(v => v.estado === 'disponible').map(vehiculo => (
                        <option key={vehiculo.id} value={vehiculo.id}>
                          {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa} - ${vehiculo.precio_venta?.toLocaleString()}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                {['venta_articulo', 'empeño_articulo', 'recuperacion_empeño'].includes(formData.tipo) && (
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Artículo *
                      {formData.tipo === 'recuperacion_empeño' &&
                        ` (${articulos.filter(a => a.estado === 'empeño').length} artículos en empeño)`
                      }
                      {formData.tipo === 'venta_articulo' &&
                        ` (${articulos.filter(a => a.estado === 'disponible').length} artículos disponibles)`
                      }
                      {formData.tipo === 'empeño_articulo' &&
                        ` (${articulos.filter(a => a.estado === 'disponible').length} artículos disponibles)`
                      }
                    </Form.Label>
                    <Form.Select
                      name="articulo_id"
                      value={formData.articulo_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar artículo...</option>
                      {articulos.length === 0 ? (
                        <option value="" disabled>No hay artículos disponibles</option>
                      ) : (
                        articulos
                          .filter(articulo => {
                            if (formData.tipo === 'recuperacion_empeño') return articulo.estado === 'empeño';
                            if (formData.tipo === 'venta_articulo') return articulo.estado === 'disponible';
                            if (formData.tipo === 'empeño_articulo') return articulo.estado === 'disponible';
                            return true;
                          })
                          .map(articulo => (
                            <option key={articulo.id} value={articulo.id}>
                              {articulo.descripcion} - ${articulo.valor?.toLocaleString()} - {articulo.estado}
                              {formData.tipo === 'recuperacion_empeño' && ' (EN EMPEÑO)'}
                            </option>
                          ))
                      )}
                    </Form.Select>
                    {formData.tipo === 'recuperacion_empeño' && articulos.filter(a => a.estado === 'empeño').length === 0 && (
                      <Form.Text className="text-warning">
                        No hay artículos en empeño disponibles para recuperar.
                      </Form.Text>
                    )}
                    {formData.tipo !== 'recuperacion_empeño' && articulos.filter(a => a.estado === 'disponible').length === 0 && (
                      <Form.Text className="text-muted">
                        No hay artículos disponibles para esta operación.
                      </Form.Text>
                    )}
                  </Form.Group>
                )}
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Compra (Automático)</Form.Label>
                  <Form.Control
                    type="number"
                    name="precio_compra"
                    value={formData.precio_compra}
                    step="0.01"
                    placeholder="Se llenará automáticamente al seleccionar el item"
                    disabled
                    readOnly
                  />
                  <Form.Text className="text-muted">
                    Este campo se llena automáticamente con el valor del artículo o precio de compra del vehículo seleccionado.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_nombre"
                    value={formData.cliente_nombre}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_telefono"
                    value={formData.cliente_telefono}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_documento"
                    value={formData.cliente_documento}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Transacción'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Editar Transacción */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Transacción</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Transacción *</Form.Label>
                  <Form.Select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="venta_vehiculo">Venta Vehículo</option>
                    <option value="venta_articulo">Venta Artículo</option>
                    <option value="recuperacion_empeño">Recuperación Empeño</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Venta *</Form.Label>
                  <Form.Control
                    type="number"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                {formData.tipo === 'venta_vehiculo' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Vehículo *</Form.Label>
                    <Form.Select
                      name="vehiculo_id"
                      value={formData.vehiculo_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar vehículo...</option>
                      {vehiculos.map(vehiculo => (
                        <option key={vehiculo.id} value={vehiculo.id}>
                          {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa} - ${vehiculo.precio_venta?.toLocaleString()}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                {['venta_articulo', 'empeño_articulo', 'recuperacion_empeño'].includes(formData.tipo) && (
                  <Form.Group className="mb-3">
                    <Form.Label>Artículo *</Form.Label>
                    <Form.Select
                      name="articulo_id"
                      value={formData.articulo_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar artículo...</option>
                      {articulos.map(articulo => (
                        <option key={articulo.id} value={articulo.id}>
                          {articulo.descripcion} - ${articulo.valor?.toLocaleString()} - {articulo.estado}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Compra</Form.Label>
                  <Form.Control
                    type="number"
                    name="precio_compra"
                    value={formData.precio_compra}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="Se tomará el precio registrado si está vacío"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_nombre"
                    value={formData.cliente_nombre}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_telefono"
                    value={formData.cliente_telefono}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="cliente_documento"
                    value={formData.cliente_documento}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button variant="warning" type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Transacción'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Eliminar Transacción */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Transacción</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas eliminar esta transacción?</p>
          {deletingTransaccion && (
            <div className="bg-light p-3 rounded">
              <strong>ID:</strong> {deletingTransaccion.id}<br />
              <strong>Tipo:</strong> {deletingTransaccion.tipo}<br />
              <strong>Precio:</strong> ${deletingTransaccion.precio_venta?.toLocaleString()}<br />
              <strong>Cliente:</strong> {deletingTransaccion.cliente_nombre || 'N/A'}<br />
              <strong>Fecha:</strong> {new Date(deletingTransaccion.fecha_transaccion).toLocaleDateString()}
            </div>
          )}
          <div className="mt-3">
            <small className="text-muted">
              <strong>Nota:</strong> Esta acción revertirá automáticamente el estado del vehículo o artículo asociado.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar Transacción'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Transacciones;
