# Guía Paso a Paso: Configurar Cloudflare Pages

## ⚠️ PROBLEMA ACTUAL

Has creado un **Worker** en lugar de un **Pages project**. Necesitas eliminarlo y crear uno nuevo.

## Paso 1: Eliminar el Worker Actual

1. Ve a https://dash.cloudflare.com/
2. Selecciona tu cuenta
3. En el menú lateral, haz clic en **Workers & Pages**
4. Busca "technovastore" en la lista
5. Haz clic en el proyecto
6. Ve a **Settings** (Configuración)
7. Scroll hasta el final
8. Haz clic en **Delete** (Eliminar)
9. Confirma la eliminación

## Paso 2: Crear un Nuevo Proyecto de Pages

### 2.1 Iniciar Creación

1. Ve a https://dash.cloudflare.com/
2. Selecciona tu cuenta
3. En el menú lateral, haz clic en **Workers & Pages**
4. Haz clic en **Create application** (Crear aplicación)
5. **IMPORTANTE**: Selecciona la pestaña **Pages** (NO Workers)
6. Haz clic en **Connect to Git**

### 2.2 Conectar Repositorio

1. Selecciona **GitHub** como proveedor
2. Si es la primera vez, autoriza Cloudflare a acceder a GitHub
3. Busca y selecciona el repositorio: `rlucasf10/TechNovaStore`
4. Haz clic en **Begin setup**

### 2.3 Configurar Build

En la página de configuración, ingresa los siguientes valores:

**Project name:**
```
technovastore
```

**Production branch:**
```
develop
```
(o `main` si prefieres)

**Framework preset:**
```
Next.js
```

**Build command:**
```
npm run build:pages
```

**Build output directory:**
```
.next
```

**Root directory (advanced):**
```
frontend
```

### 2.4 Variables de Entorno

Haz clic en **Environment variables (advanced)** y agrega las siguientes:

#### Para Production:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://api.technovastore.com` |
| `NEXT_PUBLIC_CHATBOT_URL` | `https://chatbot.technovastore.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://chatbot.technovastore.com` |
| `NEXT_PUBLIC_APP_URL` | `https://technovastore.com` |

**IMPORTANTE**: Asegúrate de seleccionar **Production** en el dropdown de cada variable.

### 2.5 Iniciar Despliegue

1. Revisa que toda la configuración sea correcta
2. Haz clic en **Save and Deploy**
3. Cloudflare comenzará a construir tu aplicación

## Paso 3: Monitorear el Build

1. Serás redirigido a la página de build
2. Verás el log en tiempo real
3. El build debería tomar entre 2-5 minutos
4. Si todo está correcto, verás: ✅ **Success**

## Paso 4: Verificar el Despliegue

Una vez completado el build:

1. Cloudflare te mostrará la URL de tu sitio: `https://technovastore.pages.dev`
2. Haz clic en la URL para visitar tu sitio
3. Verifica que:
   - La página principal carga
   - Las imágenes se muestran
   - La navegación funciona
   - No hay errores en la consola del navegador

## Configuración Adicional (Opcional)

### Configurar Dominio Personalizado

1. En el dashboard del proyecto, ve a **Custom domains**
2. Haz clic en **Set up a custom domain**
3. Ingresa tu dominio: `technovastore.com`
4. Sigue las instrucciones para configurar los DNS

### Configurar Preview Deployments

1. Ve a **Settings** > **Builds & deployments**
2. En **Preview deployments**, selecciona:
   - ✅ Enable preview deployments
   - Branch pattern: `develop`, `feature/*`
3. Guarda los cambios

### Configurar Build Cache

1. Ve a **Settings** > **Builds & deployments**
2. En **Build cache**, asegúrate de que esté:
   - ✅ Enabled
3. Si hay problemas, puedes hacer clic en **Clear cache**

## Troubleshooting

### Error: "Module not found"

**Causa**: Cloudflare no puede resolver los imports de TypeScript.

**Solución**:
1. Verifica que el **Root directory** sea `frontend`
2. Verifica que el **Build command** sea `npm run build:pages`
3. Limpia el cache: Settings > Builds & deployments > Clear cache
4. Vuelve a desplegar: Deployments > Retry deployment

### Error: "Build failed"

**Causa**: Error durante la compilación.

**Solución**:
1. Revisa el log completo del build
2. Busca el error específico
3. Verifica que el build funcione localmente:
   ```bash
   cd frontend
   npm run build:pages
   ```
4. Si funciona localmente pero no en Cloudflare, puede ser un problema de versión de Node.js

### Error: "Page not found" (404)

**Causa**: Next.js no está configurado correctamente para SSR.

**Solución**:
1. Verifica que `next.config.js` tenga `output: 'standalone'`
2. NO debe tener `output: 'export'`
3. Vuelve a desplegar

### Error: Variables de entorno no definidas

**Causa**: Las variables no están configuradas en Cloudflare.

**Solución**:
1. Ve a **Settings** > **Environment variables**
2. Verifica que todas las variables estén configuradas
3. Asegúrate de que estén en el entorno correcto (Production/Preview)
4. Vuelve a desplegar después de cambiar variables

## Comandos Útiles

### Verificar Build Localmente

```bash
cd frontend
npm run type-check
npm run build:pages
```

### Ver Logs de Cloudflare

```bash
# Instalar Wrangler CLI (opcional)
npm install -g wrangler

# Ver logs en tiempo real
wrangler pages deployment tail
```

## Recursos

- [Documentación de Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Next.js en Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Variables de Entorno](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Custom Domains](https://developers.cloudflare.com/pages/platform/custom-domains/)

## Checklist Final

Antes de considerar el despliegue completo, verifica:

- [ ] El proyecto es de tipo **Pages** (no Worker)
- [ ] El build se completa sin errores
- [ ] La URL de Pages funciona: `https://technovastore.pages.dev`
- [ ] Todas las páginas cargan correctamente
- [ ] Las imágenes se muestran
- [ ] El chatbot se conecta (si aplica)
- [ ] No hay errores en la consola del navegador
- [ ] Las variables de entorno están configuradas
- [ ] El dominio personalizado está configurado (si aplica)

## Próximos Pasos

Una vez que el despliegue funcione:

1. Configurar dominio personalizado
2. Configurar SSL/TLS
3. Configurar CDN y cache
4. Configurar analytics
5. Configurar Web Analytics de Cloudflare
6. Configurar alertas de uptime

---

**Última actualización**: Noviembre 2025
**Versión de Node.js**: 20.10.0
**Framework**: Next.js 15.5.6
