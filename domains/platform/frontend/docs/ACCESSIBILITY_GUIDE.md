# Guía de Accesibilidad - TechNovaStore Frontend

## Introducción

Esta guía documenta las mejores prácticas de accesibilidad implementadas en el frontend de TechNovaStore, siguiendo las pautas **WCAG 2.1 nivel AA**.

**Requisito:** 5.1 - Textos alternativos descriptivos para todas las imágenes

## Índice

1. [Textos Alternativos para Imágenes](#textos-alternativos-para-imágenes)
2. [Captions para Videos](#captions-para-videos)
3. [Navegación por Teclado](#navegación-por-teclado)
4. [Etiquetas ARIA](#etiquetas-aria)
5. [Contraste de Colores](#contraste-de-colores)
6. [Utilidades de Accesibilidad](#utilidades-de-accesibilidad)

---

## Textos Alternativos para Imágenes

### Principios Generales

1. **Descriptivo y Conciso**: El texto alternativo debe describir el contenido y función de la imagen
2. **Longitud Recomendada**: Entre 5 y 125 caracteres
3. **Evitar Redundancia**: No usar "imagen de" o "foto de" a menos que sea relevante
4. **Imágenes Decorativas**: Usar `alt=""` para imágenes puramente decorativas

### Tipos de Imágenes

#### 1. Imágenes de Productos

**Buenas Prácticas:**
```tsx
import { getProductImageAlt } from '@/lib/accessibility';

// ✅ CORRECTO - Descriptivo y específico
<Image
  src={product.image}
  alt={getProductImageAlt(product.name, product.brand, product.category, 0)}
  // Resultado: "Laptop Dell XPS 15 de Dell - Laptops - Imagen principal"
/>

// ✅ CORRECTO - Imagen principal
<Image
  src={product.mainImage}
  alt={`${product.name} - ${product.brand}`}
  // Resultado: "Laptop Dell XPS 15 - Dell"
/>

// ❌ INCORRECTO - Demasiado genérico
<Image src={product.image} alt="Producto" />

// ❌ INCORRECTO - No descriptivo
<Image src={product.image} alt="imagen" />
```

#### 2. Miniaturas de Productos

```tsx
import { getProductThumbnailAlt } from '@/lib/accessibility';

// ✅ CORRECTO
<Image
  src={thumbnail}
  alt={getProductThumbnailAlt(product.name, index)}
  // Resultado: "Laptop Dell XPS 15 - Miniatura 2"
/>
```

#### 3. Avatares de Usuario

```tsx
import { getUserAvatarAlt } from '@/lib/accessibility';

// ✅ CORRECTO - Con contexto
<Image
  src={user.avatar}
  alt={getUserAvatarAlt(user.fullName, 'perfil')}
  // Resultado: "Foto de perfil de Juan Pérez"
/>

// ✅ CORRECTO - En comentarios
<Image
  src={user.avatar}
  alt={getUserAvatarAlt(user.fullName, 'comentario')}
  // Resultado: "Foto de comentario de Juan Pérez"
/>
```

#### 4. Imágenes de Categorías

```tsx
import { getCategoryImageAlt } from '@/lib/accessibility';

// ✅ CORRECTO - Con contador de productos
<Image
  src={category.image}
  alt={getCategoryImageAlt(category.name, category.productCount)}
  // Resultado: "Categoría Laptops - 150 productos disponibles"
/>
```

#### 5. Logos de Marcas

```tsx
import { getBrandLogoAlt } from '@/lib/accessibility';

// ✅ CORRECTO
<Image
  src={brand.logo}
  alt={getBrandLogoAlt(brand.name)}
  // Resultado: "Logo de Dell"
/>
```

#### 6. Imágenes de Reviews

```tsx
import { getReviewImageAlt } from '@/lib/accessibility';

// ✅ CORRECTO
<Image
  src={reviewImage.url}
  alt={getReviewImageAlt(product.name, review.userName, index)}
  // Resultado: "Foto de Laptop Dell XPS 15 compartida por Juan Pérez - Imagen 1"
/>
```

#### 7. Imágenes Decorativas

```tsx
import { getDecorativeImageAlt } from '@/lib/accessibility';

// ✅ CORRECTO - Imagen puramente decorativa
<Image
  src="/decorations/pattern.svg"
  alt={getDecorativeImageAlt()}
  role="presentation"
  // Resultado: alt=""
/>

// ✅ CORRECTO - Icono decorativo junto a texto
<div className="flex items-center gap-2">
  <svg aria-hidden="true">...</svg>
  <span>Texto descriptivo</span>
</div>
```

#### 8. Imágenes de Placeholder

```tsx
import { getPlaceholderImageAlt } from '@/lib/accessibility';

// ✅ CORRECTO
<Image
  src="/placeholder-product.svg"
  alt={getPlaceholderImageAlt('producto')}
  // Resultado: "Imagen de producto no disponible"
/>
```

#### 9. Banners de Campañas

```tsx
import { getCampaignBannerAlt } from '@/lib/accessibility';

// ✅ CORRECTO
<Image
  src={campaign.banner}
  alt={getCampaignBannerAlt(campaign.title, campaign.discount)}
  // Resultado: "Banner de campaña Black Friday - Hasta 50% de descuento"
/>
```

---

## Captions para Videos

### Principios Generales

1. **Siempre Incluir Captions**: Todos los videos deben tener subtítulos
2. **Formato WebVTT**: Usar formato `.vtt` para subtítulos
3. **Múltiples Idiomas**: Proporcionar captions en español e inglés como mínimo
4. **Sincronización**: Los captions deben estar sincronizados con el audio

### Implementación

```tsx
import { getVideoCaption } from '@/lib/accessibility';

// ✅ CORRECTO - Video con captions
<video controls>
  <source src="/videos/tutorial.mp4" type="video/mp4" />
  <track
    kind="captions"
    src="/videos/tutorial-es.vtt"
    srclang="es"
    label="Español"
    default
  />
  <track
    kind="captions"
    src="/videos/tutorial-en.vtt"
    srclang="en"
    label="English"
  />
  <p>
    {getVideoCaption('Tutorial de instalación', 180, 'es')}
    {/* Resultado: "Tutorial de instalación - 3:00 minutos - Español" */}
  </p>
</video>

// ❌ INCORRECTO - Sin captions
<video src="/videos/tutorial.mp4" controls />
```

### Formato de Archivo WebVTT

```vtt
WEBVTT

00:00:00.000 --> 00:00:03.000
Bienvenido al tutorial de instalación

00:00:03.000 --> 00:00:07.000
En este video aprenderás a instalar el producto

00:00:07.000 --> 00:00:12.000
Paso 1: Descargar el archivo de instalación
```

---

## Navegación por Teclado

### Principios Generales

1. **Todos los elementos interactivos** deben ser accesibles por teclado
2. **Orden lógico de tabulación** (tab order)
3. **Indicadores visuales de foco** claros y visibles
4. **Atajos de teclado** documentados

### Teclas Estándar

- **Tab**: Navegar al siguiente elemento
- **Shift + Tab**: Navegar al elemento anterior
- **Enter**: Activar botón o enlace
- **Espacio**: Activar botón o checkbox
- **Escape**: Cerrar modal o dropdown
- **Flechas**: Navegar en listas, menús, sliders

### Implementación

```tsx
// ✅ CORRECTO - Navegación por teclado en dropdown
<div
  role="listbox"
  onKeyDown={(e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectPrevious();
        break;
      case 'Enter':
        e.preventDefault();
        selectCurrent();
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
    }
  }}
>
  {/* Opciones */}
</div>

// ✅ CORRECTO - Indicador de foco visible
<button className="focus:ring-2 focus:ring-primary-500 focus:outline-none">
  Agregar al carrito
</button>
```

---

## Etiquetas ARIA

### Principios Generales

1. **Usar HTML semántico primero**: `<button>`, `<nav>`, `<main>`, etc.
2. **ARIA solo cuando sea necesario**: No abusar de atributos ARIA
3. **Roles ARIA apropiados**: `role="dialog"`, `role="navigation"`, etc.
4. **Estados ARIA**: `aria-expanded`, `aria-selected`, `aria-checked`

### Atributos ARIA Comunes

#### aria-label

```tsx
// ✅ CORRECTO - Botón sin texto visible
<button aria-label="Cerrar modal">
  <X className="w-5 h-5" />
</button>

// ✅ CORRECTO - Icono con contexto
<button aria-label="Agregar Laptop Dell XPS 15 al carrito">
  <ShoppingCart className="w-5 h-5" />
</button>
```

#### aria-labelledby

```tsx
// ✅ CORRECTO - Modal con título
<div role="dialog" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirmar eliminación</h2>
  {/* Contenido */}
</div>
```

#### aria-describedby

```tsx
// ✅ CORRECTO - Input con descripción
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-help"
  />
  <p id="email-help">Ingresa tu email para recibir notificaciones</p>
</div>
```

#### aria-expanded

```tsx
// ✅ CORRECTO - Dropdown expandible
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
  onClick={() => setIsOpen(!isOpen)}
>
  Menú
</button>
<div id="dropdown-menu" hidden={!isOpen}>
  {/* Opciones */}
</div>
```

#### aria-live

```tsx
// ✅ CORRECTO - Notificaciones en tiempo real
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {notification.message}
</div>

// ✅ CORRECTO - Alertas urgentes
<div
  role="alert"
  aria-live="assertive"
>
  {error.message}
</div>
```

---

## Contraste de Colores

### Requisitos WCAG 2.1 AA

- **Texto normal**: Contraste mínimo de **4.5:1**
- **Texto grande** (18pt+ o 14pt+ bold): Contraste mínimo de **3:1**
- **Elementos de UI**: Contraste mínimo de **3:1**

### Paleta de Colores Accesible

```css
/* ✅ CORRECTO - Contraste suficiente */
--text-primary: #111827;    /* Sobre fondo blanco: 16.1:1 */
--text-secondary: #6b7280;  /* Sobre fondo blanco: 5.7:1 */
--primary-600: #2563eb;     /* Sobre fondo blanco: 4.5:1 */

/* ❌ INCORRECTO - Contraste insuficiente */
--text-light: #d1d5db;      /* Sobre fondo blanco: 1.8:1 */
```

### Herramientas de Verificación

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- Chrome DevTools: Lighthouse Accessibility Audit

---

## Utilidades de Accesibilidad

### Importación

```tsx
import {
  getProductImageAlt,
  getProductThumbnailAlt,
  getUserAvatarAlt,
  getCategoryImageAlt,
  getBrandLogoAlt,
  getReviewImageAlt,
  getDecorativeImageAlt,
  getPlaceholderImageAlt,
  getCampaignBannerAlt,
  getActionAriaLabel,
  getQuantityControlAriaLabel,
  getNavigationAriaLabel,
  getVideoCaption,
  isValidAltText,
  getImageAccessibilityAttrs,
} from '@/lib/accessibility';
```

### Validación de Alt Text

```tsx
import { isValidAltText } from '@/lib/accessibility';

// Validar alt text antes de usar
const alt = 'Laptop Dell XPS 15';
if (!isValidAltText(alt)) {
  console.warn('Alt text no cumple con WCAG 2.1:', alt);
}
```

### Atributos Completos de Accesibilidad

```tsx
import { getImageAccessibilityAttrs } from '@/lib/accessibility';

// Obtener todos los atributos de accesibilidad
const attrs = getImageAccessibilityAttrs(
  'Laptop Dell XPS 15',
  'img',
  'Imagen principal del producto'
);

<Image
  src={product.image}
  {...attrs}
  width={600}
  height={600}
/>
```

---

## Checklist de Accesibilidad

### Antes de Hacer Commit

- [ ] Todas las imágenes tienen `alt` text descriptivo
- [ ] Los videos tienen captions en al menos español
- [ ] Los botones sin texto tienen `aria-label`
- [ ] Los modales tienen `role="dialog"` y `aria-labelledby`
- [ ] Los dropdowns tienen `aria-expanded` y `aria-controls`
- [ ] El contraste de colores cumple con WCAG 2.1 AA
- [ ] La navegación por teclado funciona correctamente
- [ ] Los estados de foco son visibles
- [ ] Los formularios tienen labels asociados
- [ ] Las notificaciones tienen `aria-live`

### Herramientas de Testing

1. **Lighthouse** (Chrome DevTools)
   - Ejecutar auditoría de accesibilidad
   - Objetivo: Puntuación > 90

2. **axe DevTools** (Extensión de navegador)
   - Detecta problemas de accesibilidad automáticamente

3. **NVDA / JAWS** (Lectores de pantalla)
   - Probar navegación con lector de pantalla

4. **Navegación por Teclado**
   - Desconectar el mouse y navegar solo con teclado

---

## Recursos Adicionales

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

---

## Contacto

Para preguntas sobre accesibilidad, contactar al equipo de frontend.

**Última actualización:** Diciembre 2025
