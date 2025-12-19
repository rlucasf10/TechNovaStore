# Guía de Validación de Formularios

Esta guía describe las mejores prácticas para validación de formularios en TechNovaStore usando Zod y React Hook Form.

## Tabla de Contenidos

1. [Principios Generales](#principios-generales)
2. [Estructura de Validación](#estructura-de-validación)
3. [Esquemas de Validación](#esquemas-de-validación)
4. [Integración con React Hook Form](#integración-con-react-hook-form)
5. [Mensajes de Error](#mensajes-de-error)
6. [Validación en Cliente vs Servidor](#validación-en-cliente-vs-servidor)
7. [Ejemplos Completos](#ejemplos-completos)

## Principios Generales

### 1. Validar Siempre en Cliente Y Servidor

```typescript
// ✅ CORRECTO: Validar en ambos lados
// Cliente (frontend)
const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Servidor (backend)
// Usar el mismo esquema o uno similar
```

### 2. Usar Esquemas Reutilizables

```typescript
// ✅ CORRECTO: Definir esquemas base reutilizables
export const emailSchema = z.string()
  .min(1, 'El email es requerido')
  .email('Email inválido')
  .toLowerCase();

// Reutilizar en múltiples formularios
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  // ...
});
```

### 3. Mensajes de Error Claros y Accionables

```typescript
// ❌ INCORRECTO: Mensaje vago
z.string().min(8, 'Inválido')

// ✅ CORRECTO: Mensaje específico y accionable
z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
```

### 4. Validación Progresiva

```typescript
// ✅ CORRECTO: Validar mientras el usuario escribe
const { register, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  mode: 'onChange', // Validar en cada cambio
  reValidateMode: 'onChange', // Re-validar en cada cambio
});
```

## Estructura de Validación

### Organización de Archivos

```
src/shared/lib/
├── form-schemas.ts          # Esquemas de validación con Zod
├── validation-utils.ts      # Utilidades de validación
└── VALIDATION_GUIDE.md      # Esta guía
```

### Esquemas por Categoría

Los esquemas están organizados por funcionalidad:

- **Autenticación**: `loginSchema`, `registerSchema`, `forgotPasswordSchema`, etc.
- **Perfil**: `updateProfileSchema`, `changePasswordSchema`, `addressSchema`
- **Comercio**: `creditCardSchema`, `productReviewSchema`, `discountCodeSchema`
- **Comunicación**: `contactSchema`, `newsletterSchema`, `searchSchema`

## Esquemas de Validación

### Esquema Básico

```typescript
import { z } from 'zod';

export const myFormSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z.string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .toLowerCase(),
  age: z.number()
    .int('La edad debe ser un número entero')
    .min(18, 'Debes ser mayor de 18 años')
    .max(120, 'Edad inválida'),
});

export type MyFormData = z.infer<typeof myFormSchema>;
```

### Validación Condicional

```typescript
// Validar que dos campos coincidan
const schema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'], // Mostrar error en este campo
});
```

### Validación Personalizada

```typescript
// Usar refine para validación custom
const schema = z.object({
  cardNumber: z.string()
    .min(1, 'Número de tarjeta es obligatorio')
    .refine(
      (val) => validateLuhn(val),
      'Número de tarjeta inválido'
    ),
});
```

### Transformaciones

```typescript
// Transformar valores antes de validar
const schema = z.object({
  email: z.string()
    .toLowerCase() // Convertir a minúsculas
    .trim(), // Remover espacios
  phone: z.string()
    .transform((val) => val.replace(/\s/g, '')), // Remover espacios
});
```

## Integración con React Hook Form

### Setup Básico

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { myFormSchema, type MyFormData } from '@/shared/lib/form-schemas';

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MyFormData>({
    resolver: zodResolver(myFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = async (data: MyFormData) => {
    try {
      await api.submitForm(data);
    } catch (error) {
      // Manejar errores del servidor
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        label="Nombre"
        error={errors.name?.message}
      />
      <Input
        {...register('email')}
        label="Email"
        error={errors.email?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        Enviar
      </Button>
    </form>
  );
}
```

### Validación en Tiempo Real

```typescript
const {
  register,
  watch,
  formState: { errors },
} = useForm<MyFormData>({
  resolver: zodResolver(myFormSchema),
  mode: 'onChange', // Validar mientras escribe
});

// Observar cambios en un campo
const password = watch('password');

// Mostrar indicador de fortaleza
<PasswordStrengthIndicator password={password} />
```

### Validación Manual

```typescript
import { zodErrorsToFieldErrors } from '@/shared/lib/validation-utils';

const validateManually = (data: MyFormData) => {
  try {
    myFormSchema.parse(data);
    return { valid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: zodErrorsToFieldErrors(error),
      };
    }
    throw error;
  }
};
```

## Mensajes de Error

### Mensajes Consistentes

Usar los mensajes predefinidos en `validation-utils.ts`:

```typescript
import { validationMessages } from '@/shared/lib/validation-utils';

const schema = z.object({
  name: z.string()
    .min(1, validationMessages.required)
    .min(2, validationMessages.minLength(2)),
  email: z.string()
    .min(1, validationMessages.required)
    .email(validationMessages.email),
});
```

### Mensajes Personalizados por Campo

```typescript
const schema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Solo puede contener letras, números y guiones bajos'
    ),
});
```

### Mostrar Errores en el UI

```typescript
// Componente Input ya maneja la visualización de errores
<Input
  label="Email"
  error={errors.email?.message}
  {...register('email')}
/>

// Para errores generales del formulario
{errors.root?.message && (
  <div className="text-error text-sm">
    {errors.root.message}
  </div>
)}
```

## Validación en Cliente vs Servidor

### Cliente (Frontend)

**Propósito**: Mejorar UX con feedback inmediato

```typescript
// Validación en cliente
const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Usar en formulario
const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

**Ventajas**:
- Feedback inmediato
- Reduce carga del servidor
- Mejor experiencia de usuario

**Limitaciones**:
- Puede ser bypasseada
- No valida datos del servidor (ej: email ya existe)

### Servidor (Backend)

**Propósito**: Seguridad y validación definitiva

```typescript
// En el backend (Node.js/Express)
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post('/api/auth/register', async (req, res) => {
  try {
    // Validar con Zod
    const data = registerSchema.parse(req.body);
    
    // Validaciones adicionales (ej: email único)
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({
        error: 'email-already-exists',
        message: 'Este email ya está registrado',
      });
    }
    
    // Procesar registro
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation-error',
        details: error.errors,
      });
    }
    // ...
  }
});
```

**Ventajas**:
- Seguridad garantizada
- Validación de reglas de negocio
- Acceso a base de datos para validaciones complejas

### Estrategia Recomendada

1. **Validar en cliente** para UX
2. **Validar en servidor** para seguridad
3. **Usar esquemas similares** en ambos lados
4. **Manejar errores del servidor** en el cliente

```typescript
// Cliente
const onSubmit = async (data: FormData) => {
  try {
    await api.register(data);
    router.push('/dashboard');
  } catch (error) {
    if (error.response?.data?.error === 'email-already-exists') {
      setError('email', {
        message: 'Este email ya está registrado',
      });
    } else {
      setError('root', {
        message: 'Error al registrar. Intenta de nuevo.',
      });
    }
  }
};
```

## Ejemplos Completos

### Formulario de Login

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/shared/lib/form-schemas';
import { Input, Button } from '@/ui';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authService.login(data);
      router.push('/dashboard');
    } catch (error) {
      setError('root', {
        message: 'Email o contraseña incorrectos',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('email')}
        label="Email"
        type="email"
        error={errors.email?.message}
        autoComplete="email"
      />
      
      <Input
        {...register('password')}
        label="Contraseña"
        type="password"
        error={errors.password?.message}
        autoComplete="current-password"
      />
      
      <div className="flex items-center">
        <input
          {...register('rememberMe')}
          id="remember-me"
          type="checkbox"
          className="h-4 w-4"
        />
        <label htmlFor="remember-me" className="ml-2 text-sm">
          Recordarme
        </label>
      </div>
      
      {errors.root?.message && (
        <div className="text-error text-sm">
          {errors.root.message}
        </div>
      )}
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </form>
  );
}
```

### Formulario con Validación Condicional

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const shippingSchema = z.object({
  sameAsBilling: z.boolean(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  postalCode: z.string().regex(/^\d{5}$/).optional(),
}).refine((data) => {
  // Si no es la misma dirección, todos los campos son requeridos
  if (!data.sameAsBilling) {
    return data.address && data.city && data.postalCode;
  }
  return true;
}, {
  message: 'Completa todos los campos de envío',
  path: ['address'],
});

export function ShippingForm() {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shippingSchema),
  });

  const sameAsBilling = watch('sameAsBilling');

  return (
    <form>
      <div className="mb-4">
        <input
          {...register('sameAsBilling')}
          type="checkbox"
          id="same-as-billing"
        />
        <label htmlFor="same-as-billing">
          Usar misma dirección de facturación
        </label>
      </div>
      
      {!sameAsBilling && (
        <>
          <Input
            {...register('address')}
            label="Dirección"
            error={errors.address?.message}
          />
          <Input
            {...register('city')}
            label="Ciudad"
            error={errors.city?.message}
          />
          <Input
            {...register('postalCode')}
            label="Código Postal"
            error={errors.postalCode?.message}
          />
        </>
      )}
    </form>
  );
}
```

## Mejores Prácticas

### ✅ DO (Hacer)

1. **Usar Zod para todos los formularios**
2. **Validar en cliente Y servidor**
3. **Mensajes de error claros y específicos**
4. **Reutilizar esquemas base**
5. **Usar TypeScript para type safety**
6. **Validar mientras el usuario escribe (onChange)**
7. **Sanitizar inputs antes de enviar**
8. **Manejar errores del servidor apropiadamente**

### ❌ DON'T (No hacer)

1. **No confiar solo en validación de cliente**
2. **No usar mensajes de error vagos**
3. **No duplicar lógica de validación**
4. **No ignorar errores del servidor**
5. **No validar solo al enviar (onSubmit)**
6. **No almacenar datos sensibles sin encriptar**
7. **No exponer detalles técnicos en mensajes de error**

## Recursos Adicionales

- [Documentación de Zod](https://zod.dev/)
- [Documentación de React Hook Form](https://react-hook-form.com/)
- [Guía de Accesibilidad en Formularios](https://www.w3.org/WAI/tutorials/forms/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
