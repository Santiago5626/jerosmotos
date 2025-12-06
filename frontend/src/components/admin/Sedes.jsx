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
  Badge
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBuilding } from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../../config';

const Sedes = () => {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSede, setEditingSede] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/sedes/`);
      setSedes(response.data);
    } catch (error) {
      console.error('Error cargando sedes:', error);
      setError('Error al cargar las sedes');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (sede = null) => {
    if (sede) {
      setEditingSede(sede);
      setFormData({
        nombre: sede.nombre || '',
        direccion: sede.direccion || '',
        telefono: sede.telefono || ''
      });
    } else {
      setEditingSede(null);
      setFormData({
        nombre: '',
        direccion: '',
        telefono: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSede(null);
    setFormData({
      nombre: '',
      direccion: '',
      telefono: ''
    });
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
      if (editingSede) {
        // Actualizar sede existente
        await axios.put(`${API_URL}/sedes/${editingSede.id}`, formData);
      } else {
        // Crear nueva sede
        await axios.post(`${API_URL}/sedes/`, formData);
      }

      await loadSedes();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando sede:', error);
      setError(error.response?.data?.detail || 'Error al guardar la sede');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sedeId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sede?')) {
      try {
        await axios.delete(`${API_URL}/sedes/${sedeId}`);
        await loadSedes();
      } catch (error) {
        console.error('Error eliminando sede:', error);
        setError('Error al eliminar la sede');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando sedes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaBuilding className="me-2" />
          Gestión de Sedes
        </h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FaPlus className="me-2" />
          Nueva Sede
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Body>
          {sedes.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sedes.map((sede) => (
                  <tr key={sede.id}>
                    <td>
                      <Badge bg="secondary">#{sede.id}</Badge>
                    </td>
                    <td>
                      <strong>{sede.nombre}</strong>
                    </td>
                    <td>{sede.direccion || 'No especificada'}</td>
                    <td>{sede.telefono || 'No especificado'}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(sede)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(sede.id)}
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
              <FaBuilding size={48} className="text-muted mb-3" />
              <p className="text-muted">No hay sedes registradas</p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                Crear primera sede
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar sede */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSede ? 'Editar Sede' : 'Nueva Sede'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Sede *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej: Sede Principal"
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Ej: Calle 123 #45-67"
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Ej: +57 300 123 4567"
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
                editingSede ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Sedes;
