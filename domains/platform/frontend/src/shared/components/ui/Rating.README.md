# Rating Component

Componente de calificación con estrellas para mostrar y capturar ratings de productos.

## Características

- ⭐ **Estrellas llenas, medias y vacías**: Soporta valores decimales con visualización precisa
- 🖱️ **Modo interactivo y solo lectura**: Puede usarse para mostrar ratings o capturar input del usuario
- 📏 **Tres tamaños**: sm, md, lg
- 🔢 **Valor numérico opcional**: Muestra el rating numérico junto a las estrellas
- 📊 **Contador de reviews**: Opcionalmente muestra el número de reviews
- 🎯 **Precisión configurable**: Soporta enteros (1), medias estrellas (0.5) o decimales (0.1)
- ♿ **Accesible**: Incluye etiquetas ARIA y navegación por teclado
- 🎨 **Personalizable**: Clases CSS adicionales y estilos consistentes con el design system

## Uso Básico

```tsx
import { Rating } from '@/components/ui/Rating'

// Rating de solo lectura
<Rating value={4.5} readOnly />

// Rating interactivo
<Rating 
  value={rating} 
  onChange={setRating}
/>

// Rating con valor numérico y contador
<Rating 
  value={4.3} 
  readOnly 
  showValue 
  reviewCount={1234}
/>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `number` | - | **Requerido**. Valor del rating (0-5) |
| `onChange` | `(value: number) => void` | - | Callback cuando el usuario cambia el rating |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del componente |
| `readOnly` | `boolean` | `false` | Si es true, el rating no es interactivo |
| `showValue` | `boolean` | `false` | Muestra el valor numérico junto a las estrellas |
| `reviewCount` | `number` | - | Número de reviews (se muestra junto al valor) |
| `precision` | `1 \| 0.5 \| 0.1` | `0.5` | Precisión del rating |
| `className` | `string` | - | Clases CSS adicionales |

## Ejemplos de Uso

### 1. Rating de Solo Lectura

Usado para mostrar ratings existentes en ProductCard o ProductDetail:

```tsx
<Rating value={4.5} readOnly />
```

### 2. Rating con Valor Numérico

Muestra el rating numérico junto a las estrellas:

```tsx
<Rating value={4.3} readOnly showValue />
// Muestra: ⭐⭐⭐⭐⭐ 4.3
```

### 3. Rating con Contador de Reviews

Ideal para páginas de productos:

```tsx
<Rating 
  value={4.7} 
  readOnly 
  showValue 
  reviewCount={1234}
/>
// Muestra: ⭐⭐⭐⭐⭐ 4.7 (1,234 reviews)
```

### 4. Rating Interactivo

Permite al usuario seleccionar un rating:

```tsx
const [rating, setRating] = useState(0)

<Rating 
  value={rating} 
  onChange={setRating}
  size="lg"
/>
```

### 5. Rating con Precisión de Enteros

Solo permite valores enteros (1, 2, 3, 4, 5):

```tsx
<Rating 
  value={rating} 
  onChange={setRating}
  precision={1}
/>
```

### 6. Diferentes Tamaños

```tsx
<Rating value={4.5} readOnly size="sm" />  // Pequeño
<Rating value={4.5} readOnly size="md" />  // Mediano (default)
<Rating value={4.5} readOnly size="lg" />  // Grande
```

## Casos de Uso

### ProductCard

```tsx
<div className="product-card">
  <img src={product.image} alt={product.name} />
  <h3>{product.name}</h3>
  <Rating 
    value={product.rating} 
    readOnly 
    showValue 
    reviewCount={product.reviewCount}
    size="sm"
  />
  <p className="price">{formatPrice(product.price)}</p>
</div>
```

### ProductDetail

```tsx
<div className="product-detail">
  <h1>{product.name}</h1>
  <div className="rating-section">
    <Rating 
      value={product.rating} 
      readOnly 
      showValue 
      reviewCount={product.reviewCount}
      size="md"
    />
    <a href="#reviews">Ver todas las reviews</a>
  </div>
  <p className="price">{formatPrice(product.price)}</p>
</div>
```

### Formulario de Review

```tsx
const [userRating, setUserRating] = useState(0)

<form onSubmit={handleSubmit}>
  <div>
    <label>Tu calificación</label>
    <Rating 
      value={userRating} 
      onChange={setUserRating}
      size="lg"
    />
  </div>
  <textarea placeholder="Escribe tu review..." />
  <button type="submit">Publicar Review</button>
</form>
```

## Comportamiento Interactivo

Cuando `readOnly={false}` y se proporciona `onChange`:

- **Click**: Establece el rating basado en la posición del click
- **Hover**: Muestra preview del rating mientras el usuario mueve el mouse
- **Precisión 0.5**: Click en la mitad izquierda = media estrella, derecha = estrella completa
- **Precisión 1**: Siempre establece estrellas completas
- **Precisión 0.1**: Permite valores decimales precisos

## Accesibilidad

- ✅ Etiquetas ARIA descriptivas
- ✅ Roles semánticos (`role="img"`)
- ✅ Navegación por teclado (cuando es interactivo)
- ✅ Estados visuales claros (hover, active)
- ✅ Contraste de colores adecuado

## Estilos

El componente usa:
- **Estrellas llenas**: `text-yellow-400` (amarillo)
- **Estrellas vacías**: `text-gray-300` (gris claro)
- **Gradientes**: Para medias estrellas y valores decimales
- **Transiciones**: Suaves en hover y cambios de estado

## Notas Técnicas

- El valor se normaliza automáticamente entre 0 y 5
- Usa SVG para las estrellas (mejor calidad y escalabilidad)
- Implementa gradientes lineales para medias estrellas
- Optimizado para performance (sin re-renders innecesarios)
- Compatible con SSR (Next.js)

## Requisitos Cumplidos

- ✅ **7.1**: Implementado para catálogo de productos
- ✅ **8.1**: Implementado para página de detalle de producto
- ✅ Estrellas llenas, medias y vacías
- ✅ Modo interactivo y solo lectura
- ✅ Tres tamaños (sm, md, lg)
- ✅ Valor numérico opcional
- ✅ Contador de reviews opcional
- ✅ Precisión configurable
