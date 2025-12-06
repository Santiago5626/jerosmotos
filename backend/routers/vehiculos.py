from fastapi import APIRouter, HTTPException, Depends, status, Query, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime
import base64
from database import database
from models import vehiculos, vehiculos_media, transacciones, EstadoVehiculoEnum, TipoTransaccionEnum

router = APIRouter()

class VehiculoBase(BaseModel):
    marca: Optional[str] = None
    modelo: Optional[str] = None
    placa: Optional[str] = None
    cilindraje: Optional[str] = None
    color: Optional[str] = None
    precio_compra: Optional[float] = None
    precio_venta: Optional[float] = None
    soat_vencimiento: Optional[date] = None
    tecno_vencimiento: Optional[date] = None
    sede_id: Optional[int] = None
    estado: Optional[EstadoVehiculoEnum] = EstadoVehiculoEnum.disponible
    visible_catalogo: Optional[bool] = True

class VehiculoCreate(VehiculoBase):
    pass

class VehiculoUpdate(VehiculoBase):
    pass

class VehiculoOut(VehiculoBase):
    id: int
    destacado: Optional[bool] = False

class MediaOut(BaseModel):
    id: int
    vehiculo_id: int
    archivo: str
    archivo_data: Optional[str] = None
    tipo: str  # 'imagen' o 'video'
    es_principal: bool
    titulo: Optional[str] = None
    orden: int

# Mantener compatibilidad con ImagenOut
class ImagenOut(BaseModel):
    id: int
    vehiculo_id: int
    imagen: str
    imagen_data: Optional[str] = None
    es_principal: bool

@router.post("/", response_model=VehiculoOut, status_code=status.HTTP_201_CREATED)
async def create_vehiculo(vehiculo: VehiculoCreate):
    try:
        query = vehiculos.insert().values(**vehiculo.dict())
        vehiculo_id = await database.execute(query)
        return {**vehiculo.dict(), "id": vehiculo_id}
    except Exception as e:
        if "Duplicate entry" in str(e) and "placa" in str(e):
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe un vehículo con la placa '{vehiculo.placa}'"
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Error al crear el vehículo: {str(e)}"
            )

@router.get("/", response_model=List[VehiculoOut])
async def read_vehiculos(
    sede_id: Optional[int] = Query(None),
    estado: Optional[EstadoVehiculoEnum] = Query(None)
):
    query = vehiculos.select()
    if sede_id is not None:
        query = query.where(vehiculos.c.sede_id == sede_id)
    if estado is not None:
        query = query.where(vehiculos.c.estado == estado)
    result = await database.fetch_all(query)
    return result

@router.get("/{vehiculo_id}", response_model=VehiculoOut)
async def read_vehiculo(vehiculo_id: int):
    query = vehiculos.select().where(vehiculos.c.id == vehiculo_id)
    vehiculo = await database.fetch_one(query)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo

@router.put("/{vehiculo_id}", response_model=VehiculoOut)
async def update_vehiculo(vehiculo_id: int, vehiculo: VehiculoUpdate):
    query = vehiculos.update().where(vehiculos.c.id == vehiculo_id).values(**vehiculo.dict(exclude_unset=True))
    await database.execute(query)
    updated = await database.fetch_one(vehiculos.select().where(vehiculos.c.id == vehiculo_id))
    if updated is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return updated

@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehiculo(vehiculo_id: int):
    query = vehiculos.delete().where(vehiculos.c.id == vehiculo_id)
    await database.execute(query)
    return

# Endpoint específico para obtener vehículos visibles en el catálogo público
@router.get("/catalogo/publico", response_model=List[VehiculoOut])
async def get_vehiculos_catalogo_publico():
    """
    Obtiene solo los vehículos que están disponibles y visibles en el catálogo público
    """
    query = vehiculos.select().where(
        (vehiculos.c.estado == EstadoVehiculoEnum.disponible) &
        (vehiculos.c.visible_catalogo == 1)
    )
    result = await database.fetch_all(query)
    return result

# Endpoint para destacar/quitar destacado
@router.patch("/{vehiculo_id}/destacar", response_model=VehiculoOut)
async def toggle_destacado_vehiculo(vehiculo_id: int):
    # Verificar que el vehículo existe
    vehiculo_query = vehiculos.select().where(vehiculos.c.id == vehiculo_id)
    vehiculo = await database.fetch_one(vehiculo_query)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    # Si se va a destacar, verificar que no haya más de 6 destacados
    if not vehiculo.destacado:
        count_query = vehiculos.select().where(vehiculos.c.destacado == 1)
        destacados = await database.fetch_all(count_query)
        if len(destacados) >= 6:
            raise HTTPException(
                status_code=400, 
                detail="No se pueden destacar más de 6 vehículos. Quita el destacado de otro vehículo primero."
            )
    
    # Cambiar el estado de destacado
    nuevo_destacado = 0 if vehiculo.destacado else 1
    update_query = vehiculos.update().where(vehiculos.c.id == vehiculo_id).values(destacado=nuevo_destacado)
    await database.execute(update_query)
    
    # Obtener el vehículo actualizado
    updated = await database.fetch_one(vehiculos.select().where(vehiculos.c.id == vehiculo_id))
    return updated

# Endpoint para cambiar visibilidad en catálogo
@router.patch("/{vehiculo_id}/visibilidad", response_model=VehiculoOut)
async def toggle_visibilidad_catalogo(vehiculo_id: int):
    """
    Cambia la visibilidad del vehículo en el catálogo público
    """
    # Verificar que el vehículo existe
    vehiculo_query = vehiculos.select().where(vehiculos.c.id == vehiculo_id)
    vehiculo = await database.fetch_one(vehiculo_query)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    # Cambiar el estado de visibilidad
    nueva_visibilidad = 0 if vehiculo.visible_catalogo else 1
    update_query = vehiculos.update().where(vehiculos.c.id == vehiculo_id).values(visible_catalogo=nueva_visibilidad)
    await database.execute(update_query)
    
    # Obtener el vehículo actualizado
    updated = await database.fetch_one(vehiculos.select().where(vehiculos.c.id == vehiculo_id))
    return updated

# Endpoints para media (imágenes y videos)
@router.post("/{vehiculo_id}/media", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_media_vehiculo(
    vehiculo_id: int,
    archivo: UploadFile = File(...),
    es_principal: bool = Form(False),
    titulo: Optional[str] = Form(None),
    orden: int = Form(0)
):
    # Verificar que el vehículo existe
    vehiculo_query = vehiculos.select().where(vehiculos.c.id == vehiculo_id)
    vehiculo = await database.fetch_one(vehiculo_query)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    # Determinar el tipo de archivo
    content_type = archivo.content_type
    if content_type.startswith('image/'):
        tipo = 'imagen'
    elif content_type.startswith('video/'):
        tipo = 'video'
    else:
        raise HTTPException(status_code=400, detail="Tipo de archivo no soportado. Solo se permiten imágenes y videos.")
    
    # Leer y convertir archivo a base64
    archivo_data = await archivo.read()
    archivo_base64 = base64.b64encode(archivo_data).decode('utf-8')
    
    # Si es principal, desmarcar otros archivos principales del mismo vehículo
    if es_principal:
        update_query = vehiculos_media.update().where(
            vehiculos_media.c.vehiculo_id == vehiculo_id
        ).values(es_principal=0)
        await database.execute(update_query)
    else:
        # Si no se especifica como principal, verificar si es el primer archivo
        count_query = vehiculos_media.select().where(vehiculos_media.c.vehiculo_id == vehiculo_id)
        existing_media = await database.fetch_all(count_query)
        if len(existing_media) == 0:
            es_principal = True  # Primer archivo es automáticamente principal
    
    # Insertar nuevo archivo
    query = vehiculos_media.insert().values(
        vehiculo_id=vehiculo_id,
        archivo=archivo.filename,
        archivo_data=archivo_base64,
        tipo=tipo,
        es_principal=1 if es_principal else 0,
        titulo=titulo,
        orden=orden
    )
    media_id = await database.execute(query)
    
    return {
        "id": media_id,
        "vehiculo_id": vehiculo_id,
        "archivo": archivo.filename,
        "tipo": tipo,
        "es_principal": es_principal,
        "titulo": titulo,
        "orden": orden
    }

@router.get("/{vehiculo_id}/media", response_model=List[MediaOut])
async def get_media_vehiculo(vehiculo_id: int, tipo: Optional[str] = Query(None)):
    query = vehiculos_media.select().where(vehiculos_media.c.vehiculo_id == vehiculo_id)
    if tipo:
        query = query.where(vehiculos_media.c.tipo == tipo)
    query = query.order_by(vehiculos_media.c.orden, vehiculos_media.c.id)
    
    result = await database.fetch_all(query)
    
    # Convertir el resultado
    media_list = []
    for row in result:
        media_list.append({
            "id": row.id,
            "vehiculo_id": row.vehiculo_id,
            "archivo": row.archivo,
            "archivo_data": row.archivo_data,
            "tipo": row.tipo,
            "es_principal": bool(row.es_principal),
            "titulo": row.titulo,
            "orden": row.orden
        })
    
    return media_list

# Mantener compatibilidad con endpoints de imágenes
@router.post("/{vehiculo_id}/imagenes", response_model=ImagenOut, status_code=status.HTTP_201_CREATED)
async def upload_imagen_vehiculo(
    vehiculo_id: int,
    imagen: UploadFile = File(...),
    es_principal: bool = Form(False)
):
    # Verificar que sea una imagen
    if not imagen.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
    
    # Usar el endpoint de media
    media_result = await upload_media_vehiculo(vehiculo_id, imagen, es_principal, None, 0)
    
    return {
        "id": media_result["id"],
        "vehiculo_id": media_result["vehiculo_id"],
        "imagen": media_result["archivo"],
        "imagen_data": None,  # No incluir datos por compatibilidad
        "es_principal": media_result["es_principal"]
    }

@router.get("/{vehiculo_id}/imagenes", response_model=List[ImagenOut])
async def get_imagenes_vehiculo(vehiculo_id: int):
    # Obtener solo imágenes
    media_list = await get_media_vehiculo(vehiculo_id, "imagen")
    
    # Convertir a formato ImagenOut
    imagenes = []
    for media in media_list:
        imagenes.append({
            "id": media["id"],
            "vehiculo_id": media["vehiculo_id"],
            "imagen": media["archivo"],
            "imagen_data": media["archivo_data"],
            "es_principal": media["es_principal"]
        })
    
    return imagenes

# Endpoints específicos para videos
@router.post("/{vehiculo_id}/videos", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_video_vehiculo(
    vehiculo_id: int,
    video: UploadFile = File(...),
    titulo: Optional[str] = Form(None),
    orden: int = Form(0)
):
    # Verificar que sea un video
    if not video.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de video")
    
    # Usar el endpoint de media
    return await upload_media_vehiculo(vehiculo_id, video, False, titulo, orden)

@router.get("/{vehiculo_id}/videos", response_model=List[MediaOut])
async def get_videos_vehiculo(vehiculo_id: int):
    return await get_media_vehiculo(vehiculo_id, "video")

@router.delete("/{vehiculo_id}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media_vehiculo(vehiculo_id: int, media_id: int):
    query = vehiculos_media.delete().where(
        (vehiculos_media.c.id == media_id) & 
        (vehiculos_media.c.vehiculo_id == vehiculo_id)
    )
    await database.execute(query)
    return

# Mantener compatibilidad con endpoint de eliminación de imágenes
@router.delete("/{vehiculo_id}/imagenes/{imagen_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_imagen_vehiculo(vehiculo_id: int, imagen_id: int):
    return await delete_media_vehiculo(vehiculo_id, imagen_id)

# Modelos para empeños de vehículos
class VehiculoEmpenoCreate(BaseModel):
    valor_empeno: float
    interes_porcentaje: float = 0.0
    cliente_nombre: str
    cliente_telefono: Optional[str] = None
    cliente_documento: Optional[str] = None
    usuario_id: int
    sede_id: int
    observaciones: Optional[str] = None

class VehiculoEmpenoOut(BaseModel):
    id: int
    vehiculo_id: int
    valor_empeno: float
    interes_porcentaje: float
    fecha_empeno: date
    cliente_nombre: str
    cliente_telefono: Optional[str] = None
    cliente_documento: Optional[str] = None
    valor_actual: float
    meses_transcurridos: int
    interes_acumulado: float

def calcular_interes_vehiculo(fecha_empeno: date, valor_empeno: float, interes_porcentaje: float):
    """Calcula el interés acumulado de un vehículo empeñado"""
    if interes_porcentaje <= 0:
        return 0, 0, valor_empeno
    
    fecha_actual = datetime.now().date()
    dias_transcurridos = (fecha_actual - fecha_empeno).days
    
    # Calcular meses (cada 32 días = 1 mes), mínimo 1 mes
    meses_transcurridos = max(1, dias_transcurridos // 32)
    
    # Calcular interés acumulado
    interes_acumulado = valor_empeno * (interes_porcentaje / 100) * meses_transcurridos
    valor_actual = valor_empeno + interes_acumulado
    
    return meses_transcurridos, interes_acumulado, valor_actual

# Endpoint para empeñar un vehículo
@router.post("/{vehiculo_id}/empenar", response_model=dict)
async def empenar_vehiculo(vehiculo_id: int, empeno_data: VehiculoEmpenoCreate):
    # Verificar que el vehículo existe y está disponible
    vehiculo_query = vehiculos.select().where(vehiculos.c.id == vehiculo_id)
    vehiculo = await database.fetch_one(vehiculo_query)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    if vehiculo.estado != EstadoVehiculoEnum.disponible:
        raise HTTPException(
            status_code=400, 
            detail=f"El vehículo no está disponible para empeño. Estado actual: {vehiculo.estado}"
        )
    
    try:
        # Actualizar el vehículo con los datos del empeño
        fecha_empeno = datetime.now().date()
        update_vehiculo_query = vehiculos.update().where(vehiculos.c.id == vehiculo_id).values(
            estado=EstadoVehiculoEnum.empeño,
            fecha_empeno=fecha_empeno,
            valor_empeno=empeno_data.valor_empeno,
            interes_porcentaje=empeno_data.interes_porcentaje,
            cliente_empeno_nombre=empeno_data.cliente_nombre,
            cliente_empeno_telefono=empeno_data.cliente_telefono,
            cliente_empeno_documento=empeno_data.cliente_documento
        )
        await database.execute(update_vehiculo_query)
        
        # Crear la transacción
        transaccion_query = transacciones.insert().values(
            tipo=TipoTransaccionEnum.empeño_vehiculo,
            vehiculo_id=vehiculo_id,
            usuario_id=empeno_data.usuario_id,
            sede_id=empeno_data.sede_id,
            precio_venta=empeno_data.valor_empeno,  # En empeños, precio_venta es el valor prestado
            precio_compra=vehiculo.precio_compra,
            ganancia=0,  # En empeños no hay ganancia inmediata
            cliente_nombre=empeno_data.cliente_nombre,
            cliente_telefono=empeno_data.cliente_telefono,
            cliente_documento=empeno_data.cliente_documento,
            observaciones=empeno_data.observaciones
        )
        transaccion_id = await database.execute(transaccion_query)
        
        return {
            "mensaje": "Vehículo empeñado exitosamente",
            "vehiculo_id": vehiculo_id,
            "transaccion_id": transaccion_id,
            "valor_empeno": empeno_data.valor_empeno,
            "fecha_empeno": fecha_empeno.isoformat(),
            "cliente": empeno_data.cliente_nombre
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al empeñar el vehículo: {str(e)}")

# Endpoint para obtener vehículos empeñados con cálculo de intereses
@router.get("/empenos/activos", response_model=List[dict])
async def get_vehiculos_empenos_activos():
    query = vehiculos.select().where(vehiculos.c.estado == EstadoVehiculoEnum.empeño)
    vehiculos_empeno = await database.fetch_all(query)
    
    result = []
    for vehiculo in vehiculos_empeno:
        if vehiculo.fecha_empeno and vehiculo.valor_empeno:
            meses_transcurridos, interes_acumulado, valor_actual = calcular_interes_vehiculo(
                vehiculo.fecha_empeno, 
                float(vehiculo.valor_empeno), 
                float(vehiculo.interes_porcentaje or 0)
            )
            
            result.append({
                "id": vehiculo.id,
                "marca": vehiculo.marca,
                "modelo": vehiculo.modelo,
                "placa": vehiculo.placa,
                "valor_empeno": float(vehiculo.valor_empeno),
                "interes_porcentaje": float(vehiculo.interes_porcentaje or 0),
                "fecha_empeno": vehiculo.fecha_empeno,
                "cliente_nombre": vehiculo.cliente_empeno_nombre,
                "cliente_telefono": vehiculo.cliente_empeno_telefono,
                "cliente_documento": vehiculo.cliente_empeno_documento,
                "meses_transcurridos": meses_transcurridos,
                "interes_acumulado": interes_acumulado,
                "valor_actual": valor_actual,
                "sede_id": vehiculo.sede_id
            })
    
    return result

# Endpoint para realizar abono a un vehículo empeñado
@router.patch("/{vehiculo_id}/abono")
async def realizar_abono_vehiculo(vehiculo_id: int, monto_abono: float = Query(...)):
    # Verificar que el vehículo existe y está empeñado
    vehiculo_query = vehiculos.select().where(vehiculos.c.id == vehiculo_id)
    vehiculo = await database.fetch_one(vehiculo_query)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    if vehiculo.estado != EstadoVehiculoEnum.empeño:
        raise HTTPException(status_code=400, detail="El vehículo no está en estado de empeño")
    
    if not vehiculo.fecha_empeno or not vehiculo.valor_empeno:
        raise HTTPException(status_code=400, detail="Datos de empeño incompletos")
    
    # Calcular valor actual con intereses
    meses_transcurridos, interes_acumulado, valor_actual = calcular_interes_vehiculo(
        vehiculo.fecha_empeno, 
        float(vehiculo.valor_empeno), 
        float(vehiculo.interes_porcentaje or 0)
    )
    
    if monto_abono <= 0:
        raise HTTPException(status_code=400, detail="El monto del abono debe ser mayor a 0")
    
    try:
        if monto_abono >= valor_actual:
            # Abono completo - recuperar vehículo
            cambio = monto_abono - valor_actual
            
            # Cambiar estado del vehículo a disponible y limpiar datos de empeño
            update_query = vehiculos.update().where(vehiculos.c.id == vehiculo_id).values(
                estado=EstadoVehiculoEnum.disponible,
                fecha_empeno=None,
                valor_empeno=None,
                interes_porcentaje=0.00,
                cliente_empeno_nombre=None,
                cliente_empeno_telefono=None,
                cliente_empeno_documento=None
            )
            await database.execute(update_query)
            
            mensaje = f"Vehículo recuperado exitosamente. Valor total: {valor_actual:,.0f}"
            if cambio > 0:
                mensaje += f". Cambio: {cambio:,.0f}"
        else:
            # Abono parcial - mantener en empeño
            mensaje = f"Abono parcial registrado. Pendiente: {valor_actual - monto_abono:,.0f}"
        
        return {
            "mensaje": mensaje,
            "monto_abono": monto_abono,
            "valor_actual": valor_actual,
            "interes_acumulado": interes_acumulado,
            "meses_transcurridos": meses_transcurridos,
            "cambio": max(0, monto_abono - valor_actual),
            "recuperado": monto_abono >= valor_actual
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el abono: {str(e)}")

# Endpoint para obtener un vehículo empeñado específico con cálculo de intereses
@router.get("/{vehiculo_id}/empeno", response_model=dict)
async def get_vehiculo_empeno(vehiculo_id: int):
    vehiculo_query = vehiculos.select().where(vehiculos.c.id == vehiculo_id)
    vehiculo = await database.fetch_one(vehiculo_query)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    if vehiculo.estado != EstadoVehiculoEnum.empeño:
        raise HTTPException(status_code=400, detail="El vehículo no está en estado de empeño")
    
    if not vehiculo.fecha_empeno or not vehiculo.valor_empeno:
        raise HTTPException(status_code=400, detail="Datos de empeño incompletos")
    
    meses_transcurridos, interes_acumulado, valor_actual = calcular_interes_vehiculo(
        vehiculo.fecha_empeno, 
        float(vehiculo.valor_empeno), 
        float(vehiculo.interes_porcentaje or 0)
    )
    
    return {
        "id": vehiculo.id,
        "marca": vehiculo.marca,
        "modelo": vehiculo.modelo,
        "placa": vehiculo.placa,
        "valor_empeno": float(vehiculo.valor_empeno),
        "interes_porcentaje": float(vehiculo.interes_porcentaje or 0),
        "fecha_empeno": vehiculo.fecha_empeno,
        "cliente_nombre": vehiculo.cliente_empeno_nombre,
        "cliente_telefono": vehiculo.cliente_empeno_telefono,
        "cliente_documento": vehiculo.cliente_empeno_documento,
        "meses_transcurridos": meses_transcurridos,
        "interes_acumulado": interes_acumulado,
        "valor_actual": valor_actual,
        "sede_id": vehiculo.sede_id
    }
