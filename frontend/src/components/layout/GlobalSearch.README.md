# GlobalSearch Component

Componente de búsqueda global con autocompletado inteligente.

## Características Implementadas

### ✅ Funcionalidad Core

- **Autocompletado con debounce de 300ms**: Evita sobrecarga del servidor
- **Navegación por teclado**: Flechas ↑↓ para navegar, Enter para seleccionar, Escape para cerrar
- **Shortcut Ctrl+K / Cmd+K**: Acceso rápido desde cualquier parte de la aplicación
- **Agrupación de resultados**: Productos (3), Categorías (3), Marcas (4)
- **Highlight de términos coincidentes**: Resalta las palabras buscadas en los resultados
- **Límite de 10 resultados**: Optimizado para velocidad

### 🎨 Diseño

- **Responsive**: Se adapta a desktop y móvil
- **Dropdown inteligente**: Se cierra al hacer clic fuera o presionar Escape
- **Estados visuales**: Loading, vacío, resultados
- **Iconos por tipo**: Package (productos), Layers (categorías), Tag (marcas)
- **Precios destacados**: Muestra el precio de productos
- **Imágenes**: Muestra thumbnails de productos cuando están disponibles

### ♿ Accesibilidad

- **Atributos ARIA**: `aria-label`, `aria-autocomplete`, `aria-controls`, `aria-expanded`, `aria-selected`
- **Roles semánticos**: `listbox` para el dropdown, `option` para cada resultado
- **ID y name**: El input tiene `id="global-search"` y `name="search"` para autocompletado del navegador
- **Navegación por teclado**: Totalmente accesible sin mouse
- **Lectores de pantalla**: Anuncios apropiados de estado y resultados

### 🚀 Performance

- **Debounce**: Espera 300ms después de que el usuario deja de escribir
- **Mínimo 2 caracteres**: No busca con queries muy cortas
- **Caché del navegador**: React Query cachea resultados automáticamente
- **Búsqueda directa**: NO usa NLPEngine para mantener latencia baja (<500ms)

## Uso

```tsx
import { GlobalSearch } from '@/components/layout/GlobalSearch';

// Uso básico
<GlobalSearch />

// Con placeholder personalizado
<GlobalSearch placeholder="Buscar productos..." />

// Con clase CSS personalizada
<GlobalSearch className="w-full max-w-lg" />
```

## Integración con Header

El componente está integrado en el Header principal:

- **Desktop**: Barra de búsqueda centrada entre logo y navegación
- **Móvil**: Barra de búsqueda debajo del header principal

## Navegación por Teclado

| Tecla | Acción |
|-------|--------|
| `Ctrl+K` / `Cmd+K` | Abrir búsqueda |
| `↓` | Navegar al siguiente resultado |
| `↑` | Navegar al resultado anterior |
| `Enter` | Seleccionar resultado actual |
| `Escape` | Cerrar dropdown |

## Tipos de Resultados

### Productos
- Muestra: Imagen, nombre, categoría, precio
- Navega a: `/productos/{slug}`
- Límite: 3 resultados

### Categorías
- Muestra: Icono, nombre, número de productos
- Navega a: `/categorias/{slug}`
- Límite: 3 resultados

### Marcas
- Muestra: Icono, nombre, número de productos
- Navega a: `/productos?brand={name}`
- Límite: 4 resultados

## Backend Requerido

El componente espera un endpoint en el backend:

```
GET /api/products/search?q={query}&limit={limit}
```

**Respuesta esperada:**

```json
{
  "products": [
    {
      "type": "product",
      "id": "123",
      "name": "Laptop Dell XPS 15",
      "slug": "laptop-dell-xps-15",
      "image": "https://...",
      "price": 1299.99,
      "category": "Laptops"
    }
  ],
  "categories": [
    {
      "type": "category",
      "id": "456",
      "name": "Laptops",
      "slug": "laptops",
      "productCount": 234
    }
  ],
  "brands": [
    {
      "type": "brand",
      "id": "789",
      "name": "Dell",
      "productCount": 156
    }
  ],
  "total": 393
}
```

## Servicios Relacionados

- **SearchService** (`@/services/search.service.ts`): Maneja las peticiones HTTP
- **useSearch Hook** (`@/hooks/useSearch.ts`): Lógica de búsqueda con debounce

## Notas de Implementación

### ¿Por qué NO usar NLPEngine aquí?

El NLPEngine (con Ollama/Phi-3) es excelente para búsqueda conversacional en el ChatWidget, pero para autocompletado rápido necesitamos:

- **Latencia < 500ms**: El NLPEngine puede tardar 2-5 segundos
- **Búsqueda simple**: Solo necesitamos coincidencias de texto, no análisis semántico
- **Caché efectivo**: Las búsquedas simples se cachean mejor

El NLPEngine se usa en el ChatWidget donde la latencia es aceptable porque es conversacional.

### Optimizaciones Futuras

- [ ] Caché local con localStorage para búsquedas recientes
- [ ] Historial de búsquedas del usuario
- [ ] Sugerencias de búsqueda populares
- [ ] Búsqueda por voz
- [ ] Filtros rápidos en el dropdown (solo en stock, con descuento, etc.)

## Testing

Para probar el componente:

1. Abrir la aplicación
2. Presionar `Ctrl+K` o hacer clic en la barra de búsqueda
3. Escribir al menos 2 caracteres
4. Verificar que aparezcan resultados después de 300ms
5. Usar flechas para navegar
6. Presionar Enter para ir al resultado

## Requisitos Cumplidos

- ✅ **17.1**: Búsqueda visible en todas las páginas (integrada en Header)
- ✅ **17.2**: Autocompletado inteligente con debounce
- ✅ **17.3**: Resultados priorizados (productos, categorías, marcas)
- ✅ **17.4**: Integración con búsqueda rápida (NO usa NLPEngine)
- ✅ **17.5**: Resultados en < 500ms (búsqueda directa)
