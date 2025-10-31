# Componente Input

Componente de input reutilizable y accesible con soporte para múltiples variantes, estados, validación inline y labels flotantes.

## Características

- ✅ **Variantes**: text, email, password, number
- ✅ **Estados**: default, focus, error, disabled
- ✅ **Labels flotantes**: Animación suave cuando el usuario interactúa
- ✅ **Iconos**: Soporte para iconos izquierda/derecha
- ✅ **Validación inline**: Iconos de checkmark/error según el estado
- ✅ **Toggle de contraseña**: Botón para mostrar/ocultar contraseña
- ✅ **Accesibilidad**: ARIA labels, estados y descripciones
- ✅ **Responsive**: Se adapta a todos los tamaños de pantalla

## Uso Básico

```tsx
import { Input } from '@/components/ui/Input'

function MyForm() {
  return (
    <Input
      label="Email"
      variant="email"
      placeholder="correo@ejemplo.com"
      helperText="Ingresa tu email"
    />
  )
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `string` | - | Etiqueta del input |
| `error` | `string` | - | Mensaje de error a mostrar |
| `helperText` | `string` | - | Texto de ayuda debajo del input |
| `variant` | `'text' \| 'email' \| 'password' \| 'number'` | `'text'` | Tipo de input |
| `iconLeft` | `ReactNode` | - | Icono a la izquierda |
| `iconRight` | `ReactNode` | - | Icono a la derecha |
| `floatingLabel` | `boolean` | `false` | Habilitar label flotante |
| `showValidation` | `boolean` | `false` | Mostrar icono de validación |
| `isValid` | `boolean` | `false` | Indica si el input es válido |
| `disabled` | `boolean` | `false` | Deshabilitar el input |

Además, acepta todas las props estándar de `HTMLInputElement`.

## Variantes

### Text (por defecto)

```tsx
<Input
  label="Nombre"
  placeholder="Juan Pérez"
/>
```

### Email

```tsx
<Input
  label="Email"
  variant="email"
  placeholder="correo@ejemplo.com"
/>
```

### Password

Incluye botón para mostrar/ocultar contraseña automáticamente.

```tsx
<Input
  label="Contraseña"
  variant="password"
  placeholder="••••••••"
/>
```

### Number

```tsx
<Input
  label="Cantidad"
  variant="number"
  placeholder="0"
  min={1}
  max={100}
/>
```

## Estados

### Con Error

```tsx
<Input
  label="Email"
  variant="email"
  value="email-invalido"
  error="Formato de email inválido"
/>
```

### Deshabilitado

```tsx
<Input
  label="Campo deshabilitado"
  disabled
  value="No editable"
/>
```

### Con Validación

```tsx
<Input
  label="Email"
  variant="email"
  value="usuario@ejemplo.com"
  showValidation
  isValid
/>
```

## Labels Flotantes

Los labels flotantes se animan hacia arriba cuando el input tiene foco o contenido.

```tsx
<Input
  label="Nombre completo"
  floatingLabel
  placeholder=""
/>
```

**Nota**: Cuando uses `floatingLabel`, deja el `placeholder` vacío para mejor UX.

## Con Iconos

### Icono Izquierdo

```tsx
<Input
  label="Buscar"
  placeholder="Buscar productos..."
  iconLeft={
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  }
/>
```

### Icono Derecho

```tsx
<Input
  label="Ubicación"
  placeholder="Ciudad, País"
  iconRight={
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    </svg>
  }
/>
```

## Validación Inline

Muestra iconos de validación según el estado del input.

```tsx
// Válido
<Input
  label="Email"
  variant="email"
  value="usuario@ejemplo.com"
  showValidation
  isValid
/>

// Inválido
<Input
  label="Email"
  variant="email"
  value="email-invalido"
  showValidation
  error="Formato de email inválido"
/>
```

## Integración con React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        variant="email"
        {...register('email')}
        error={errors.email?.message}
        floatingLabel
      />

      <Input
        label="Contraseña"
        variant="password"
        {...register('password')}
        error={errors.password?.message}
        floatingLabel
      />

      <button type="submit">Iniciar Sesión</button>
    </form>
  )
}
```

## Accesibilidad

El componente implementa las mejores prácticas de accesibilidad:

- ✅ Labels asociados correctamente con `htmlFor` e `id`
- ✅ Atributo `aria-invalid` cuando hay error
- ✅ Atributo `aria-describedby` para mensajes de error y ayuda
- ✅ Navegación completa por teclado
- ✅ Estados visuales claros (focus, error, disabled)
- ✅ Contraste de colores WCAG 2.1 AA
- ✅ Iconos con `aria-hidden="true"` para evitar confusión

## Ejemplos Completos

Ver `Input.examples.tsx` para ejemplos completos de todos los casos de uso.

## Requisitos Cumplidos

Este componente cumple con los requisitos de la tarea 5.2:

- ✅ Implementar variantes: text, email, password, number
- ✅ Implementar estados: default, focus, error, disabled
- ✅ Agregar soporte para labels flotantes
- ✅ Agregar iconos de validación inline
- ✅ Requisito 21.1: Paleta de colores moderna y consistente

## Notas de Implementación

- El componente usa `forwardRef` para permitir acceso al elemento DOM subyacente
- Los iconos se renderizan con `pointer-events-none` para evitar interferir con el input
- El toggle de contraseña tiene `tabIndex={-1}` para mantener el flujo de tabulación limpio
- Los labels flotantes usan transiciones CSS para animaciones suaves
- El componente es completamente tipado con TypeScript
