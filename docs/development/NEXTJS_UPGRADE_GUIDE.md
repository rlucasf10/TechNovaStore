# Guía de Actualización de Next.js

Guía sencilla para actualizar Next.js en TechNovaStore usando los codemods oficiales.

## Versión Actual

- **Next.js**: 15.5.6
- **React**: 18.2.0

## Comando Principal de Actualización

El comando `upgrade` de Next.js ejecuta automáticamente los codemods necesarios y actualiza las dependencias:

```bash
# Dentro del contenedor del frontend
docker exec -it technovastore-frontend npx @next/codemod upgrade
```

### Opciones de Actualización

```bash
# Actualizar al último patch (ej: 15.5.6 -> 15.5.7)
docker exec -it technovastore-frontend npx @next/codemod upgrade patch

# Actualizar al último minor (ej: 15.5.6 -> 15.6.0) - Por defecto
docker exec -it technovastore-frontend npx @next/codemod upgrade minor

# Actualizar al último major (ej: 15.5.6 -> 16.0.0)
docker exec -it technovastore-frontend npx @next/codemod upgrade major

# Actualizar a una versión específica
docker exec -it technovastore-frontend npx @next/codemod upgrade 16

# Actualizar a canary
docker exec -it technovastore-frontend npx @next/codemod upgrade canary

# Ver más detalles durante la actualización
docker exec -it technovastore-frontend npx @next/codemod upgrade --verbose
```

## Codemods Individuales

Si necesitas ejecutar transformaciones específicas sin actualizar la versión:

```bash
# Sintaxis general
docker exec -it technovastore-frontend npx @next/codemod <transform> <path>

# Opciones
# --dry    Ensayo sin modificar código
# --print  Imprime los cambios para comparar
```

### Codemods para Next.js 16

```bash
# Eliminar experimental_ppr de páginas y layouts
docker exec -it technovastore-frontend npx @next/codemod@latest remove-experimental-ppr .

# Eliminar prefijo unstable_ de APIs estabilizadas
docker exec -it technovastore-frontend npx @next/codemod@latest remove-unstable-prefix .

# Migrar middleware a proxy (nueva convención)
docker exec -it technovastore-frontend npx @next/codemod@latest middleware-to-proxy .

# Migrar de next lint a ESLint CLI
docker exec -it technovastore-frontend npx @next/codemod@latest next-lint-to-eslint-cli .
```

### Codemods para Next.js 15

```bash
# Transformar runtime experimental-edge a edge
docker exec -it technovastore-frontend npx @next/codemod@latest app-dir-runtime-config-experimental-edge .

# Migrar a APIs dinámicas asíncronas (cookies, headers, draftMode)
docker exec -it technovastore-frontend npx @next/codemod@latest next-async-request-api .

# Reemplazar geo e ip de NextRequest con @vercel/functions
docker exec -it technovastore-frontend npx @next/codemod@latest next-request-geo-ip .
```

### Codemods para Next.js 14

```bash
# Migrar importaciones de ImageResponse
docker exec -it technovastore-frontend npx @next/codemod@latest next-og-import .

# Usar exportación de viewport
docker exec -it technovastore-frontend npx @next/codemod@latest metadata-to-viewport-export .
```

### Codemods para Next.js 13

```bash
# Usar fuente incorporada (next/font)
docker exec -it technovastore-frontend npx @next/codemod@latest built-in-next-font .

# Renombrar importaciones de imagen
docker exec -it technovastore-frontend npx @next/codemod@latest next-image-to-legacy-image .

# Migrar al nuevo componente de imagen
docker exec -it technovastore-frontend npx @next/codemod@latest next-image-experimental .

# Eliminar etiquetas <a> de componentes Link
docker exec -it technovastore-frontend npx @next/codemod@latest new-link .
```

## Flujo de Actualización Recomendado

### 1. Verificar Estado Actual

```bash
# Ver versión actual
docker exec technovastore-frontend npm list next

# Verificar que no hay errores de TypeScript
docker exec technovastore-frontend npx tsc --noEmit
```

### 2. Ejecutar Actualización

```bash
# Actualización automática con codemods
docker exec -it technovastore-frontend npx @next/codemod upgrade

# El comando te preguntará qué codemods aplicar
```

### 3. Reconstruir Contenedor

```bash
# Reconstruir para aplicar cambios en package.json
docker-compose -f docker-compose.optimized.yml up -d --build frontend
```

### 4. Verificar Funcionamiento

```bash
# Verificar TypeScript
docker exec technovastore-frontend npx tsc --noEmit

# Verificar que el servidor funciona
docker exec technovastore-frontend sh -c "curl -f http://localhost:3000 && echo ' OK'"

# Ver logs
docker-compose -f docker-compose.optimized.yml logs -f frontend
```

### 5. Probar la Aplicación

Abrir en el navegador:
- http://localhost:3020 (página principal)
- http://localhost:3020/productos (catálogo)

## Notas Importantes

- **Siempre hacer backup** antes de actualizar a una versión major
- El comando `upgrade` puede solicitar ejecutar codemods de React 19 si actualizas React
- Si un codemod no puede migrar automáticamente, añadirá comentarios `@next/codemod` que debes revisar manualmente
- Los typecasts con prefijo `UnsafeUnwrapped` indican código que necesita revisión manual

## Solución de Problemas

### Si la actualización falla

```bash
# Limpiar caché y node_modules
docker exec technovastore-frontend rm -rf .next node_modules/.cache

# Reinstalar dependencias
docker-compose -f docker-compose.optimized.yml up -d --build frontend
```

### Si hay errores de TypeScript después de actualizar

```bash
# Ver errores específicos
docker exec technovastore-frontend npx tsc --noEmit 2>&1 | head -50

# Buscar comentarios de codemod que requieren atención
docker exec technovastore-frontend grep -r "@next/codemod" --include="*.ts" --include="*.tsx" .
```

## Referencias

- [Documentación oficial de Codemods](https://nextjs.org/docs/pages/guides/upgrading/codemods)
- [Guía de actualización de Next.js](https://nextjs.org/docs/pages/guides/upgrading)
