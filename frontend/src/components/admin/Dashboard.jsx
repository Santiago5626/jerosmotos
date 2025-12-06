import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaCar, FaMoneyBillWave, FaGem, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';
import './Dashboard.css';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalVehiculos: 0,
    vehiculosVendidos: 0,
    empenosActivos: 0,
    valorInventario: 0,
    gananciaMensual: 0
  });
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Cargar estadísticas básicas
      const [vehiculosRes, articulosRes, transaccionesRes, estadisticasRes] = await Promise.all([
        axios.get(`${API_URL}/vehiculos/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/articulos_valor/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/transacciones/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/transacciones/estadisticas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const vehiculos = vehiculosRes.data;
      const articulos = articulosRes.data;
      const transacciones = transaccionesRes.data;
      const estadisticasTransacciones = estadisticasRes.data;

      // Calcular estadísticas
      const totalVehiculos = vehiculos.length;
      const vehiculosVendidos = vehiculos.filter(v => v.estado === 'vendido').length;
      const vehiculosEmpeño = vehiculos.filter(v => v.estado === 'empeño').length;
      const articulosEmpeño = articulos.filter(a => a.estado === 'empeño').length;
      const empenosActivos = vehiculosEmpeño + articulosEmpeño;

      // Calcular valor del inventario (vehículos disponibles)
      const valorInventario = vehiculos
        .filter(v => v.estado === 'disponible')
        .reduce((sum, v) => sum + parseFloat(v.precio_venta || 0), 0);

      // Usar ganancia real de transacciones
      const gananciaMensual = estadisticasTransacciones.total_ganancias || 0;

      setStats({
        totalVehiculos,
        vehiculosVendidos,
        empenosActivos,
        valorInventario,
        gananciaMensual
      });

      // Preparar movimientos recientes (últimas transacciones)
      const movimientosRecientes = transacciones
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          tipo: t.tipo === 'venta_vehiculo' ? 'Venta Vehículo' :
            t.tipo === 'venta_articulo' ? 'Venta Artículo' :
              t.tipo === 'empeño_articulo' ? 'Empeño' : 'Recuperación',
          descripcion: t.vehiculo_info || t.articulo_info || 'N/A',
          estado: 'completado',
          valor: t.precio_venta,
          fecha: new Date(t.fecha_transaccion).toLocaleDateString(),
          ganancia: t.ganancia
        }));

      setRecentMovements(movimientosRecientes);

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      'disponible': 'success',
      'vendido': 'primary',
      'empeño': 'warning',
      'baja': 'danger'
    };
    return <Badge bg={variants[estado] || 'secondary'}>{estado}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <small className="text-muted">
          Última actualización: {new Date().toLocaleString()}
        </small>
      </div>

      {/* Tarjetas de resumen */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-primary">
                <FaCar />
              </div>
              <div className="ms-3">
                <h3 className="mb-0">{stats.totalVehiculos}</h3>
                <p className="text-muted mb-0">Total Vehículos</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-success">
                <FaMoneyBillWave />
              </div>
              <div className="ms-3">
                <h3 className="mb-0">{stats.vehiculosVendidos}</h3>
                <p className="text-muted mb-0">Vehículos Vendidos</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-warning">
                <FaGem />
              </div>
              <div className="ms-3">
                <h3 className="mb-0">{stats.empenosActivos}</h3>
                <p className="text-muted mb-0">Empeños Activos</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-info">
                <FaChartLine />
              </div>
              <div className="ms-3">
                <h4 className="mb-0 fs-6">{formatCurrency(stats.valorInventario)}</h4>
                <p className="text-muted mb-0">Valor Inventario</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isAdmin && (
        <Row className="mb-4">
          <Col lg={12}>
            <Card className="stat-card">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon bg-success">
                  <FaMoneyBillWave />
                </div>
                <div className="ms-3">
                  <h4 className="mb-0">{formatCurrency(stats.gananciaMensual)}</h4>
                  <p className="text-muted mb-0">Ganancia Neta Mensual</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Últimos movimientos */}
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Últimos Movimientos</h5>
            </Card.Header>
            <Card.Body>
              {recentMovements.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th>Valor</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovements.map((movement, index) => (
                      <tr key={index}>
                        <td>{movement.tipo}</td>
                        <td>{movement.descripcion}</td>
                        <td>{getEstadoBadge(movement.estado)}</td>
                        <td>{formatCurrency(movement.valor)}</td>
                        <td>{movement.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center py-3">No hay movimientos recientes</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
