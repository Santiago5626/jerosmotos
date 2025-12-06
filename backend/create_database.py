import mysql.connector
from mysql.connector import errorcode

DB_USER = "root"
DB_PASSWORD = "root"
DB_HOST = "localhost"
DB_NAME = "jerosmotos"

def create_database():
    try:
        cnx = mysql.connector.connect(user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
        cursor = cnx.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} DEFAULT CHARACTER SET 'utf8mb4' DEFAULT COLLATE 'utf8mb4_unicode_ci'")
        print(f"Base de datos '{DB_NAME}' creada o ya existe.")
        cursor.close()
        cnx.close()
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Error: Acceso denegado, verifica usuario y contraseña.")
        else:
            print(err)

if __name__ == "__main__":
    create_database()
