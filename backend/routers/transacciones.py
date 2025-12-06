from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from database import database
from models import transacciones, vehiculos, articulos_valor, TipoTransaccionEnum, EstadoVehiculoEnum, EstadoArticuloEnum
from routers.usuarios import get_current_user

router = APIRouter()

class TransaccionCreate(BaseModel):
    tipo: TipoTransaccionEnum
    vehiculo_id: Optional[int] = None
    articulo_id: Optional[int] = None
    precio_venta: float
    precio_compra: Optional[float] = None
    cliente_nombre: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cliente_documento: Optional[str] = None
    observaciones: Optional[str] = None

class TransaccionResponse(BaseModel):
    id: int
    tipo: str
    vehiculo_id: Optional[int]
    articulo_id: Optional[int]
    usuario_id: int
    sede_id: int
    precio_venta: float
    precio_compra: Optional[float]
    ganancia: Optional[float]
    cliente_nombre: Optional[str]
    cliente_telefono: Optional[str]
    cliente_documento: Optional[str]
    observaciones: Optional[str]
    fecha_transaccion: datetime
    # Información adicional
    vehiculo_info: Optional[str] = None
    articulo_info: Optional[str] = None
    usuario_nombre: Optional[str] = None

@router.post("/", response_model=dict)
async def crear_transaccion(transaccion: TransaccionCreate, current_user: dict = Depends(get_current_user)):
    # Validar que se proporcione vehiculo_id o articulo_id según el tipo
    if transaccion.tipo in ["venta_vehiculo"] and not transaccion.vehiculo_id:
        raise HTTPException(status_code=400, detail="vehiculo_id es requerido para ventas de vehículos")
    
    if transaccion.tipo in ["venta_articulo", "recuperacion_empeño"] and not transaccion.articulo_id:
        raise HTTPException(status_code=400, detail="articulo_id es requerido para transacciones de artículos")
    
    # Obtener información del vehículo o artículo
    sede_id = None
    precio_compra_real = transaccion.precio_compra
    
    if transaccion.vehiculo_id:
        # Verificar que el vehículo existe y obtener información
        vehiculo_query = vehiculos.select().where(vehiculos.c.id == transaccion.vehiculo_id)
        vehiculo_result = await database.fetch_one(vehiculo_query)
        
        if not vehiculo_result:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
        # Verificar que el vehículo esté disponible para venta
        if transaccion.tipo == "venta_vehiculo" and vehiculo_result["estado"] != "disponible":
            raise HTTPException(status_code=400, detail="El vehículo no está disponible para venta")
        
        sede_id = vehiculo_result["sede_id"]
        if not precio_compra_real:
            precio_compra_real = float(vehiculo_result["precio_compra"]) if vehiculo_result["precio_compra"] else 0
    
    if transaccion.articulo_id:
        # Verificar que el artículo existe y obtener información
        articulo_query = articulos_valor.select().where(articulos_valor.c.id == transaccion.articulo_id)
        articulo_result = await database.fetch_one(articulo_query)
        
        if not articulo_result:
            raise HTTPException(status_code=404, detail="Artículo no encontrado")
        
        # Validaciones específicas para recuperación de empeños
        if transaccion.tipo == "recuperacion_empeño":
            if articulo_result["estado"] != "empeño":
                raise HTTPException(status_code=400, detail="Solo se pueden recuperar artículos que estén en empeño")
            
            valor_articulo = float(articulo_result["valor"]) if articulo_result["valor"] else 0
            if transaccion.precio_venta < valor_articulo:
                raise HTTPException(
                    status_code=400, 
                    detail=f"El precio de recuperación (${transaccion.precio_venta:,.2f}) debe ser mayor o igual al valor del artículo (${valor_articulo:,.2f})"
                )
        
        # Validaciones para otras transacciones de artículos
        elif transaccion.tipo == "venta_articulo":
            if articulo_result["estado"] != "disponible":
                raise HTTPException(status_code=400, detail="Solo se pueden vender artículos disponibles")
        
        sede_id = articulo_result["sede_id"]
        if not precio_compra_real:
            precio_compra_real = float(articulo_result["valor"]) if articulo_result["valor"] else 0
    
    # Calcular ganancia
    ganancia = transaccion.precio_venta - (precio_compra_real or 0)
    
    # Insertar transacción
    insert_query = transacciones.insert().values(
        tipo=transaccion.tipo,
        vehiculo_id=transaccion.vehiculo_id,
        articulo_id=transaccion.articulo_id,
        usuario_id=current_user["id"],
        sede_id=sede_id,
        precio_venta=transaccion.precio_venta,
        precio_compra=precio_compra_real,
        ganancia=ganancia,
        cliente_nombre=transaccion.cliente_nombre,
        cliente_telefono=transaccion.cliente_telefono,
        cliente_documento=transaccion.cliente_documento,
        observaciones=transaccion.observaciones
    )
    
    transaccion_id = await database.execute(insert_query)
    
    # Actualizar estado del vehículo o artículo
    if transaccion.vehiculo_id and transaccion.tipo == "venta_vehiculo":
        update_vehiculo = vehiculos.update().where(
            vehiculos.c.id == transaccion.vehiculo_id
        ).values(estado="vendido")
        await database.execute(update_vehiculo)
    
    if transaccion.articulo_id:
        nuevo_estado = None
        if transaccion.tipo == "venta_articulo":
            nuevo_estado = "vendido"
        elif transaccion.tipo == "recuperacion_empeño":
            nuevo_estado = "recuperado"  # El cliente pagó y se llevó el artículo
        
        if nuevo_estado:
            update_articulo = articulos_valor.update().where(
                articulos_valor.c.id == transaccion.articulo_id
            ).values(estado=nuevo_estado)
            await database.execute(update_articulo)
    
    return {
        "message": "Transacción registrada exitosamente",
        "id": transaccion_id,
        "ganancia": ganancia
    }

@router.get("/", response_model=List[dict])
async def obtener_transacciones(
    skip: int = 0, 
    limit: int = 100,
    tipo: Optional[str] = None,
    sede_id: Optional[int] = None,
    usuario_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    # Construir query básica
    query = transacciones.select()
    
    # Aplicar filtros
    if tipo:
        query = query.where(transacciones.c.tipo == tipo)
    
    if sede_id:
        query = query.where(transacciones.c.sede_id == sede_id)
    
    # Filtro por usuario (solo para administradores)
    if usuario_id and current_user["rol"] == "administrador":
        query = query.where(transacciones.c.usuario_id == usuario_id)
    
    # Si es vendedor, solo mostrar sus transacciones
    if current_user["rol"] == "vendedor":
        query = query.where(transacciones.c.usuario_id == current_user["id"])
    
    # Ordenar y paginar
    query = query.order_by(transacciones.c.fecha_transaccion.desc()).offset(skip).limit(limit)
    
    result = await database.fetch_all(query)
    
    # Convertir a lista de diccionarios
    transacciones_list = []
    for row in result:
        transaccion_dict = dict(row)
        
        # Obtener información adicional del vehículo o artículo
        if transaccion_dict["vehiculo_id"]:
            vehiculo_query = vehiculos.select().where(vehiculos.c.id == transaccion_dict["vehiculo_id"])
            vehiculo = await database.fetch_one(vehiculo_query)
            if vehiculo:
                transaccion_dict["vehiculo_info"] = f"{vehiculo['marca']} {vehiculo['modelo']} - {vehiculo['placa']}"
        
        if transaccion_dict["articulo_id"]:
            articulo_query = articulos_valor.select().where(articulos_valor.c.id == transaccion_dict["articulo_id"])
            articulo = await database.fetch_one(articulo_query)
            if articulo:
                transaccion_dict["articulo_info"] = articulo["descripcion"]
        
        # Obtener nombre del usuario
        from models import usuarios
        usuario_query = usuarios.select().where(usuarios.c.id == transaccion_dict["usuario_id"])
        usuario = await database.fetch_one(usuario_query)
        if usuario:
            transaccion_dict["usuario_nombre"] = usuario["nombre"]
        
        transacciones_list.append(transaccion_dict)
    
    return transacciones_list

@router.get("/estadisticas")
async def obtener_estadisticas_transacciones(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    sede_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    # Construir query básica
    query = transacciones.select()
    
    # Aplicar filtros
    if fecha_inicio:
        query = query.where(transacciones.c.fecha_transaccion >= fecha_inicio)
    
    if fecha_fin:
        query = query.where(transacciones.c.fecha_transaccion <= fecha_fin)
    
    if sede_id:
        query = query.where(transacciones.c.sede_id == sede_id)
    
    if current_user["rol"] == "vendedor":
        query = query.where(transacciones.c.usuario_id == current_user["id"])
    
    result = await database.fetch_all(query)
    
    # Calcular estadísticas básicas
    total_transacciones = len(result)
    total_ventas = sum(float(row["precio_venta"]) for row in result)
    total_ganancias = sum(float(row["ganancia"]) if row["ganancia"] else 0 for row in result)
    ganancia_promedio = total_ganancias / total_transacciones if total_transacciones > 0 else 0
    
    # Agrupar por tipo
    por_tipo = {}
    for row in result:
        tipo = row["tipo"]
        if tipo not in por_tipo:
            por_tipo[tipo] = {
                "tipo": tipo,
                "cantidad": 0,
                "total_ventas": 0,
                "total_ganancias": 0,
                "ganancia_promedio": 0
            }
        
        por_tipo[tipo]["cantidad"] += 1
        por_tipo[tipo]["total_ventas"] += float(row["precio_venta"])
        por_tipo[tipo]["total_ganancias"] += float(row["ganancia"]) if row["ganancia"] else 0
    
    # Calcular promedio por tipo
    for tipo_data in por_tipo.values():
        if tipo_data["cantidad"] > 0:
            tipo_data["ganancia_promedio"] = tipo_data["total_ganancias"] / tipo_data["cantidad"]
    
    return {
        "total_transacciones": total_transacciones,
        "total_ventas": total_ventas,
        "total_ganancias": total_ganancias,
        "ganancia_promedio": ganancia_promedio,
        "por_tipo": list(por_tipo.values())
    }

@router.put("/{transaccion_id}", response_model=dict)
async def editar_transaccion(transaccion_id: int, transaccion: TransaccionCreate, current_user: dict = Depends(get_current_user)):
    # Solo administradores pueden editar transacciones
    if current_user["rol"] != "administrador":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden editar transacciones")
    
    # Verificar que la transacción existe
    query_existing = transacciones.select().where(transacciones.c.id == transaccion_id)
    existing_transaccion = await database.fetch_one(query_existing)
    
    if not existing_transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    # Validar que se proporcione vehiculo_id o articulo_id según el tipo
    if transaccion.tipo in ["venta_vehiculo"] and not transaccion.vehiculo_id:
        raise HTTPException(status_code=400, detail="vehiculo_id es requerido para ventas de vehículos")
    
    if transaccion.tipo in ["venta_articulo", "empeño_articulo", "recuperacion_empeño"] and not transaccion.articulo_id:
        raise HTTPException(status_code=400, detail="articulo_id es requerido para transacciones de artículos")
    
    # Obtener información del vehículo o artículo
    sede_id = None
    precio_compra_real = transaccion.precio_compra
    
    if transaccion.vehiculo_id:
        vehiculo_query = vehiculos.select().where(vehiculos.c.id == transaccion.vehiculo_id)
        vehiculo_result = await database.fetch_one(vehiculo_query)
        
        if not vehiculo_result:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
        sede_id = vehiculo_result["sede_id"]
        if not precio_compra_real:
            precio_compra_real = float(vehiculo_result["precio_compra"]) if vehiculo_result["precio_compra"] else 0
    
    if transaccion.articulo_id:
        articulo_query = articulos_valor.select().where(articulos_valor.c.id == transaccion.articulo_id)
        articulo_result = await database.fetch_one(articulo_query)
        
        if not articulo_result:
            raise HTTPException(status_code=404, detail="Artículo no encontrado")
        
        sede_id = articulo_result["sede_id"]
        if not precio_compra_real:
            precio_compra_real = float(articulo_result["valor"]) if articulo_result["valor"] else 0
    
    # Calcular ganancia
    ganancia = transaccion.precio_venta - (precio_compra_real or 0)
    
    # Actualizar transacción
    update_query = transacciones.update().where(transacciones.c.id == transaccion_id).values(
        tipo=transaccion.tipo,
        vehiculo_id=transaccion.vehiculo_id,
        articulo_id=transaccion.articulo_id,
        sede_id=sede_id,
        precio_venta=transaccion.precio_venta,
        precio_compra=precio_compra_real,
        ganancia=ganancia,
        cliente_nombre=transaccion.cliente_nombre,
        cliente_telefono=transaccion.cliente_telefono,
        cliente_documento=transaccion.cliente_documento,
        observaciones=transaccion.observaciones
    )
    
    await database.execute(update_query)
    
    return {
        "message": "Transacción actualizada exitosamente",
        "id": transaccion_id,
        "ganancia": ganancia
    }

@router.delete("/{transaccion_id}", response_model=dict)
async def eliminar_transaccion(transaccion_id: int, current_user: dict = Depends(get_current_user)):
    # Solo administradores pueden eliminar transacciones
    if current_user["rol"] != "administrador":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden eliminar transacciones")
    
    # Verificar que la transacción existe y obtener información
    query_existing = transacciones.select().where(transacciones.c.id == transaccion_id)
    existing_transaccion = await database.fetch_one(query_existing)
    
    if not existing_transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    # Revertir el estado del vehículo o artículo si es necesario
    if existing_transaccion["vehiculo_id"] and existing_transaccion["tipo"] == "venta_vehiculo":
        # Revertir vehículo a disponible
        update_vehiculo = vehiculos.update().where(
            vehiculos.c.id == existing_transaccion["vehiculo_id"]
        ).values(estado="disponible")
        await database.execute(update_vehiculo)
    
    if existing_transaccion["articulo_id"]:
        # Determinar el estado anterior del artículo
        estado_anterior = "disponible"  # Por defecto
        if existing_transaccion["tipo"] == "venta_articulo":
            estado_anterior = "disponible"  # Revertir a disponible
        elif existing_transaccion["tipo"] == "empeño_articulo":
            estado_anterior = "disponible"  # Revertir a disponible
        elif existing_transaccion["tipo"] == "recuperacion_empeño":
            estado_anterior = "empeño"  # Revertir a empeño
        
        update_articulo = articulos_valor.update().where(
            articulos_valor.c.id == existing_transaccion["articulo_id"]
        ).values(estado=estado_anterior)
        await database.execute(update_articulo)
    
    # Eliminar la transacción
    delete_query = transacciones.delete().where(transacciones.c.id == transaccion_id)
    await database.execute(delete_query)
    
    return {
        "message": "Transacción eliminada exitosamente",
        "id": transaccion_id
    }
