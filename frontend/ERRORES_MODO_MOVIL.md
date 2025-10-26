# ✅ Solución: Errores en Modo Móvil

## Problemas Identificados y Solucionados

### 1. ⚠️ Warning: scroll-behavior smooth

**Error:**
```
Detected `scroll-behavior: smooth` on the `<html>` element. 
In a future version, Next.js will no longer automatically disable 
smooth scrolling during route transitions.
```

**Causa:** 
Next.js 15 requiere que uses `data-scroll-behavior="smooth"` en lugar de CSS directo para el scroll suave.

**Solución Aplicada:**

**Antes (globals.css):**
```css
html {
  scroll-behavior: smooth;
}
```

**Después (globals.css):**
```css
html[data-scroll-behavior="smooth"] {
  scroll-behavior: smooth;
}
```

**Antes (layout.tsx):**
```tsx
<html lang="es">
```

**Después (layout.tsx):**
```tsx
<html lang="es" data-scroll-behavior="smooth">
```

---

### 2. ❌ Error 404: manifest.json

**Error:**
```
GET http://localhost:3011/manifest.json 404 (Not Found)
Manifest fetch from http://localhost:3011/manifest.json failed, code 404
```

**Causa:** 
El manifest.json estaba en `src/app/` pero debe estar en `public/` para ser accesible.

**Solución Aplicada:**
- ✅ Movido `manifest.json` de `src/app/` a `public/`
- ✅ Actualizado para usar iconos generados dinámicamente
- ✅ Añadido `purpose: "any maskable"` para PWA

---

### 3. ⚠️ Warning: Preloaded font not used

**Error:**
```
The resource http://localhost:3011/_next/static/media/e4af272ccee01ff0-s.p.woff2 
was preloaded using link preload but not used within a few seconds 
from the window's load event.
```

**Causa:** 
Next.js precarga la fuente Inter pero puede tardar en usarse. Este es un warning menor.

**Solución:**
Este warning es normal en desarrollo y no afecta la funcionalidad. En producción, Next.js optimiza automáticamente la carga de fuentes.

**Opcional - Para eliminarlo:**
Puedes desactivar la precarga de fuentes en `next.config.js`:

```javascript
const nextConfig = {
  optimizeFonts: false, // Desactiva la optimización de fuentes
  // ... resto de config
}
```

**No recomendado** porque la optimización de fuentes mejora el rendimiento.

---

## Archivos Modificados

### ✅ frontend/src/app/layout.tsx
```tsx
<html lang="es" data-scroll-behavior="smooth">
```

### ✅ frontend/src/app/globals.css
```css
html[data-scroll-behavior="smooth"] {
  scroll-behavior: smooth;
}
```

### ✅ frontend/public/manifest.json
```json
{
  "icons": [
    {
      "src": "/icon?size=192",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### ✅ frontend/src/app/icon.tsx
```tsx
export const runtime = 'edge'
```

### ✅ frontend/src/app/apple-icon.tsx
```tsx
export const runtime = 'edge'
```

---

## Verificación

### Paso 1: Reiniciar el Servidor
```bash
# Detener el servidor (Ctrl+C)
npm run dev
```

### Paso 2: Limpiar Caché
```bash
# Limpiar caché de Next.js
rm -rf .next

# Reiniciar
npm run dev
```

### Paso 3: Probar en Modo Móvil
1. Abre DevTools: `F12`
2. Activa modo móvil: `Ctrl+Shift+M`
3. Recarga la página: `Ctrl+R`
4. Revisa la consola

**Resultado Esperado:**
- ✅ Sin warning de scroll-behavior
- ✅ Sin error 404 de manifest.json
- ⚠️ Warning de fuente (normal, puede ignorarse)

---

## Errores que Puedes Ignorar

### ✅ Warnings Normales en Desarrollo:

1. **Font preload warning** - Normal en desarrollo
2. **React DevTools warnings** - Solo en desarrollo
3. **Hot reload messages** - Parte del desarrollo

### ❌ Errores que SÍ Debes Atender:

1. **404 en recursos críticos** (CSS, JS, imágenes)
2. **Errores de compilación** de TypeScript
3. **Errores de API** (500, 401, etc.)
4. **Errores de componentes** React

---

## Mejoras Adicionales para PWA

Si quieres convertir tu app en una PWA completa:

### 1. Crear Iconos Reales

Actualmente los iconos son generados dinámicamente. Para producción:

```bash
# Usa una herramienta como:
# https://realfavicongenerator.net/
# https://www.pwabuilder.com/imageGenerator

# Coloca los iconos en public/:
# - icon-192.png (192x192)
# - icon-512.png (512x512)
# - apple-touch-icon.png (180x180)
```

### 2. Añadir Service Worker

Crea `public/sw.js`:

```javascript
// Service Worker básico
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado')
})

self.addEventListener('fetch', (event) => {
  // Estrategia de caché aquí
})
```

### 3. Registrar Service Worker

En `app/layout.tsx`:

```tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
}, [])
```

### 4. Actualizar manifest.json

```json
{
  "name": "TechNovaStore",
  "short_name": "TechNova",
  "description": "Tu tienda online de productos tecnológicos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "categories": ["shopping", "technology"],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## Testing en Dispositivos Móviles

### Chrome DevTools - Device Mode
```
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Selecciona dispositivo (iPhone, Pixel, etc.)
3. Prueba diferentes resoluciones
4. Verifica touch events
```

### Lighthouse - PWA Audit
```
1. F12 → Lighthouse tab
2. Selecciona "Progressive Web App"
3. Click "Generate report"
4. Corrige problemas detectados
```

### Testing Real
```bash
# Exponer servidor en red local
npm run dev -- -H 0.0.0.0

# Accede desde tu móvil:
# http://[tu-ip-local]:3000
```

---

## Checklist de Optimización Móvil

- [x] scroll-behavior configurado correctamente
- [x] manifest.json en public/
- [x] Iconos generados dinámicamente
- [ ] Iconos PNG reales para producción
- [ ] Service Worker (opcional)
- [ ] Touch gestures optimizados
- [ ] Viewport meta tag configurado
- [ ] Responsive design verificado
- [ ] Performance en móvil optimizado

---

## Comandos Útiles

```bash
# Limpiar todo y empezar de cero
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Build de producción
npm run build
npm run start

# Analizar bundle
npm run build -- --analyze

# Verificar TypeScript
npm run type-check

# Verificar ESLint
npm run lint
```

---

## Recursos

- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [PWA Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)

---

**Última actualización:** 25 de octubre de 2025
