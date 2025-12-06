import mysql.connector
from mysql.connector import Error

def create_transacciones_table():
    try:
        # Configuración de la base de datos
        connection = mysql.connector.connect(
            host='localhost',
            database='jerosmotos',
            user='root',
            password=''
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Crear tabla transacciones
            create_table_query = """
            CREATE TABLE IF NOT EXISTS transacciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo ENUM('venta_vehiculo', 'venta_articulo', 'empeño_articulo', 'recuperacion_empeño') NOT NULL,
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
            )
            """
            
            cursor.execute(create_table_query)
            connection.commit()
            print("✅ Tabla 'transacciones' creada exitosamente")
            
    except Error as e:
        print(f"❌ Error al crear la tabla: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 Conexión a MySQL cerrada")

if __name__ == "__main__":
    create_transacciones_table()
