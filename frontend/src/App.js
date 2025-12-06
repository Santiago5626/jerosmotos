import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Páginas públicas
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import VehicleDetail from './pages/VehicleDetail';

// Componentes de autenticación
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Componentes administrativos
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import Sedes from './components/admin/Sedes';
import Vehiculos from './components/admin/Vehiculos';
import Mantenimientos from './components/admin/Mantenimientos';
import ArticulosValor from './components/admin/ArticulosValor';
import Usuarios from './components/admin/Usuarios';
import Reportes from './components/admin/Reportes';
import Transacciones from './components/admin/Transacciones';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/vehiculo/:id" element={<VehicleDetail />} />

          {/* Ruta de login administrativo */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas del panel administrativo */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="sedes" element={
                    <ProtectedRoute requiredRole="administrador">
                      <Sedes />
                    </ProtectedRoute>
                  } />
                  <Route path="vehiculos" element={<Vehiculos />} />
                  <Route path="mantenimientos" element={<Mantenimientos />} />
                  <Route path="articulos" element={<ArticulosValor />} />
                  <Route path="transacciones" element={<Transacciones />} />
                  <Route path="usuarios" element={
                    <ProtectedRoute requiredRole="administrador">
                      <Usuarios />
                    </ProtectedRoute>
                  } />
                  <Route path="reportes" element={
                    <ProtectedRoute requiredRole="administrador">
                      <Reportes />
                    </ProtectedRoute>
                  } />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
