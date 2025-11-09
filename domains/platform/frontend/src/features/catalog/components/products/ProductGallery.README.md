# ProductGallery Component

Componente de galería de imágenes para la página de detalle de producto con funcionalidades avanzadas de visualización.

## Características Implementadas

### ✅ Requisito 8.1 y 8.4 - Galería de Imágenes Completa

#### 1. Imagen Principal Grande con Zoom
- **Vista Normal**: Imagen principal de 600x600px con aspect ratio 1:1
- **Hover**: Indicador visual "Click para ampliar" con icono de zoom
- **Click**: Abre lightbox modal fullscreen
- **Zoom 2x**: En lightbox, click adicional activa zoom 2x con seguimiento del mouse
- **Transform Origin**: El zoom se centra en la posición del cursor

#### 2. Thumbnails con Scroll Horizontal
- **Layout**: Flex horizontal con scroll suave
- **Tamaño**: 80x80px por thumbnail
- **Indicador Activo**: Border azul + ring para la imagen seleccionada
- **Hover**: Border gris en hover para feedback visual
- **Scrollbar Personalizado**: Estilo delgado y discreto (6px)
- **Responsive**: Se adapta al ancho disponible

#### 3. Lightbox con Navegación Completa
- **Modal Fullscreen**: Fondo negro semi-transparente (95% opacity)
- **Navegación por Flechas**: Botones visuales izquierda/derecha
- **Navegación por Teclado**: 
  - `←` Imagen anterior
  - `→` Imagen siguiente
  - `ESC` Cerrar lightbox
- **Click Fuera**: Cierra el lightbox al hacer click en el fondo
- **Thumbnails en Lightbox**: Navegación rápida en la parte inferior
- **Zoom en Lightbox**: Click en imagen para zoom 2x con seguimiento de mouse

#### 4. Indicador de Imagen Actual
- **Vista Normal**: Badge con "X / Y" en la parte inferior de la imagen principal
- **Lightbox**: Badge en la parte superior central
- **Siempre Visible**: Se mantiene visible en todo momento
- **Estilo**: Fondo semi-transparente con texto blanco

#### 5. Lazy Loading Optimizado
- **Primera Imagen**: `priority` y `loading="eager"` para LCP óptimo
- **Resto de Imágenes**: `loading="lazy"` para performance
- **Thumbnails**: Todas con lazy loading
- **Next.js Image**: Optimización automática de tamaño y formato

## Uso

```tsx
import { ProductGallery } from '@/components/products'

// Uso básico
<ProductGallery 
  images={[
    '/images/product-1.jpg',
    '/images/product-2.jpg',
    '/images/product-3.jpg'
  ]} 
  productName="Laptop Gaming Pro"
/>

// Con una sola imagen (sin thumbnails ni navegación)
<ProductGallery 
  images={['/images/product.jpg']} 
  productName="Mouse Inalámbrico"
/>

// Sin imágenes (muestra placeholder)
<ProductGallery 
  images={[]} 
  productName="Producto sin imágenes"
/>
```

## Props

```typescript
interface ProductGalleryProps {
  images: string[]      // Array de URLs de imágenes
  productName: string   // Nombre del producto para alt text
}
```

## Comportamiento

### Vista Normal
1. Muestra imagen principal grande
2. Thumbnails debajo con scroll horizontal (si hay más de 1 imagen)
3. Hover en imagen principal muestra flechas de navegación
4. Click en thumbnail cambia la imagen principal
5. Click en imagen principal abre lightbox

### Lightbox
1. Modal fullscreen con fondo oscuro
2. Imagen centrada con tamaño máximo 90vh
3. Click en imagen activa/desactiva zoom 2x
4. Movimiento del mouse cambia el punto de zoom
5. Flechas visuales para navegación
6. Teclado: ← → para navegar, ESC para cerrar
7. Thumbnails en la parte inferior para navegación rápida
8. Hints de teclado en la esquina inferior derecha

### Accesibilidad
- **Aria Labels**: Todos los botones tienen labels descriptivos
- **Keyboard Navigation**: Navegación completa por teclado
- **Focus Management**: Focus trap en lightbox
- **Alt Text**: Textos alternativos descriptivos para todas las imágenes
- **Screen Reader**: Anuncios de cambio de imagen

## Estilos Personalizados

### Scrollbar
```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgb(209, 213, 219) rgb(243, 244, 246);
}
```

### Zoom Scale
```css
.scale-200 {
  transform: scale(2);
}
```

## Performance

### Optimizaciones Implementadas
1. **Lazy Loading**: Solo la primera imagen se carga con prioridad
2. **Next.js Image**: Optimización automática de formato y tamaño
3. **Responsive Images**: Srcset automático para diferentes tamaños
4. **Aspect Ratio**: Previene layout shift
5. **Debounce**: Zoom con mouse optimizado

### Métricas Esperadas
- **LCP**: < 2.5s (primera imagen con priority)
- **CLS**: 0 (aspect ratio fijo)
- **FID**: < 100ms (interacciones optimizadas)

## Testing

### Página de Prueba
Visita `/test-gallery` para ver la galería en acción con:
- Múltiples imágenes (5 imágenes de ejemplo)
- Una sola imagen
- Sin imágenes (placeholder)

### Casos de Prueba
1. ✅ Navegación con flechas visuales
2. ✅ Navegación con teclado (← →)
3. ✅ Zoom en lightbox
4. ✅ Cierre con ESC
5. ✅ Cierre con click fuera
6. ✅ Scroll horizontal de thumbnails
7. ✅ Cambio de imagen con thumbnails
8. ✅ Indicador de imagen actual
9. ✅ Lazy loading de imágenes
10. ✅ Responsive en móvil

## Integración

### ProductDetail Component
El componente ya está integrado en `ProductDetail.tsx`:

```tsx
<ProductGallery images={product.images} productName={product.name} />
```

### Rutas de Producto
La galería se muestra automáticamente en:
- `/productos/[id]` - Página de detalle de producto

## Mejoras Futuras (Opcional)

### Posibles Extensiones
1. **Zoom con Pinch**: Soporte para gestos táctiles en móvil
2. **Fullscreen API**: Modo fullscreen nativo del navegador
3. **Compartir Imagen**: Botón para compartir imagen específica
4. **Descargar Imagen**: Opción de descarga de imagen en alta resolución
5. **Video Support**: Soporte para videos en la galería
6. **360° View**: Vista 360 grados del producto
7. **AR Preview**: Vista en realidad aumentada

## Notas Técnicas

### Estado del Componente
```typescript
const [selectedImage, setSelectedImage] = useState(0)      // Índice de imagen actual
const [isLightboxOpen, setIsLightboxOpen] = useState(false) // Estado del lightbox
const [isZoomed, setIsZoomed] = useState(false)            // Estado del zoom
const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 }) // Posición del zoom
```

### Refs Utilizados
```typescript
const imageRef = useRef<HTMLDivElement>(null)              // Ref de la imagen principal
const thumbnailContainerRef = useRef<HTMLDivElement>(null) // Ref del contenedor de thumbnails
```

### Efectos
1. **Keyboard Listener**: Escucha ESC para cerrar lightbox
2. **Body Scroll Lock**: Previene scroll del body cuando lightbox está abierto
3. **Keyboard Navigation**: Escucha ← → para navegar en lightbox

## Compatibilidad

### Navegadores Soportados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dispositivos
- ✅ Desktop (1024px+)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (< 768px)

## Dependencias

- `next/image` - Optimización de imágenes
- `react` - Hooks (useState, useEffect, useRef)
- `tailwindcss` - Estilos utility-first

## Autor

Implementado como parte de la Tarea 19.1 del spec `frontend-redesign-spectacular`.

## Referencias

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WCAG 2.1 Image Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)
- [Web Vitals](https://web.dev/vitals/)
