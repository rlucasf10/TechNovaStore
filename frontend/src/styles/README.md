# Sistema de Estilos - TechNovaStore

Esta carpeta contiene el sistema de diseño completo del frontend, incluyendo estilos globales, variables CSS y configuración del tema.

**Requisitos cumplidos**: 21.1, 21.2, 21.3, 21.4

## 📁 Archivos

- **`variables.css`** - Variables CSS personalizadas para tema claro y oscuro
- **`DESIGN_SYSTEM.md`** - Documentación completa del sistema de diseño
- **`examples.tsx`** - Ejemplos de uso de componentes con el sistema de diseño
- **`README.md`** - Este archivo

## 🎨 Sistema de Diseño

El sistema de diseño incluye:

### Colores
- **Primarios (Azul)**: Para acciones principales y elementos destacados
- **Acento (Púrpura)**: Para CTAs especiales
- **Neutros (Grises)**: Para texto, fondos y bordes
- **Semánticos**: Success, Warning, Error, Info
- **Tema Oscuro**: Paleta completa para modo oscuro

### Tipografía
- **Fuentes**: Inter (sans-serif), JetBrains Mono (monospace)
- **Escala**: xs (12px) a 5xl (48px)
- **Pesos**: Normal (400), Medium (500), Semibold (600), Bold (700)

### Espaciado
- Sistema basado en **4px** (0.25rem)
- Desde `--space-1` (4px) hasta `--space-32` (128px)

### Breakpoints Responsivos
- **xs**: 475px (Móvil pequeño)
- **sm**: 640px (Móvil grande)
- **md**: 768px (Tablet)
- **lg**: 1024px (Desktop pequeño)
- **xl**: 1280px (Desktop)
- **2xl**: 1536px (Desktop grande)

### Otros Elementos
- Sombras (sm, md, lg, xl, 2xl)
- Bordes redondeados (sm, md, lg, xl, 2xl)
- Animaciones y transiciones
- Z-index para capas

## 🚀 Uso

### En CSS
```css
.mi-componente {
  color: var(--color-primary-500);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

### En Tailwind
```jsx
<button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg">
  Botón
</button>
```

### En TypeScript
```typescript
import { themeConfig, toggleDarkMode } from '@/lib/theme.config';

// Obtener valores
const color = themeConfig.colors.primary[500];

// Alternar tema oscuro
toggleDarkMode();
```

## 📚 Documentación

Para más detalles, consulta:
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Documentación completa
- **[examples.tsx](./examples.tsx)** - Ejemplos de código

## ♿ Accesibilidad

El sistema cumple con **WCAG 2.1 nivel AA**:
- Contraste mínimo de 4.5:1 para texto normal
- Contraste mínimo de 3:1 para texto grande
- Tamaño mínimo de 44x44px para elementos táctiles
- Focus visible en todos los elementos interactivos

## 🔗 Archivos Relacionados

- **`tailwind.config.js`** (raíz del proyecto) - Configuración de Tailwind
- **`src/lib/theme.config.ts`** - Configuración TypeScript del tema
- **`src/app/globals.css`** - Estilos globales de la aplicación
