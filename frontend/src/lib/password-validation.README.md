# Sistema de Validación de Contraseñas

Este módulo proporciona un sistema completo de validación de contraseñas con requisitos de seguridad robustos.

## Características

- ✅ Validación de requisitos mínimos de seguridad
- ✅ Detección de contraseñas comunes prohibidas (60+ contraseñas)
- ✅ Cálculo de fortaleza de contraseña (0-4)
- ✅ Feedback detallado para el usuario
- ✅ Validación de coincidencia de contraseñas
- ✅ Detección de patrones inseguros (secuencias, repeticiones)
- ✅ Generador de contraseñas seguras

## Requisitos de Contraseña

Todas las contraseñas deben cumplir con los siguientes requisitos:

1. **Mínimo 8 caracteres** (recomendado: 12+)
2. **Al menos una letra mayúscula** (A-Z)
3. **Al menos una letra minúscula** (a-z)
4. **Al menos un número** (0-9)
5. **Al menos un carácter especial** (!@#$%^&*()_+-=[]{}|;:,.<>?)
6. **No ser una contraseña común** (lista de 60+ contraseñas prohibidas)

## Uso Básico

### Validar una contraseña

```typescript
import { validatePassword } from '@/lib/password-validation';

const result = validatePassword('MiContraseña123!');

if (result.valid) {
  console.log('✓ Contraseña válida');
} else {
  console.log('✗ Errores:', result.errors);
  // ['Al menos una letra mayúscula', 'Al menos un carácter especial']
}
```

### Calcular fortaleza de contraseña

```typescript
import { calculatePasswordStrength } from '@/lib/password-validation';

const strength = calculatePasswordStrength('MiContraseña123!');

console.log(strength);
// {
//   score: 4,
//   level: 'very-strong',
//   feedback: ['¡Contraseña muy segura!'],
//   requirements: [
//     { id: 'minLength', label: 'Mínimo 8 caracteres', met: true },
//     { id: 'uppercase', label: 'Al menos una letra mayúscula', met: true },
//     // ...
//   ]
// }
```

### Validar coincidencia de contraseñas

```typescript
import { validatePasswordMatch } from '@/lib/password-validation';

const result = validatePasswordMatch('password123', 'password123');

if (result.valid) {
  console.log('✓ Las contraseñas coinciden');
} else {
  console.log('✗', result.message);
  // 'Las contraseñas no coinciden'
}
```

### Obtener requisitos con estado

```typescript
import { getPasswordRequirements } from '@/lib/password-validation';

const requirements = getPasswordRequirements('abc123');

requirements.forEach(req => {
  console.log(`${req.met ? '✓' : '✗'} ${req.label}`);
});
// ✓ Mínimo 8 caracteres
// ✗ Al menos una letra mayúscula
// ✓ Al menos una letra minúscula
// ✓ Al menos un número
// ✗ Al menos un carácter especial
// ✓ No es una contraseña común
```

### Generar contraseña segura

```typescript
import { generateSecurePassword } from '@/lib/password-validation';

const password = generateSecurePassword(16);
console.log(password);
// 'K9$mP2@xL5#nQ8&w'
```

## Integración con Zod

El sistema está integrado con Zod para validación de formularios:

```typescript
import { z } from 'zod';
import { validatePassword } from '@/lib/password-validation';

const passwordSchema = z
  .string()
  .min(1, 'La contraseña es requerida')
  .refine(
    (password) => {
      const validation = validatePassword(password);
      return validation.valid;
    },
    {
      message: 'La contraseña no cumple con los requisitos de seguridad',
    }
  );
```

## Schemas Disponibles

El módulo `auth-schemas.ts` proporciona schemas pre-configurados:

- `registerSchema` - Registro de usuario con validación de contraseña
- `resetPasswordSchema` - Restablecimiento de contraseña
- `setPasswordSchema` - Establecer contraseña (usuarios OAuth)
- `changePasswordSchema` - Cambiar contraseña

```typescript
import { registerSchema } from '@/lib/auth-schemas';

const result = registerSchema.safeParse({
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  password: 'MiContraseña123!',
  confirmPassword: 'MiContraseña123!',
  acceptTerms: true,
});

if (result.success) {
  console.log('✓ Datos válidos', result.data);
} else {
  console.log('✗ Errores', result.error.errors);
}
```

## Niveles de Fortaleza

El sistema calcula la fortaleza en 5 niveles:

| Score | Nivel | Descripción |
|-------|-------|-------------|
| 0 | `very-weak` | Muy débil - No cumple requisitos básicos |
| 1 | `weak` | Débil - Cumple 40-60% de requisitos |
| 2 | `medium` | Media - Cumple 60-80% de requisitos |
| 3 | `strong` | Fuerte - Cumple 80-100% de requisitos |
| 4 | `very-strong` | Muy fuerte - Cumple todos los requisitos |

## Contraseñas Comunes Prohibidas

El sistema incluye una lista de 60+ contraseñas comunes prohibidas:

- Contraseñas numéricas simples (12345678, 00000000, etc.)
- Contraseñas alfabéticas comunes (password, qwerty, abc123, etc.)
- Palabras comunes (admin, user, guest, test, etc.)
- Nombres y palabras populares (monkey, dragon, iloveyou, etc.)
- Patrones de teclado (asdfghjk, qazwsx, etc.)
- Contraseñas en español (contraseña, clave123, usuario, etc.)

## Detección de Patrones Inseguros

El sistema detecta y advierte sobre:

- ✗ Repetición de caracteres (aaa, 111)
- ✗ Solo números (12345678)
- ✗ Solo letras (abcdefgh)
- ✗ Secuencias numéricas (123, 456, 789)
- ✗ Secuencias alfabéticas (abc, xyz)

## Ejemplo de Componente

```typescript
'use client';

import { useState } from 'react';
import { calculatePasswordStrength } from '@/lib/password-validation';

export function PasswordInput() {
  const [password, setPassword] = useState('');
  const strength = calculatePasswordStrength(password);

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Ingresa tu contraseña"
      />
      
      {/* Barra de fortaleza */}
      <div className="strength-bar">
        <div 
          className={`strength-level-${strength.level}`}
          style={{ width: `${(strength.score / 4) * 100}%` }}
        />
      </div>
      
      {/* Requisitos */}
      <ul>
        {strength.requirements.map((req) => (
          <li key={req.id} className={req.met ? 'met' : 'unmet'}>
            {req.met ? '✓' : '✗'} {req.label}
          </li>
        ))}
      </ul>
      
      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className="feedback">
          {strength.feedback.map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Mejores Prácticas

1. **Siempre validar en cliente Y servidor** - La validación del cliente es para UX, pero el servidor debe validar también
2. **Mostrar feedback en tiempo real** - Ayuda al usuario a crear contraseñas seguras
3. **No almacenar contraseñas en texto plano** - Siempre hashear con bcrypt/argon2
4. **Usar HTTPS** - Nunca enviar contraseñas por HTTP
5. **Implementar rate limiting** - Prevenir ataques de fuerza bruta
6. **Considerar 2FA** - Agregar autenticación de dos factores para mayor seguridad

## Referencias

- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- Requisitos: 20.7, 23.6 del documento de requisitos
