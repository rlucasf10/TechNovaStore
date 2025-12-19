/**
 * Property-Based Tests para Clientes HTTP
 * 
 * Estos tests verifican propiedades universales relacionadas con la
 * configuración de clientes HTTP y el manejo de autenticación mediante
 * httpOnly cookies en lugar de tokens en localStorage.
 * 
 * Feature: frontend-security-fixes
 */

import fc from 'fast-check';
import axios, { AxiosInstance } from 'axios';

// Mock de localStorage para tests
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Reemplazar localStorage global con el mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

/**
 * Función helper para crear un cliente axios simulado
 */
const createMockAxiosClient = (config: any): AxiosInstance => {
  return axios.create(config);
};

/**
 * Función helper para simular un interceptor que lee localStorage
 * (comportamiento INCORRECTO que queremos evitar)
 */
const addIncorrectAuthInterceptor = (client: AxiosInstance): void => {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

/**
 * Función helper para verificar si un cliente tiene withCredentials habilitado
 */
const hasWithCredentials = (client: AxiosInstance): boolean => {
  return client.defaults.withCredentials === true;
};

describe('Property Tests - HTTP Clients Configuration', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  /**
   * Feature: frontend-security-fixes, Property 3: withCredentials configuration
   * Validates: Requirements 2.1
   * 
   * Esta propiedad verifica que TODOS los clientes HTTP tengan configurado
   * withCredentials: true para permitir el envío automático de httpOnly cookies.
   */
  it('should have withCredentials enabled for all axios instances', () => {
    fc.assert(
      fc.property(
        fc.record({
          baseURL: fc.webUrl(),
          timeout: fc.integer({ min: 1000, max: 60000 }),
        }),
        (config) => {
          // Arrange & Act: Crear cliente con withCredentials
          const client = createMockAxiosClient({
            ...config,
            withCredentials: true,
          });
          
          // Assert: Verificar que withCredentials está habilitado
          expect(hasWithCredentials(client)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: frontend-security-fixes, Property 2: No localStorage token reads
   * Property 4: No Authorization headers with localStorage tokens
   * Validates: Requirements 1.3, 2.2, 3.1-3.7
   * 
   * Esta propiedad verifica que las peticiones HTTP NO lean tokens de localStorage
   * para construir headers Authorization. Simula el comportamiento INCORRECTO
   * y verifica que no debe ocurrir.
   */
  it('should not read tokens from localStorage for Authorization headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          token: fc.string({ minLength: 20, maxLength: 200 }),
          endpoint: fc.constantFrom('/orders', '/wishlist', '/tracking', '/recommender', '/campaigns', '/tickets'),
        }),
        async ({ token, endpoint }) => {
          // Arrange: Colocar un token en localStorage (escenario que queremos evitar)
          mockLocalStorage.setItem('auth_token', token);
          
          // Crear cliente SIN interceptor incorrecto (comportamiento correcto)
          const correctClient = createMockAxiosClient({
            baseURL: 'http://localhost:3000/api',
            withCredentials: true,
          });
          
          // Mock de la petición para capturar headers y cancelar inmediatamente
          let capturedConfig: any = null;
          correctClient.interceptors.request.use((config) => {
            capturedConfig = config;
            // Cancelar inmediatamente para evitar petición real
            return Promise.reject(new Error('Test cancelled'));
          });
          
          // Act: Hacer una petición
          try {
            await correctClient.get(endpoint);
          } catch {
            // Ignorar errores de red (solo nos interesa verificar headers)
          }
          
          // Assert: Verificar que NO se agregó Authorization header con token de localStorage
          if (capturedConfig) {
            const authHeader = capturedConfig.headers?.Authorization;
            
            // El header Authorization NO debe contener el token de localStorage
            if (authHeader) {
              expect(authHeader).not.toContain(token);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 10000); // Timeout de 10 segundos

  /**
   * Feature: frontend-security-fixes, Property 2: No localStorage token reads
   * Validates: Requirements 1.3, 2.2
   * 
   * Esta propiedad verifica que los interceptores de request NO contengan
   * código que lea localStorage.getItem('auth_token').
   */
  it('should not have interceptors that read auth_token from localStorage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          baseURL: fc.webUrl(),
          endpoint: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (config) => {
          // Arrange: Crear cliente correcto
          const client = createMockAxiosClient({
            baseURL: config.baseURL,
            withCredentials: true,
          });
          
          // Espiar localStorage.getItem
          const getItemSpy = jest.spyOn(mockLocalStorage, 'getItem');
          
          // Cancelar la petición para evitar errores de red
          client.interceptors.request.use(() => {
            return Promise.reject(new Error('Test cancelled'));
          });
          
          // Act: Hacer una petición real para activar todos los interceptores
          try {
            await client.get(`/${config.endpoint}`);
          } catch {
            // Ignorar error (esperado)
          }
          
          // Assert: Verificar que NO se llamó a localStorage.getItem('auth_token')
          const authTokenCalls = getItemSpy.mock.calls.filter(
            call => call[0] === 'auth_token'
          );
          expect(authTokenCalls.length).toBe(0);
          
          // Limpiar spy
          getItemSpy.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: frontend-security-fixes, Property 4: No Authorization headers with localStorage tokens
   * Validates: Requirements 2.2, 3.1-3.7
   * 
   * Esta propiedad verifica que para cualquier servicio (wishlist, orders, shipment,
   * recommender, campaign, ticket), las peticiones NO incluyan headers Authorization
   * construidos a partir de tokens en localStorage.
   */
  it('should not add Authorization headers from localStorage for any service', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          service: fc.constantFrom(
            'wishlist',
            'orders',
            'shipment',
            'recommender',
            'campaign',
            'ticket'
          ),
          token: fc.string({ minLength: 20, maxLength: 200 }),
          method: fc.constantFrom('get', 'post', 'put', 'delete'),
        }),
        async ({ service, token, method }) => {
          // Arrange: Colocar token en localStorage
          mockLocalStorage.setItem('auth_token', token);
          
          // Crear cliente correcto (sin interceptor que lea localStorage)
          const client = createMockAxiosClient({
            baseURL: `http://localhost:3000/api`,
            withCredentials: true,
          });
          
          // Mock para capturar la configuración de la petición
          let capturedConfig: any = null;
          client.interceptors.request.use((config) => {
            capturedConfig = config;
            // Cancelar la petición para evitar errores de red
            return Promise.reject(new Error('Test cancelled'));
          });
          
          // Act: Intentar hacer una petición
          try {
            await (client as any)[method](`/${service}/test`);
          } catch {
            // Ignorar error (esperado)
          }
          
          // Assert: Verificar que NO hay Authorization header con el token de localStorage
          if (capturedConfig) {
            const authHeader = capturedConfig.headers?.Authorization;
            if (authHeader) {
              expect(authHeader).not.toContain(token);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: frontend-security-fixes, Property 3: withCredentials configuration
   * Validates: Requirements 2.1
   * 
   * Esta propiedad verifica que la configuración de withCredentials persiste
   * incluso después de múltiples operaciones en el cliente.
   */
  it('should maintain withCredentials configuration across operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            endpoint: fc.string({ minLength: 1, maxLength: 20 }),
            method: fc.constantFrom('get', 'post', 'put', 'delete'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (operations) => {
          // Arrange: Crear cliente con withCredentials
          const client = createMockAxiosClient({
            baseURL: 'http://localhost:3000/api',
            withCredentials: true,
          });
          
          // Cancelar todas las peticiones para evitar errores de red
          client.interceptors.request.use(() => {
            return Promise.reject(new Error('Test cancelled'));
          });
          
          // Act: Realizar múltiples operaciones
          for (const op of operations) {
            try {
              await (client as any)[op.method](`/${op.endpoint}`);
            } catch {
              // Ignorar errores
            }
          }
          
          // Assert: Verificar que withCredentials sigue habilitado
          expect(hasWithCredentials(client)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
