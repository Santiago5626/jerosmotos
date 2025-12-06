import asyncio
import hashlib
from database import database
from models import usuarios

async def fix_passwords():
    """Actualizar contraseñas con el hash correcto"""
    
    # Conectar a la base de datos
    await database.connect()
    
    def get_password_hash(password):
        """Hash de contraseña usando SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    # Contraseñas conocidas
    passwords = {
        "admin@jerosmotos.com": "admin123",
        "vendedor@jerosmotos.com": "vendedor123"
    }
    
    print("Actualizando contraseñas...")
    
    for email, password in passwords.items():
        hashed_password = get_password_hash(password)
        
        # Actualizar la contraseña en la base de datos
        query = usuarios.update().where(usuarios.c.correo == email).values(contrasena=hashed_password)
        result = await database.execute(query)
        
        if result:
            print(f"✅ Contraseña actualizada para {email}")
            print(f"   Contraseña: {password}")
            print(f"   Hash: {hashed_password}")
        else:
            print(f"❌ No se pudo actualizar {email}")
        print()
    
    # Verificar usuarios existentes
    query = usuarios.select()
    users = await database.fetch_all(query)
    
    print("📋 Usuarios en la base de datos:")
    print("=" * 50)
    for user in users:
        print(f"ID: {user['id']}")
        print(f"Nombre: {user['nombre']}")
        print(f"Email: {user['correo']}")
        print(f"Rol: {user['rol']}")
        print(f"Hash: {user['contrasena'][:20]}...")
        print("-" * 30)
    
    print("\n🔑 Credenciales de prueba:")
    print("=" * 50)
    print("ADMINISTRADOR:")
    print("  Email: admin@jerosmotos.com")
    print("  Contraseña: admin123")
    print()
    print("VENDEDOR:")
    print("  Email: vendedor@jerosmotos.com")
    print("  Contraseña: vendedor123")
    print("=" * 50)
    
    # Desconectar de la base de datos
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(fix_passwords())
