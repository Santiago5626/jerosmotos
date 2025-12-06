import React, { useState } from 'react';
import { Container, Row, Col, Nav, Navbar, Dropdown, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaBuilding, 
  FaCar, 
  FaWrench, 
  FaGem, 
  FaUsers, 
  FaChartBar, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaMoneyBillWave
} from 'react-icons/fa';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Inicio', icon: FaHome, roles: ['administrador', 'vendedor'] },
    { path: '/admin/sedes', label: 'Sedes', icon: FaBuilding, roles: ['administrador'] },
    { path: '/admin/vehiculos', label: 'Vehículos', icon: FaCar, roles: ['administrador', 'vendedor'] },
    { path: '/admin/mantenimientos', label: 'Mantenimientos', icon: FaWrench, roles: ['administrador', 'vendedor'] },
    { path: '/admin/articulos', label: 'Artículos de Valor', icon: FaGem, roles: ['administrador', 'vendedor'] },
    { path: '/admin/transacciones', label: 'Transacciones', icon: FaMoneyBillWave, roles: ['administrador', 'vendedor'] },
    { path: '/admin/usuarios', label: 'Usuarios', icon: FaUsers, roles: ['administrador'] },
    { path: '/admin/reportes', label: 'Reportes', icon: FaChartBar, roles: ['administrador'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.rol)
  );

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      {/* Header */}
      <Navbar style={{backgroundColor: '#343a40'}} variant="dark" expand="lg" className="admin-header shadow-sm px-3">
        <Button
          variant="outline-light"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="me-3"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </Button>

        <Navbar.Brand className="d-flex align-items-center flex-grow-1">
          <img
            src={require('../../assets/logo-jerosmotos.png')}
            alt="Jeros'Motos"
            height="40"
            className="me-2"
          />
        </Navbar.Brand>

        {/* Información del usuario simple */}
        <div className="text-light text-end">
          <div className="fw-bold">{user?.nombre}</div>
          <small className="text-light opacity-75">
            {user?.rol === 'administrador' ? 'Administrador' : 'Vendedor'}
          </small>
        </div>
      </Navbar>

      <div className="admin-body">
        {/* Sidebar */}
        <div 
          className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${sidebarHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          <Nav className="flex-column pt-3 h-100">
            {filteredMenuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Nav.Link
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`admin-nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <IconComponent className="me-2" />
                  {(sidebarOpen || sidebarHovered) && <span>{item.label}</span>}
                </Nav.Link>
              );
            })}
            
            {/* Botón de cerrar sesión al final del sidebar */}
            <div className="mt-auto pt-3 border-top">
              <Nav.Link
                onClick={handleLogout}
                className="admin-nav-link text-danger"
                style={{ cursor: 'pointer' }}
              >
                <FaSignOutAlt className="me-2" />
                <span>Cerrar Sesión</span>
              </Nav.Link>
            </div>
          </Nav>
        </div>

        {/* Main Content */}
        <div className={`admin-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${sidebarHovered ? 'sidebar-hovered' : ''}`}>
          <Container fluid className="p-4">
            {children}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
