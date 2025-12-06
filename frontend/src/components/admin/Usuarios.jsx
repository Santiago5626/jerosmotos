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
import { FaPlus, FaEdit, FaTrash, FaUsers, FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'vendedor',
    sede_id: ''
  });

  const rolOptions = [
    { value: 'administrador', label: 'Administrador', variant: 'danger' },
    { value: 'vendedor', label: 'Vendedor', variant: 'primary' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, sedesRes] = await Promise.all([
        axios.get('http://localhost:8000/usuarios/'),
        axios.get('http://localhost:8000/sedes/')
      ]);
      setUsuarios(usuariosRes.data);
      setSedes(sedesRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (usuario = null) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        nombre: usuario.nombre || '',
        correo: usuario.correo || '',
        contrasena: '', // No mostrar contraseña existente
        rol: usuario.rol || 'vendedor',
        sede_id: usuario.sede_id || ''
      });
    } else {
      setEditingUsuario(null);
      setFormData({
        nombre: '',
        correo: '',
        contrasena: '',
        rol: 'vendedor',
        sede_id: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUsuario(null);
    setError('');
    setShowPassword(false);
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
        nombre: formData.nombre,
        correo: formData.correo,
        rol: formData.rol
      };

      // Solo incluir contraseña si se está creando o si se cambió
      if (!editingUsuario || formData.contrasena) {
        dataToSend.contrasena = formData.contrasena;
      }

      if (editingUsuario) {
        await axios.put(`http://localhost:8000/usuarios/${editingUsuario.id}`, dataToSend);
      } else {
        await axios.post('http://localhost:8000/usuarios/register', dataToSend);
      }
      
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      setError(error.response?.data?.detail || 'Error al guardar el usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (usuarioId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await axios.delete(`http://localhost:8000/usuarios/${usuarioId}`);
        await loadData();
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        setError('Error al eliminar el usuario');
      }
    }
  };

  const getRolBadge = (rol) => {
    const rolInfo = rolOptions.find(opt => opt.value === rol);
    return (
      <Badge bg={rolInfo?.variant || 'secondary'}>
        {rolInfo?.label || rol}
      </Badge>
    );
  };

  const getSedeName = (sedeId) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : 'Sin sede asignada';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = !searchTerm || 
      usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.correo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRol = !filterRol || usuario.rol === filterRol;

    return matchesSearch && matchesRol;
  });

  // Calcular estadísticas
  const stats = {
    total: usuarios.length,
    administradores: usuarios.filter(u => u.rol === 'administrador').length,
    vendedores: usuarios.filter(u => u.rol === 'vendedor').length
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaUsers className="me-2" />
          Gestión de Usuarios
        </h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FaPlus className="me-2" />
          Nuevo Usuario
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <h3 className="text-primary">{stats.total}</h3>
              <p className="text-muted mb-0">Total Usuarios</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <h3 className="text-danger">{stats.administradores}</h3>
              <p className="text-muted mb-0">Administradores</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <h3 className="text-info">{stats.vendedores}</h3>
              <p className="text-muted mb-0">Vendedores</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {rolOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRol('');
                }}
              >
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {filteredUsuarios.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <strong>{usuario.nombre}</strong>
                    </td>
                    <td>{usuario.correo}</td>
                    <td>{getRolBadge(usuario.rol)}</td>
                    <td>
                      <Badge bg="info">
                        {formatDate(usuario.fecha_creacion)}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(usuario)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(usuario.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <FaUsers size={48} className="text-muted mb-3" />
              <p className="text-muted">No hay usuarios que coincidan con los filtros</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar usuario */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Nombre Completo *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej: Juan Pérez"
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Correo Electrónico *</Form.Label>
              <Form.Control
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleInputChange}
                required
                placeholder="usuario@ejemplo.com"
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Contraseña {editingUsuario ? '(dejar vacío para mantener actual)' : '*'}
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleInputChange}
                  required={!editingUsuario}
                  placeholder="Contraseña segura"
                  disabled={submitting}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
              {!editingUsuario && (
                <Form.Text className="text-muted">
                  Mínimo 6 caracteres, incluye mayúsculas, minúsculas y números.
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol *</Form.Label>
              <Form.Select
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
                required
                disabled={submitting}
              >
                {rolOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Los administradores tienen acceso completo al sistema.
              </Form.Text>
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
                editingUsuario ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Usuarios;
