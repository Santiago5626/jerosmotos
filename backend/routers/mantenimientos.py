from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from database import database
from models import mantenimientos

router = APIRouter()

class MantenimientoBase(BaseModel):
    vehiculo_id: Optional[int] = None
    fecha_servicio: Optional[date] = None
    servicio: Optional[str] = None
    taller: Optional[str] = None
    costo: Optional[float] = None
    observaciones: Optional[str] = None

class MantenimientoCreate(MantenimientoBase):
    vehiculo_id: int
    fecha_servicio: date
    servicio: str

class MantenimientoUpdate(MantenimientoBase):
    pass

class MantenimientoOut(MantenimientoBase):
    id: int

@router.post("/", response_model=MantenimientoOut, status_code=status.HTTP_201_CREATED)
async def create_mantenimiento(mantenimiento: MantenimientoCreate):
    query = mantenimientos.insert().values(**mantenimiento.dict())
    mantenimiento_id = await database.execute(query)
    return {**mantenimiento.dict(), "id": mantenimiento_id}

@router.get("/", response_model=List[MantenimientoOut])
async def read_mantenimientos():
    query = mantenimientos.select()
    result = await database.fetch_all(query)
    return result

@router.get("/{mantenimiento_id}", response_model=MantenimientoOut)
async def read_mantenimiento(mantenimiento_id: int):
    query = mantenimientos.select().where(mantenimientos.c.id == mantenimiento_id)
    mantenimiento = await database.fetch_one(query)
    if mantenimiento is None:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")
    return mantenimiento

@router.put("/{mantenimiento_id}", response_model=MantenimientoOut)
async def update_mantenimiento(mantenimiento_id: int, mantenimiento: MantenimientoUpdate):
    query = mantenimientos.update().where(mantenimientos.c.id == mantenimiento_id).values(**mantenimiento.dict(exclude_unset=True))
    await database.execute(query)
    updated = await database.fetch_one(mantenimientos.select().where(mantenimientos.c.id == mantenimiento_id))
    if updated is None:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")
    return updated

@router.delete("/{mantenimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mantenimiento(mantenimiento_id: int):
    query = mantenimientos.delete().where(mantenimientos.c.id == mantenimiento_id)
    await database.execute(query)
    return
