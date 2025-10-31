/**
 * Tests para el sistema de validación de contraseñas
 */

import {
  validatePassword,
  validatePasswordMatch,
  calculatePasswordStrength,
  getPasswordRequirements,
  checkPasswordRequirement,
  generateSecurePassword,
  PASSWORD_REQUIREMENTS,
} from '../password-validation';

describe('Sistema de Validación de Contraseñas', () => {
  describe('validatePassword', () => {
    it('debe validar una contraseña segura correctamente', () => {
      const result = validatePassword('MiContraseña123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar contraseña sin mayúscula', () => {
      const result = validatePassword('micontraseña123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos una letra mayúscula');
    });

    it('debe rechazar contraseña sin minúscula', () => {
      const result = validatePassword('MICONTRASEÑA123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos una letra minúscula');
    });

    it('debe rechazar contraseña sin número', () => {
      const result = validatePassword('MiContraseña!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos un número');
    });

    it('debe rechazar contraseña sin carácter especial', () => {
      const result = validatePassword('MiContrasena123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Al menos un carácter especial');
    });

    it('debe rechazar contraseña muy corta', () => {
      const result = validatePassword('Abc12!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`Mínimo ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
    });

    it('debe rechazar contraseñas comunes', () => {
      const commonPasswords = ['password', '12345678', 'qwerty', 'admin123'];
      
      commonPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('No es una contraseña común');
      });
    });

    it('debe rechazar contraseñas comunes en español', () => {
      const result = validatePassword('contraseña');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No es una contraseña común');
    });
  });

  describe('validatePasswordMatch', () => {
    it('debe validar contraseñas que coinciden', () => {
      const result = validatePasswordMatch('MiContraseña123!', 'MiContraseña123!');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('debe rechazar contraseñas que no coinciden', () => {
      const result = validatePasswordMatch('MiContraseña123!', 'OtraContraseña456!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Las contraseñas no coinciden');
    });

    it('debe rechazar si confirmPassword está vacío', () => {
      const result = validatePasswordMatch('MiContraseña123!', '');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Confirma tu contraseña');
    });
  });

  describe('calculatePasswordStrength', () => {
    it('debe calcular fortaleza muy débil para contraseña vacía', () => {
      const strength = calculatePasswordStrength('');
      expect(strength.score).toBe(0);
      expect(strength.level).toBe('very-weak');
      expect(strength.feedback).toContain('Ingresa una contraseña');
    });

    it('debe calcular fortaleza muy fuerte para contraseña segura', () => {
      const strength = calculatePasswordStrength('MiContraseña123!Segura');
      expect(strength.score).toBe(4);
      expect(strength.level).toBe('very-strong');
    });

    it('debe detectar repetición de caracteres', () => {
      const strength = calculatePasswordStrength('Aaa111!!!');
      expect(strength.feedback.some(f => f.includes('repetir'))).toBe(true);
    });

    it('debe detectar solo números', () => {
      const strength = calculatePasswordStrength('12345678');
      expect(strength.feedback.some(f => f.includes('solo números'))).toBe(true);
    });

    it('debe detectar solo letras', () => {
      const strength = calculatePasswordStrength('abcdefgh');
      expect(strength.feedback.some(f => f.includes('solo letras'))).toBe(true);
    });

    it('debe detectar secuencias numéricas', () => {
      const strength = calculatePasswordStrength('Abc123def!');
      expect(strength.feedback.some(f => f.includes('secuencias numéricas'))).toBe(true);
    });

    it('debe detectar secuencias alfabéticas', () => {
      const strength = calculatePasswordStrength('Abc123!');
      expect(strength.feedback.some(f => f.includes('secuencias alfabéticas'))).toBe(true);
    });

    it('debe recomendar más de 12 caracteres', () => {
      const strength = calculatePasswordStrength('Abc123!');
      expect(strength.feedback.some(f => f.includes('12 caracteres'))).toBe(true);
    });
  });

  describe('getPasswordRequirements', () => {
    it('debe retornar todos los requisitos con su estado', () => {
      const requirements = getPasswordRequirements('MiContraseña123!');
      
      expect(requirements).toHaveLength(6);
      expect(requirements.every(req => req.met)).toBe(true);
    });

    it('debe marcar requisitos no cumplidos', () => {
      const requirements = getPasswordRequirements('abc');
      
      const unmet = requirements.filter(req => !req.met);
      expect(unmet.length).toBeGreaterThan(0);
    });
  });

  describe('checkPasswordRequirement', () => {
    it('debe validar longitud mínima', () => {
      expect(checkPasswordRequirement('12345678', 'minLength')).toBe(true);
      expect(checkPasswordRequirement('1234567', 'minLength')).toBe(false);
    });

    it('debe validar mayúscula', () => {
      expect(checkPasswordRequirement('Abc', 'uppercase')).toBe(true);
      expect(checkPasswordRequirement('abc', 'uppercase')).toBe(false);
    });

    it('debe validar minúscula', () => {
      expect(checkPasswordRequirement('Abc', 'lowercase')).toBe(true);
      expect(checkPasswordRequirement('ABC', 'lowercase')).toBe(false);
    });

    it('debe validar número', () => {
      expect(checkPasswordRequirement('abc123', 'number')).toBe(true);
      expect(checkPasswordRequirement('abc', 'number')).toBe(false);
    });

    it('debe validar carácter especial', () => {
      expect(checkPasswordRequirement('abc!', 'special')).toBe(true);
      expect(checkPasswordRequirement('abc', 'special')).toBe(false);
    });

    it('debe validar que no sea contraseña común', () => {
      expect(checkPasswordRequirement('MiContraseña123!', 'notCommon')).toBe(true);
      expect(checkPasswordRequirement('password', 'notCommon')).toBe(false);
      expect(checkPasswordRequirement('12345678', 'notCommon')).toBe(false);
    });
  });

  describe('generateSecurePassword', () => {
    it('debe generar contraseña de longitud especificada', () => {
      const password = generateSecurePassword(16);
      expect(password).toHaveLength(16);
    });

    it('debe generar contraseña que cumple todos los requisitos', () => {
      const password = generateSecurePassword(16);
      const result = validatePassword(password);
      
      expect(result.valid).toBe(true);
    });

    it('debe generar contraseña con mayúscula', () => {
      const password = generateSecurePassword(16);
      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('debe generar contraseña con minúscula', () => {
      const password = generateSecurePassword(16);
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('debe generar contraseña con número', () => {
      const password = generateSecurePassword(16);
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it('debe generar contraseña con carácter especial', () => {
      const password = generateSecurePassword(16);
      expect(/[^A-Za-z0-9]/.test(password)).toBe(true);
    });

    it('debe generar contraseñas diferentes cada vez', () => {
      const password1 = generateSecurePassword(16);
      const password2 = generateSecurePassword(16);
      
      expect(password1).not.toBe(password2);
    });
  });

  describe('Integración con casos reales', () => {
    it('debe validar contraseñas de ejemplo del diseño', () => {
      // Contraseñas del documento de diseño
      const validPasswords = [
        'MiContraseña123!',
        'Segur@2025Pass',
        'TechNova$2025',
        'P@ssw0rd!Strong',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
      });
    });

    it('debe rechazar contraseñas inseguras comunes', () => {
      const insecurePasswords = [
        'password',
        '12345678',
        'qwerty',
        'admin',
        'contraseña',
        'usuario',
      ];

      insecurePasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
      });
    });
  });
});
