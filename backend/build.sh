#!/usr/bin/env bash
# Build script para Render

echo "Instalando dependencias de Python..."
pip install -r requirements.txt

echo "Creando base de datos SQLite..."
python create_sqlite_db.py

echo "Build completado!"
