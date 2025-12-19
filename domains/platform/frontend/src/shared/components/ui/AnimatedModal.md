# AnimatedModal Component

Componente de modal con animaciones configurables usando Framer Motion.

## Características

- ✨ **9 tipos de animación diferentes**: fade, scale, slideUp, slideDown, slideLeft, slideRight, flip, bounce, rotate
- 📏 **5 tamaños predefinidos**: sm, md, lg, xl, full
- ♿ **Accesible**: Trap de foco, navegación por teclado, ARIA labels
- 🎨 **Personalizable**: Clases CSS personalizadas, duración de animación configurable
- 🔒 **Control de cierre**: Configurable por backdrop, ESC, o botón X
- 🎯 **TypeScript**: Completamente tipado

## Instalación

El componente ya está instalado en el proyecto. Solo necesitas importarlo:

```tsx
import { AnimatedModal } from '@/shared/components/ui/AnimatedModal'
```

## Uso Básico

```tsx
import { useState } from 'react'
import { AnimatedModal } from '@/shared/components/ui/AnimatedModal'
import { Button } from '@/shared/components/ui/Button'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </Button>

      <AnimatedModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mi Modal"
        description="Esta es una descripción opcional"
        animationType="scale"
      >
        <p>Contenido del modal</p>
      </AnimatedModal>
    </>
  )
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | **Requerido**. Controla si el modal está abierto |
| `onClose` | `() => void` | - | **Requerido**. Función para cerrar el modal |
| `children` | `ReactNode` | - | **Requerido**. Contenido del modal |
| `title` | `ReactNode` | - | Título del modal |
| `description` | `string` | - | Descripción del modal |
| `animationType` | `AnimationType` | `'scale'` | Tipo de animación |
| `duration` | `number` | `0.3` | Duración de la animación en segundos |
| `closeOnBackdropClick` | `boolean` | `true` | Si se puede cerrar haciendo clic fuera |
| `closeOnEsc` | `boolean` | `true` | Si se puede cerrar con la tecla ESC |
| `showCloseButton` | `boolean` | `true` | Si se muestra el botón X |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Tamaño del modal |
| `className` | `string` | - | Clases CSS adicionales para el contenedor |
| `overlayClassName` | `string` | - | Clases CSS adicionales para el overlay |

## Tipos de Animación

### fade
Aparece y desaparece con efecto de opacidad.

```tsx
<AnimatedModal animationType="fade" {...props}>
  Contenido
</AnimatedModal>
```

### scale
Escala desde el centro con efecto zoom.

```tsx
<AnimatedModal animationType="scale" {...props}>
  Contenido
</AnimatedModal>
```

### slideUp
Desliza desde abajo hacia arriba.

```tsx
<AnimatedModal animationType="slideUp" {...props}>
  Contenido
</AnimatedModal>
```

### slideDown
Desliza desde arriba hacia abajo.

```tsx
<AnimatedModal animationType="slideDown" {...props}>
  Contenido
</AnimatedModal>
```

### slideLeft
Desliza desde la derecha hacia la izquierda.

```tsx
<AnimatedModal animationType="slideLeft" {...props}>
  Contenido
</AnimatedModal>
```

### slideRight
Desliza desde la izquierda hacia la derecha.

```tsx
<AnimatedModal animationType="slideRight" {...props}>
  Contenido
</AnimatedModal>
```

### flip
Efecto de volteo 3D.

```tsx
<AnimatedModal animationType="flip" {...props}>
  Contenido
</AnimatedModal>
```

### bounce
Rebote al entrar con efecto spring.

```tsx
<AnimatedModal animationType="bounce" {...props}>
  Contenido
</AnimatedModal>
```

### rotate
Rotación al entrar y salir.

```tsx
<AnimatedModal animationType="rotate" {...props}>
  Contenido
</AnimatedModal>
```

## Tamaños

```tsx
// Pequeño (max-w-sm)
<AnimatedModal size="sm" {...props}>Contenido</AnimatedModal>

// Mediano (max-w-md) - Default
<AnimatedModal size="md" {...props}>Contenido</AnimatedModal>

// Grande (max-w-lg)
<AnimatedModal size="lg" {...props}>Contenido</AnimatedModal>

// Extra grande (max-w-xl)
<AnimatedModal size="xl" {...props}>Contenido</AnimatedModal>

// Pantalla completa (max-w-full)
<AnimatedModal size="full" {...props}>Contenido</AnimatedModal>
```

## Ejemplos Avanzados

### Modal de Confirmación

```tsx
function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = () => {
    // Lógica de eliminación
    setIsOpen(false)
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="¿Estás seguro?"
      description="Esta acción no se puede deshacer"
      animationType="scale"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          ¿Realmente deseas eliminar este elemento?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>
    </AnimatedModal>
  )
}
```

### Modal con Formulario

```tsx
function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Lógica de creación
    setIsOpen(false)
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Crear nuevo usuario"
      animationType="slideUp"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            Crear
          </Button>
        </div>
      </form>
    </AnimatedModal>
  )
}
```

### Modal sin Cierre por Backdrop

```tsx
<AnimatedModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Acción importante"
  closeOnBackdropClick={false}
  animationType="bounce"
>
  <p>Este modal solo se puede cerrar con el botón X o ESC</p>
</AnimatedModal>
```

### Modal con Animación Lenta

```tsx
<AnimatedModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Animación personalizada"
  duration={1}
  animationType="rotate"
>
  <p>Esta animación dura 1 segundo</p>
</AnimatedModal>
```

## Accesibilidad

El componente incluye las siguientes características de accesibilidad:

- ✅ **Trap de foco**: El foco queda atrapado dentro del modal cuando está abierto
- ✅ **Restauración de foco**: El foco vuelve al elemento que abrió el modal al cerrarlo
- ✅ **ARIA labels**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- ✅ **Navegación por teclado**: ESC para cerrar (configurable)
- ✅ **Prevención de scroll**: El body no hace scroll cuando el modal está abierto
- ✅ **Focus visible**: Anillo de enfoque visible para navegación por teclado

## Testing

Para probar el componente, visita la página de ejemplos:

```
http://localhost:3020/test-animated-modal
```

Esta página incluye:
- Todos los tipos de animación
- Todos los tamaños
- Configuraciones especiales
- Casos de uso reales

## Notas Técnicas

- El componente usa `AnimatePresence` de Framer Motion para las animaciones
- El overlay tiene un `backdrop-blur-sm` para un efecto moderno
- El modal previene el scroll del body cuando está abierto
- El componente es completamente responsive
- Soporta modo oscuro (dark mode)

## Dependencias

- `framer-motion`: Para las animaciones
- `lucide-react`: Para el icono X de cerrar
- `@/lib/utils`: Para la función `cn` (classnames)

## Contribuir

Si encuentras algún bug o tienes sugerencias de mejora, por favor crea un issue o pull request.
