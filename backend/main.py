from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import database
from routers import usuarios, sedes, vehiculos, mantenimientos, articulos_valor, transacciones

app = FastAPI(title="Jeros'Motos API")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://jerosmotos.onrender.com",  
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
app.include_router(sedes.router, prefix="/sedes", tags=["sedes"])
app.include_router(vehiculos.router, prefix="/vehiculos", tags=["vehiculos"])
app.include_router(mantenimientos.router, prefix="/mantenimientos", tags=["mantenimientos"])
app.include_router(articulos_valor.router, prefix="/articulos_valor", tags=["articulos_valor"])
app.include_router(transacciones.router, prefix="/transacciones", tags=["transacciones"])

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
