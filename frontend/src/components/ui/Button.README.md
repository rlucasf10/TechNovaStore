# Componente Button

Componente de botón reutilizable y accesible para TechNovaStore, implementado según las especificaciones del diseño del sistema.

## Características

- ✅ **4 Variantes**: primary, secondary, ghost, danger
- ✅ **3 Tamaños**: sm, md, lg
- ✅ **Estados**: default, hover, active, disabled, loading
- ✅ **Soporte para iconos**: iconos izquierdo y derecho
- ✅ **Accesibilidad**: Navegación por teclado, ARIA labels, focus visible
- ✅ **Animaciones**: Transiciones suaves y efecto de escala al hacer clic
- ✅ **TypeScript**: Completamente tipado con soporte para ref forwarding

## Uso Básico

```tsx
import { Button } from '@/components/ui/Button'

// Botón simple
<Button>Click me</Button>

// Con variante y tamaño
<Button variant="primary" size="lg">
  Agregar al Carrito
</Button>

// Con estado de carga
<Button loading>
  Procesando...
</Button>

// Deshabilitado
<Button disabled>
  No disponible
</Button>
```

## Variantes

### Primary (Predeterminada)
Botón principal para acciones primarias como "Comprar", "Agregar al carrito", "Guardar".

```tsx
<Button variant="primary">Comprar Ahora</Button>
```

**Estilo**: Fondo azul sólido, texto blanco, sombra sutil.

### Secondary
Botón secundario para acciones alternativas como "Cancelar", "Ver más", "Continuar comprando".

```tsx
<Button variant="secondary">Continuar Comprando</Button>
```

**Estilo**: Borde azul, fondo transparente, texto azul.

### Ghost
Botón terciario para acciones menos prominentes como "Cerrar", "Volver".

```tsx
<Button variant="ghost">Cerrar</Button>
```

**Estilo**: Sin borde, fondo transparente, hover con fondo gris claro.

### Danger
Botón para acciones destructivas como "Eliminar", "Cancelar pedido".

```tsx
<Button variant="danger">Eliminar Cuenta</Button>
```

**Estilo**: Fondo rojo, texto blanco, sombra sutil.

## Tamaños

### Small (sm)
Para espacios reducidos o acciones secundarias.

```tsx
<Button size="sm">Small</Button>
```

**Dimensiones**: min-height 32px, padding 12px horizontal.

### Medium (md) - Predeterminado
Tamaño estándar para la mayoría de casos.

```tsx
<Button size="md">Medium</Button>
```

**Dimensiones**: min-height 40px, padding 16px horizontal.

### Large (lg)
Para CTAs prominentes o páginas de destino.

```tsx
<Button size="lg">Large</Button>
```

**Dimensiones**: min-height 48px, padding 24px horizontal.

## Iconos

### Icono Izquierdo

```tsx
import { ShoppingCartIcon } from '@/components/icons'

<Button iconLeft={<ShoppingCartIcon />}>
  Agregar al Carrito
</Button>
```

### Icono Derecho

```tsx
import { ArrowRightIcon } from '@/components/icons'

<Button iconRight={<ArrowRightIcon />}>
  Continuar
</Button>
```

### Ambos Iconos

```tsx
<Button 
  iconLeft={<ShoppingCartIcon />}
  iconRight={<ArrowRightIcon />}
>
  Ver Carrito
</Button>
```

**Nota**: Los iconos se ocultan automáticamente cuando el botón está en estado `loading`.

## Estados

### Loading

Muestra un spinner animado y deshabilita el botón.

```tsx
<Button loading>
  Procesando Pago...
</Button>
```

### Disabled

Deshabilita el botón y reduce la opacidad.

```tsx
<Button disabled>
  No Disponible
</Button>
```

## Eventos

### onClick

```tsx
<Button onClick={() => handleClick()}>
  Click me
</Button>
```

### Otros eventos HTML

El componente acepta todos los atributos estándar de `<button>`:

```tsx
<Button
  onClick={handleClick}
  onMouseEnter={handleHover}
  onFocus={handleFocus}
  type="submit"
  form="myForm"
>
  Submit
</Button>
```

## Accesibilidad

### ARIA Labels

```tsx
<Button aria-label="Agregar producto al carrito">
  <ShoppingCartIcon />
</Button>
```

### Navegación por Teclado

- **Tab**: Navegar entre botones
- **Enter/Space**: Activar el botón
- **Focus visible**: Anillo de enfoque visible al navegar con teclado

### Screen Readers

- Los iconos tienen `aria-hidden="true"` para evitar lectura duplicada
- El spinner de loading es anunciado correctamente
- Estados disabled son comunicados automáticamente

## Ref Forwarding

El componente soporta refs para acceso directo al elemento DOM:

```tsx
const buttonRef = useRef<HTMLButtonElement>(null)

<Button ref={buttonRef}>
  Click me
</Button>

// Acceder al elemento
buttonRef.current?.focus()
```

## Clases Personalizadas

Puedes agregar clases CSS personalizadas que se fusionarán con las clases base:

```tsx
<Button className="w-full mt-4">
  Full Width Button
</Button>
```

## Ejemplos de Casos de Uso

### Carrito de Compras

```tsx
<div className="flex gap-3">
  <Button variant="secondary">
    Continuar Comprando
  </Button>
  <Button variant="primary" iconRight={<ArrowRightIcon />}>
    Proceder al Checkout
  </Button>
</div>
```

### Detalle de Producto

```tsx
<div className="flex gap-3">
  <Button 
    variant="primary" 
    size="lg" 
    iconLeft={<ShoppingCartIcon />}
    onClick={handleAddToCart}
    loading={isAdding}
  >
    Agregar al Carrito
  </Button>
  <Button variant="secondary" size="lg">
    Comprar Ahora
  </Button>
</div>
```

### Gestión de Cuenta

```tsx
<div className="flex justify-end gap-3">
  <Button variant="ghost" onClick={handleCancel}>
    Cancelar
  </Button>
  <Button variant="primary" onClick={handleSave} loading={isSaving}>
    Guardar Cambios
  </Button>
  <Button variant="danger" iconLeft={<TrashIcon />} onClick={handleDelete}>
    Eliminar Cuenta
  </Button>
</div>
```

### Formularios

```tsx
<form onSubmit={handleSubmit}>
  {/* campos del formulario */}
  
  <div className="flex justify-end gap-3 mt-6">
    <Button type="button" variant="ghost" onClick={handleReset}>
      Restablecer
    </Button>
    <Button type="submit" loading={isSubmitting}>
      Enviar
    </Button>
  </div>
</form>
```

## Props API

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg'
  
  /** Estado de carga - muestra spinner y deshabilita el botón */
  loading?: boolean
  
  /** Icono a mostrar antes del texto */
  iconLeft?: ReactNode
  
  /** Icono a mostrar después del texto */
  iconRight?: ReactNode
  
  /** Clases CSS personalizadas */
  className?: string
  
  /** Contenido del botón */
  children: ReactNode
  
  /** Todos los demás props de HTMLButtonElement */
  // onClick, disabled, type, form, etc.
}
```

## Testing

El componente incluye tests completos que verifican:

- ✅ Renderizado de todas las variantes
- ✅ Renderizado de todos los tamaños
- ✅ Estados (disabled, loading)
- ✅ Iconos (izquierdo, derecho, ambos)
- ✅ Eventos (onClick)
- ✅ Accesibilidad (roles, ARIA)
- ✅ Ref forwarding
- ✅ Clases personalizadas

Ejecutar tests:

```bash
npm test -- Button.test.tsx
```

## Notas de Implementación

### Animaciones

- **Transición**: 200ms para cambios de color
- **Escala**: Efecto de escala (0.95) al hacer clic activo
- **Hover**: Cambio de color y sombra en hover

### Performance

- Usa `forwardRef` para evitar re-renders innecesarios
- Clases CSS optimizadas con Tailwind
- Iconos con `aria-hidden` para mejor performance de screen readers

### Compatibilidad

- ✅ React 18+
- ✅ Next.js 14+
- ✅ TypeScript 5+
- ✅ Tailwind CSS 3+

## Requisitos Cumplidos

Este componente cumple con los requisitos del task 5.1:

- ✅ Implementar variantes: primary, secondary, ghost, danger
- ✅ Implementar tamaños: sm, md, lg
- ✅ Implementar estados: default, hover, active, disabled, loading
- ✅ Agregar soporte para iconos
- ✅ Requisito 21.1: Paleta de colores moderna y consistente

## Archivos Relacionados

- `Button.tsx` - Componente principal
- `Button.test.tsx` - Tests unitarios
- `Button.examples.tsx` - Ejemplos visuales
- `Button.README.md` - Esta documentación
