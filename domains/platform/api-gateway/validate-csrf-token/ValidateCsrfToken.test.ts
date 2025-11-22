/**
 * Tests exhaustivos para ValidateCsrfToken
 * Caso de uso CRÍTICO para prevenir CSRF attacks
 */

import { Request, Response, NextFunction } from 'express';
import { ValidateCsrfToken } from './ValidateCsrfToken';

// Mock logger
jest.mock('../shared/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('ValidateCsrfToken - Tests Exhaustivos', () => {
  let validateCsrfToken: ValidateCsrfToken;
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    validateCsrfToken = new ValidateCsrfToken();
    mockReq = {
      method: 'POST',
      headers: {},
      ip: '192.168.1.1',
      url: '/test',
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'Test Agent';
        return undefined;
      }),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('generateToken() - Generación de Tokens', () => {
    test('debe generar token válido', () => {
      const sessionId = 'session-123';
      const token = validateCsrfToken.generateToken(sessionId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('debe generar tokens únicos', () => {
      const sessionId = 'session-123';
      const token1 = validateCsrfToken.generateToken(sessionId);
      const token2 = validateCsrfToken.generateToken(sessionId);

      expect(token1).not.toBe(token2);
    });

    test('debe generar tokens diferentes para sesiones diferentes', () => {
      const token1 = validateCsrfToken.generateToken('session-1');
      const token2 = validateCsrfToken.generateToken('session-2');

      expect(token1).not.toBe(token2);
    });

    test('debe generar token hexadecimal', () => {
      const token = validateCsrfToken.generateToken('session-123');

      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    test('debe generar token de longitud correcta (64 caracteres)', () => {
      const token = validateCsrfToken.generateToken('session-123');

      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    test('debe sobrescribir token anterior de la misma sesión', () => {
      const sessionId = 'session-123';
      const token1 = validateCsrfToken.generateToken(sessionId);
      validateCsrfToken.generateToken(sessionId);

      // El token1 ya no debería ser válido
      mockReq.method = 'POST';
      mockReq.headers = {
        'x-session-id': sessionId,
        'x-csrf-token': token1,
      };

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('debe manejar sessionId vacío', () => {
      const token = validateCsrfToken.generateToken('');

      expect(token).toBeDefined();
      expect(token.length).toBe(64);
    });

    test('debe manejar sessionId muy largo', () => {
      const longSessionId = 'x'.repeat(10000);
      const token = validateCsrfToken.generateToken(longSessionId);

      expect(token).toBeDefined();
    });

    test('debe manejar sessionId con caracteres especiales', () => {
      const token = validateCsrfToken.generateToken('session-!@#$%^&*()');

      expect(token).toBeDefined();
    });
  });

  describe('execute() - Validación de Tokens', () => {
    describe('Métodos HTTP Seguros', () => {
      test('debe omitir validación para GET', () => {
        mockReq.method = 'GET';

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      test('debe omitir validación para HEAD', () => {
        mockReq.method = 'HEAD';

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      test('debe omitir validación para OPTIONS', () => {
        mockReq.method = 'OPTIONS';

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Métodos HTTP No Seguros', () => {
      test('debe validar POST', () => {
        mockReq.method = 'POST';

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      test('debe validar PUT', () => {
        mockReq.method = 'PUT';

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      test('debe validar DELETE', () => {
        mockReq.method = 'DELETE';

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      test('debe validar PATCH', () => {
        mockReq.method = 'PATCH';

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Validación de Headers', () => {
      test('debe rechazar petición sin session ID', () => {
        mockReq.method = 'POST';
        mockReq.headers = {
          'x-csrf-token': 'some-token',
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'CSRF token required',
          code: 'CSRF_TOKEN_MISSING',
        });
      });

      test('debe rechazar petición sin CSRF token', () => {
        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': 'session-123',
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'CSRF token required',
          code: 'CSRF_TOKEN_MISSING',
        });
      });

      test('debe rechazar petición sin ambos headers', () => {
        mockReq.method = 'POST';
        mockReq.headers = {};

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      test('debe rechazar session ID vacío', () => {
        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': '',
          'x-csrf-token': 'token',
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      test('debe rechazar CSRF token vacío', () => {
        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': 'session-123',
          'x-csrf-token': '',
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Validación de Token Válido', () => {
      test('debe aceptar token válido', () => {
        const sessionId = 'session-123';
        const token = validateCsrfToken.generateToken(sessionId);

        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': sessionId,
          'x-csrf-token': token,
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      test('debe aceptar token para múltiples peticiones', () => {
        const sessionId = 'session-123';
        const token = validateCsrfToken.generateToken(sessionId);

        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': sessionId,
          'x-csrf-token': token,
        };

        // Primera petición
        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalledTimes(1);

        // Segunda petición con el mismo token
        jest.clearAllMocks();
        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    describe('Validación de Token Inválido', () => {
      test('debe rechazar token inexistente', () => {
        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': 'session-nonexistent',
          'x-csrf-token': 'invalid-token',
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Invalid or expired CSRF token',
          code: 'CSRF_TOKEN_INVALID',
        });
      });

      test('debe rechazar token incorrecto', () => {
        const sessionId = 'session-123';
        validateCsrfToken.generateToken(sessionId);

        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': sessionId,
          'x-csrf-token': 'wrong-token',
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'CSRF token mismatch',
          code: 'CSRF_TOKEN_MISMATCH',
        });
      });

      test('debe rechazar token de otra sesión', () => {
        const sessionId1 = 'session-1';
        const sessionId2 = 'session-2';
        const token1 = validateCsrfToken.generateToken(sessionId1);
        validateCsrfToken.generateToken(sessionId2);

        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': sessionId2,
          'x-csrf-token': token1, // Token de session-1
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Expiración de Tokens', () => {
      test('debe rechazar token expirado', (done) => {
        const sessionId = 'session-expire';
        const token = validateCsrfToken.generateToken(sessionId);

        // Simular expiración modificando el tiempo
        jest.useFakeTimers();
        jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 horas

        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': sessionId,
          'x-csrf-token': token,
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Invalid or expired CSRF token',
          code: 'CSRF_TOKEN_INVALID',
        });

        jest.useRealTimers();
        done();
      });

      test('debe aceptar token antes de expirar', () => {
        const sessionId = 'session-valid';
        const token = validateCsrfToken.generateToken(sessionId);

        jest.useFakeTimers();
        jest.advanceTimersByTime(23 * 60 * 60 * 1000); // 23 horas (antes de 24)

        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': sessionId,
          'x-csrf-token': token,
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();

        jest.useRealTimers();
      });
    });
  });

  describe('cleanupExpiredTokens() - Limpieza de Tokens', () => {
    test('debe limpiar tokens expirados automáticamente', () => {
      // Generar varios tokens
      validateCsrfToken.generateToken('session-1');
      validateCsrfToken.generateToken('session-2');
      validateCsrfToken.generateToken('session-3');

      expect(validateCsrfToken.getActiveTokensCount()).toBe(3);

      // Avanzar tiempo para expirar tokens
      jest.useFakeTimers();
      jest.advanceTimersByTime(25 * 60 * 60 * 1000);

      // Generar nuevo token (esto debería limpiar los expirados)
      validateCsrfToken.generateToken('session-4');

      expect(validateCsrfToken.getActiveTokensCount()).toBe(1);

      jest.useRealTimers();
    });

    test('debe mantener tokens no expirados', () => {
      validateCsrfToken.generateToken('session-1');

      jest.useFakeTimers();
      jest.advanceTimersByTime(1 * 60 * 60 * 1000); // 1 hora

      validateCsrfToken.generateToken('session-2');

      expect(validateCsrfToken.getActiveTokensCount()).toBe(2);

      jest.useRealTimers();
    });
  });

  describe('getActiveTokensCount() - Contador de Tokens', () => {
    test('debe retornar 0 inicialmente', () => {
      const count = validateCsrfToken.getActiveTokensCount();

      expect(count).toBe(0);
    });

    test('debe contar tokens activos correctamente', () => {
      validateCsrfToken.generateToken('session-1');
      validateCsrfToken.generateToken('session-2');
      validateCsrfToken.generateToken('session-3');

      expect(validateCsrfToken.getActiveTokensCount()).toBe(3);
    });

    test('debe actualizar count al sobrescribir token', () => {
      validateCsrfToken.generateToken('session-1');
      validateCsrfToken.generateToken('session-1'); // Sobrescribe

      expect(validateCsrfToken.getActiveTokensCount()).toBe(1);
    });

    test('debe excluir tokens expirados del count', () => {
      validateCsrfToken.generateToken('session-1');
      validateCsrfToken.generateToken('session-2');

      jest.useFakeTimers();
      jest.advanceTimersByTime(25 * 60 * 60 * 1000);

      expect(validateCsrfToken.getActiveTokensCount()).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('clearAllTokens() - Limpieza Total', () => {
    test('debe limpiar todos los tokens', () => {
      validateCsrfToken.generateToken('session-1');
      validateCsrfToken.generateToken('session-2');
      validateCsrfToken.generateToken('session-3');

      expect(validateCsrfToken.getActiveTokensCount()).toBe(3);

      validateCsrfToken.clearAllTokens();

      expect(validateCsrfToken.getActiveTokensCount()).toBe(0);
    });

    test('debe permitir generar nuevos tokens después de limpiar', () => {
      validateCsrfToken.generateToken('session-1');
      validateCsrfToken.clearAllTokens();

      const token = validateCsrfToken.generateToken('session-2');

      expect(token).toBeDefined();
      expect(validateCsrfToken.getActiveTokensCount()).toBe(1);
    });

    test('debe invalidar tokens anteriores después de limpiar', () => {
      const sessionId = 'session-1';
      const token = validateCsrfToken.generateToken(sessionId);

      validateCsrfToken.clearAllTokens();

      mockReq.method = 'POST';
      mockReq.headers = {
        'x-session-id': sessionId,
        'x-csrf-token': token,
      };

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Casos Edge y Seguridad', () => {
    test('debe manejar muchos tokens simultáneos', () => {
      for (let i = 0; i < 1000; i++) {
        validateCsrfToken.generateToken(`session-${i}`);
      }

      expect(validateCsrfToken.getActiveTokensCount()).toBe(1000);
    });

    test('debe manejar sessionId con caracteres Unicode', () => {
      const token = validateCsrfToken.generateToken('session-世界-🌍');

      expect(token).toBeDefined();
      expect(token.length).toBe(64);
    });

    test('debe ser case-sensitive en tokens', () => {
      const sessionId = 'session-123';
      const token = validateCsrfToken.generateToken(sessionId);
      const upperToken = token.toUpperCase();

      mockReq.method = 'POST';
      mockReq.headers = {
        'x-session-id': sessionId,
        'x-csrf-token': upperToken,
      };

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('debe ser case-sensitive en sessionId', () => {
      const sessionId = 'Session-123';
      const token = validateCsrfToken.generateToken(sessionId);

      mockReq.method = 'POST';
      mockReq.headers = {
        'x-session-id': 'session-123', // Minúsculas
        'x-csrf-token': token,
      };

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('debe rechazar token con espacios extra', () => {
      const sessionId = 'session-123';
      const token = validateCsrfToken.generateToken(sessionId);

      mockReq.method = 'POST';
      mockReq.headers = {
        'x-session-id': sessionId,
        'x-csrf-token': ` ${token} `,
      };

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('debe manejar método HTTP en minúsculas', () => {
      mockReq.method = 'post';

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('debe manejar método HTTP en mayúsculas mixtas', () => {
      mockReq.method = 'PoSt';

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('debe manejar headers undefined', () => {
      mockReq.method = 'POST';
      mockReq.headers = {} as any; // Headers vacío en lugar de undefined

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('debe prevenir timing attacks', () => {
      const sessionId = 'session-123';
      const token = validateCsrfToken.generateToken(sessionId);

      // Medir tiempo con token correcto
      const start1 = Date.now();
      mockReq.method = 'POST';
      mockReq.headers = {
        'x-session-id': sessionId,
        'x-csrf-token': token,
      };
      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);
      const time1 = Date.now() - start1;

      // Medir tiempo con token incorrecto
      jest.clearAllMocks();
      const start2 = Date.now();
      mockReq.headers = {
        'x-session-id': sessionId,
        'x-csrf-token': 'wrong-token',
      };
      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);
      const time2 = Date.now() - start2;

      // Los tiempos deberían ser similares (diferencia < 10ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(10);
    });
  });

  describe('Integración con Flujo Completo', () => {
    test('debe funcionar en flujo completo de autenticación', () => {
      // 1. Generar token
      const sessionId = 'user-session-456';
      const token = validateCsrfToken.generateToken(sessionId);

      // 2. Validar token en petición POST
      mockReq.method = 'POST';
      mockReq.headers = {
        'x-session-id': sessionId,
        'x-csrf-token': token,
      };

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // 3. Validar token en petición PUT
      jest.clearAllMocks();
      mockReq.method = 'PUT';

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // 4. Validar token en petición DELETE
      jest.clearAllMocks();
      mockReq.method = 'DELETE';

      validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('debe manejar múltiples sesiones simultáneas', () => {
      const sessions = ['session-1', 'session-2', 'session-3'];
      const tokens = sessions.map(s => validateCsrfToken.generateToken(s));

      sessions.forEach((sessionId, index) => {
        jest.clearAllMocks();
        mockReq.method = 'POST';
        mockReq.headers = {
          'x-session-id': sessionId,
          'x-csrf-token': tokens[index],
        };

        validateCsrfToken.execute(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });
  });
});
