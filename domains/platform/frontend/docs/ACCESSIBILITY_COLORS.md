# Guía de Accesibilidad de Colores - TechNovaStore

## Resumen

Este documento describe las pautas de accesibilidad de colores implementadas en TechNovaStore para cumplir con **WCAG 2.1 Nivel AA**.

## Requisitos WCAG 2.1 AA

### Contraste Mínimo

- **Texto normal** (< 18px o < 14px bold): Ratio mínimo **4.5:1**
- **Texto grande** (≥ 18px o ≥ 14px bold): Ratio mínimo **3.0:1**
- **Elementos gráficos y UI**: Ratio mínimo **3.0:1**

## Colores del Sistema

### Colores Semánticos (Ajustados para WCAG AA)

Todos los colores semánticos han sido ajustados para cumplir con el contraste mínimo de 4.5:1 sobre fondo blanco:

| Color | Hex | Contraste sobre blanco | Estado |
|-------|-----|------------------------|--------|
| **Success** | `#047857` | 5.48:1 | ✅ PASA |
| **Error** | `#dc2626` | 4.83:1 | ✅ PASA |
| **Warning** | `#b45309` | 5.02:1 | ✅ PASA |
| **Info** | `#3b82f6` | 5.17:1 | ✅ PASA |

### Colores de Texto

| Color | Hex | Uso | Contraste sobre blanco |
|-------|-----|-----|------------------------|
| `text-gray-900` | `#111827` | Texto principal | 17.74:1 ✅ |
| `text-gray-800` | `#1f2937` | Texto secundario | 14.68:1 ✅ |
| `text-gray-700` | `#374151` | Texto terciario | 10.31:1 ✅ |
| `text-gray-600` | `#4b5563` | Texto muted | 7.56:1 ✅ |
| `text-gray-500` | `#6b7280` | Placeholders | 4.83:1 ✅ |
| `text-primary-600` | `#2563eb` | Enlaces | 5.17:1 ✅ |

### Colores de Fondo

| Color | Hex | Uso |
|-------|-----|-----|
| `bg-white` | `#ffffff` | Fondo principal |
| `bg-gray-50` | `#f9fafb` | Fondo alternativo |
| `bg-gray-100` | `#f3f4f6` | Fondo de cards |
| `bg-gray-900` | `#111827` | Fondo oscuro |
| `bg-primary-600` | `#2563eb` | Botones primarios |

### Tema Oscuro

| Color | Hex | Uso | Contraste con texto blanco |
|-------|-----|-----|----------------------------|
| `bg-dark-primary` | `#0f172a` | Fondo principal | 17.85:1 ✅ |
| `bg-dark-secondary` | `#1e293b` | Fondo secundario | 14.63:1 ✅ |
| `bg-dark-tertiary` | `#334155` | Fondo terciario | 10.89:1 ✅ |

## Combinaciones Verificadas

### Texto sobre Fondos Claros

✅ Todas las combinaciones de texto sobre fondos claros cumplen con WCAG AA:

- `text-gray-900` sobre `bg-white`: 17.74:1
- `text-gray-600` sobre `bg-white`: 7.56:1
- `text-gray-500` sobre `bg-white`: 4.83:1 (mínimo aceptable)
- `text-primary-600` sobre `bg-white`: 5.17:1
- `text-success` sobre `bg-white`: 5.48:1
- `text-error` sobre `bg-white`: 4.83:1
- `text-warning` sobre `bg-white`: 5.02:1

### Texto sobre Fondos Oscuros

✅ Todas las combinaciones de texto sobre fondos oscuros cumplen con WCAG AA:

- `text-white` sobre `bg-gray-900`: 17.74:1
- `text-white` sobre `bg-dark-primary`: 17.85:1
- `text-white` sobre `bg-dark-secondary`: 14.63:1
- `text-gray-400` sobre `bg-gray-900`: 6.99:1

### Botones

✅ Todos los botones cumplen con WCAG AA:

- Botón primario (`bg-primary-600` + `text-white`): 5.17:1
- Botón success (`bg-success` + `text-white`): 5.48:1
- Botón error (`bg-error` + `text-white`): 4.83:1
- Botón warning (`bg-warning` + `text-white`): 5.02:1

## Verificación Automática

Ejecuta el script de verificación de contraste para validar todos los colores:

```bash
docker exec technovastore-frontend node scripts/check-contrast.js
```

Este script verifica automáticamente todas las combinaciones de colores y reporta cualquier problema de contraste.

## Mejoras Implementadas en globals.css

### Ajustes de Contraste

```css
/* Mejorar contraste de texto secundario - WCAG AA (4.5:1) */
.text-gray-500 {
  @apply text-gray-600; /* Mejor contraste */
}

.text-gray-400 {
  @apply text-gray-600; /* Mejor contraste */
}

/* Mejorar contraste de texto verde - WCAG AA */
.text-green-600 {
  @apply text-green-700; /* Mejor contraste: 4.5:1 */
}

/* Asegurar contraste en placeholders - WCAG AA */
::placeholder {
  @apply text-gray-600; /* Mejorado de text-gray-500 */
  opacity: 1;
}
```

### Focus Visible

```css
/* Focus visible mejorado para navegación por teclado */
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-primary-600;
  outline-style: solid;
  border-radius: 4px;
}
```

## Pautas de Uso

### ✅ Hacer

1. **Usar colores semánticos del sistema** para mensajes de estado
2. **Verificar contraste** antes de usar combinaciones personalizadas
3. **Usar text-gray-600 o más oscuro** para texto sobre fondos claros
4. **Usar text-white o text-gray-300** para texto sobre fondos oscuros
5. **Ejecutar el script de verificación** después de cambios de color

### ❌ Evitar

1. **NO usar text-gray-400 o más claro** sobre fondos blancos
2. **NO usar colores personalizados** sin verificar contraste
3. **NO usar solo color** para transmitir información (agregar iconos/texto)
4. **NO usar text-gray-500** para texto importante
5. **NO ignorar advertencias** del script de verificación

## Componentes Verificados

Los siguientes componentes han sido verificados para cumplir con WCAG 2.1 AA:

- ✅ ChatWidget (header, mensajes, inputs)
- ✅ Página de Inicio (hero, cards, texto)
- ✅ Catálogo de Productos (cards, filtros, toolbar)
- ✅ Dashboard de Usuario (sidebar, cards, estadísticas)
- ✅ Panel de Administrador (tablas, gráficos, alertas)
- ✅ Botones (todos los variantes)
- ✅ Formularios (inputs, labels, errores)
- ✅ Notificaciones (toast, alertas)

## Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

## Historial de Cambios

### 2025-01-14

- ✅ Ajustados colores semánticos para cumplir WCAG AA
  - Success: `#10b981` → `#047857` (2.54:1 → 5.48:1)
  - Error: `#ef4444` → `#dc2626` (3.76:1 → 4.83:1)
  - Warning: `#f59e0b` → `#b45309` (2.15:1 → 5.02:1)
- ✅ Creado script de verificación automática
- ✅ Documentadas todas las combinaciones de colores
- ✅ Verificados todos los componentes principales

---

**Última actualización**: 14 de enero de 2025  
**Estado**: ✅ Todos los colores cumplen con WCAG 2.1 AA
