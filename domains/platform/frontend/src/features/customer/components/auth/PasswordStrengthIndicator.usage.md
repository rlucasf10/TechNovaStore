# Guía Rápida de Uso - PasswordStrengthIndicator

## Importación

```tsx
import { PasswordStrengthIndicator } from '@/components/auth';
```

## Uso Básico

```tsx
import { useState } from 'react';
import { PasswordStrengthIndicator } from '@/components/auth';
import { Input } from '@/components/ui';

function RegisterForm() {
  const [password, setPassword] = useState('');

  return (
    <div className="space-y-4">
      <Input
        type="password"
        label="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordStrengthIndicator password={password} />
    </div>
  );
}
```

## Integración con React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordStrengthIndicator } from '@/components/auth';
import { Input } from '@/components/ui';

// Schema de validación
const passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

function RegisterForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const onSubmit = (data) => {
    console.log('Registro exitoso:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('email')}
        type="email"
        label="Email"
        error={errors.email?.message}
      />

      <div className="space-y-2">
        <Input
          {...register('password')}
          type="password"
          label="Contraseña"
          error={errors.password?.message}
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <Input
        {...register('confirmPassword')}
        type="password"
        label="Confirmar contraseña"
        error={errors.confirmPassword?.message}
      />

      <button
        type="submit"
        className="w-full bg-primary-500 text-white py-2 rounded-lg"
      >
        Registrarse
      </button>
    </form>
  );
}
```

## Ejemplo Visual de Progresión

### Contraseña Débil (Rojo)
```
Contraseña: "abc"
Requisitos cumplidos: 1/5 (solo minúscula)
Barra: Roja al 20%
```

### Contraseña Media (Amarillo)
```
Contraseña: "Abc123"
Requisitos cumplidos: 3/5 (mayúscula, minúscula, número)
Barra: Amarilla al 60%
```

### Contraseña Fuerte (Verde)
```
Contraseña: "Abc123!@#"
Requisitos cumplidos: 5/5 (todos)
Barra: Verde al 100%
```

## Personalización

```tsx
// Con className personalizado
<PasswordStrengthIndicator 
  password={password} 
  className="mt-4 p-4 bg-gray-50 rounded-lg"
/>
```

## Características Implementadas

✅ Barra de progreso con colores dinámicos (rojo/amarillo/verde)
✅ Lista de requisitos con checkmarks animados
✅ Validación en tiempo real
✅ 5 requisitos: 8+ caracteres, mayúscula, minúscula, número, especial
✅ Cálculo de nivel: Débil, Media, Fuerte
✅ Accesible (ARIA labels, roles, progressbar)
✅ Animaciones suaves
✅ No se muestra si la contraseña está vacía

## Requisitos del Sistema

- React 18+
- Tailwind CSS
- TypeScript

## Notas

- El componente es completamente controlado (no mantiene estado interno)
- La validación se realiza en tiempo real
- Los requisitos se evalúan de forma independiente
- El nivel de fortaleza se calcula basándose en el número de requisitos cumplidos
