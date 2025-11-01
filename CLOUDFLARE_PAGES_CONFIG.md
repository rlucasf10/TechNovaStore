# Configuración de Cloudflare Pages para TechNovaStore

## ⚠️ CONFIGURACIÓN CRÍTICA

El sitio está dando 404 porque la configuración del proyecto en Cloudflare Pages está incorrecta.

## Configuración Correcta en Cloudflare Dashboard

Ve a tu proyecto en Cloudflare Pages y configura:

### Build Configuration

1. **Framework preset**: `Next.js (Static HTML Export)`
2. **Build command**: `bash build-cloudflare.sh`
3. **Build output directory**: `frontend/out` ⚠️ **IMPORTANTE: Debe ser `frontend/out` NO `frontend/.next`**
4. **Root directory**: `/` (raíz del proyecto)

### Environment Variables

Agrega estas variables en Settings > Environment variables:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.technovastore.com/api
NEXT_PUBLIC_CHATBOT_URL=https://chatbot.technovastore.com
NEXT_PUBLIC_SOCKET_URL=https://chatbot.technovastore.com
NEXT_PUBLIC_APP_URL=https://technovastore.pages.dev
```

## Cambios Realizados

### 1. next.config.js
- ✅ Cambiado `output: 'standalone'` a `output: 'export'`
- ✅ Configurado `images.unoptimized: true` (requerido para export estático)
- ✅ Eliminadas características incompatibles con export estático

### 2. Iconos Dinámicos
- ✅ Eliminados `icon.tsx` y `apple-icon.tsx` (incompatibles con export estático)
- ℹ️ Next.js usará los iconos estáticos de `/public` si existen

### 3. Headers
- ✅ Creado `frontend/public/_headers` para Cloudflare Pages

### 4. Build Script
- ✅ Actualizado para verificar el directorio `out`

## Próximos Pasos

1. **Ve al dashboard de Cloudflare Pages**: https://dash.cloudflare.com/
2. **Selecciona tu proyecto**: technovastore
3. **Ve a Settings > Builds & deployments**
4. **Edita la configuración**:
   - Build output directory: `frontend/out` ⚠️
5. **Guarda los cambios**
6. **Haz un nuevo deployment**: Settings > Deployments > Retry deployment

## Verificación

Después del deployment, el sitio debería funcionar en:
- https://technovastore.pages.dev

Si sigue dando 404, verifica en el log del build que diga:
```
📦 Directorio de salida: frontend/out
```

Y que Cloudflare esté usando ese directorio como "Build output directory".
