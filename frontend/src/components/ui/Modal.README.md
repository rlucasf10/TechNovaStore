# Modal Component

Componente de ventana modal con overlay, animaciones y características de accesibilidad completas.

## Características

- ✅ **Overlay con backdrop**: Fondo oscuro semitransparente con efecto blur
- ✅ **Animaciones de entrada/salida**: Transiciones suaves con fade-in y zoom
- ✅ **Cierre con ESC**: Presiona la tecla ESC para cerrar (configurable)
- ✅ **Cierre con click fuera**: Haz clic en el backdrop para cerrar (configurable)
- ✅ **Trap de foco**: El foco se mantiene dentro del modal (WCAG 2.1)
- ✅ **Bloqueo de scroll**: El body no hace scroll cuando el modal está abierto
- ✅ **Restauración de foco**: El foco vuelve al elemento que abrió el modal
- ✅ **Múltiples tamaños**: sm, md, lg, xl, full
- ✅ **Tema oscuro**: Soporte completo para dark mode
- ✅ **Accesibilidad**: Roles ARIA, labels y navegación por teclado

## Uso Básico

```tsx
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mi Modal"
        description="Esta es la descripción del modal"
      >
        <p>Contenido del modal aquí</p>
      </Modal>
    </>
  )
}
```

## Props

### Modal

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | - | **Requerido**. Controla si el modal está abierto |
| `onClose` | `() => void` | - | **Requerido**. Callback cuando el modal se cierra |
| `title` | `ReactNode` | - | Título del modal |
| `description` | `ReactNode` | - | Descripción o subtítulo |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Tamaño del modal |
| `disableBackdropClick` | `boolean` | `false` | Deshabilitar cierre al hacer clic fuera |
| `disableEscapeKey` | `boolean` | `false` | Deshabilitar cierre con tecla ESC |
| `showCloseButton` | `boolean` | `true` | Mostrar botón X en la esquina |
| `footer` | `ReactNode` | - | Contenido del footer (botones de acción) |
| `containerClassName` | `string` | - | Clase CSS para el contenedor |
| `overlayClassName` | `string` | - | Clase CSS para el overlay/backdrop |

## Ejemplos

### Modal de Confirmación

```tsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmar eliminación"
  description="Esta acción no se puede deshacer."
  size="sm"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Eliminar
      </Button>
    </>
  }
>
  <p>¿Estás seguro de que deseas eliminar este elemento?</p>
</Modal>
```

### Modal con Formulario

```tsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Nuevo Usuario"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button type="submit" form="user-form">
        Guardar
      </Button>
    </>
  }
>
  <form id="user-form" onSubmit={handleSubmit}>
    <Input label="Nombre" name="name" required />
    <Input label="Email" name="email" type="email" required />
  </form>
</Modal>
```

### Modal sin Cierre Automático

Para modales críticos que requieren acción del usuario:

```tsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Acción Requerida"
  disableBackdropClick
  disableEscapeKey
  showCloseButton={false}
  footer={
    <Button onClick={() => setIsOpen(false)}>
      Entendido
    </Button>
  }
>
  <p>Debes completar esta acción antes de continuar.</p>
</Modal>
```

### Modal Personalizado con Componentes

Para mayor control sobre el diseño:

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'

<Modal open={isOpen} onClose={() => setIsOpen(false)} size="lg">
  <ModalHeader>
    <div className="flex items-center gap-3">
      <Icon />
      <div>
        <h2 className="text-xl font-semibold">Título Personalizado</h2>
        <p className="text-sm text-gray-500">Subtítulo</p>
      </div>
    </div>
  </ModalHeader>

  <ModalBody>
    <p>Contenido con control total sobre padding y diseño</p>
  </ModalBody>

  <ModalFooter align="right">
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancelar
    </Button>
    <Button onClick={handleAction}>
      Confirmar
    </Button>
  </ModalFooter>
</Modal>
```

### Modal con Contenido Largo (Scroll)

```tsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Términos y Condiciones"
  size="lg"
>
  <div className="space-y-4">
    {/* Contenido largo que hará scroll automáticamente */}
    <p>Sección 1...</p>
    <p>Sección 2...</p>
    {/* ... más contenido ... */}
  </div>
</Modal>
```

## Tamaños

| Tamaño | Max Width | Uso Recomendado |
|--------|-----------|-----------------|
| `sm` | 384px | Confirmaciones simples, alertas |
| `md` | 448px | Formularios pequeños, mensajes |
| `lg` | 512px | Formularios medianos, contenido detallado |
| `xl` | 576px | Formularios grandes, contenido extenso |
| `full` | 100% - 32px | Contenido muy extenso, vistas complejas |

## Accesibilidad

El componente Modal cumple con las pautas WCAG 2.1 Level AA:

### Navegación por Teclado

- **ESC**: Cierra el modal (si `disableEscapeKey` es `false`)
- **Tab**: Navega entre elementos focuseables dentro del modal
- **Shift + Tab**: Navega hacia atrás entre elementos focuseables
- El foco se mantiene dentro del modal (focus trap)
- El foco vuelve al elemento que abrió el modal al cerrar

### Atributos ARIA

- `role="dialog"`: Indica que es un diálogo
- `aria-modal="true"`: Indica que es modal (bloquea interacción con el fondo)
- `aria-labelledby`: Vincula el título del modal
- `aria-describedby`: Vincula la descripción del modal
- `aria-label`: En el botón de cerrar

### Características de Accesibilidad

1. **Focus Trap**: El foco no puede salir del modal usando Tab
2. **Restauración de Foco**: Al cerrar, el foco vuelve al elemento anterior
3. **Bloqueo de Scroll**: El contenido de fondo no hace scroll
4. **Contraste de Colores**: Cumple con ratio mínimo 4.5:1
5. **Navegación por Teclado**: Todos los elementos son accesibles por teclado

## Mejores Prácticas

### ✅ Hacer

- Usar títulos descriptivos que expliquen el propósito del modal
- Proporcionar una forma clara de cerrar el modal (botón X o botón "Cancelar")
- Usar el tamaño apropiado según el contenido
- Mantener el contenido conciso y enfocado
- Usar `disableBackdropClick` para acciones críticas que requieren confirmación
- Proporcionar feedback visual durante operaciones asíncronas (loading states)

### ❌ Evitar

- No abrir modales desde otros modales (evitar modal stacking)
- No usar modales para contenido que debería estar en la página principal
- No deshabilitar el cierre con ESC a menos que sea absolutamente necesario
- No usar modales para mensajes de error simples (usar Toast en su lugar)
- No hacer el contenido del modal demasiado largo (considerar una página separada)

## Casos de Uso Comunes

### 1. Confirmación de Acciones Destructivas

```tsx
// Eliminar cuenta, borrar datos, etc.
<Modal
  title="Confirmar eliminación"
  size="sm"
  disableBackdropClick
  footer={
    <>
      <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
      <Button variant="danger" onClick={onConfirm}>Eliminar</Button>
    </>
  }
>
  <p>Esta acción no se puede deshacer.</p>
</Modal>
```

### 2. Formularios de Creación/Edición

```tsx
// Agregar usuario, editar producto, etc.
<Modal
  title="Nuevo Producto"
  size="lg"
  footer={
    <>
      <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
      <Button type="submit" form="product-form">Guardar</Button>
    </>
  }
>
  <form id="product-form" onSubmit={handleSubmit}>
    {/* Campos del formulario */}
  </form>
</Modal>
```

### 3. Vista de Detalles

```tsx
// Ver detalles de un pedido, producto, etc.
<Modal
  title="Detalles del Pedido #12345"
  size="xl"
  footer={
    <Button onClick={onClose}>Cerrar</Button>
  }
>
  {/* Información detallada */}
</Modal>
```

### 4. Alertas Importantes

```tsx
// Sesión por expirar, actualización disponible, etc.
<Modal
  title="Sesión por Expirar"
  size="sm"
  disableBackdropClick
  disableEscapeKey
  showCloseButton={false}
  footer={
    <Button onClick={handleExtendSession}>Extender Sesión</Button>
  }
>
  <p>Tu sesión expirará en 2 minutos.</p>
</Modal>
```

## Integración con React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
})

function FormModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data) => {
    console.log(data)
    setIsOpen(false)
  }

  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="Formulario con Validación"
      footer={
        <>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="validated-form">
            Guardar
          </Button>
        </>
      }
    >
      <form id="validated-form" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Nombre"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
      </form>
    </Modal>
  )
}
```

## Requisitos Cumplidos

- ✅ **Requisito 5.2**: Implementar overlay con backdrop
- ✅ **Requisito 5.2**: Agregar animaciones de entrada/salida
- ✅ **Requisito 5.2**: Implementar cierre con ESC y click fuera
- ✅ **Requisito 5.3**: Agregar trap de foco para accesibilidad (WCAG 2.1)

## Componentes Relacionados

- **Button**: Para botones de acción en el footer
- **Input**: Para formularios dentro del modal
- **Card**: Para contenido estructurado dentro del modal

## Notas Técnicas

### Animaciones

El modal usa clases de Tailwind CSS para animaciones:
- `animate-in fade-in`: Fade in del overlay y modal
- `zoom-in-95`: Zoom in del modal desde 95%
- `slide-in-from-bottom-4`: Slide in desde abajo

### Z-Index

El modal usa `z-50` para asegurar que aparezca sobre otros elementos. Si tienes elementos con z-index mayor, ajusta el `containerClassName`.

### Performance

- El modal solo se renderiza cuando `open={true}`
- Los event listeners se agregan/remueven dinámicamente
- El scroll del body se restaura automáticamente al cerrar

### Compatibilidad

- React 18+
- Next.js 14+
- Tailwind CSS 3+
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
