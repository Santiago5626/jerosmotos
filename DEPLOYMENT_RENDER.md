# 🚀 Guía de Deployment en Render

Esta guía te ayudará a desplegar la aplicación Jeros'Motos en Render.com de manera gratuita.

## Prerequisitos

- ✅ Cuenta en [Render.com](https://render.com) (puedes registrarte con GitHub)
- ✅ Repositorio en GitHub: https://github.com/Santiago5626/jerosmotos.git

---

## Paso 1: Desplegar el Backend (API)

### 1.1 Crear Nuevo Web Service

1. Ve a tu [Dashboard de Render](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub: `Santiago5626/jerosmotos`
4. Click en **"Connect"** junto al repositorio

### 1.2 Configurar el Backend

Usa la siguiente configuración:

| Campo | Valor |
|-------|-------|
| **Name** | `jerosmotos-api` |
| **Region** | Oregon (US West) o el más cercano |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt && python create_sqlite_db.py` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

### 1.3 Variables de Entorno del Backend

En la sección **Environment**, agregar:

```
PYTHON_VERSION=3.11.0
DATABASE_URL=sqlite:///./jerosmotos.db
```

### 1.4 Desplegar

1. Click en **"Create Web Service"**
2. Espera a que el deployment termine (5-10 minutos)
3. **Guarda la URL del backend** (algo como: `https://jerosmotos-api.onrender.com`)

> [!WARNING]
> **Importante sobre SQLite en Render**: La base de datos SQLite se recreará en cada deploy. Para producción se recomienda usar PostgreSQL de Render, pero para pruebas SQLite funciona.

---

## Paso 2: Desplegar el Frontend

### 2.1 Actualizar URL del Backend

Antes de desplegar el frontend, necesitas actualizar el archivo `.env.production`:

1. En tu máquina local, abre el archivo `frontend/.env.production`
2. Reemplaza la URL con la URL real de tu backend:
   ```
   REACT_APP_API_URL=https://jerosmotos-api.onrender.com
   ```
   (Usa la URL que guardaste en el Paso 1.4)

3. Guarda, commit y push:
   ```bash
   git add frontend/.env.production
   git commit -m "Actualizar URL del backend para producción"
   git push origin main
   ```

### 2.2 Crear Nuevo Static Site

1. En Render Dashboard, click **"New +"** → **"Static Site"**
2. Selecciona el mismo repositorio: `Santiago5626/jerosmotos`
3. Click en **"Connect"**

### 2.3 Configurar el Frontend

| Campo | Valor |
|-------|-------|
| **Name** | `jerosmotos-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

### 2.4 Desplegar

1. Click en **"Create Static Site"**
2. Espera a que el build termine (5-10 minutos)
3. Tu aplicación estará disponible en: `https://jerosmotos-frontend.onrender.com`

---

## Paso 3: Verificar el Deployment

### 3.1 Verificar Backend

1. Abre: `https://jerosmotos-api.onrender.com/docs`
2. Deberías ver la documentación Swagger de la API
3. Prueba algunos endpoints para verificar que funcionen

### 3.2 Verificar Frontend

1. Abre: `https://jerosmotos-frontend.onrender.com`
2. Deberías ver la página principal del catálogo
3. Intenta hacer login con las credenciales de prueba:
   - **Email**: `admin@jerosmotos.com`
   - **Contraseña**: `admin123`

---

## Configuración Post-Deployment

### Activar Uso de config.js en el Frontend

> [!NOTE]
> Para que el frontend use la configuración centralizada de API, necesitarás actualizar todos los archivos que usan URLs hardcodeadas para que importen y usen `config.js`.

Ejemplo de cambio necesario:

**Antes:**
```javascript
const response = await axios.get('http://localhost:8000/vehiculos/');
```

**Después:**
```javascript
import API_URL from '../config';
const response = await axios.get(`${API_URL}/vehiculos/`);
```

Este cambio debe hacerse en aproximadamente 50+ archivos del frontend.

---

## URLs Finales

Después del deployment exitoso:

| Servicio | URL |
|----------|-----|
| **Frontend (Sitio público)** | https://jerosmotos-frontend.onrender.com |
| **Backend (API)** | https://jerosmotos-api.onrender.com |
| **API Docs** | https://jerosmotos-api.onrender.com/docs |

---

## Limitaciones del Plan Gratuito de Render

⚠️ **Importante conocer**:

1. **Suspensión por inactividad**: Los servicios gratuitos se suspenden después de 15 minutos sin actividad
2. **Arranque lento**: El primer acceso después de suspensión puede tomar 30-60 segundos
3. **SQLite no persistente**: La base de datos se reinicia con cada deploy
4. **Límites de recursos**: 512 MB RAM, CPU compartida

### Soluciones:

- **Para persistencia de datos**: Usar PostgreSQL gratuito de Render
- **Para evitar suspensión**: Usar un servicio de ping (ej: UptimeRobot)
- **Para mejor rendimiento**: Actualizar a plan de pago ($7/mes)

---

## Solución de Problemas

### Backend no inicia

1. Revisa los logs en Render Dashboard
2. Verifica que `requirements.txt` esté completo
3. Asegúrate que `create_sqlite_db.py` exista en `/backend`

### Frontend no se conecta al Backend

1. Verifica que `.env.production` tenga la URL correcta del backend
2. Revisa la consola del navegador para errores de CORS
3. Verifica que el backend esté corriendo y accesible

### Error de CORS

1. El backend ya está configurado para aceptar `*.onrender.com`
2. Si usas un dominio personalizado, añádelo a `main.py` en la lista de `allow_origins`

---

## Próximos Pasos Recomendados

1. ✅ **Migrar a PostgreSQL** para persistencia de datos
2. ✅ **Configurar dominio personalizado** (gratis con Render)
3. ✅ **Implementar autenticación mejorada** con tokens JWT
4. ✅ **Añadir monitoring** con servicios como UptimeRobot
5. ✅ **Configurar CD/CI** para deploys automáticos en push a main

---

¿Necesitas ayuda con algún paso? Consulta la [documentación de Render](https://render.com/docs) o pregúntame.
