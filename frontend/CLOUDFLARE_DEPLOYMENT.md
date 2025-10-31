# Guía de Despliegue en Cloudflare Pages

## Resumen de Cambios Realizados

### 1. Configuración de Build
- ✅ Creado script `build:pages` en `package.json`
- ✅ Configurado Next.js para modo `standalone` (SSR compatible con Cloudflare)
- ✅ Eliminados todos los imports directos, usando barrel exports
- ✅ Verificado build local exitoso (24 páginas generadas)

### 2. Archivos de Configuración Creados
- ✅ `.node-version` - Especifica Node.js 20.10.0
- ✅ `.gitattributes` - Normalización de line endings
- ✅ `.env.cloudflare.example` - Template de variables de entorno
- ❌ `wrangler.toml` - NO es necesario para Pages (solo para Workers)

### 3. Correcciones de Código
- ✅ Corregidos imports en `registro/page.tsx`
- ✅ Verificados todos los barrel exports (index.ts)
- ✅ Sin errores de TypeScript
- ✅ Build de producción funcional

## ⚠️ IMPORTANTE: Workers vs Pages

**NO CREAR UN WORKER** - Este proyecto necesita **Cloudflare Pages**, no Workers.

### Diferencias:
- **Workers**: Para APIs y funciones serverless (código JavaScript/TypeScript)
- **Pages**: Para sitios web estáticos y SSR (Next.js, React, Vue, etc.)

Si ya creaste un Worker por error:
1. Ve a Workers & Pages
2. Selecciona el Worker "technovastore"
3. Ve a Settings > General
4. Elimina el Worker
5. Sigue los pasos a continuación para crear un Pages project

## Configuración en Cloudflare Pages

### Paso 1: Crear Proyecto en Cloudflare Pages

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona tu cuenta
3. Ve a **Workers & Pages** > **Create application** > **Pages** (pestaña)
4. Haz clic en **Connect to Git**
5. Conecta tu repositorio de GitHub: `rlucasf10/TechNovaStore`
6. Selecciona el repositorio

### Paso 2: Configurar Build Settings

**Framework preset:** Next.js

**Build command:**
```bash
npm run build:pages
```

**Build output directory:**
```
.next
```

**Root directory:**
```
frontend
```

**Node.js version:**
```
20.10.0
```
(Esto se detectará automáticamente desde `.node-version`)

### Paso 3: Variables de Entorno

Agrega las siguientes variables de entorno en Cloudflare Pages:

#### Para Producción:
```
NEXT_PUBLIC_API_URL=https://api.technovastore.com
NEXT_PUBLIC_CHATBOT_URL=https://chatbot.technovastore.com
NEXT_PUBLIC_SOCKET_URL=https://chatbot.technovastore.com
NEXT_PUBLIC_APP_URL=https://technovastore.com
NODE_ENV=production
```

#### Para Preview (opcional):
```
NEXT_PUBLIC_API_URL=https://api-preview.technovastore.com
NEXT_PUBLIC_CHATBOT_URL=https://chatbot-preview.technovastore.com
NEXT_PUBLIC_SOCKET_URL=https://chatbot-preview.technovastore.com
NEXT_PUBLIC_APP_URL=https://preview.technovastore.com
NODE_ENV=production
```

### Paso 4: Configurar Branch

- **Production branch:** `main` o `master`
- **Preview branches:** `develop`, `feature/*`

### Paso 5: Desplegar

1. Haz clic en **Save and Deploy**
2. Cloudflare Pages automáticamente:
   - Clonará el repositorio
   - Instalará dependencias con `npm install`
   - Ejecutará `npm run build:pages`
   - Desplegará el contenido de `.next`

## Verificación del Despliegue

### Checklist Post-Despliegue

- [ ] El build se completa sin errores
- [ ] La página principal carga correctamente
- [ ] Las rutas dinámicas funcionan (`/productos/[id]`)
- [ ] Las imágenes se cargan correctamente
- [ ] El chatbot se conecta al backend
- [ ] Las variables de entorno están configuradas
- [ ] Los headers de seguridad están activos

### Comandos de Verificación Local

```bash
# Verificar TypeScript
npm run type-check

# Verificar build
npm run build:pages

# Verificar en modo desarrollo
npm run dev
```

## Troubleshooting

### Error: "Module not found"
- Verifica que todos los imports usen barrel exports
- Ejecuta `npm run type-check` localmente
- Revisa que no haya imports directos como `@/components/ui/Button`

### Error: "Build failed"
- Verifica que la versión de Node.js sea 20.10.0
- Asegúrate de que el comando de build sea `npm run build:pages`
- Revisa los logs de Cloudflare para errores específicos

### Error: "Page not found" en rutas dinámicas
- Verifica que `output: 'standalone'` esté en `next.config.js`
- Asegúrate de que no esté configurado `output: 'export'`

### Error: Variables de entorno no definidas
- Verifica que todas las variables empiecen con `NEXT_PUBLIC_`
- Asegúrate de configurarlas en Cloudflare Pages Dashboard
- Recuerda que necesitas redesplegar después de cambiar variables

## Estructura del Proyecto

```
frontend/
├── .next/                    # Build output (generado)
├── .node-version            # Versión de Node.js para Cloudflare
├── wrangler.toml            # Configuración de Cloudflare Pages
├── next.config.js           # Configuración de Next.js
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración de TypeScript
└── src/
    ├── app/                 # Páginas de Next.js 13+ (App Router)
    ├── components/          # Componentes React
    ├── hooks/               # Custom hooks
    ├── lib/                 # Utilidades
    ├── services/            # Servicios API
    ├── store/               # Estado global (Zustand)
    └── types/               # Tipos TypeScript
```

## Recursos Adicionales

- [Documentación de Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Next.js en Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Notas Importantes

1. **No usar `output: 'export'`**: Cloudflare Pages soporta SSR con Next.js standalone
2. **Barrel exports obligatorios**: Todos los imports deben usar `@/components/ui` no `@/components/ui/Button`
3. **Variables de entorno**: Deben empezar con `NEXT_PUBLIC_` para estar disponibles en el cliente
4. **Node.js 20.10.0**: Versión especificada en `.node-version`
5. **Build command**: Siempre usar `npm run build:pages`, no `npm run build`

## Estado Actual

✅ **Código listo para despliegue**
- Build local exitoso
- Sin errores de TypeScript
- Todos los imports corregidos
- Configuración de Cloudflare lista

🚀 **Siguiente paso**: Configurar el proyecto en Cloudflare Pages Dashboard
