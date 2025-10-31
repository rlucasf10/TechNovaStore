# Sistema de Diseño - TechNovaStore

Este documento describe el sistema de diseño completo del frontend de TechNovaStore, incluyendo colores, tipografía, espaciado y componentes base.

**Requisitos cumplidos**: 21.1, 21.2, 21.3, 21.4

## 📋 Tabla de Contenidos

- [Colores](#colores)
- [Tipografía](#tipografía)
- [Espaciado](#espaciado)
- [Breakpoints Responsivos](#breakpoints-responsivos)
- [Sombras](#sombras)
- [Bordes](#bordes)
- [Animaciones](#animaciones)
- [Accesibilidad](#accesibilidad)
- [Uso](#uso)

## 🎨 Colores

### Colores Primarios (Azul)

Usados para acciones principales, enlaces y elementos destacados.

```css
--color-primary-50: #eff6ff   /* Muy claro - fondos */
--color-primary-100: #dbeafe  /* Claro - fondos hover */
--color-primary-500: #3b82f6  /* Principal - botones, enlaces */
--color-primary-600: #2563eb  /* Hover - estados interactivos */
--color-primary-700: #1d4ed8  /* Activo - estados presionados */
```

**Uso en Tailwind**: `bg-primary-500`, `text-primary-600`, `border-primary-500`

### Colores de Acento (Púrpura)

Usados para CTAs especiales y elementos destacados secundarios.

```css
--color-accent-500: #8b5cf6   /* Principal */
--color-accent-600: #7c3aed   /* Hover */
```

**Uso en Tailwind**: `bg-accent-500`, `text-accent-600`

### Colores Neutros (Grises)

Usados para texto, fondos y bordes.

```css
--color-gray-50: #f9fafb      /* Fondo claro */
--color-gray-100: #f3f4f6     /* Fondo alternativo */
--color-gray-200: #e5e7eb     /* Bordes */
--color-gray-500: #6b7280     /* Texto secundario */
--color-gray-900: #111827     /* Texto principal */
```

**Uso en Tailwind**: `bg-gray-50`, `text-gray-900`, `border-gray-200`

### Colores Semánticos

Usados para feedback y estados del sistema.

```css
--color-success: #10b981      /* Verde - éxito */
--color-warning: #f59e0b      /* Amarillo - advertencia */
--color-error: #ef4444        /* Rojo - error */
--color-info: #3b82f6         /* Azul - información */
```

**Uso en Tailwind**: `bg-success`, `text-error`, `border-warning`

### Tema Oscuro

El tema oscuro se activa con la clase `.dark` en el elemento `<html>`.

```css
.dark {
  --color-dark-bg-primary: #0f172a     /* Fondo principal */
  --color-dark-bg-secondary: #1e293b   /* Fondo secundario */
  --color-dark-text-primary: #f1f5f9   /* Texto principal */
  --color-dark-text-secondary: #cbd5e1 /* Texto secundario */
}
```

**Uso en Tailwind**: `dark:bg-dark-bg-primary`, `dark:text-dark-text-primary`

## 📝 Tipografía

### Familias de Fuentes

```css
--font-sans: 'Inter', system-ui, sans-serif      /* Principal */
--font-mono: 'JetBrains Mono', monospace         /* Código */
--font-display: 'Inter', system-ui, sans-serif   /* Títulos */
```

**Uso en Tailwind**: `font-sans`, `font-mono`

### Escala Tipográfica

| Tamaño | CSS Variable | Valor | Uso |
|--------|-------------|-------|-----|
| xs | `--text-xs` | 12px | Etiquetas pequeñas, metadatos |
| sm | `--text-sm` | 14px | Texto secundario, captions |
| base | `--text-base` | 16px | Texto principal del cuerpo |
| lg | `--text-lg` | 18px | Texto destacado |
| xl | `--text-xl` | 20px | Subtítulos pequeños |
| 2xl | `--text-2xl` | 24px | Subtítulos |
| 3xl | `--text-3xl` | 30px | Títulos de sección |
| 4xl | `--text-4xl` | 36px | Títulos principales |
| 5xl | `--text-5xl` | 48px | Hero titles |

**Uso en Tailwind**: `text-xs`, `text-base`, `text-4xl`

### Pesos de Fuente

```css
--font-normal: 400      /* Texto normal */
--font-medium: 500      /* Texto medio */
--font-semibold: 600    /* Texto semi-negrita */
--font-bold: 700        /* Texto negrita */
```

**Uso en Tailwind**: `font-normal`, `font-semibold`, `font-bold`

## 📏 Espaciado

Sistema de espaciado basado en **4px** (0.25rem).

| Variable | Valor | Píxeles | Uso |
|----------|-------|---------|-----|
| `--space-1` | 0.25rem | 4px | Espaciado mínimo |
| `--space-2` | 0.5rem | 8px | Espaciado pequeño |
| `--space-3` | 0.75rem | 12px | Espaciado compacto |
| `--space-4` | 1rem | 16px | Espaciado base |
| `--space-6` | 1.5rem | 24px | Espaciado medio |
| `--space-8` | 2rem | 32px | Espaciado grande |
| `--space-12` | 3rem | 48px | Espaciado muy grande |
| `--space-16` | 4rem | 64px | Espaciado extra grande |
| `--space-24` | 6rem | 96px | Espaciado masivo |

**Uso en Tailwind**: `p-4`, `m-6`, `gap-8`, `space-y-4`

## 📱 Breakpoints Responsivos

Sistema Mobile-First con breakpoints definidos.

| Breakpoint | Valor | Dispositivo |
|------------|-------|-------------|
| `xs` | 475px | Móvil pequeño |
| `sm` | 640px | Móvil grande |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeño |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop grande |

**Uso en Tailwind**: 
```jsx
<div className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4">
  {/* Responsive width */}
</div>
```

### Estrategia Mobile-First

Siempre diseñar primero para móvil y luego agregar estilos para pantallas más grandes:

```jsx
// ✅ Correcto (Mobile-First)
<div className="text-sm md:text-base lg:text-lg">

// ❌ Incorrecto (Desktop-First)
<div className="text-lg md:text-base sm:text-sm">
```

## 🌑 Sombras

| Variable | Uso |
|----------|-----|
| `--shadow-sm` | Sombra sutil para cards |
| `--shadow-base` | Sombra estándar |
| `--shadow-md` | Sombra media para elementos elevados |
| `--shadow-lg` | Sombra grande para modales |
| `--shadow-xl` | Sombra extra grande para overlays |
| `--shadow-2xl` | Sombra masiva para elementos flotantes |

**Uso en Tailwind**: `shadow-sm`, `shadow-md`, `shadow-lg`

## 🔲 Bordes Redondeados

| Variable | Valor | Uso |
|----------|-------|-----|
| `--radius-sm` | 4px | Bordes sutiles |
| `--radius-base` | 6px | Bordes estándar |
| `--radius-md` | 8px | Bordes medios (cards) |
| `--radius-lg` | 12px | Bordes grandes (botones) |
| `--radius-xl` | 16px | Bordes extra grandes |
| `--radius-2xl` | 24px | Bordes muy grandes |
| `--radius-full` | 9999px | Círculos perfectos |

**Uso en Tailwind**: `rounded-md`, `rounded-lg`, `rounded-full`

## ✨ Animaciones

### Duraciones de Transición

```css
--transition-fast: 150ms    /* Transiciones rápidas */
--transition-base: 200ms    /* Transiciones estándar */
--transition-slow: 300ms    /* Transiciones lentas */
--transition-slower: 500ms  /* Transiciones muy lentas */
```

### Animaciones Predefinidas

| Animación | Uso |
|-----------|-----|
| `animate-fade-in` | Aparecer con fade |
| `animate-slide-up` | Deslizar hacia arriba |
| `animate-slide-down` | Deslizar hacia abajo |
| `animate-slide-in-right` | Deslizar desde la derecha |
| `animate-pulse-subtle` | Pulso sutil |
| `animate-shimmer` | Efecto shimmer (skeleton) |

**Uso en Tailwind**: `animate-fade-in`, `animate-slide-up`

## ♿ Accesibilidad

### Contraste de Colores (WCAG 2.1)

- **Texto normal**: Contraste mínimo de **4.5:1** (AA)
- **Texto grande**: Contraste mínimo de **3:1** (AA)
- **Contraste mejorado**: **7:1** (AAA)

Todos los colores del sistema cumplen con WCAG 2.1 nivel AA.

### Tamaños Mínimos de Elementos Interactivos

```css
--min-touch-size: 44px   /* Tamaño mínimo para táctil (WCAG) */
--min-click-size: 24px   /* Tamaño mínimo para click */
```

**Regla**: Todos los botones, enlaces y elementos interactivos deben tener al menos 44x44px en móvil.

### Focus Visible

Todos los elementos interactivos tienen un outline visible al recibir foco por teclado:

```css
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

## 🚀 Uso

### En CSS/SCSS

```css
.mi-componente {
  color: var(--color-primary-500);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}
```

### En Tailwind CSS

```jsx
<button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
  Botón Primario
</button>
```

### En TypeScript/JavaScript

```typescript
import { themeConfig } from '@/lib/theme.config';

// Obtener valores del tema
const primaryColor = themeConfig.colors.primary[500];
const spacing = themeConfig.spacing[4];

// Helpers
import { isDarkMode, toggleDarkMode, initializeTheme } from '@/lib/theme.config';

// Inicializar tema al cargar la app
initializeTheme();

// Alternar tema oscuro
toggleDarkMode();

// Verificar si está en modo oscuro
if (isDarkMode()) {
  console.log('Modo oscuro activo');
}
```

## 📦 Archivos del Sistema de Diseño

- **`tailwind.config.js`**: Configuración principal de Tailwind CSS
- **`src/styles/variables.css`**: Variables CSS personalizadas
- **`src/lib/theme.config.ts`**: Configuración TypeScript del tema
- **`src/app/globals.css`**: Estilos globales y utilidades

## 🎯 Mejores Prácticas

1. **Usar variables CSS** para valores que puedan cambiar dinámicamente (tema oscuro)
2. **Usar Tailwind** para estilos estáticos y componentes
3. **Mobile-First**: Siempre diseñar primero para móvil
4. **Accesibilidad**: Verificar contraste y tamaños mínimos
5. **Consistencia**: Usar siempre los valores del sistema de diseño
6. **Performance**: Preferir `transform` y `opacity` para animaciones

## 🔄 Actualización del Sistema

Para actualizar el sistema de diseño:

1. Modificar `tailwind.config.js` para cambios en Tailwind
2. Modificar `src/styles/variables.css` para variables CSS
3. Modificar `src/lib/theme.config.ts` para configuración TypeScript
4. Actualizar esta documentación

## 📚 Referencias

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Inter Font](https://rsms.me/inter/)
- [JetBrains Mono Font](https://www.jetbrains.com/lp/mono/)
