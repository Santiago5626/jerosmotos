from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime
import base64
from database import database
from models import articulos_valor, articulos_imagenes, EstadoArticuloEnum

router = APIRouter()

class ArticuloValorBase(BaseModel):
    descripcion: Optional[str] = None
    valor: Optional[float] = None
    estado: Optional[EstadoArticuloEnum] = EstadoArticuloEnum.empeño
    fecha_registro: Optional[date] = None
    sede_id: Optional[int] = None
    interes_porcentaje: Optional[float] = 0.00
    cliente_nombre: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cliente_documento: Optional[str] = None

class ArticuloValorCreate(ArticuloValorBase):
    descripcion: str
    valor: float
    fecha_registro: date
    sede_id: int

class ArticuloValorUpdate(ArticuloValorBase):
    pass

class ArticuloValorOut(ArticuloValorBase):
    id: int
    valor_actual: Optional[float] = None
    meses_transcurridos: Optional[int] = None
    interes_acumulado: Optional[float] = None

class ImagenArticuloOut(BaseModel):
    id: int
    articulo_id: int
    imagen: str
    imagen_data: Optional[str] = None
    es_principal: bool

def calcular_interes(valor_empeno: float, interes_porcentaje: float, fecha_registro: date) -> dict:
    """
    Calcula el interés mensual sobre el valor del empeño
    El interés se aplica cada 32 días (aproximadamente un mes)
    El valor ingresado es lo que se le presta al cliente, el interés se suma desde el inicio
    """
    if not valor_empeno or not interes_porcentaje or not fecha_registro:
        return {
            "valor_actual": valor_empeno or 0,
            "meses_transcurridos": 0,
            "interes_acumulado": 0
        }
    
    # Calcular días transcurridos desde el registro
    fecha_actual = datetime.now().date()
    dias_transcurridos = (fecha_actual - fecha_registro).days
    
    # Calcular meses (cada 32 días) - mínimo 1 mes desde la creación
    meses_transcurridos = max(1, (dias_transcurridos // 32) + 1)
    
    # Calcular interés acumulado (siempre sobre el valor del empeño)
    interes_acumulado = valor_empeno * (interes_porcentaje / 100) * meses_transcurridos
    
    # Valor actual = valor del empeño + interés acumulado
    valor_actual = valor_empeno + interes_acumulado
    
    return {
        "valor_actual": round(valor_actual, 2),
        "meses_transcurridos": meses_transcurridos,
        "interes_acumulado": round(interes_acumulado, 2)
    }

@router.post("/", response_model=ArticuloValorOut, status_code=status.HTTP_201_CREATED)
async def create_articulo_valor(articulo: ArticuloValorCreate):
    query = articulos_valor.insert().values(**articulo.dict())
    articulo_id = await database.execute(query)
    
    # Calcular interés para la respuesta
    calculo_interes = calcular_interes(articulo.valor, articulo.interes_porcentaje or 0, articulo.fecha_registro)
    
    return {
        **articulo.dict(), 
        "id": articulo_id,
        **calculo_interes
    }

@router.get("/", response_model=List[ArticuloValorOut])
async def read_articulos_valor():
    query = articulos_valor.select()
    result = await database.fetch_all(query)
    
    # Agregar cálculo de interés a cada artículo
    articulos_con_interes = []
    for articulo in result:
        calculo_interes = calcular_interes(
            articulo.valor, 
            articulo.interes_porcentaje or 0, 
            articulo.fecha_registro
        )
        
        articulos_con_interes.append({
            **dict(articulo),
            **calculo_interes
        })
    
    return articulos_con_interes

@router.get("/{articulo_id}", response_model=ArticuloValorOut)
async def read_articulo_valor(articulo_id: int):
    query = articulos_valor.select().where(articulos_valor.c.id == articulo_id)
    articulo = await database.fetch_one(query)
    if articulo is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    # Calcular interés
    calculo_interes = calcular_interes(
        articulo.valor, 
        articulo.interes_porcentaje or 0, 
        articulo.fecha_registro
    )
    
    return {
        **dict(articulo),
        **calculo_interes
    }

@router.put("/{articulo_id}", response_model=ArticuloValorOut)
async def update_articulo_valor(articulo_id: int, articulo: ArticuloValorUpdate):
    query = articulos_valor.update().where(articulos_valor.c.id == articulo_id).values(**articulo.dict(exclude_unset=True))
    await database.execute(query)
    updated = await database.fetch_one(articulos_valor.select().where(articulos_valor.c.id == articulo_id))
    if updated is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    # Calcular interés
    calculo_interes = calcular_interes(
        updated.valor, 
        updated.interes_porcentaje or 0, 
        updated.fecha_registro
    )
    
    return {
        **dict(updated),
        **calculo_interes
    }

@router.delete("/{articulo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_articulo_valor(articulo_id: int):
    query = articulos_valor.delete().where(articulos_valor.c.id == articulo_id)
    await database.execute(query)
    return

# Endpoint específico para obtener artículos empeñados con intereses
@router.get("/empenos/activos", response_model=List[ArticuloValorOut])
async def get_empenos_activos():
    """
    Obtiene todos los artículos en estado de empeño con cálculo de intereses actualizado
    """
    query = articulos_valor.select().where(articulos_valor.c.estado == EstadoArticuloEnum.empeño)
    result = await database.fetch_all(query)
    
    # Agregar cálculo de interés a cada artículo
    empenos_con_interes = []
    for articulo in result:
        calculo_interes = calcular_interes(
            articulo.valor, 
            articulo.interes_porcentaje or 0, 
            articulo.fecha_registro
        )
        
        empenos_con_interes.append({
            **dict(articulo),
            **calculo_interes
        })
    
    return empenos_con_interes

# Endpoint para realizar abono a un empeño
@router.patch("/{articulo_id}/abono")
async def realizar_abono(articulo_id: int, monto_abono: float):
    """
    Registra un abono al empeño. Si el abono cubre el valor actual, cambia el estado a recuperado.
    """
    # Obtener el artículo
    query = articulos_valor.select().where(articulos_valor.c.id == articulo_id)
    articulo = await database.fetch_one(query)
    if articulo is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    if articulo.estado != EstadoArticuloEnum.empeño:
        raise HTTPException(status_code=400, detail="El artículo no está en estado de empeño")
    
    # Calcular valor actual con intereses
    calculo_interes = calcular_interes(
        articulo.valor, 
        articulo.interes_porcentaje or 0, 
        articulo.fecha_registro
    )
    
    valor_actual = calculo_interes["valor_actual"]
    
    if monto_abono >= valor_actual:
        # Abono completo - cambiar estado a recuperado
        update_query = articulos_valor.update().where(
            articulos_valor.c.id == articulo_id
        ).values(estado=EstadoArticuloEnum.recuperado)
        await database.execute(update_query)
        
        return {
            "mensaje": "Empeño recuperado completamente",
            "valor_actual": valor_actual,
            "monto_abono": monto_abono,
            "cambio": monto_abono - valor_actual,
            "estado": "recuperado"
        }
    else:
        # Abono parcial - por ahora solo informamos, no modificamos el valor
        return {
            "mensaje": "Abono parcial registrado",
            "valor_actual": valor_actual,
            "monto_abono": monto_abono,
            "saldo_pendiente": valor_actual - monto_abono,
            "estado": "empeño"
        }

# Endpoints para imágenes de artículos
@router.post("/{articulo_id}/imagenes", response_model=ImagenArticuloOut, status_code=status.HTTP_201_CREATED)
async def upload_imagen_articulo(
    articulo_id: int,
    imagen: UploadFile = File(...),
    es_principal: bool = Form(False)
):
    # Verificar que el artículo existe
    articulo_query = articulos_valor.select().where(articulos_valor.c.id == articulo_id)
    articulo = await database.fetch_one(articulo_query)
    if articulo is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    # Leer y convertir imagen a base64
    imagen_data = await imagen.read()
    imagen_base64 = base64.b64encode(imagen_data).decode('utf-8')
    
    # Si es principal, desmarcar otras imágenes principales del mismo artículo
    if es_principal:
        update_query = articulos_imagenes.update().where(
            articulos_imagenes.c.articulo_id == articulo_id
        ).values(es_principal=0)
        await database.execute(update_query)
    else:
        # Si no se especifica como principal, verificar si es la primera imagen
        count_query = articulos_imagenes.select().where(articulos_imagenes.c.articulo_id == articulo_id)
        existing_images = await database.fetch_all(count_query)
        if len(existing_images) == 0:
            es_principal = True  # Primera imagen es automáticamente principal
    
    # Insertar nueva imagen
    query = articulos_imagenes.insert().values(
        articulo_id=articulo_id,
        imagen=imagen.filename,
        imagen_data=imagen_base64,
        es_principal=1 if es_principal else 0
    )
    imagen_id = await database.execute(query)
    
    return {
        "id": imagen_id,
        "articulo_id": articulo_id,
        "imagen": imagen.filename,
        "es_principal": es_principal
    }

@router.get("/{articulo_id}/imagenes", response_model=List[ImagenArticuloOut])
async def get_imagenes_articulo(articulo_id: int):
    query = articulos_imagenes.select().where(articulos_imagenes.c.articulo_id == articulo_id)
    result = await database.fetch_all(query)
    
    # Convertir el resultado para incluir imagen_data
    imagenes = []
    for row in result:
        imagenes.append({
            "id": row.id,
            "articulo_id": row.articulo_id,
            "imagen": row.imagen,
            "imagen_data": row.imagen_data,
            "es_principal": bool(row.es_principal)
        })
    
    return imagenes

@router.delete("/{articulo_id}/imagenes/{imagen_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_imagen_articulo(articulo_id: int, imagen_id: int):
    query = articulos_imagenes.delete().where(
        (articulos_imagenes.c.id == imagen_id) & 
        (articulos_imagenes.c.articulo_id == articulo_id)
    )
    await database.execute(query)
    return
