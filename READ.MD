# 🏍️ Jeros'Motos - Sistema Completo de Gestión

Sistema web completo para la gestión de inventario de vehículos, mantenimientos, artículos de valor y panel administrativo para Jeros'Motos.

## 🚀 Características Principales

### 🌐 Sitio Público
- Catálogo de vehículos disponibles
- Información de contacto y ubicación
- Diseño responsive y moderno
- Botón de WhatsApp integrado

### 🔐 Panel Administrativo
- **Dashboard** con estadísticas en tiempo real
- **Gestión de Sedes** (CRUD completo)
- **Inventario de Vehículos** con control de estados
- **Mantenimientos** y servicios
- **Artículos de Valor** para empeños
- **Gestión de Usuarios** con roles diferenciados
- **Reportes** y exportación de datos

## 🏗️ Arquitectura del Sistema

```
jerosmotos/
├── backend/                 # API FastAPI
│   ├── routers/            # Endpoints por módulo
│   ├── models.py           # Modelos de base de datos
│   ├── database.py         # Configuración de BD
│   ├── main.py            # Aplicación principal
│   └── requirements.txt    # Dependencias Python
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas principales
│   │   ├── context/       # Context API (Auth)
│   │   └── assets/        # Recursos estáticos
│   ├── public/
│   └── package.json       # Dependencias Node.js
└── README.md
```

## 💻 Tecnologías Utilizadas

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLite** - Base de datos relacional ligera
- **SQLAlchemy** - ORM para Python
- **JWT** - Autenticación con tokens
- **CORS** - Configuración para frontend

### Frontend
- **React** - Biblioteca de interfaz de usuario
- **React Router** - Navegación SPA
- **Bootstrap** - Framework CSS
- **Axios** - Cliente HTTP
- **Context API** - Gestión de estado global

## 🛠️ Instalación y Configuración

### 1. Configurar Base de Datos

> [!NOTE]
> La base de datos SQLite (`jerosmotos.db`) ya viene preconfigurada con los datos iniciales. No necesitas ejecutar queries SQL manualmente.

Si necesitas recrear la base de datos desde cero:
```bash
cd backend
python create_sqlite_db.py
```

### 2. Backend (FastAPI)
```bash
cd backend

# Activar entorno virtual (si existe)
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend (React)
```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm start
```

## 🗄️ Base de Datos (SQLite)

### Esquema de Base de Datos

La aplicación utiliza **SQLite** como base de datos. El archivo `jerosmotos.db` ya contiene:

- ✅ Todas las tablas creadas
- ✅ Datos iniciales (sede principal)
- ✅ Usuarios de prueba con contraseñas hasheadas

### Tablas Principales:

1. **usuarios** - Gestión de usuarios y roles
2. **sedes** - Ubicaciones de la empresa
3. **vehiculos** - Inventario de motocicletas
4. **mantenimientos** - Historial de servicios
5. **articulos_valor** - Control de empeños
6. **vehiculos_imagenes** - Galería de fotos
7. **transacciones** - Registro de operaciones financieras

### Recrear Base de Datos

Si necesitas crear la base de datos desde cero:

```bash
cd backend
python create_sqlite_db.py
```

Esto creará `jerosmotos.db` con todos los datos iniciales.

## 🔐 Credenciales de Acceso

### 👨‍💼 Administrador
- **Correo:** `admin@jerosmotos.com`
- **Contraseña:** `admin123`
- **Hash SHA256:** `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`
- **Permisos:** Acceso completo a todas las funcionalidades

### 👤 Vendedor
- **Correo:** `vendedor@jerosmotos.com`
- **Contraseña:** `vendedor123`
- **Hash SHA256:** `8d23cf6c86e834a7aa6eded54c26ce2bb2e74903538c61bdd5d2197997ab2f72`
- **Permisos:** Limitado a su sede asignada, sin acceso a usuarios y reportes

## 🎯 Cómo Usar el Sistema

### 1. Acceso al Sitio Público
- Ve a: `http://localhost:3000`
- Navega por el catálogo de vehículos
- Contacta vía WhatsApp o redes sociales

### 2. Acceso al Panel Administrativo
- En el sitio público, desplázate al footer
- Haz clic en **"Ingreso administrativo"**
- Usa las credenciales proporcionadas arriba
- Serás redirigido al dashboard correspondiente

### 3. Funcionalidades por Rol

#### 🔧 Administrador
- **Dashboard:** Estadísticas generales del negocio
- **Sedes:** Gestión completa de ubicaciones
- **Vehículos:** Control total del inventario
- **Mantenimientos:** Histórico y programación
- **Artículos de Valor:** Gestión de empeños
- **Usuarios:** Crear y gestionar cuentas
- **Reportes:** Análisis y exportación de datos

#### 👥 Vendedor
- **Dashboard:** Estadísticas de su sede
- **Vehículos:** Solo de su sede asignada
- **Mantenimientos:** Registro y consulta
- **Artículos de Valor:** Gestión de empeños

## 🚨 Solución de Problemas

### ❌ Error 401 (No autorizado)
**Causa más común:** Hashes de contraseña incorrectos en la base de datos.

**Solución:**
1. Recrea la base de datos ejecutando:
```bash
cd backend
python create_sqlite_db.py
```

2. Reinicia el servidor backend
3. Usa las credenciales exactas indicadas en este README

### ❌ Error de CORS
1. Asegúrate de que el backend incluya la configuración de CORS
2. Verifica que el frontend esté en `http://localhost:3000`
3. Reinicia ambos servidores

### ❌ Error con pydantic o dependencias
1. Reinstala las dependencias:
```bash
cd backend
.\venv\Scripts\python.exe -m pip install --upgrade --force-reinstall pydantic pydantic-core
```

### ❌ No aparece el botón administrativo
1. Verifica que el archivo `Footer.jsx` se haya actualizado
2. Reinicia el servidor frontend

## 📱 URLs del Sistema

- **Sitio Público:** http://localhost:3000
- **Panel Admin:** http://localhost:3000/login
- **API Backend:** http://localhost:8000
- **Documentación API:** http://localhost:8000/docs

## 🏢 Información de la Empresa

**Jeros'Motos**
- **Dirección:** Cl. 35 # 20A-63, Villavicencio, Meta, Colombia
- **Teléfono:** +57 311 225 6767
- **Especialidad:** Venta de motocicletas y servicios automotrices

## 👨‍💻 Desarrollo

**Desarrollado por:** Santiago Lobo  
**Tecnologías:** React 19 + FastAPI + SQLite  
**Año:** 2024-2025

---

## 🎉 ¡Sistema Listo para Producción!

El sistema está completamente funcional con todas las características solicitadas. 

### ⚠️ PASOS CRÍTICOS PARA FUNCIONAR:

1. ✅ **La base de datos SQLite ya está configurada** - No requiere instalación adicional
2. 🔧 **Instalar dependencias** del backend y frontend
3. ▶️ **Ejecutar ambos servidores** (backend en puerto 8000, frontend en puerto 3000)
4. 🔐 **Usar las credenciales exactas** proporcionadas en este README

Una vez completados estos pasos, el login funcionará correctamente y tendrás acceso completo al panel administrativo.

---

## 📊 Estado Actual

✅ **Backend**: Corriendo en http://127.0.0.1:8000  
✅ **Frontend**: Corriendo en http://localhost:3000  
✅ **Base de Datos**: SQLite (`jerosmotos.db`) configurada y funcionando  
✅ **Migración**: Completada desde PostgreSQL/MySQL a SQLite
