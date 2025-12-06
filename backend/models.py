from sqlalchemy import Table, Column, Integer, String, Enum, Date, DECIMAL, ForeignKey, TIMESTAMP, Text
from sqlalchemy.sql import func
from database import metadata

import enum

class RolEnum(str, enum.Enum):
    administrador = "administrador"
    vendedor = "vendedor"

class EstadoVehiculoEnum(str, enum.Enum):
    disponible = "disponible"
    vendido = "vendido"
    empeño = "empeño"
    baja = "baja"

class EstadoArticuloEnum(str, enum.Enum):
    empeño = "empeño"
    vendido = "vendido"
    disponible = "disponible"
    recuperado = "recuperado"

class TipoTransaccionEnum(str, enum.Enum):
    venta_vehiculo = "venta_vehiculo"
    venta_articulo = "venta_articulo"
    recuperacion_empeño = "recuperacion_empeño"
    empeño_vehiculo = "empeño_vehiculo"

usuarios = Table(
    "usuarios",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("nombre", String(100), nullable=False),
    Column("correo", String(100), unique=True, nullable=False),
    Column("contrasena", String(255), nullable=False),
    Column("rol", Enum(RolEnum), default=RolEnum.vendedor),
    Column("fecha_creacion", TIMESTAMP, server_default=func.now()),
)

sedes = Table(
    "sedes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("nombre", String(100), nullable=False),
    Column("direccion", String(150)),
    Column("telefono", String(20)),
)

vehiculos = Table(
    "vehiculos",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("marca", String(100)),
    Column("modelo", String(50)),
    Column("placa", String(20), unique=True),
    Column("cilindraje", String(20)),
    Column("color", String(50)),
    Column("precio_compra", DECIMAL(15, 2)),
    Column("precio_venta", DECIMAL(15, 2)),
    Column("soat_vencimiento", Date),
    Column("tecno_vencimiento", Date),
    Column("sede_id", Integer, ForeignKey("sedes.id")),
    Column("estado", Enum(EstadoVehiculoEnum), default=EstadoVehiculoEnum.disponible),
    Column("destacado", Integer, default=0),  # 1 para destacado, 0 para no destacado
    Column("visible_catalogo", Integer, default=1),  # 1 para visible en catálogo, 0 para oculto
    # Campos para empeños de vehículos
    Column("interes_porcentaje", DECIMAL(5, 2), default=0.00),
    Column("fecha_empeno", Date),
    Column("valor_empeno", DECIMAL(15, 2)),
    Column("cliente_empeno_nombre", String(100)),
    Column("cliente_empeno_telefono", String(20)),
    Column("cliente_empeno_documento", String(20)),
)

mantenimientos = Table(
    "mantenimientos",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("vehiculo_id", Integer, ForeignKey("vehiculos.id")),
    Column("fecha_servicio", Date),
    Column("servicio", String(255)),
    Column("taller", String(100)),
    Column("costo", DECIMAL(15, 2)),
    Column("observaciones", Text),
)

articulos_valor = Table(
    "articulos_valor",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("descripcion", String(255)),
    Column("valor", DECIMAL(15, 2)),
    Column("estado", Enum(EstadoArticuloEnum), default=EstadoArticuloEnum.empeño),
    Column("fecha_registro", Date),
    Column("sede_id", Integer, ForeignKey("sedes.id")),
    Column("interes_porcentaje", DECIMAL(5, 2), default=0.00),
    Column("cliente_nombre", String(100)),
    Column("cliente_telefono", String(20)),
    Column("cliente_documento", String(20)),
)

vehiculos_media = Table(
    "vehiculos_media",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("vehiculo_id", Integer, ForeignKey("vehiculos.id")),
    Column("archivo", String(255), nullable=False),  # Ruta o nombre del archivo (imagen o video)
    Column("archivo_data", Text, nullable=True),  # Para almacenar archivo en base64 si se desea
    Column("tipo", String(20), nullable=False),  # 'imagen' o 'video'
    Column("es_principal", Integer, default=0),  # 1 para principal, 0 para secundaria
    Column("titulo", String(100), nullable=True),  # Título descriptivo (especialmente útil para videos)
    Column("orden", Integer, default=0),  # Orden de visualización
)

articulos_imagenes = Table(
    "articulos_imagenes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("articulo_id", Integer, ForeignKey("articulos_valor.id")),
    Column("imagen", String(255), nullable=False),  # Ruta o nombre del archivo de imagen
    Column("imagen_data", String, nullable=True),  # Para almacenar imagen en base64 o similar si se desea
    Column("es_principal", Integer, default=0),  # 1 para principal, 0 para secundaria
)

transacciones = Table(
    "transacciones",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("tipo", Enum(TipoTransaccionEnum), nullable=False),
    Column("vehiculo_id", Integer, ForeignKey("vehiculos.id"), nullable=True),
    Column("articulo_id", Integer, ForeignKey("articulos_valor.id"), nullable=True),
    Column("usuario_id", Integer, ForeignKey("usuarios.id"), nullable=False),
    Column("sede_id", Integer, ForeignKey("sedes.id"), nullable=False),
    Column("precio_venta", DECIMAL(15, 2), nullable=False),
    Column("precio_compra", DECIMAL(15, 2), nullable=True),
    Column("ganancia", DECIMAL(15, 2), nullable=True),
    Column("cliente_nombre", String(100), nullable=True),
    Column("cliente_telefono", String(20), nullable=True),
    Column("cliente_documento", String(20), nullable=True),
    Column("observaciones", Text, nullable=True),
    Column("fecha_transaccion", TIMESTAMP, server_default=func.now()),
)
