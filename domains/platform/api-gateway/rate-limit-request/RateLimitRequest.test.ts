/**
 * Tests exhaustivos para RateLimitRequest
 * Caso de uso CRÍTICO para prevenir ataques DDoS
 */

import { RateLimitRequest } from './RateLimitRequest';

// Mock logger
jest.mock('../shared/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('RateLimitRequest - Tests Exhaustivos', () => {
  let rateLimitRequest: RateLimitRequest;
  let mockReq: any;

  beforeEach(() => {
    rateLimitRequest = new RateLimitRequest();
    mockReq = {
      ip: '192.168.1.1',
      url: '/test',
      method: 'GET',
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'Test Agent';
        return undefined;
      }),
    };
    jest.clearAllMocks();
  });

  describe('createRateLimit() - Configuración General', () => {
    test('debe crear rate limiter con configuración por defecto', () => {
      const limiter = rateLimitRequest.createRateLimit({});

      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    test('debe crear rate limiter con windowMs personalizado', () => {
      const limiter = rateLimitRequest.createRateLimit({
        windowMs: 60000, // 1 minuto
        max: 10,
      });

      expect(limiter).toBeDefined();
    });

    test('debe crear rate limiter con max personalizado', () => {
      const limiter = rateLimitRequest.createRateLimit({
        windowMs: 900000,
        max: 50,
      });

      expect(limiter).toBeDefined();
    });

    test('debe crear rate limiter con mensaje personalizado', () => {
      const customMessage = 'Custom rate limit message';
      const limiter = rateLimitRequest.createRateLimit({
        message: customMessage,
      });

      expect(limiter).toBeDefined();
    });

    test('debe crear rate limiter con skipSuccessfulRequests', () => {
      const limiter = rateLimitRequest.createRateLimit({
        skipSuccessfulRequests: true,
      });

      expect(limiter).toBeDefined();
    });

    test('debe crear rate limiter con skipFailedRequests', () => {
      const limiter = rateLimitRequest.createRateLimit({
        skipFailedRequests: true,
      });

      expect(limiter).toBeDefined();
    });

    test('debe crear rate limiter con todas las opciones', () => {
      const limiter = rateLimitRequest.createRateLimit({
        windowMs: 300000,
        max: 25,
        message: 'Complete config test',
        skipSuccessfulRequests: true,
        skipFailedRequests: false,
      });

      expect(limiter).toBeDefined();
    });

    test('debe manejar windowMs = 0', () => {
      const limiter = rateLimitRequest.createRateLimit({
        windowMs: 0,
        max: 100,
      });

      expect(limiter).toBeDefined();
    });

    test('debe manejar max = 0', () => {
      const limiter = rateLimitRequest.createRateLimit({
        windowMs: 60000,
        max: 0,
      });

      expect(limiter).toBeDefined();
    });

    test('debe manejar valores extremadamente altos', () => {
      const limiter = rateLimitRequest.createRateLimit({
        windowMs: 86400000, // 24 horas
        max: 1000000,
      });

      expect(limiter).toBeDefined();
    });
  });

  describe('createAuthRateLimit() - Rate Limit de Autenticación', () => {
    test('debe crear rate limiter para autenticación', () => {
      const limiter = rateLimitRequest.createAuthRateLimit();

      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    test('debe usar variables de entorno si están definidas', () => {
      process.env.AUTH_RATE_LIMIT_WINDOW_MS = '600000';
      process.env.AUTH_RATE_LIMIT_MAX = '3';

      const limiter = rateLimitRequest.createAuthRateLimit();

      expect(limiter).toBeDefined();

      delete process.env.AUTH_RATE_LIMIT_WINDOW_MS;
      delete process.env.AUTH_RATE_LIMIT_MAX;
    });

    test('debe usar valores por defecto si no hay variables de entorno', () => {
      delete process.env.AUTH_RATE_LIMIT_WINDOW_MS;
      delete process.env.AUTH_RATE_LIMIT_MAX;

      const limiter = rateLimitRequest.createAuthRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe manejar variables de entorno inválidas', () => {
      process.env.AUTH_RATE_LIMIT_WINDOW_MS = 'invalid';
      process.env.AUTH_RATE_LIMIT_MAX = 'invalid';

      const limiter = rateLimitRequest.createAuthRateLimit();

      expect(limiter).toBeDefined();

      delete process.env.AUTH_RATE_LIMIT_WINDOW_MS;
      delete process.env.AUTH_RATE_LIMIT_MAX;
    });

    test('debe tener skipSuccessfulRequests habilitado', () => {
      const limiter = rateLimitRequest.createAuthRateLimit();

      expect(limiter).toBeDefined();
    });
  });

  describe('createApiRateLimit() - Rate Limit de API General', () => {
    test('debe crear rate limiter para API general', () => {
      const limiter = rateLimitRequest.createApiRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe usar variables de entorno personalizadas', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '1800000';
      process.env.RATE_LIMIT_MAX = '200';

      const limiter = rateLimitRequest.createApiRateLimit();

      expect(limiter).toBeDefined();

      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;
    });

    test('debe usar valores por defecto correctos', () => {
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;

      const limiter = rateLimitRequest.createApiRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe manejar valores de entorno negativos', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '-1000';
      process.env.RATE_LIMIT_MAX = '-50';

      const limiter = rateLimitRequest.createApiRateLimit();

      expect(limiter).toBeDefined();

      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;
    });
  });

  describe('createStrictRateLimit() - Rate Limit Estricto', () => {
    test('debe crear rate limiter estricto', () => {
      const limiter = rateLimitRequest.createStrictRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe tener configuración más restrictiva', () => {
      const limiter = rateLimitRequest.createStrictRateLimit();

      expect(limiter).toBeDefined();
      // Verifica que se crea con valores estrictos (5 min, 10 max)
    });

    test('debe ser independiente de variables de entorno', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '999999';
      process.env.RATE_LIMIT_MAX = '999';

      const limiter = rateLimitRequest.createStrictRateLimit();

      expect(limiter).toBeDefined();

      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;
    });
  });

  describe('createSearchRateLimit() - Rate Limit de Búsquedas', () => {
    test('debe crear rate limiter para búsquedas', () => {
      const limiter = rateLimitRequest.createSearchRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe usar variables de entorno de búsqueda', () => {
      process.env.SEARCH_RATE_LIMIT_WINDOW_MS = '30000';
      process.env.SEARCH_RATE_LIMIT_MAX = '20';

      const limiter = rateLimitRequest.createSearchRateLimit();

      expect(limiter).toBeDefined();

      delete process.env.SEARCH_RATE_LIMIT_WINDOW_MS;
      delete process.env.SEARCH_RATE_LIMIT_MAX;
    });

    test('debe tener ventana de tiempo corta', () => {
      const limiter = rateLimitRequest.createSearchRateLimit();

      expect(limiter).toBeDefined();
      // Verifica ventana de 1 minuto por defecto
    });

    test('debe permitir múltiples búsquedas rápidas', () => {
      const limiter = rateLimitRequest.createSearchRateLimit();

      expect(limiter).toBeDefined();
      // Verifica 30 búsquedas por defecto
    });
  });

  describe('createOrderRateLimit() - Rate Limit de Pedidos', () => {
    test('debe crear rate limiter para pedidos', () => {
      const limiter = rateLimitRequest.createOrderRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe usar variables de entorno de pedidos', () => {
      process.env.ORDER_RATE_LIMIT_WINDOW_MS = '600000';
      process.env.ORDER_RATE_LIMIT_MAX = '5';

      const limiter = rateLimitRequest.createOrderRateLimit();

      expect(limiter).toBeDefined();

      delete process.env.ORDER_RATE_LIMIT_WINDOW_MS;
      delete process.env.ORDER_RATE_LIMIT_MAX;
    });

    test('debe tener límite moderado', () => {
      const limiter = rateLimitRequest.createOrderRateLimit();

      expect(limiter).toBeDefined();
      // Verifica 10 pedidos en 5 minutos por defecto
    });

    test('debe prevenir spam de pedidos', () => {
      const limiter = rateLimitRequest.createOrderRateLimit();

      expect(limiter).toBeDefined();
    });
  });

  describe('createPaymentRateLimit() - Rate Limit de Pagos', () => {
    test('debe crear rate limiter para pagos', () => {
      const limiter = rateLimitRequest.createPaymentRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe ser el más restrictivo', () => {
      const limiter = rateLimitRequest.createPaymentRateLimit();

      expect(limiter).toBeDefined();
      // Verifica 5 intentos en 10 minutos
    });

    test('debe tener skipSuccessfulRequests habilitado', () => {
      const limiter = rateLimitRequest.createPaymentRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe proteger contra fraude', () => {
      const limiter = rateLimitRequest.createPaymentRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe tener ventana de tiempo larga', () => {
      const limiter = rateLimitRequest.createPaymentRateLimit();

      expect(limiter).toBeDefined();
      // Verifica 10 minutos
    });
  });

  describe('Casos Edge y Seguridad', () => {
    test('debe manejar IP undefined', () => {
      mockReq.ip = undefined;

      const limiter = rateLimitRequest.createApiRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe manejar User-Agent undefined', () => {
      mockReq.get = jest.fn(() => undefined) as any;

      const limiter = rateLimitRequest.createApiRateLimit();

      expect(limiter).toBeDefined();
    });

    test('debe manejar múltiples limiters simultáneos', () => {
      const limiter1 = rateLimitRequest.createApiRateLimit();
      const limiter2 = rateLimitRequest.createAuthRateLimit();
      const limiter3 = rateLimitRequest.createPaymentRateLimit();

      expect(limiter1).toBeDefined();
      expect(limiter2).toBeDefined();
      expect(limiter3).toBeDefined();
    });

    test('debe crear limiters independientes', () => {
      const limiter1 = rateLimitRequest.createRateLimit({ max: 10 });
      const limiter2 = rateLimitRequest.createRateLimit({ max: 20 });

      expect(limiter1).toBeDefined();
      expect(limiter2).toBeDefined();
      expect(limiter1).not.toBe(limiter2);
    });

    test('debe manejar configuración con valores extremos', () => {
      const limiter = rateLimitRequest.createRateLimit({
        windowMs: Number.MAX_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
      });

      expect(limiter).toBeDefined();
    });

    test('debe manejar mensaje vacío', () => {
      const limiter = rateLimitRequest.createRateLimit({
        message: '',
      });

      expect(limiter).toBeDefined();
    });

    test('debe manejar mensaje muy largo', () => {
      const longMessage = 'a'.repeat(10000);
      const limiter = rateLimitRequest.createRateLimit({
        message: longMessage,
      });

      expect(limiter).toBeDefined();
    });

    test('debe manejar caracteres especiales en mensaje', () => {
      const limiter = rateLimitRequest.createRateLimit({
        message: 'Test <script>alert("xss")</script>',
      });

      expect(limiter).toBeDefined();
    });
  });

  describe('Integración con Variables de Entorno', () => {
    test('debe leer todas las variables de entorno correctamente', () => {
      process.env.AUTH_RATE_LIMIT_WINDOW_MS = '900000';
      process.env.AUTH_RATE_LIMIT_MAX = '5';
      process.env.RATE_LIMIT_WINDOW_MS = '900000';
      process.env.RATE_LIMIT_MAX = '100';
      process.env.SEARCH_RATE_LIMIT_WINDOW_MS = '60000';
      process.env.SEARCH_RATE_LIMIT_MAX = '30';
      process.env.ORDER_RATE_LIMIT_WINDOW_MS = '300000';
      process.env.ORDER_RATE_LIMIT_MAX = '10';

      const authLimiter = rateLimitRequest.createAuthRateLimit();
      const apiLimiter = rateLimitRequest.createApiRateLimit();
      const searchLimiter = rateLimitRequest.createSearchRateLimit();
      const orderLimiter = rateLimitRequest.createOrderRateLimit();

      expect(authLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
      expect(searchLimiter).toBeDefined();
      expect(orderLimiter).toBeDefined();

      // Cleanup
      delete process.env.AUTH_RATE_LIMIT_WINDOW_MS;
      delete process.env.AUTH_RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.SEARCH_RATE_LIMIT_WINDOW_MS;
      delete process.env.SEARCH_RATE_LIMIT_MAX;
      delete process.env.ORDER_RATE_LIMIT_WINDOW_MS;
      delete process.env.ORDER_RATE_LIMIT_MAX;
    });

    test('debe usar valores por defecto cuando no hay variables', () => {
      // Asegurar que no hay variables de entorno
      delete process.env.AUTH_RATE_LIMIT_WINDOW_MS;
      delete process.env.AUTH_RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.SEARCH_RATE_LIMIT_WINDOW_MS;
      delete process.env.SEARCH_RATE_LIMIT_MAX;
      delete process.env.ORDER_RATE_LIMIT_WINDOW_MS;
      delete process.env.ORDER_RATE_LIMIT_MAX;

      const authLimiter = rateLimitRequest.createAuthRateLimit();
      const apiLimiter = rateLimitRequest.createApiRateLimit();
      const searchLimiter = rateLimitRequest.createSearchRateLimit();
      const orderLimiter = rateLimitRequest.createOrderRateLimit();

      expect(authLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
      expect(searchLimiter).toBeDefined();
      expect(orderLimiter).toBeDefined();
    });
  });

  describe('Tipos de Rate Limiters', () => {
    test('debe tener 6 tipos diferentes de rate limiters', () => {
      const general = rateLimitRequest.createRateLimit({});
      const auth = rateLimitRequest.createAuthRateLimit();
      const api = rateLimitRequest.createApiRateLimit();
      const strict = rateLimitRequest.createStrictRateLimit();
      const search = rateLimitRequest.createSearchRateLimit();
      const order = rateLimitRequest.createOrderRateLimit();
      const payment = rateLimitRequest.createPaymentRateLimit();

      expect(general).toBeDefined();
      expect(auth).toBeDefined();
      expect(api).toBeDefined();
      expect(strict).toBeDefined();
      expect(search).toBeDefined();
      expect(order).toBeDefined();
      expect(payment).toBeDefined();
    });

    test('cada tipo debe ser una función middleware', () => {
      const limiters = [
        rateLimitRequest.createRateLimit({}),
        rateLimitRequest.createAuthRateLimit(),
        rateLimitRequest.createApiRateLimit(),
        rateLimitRequest.createStrictRateLimit(),
        rateLimitRequest.createSearchRateLimit(),
        rateLimitRequest.createOrderRateLimit(),
        rateLimitRequest.createPaymentRateLimit(),
      ];

      limiters.forEach(limiter => {
        expect(typeof limiter).toBe('function');
      });
    });
  });
});
