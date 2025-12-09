# 🔄 Sistema Keep-Alive para Render

## 🎯 Propósito

Este sistema mantiene los servicios de Render (backend y frontend) despiertos durante horario activo para evitar que entren en modo "sleep" después de 15 minutos de inactividad en el plan gratuito.

## ⚙️ Funcionamiento

### 1. Endpoint de Ping

**Backend**: `/ping`
- **URL**: `https://jerosmotos-api.onrender.com/ping`
- **Método**: GET
- **Respuesta**: 
```json
{
  "status": "alive",
  "timestamp": "2024-12-06T16:30:00",
  "service": "jerosmotos-api"
}
```
- **Autenticación**: No requiere (público)

### 2. GitHub Actions Workflow

**Archivo**: `.github/workflows/keep-alive.yml`

**Configuración**:
- **Frecuencia**: Cada 14 minutos (para evitar el sleep de 15 minutos)
- **Horario activo**: 6:00 AM - 11:59 PM (hora de Colombia, UTC-5)
- **Horario inactivo**: 12:00 AM - 5:59 AM (servicios pueden dormir para ahorrar recursos)

**Acciones**:
1. Verifica la hora actual en zona horaria de Colombia
2. Si está en horario permitido:
   - Hace ping al backend (`/ping`)
   - Hace ping al frontend (página principal)
3. Registra los resultados en los logs

## 🌍 Zona Horaria

El sistema usa **America/Bogota (UTC-5)**.

### Conversión de horarios:

| Hora Colombia | Hora UTC | Descripción |
|--------------|----------|-------------|
| 6:00 AM | 11:00 AM | Inicio de keep-alive |
| 12:00 PM | 5:00 PM | Mediodía |
| 11:59 PM | 4:59 AM (+1 día) | Fin de keep-alive |
| 12:00 AM - 5:59 AM | 5:00 AM - 10:59 AM | Servicios pueden dormir |

## 📊 Verificación del Sistema

### 1. Verificar que el workflow está activo

1. Ve a tu repositorio en GitHub
2. Haz click en la pestaña **Actions**
3. Busca el workflow **"Keep Render Services Alive"**
4. Deberías ver ejecuciones cada ~14 minutos durante horario activo

### 2. Verificar logs en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Selecciona el servicio `jerosmotos-api`
3. Ve a la pestaña **Logs**
4. Deberías ver peticiones GET a `/ping` cada ~14 minutos

### 3. Probar el endpoint manualmente

```bash
# Probar backend
curl https://jerosmotos-api.onrender.com/ping

# Probar frontend
curl https://jerosmotos-frontend.onrender.com/
```

## 🛠️ Mantenimiento

### Ejecutar manualmente

1. Ve a **GitHub > Actions**
2. Selecciona **"Keep Render Services Alive"**
3. Click en **"Run workflow"**
4. Confirma la ejecución

### Desactivar temporalmente

Si necesitas desactivar el keep-alive:

1. Ve a `.github/workflows/keep-alive.yml`
2. Comenta las líneas del `schedule`:
```yaml
on:
  # schedule:
  #   - cron: '*/14 11-23 * * *'
  #   - cron: '*/14 0-4 * * *'
  workflow_dispatch:
```
3. Commit y push

### Cambiar horarios

Para cambiar el horario activo, edita las expresiones cron en `keep-alive.yml`.

**Ejemplo**: Para 7 AM - 10 PM:
```yaml
schedule:
  - cron: '*/14 12-21 * * *'  # 7 AM - 4:59 PM
  - cron: '*/14 22-23,0-2 * * *'  # 5 PM - 9:59 PM
```

## 💡 Beneficios

- ✅ **Disponibilidad**: Servicios siempre disponibles durante horario laboral
- ✅ **Rendimiento**: Sin cold starts, respuesta inmediata
- ✅ **Eficiencia**: Ahorro de recursos durante la noche
- ✅ **Costo**: Gratis (usa minutos gratuitos de GitHub Actions)

## ⚠️ Limitaciones

- **GitHub Actions**: 2,000 minutos/mes gratis
- **Uso estimado**: ~3,000 ejecuciones/mes × 30 segundos = ~25 horas = 1,500 minutos/mes
- **Margen**: Suficiente para el plan gratuito de GitHub

## 🔗 URLs Importantes

- **Backend API**: https://jerosmotos-api.onrender.com
- **Frontend**: https://jerosmotos.onrender.com
- **GitHub Actions**: https://github.com/[tu-usuario]/jerosmotos/actions
- **Render Dashboard**: https://dashboard.render.com/

## 📝 Notas

- El sistema solo funciona cuando los cambios están en la rama `main`
- Los workflows de GitHub Actions pueden tardar 1-2 minutos en ejecutarse
- Si un servicio falla, el workflow marcará error pero continuará intentando
