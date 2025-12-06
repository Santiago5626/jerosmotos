from sqlalchemy import insert, select
from database import engine, metadata, database
import models
import asyncio

# Ensure tables are created
def create_tables():
    print("Creando tablas en SQLite...")
    metadata.create_all(engine)
    print("Tablas creadas exitosamente.")

async def seed_data():
    async with database.connect() as _: # just to verify connection if needed, but we use engine for sync inserts or database for async
        # We can use synchronous engine for initial seeding script for simplicity
        with engine.connect() as conn:
            # Check if sede exists
            stmt = select(models.sedes).where(models.sedes.c.nombre == 'Sede Principal')
            result = conn.execute(stmt).first()
            
            sede_id = None
            if not result:
                print("Insertando Sede Principal...")
                stmt = insert(models.sedes).values(
                    nombre='Sede Principal',
                    direccion='Dirección Principal',
                    telefono='123-456-7890'
                )
                result = conn.execute(stmt)
                sede_id = result.inserted_primary_key[0]
                conn.commit()
            else:
                print("Sede Principal ya existe.")
                sede_id = result.id

            # Check if admin exists
            stmt = select(models.usuarios).where(models.usuarios.c.correo == 'admin@jerosmotos.com')
            result = conn.execute(stmt).first()

            if not result:
                print("Insertando Usuario Administrador...")
                stmt = insert(models.usuarios).values(
                    nombre='Administrador',
                    correo='admin@jerosmotos.com',
                    contrasena='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9u2', # admin123
                    rol='administrador'
                )
                conn.execute(stmt)
                conn.commit()
            else:
                print("Usuario Administrador ya existe.")

if __name__ == "__main__":
    create_tables()
    # Using async run for seed_data if we wanted to use 'database' instance, 
    # but here we used engine directly. 
    # However, since 'database' is async, it's good practice to align.
    # But for this simple script, sync engine is fine.
    # We'll just run the sync logic above.
    
    # Re-using the async definition logic just in case we wanted to switch, 
    # but simpler to keep it sync for a setup script unless we strictly need async.
    # Let's just run the sync code inside seed_data logic directly.
    
    with engine.connect() as conn:
        # Check if sede exists
        stmt = select(models.sedes).where(models.sedes.c.nombre == 'Sede Principal')
        result = conn.execute(stmt).first()
        
        if not result:
            print("Insertando Sede Principal...")
            stmt = insert(models.sedes).values(
                nombre='Sede Principal',
                direccion='Dirección Principal',
                telefono='123-456-7890'
            )
            try:
                result = conn.execute(stmt)
                conn.commit()
                print("Sede insertada.")
            except Exception as e:
                print(f"Error insertando sede: {e}")
        else:
            print("Sede Principal ya existe.")

        # Check if admin exists
        stmt = select(models.usuarios).where(models.usuarios.c.correo == 'admin@jerosmotos.com')
        result = conn.execute(stmt).first()

        if not result:
            print("Insertando Usuario Administrador...")
            stmt = insert(models.usuarios).values(
                nombre='Administrador',
                correo='admin@jerosmotos.com',
                contrasena='$2b$12$J7oTMNYcceyEZ3ciBXVY5uFTiDqxZIcplOGA4WUVqldsMGKe2Tww.', # admin123 - hash verificado
                rol=models.RolEnum.administrador
            )
            try:
                conn.execute(stmt)
                conn.commit()
                print("Admin insertado.")
            except Exception as e:
                 print(f"Error insertando admin: {e}")
        else:
            print("Usuario Administrador ya existe.")
