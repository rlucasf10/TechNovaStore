# Error de CSS con Tailwind v4 + Next.js 16 + Turbopack

## Resumen del Problema

**Fecha:** 15 de diciembre de 2024  
**Versión de Next.js:** 16.0.10 (Turbopack)  
**Versión de Tailwind CSS:** v4  
**Entorno:** Docker (docker-compose.optimized.yml)

### Síntoma

El frontend no compilaba y mostraba el siguiente error:

```
⨯ ./src/app/globals.css:4401:27
Parsing CSS source code failed

> 4401 | .dark .hover\:bg-gray-100:hoverbutton,
       |                           ^
4402 |   .dark .hover\:bg-gray-100:hovera {
4403 |     background-color: #334155 !important;
4404 |     color: #f1f5f9 !important;

'hoverbutton' is not recognized as a valid pseudo-class. 
Did you mean '::hoverbutton' (pseudo-element) or is this a typo?
```

## Causa Raíz

**Selectores CSS incompatibles con Tailwind CSS v4 + Turbopack:**

Los siguientes selectores en `globals.css` causaban el error:

```css
/* ❌ INCORRECTO - Causa error de parsing */
.dark button.bg-gray-100,
.dark button.bg-gray-200,
.dark a.bg-gray-100,
.dark a.bg-gray-200 {
  background-color: #334155 !important;
  color: #f1f5f9 !important;
}

.dark button.bg-gray-100:hover,
.dark button.bg-gray-200:hover,
.dark a.bg-gray-100:hover,
.dark a.bg-gray-200:hover {
  background-color: #475569 !important;
}
```

### ¿Por qué falla?

Tailwind CSS v4 con Turbopack (Next.js 16) **no puede procesar correctamente selectores que combinan**:
1. Selectores de elemento (`button`, `a`)
2. Clases de utilidad de Tailwind (`.bg-gray-100`)
3. Pseudo-clases (`:hover`)

El parser CSS de Turbopack genera selectores mal formados como `.hover\:bg-gray-100:hoverbutton` en lugar de `.hover\:bg-gray-100:hover button`.

## Solución

### 1. Eliminar los selectores problemáticos

```css
/* ✅ CORRECTO - Eliminado del CSS global */
/* ELIMINADO: Selectores button.bg-gray-* y a.bg-gray-* causan error en Tailwind v4 + Turbopack */
/* Usar dark:bg-slate-700 dark:hover:bg-slate-600 directamente en los componentes */
```

### 2. Aplicar estilos directamente en los componentes

En lugar de CSS global, usar las variantes de Tailwind directamente en los componentes:

```tsx
// ❌ ANTES: Dependía de CSS global
<button className="bg-gray-100">
  Click me
</button>

// ✅ DESPUÉS: Estilos directos con variantes dark:
<button className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">
  Click me
</button>
```

## Proceso de Diagnóstico

### Metodología de División en Bloques

Para identificar el selector problemático, se dividió el archivo `globals.css` en 7 bloques:

1. **BLOQUE 1:** Base + Tailwind + estilos básicos ✅
2. **BLOQUE 2:** Tema oscuro - fondos, textos, bordes ✅
3. **BLOQUE 3:** Tema oscuro - inputs, botones, cards ❌ **FALLO AQUÍ**
   - **3A:** Cards ✅
   - **3B:** Inputs ✅
   - **3C:** Checkboxes ✅
   - **3D:** Botones ❌ **CULPABLE**
4. **BLOQUE 4:** Tema oscuro - componentes UI
5. **BLOQUE 5:** Tema oscuro - colores semánticos
6. **BLOQUE 6:** Accesibilidad
7. **BLOQUE 7:** Components y utilities

### Comando de Reconstrucción

```bash
# Reconstruir sin caché para aplicar cambios
docker-compose -f docker-compose.optimized.yml build --no-cache frontend
docker-compose -f docker-compose.optimized.yml up -d frontend

# Ver logs en tiempo real
docker logs technovastore-frontend --follow
```

## Reglas para Evitar este Error

### ❌ NO HACER

```css
/* NO combinar selectores de elemento con clases de Tailwind */
.dark button.bg-gray-100 { }
.dark a.bg-primary-500 { }
.dark div.flex { }

/* NO intentar sobrescribir hover de Tailwind desde CSS global */
.dark button.bg-gray-100:hover { }
.dark .hover\:bg-gray-100 { }
```

### ✅ HACER

```css
/* SÍ usar clases personalizadas específicas */
.dark .btn-secondary {
  background-color: #334155;
  color: #f1f5f9;
}

.dark .btn-secondary:hover {
  background-color: #475569;
}
```

```tsx
// SÍ usar variantes de Tailwind directamente en componentes
<button className="dark:bg-slate-700 dark:hover:bg-slate-600">
  Click me
</button>
```

## Archivos Modificados

### Archivo Principal
- `domains/platform/frontend/src/app/globals.css` - Eliminados selectores problemáticos

### Archivos de Diagnóstico (Temporales)
- `domains/platform/frontend/src/app/css-blocks/BLOQUE-1-base.css`
- `domains/platform/frontend/src/app/css-blocks/BLOQUE-2-dark-fondos-textos.css`
- `domains/platform/frontend/src/app/css-blocks/BLOQUE-3A-cards.css`
- `domains/platform/frontend/src/app/css-blocks/BLOQUE-3B-inputs.css`
- `domains/platform/frontend/src/app/css-blocks/BLOQUE-3C-checkboxes.css`
- `domains/platform/frontend/src/app/css-blocks/BLOQUE-3D-botones.css`
- `domains/platform/frontend/src/app/css-blocks/BLOQUE-3D-botones-FIXED.css` ✅

### Backup
- `domains/platform/frontend/src/app/globals.css.bk` - Archivo original corregido

## Lecciones Aprendidas

1. **Tailwind CSS v4 + Turbopack es más estricto** con los selectores CSS que versiones anteriores
2. **No mezclar selectores de elemento con clases de utilidad** en CSS global
3. **Usar variantes de Tailwind** (`dark:`, `hover:`, etc.) directamente en componentes
4. **Dividir archivos grandes** en bloques para diagnóstico facilita encontrar errores
5. **Reconstruir sin caché** es esencial para aplicar cambios en CSS con Docker

## Referencias

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Next.js 16 Turbopack](https://nextjs.org/docs/architecture/turbopack)
- [CSS Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)

## Contacto

Si encuentras un error similar, revisa:
1. Selectores que combinen elementos HTML con clases de Tailwind
2. Intentos de sobrescribir clases `hover:*` desde CSS global
3. Logs de Docker para identificar el selector exacto que falla

---

**Última actualización:** 15 de diciembre de 2024  
**Estado:** ✅ Resuelto
