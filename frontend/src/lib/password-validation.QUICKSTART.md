# Guía Rápida: Validación de Contraseñas

## 🚀 Inicio Rápido

### 1. Validar una contraseña

```typescript
import { validatePassword } from '@/lib/password-validation';

const result = validatePassword('MiContraseña123!');
if (result.valid) {
  // ✓ Contraseña válida
} else {
  // ✗ Mostrar errores: result.errors
}
```

### 2. Usar en formulario con React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/lib/auth-schemas';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(registerSchema),
});
```

### 3. Mostrar indicador de fortaleza

```typescript
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

<PasswordStrengthIndicator password={password} />
```

## 📋 Requisitos de Contraseña

- ✅ Mínimo 8 caracteres
- ✅ Una letra mayúscula (A-Z)
- ✅ Una letra minúscula (a-z)
- ✅ Un número (0-9)
- ✅ Un carácter especial (!@#$%^&*...)
- ✅ No ser una contraseña común (60+ prohibidas)

## 🎯 Schemas Disponibles

```typescript
import {
  registerSchema,        // Registro de usuario
  resetPasswordSchema,   // Restablecer contraseña
  setPasswordSchema,     // Establecer contraseña (OAuth)
  changePasswordSchema,  // Cambiar contraseña
} from '@/lib/auth-schemas';
```

## 📚 Documentación Completa

Ver `password-validation.README.md` para documentación detallada.

## 🧪 Tests

```bash
npm test -- password-validation.test.ts
# 36 tests - Todos pasando ✓
```
