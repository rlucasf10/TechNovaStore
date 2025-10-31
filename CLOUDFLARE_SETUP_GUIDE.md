# 🌐 Guía Completa: Configurar Cloudflare CDN Gratuito para TechNovaStore

Esta guía te llevará paso a paso para configurar Cloudflare CDN completamente **GRATIS** para tu proyecto TechNovaStore.

## 📋 **Requisitos Previos**

- ✅ Node.js instalado
- ✅ Proyecto TechNovaStore clonado
- ✅ Conexión a internet

## 🚀 **PASO 1: Instalar Dependencias**

Ejecuta el script de instalación:

```powershell
# En PowerShell (Windows)
.\scripts\install-cdn-dependencies.ps1

# O manualmente
npm install cloudflare dotenv
```

## 🌐 **PASO 2: Crear Cuenta Gratuita en Cloudflare**

### 2.1 Registrarse
1. Ve a: **https://cloudflare.com**
2. Click **"Sign Up"** (arriba derecha)
3. Completa el formulario:
   - **Email**: tu_email@gmail.com
   - **Contraseña**: (usa una segura)
4. **Verifica tu email** (revisa tu bandeja de entrada)

### 2.2 Obtener Subdominio Gratuito

**Opción A: Cloudflare Workers (Más fácil)**
1. En Cloudflare dashboard, ve a **"Workers & Pages"**
2. Click **"Create application"**
3. Click **"Create Worker"**
4. Elige un nombre: `technovastore-demo`
5. Tu subdominio será: `technovastore-demo.workers.dev`

**Opción B: Dominio gratuito Freenom**
1. Ve a: **https://freenom.com**
2. Busca: `technovastore.tk` o `technovastore.ml`
3. Si está disponible, regístralo **gratis por 12 meses**
4. Luego agrégalo a Cloudflare

### 2.3 Agregar Sitio a Cloudflare
1. En Cloudflare dashboard, click **"Add a Site"**
2. Ingresa tu dominio/subdominio
3. Selecciona el plan **"Free"** (¡es gratis!)
4. Sigue las instrucciones para cambiar nameservers (si usas dominio propio)

## 🔑 **PASO 3: Obtener Credenciales de Cloudflare**

### 3.1 Global API Key
1. En Cloudflare dashboard, click en tu **perfil** (arriba derecha)
2. Click **"My Profile"**
3. Ve a la pestaña **"API Tokens"**
4. En **"Global API Key"**, click **"View"**
5. Ingresa tu contraseña
6. **COPIA Y GUARDA** esta clave ⚠️ **¡MUY IMPORTANTE!**

### 3.2 Zone ID
1. Ve a tu sitio en Cloudflare dashboard
2. En la **barra lateral derecha**, encontrarás **"Zone ID"**
3. **COPIA Y GUARDA** este ID

## ⚙️ **PASO 4: Configurar Variables de Entorno**

### 4.1 Crear archivo de configuración
```powershell
# Copia el archivo de ejemplo
copy .env.cloudflare.example .env.cloudflare
```

### 4.2 Editar configuración
Abre `.env.cloudflare` y completa:

```bash
# ============================================================================
# CLOUDFLARE CREDENTIALS (COMPLETAR CON TUS DATOS)
# ============================================================================

# Tu email de Cloudflare
CLOUDFLARE_EMAIL=tu_email@gmail.com

# Global API Key (el que copiaste en el paso 3.1)
CLOUDFLARE_API_KEY=tu_global_api_key_aqui

# Zone ID (el que copiaste en el paso 3.2)
CLOUDFLARE_ZONE_ID=tu_zone_id_aqui

# ============================================================================
# DOMAIN CONFIGURATION
# ============================================================================

# Tu dominio o subdominio (elige UNA opción):

# Opción A: Subdominio de Cloudflare Workers
DOMAIN=technovastore-demo.workers.dev

# Opción B: Dominio gratuito de Freenom
# DOMAIN=technovastore.tk

# Opción C: Tu dominio personalizado
# DOMAIN=tudominio.com

# ============================================================================
# CDN CONFIGURATION (Dejar como está)
# ============================================================================

CDN_ENABLED=true
CDN_STATIC_CACHE_TTL=31536000
CDN_IMAGE_CACHE_TTL=2592000
CDN_API_CACHE_TTL=0
CDN_HTML_CACHE_TTL=14400

# ============================================================================
# SECURITY CONFIGURATION (Dejar como está)
# ============================================================================

CLOUDFLARE_SECURITY_LEVEL=medium
CLOUDFLARE_SSL_MODE=full
CLOUDFLARE_ALWAYS_USE_HTTPS=true
CLOUDFLARE_MIN_TLS_VERSION=1.2

# ============================================================================
# PERFORMANCE CONFIGURATION (Dejar como está)
# ============================================================================

CLOUDFLARE_MINIFY_CSS=true
CLOUDFLARE_MINIFY_HTML=true
CLOUDFLARE_MINIFY_JS=true
CLOUDFLARE_BROTLI=true
CLOUDFLARE_HTTP2=true
CLOUDFLARE_HTTP3=true
CLOUDFLARE_DEVELOPMENT_MODE=false
CDN_LOG_LEVEL=info
```

## 🎯 **PASO 5: Ejecutar Configuración Automática**

```powershell
# Ejecutar el script de configuración
node scripts/setup-cloudflare-cdn.js
```

**Si todo está correcto, verás:**
```
🚀 TechNovaStore Cloudflare CDN Setup
📧 Email: tu_email@gmail.com
🌐 Domain: technovastore-demo.workers.dev

🔍 Verificando conexión con Cloudflare...
✅ Conectado exitosamente a zona: technovastore-demo.workers.dev
📦 Configurando reglas de cache...
✅ Reglas de cache configuradas
🔒 Configurando seguridad...
✅ Configuración de seguridad completada
⚡ Configurando optimizaciones de performance...
✅ Optimizaciones de performance configuradas
📝 Generando configuración para el proyecto...
✅ Configuración guardada en cdn-config.json

✅ ¡Cloudflare CDN configurado exitosamente!
```

## 🔧 **PASO 6: Actualizar Configuración del Proyecto**

El script habrá creado un archivo `cdn-config.json`. Ahora actualiza tu proyecto:

### 6.1 Actualizar variables de entorno del frontend
Edita `frontend/.env.local`:

```bash
# URLs con CDN habilitado
NEXT_PUBLIC_API_URL=https://technovastore-demo.workers.dev/api
NEXT_PUBLIC_APP_URL=https://technovastore-demo.workers.dev
NEXT_PUBLIC_CDN_URL=https://technovastore-demo.workers.dev
```

### 6.2 Actualizar configuración de producción
Edita `.env.prod` (o créalo):

```bash
# Domain Configuration con CDN
DOMAIN=technovastore-demo.workers.dev
API_DOMAIN=technovastore-demo.workers.dev

# Frontend URLs con CDN
NEXT_PUBLIC_API_URL=https://technovastore-demo.workers.dev/api
NEXT_PUBLIC_APP_URL=https://technovastore-demo.workers.dev
```

## 🚀 **PASO 7: Desplegar y Verificar**

### 7.1 Desplegar aplicación
```powershell
# Levantar en modo producción con CDN
docker-compose -f docker-compose.prod.yml up -d
```

### 7.2 Verificar CDN funcionando
```powershell
# Verificar que el CDN esté activo
curl -I https://technovastore-demo.workers.dev

# Deberías ver headers como:
# cf-ray: xxxxx-xxx
# cf-cache-status: HIT/MISS
# server: cloudflare
```

## 🎉 **¡LISTO! CDN Configurado**

### ✅ **Lo que tienes ahora:**
- 🌐 **CDN global gratuito** - Tu sitio se sirve desde 100+ ubicaciones
- 🔒 **SSL automático** - HTTPS habilitado automáticamente
- ⚡ **Compresión y minificación** - Archivos optimizados automáticamente
- 🛡️ **Protección DDoS básica** - Protección contra ataques
- 📊 **Analytics básicos** - Estadísticas de tráfico

### 🔗 **URLs importantes:**
- **Tu sitio**: https://technovastore-demo.workers.dev
- **API**: https://technovastore-demo.workers.dev/api
- **Dashboard Cloudflare**: https://dash.cloudflare.com

## 🆘 **Solución de Problemas**

### Error: "Invalid request headers"
```bash
# Verifica que las credenciales sean correctas
echo $CLOUDFLARE_EMAIL
echo $CLOUDFLARE_API_KEY
```

### Error: "Zone not found"
```bash
# Verifica que el Zone ID sea correcto
echo $CLOUDFLARE_ZONE_ID
```

### CDN no funciona
1. Verifica que el dominio esté activo en Cloudflare
2. Espera 5-10 minutos para propagación DNS
3. Verifica que las URLs en el frontend sean correctas

## 💰 **Costos**

- ✅ **Plan Cloudflare Free**: $0/mes
- ✅ **Bandwidth ilimitado**: $0
- ✅ **SSL certificates**: $0
- ✅ **DDoS protection**: $0
- ✅ **CDN global**: $0

**Total: $0/mes** 🎉

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs: `node scripts/setup-cloudflare-cdn.js`
2. Verifica las variables de entorno
3. Consulta la documentación de Cloudflare
4. Abre un issue en el repositorio

¡Disfruta de tu CDN gratuito! 🚀