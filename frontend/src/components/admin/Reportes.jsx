import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  Alert, 
  Spinner,
  Badge
} from 'react-bootstrap';
import { FaChartBar, FaDownload, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import * as XLSX from 'xlsx';

const Reportes = () => {
  // URL base de la API
  const API_BASE_URL = 'http://localhost:8000';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [sedes, setSedes] = useState([]);
  
  const [filters, setFilters] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    sedeId: '',
    tipoReporte: 'general'
  });

  // Utility functions to handle N/A values
  const isValidValue = (value) => {
    return value !== null && value !== undefined && value !== '' && value !== 'N/A';
  };

  const getCleanValue = (value, fallback = '') => {
    return isValidValue(value) ? value : fallback;
  };

  const formatCleanText = (...values) => {
    const cleanValues = values.filter(v => isValidValue(v));
    return cleanValues.length > 0 ? cleanValues.join(' ') : '';
  };

  const getCleanDays = (dateString) => {
    if (!isValidValue(dateString)) return null;
    try {
      const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : null;
    } catch {
      return null;
    }
  };

  const tiposReporte = [
    { value: 'general', label: 'Reporte General' },
    { value: 'vehiculos', label: 'Vehículos Vendidos' },
    { value: 'inventario', label: 'Valor de Inventario' },
    { value: 'ganancias', label: 'Ganancias' },
    { value: 'empenos', label: 'Empeños Activos' }
  ];

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sedes/`);
      setSedes(response.data);
    } catch (error) {
      console.error('Error cargando sedes:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar datos necesarios para el reporte
      const [vehiculosRes, articulosRes, mantenimientosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/vehiculos/`),
        axios.get(`${API_BASE_URL}/articulos_valor/`),
        axios.get(`${API_BASE_URL}/mantenimientos/`)
      ]);

      const vehiculos = vehiculosRes.data;
      const articulos = articulosRes.data;
      const mantenimientos = mantenimientosRes.data;

      // Filtrar por sede si se especifica
      const vehiculosFiltrados = filters.sedeId 
        ? vehiculos.filter(v => v.sede_id === parseInt(filters.sedeId))
        : vehiculos;

      const articulosFiltrados = filters.sedeId
        ? articulos.filter(a => a.sede_id === parseInt(filters.sedeId))
        : articulos;

      // Generar datos del reporte según el tipo
      let data = {};

      switch (filters.tipoReporte) {
        case 'general':
          data = generateGeneralReport(vehiculosFiltrados, articulosFiltrados, mantenimientos);
          break;
        case 'vehiculos':
          data = generateVehiculosReport(vehiculosFiltrados);
          break;
        case 'inventario':
          data = generateInventarioReport(vehiculosFiltrados, articulosFiltrados);
          break;
        case 'ganancias':
          data = generateGananciasReport(vehiculosFiltrados, articulosFiltrados, mantenimientos);
          break;
        case 'empenos':
          data = generateEmpenosReport(vehiculosFiltrados, articulosFiltrados);
          break;
        default:
          data = generateGeneralReport(vehiculosFiltrados, articulosFiltrados, mantenimientos);
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generando reporte:', error);
      setError('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const generateGeneralReport = (vehiculos, articulos, mantenimientos) => {
    const vehiculosVendidos = vehiculos.filter(v => v.estado === 'vendido');
    const vehiculosDisponibles = vehiculos.filter(v => v.estado === 'disponible');
    const vehiculosEmpeno = vehiculos.filter(v => v.estado === 'empeño');
    const articulosEmpeno = articulos.filter(a => a.estado === 'empeño');
    const articulosVendidos = articulos.filter(a => a.estado === 'vendido');

    const valorInventarioVehiculos = vehiculosDisponibles.reduce((sum, v) => sum + parseFloat(v.precio_venta || 0), 0);
    const valorInventarioArticulos = articulos.filter(a => a.estado === 'disponible').reduce((sum, a) => sum + parseFloat(a.valor || 0), 0);
    
    const ingresosPorVentas = vehiculosVendidos.reduce((sum, v) => sum + parseFloat(v.precio_venta || 0), 0) +
                             articulosVendidos.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0);
    
    const costoMantenimientos = mantenimientos.reduce((sum, m) => sum + parseFloat(m.costo || 0), 0);
    const costoCompraVehiculos = vehiculosVendidos.reduce((sum, v) => sum + parseFloat(v.precio_compra || 0), 0);
    
    const gananciaBruta = ingresosPorVentas - costoCompraVehiculos;
    const gananciaNeta = gananciaBruta - costoMantenimientos;

    return {
      tipo: 'general',
      resumen: {
        totalVehiculos: vehiculos.length,
        vehiculosVendidos: vehiculosVendidos.length,
        vehiculosDisponibles: vehiculosDisponibles.length,
        vehiculosEmpeno: vehiculosEmpeno.length,
        totalArticulos: articulos.length,
        articulosEmpeno: articulosEmpeno.length,
        articulosVendidos: articulosVendidos.length,
        valorInventarioTotal: valorInventarioVehiculos + valorInventarioArticulos,
        ingresosPorVentas,
        gananciaBruta,
        gananciaNeta,
        costoMantenimientos
      },
      detalles: {
        vehiculosVendidos,
        articulosVendidos,
        mantenimientosRecientes: mantenimientos.slice(-10)
      }
    };
  };

  const generateVehiculosReport = (vehiculos) => {
    const vehiculosVendidos = vehiculos.filter(v => v.estado === 'vendido');
    
    return {
      tipo: 'vehiculos',
      resumen: {
        totalVendidos: vehiculosVendidos.length,
        valorTotalVentas: vehiculosVendidos.reduce((sum, v) => sum + parseFloat(v.precio_venta || 0), 0),
        valorTotalCompras: vehiculosVendidos.reduce((sum, v) => sum + parseFloat(v.precio_compra || 0), 0)
      },
      detalles: vehiculosVendidos
    };
  };

  const generateInventarioReport = (vehiculos, articulos) => {
    const vehiculosDisponibles = vehiculos.filter(v => v.estado === 'disponible');
    const articulosDisponibles = articulos.filter(a => a.estado === 'disponible');
    
    return {
      tipo: 'inventario',
      resumen: {
        vehiculosDisponibles: vehiculosDisponibles.length,
        articulosDisponibles: articulosDisponibles.length,
        valorVehiculos: vehiculosDisponibles.reduce((sum, v) => sum + parseFloat(v.precio_venta || 0), 0),
        valorArticulos: articulosDisponibles.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0)
      },
      detalles: {
        vehiculos: vehiculosDisponibles,
        articulos: articulosDisponibles
      }
    };
  };

  const generateGananciasReport = (vehiculos, articulos, mantenimientos) => {
    const vehiculosVendidos = vehiculos.filter(v => v.estado === 'vendido');
    const articulosVendidos = articulos.filter(a => a.estado === 'vendido');
    
    const ingresosPorVentas = vehiculosVendidos.reduce((sum, v) => sum + parseFloat(v.precio_venta || 0), 0) +
                             articulosVendidos.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0);
    
    const costoCompras = vehiculosVendidos.reduce((sum, v) => sum + parseFloat(v.precio_compra || 0), 0);
    const costoMantenimientos = mantenimientos.reduce((sum, m) => sum + parseFloat(m.costo || 0), 0);
    
    return {
      tipo: 'ganancias',
      resumen: {
        ingresosTotales: ingresosPorVentas,
        costosTotales: costoCompras + costoMantenimientos,
        gananciaBruta: ingresosPorVentas - costoCompras,
        gananciaNeta: ingresosPorVentas - costoCompras - costoMantenimientos
      },
      detalles: {
        vehiculosVendidos,
        articulosVendidos,
        mantenimientos
      }
    };
  };

  const generateEmpenosReport = (vehiculos, articulos) => {
    const vehiculosEmpeno = vehiculos.filter(v => v.estado === 'empeño');
    const articulosEmpeno = articulos.filter(a => a.estado === 'empeño');
    
    // Para vehículos en empeño, el valor del empeño está en precio_compra (valor_empeno)
    // y la tasa de interés en precio_venta (interes_porcentaje)
    return {
      tipo: 'empenos',
      resumen: {
        vehiculosEnEmpeno: vehiculosEmpeno.length,
        articulosEnEmpeno: articulosEmpeno.length,
        valorTotalEmpenos: vehiculosEmpeno.reduce((sum, v) => sum + parseFloat(v.precio_compra || 0), 0) +
                          articulosEmpeno.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0)
      },
      detalles: {
        vehiculos: vehiculosEmpeno,
        articulos: articulosEmpeno
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getSedeName = (sedeId) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : 'Todas las sedes';
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    // Cargar datos de vehículos para poder hacer la búsqueda en mantenimientos
    let vehiculos = [];
    try {
      const vehiculosRes = await axios.get(`${API_BASE_URL}/vehiculos/`);
      vehiculos = vehiculosRes.data;
    } catch (error) {
      console.error('Error cargando vehículos para reporte:', error);
    }

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Función para aplicar estilos a los títulos
    const applyHeaderStyles = (worksheet, range) => {
      if (!worksheet['!cols']) worksheet['!cols'] = [];
      if (!worksheet['!rows']) worksheet['!rows'] = [];
      
      // Aplicar estilos a las celdas de encabezado
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({c: C, r: R});
          if (!worksheet[cell_address]) continue;
          
          // Aplicar negrita a títulos principales y encabezados
          if (worksheet[cell_address].v && 
              (worksheet[cell_address].v.toString().includes('REPORTE') ||
               worksheet[cell_address].v.toString().includes('RESUMEN') ||
               worksheet[cell_address].v.toString().includes('ANÁLISIS') ||
               worksheet[cell_address].v.toString().includes('DETALLE') ||
               worksheet[cell_address].v.toString().includes('INFORMACIÓN') ||
               worksheet[cell_address].v === 'Marca/Modelo' ||
               worksheet[cell_address].v === 'Placa' ||
               worksheet[cell_address].v === 'Descripción' ||
               worksheet[cell_address].v === 'Categoría' ||
               worksheet[cell_address].v === 'Métrica' ||
               worksheet[cell_address].v === 'Concepto' ||
               worksheet[cell_address].v === 'Tipo de Reporte:' ||
               worksheet[cell_address].v === 'Sede Analizada:' ||
               worksheet[cell_address].v === 'Período de Análisis:')) {
            
            worksheet[cell_address].s = {
              font: { bold: true, sz: 12 },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
        }
      }
    };
    
    // Información del reporte más detallada
    const reportInfo = [
      ['REPORTE DETALLADO - GERO\' MOTOS'],
      [],
      ['Información del Reporte:'],
      ['Tipo de Reporte:', tiposReporte.find(t => t.value === filters.tipoReporte)?.label],
      ['Sede Analizada:', getSedeName(parseInt(filters.sedeId))],
      ['Período de Análisis:', `${filters.fechaInicio} a ${filters.fechaFin}`],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-CO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['Generado por:', 'Sistema Administrativo'],
      [],
      ['='.repeat(50)],
      []
    ];

    if (reportData.tipo === 'general') {
      // Hoja 1: Resumen Ejecutivo
      const resumenEjecutivo = [
        ...reportInfo,
        ['RESUMEN EJECUTIVO'],
        [],
        [],
        ['Categoría', 'Métrica', 'Valor', 'Porcentaje'],
        ['Vehículos', 'Total en Sistema', reportData.resumen.totalVehiculos, '100%'],
        ['Vehículos', 'Vendidos', reportData.resumen.vehiculosVendidos, reportData.resumen.totalVehiculos > 0 ? `${((reportData.resumen.vehiculosVendidos / reportData.resumen.totalVehiculos) * 100).toFixed(1)}%` : '0%'],
        ['Vehículos', 'Disponibles', reportData.resumen.vehiculosDisponibles, reportData.resumen.totalVehiculos > 0 ? `${((reportData.resumen.vehiculosDisponibles / reportData.resumen.totalVehiculos) * 100).toFixed(1)}%` : '0%'],
        ['Vehículos', 'En Empeño', reportData.resumen.vehiculosEmpeno, reportData.resumen.totalVehiculos > 0 ? `${((reportData.resumen.vehiculosEmpeno / reportData.resumen.totalVehiculos) * 100).toFixed(1)}%` : '0%'],
        [],
        ['Artículos', 'Total en Sistema', reportData.resumen.totalArticulos, '100%'],
        ['Artículos', 'En Empeño', reportData.resumen.articulosEmpeno, reportData.resumen.totalArticulos > 0 ? `${((reportData.resumen.articulosEmpeno / reportData.resumen.totalArticulos) * 100).toFixed(1)}%` : '0%'],
        ['Artículos', 'Vendidos', reportData.resumen.articulosVendidos, reportData.resumen.totalArticulos > 0 ? `${((reportData.resumen.articulosVendidos / reportData.resumen.totalArticulos) * 100).toFixed(1)}%` : '0%'],
        [],
        ['ANÁLISIS FINANCIERO'],
        [],
        ['Concepto', 'Valor (COP)', 'Observaciones'],
        ['Valor Total Inventario', reportData.resumen.valorInventarioTotal, 'Vehículos + Artículos disponibles'],
        ['Ingresos por Ventas', reportData.resumen.ingresosPorVentas, 'Total de ventas realizadas'],
        ['Ganancia Bruta', reportData.resumen.gananciaBruta, 'Ingresos - Costo de compra'],
        ['Costo Mantenimientos', reportData.resumen.costoMantenimientos, 'Gastos operativos'],
        ['Ganancia Neta', reportData.resumen.gananciaNeta, 'Ganancia final después de gastos']
      ];
      
      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenEjecutivo);
      
      // Aplicar estilos a los encabezados
      const range = XLSX.utils.decode_range(resumenSheet['!ref']);
      applyHeaderStyles(resumenSheet, range);
      
      // Ajustar ancho de columnas
      resumenSheet['!cols'] = [
        { width: 20 }, // Categoría
        { width: 25 }, // Métrica
        { width: 20 }, // Valor
        { width: 15 }  // Porcentaje
      ];
      
      XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen Ejecutivo');

      // Hoja 2: Detalle de Vehículos Vendidos
      if (reportData.detalles.vehiculosVendidos && reportData.detalles.vehiculosVendidos.length > 0) {
        const vehiculosVendidosData = [
          ['DETALLE DE VEHÍCULOS VENDIDOS'],
          [],
          ['Marca/Modelo', 'Placa', 'Año', 'Color', 'Precio Compra', 'Precio Venta', 'Ganancia', 'Margen %', 'Sede', 'Estado'],
          ...reportData.detalles.vehiculosVendidos.map(vehiculo => {
            const ganancia = (vehiculo.precio_venta || 0) - (vehiculo.precio_compra || 0);
            const margen = vehiculo.precio_venta ? ((ganancia / vehiculo.precio_venta) * 100).toFixed(2) : 0;
            return [
              `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`,
              vehiculo.placa || '',
              vehiculo.año || '',
              vehiculo.color || '',
              vehiculo.precio_compra || 0,
              vehiculo.precio_venta || 0,
              ganancia,
              `${margen}%`,
              getSedeName(vehiculo.sede_id),
              vehiculo.estado || ''
            ];
          }),
          [],
          ['RESUMEN DE VENTAS'],
          ['Total Vehículos Vendidos:', reportData.detalles.vehiculosVendidos.length],
          ['Valor Total Ventas:', reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + (v.precio_venta || 0), 0)],
          ['Costo Total Compras:', reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + (v.precio_compra || 0), 0)],
          ['Ganancia Total:', reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + ((v.precio_venta || 0) - (v.precio_compra || 0)), 0)]
        ];
        
        const vehiculosVendidosSheet = XLSX.utils.aoa_to_sheet(vehiculosVendidosData);
        
        // Aplicar estilos
        const range = XLSX.utils.decode_range(vehiculosVendidosSheet['!ref']);
        applyHeaderStyles(vehiculosVendidosSheet, range);
        
        // Ajustar ancho de columnas
        vehiculosVendidosSheet['!cols'] = [
          { width: 20 }, // Marca/Modelo
          { width: 12 }, // Placa
          { width: 8 },  // Año
          { width: 12 }, // Color
          { width: 15 }, // Precio Compra
          { width: 15 }, // Precio Venta
          { width: 15 }, // Ganancia
          { width: 12 }, // Margen %
          { width: 15 }, // Sede
          { width: 10 }  // Estado
        ];
        
        XLSX.utils.book_append_sheet(workbook, vehiculosVendidosSheet, 'Vehículos Vendidos');
      }

      // Hoja 3: Detalle de Artículos Vendidos
      if (reportData.detalles.articulosVendidos && reportData.detalles.articulosVendidos.length > 0) {
        const articulosVendidosData = [
          ['DETALLE DE ARTÍCULOS VENDIDOS'],
          [],
          ['Descripción', 'Tipo', 'Valor', 'Fecha Ingreso', 'Sede', 'Estado', 'Días en Inventario'],
          ...reportData.detalles.articulosVendidos.map(articulo => {
            const diasInventario = articulo.fecha_ingreso ? 
              Math.floor((new Date() - new Date(articulo.fecha_ingreso)) / (1000 * 60 * 60 * 24)) : 0;
            return [
              articulo.descripcion || '',
              articulo.tipo || '',
              articulo.valor || 0,
              formatDate(articulo.fecha_ingreso),
              getSedeName(articulo.sede_id),
              articulo.estado || '',
              diasInventario
            ];
          }),
          [],
          ['RESUMEN DE ARTÍCULOS'],
          ['Total Artículos Vendidos:', reportData.detalles.articulosVendidos.length],
          ['Valor Total:', reportData.detalles.articulosVendidos.reduce((sum, a) => sum + (a.valor || 0), 0)]
        ];
        
        const articulosVendidosSheet = XLSX.utils.aoa_to_sheet(articulosVendidosData);
        
        // Aplicar estilos
        const range = XLSX.utils.decode_range(articulosVendidosSheet['!ref']);
        applyHeaderStyles(articulosVendidosSheet, range);
        
        // Ajustar ancho de columnas
        articulosVendidosSheet['!cols'] = [
          { width: 25 }, // Descripción
          { width: 15 }, // Tipo
          { width: 15 }, // Valor
          { width: 15 }, // Fecha Ingreso
          { width: 15 }, // Sede
          { width: 10 }, // Estado
          { width: 12 }  // Días en Inventario
        ];
        
        XLSX.utils.book_append_sheet(workbook, articulosVendidosSheet, 'Artículos Vendidos');
      }

      // Hoja 4: Mantenimientos Recientes
      if (reportData.detalles.mantenimientosRecientes && reportData.detalles.mantenimientosRecientes.length > 0) {
        const mantenimientosData = [
          ['MANTENIMIENTOS RECIENTES'],
          [],
          ['Vehículo', 'Servicio', 'Descripción', 'Costo', 'Fecha', 'Taller', 'Observaciones'],
          ...reportData.detalles.mantenimientosRecientes.map(mant => {
            // Buscar el vehículo correspondiente en los datos cargados
            const vehiculo = vehiculos.find(v => v.id === mant.vehiculo_id);
            const vehiculoInfo = vehiculo ? formatCleanText(vehiculo.marca, vehiculo.modelo, vehiculo.placa) : 'Vehículo no encontrado';
            
            return [
              vehiculoInfo,
              getCleanValue(mant.servicio),
              getCleanValue(mant.observaciones),
              mant.costo || 0,
              formatDate(mant.fecha_servicio),
              getCleanValue(mant.taller, 'No especificado'),
              getCleanValue(mant.observaciones, 'Sin observaciones')
            ];
          }),
          [],
          ['RESUMEN DE MANTENIMIENTOS'],
          ['Total Mantenimientos:', reportData.detalles.mantenimientosRecientes.length],
          ['Costo Total:', reportData.detalles.mantenimientosRecientes.reduce((sum, m) => sum + (m.costo || 0), 0)]
        ];
        
        const mantenimientosSheet = XLSX.utils.aoa_to_sheet(mantenimientosData);
        
        // Aplicar estilos
        const range = XLSX.utils.decode_range(mantenimientosSheet['!ref']);
        applyHeaderStyles(mantenimientosSheet, range);
        
        // Ajustar ancho de columnas
        mantenimientosSheet['!cols'] = [
          { width: 20 }, // Vehículo
          { width: 20 }, // Tipo Mantenimiento
          { width: 25 }, // Descripción
          { width: 15 }, // Costo
          { width: 12 }, // Fecha
          { width: 20 }, // Taller
          { width: 18 }  // Próximo Mantenimiento
        ];
        
        XLSX.utils.book_append_sheet(workbook, mantenimientosSheet, 'Mantenimientos');
      }

    } else if (reportData.tipo === 'inventario') {
      // Hoja 1: Resumen de Inventario
      const totalInventario = reportData.resumen.valorVehiculos + reportData.resumen.valorArticulos;
      const resumenData = [
        ...reportInfo,
        ['INVENTARIO DETALLADO'],
        [],
        ['RESUMEN POR CATEGORÍA'],
        [],
        ['Categoría', 'Cantidad', 'Valor Total (COP)', 'Valor Promedio', 'Porcentaje del Total'],
        ['Vehículos Disponibles', 
         reportData.resumen.vehiculosDisponibles, 
         reportData.resumen.valorVehiculos,
         reportData.resumen.vehiculosDisponibles > 0 ? (reportData.resumen.valorVehiculos / reportData.resumen.vehiculosDisponibles).toFixed(0) : 0,
         totalInventario > 0 ? `${((reportData.resumen.valorVehiculos / totalInventario) * 100).toFixed(1)}%` : '0%'
        ],
        ['Artículos Disponibles', 
         reportData.resumen.articulosDisponibles, 
         reportData.resumen.valorArticulos,
         reportData.resumen.articulosDisponibles > 0 ? (reportData.resumen.valorArticulos / reportData.resumen.articulosDisponibles).toFixed(0) : 0,
         totalInventario > 0 ? `${((reportData.resumen.valorArticulos / totalInventario) * 100).toFixed(1)}%` : '0%'
        ],
        [],
        ['TOTAL INVENTARIO', 
         reportData.resumen.vehiculosDisponibles + reportData.resumen.articulosDisponibles, 
         totalInventario,
         '', '100%'
        ],
        [],
        ['INFORMACIÓN ADICIONAL'],
        [],
        ['Concepto', 'Detalle'],
        ['Capital Invertido Total', `$${totalInventario.toLocaleString('es-CO')}`],
        ['Items Únicos en Stock', reportData.resumen.vehiculosDisponibles + reportData.resumen.articulosDisponibles],
        ['Fecha del Reporte', new Date().toLocaleDateString('es-CO')]
      ];
      
      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
      
      // Aplicar estilos
      const range = XLSX.utils.decode_range(resumenSheet['!ref']);
      applyHeaderStyles(resumenSheet, range);
      
      // Ajustar ancho de columnas
      resumenSheet['!cols'] = [
        { width: 25 }, // Categoría
        { width: 15 }, // Cantidad
        { width: 20 }, // Valor Total
        { width: 15 }, // Valor Promedio
        { width: 18 }  // Porcentaje del Total
      ];
      
      XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen Inventario');

      // Hoja 2: Vehículos Disponibles Detallado
      if (reportData.detalles.vehiculos && reportData.detalles.vehiculos.length > 0) {
        const vehiculosData = [
          ['INVENTARIO DETALLADO - VEHÍCULOS DISPONIBLES'],
          [],
          ['Marca/Modelo', 'Placa', 'Color', 'Cilindraje', 'Precio Compra', 'Precio Venta', 'Observaciones', 'Sede'],
          ...reportData.detalles.vehiculos.map(vehiculo => {
            const marcaModelo = formatCleanText(vehiculo.marca, vehiculo.modelo);
            return [
              marcaModelo || 'Vehículo sin especificar',
              getCleanValue(vehiculo.placa),
              getCleanValue(vehiculo.color),
              getCleanValue(vehiculo.cilindraje),
              vehiculo.precio_compra || 0,
              vehiculo.precio_venta || 0,
              getCleanValue(vehiculo.observaciones, 'Sin observaciones'),
              getSedeName(vehiculo.sede_id)
            ];
          })
        ];
        
        const vehiculosSheet = XLSX.utils.aoa_to_sheet(vehiculosData);
        
        // Aplicar estilos
        const range = XLSX.utils.decode_range(vehiculosSheet['!ref']);
        applyHeaderStyles(vehiculosSheet, range);
        
        // Ajustar ancho de columnas
        vehiculosSheet['!cols'] = [
          { width: 20 }, // Marca/Modelo
          { width: 12 }, // Placa
          { width: 12 }, // Color
          { width: 12 }, // Cilindraje
          { width: 15 }, // Precio Compra
          { width: 15 }, // Precio Venta
          { width: 25 }, // Observaciones
          { width: 15 }  // Sede
        ];
        
        XLSX.utils.book_append_sheet(workbook, vehiculosSheet, 'Vehículos Detalle');
      }

      // Hoja 3: Artículos Disponibles Detallado
      if (reportData.detalles.articulos && reportData.detalles.articulos.length > 0) {
        const articulosData = [
          ['INVENTARIO DETALLADO - ARTÍCULOS DISPONIBLES'],
          [],
          ['Descripción', 'Tipo', 'Marca', 'Modelo', 'Serie/IMEI', 'Valor', 'Estado', 'Observaciones', 'Sede'],
          ...reportData.detalles.articulos.map(articulo => {
            const serieImei = getCleanValue(articulo.serie) || getCleanValue(articulo.imei);
            return [
              getCleanValue(articulo.descripcion),
              getCleanValue(articulo.tipo),
              getCleanValue(articulo.marca),
              getCleanValue(articulo.modelo),
              serieImei,
              articulo.valor || 0,
              getCleanValue(articulo.estado),
              getCleanValue(articulo.observaciones, 'Sin observaciones'),
              getSedeName(articulo.sede_id)
            ];
          })
        ];
        
        const articulosSheet = XLSX.utils.aoa_to_sheet(articulosData);
        
        // Aplicar estilos
        const range = XLSX.utils.decode_range(articulosSheet['!ref']);
        applyHeaderStyles(articulosSheet, range);
        
        // Ajustar ancho de columnas
        articulosSheet['!cols'] = [
          { width: 25 }, // Descripción
          { width: 15 }, // Tipo
          { width: 15 }, // Marca
          { width: 15 }, // Modelo
          { width: 15 }, // Serie/IMEI
          { width: 15 }, // Valor
          { width: 12 }, // Estado
          { width: 25 }, // Observaciones
          { width: 15 }  // Sede
        ];
        
        XLSX.utils.book_append_sheet(workbook, articulosSheet, 'Artículos Detalle');
      }

    } else if (reportData.tipo === 'vehiculos') {
      // Reporte detallado de vehículos vendidos
      const vehiculosData = [
        ...reportInfo,
        ['ANÁLISIS DETALLADO DE VEHÍCULOS VENDIDOS'],
        [],
        ['RESUMEN EJECUTIVO'],
        [],
        ['Métrica', 'Valor'],
        ['Total Vehículos Vendidos', reportData.resumen.totalVendidos],
        ['Valor Total de Ventas', reportData.resumen.valorTotalVentas],
        ['Costo Total de Compras', reportData.resumen.valorTotalCompras],
        ['Ganancia Bruta Total', reportData.resumen.valorTotalVentas - reportData.resumen.valorTotalCompras],
        ['Margen Promedio', reportData.resumen.valorTotalVentas > 0 ? `${(((reportData.resumen.valorTotalVentas - reportData.resumen.valorTotalCompras) / reportData.resumen.valorTotalVentas) * 100).toFixed(2)}%` : '0%'],
        ['Ticket Promedio', reportData.resumen.totalVendidos > 0 ? (reportData.resumen.valorTotalVentas / reportData.resumen.totalVendidos).toFixed(0) : 0],
        [],
        ['DETALLE DE VENTAS'],
        [],
        ['Marca/Modelo', 'Placa', 'Año', 'Color', 'Precio Compra', 'Precio Venta', 'Ganancia', 'Margen %', 'Sede', 'Días en Stock'],
        ...reportData.detalles.map(vehiculo => {
          const ganancia = (vehiculo.precio_venta || 0) - (vehiculo.precio_compra || 0);
          const margen = vehiculo.precio_venta ? ((ganancia / vehiculo.precio_venta) * 100).toFixed(2) : 0;
          const diasStock = getCleanDays(vehiculo.fecha_ingreso);
          const marcaModelo = formatCleanText(vehiculo.marca, vehiculo.modelo);
          return [
            marcaModelo || 'Vehículo sin especificar',
            getCleanValue(vehiculo.placa),
            getCleanValue(vehiculo.año),
            getCleanValue(vehiculo.color),
            vehiculo.precio_compra || 0,
            vehiculo.precio_venta || 0,
            ganancia,
            `${margen}%`,
            getSedeName(vehiculo.sede_id),
            diasStock || ''
          ];
        })
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(vehiculosData);
      
      // Aplicar estilos
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      applyHeaderStyles(worksheet, range);
      
      // Ajustar ancho de columnas
      worksheet['!cols'] = [
        { width: 20 }, // Marca/Modelo
        { width: 12 }, // Placa
        { width: 8 },  // Año
        { width: 12 }, // Color
        { width: 15 }, // Precio Compra
        { width: 15 }, // Precio Venta
        { width: 15 }, // Ganancia
        { width: 12 }, // Margen %
        { width: 15 }, // Sede
        { width: 12 }  // Días en Stock
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehículos Vendidos');

    } else if (reportData.tipo === 'ganancias') {
      // Reporte detallado de ganancias
      const gananciasData = [
        ...reportInfo,
        ['ANÁLISIS FINANCIERO DETALLADO'],
        [],
        ['ESTADO DE RESULTADOS SIMPLIFICADO'],
        [],
        ['Concepto', 'Valor (COP)', 'Porcentaje'],
        ['INGRESOS'],
        ['Ventas de Vehículos', reportData.detalles.vehiculosVendidos ? reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + (v.precio_venta || 0), 0) : 0, ''],
        ['Ventas de Artículos', reportData.detalles.articulosVendidos ? reportData.detalles.articulosVendidos.reduce((sum, a) => sum + (a.valor || 0), 0) : 0, ''],
        ['Total Ingresos', reportData.resumen.ingresosTotales, '100%'],
        [],
        ['COSTOS DIRECTOS'],
        ['Costo Vehículos Vendidos', reportData.detalles.vehiculosVendidos ? reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + (v.precio_compra || 0), 0) : 0, reportData.resumen.ingresosTotales > 0 ? `${((reportData.detalles.vehiculosVendidos ? reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + (v.precio_compra || 0), 0) : 0) / reportData.resumen.ingresosTotales * 100).toFixed(2)}%` : '0%'],
        ['Costo Artículos Vendidos', 0, '0%'],
        [],
        ['GASTOS OPERATIVOS'],
        ['Mantenimientos', reportData.resumen.costosTotales - (reportData.detalles.vehiculosVendidos ? reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + (v.precio_compra || 0), 0) : 0), reportData.resumen.ingresosTotales > 0 ? `${(((reportData.resumen.costosTotales - (reportData.detalles.vehiculosVendidos ? reportData.detalles.vehiculosVendidos.reduce((sum, v) => sum + (v.precio_compra || 0), 0) : 0)) / reportData.resumen.ingresosTotales) * 100).toFixed(2)}%` : '0%'],
        ['Total Costos y Gastos', reportData.resumen.costosTotales, reportData.resumen.ingresosTotales > 0 ? `${((reportData.resumen.costosTotales / reportData.resumen.ingresosTotales) * 100).toFixed(2)}%` : '0%'],
        [],
        ['RESULTADOS'],
        ['Ganancia Bruta', reportData.resumen.gananciaBruta, reportData.resumen.ingresosTotales > 0 ? `${((reportData.resumen.gananciaBruta / reportData.resumen.ingresosTotales) * 100).toFixed(2)}%` : '0%'],
        ['Ganancia Neta', reportData.resumen.gananciaNeta, reportData.resumen.ingresosTotales > 0 ? `${((reportData.resumen.gananciaNeta / reportData.resumen.ingresosTotales) * 100).toFixed(2)}%` : '0%']
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(gananciasData);
      
      // Aplicar estilos
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      applyHeaderStyles(worksheet, range);
      
      // Ajustar ancho de columnas
      worksheet['!cols'] = [
        { width: 25 }, // Concepto
        { width: 20 }, // Valor (COP)
        { width: 15 }  // Porcentaje
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Análisis Ganancias');

    } else if (reportData.tipo === 'empenos') {
      // Reporte detallado de empeños
      const empenosData = [
        ...reportInfo,
        ['ANÁLISIS DETALLADO DE EMPEÑOS ACTIVOS'],
        [],
        ['RESUMEN EJECUTIVO'],
        [],
        ['Métrica', 'Cantidad', 'Valor'],
        ['Vehículos en Empeño', reportData.resumen.vehiculosEnEmpeno, 0],
        ['Artículos en Empeño', reportData.resumen.articulosEnEmpeno, 0],
        ['Valor Total Empeños', '', reportData.resumen.valorTotalEmpenos],
        [],
        ['DETALLE DE VEHÍCULOS EN EMPEÑO'],
        [],
        ['Marca/Modelo', 'Placa', 'Año', 'Color', 'Valor Empeño', 'Sede', 'Días en Empeño'],
        ...(reportData.detalles.vehiculos || []).map(vehiculo => {
          const diasEmpeno = getCleanDays(vehiculo.fecha_ingreso);
          const marcaModelo = formatCleanText(vehiculo.marca, vehiculo.modelo);
          return [
            marcaModelo || 'Vehículo sin especificar',
            getCleanValue(vehiculo.placa),
            getCleanValue(vehiculo.año),
            getCleanValue(vehiculo.color),
            vehiculo.precio_compra || 0, // Para empeños, el valor está en precio_compra
            getSedeName(vehiculo.sede_id),
            diasEmpeno || ''
          ];
        }),
        [],
        ['DETALLE DE ARTÍCULOS EN EMPEÑO'],
        [],
        ['Descripción', 'Tipo', 'Valor', 'Fecha Ingreso', 'Sede', 'Días en Empeño'],
        ...(reportData.detalles.articulos || []).map(articulo => {
          const diasEmpeno = getCleanDays(articulo.fecha_ingreso);
          return [
            getCleanValue(articulo.descripcion),
            getCleanValue(articulo.tipo),
            articulo.valor || 0,
            formatDate(articulo.fecha_ingreso),
            getSedeName(articulo.sede_id),
            diasEmpeno || ''
          ];
        })
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(empenosData);
      
      // Aplicar estilos
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      applyHeaderStyles(worksheet, range);
      
      // Ajustar ancho de columnas
      worksheet['!cols'] = [
        { width: 20 }, // Marca/Modelo o Descripción
        { width: 12 }, // Placa o Tipo
        { width: 8 },  // Año o Valor
        { width: 12 }, // Color o Fecha Ingreso
        { width: 15 }, // Valor Empeño o Sede
        { width: 15 }, // Sede o Días en Empeño
        { width: 12 }  // Días en Empeño
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empeños Activos');
    }

    // Generar y descargar el archivo Excel
    const fileName = `reporte_${filters.tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaChartBar className="me-2" />
          Reportes y Análisis
        </h2>
        {reportData && (
          <Button variant="success" onClick={exportToExcel}>
            <FaDownload className="me-2" />
            Exportar Excel
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <FaFilter className="me-2" />
            Filtros de Reporte
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Reporte</Form.Label>
                <Form.Select
                  name="tipoReporte"
                  value={filters.tipoReporte}
                  onChange={handleFilterChange}
                >
                  {tiposReporte.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Sede</Form.Label>
                <Form.Select
                  name="sedeId"
                  value={filters.sedeId}
                  onChange={handleFilterChange}
                >
                  <option value="">Todas las sedes</option>
                  {sedes.map(sede => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Inicio</Form.Label>
                <Form.Control
                  type="date"
                  name="fechaInicio"
                  value={filters.fechaInicio}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Fin</Form.Label>
                <Form.Control
                  type="date"
                  name="fechaFin"
                  value={filters.fechaFin}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>&nbsp;</Form.Label>
                <div>
                  <Button
                    variant="primary"
                    onClick={generateReport}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Generando...
                      </>
                    ) : (
                      'Generar Reporte'
                    )}
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Resultados del reporte */}
      {reportData && (
        <>
          {/* Resumen */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Resumen del Reporte</h5>
              <small className="text-muted">
                {tiposReporte.find(t => t.value === filters.tipoReporte)?.label} - 
                {getSedeName(parseInt(filters.sedeId))} - 
                {formatDate(filters.fechaInicio)} a {formatDate(filters.fechaFin)}
              </small>
            </Card.Header>
            <Card.Body>
              {reportData.tipo === 'general' && (
                <Row>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-primary">{reportData.resumen.totalVehiculos}</h4>
                      <p className="text-muted mb-0">Total Vehículos</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-success">{reportData.resumen.vehiculosVendidos}</h4>
                      <p className="text-muted mb-0">Vehículos Vendidos</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-info">{formatCurrency(reportData.resumen.valorInventarioTotal)}</h4>
                      <p className="text-muted mb-0">Inventario</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-warning">{formatCurrency(reportData.resumen.gananciaNeta)}</h4>
                      <p className="text-muted mb-0">Ganancia Neta</p>
                    </div>
                  </Col>
                </Row>
              )}

              {reportData.tipo === 'vehiculos' && (
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-primary">{reportData.resumen.totalVendidos}</h4>
                      <p className="text-muted mb-0">Vehículos Vendidos</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-success">{formatCurrency(reportData.resumen.valorTotalVentas)}</h4>
                      <p className="text-muted mb-0">Total Ventas</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-info">{formatCurrency(reportData.resumen.valorTotalVentas - reportData.resumen.valorTotalCompras)}</h4>
                      <p className="text-muted mb-0">Ganancia Bruta</p>
                    </div>
                  </Col>
                </Row>
              )}

              {reportData.tipo === 'inventario' && (
                <Row>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-primary">{reportData.resumen.vehiculosDisponibles}</h4>
                      <p className="text-muted mb-0">Vehículos Disponibles</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-info">{reportData.resumen.articulosDisponibles}</h4>
                      <p className="text-muted mb-0">Artículos Disponibles</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-success">{formatCurrency(reportData.resumen.valorVehiculos)}</h4>
                      <p className="text-muted mb-0">Valor Vehículos</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-warning">{formatCurrency(reportData.resumen.valorArticulos)}</h4>
                      <p className="text-muted mb-0">Valor Artículos</p>
                    </div>
                  </Col>
                </Row>
              )}

              {reportData.tipo === 'ganancias' && (
                <Row>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-success">{formatCurrency(reportData.resumen.ingresosTotales)}</h4>
                      <p className="text-muted mb-0">Ingresos Totales</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-danger">{formatCurrency(reportData.resumen.costosTotales)}</h4>
                      <p className="text-muted mb-0">Costos Totales</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-info">{formatCurrency(reportData.resumen.gananciaBruta)}</h4>
                      <p className="text-muted mb-0">Ganancia Bruta</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h4 className="text-warning">{formatCurrency(reportData.resumen.gananciaNeta)}</h4>
                      <p className="text-muted mb-0">Ganancia Neta</p>
                    </div>
                  </Col>
                </Row>
              )}

              {reportData.tipo === 'empenos' && (
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-primary">{reportData.resumen.vehiculosEnEmpeno}</h4>
                      <p className="text-muted mb-0">Vehículos en Empeño</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-info">{reportData.resumen.articulosEnEmpeno}</h4>
                      <p className="text-muted mb-0">Artículos en Empeño</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-warning">{formatCurrency(reportData.resumen.valorTotalEmpenos)}</h4>
                      <p className="text-muted mb-0">Valor Total Empeños</p>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Detalles */}
          {reportData.detalles && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Detalles</h5>
              </Card.Header>
              <Card.Body>
                {reportData.tipo === 'vehiculos' && reportData.detalles.length > 0 && (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Marca/Modelo</th>
                        <th>Placa</th>
                        <th>Precio Compra</th>
                        <th>Precio Venta</th>
                        <th>Ganancia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.detalles.map((vehiculo, index) => {
                        const marcaModelo = formatCleanText(vehiculo.marca, vehiculo.modelo);
                        return (
                          <tr key={index}>
                            <td>{marcaModelo || 'Vehículo sin especificar'}</td>
                            <td>{getCleanValue(vehiculo.placa)}</td>
                            <td>{formatCurrency(vehiculo.precio_compra)}</td>
                            <td>{formatCurrency(vehiculo.precio_venta)}</td>
                            <td className="text-success">
                              {formatCurrency((vehiculo.precio_venta || 0) - (vehiculo.precio_compra || 0))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}

                {reportData.tipo === 'inventario' && (
                  <>
                    {reportData.detalles.vehiculos && reportData.detalles.vehiculos.length > 0 && (
                      <>
                        <h6 className="mb-3">Vehículos Disponibles</h6>
                        <Table responsive hover className="mb-4">
                          <thead>
                            <tr>
                              <th>Marca/Modelo</th>
                              <th>Placa</th>
                              <th>Año</th>
                              <th>Color</th>
                              <th>Precio Compra</th>
                              <th>Precio Venta</th>
                              <th>Sede</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.detalles.vehiculos.map((vehiculo, index) => {
                              const marcaModelo = formatCleanText(vehiculo.marca, vehiculo.modelo);
                              return (
                                <tr key={index}>
                                  <td>{marcaModelo || 'Vehículo sin especificar'}</td>
                                  <td>{getCleanValue(vehiculo.placa)}</td>
                                  <td>{getCleanValue(vehiculo.año)}</td>
                                  <td>{getCleanValue(vehiculo.color)}</td>
                                  <td>{formatCurrency(vehiculo.precio_compra)}</td>
                                  <td className="text-success">{formatCurrency(vehiculo.precio_venta)}</td>
                                  <td>{getSedeName(vehiculo.sede_id)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </>
                    )}

                    {reportData.detalles.articulos && reportData.detalles.articulos.length > 0 && (
                      <>
                        <h6 className="mb-3">Artículos Disponibles</h6>
                        <Table responsive hover>
                          <thead>
                            <tr>
                              <th>Descripción</th>
                              <th>Tipo</th>
                              <th>Valor</th>
                              <th>Fecha Ingreso</th>
                              <th>Sede</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.detalles.articulos.map((articulo, index) => (
                              <tr key={index}>
                                <td>{getCleanValue(articulo.descripcion)}</td>
                                <td>
                                  {getCleanValue(articulo.tipo) && (
                                    <Badge bg="info">
                                      {articulo.tipo}
                                    </Badge>
                                  )}
                                </td>
                                <td className="text-success">{formatCurrency(articulo.valor)}</td>
                                <td>{formatDate(articulo.fecha_ingreso)}</td>
                                <td>{getSedeName(articulo.sede_id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    )}
                  </>
                )}

                {reportData.detalles && 
                 ((Array.isArray(reportData.detalles) && reportData.detalles.length === 0) ||
                  (reportData.tipo === 'inventario' && 
                   reportData.detalles.vehiculos && reportData.detalles.articulos &&
                   reportData.detalles.vehiculos.length === 0 && 
                   reportData.detalles.articulos.length === 0)) && (
                  <div className="text-center py-4">
                    <p className="text-muted">No hay datos para mostrar en el período seleccionado</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {!reportData && !loading && (
        <Card>
          <Card.Body className="text-center py-5">
            <FaChartBar size={48} className="text-muted mb-3" />
            <h5 className="text-muted">Selecciona los filtros y genera un reporte</h5>
            <p className="text-muted">
              Los reportes te ayudarán a analizar el rendimiento del negocio y tomar decisiones informadas.
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Reportes;
