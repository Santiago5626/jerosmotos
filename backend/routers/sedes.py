from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from pydantic import BaseModel
from database import database
from models import sedes

router = APIRouter()

class SedeBase(BaseModel):
    nombre: str
    direccion: str = None
    telefono: str = None

class SedeCreate(SedeBase):
    pass

class SedeUpdate(SedeBase):
    pass

class SedeOut(SedeBase):
    id: int

@router.post("/", response_model=SedeOut, status_code=status.HTTP_201_CREATED)
async def create_sede(sede: SedeCreate):
    query = sedes.insert().values(
        nombre=sede.nombre,
        direccion=sede.direccion,
        telefono=sede.telefono
    )
    sede_id = await database.execute(query)
    return {**sede.dict(), "id": sede_id}

@router.get("/", response_model=List[SedeOut])
async def read_sedes():
    query = sedes.select()
    result = await database.fetch_all(query)
    return result

@router.get("/{sede_id}", response_model=SedeOut)
async def read_sede(sede_id: int):
    query = sedes.select().where(sedes.c.id == sede_id)
    sede = await database.fetch_one(query)
    if sede is None:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    return sede

@router.put("/{sede_id}", response_model=SedeOut)
async def update_sede(sede_id: int, sede: SedeUpdate):
    query = sedes.update().where(sedes.c.id == sede_id).values(
        nombre=sede.nombre,
        direccion=sede.direccion,
        telefono=sede.telefono
    )
    await database.execute(query)
    return {**sede.dict(), "id": sede_id}

@router.delete("/{sede_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sede(sede_id: int):
    query = sedes.delete().where(sedes.c.id == sede_id)
    await database.execute(query)
    return
