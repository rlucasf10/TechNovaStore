/**
 * Utilidades para validación de contraseñas
 * Incluye validación de fortaleza y requisitos de seguridad
 */

import { PasswordStrength, PasswordRequirement } from '@/types/auth.types';

// Lista de contraseñas comunes prohibidas
// Basada en las contraseñas más comunes según estudios de seguridad
const COMMON_PASSWORDS = [
  // Contraseñas numéricas simples
  '12345678',
  '123456789',
  '1234567890',
  '00000000',
  '11111111',
  '12121212',
  '123123123',
  '87654321',
  
  // Contraseñas alfabéticas comunes
  'password',
  'password123',
  'password1',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'abc123',
  'abc12345',
  'abcdefgh',
  'letmein',
  'welcome',
  'welcome123',
  
  // Palabras comunes
  'admin',
  'admin123',
  'administrator',
  'root',
  'user',
  'guest',
  'test',
  'test123',
  'demo',
  'demo123',
  
  // Nombres y palabras populares
  'monkey',
  'dragon',
  'master',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'superman',
  'batman',
  'trustno1',
  'iloveyou',
  'starwars',
  'pokemon',
  
  // Patrones de teclado
  'asdfghjk',
  'zxcvbnm',
  '1qaz2wsx',
  'qazwsx',
  'qazwsxedc',
  
  // Contraseñas en español
  'contraseña',
  'clave123',
  'usuario',
  'administrador',
  'bienvenido',
  'hola123',
  'españa',
  'madrid',
  'barcelona',
];

/**
 * Requisitos de contraseña
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

/**
 * Validar si una contraseña cumple con un requisito específico
 */
export function checkPasswordRequirement(
  password: string,
  requirementId: string
): boolean {
  switch (requirementId) {
    case 'minLength':
      return password.length >= PASSWORD_REQUIREMENTS.minLength;
    case 'uppercase':
      return /[A-Z]/.test(password);
    case 'lowercase':
      return /[a-z]/.test(password);
    case 'number':
      return /[0-9]/.test(password);
    case 'special':
      return /[^A-Za-z0-9]/.test(password);
    case 'notCommon':
      return !COMMON_PASSWORDS.includes(password.toLowerCase());
    default:
      return false;
  }
}

/**
 * Obtener todos los requisitos de contraseña con su estado
 */
export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'minLength',
      label: `Mínimo ${PASSWORD_REQUIREMENTS.minLength} caracteres`,
      met: checkPasswordRequirement(password, 'minLength'),
    },
    {
      id: 'uppercase',
      label: 'Al menos una letra mayúscula',
      met: checkPasswordRequirement(password, 'uppercase'),
    },
    {
      id: 'lowercase',
      label: 'Al menos una letra minúscula',
      met: checkPasswordRequirement(password, 'lowercase'),
    },
    {
      id: 'number',
      label: 'Al menos un número',
      met: checkPasswordRequirement(password, 'number'),
    },
    {
      id: 'special',
      label: 'Al menos un carácter especial',
      met: checkPasswordRequirement(password, 'special'),
    },
    {
      id: 'notCommon',
      label: 'No es una contraseña común',
      met: checkPasswordRequirement(password, 'notCommon'),
    },
  ];
}

/**
 * Calcular la fortaleza de una contraseña
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: 'very-weak',
      feedback: ['Ingresa una contraseña'],
      requirements: getPasswordRequirements(password),
    };
  }

  const requirements = getPasswordRequirements(password);
  const metRequirements = requirements.filter((req) => req.met).length;
  const totalRequirements = requirements.length;

  // Calcular score basado en requisitos cumplidos
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  const percentage = (metRequirements / totalRequirements) * 100;

  if (percentage >= 100) {
    score = 4;
  } else if (percentage >= 80) {
    score = 3;
  } else if (percentage >= 60) {
    score = 2;
  } else if (percentage >= 40) {
    score = 1;
  }

  // Determinar nivel
  let level: PasswordStrength['level'] = 'very-weak';
  if (score === 4) {
    level = 'very-strong';
  } else if (score === 3) {
    level = 'strong';
  } else if (score === 2) {
    level = 'medium';
  } else if (score === 1) {
    level = 'weak';
  }

  // Generar feedback
  const feedback: string[] = [];
  const unmetRequirements = requirements.filter((req) => !req.met);

  if (unmetRequirements.length > 0) {
    feedback.push('Tu contraseña debe cumplir con:');
    unmetRequirements.forEach((req) => {
      feedback.push(`• ${req.label}`);
    });
  }

  // Feedback adicional
  if (password.length < 12) {
    feedback.push('Considera usar al menos 12 caracteres para mayor seguridad');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Usa caracteres especiales como !@#$%^&*');
  }

  // Detectar patrones comunes
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Evita repetir el mismo carácter múltiples veces');
  }

  if (/^[0-9]+$/.test(password)) {
    feedback.push('No uses solo números');
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    feedback.push('No uses solo letras');
  }

  // Detectar secuencias
  if (/123|234|345|456|567|678|789|890/.test(password)) {
    feedback.push('Evita secuencias numéricas como 123 o 456');
  }

  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    feedback.push('Evita secuencias alfabéticas como abc o xyz');
  }

  return {
    score,
    level,
    feedback: feedback.length > 0 ? feedback : ['¡Contraseña muy segura!'],
    requirements,
  };
}

/**
 * Validar que dos contraseñas coincidan
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): { valid: boolean; message?: string } {
  if (!confirmPassword) {
    return { valid: false, message: 'Confirma tu contraseña' };
  }

  if (password !== confirmPassword) {
    return { valid: false, message: 'Las contraseñas no coinciden' };
  }

  return { valid: true };
}

/**
 * Validar que una contraseña cumpla con todos los requisitos
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const requirements = getPasswordRequirements(password);
  const unmetRequirements = requirements.filter((req) => !req.met);

  if (unmetRequirements.length > 0) {
    return {
      valid: false,
      errors: unmetRequirements.map((req) => req.label),
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Generar una contraseña segura aleatoria
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Completar el resto de la longitud
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar los caracteres
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
