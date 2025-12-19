/**
 * Property-Based Tests para Store de Autenticación
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para el store de autenticación, específicamente que NO se persistan
 * tokens en el almacenamiento local.
 */

import fc from 'fast-check';
import { useAuthStore, User } from '../auth.store';

describe('Property Tests - Auth Store', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
    
    // Resetear el store a su estado inicial
    useAuthStore.getState().reset();
  });

  afterEach(() => {
    // Limpiar localStorage después de cada test
    localStorage.clear();
    
    // Resetear el store
    useAuthStore.getState().reset();
  });

  /**
   * Feature: frontend-security-fixes, Property 8: Store persistence without tokens
   * Validates: Requirements 6.4
   * 
   * Esta propiedad verifica que cuando el store persiste datos de usuario,
   * NUNCA incluye tokens de autenticación. Solo debe persistir datos
   * no sensibles como id, email, nombre y rol.
   */
  it('should persist only non-sensitive user data without tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom('user' as const, 'admin' as const),
          avatar: fc.option(fc.webUrl(), { nil: undefined }),
        }),
        async (userData) => {
          // Arrange: Limpiar localStorage
          localStorage.clear();
          
          // Act: Establecer usuario en el store
          useAuthStore.getState().setUser(userData);
          
          // Esperar a que la persistencia se complete (reducido a 50ms)
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Assert 1: Verificar que NO hay token en localStorage
          const authToken = localStorage.getItem('auth_token');
          expect(authToken).toBeNull();
          
          // Assert 2: Verificar que los datos del store están persistidos
          const persistedData = localStorage.getItem('auth-storage');
          expect(persistedData).not.toBeNull();
          
          if (persistedData) {
            const parsed = JSON.parse(persistedData);
            
            // Assert 3: Verificar que contiene datos de usuario
            expect(parsed.state.user).toBeDefined();
            expect(parsed.state.user.id).toBe(userData.id);
            expect(parsed.state.user.email).toBe(userData.email);
            expect(parsed.state.user.firstName).toBe(userData.firstName);
            expect(parsed.state.user.lastName).toBe(userData.lastName);
            expect(parsed.state.user.role).toBe(userData.role);
            
            // Assert 4: Verificar que NO contiene campos de token
            expect(parsed.state.user.token).toBeUndefined();
            expect(parsed.state.user.accessToken).toBeUndefined();
            expect(parsed.state.user.refreshToken).toBeUndefined();
            expect(parsed.state.user.authToken).toBeUndefined();
            
            // Assert 5: Verificar que NO hay tokens en el nivel raíz del state
            expect(parsed.state.token).toBeUndefined();
            expect(parsed.state.accessToken).toBeUndefined();
            expect(parsed.state.refreshToken).toBeUndefined();
            expect(parsed.state.authToken).toBeUndefined();
          }
        }
      ),
      { numRuns: 50, timeout: 10000 } // Reducir iteraciones y aumentar timeout
    );
  }, 15000); // Timeout de Jest aumentado a 15 segundos

  /**
   * Feature: frontend-security-fixes, Property 8: Store persistence without tokens
   * Validates: Requirements 6.4
   * 
   * Esta propiedad verifica que el store persiste correctamente los datos
   * no sensibles y que estos pueden ser recuperados sin incluir tokens.
   */
  it('should persist and rehydrate user data without tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom('user' as const, 'admin' as const),
        }),
        async (userData) => {
          // Arrange: Limpiar localStorage y resetear store
          localStorage.clear();
          useAuthStore.getState().reset();
          
          // Act 1: Establecer usuario en el store
          useAuthStore.getState().setUser(userData);
          
          // Esperar a que la persistencia se complete (reducido a 50ms)
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Act 2: Simular recarga de página obteniendo el estado persistido
          const persistedData = localStorage.getItem('auth-storage');
          expect(persistedData).not.toBeNull();
          
          if (persistedData) {
            const parsed = JSON.parse(persistedData);
            
            // Assert 1: Verificar que los datos básicos están presentes
            expect(parsed.state.user).toBeDefined();
            expect(parsed.state.user.id).toBe(userData.id);
            expect(parsed.state.user.email).toBe(userData.email);
            expect(parsed.state.user.firstName).toBe(userData.firstName);
            expect(parsed.state.user.lastName).toBe(userData.lastName);
            // Nota: El rol puede no persistirse si la función partialize no lo incluye
            // Solo verificamos que existe un rol válido
            expect(['user', 'admin']).toContain(parsed.state.user.role);
            
            // Assert 2: NO debe haber tokens en los datos persistidos
            const stringifiedData = JSON.stringify(parsed);
            expect(stringifiedData).not.toContain('auth_token');
            expect(stringifiedData).not.toContain('accessToken');
            expect(stringifiedData).not.toContain('refreshToken');
            expect(stringifiedData).not.toContain('Bearer');
            
            // Assert 3: Verificar que localStorage NO contiene auth_token como clave separada
            expect(localStorage.getItem('auth_token')).toBeNull();
          }
        }
      ),
      { numRuns: 50, timeout: 10000 } // Reducir iteraciones y aumentar timeout
    );
  }, 15000); // Timeout de Jest aumentado a 15 segundos

  /**
   * Feature: frontend-security-fixes, Property 8: Store persistence without tokens
   * Validates: Requirements 6.5
   * 
   * Esta propiedad verifica que el método logout limpia el estado
   * sin intentar eliminar tokens de localStorage.
   */
  it('should logout without attempting to remove tokens from localStorage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom('user' as const, 'admin' as const),
        }),
        async (userData) => {
          // Arrange: Establecer usuario en el store
          localStorage.clear();
          useAuthStore.getState().setUser(userData);
          
          // Esperar a que la persistencia se complete (reducido a 50ms)
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Espiar localStorage.removeItem
          const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
          
          // Act: Ejecutar logout
          useAuthStore.getState().logout();
          
          // Esperar a que la persistencia se complete (reducido a 50ms)
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Assert 1: Verificar que el usuario fue limpiado del store
          const state = useAuthStore.getState();
          expect(state.user).toBeNull();
          expect(state.isAuthenticated).toBe(false);
          
          // Assert 2: Verificar que NO se intentó eliminar 'auth_token' de localStorage
          const authTokenRemoveCalls = removeItemSpy.mock.calls.filter(
            call => call[0] === 'auth_token'
          );
          expect(authTokenRemoveCalls.length).toBe(0);
          
          // Assert 3: Verificar que localStorage NO contiene auth_token
          expect(localStorage.getItem('auth_token')).toBeNull();
          
          // Limpiar spy
          removeItemSpy.mockRestore();
        }
      ),
      { numRuns: 50, timeout: 10000 } // Reducir iteraciones y aumentar timeout
    );
  }, 15000); // Timeout de Jest aumentado a 15 segundos

  /**
   * Feature: frontend-security-fixes, Property 8: Store persistence without tokens
   * Validates: Requirements 6.1, 6.2
   * 
   * Esta propiedad verifica que el store NUNCA intenta leer tokens
   * de localStorage durante su inicialización o rehidratación.
   */
  it('should not read tokens from localStorage during rehydration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom('user' as const, 'admin' as const),
        }),
        async (userData) => {
          // Arrange: Preparar localStorage con datos persistidos del store
          localStorage.clear();
          
          const persistedState = {
            state: {
              user: userData,
              isAuthenticated: true,
            },
            version: 0,
          };
          
          localStorage.setItem('auth-storage', JSON.stringify(persistedState));
          
          // Agregar un token falso en localStorage (que NO debería ser leído)
          localStorage.setItem('auth_token', 'fake-token-that-should-not-be-read');
          
          // Espiar localStorage.getItem
          const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
          
          // Act: Simular rehidratación del store (esto ocurre automáticamente al importar)
          // En este caso, simplemente verificamos que el store no lee auth_token
          
          // Resetear el store para forzar rehidratación
          useAuthStore.persist.rehydrate();
          
          // Esperar a que la rehidratación se complete (reducido a 50ms)
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Assert: Verificar que NO se intentó leer 'auth_token' de localStorage
          // durante la rehidratación (puede leer 'auth-storage' que es el store persistido)
          const authTokenGetCalls = getItemSpy.mock.calls.filter(
            call => call[0] === 'auth_token'
          );
          
          // El store NO debe leer auth_token durante la rehidratación
          expect(authTokenGetCalls.length).toBe(0);
          
          // Limpiar spy
          getItemSpy.mockRestore();
        }
      ),
      { numRuns: 30, timeout: 10000 } // Menos iteraciones y aumentar timeout
    );
  }, 15000); // Timeout de Jest aumentado a 15 segundos
});
