/**
 * Tests para el sistema de manejo de errores de autenticación
 */

import {
  authErrorMessages,
  getAuthErrorMessage,
  extractErrorCode,
  parseAuthError,
  mapHttpStatusToErrorCode,
  authSuccessMessages,
  authWarningMessages,
} from '../auth-errors';
import type { AuthErrorCode } from '../../types/auth.types';

describe('auth-errors', () => {
  describe('authErrorMessages', () => {
    it('debe contener todos los códigos de error', () => {
      const expectedCodes: AuthErrorCode[] = [
        'invalid-email',
        'invalid-credentials',
        'email-already-exists',
        'weak-password',
        'passwords-dont-match',
        'invalid-token',
        'token-expired',
        'network-error',
        'server-error',
        'rate-limit-exceeded',
        'oauth-cancelled',
        'oauth-failed',
        'method-already-linked',
        'cannot-unlink-only-method',
        'unauthorized',
      ];

      expectedCodes.forEach((code) => {
        expect(authErrorMessages[code]).toBeDefined();
        expect(typeof authErrorMessages[code]).toBe('string');
        expect(authErrorMessages[code].length).toBeGreaterThan(0);
      });
    });

    it('debe tener mensajes en español', () => {
      expect(authErrorMessages['invalid-credentials']).toBe('Email o contraseña incorrectos');
      expect(authErrorMessages['email-already-exists']).toContain('ya está registrado');
      expect(authErrorMessages['token-expired']).toContain('expirado');
    });
  });

  describe('getAuthErrorMessage', () => {
    it('debe retornar el mensaje correcto para un código válido', () => {
      const message = getAuthErrorMessage('invalid-credentials');
      expect(message).toBe('Email o contraseña incorrectos');
    });

    it('debe retornar mensaje genérico para código inválido', () => {
      const message = getAuthErrorMessage('invalid-code' as AuthErrorCode);
      expect(message).toBe('Ha ocurrido un error. Intenta de nuevo');
    });
  });

  describe('extractErrorCode', () => {
    it('debe extraer código de objeto con propiedad code', () => {
      const error = { code: 'invalid-email' };
      const code = extractErrorCode(error);
      expect(code).toBe('invalid-email');
    });

    it('debe extraer código de error de Axios', () => {
      const error = {
        response: {
          data: {
            code: 'email-already-exists',
          },
        },
      };
      const code = extractErrorCode(error);
      expect(code).toBe('email-already-exists');
    });

    it('debe detectar errores de red', () => {
      const error = { message: 'Network error occurred' };
      const code = extractErrorCode(error);
      expect(code).toBe('network-error');
    });

    it('debe retornar server-error para errores desconocidos', () => {
      const error = { unknown: 'error' };
      const code = extractErrorCode(error);
      expect(code).toBe('server-error');
    });
  });

  describe('parseAuthError', () => {
    it('debe parsear error con código y mensaje', () => {
      const error = { code: 'invalid-credentials' };
      const parsed = parseAuthError(error);

      expect(parsed.code).toBe('invalid-credentials');
      expect(parsed.message).toBe('Email o contraseña incorrectos');
      expect(parsed.field).toBeUndefined();
    });

    it('debe parsear error con campo', () => {
      const error = {
        code: 'invalid-email',
        field: 'email',
      };
      const parsed = parseAuthError(error);

      expect(parsed.code).toBe('invalid-email');
      expect(parsed.field).toBe('email');
    });

    it('debe parsear error de Axios con campo', () => {
      const error = {
        response: {
          data: {
            code: 'weak-password',
            field: 'password',
          },
        },
      };
      const parsed = parseAuthError(error);

      expect(parsed.code).toBe('weak-password');
      expect(parsed.field).toBe('password');
    });
  });

  describe('mapHttpStatusToErrorCode', () => {
    it('debe mapear 401 a invalid-credentials', () => {
      const code = mapHttpStatusToErrorCode(401);
      expect(code).toBe('invalid-credentials');
    });

    it('debe mapear 409 a email-already-exists', () => {
      const code = mapHttpStatusToErrorCode(409);
      expect(code).toBe('email-already-exists');
    });

    it('debe mapear 429 a rate-limit-exceeded', () => {
      const code = mapHttpStatusToErrorCode(429);
      expect(code).toBe('rate-limit-exceeded');
    });

    it('debe mapear 410 a token-expired', () => {
      const code = mapHttpStatusToErrorCode(410);
      expect(code).toBe('token-expired');
    });

    it('debe mapear 500 a server-error', () => {
      const code = mapHttpStatusToErrorCode(500);
      expect(code).toBe('server-error');
    });

    it('debe considerar el endpoint para 400', () => {
      const loginCode = mapHttpStatusToErrorCode(400, '/api/auth/login');
      expect(loginCode).toBe('invalid-credentials');

      const registerCode = mapHttpStatusToErrorCode(400, '/api/auth/register');
      expect(registerCode).toBe('email-already-exists');
    });
  });

  describe('authSuccessMessages', () => {
    it('debe contener mensajes de éxito', () => {
      expect(authSuccessMessages.login).toBeDefined();
      expect(authSuccessMessages.register).toBeDefined();
      expect(authSuccessMessages.resetPassword).toBeDefined();
      expect(authSuccessMessages.logout).toBeDefined();
    });

    it('debe tener mensajes positivos', () => {
      expect(authSuccessMessages.login).toContain('Bienvenido');
      expect(authSuccessMessages.register).toContain('exitosamente');
    });
  });

  describe('authWarningMessages', () => {
    it('debe contener mensajes de advertencia', () => {
      expect(authWarningMessages.emailNotVerified).toBeDefined();
      expect(authWarningMessages.weakPassword).toBeDefined();
      expect(authWarningMessages.singleAuthMethod).toBeDefined();
    });
  });
});
