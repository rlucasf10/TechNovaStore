# PasswordStrengthIndicator

Componente que muestra un indicador visual de la fortaleza de una contraseña en tiempo real.

## Características

- **Barra de progreso con colores**: Rojo (débil), amarillo (media), verde (fuerte)
- **Lista de requisitos con checkmarks dinámicos**: Muestra visualmente qué requisitos se cumplen
- **Validación completa**: 8+ caracteres, mayúscula, minúscula, número, carácter especial
- **Cálculo de nivel de fortaleza**: Débil, Media, Fuerte
- **Accesible**: Incluye atributos ARIA para lectores de pantalla
- **Animaciones suaves**: Transiciones fluidas al cambiar de nivel

## Uso

```tsx
import { PasswordStrengthIndicator } from '@/components/auth';

function RegisterForm() {
  const [password, setPassword] = useState('');

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
      />
      <PasswordStrengthIndicator password={password} />
    </div>
  );
}
```

## Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `password` | `string` | Sí | - | La contraseña a evaluar |
| `className` | `string` | No | `''` | Clases CSS adicionales para el contenedor |

## Niveles de Fortaleza

### Débil (Rojo)
- 0-2 requisitos cumplidos
- Barra de progreso roja
- Fondo rojo claro

### Media (Amarillo)
- 3-4 requisitos cumplidos
- Barra de progreso amarilla
- Fondo amarillo claro

### Fuerte (Verde)
- 5 requisitos cumplidos (todos)
- Barra de progreso verde
- Fondo verde claro

## Requisitos Validados

1. **Mínimo 8 caracteres**: La contraseña debe tener al menos 8 caracteres
2. **Una letra mayúscula**: Debe contener al menos una letra mayúscula (A-Z)
3. **Una letra minúscula**: Debe contener al menos una letra minúscula (a-z)
4. **Un número**: Debe contener al menos un dígito (0-9)
5. **Un carácter especial**: Debe contener al menos un carácter especial (!@#$%^&*, etc.)

## Comportamiento

- **Sin contraseña**: El componente no se muestra (retorna `null`)
- **Contraseña vacía**: No se muestra ningún indicador
- **Contraseña en progreso**: Muestra el nivel actual y los requisitos cumplidos/pendientes
- **Contraseña fuerte**: Todos los checkmarks en verde, barra al 100%

## Accesibilidad

- Usa `role="progressbar"` con atributos ARIA apropiados
- Usa `role="list"` y `role="listitem"` para la lista de requisitos
- Incluye `aria-label` descriptivos para lectores de pantalla
- Los checkmarks tienen estados visuales claros (color y forma)

## Integración con Formularios

Este componente está diseñado para usarse junto con:
- React Hook Form para gestión de formularios
- Zod para validación de esquemas
- Input component para campos de contraseña

### Ejemplo con React Hook Form y Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordStrengthIndicator } from '@/components/auth';
import { Input } from '@/components/ui';

const passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

const registerSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

function RegisterForm() {
  const { register, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  return (
    <form>
      <Input
        {...register('password')}
        type="password"
        label="Contraseña"
        error={errors.password?.message}
      />
      <PasswordStrengthIndicator password={password} />
      
      <Input
        {...register('confirmPassword')}
        type="password"
        label="Confirmar contraseña"
        error={errors.confirmPassword?.message}
      />
    </form>
  );
}
```

## Estilos

El componente usa Tailwind CSS con las siguientes clases principales:
- `bg-red-500`, `bg-yellow-500`, `bg-green-500`: Colores de la barra
- `bg-red-100`, `bg-yellow-100`, `bg-green-100`: Fondos de la barra
- `text-red-700`, `text-yellow-700`, `text-green-700`: Colores del texto
- Transiciones suaves con `transition-all duration-300`

## Notas de Implementación

- El componente es completamente controlado (no mantiene estado interno)
- La validación se realiza en tiempo real mientras el usuario escribe
- Los requisitos se evalúan de forma independiente
- El nivel de fortaleza se calcula basándose en el número de requisitos cumplidos
- Las animaciones son suaves y no distraen al usuario
