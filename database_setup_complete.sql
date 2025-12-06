-- Script completo para crear la base de datos JerosMotos
-- Basado en los modelos actuales de la aplicación

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS jerosmotos;
USE jerosmotos;

-- Tabla de sedes (debe crearse primero por las referencias)
CREATE TABLE sedes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(150),
    telefono VARCHAR(20)
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'vendedor') DEFAULT 'vendedor',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehículos (actualizada con todos los campos)
CREATE TABLE vehiculos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    marca VARCHAR(100),
    modelo VARCHAR(50),
    placa VARCHAR(20) UNIQUE,
    cilindraje VARCHAR(20),
    color VARCHAR(50),
    precio_compra DECIMAL(15,2),
    precio_venta DECIMAL(15,2),
    soat_vencimiento DATE,
    tecno_vencimiento DATE,
    sede_id INT,
    estado ENUM('disponible', 'vendido', 'empeño', 'baja') DEFAULT 'disponible',
    destacado TINYINT(1) DEFAULT 0,
    visible_catalogo TINYINT(1) DEFAULT 1,
    -- Campos para empeños de vehículos
    interes_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    fecha_empeno DATE,
    valor_empeno DECIMAL(15,2),
    cliente_empeno_nombre VARCHAR(100),
    cliente_empeno_telefono VARCHAR(20),
    cliente_empeno_documento VARCHAR(20),
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL
);

-- Tabla de media de vehículos (imágenes y videos)
CREATE TABLE vehiculos_media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehiculo_id INT NOT NULL,
    archivo VARCHAR(255) NOT NULL,
    archivo_data LONGTEXT,
    tipo VARCHAR(20) NOT NULL,
    es_principal TINYINT(1) DEFAULT 0,
    titulo VARCHAR(100),
    orden INT DEFAULT 0,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

-- Tabla de mantenimientos
CREATE TABLE mantenimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehiculo_id INT NOT NULL,
    fecha_servicio DATE,
    servicio VARCHAR(255),
    taller VARCHAR(100),
    costo DECIMAL(15,2),
    observaciones TEXT,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

-- Tabla de artículos de valor (actualizada con campos de empeño)
CREATE TABLE articulos_valor (
    id INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(255),
    valor DECIMAL(15,2),
    estado ENUM('empeño', 'vendido', 'disponible', 'recuperado') DEFAULT 'empeño',
    fecha_registro DATE,
    sede_id INT,
    interes_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    cliente_nombre VARCHAR(100),
    cliente_telefono VARCHAR(20),
    cliente_documento VARCHAR(20),
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL
);

-- Tabla de imágenes de artículos
CREATE TABLE articulos_imagenes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    articulo_id INT NOT NULL,
    imagen VARCHAR(255) NOT NULL,
    imagen_data LONGTEXT,
    es_principal TINYINT(1) DEFAULT 0,
    FOREIGN KEY (articulo_id) REFERENCES articulos_valor(id) ON DELETE CASCADE
);

-- Tabla de transacciones (actualizada con nuevo tipo)
CREATE TABLE transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('venta_vehiculo', 'venta_articulo', 'recuperacion_empeño', 'empeño_vehiculo') NOT NULL,
    vehiculo_id INT NULL,
    articulo_id INT NULL,
    usuario_id INT NOT NULL,
    sede_id INT NOT NULL,
    precio_venta DECIMAL(15,2) NOT NULL,
    precio_compra DECIMAL(15,2) NULL,
    ganancia DECIMAL(15,2) NULL,
    cliente_nombre VARCHAR(100) NULL,
    cliente_telefono VARCHAR(20) NULL,
    cliente_documento VARCHAR(20) NULL,
    observaciones TEXT NULL,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
    FOREIGN KEY (articulo_id) REFERENCES articulos_valor(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
);

-- Insertar datos iniciales básicos
INSERT INTO sedes (nombre, direccion, telefono) VALUES 
('Sede Principal', 'Dirección Principal', '123-456-7890');

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES 
('Administrador', 'admin@jerosmotos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9u2', 'administrador');
-- Contraseña: admin123

-- Índices adicionales para mejorar rendimiento
CREATE INDEX idx_vehiculos_estado ON vehiculos(estado);
CREATE INDEX idx_vehiculos_destacado ON vehiculos(destacado);
CREATE INDEX idx_vehiculos_visible_catalogo ON vehiculos(visible_catalogo);
CREATE INDEX idx_vehiculos_sede ON vehiculos(sede_id);
CREATE INDEX idx_articulos_estado ON articulos_valor(estado);
CREATE INDEX idx_articulos_sede ON articulos_valor(sede_id);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha_transaccion);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);
