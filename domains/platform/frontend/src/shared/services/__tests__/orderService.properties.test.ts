/**
 * Property-Based Tests para Order Service
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para todas las operaciones del servicio de pedidos.
 */

import fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('Property Tests - Order Service Security', () => {
  // Leer el código fuente del servicio para verificación estática
  const orderServicePath = path.join(__dirname, '../orderService.ts');
  const orderServiceCode = fs.readFileSync(orderServicePath, 'utf-8');

  /**
   * Feature: frontend-security-fixes, Property 7: Secure logging for order operations
   * Validates: Requirements 5.3, 5.4
   * 
   * Esta propiedad verifica que el servicio de pedidos NO usa console.log
   * ni console.error directamente, sino que usa secureLogger para
   * sanitizar datos sensibles antes de loguear.
   */
  it('should use secureLogger instead of console.log/error in order service', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No necesitamos datos aleatorios
        async () => {
          // Assert: Verificar que NO hay console.log en el código
          const consoleLogMatches = orderServiceCode.match(/console\.log\(/g);
          expect(consoleLogMatches).toBeNull();

          // Assert: Verificar que NO hay console.error en el código
          const consoleErrorMatches = orderServiceCode.match(/console\.error\(/g);
          expect(consoleErrorMatches).toBeNull();

          // Assert: Verificar que NO hay console.warn en el código
          const consoleWarnMatches = orderServiceCode.match(/console\.warn\(/g);
          expect(consoleWarnMatches).toBeNull();

          // Assert: Verificar que SÍ hay secureLogger importado
          const secureLoggerImport = orderServiceCode.includes("import { secureLogger } from '@/shared/lib/security'");
          expect(secureLoggerImport).toBe(true);

          // Assert: Verificar que SÍ se usa secureLogger.log
          const secureLoggerLogUsage = orderServiceCode.includes('secureLogger.log(');
          expect(secureLoggerLogUsage).toBe(true);

          // Assert: Verificar que SÍ se usa secureLogger.error
          const secureLoggerErrorUsage = orderServiceCode.includes('secureLogger.error(');
          expect(secureLoggerErrorUsage).toBe(true);
        }
      ),
      { numRuns: 10 } // Pocas iteraciones ya que solo verificamos el código fuente
    );
  });

  /**
   * Feature: frontend-security-fixes, Property 7: Secure logging for order operations
   * Validates: Requirements 5.3, 5.4
   * 
   * Esta propiedad verifica que secureLogger sanitiza correctamente
   * los datos de pedidos antes de loguearlos.
   */
  it('should sanitize sensitive data when logging order data', async () => {
    // Importar secureLogger para probar su comportamiento
    const { secureLogger } = require('@/shared/lib/security');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          order: fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 10, maxLength: 20 }),
            userId: fc.uuid(),
            items: fc.array(
              fc.record({
                product_sku: fc.string({ minLength: 5, maxLength: 20 }),
                product_name: fc.string({ minLength: 5, maxLength: 100 }),
                quantity: fc.integer({ min: 1, max: 10 }),
                unit_price: fc.double({ min: 1, max: 1000 }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            shipping_address: fc.record({
              street: fc.string({ minLength: 10, maxLength: 100 }),
              city: fc.string({ minLength: 3, maxLength: 50 }),
              state: fc.string({ minLength: 2, maxLength: 50 }),
              postal_code: fc.string({ minLength: 5, maxLength: 10 }),
              country: fc.string({ minLength: 2, maxLength: 50 }),
            }),
            payment_method: fc.constantFrom('credit_card', 'paypal', 'bank_transfer'),
            // Datos sensibles que deben ser sanitizados
            cardNumber: fc.integer({ min: 1000000000000, max: 9999999999999999 }).map(n => n.toString()),
            cvv: fc.integer({ min: 100, max: 9999 }).map(n => n.toString()),
            token: fc.string({ minLength: 20, maxLength: 100 }),
          }),
        }),
        async (orderData) => {
          // Arrange: Guardar valores originales antes de loguear
          const originalCardNumber = orderData.order.cardNumber;
          const originalCvv = orderData.order.cvv;
          const originalToken = orderData.order.token;
          
          // Arrange: Espiar console.log para verificar qué se loguea
          const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

          // Act: Loguear usando secureLogger
          secureLogger.log('Order data:', orderData);

          // Assert: Verificar que se llamó a console.log
          expect(consoleLogSpy).toHaveBeenCalled();

          // Assert: Obtener los argumentos logueados
          const loggedArgs = consoleLogSpy.mock.calls[0];
          const loggedData = loggedArgs[1]; // El segundo argumento es el objeto

          // Assert: Verificar que los datos sensibles fueron sanitizados
          if (originalCardNumber && originalCardNumber.length > 0) {
            expect(loggedData.order.cardNumber).not.toBe(originalCardNumber);
            expect(loggedData.order.cardNumber).toMatch(/\*+/); // Debe contener asteriscos
          }

          if (originalCvv && originalCvv.length > 0) {
            expect(loggedData.order.cvv).not.toBe(originalCvv);
            expect(loggedData.order.cvv).toMatch(/\*+/); // Debe contener asteriscos
          }

          if (originalToken && originalToken.length > 0) {
            expect(loggedData.order.token).not.toBe(originalToken);
            expect(loggedData.order.token).toMatch(/^.{3}\.\.\..{3}$/); // Formato enmascarado
          }

          // Assert: Verificar que el objeto logueado tiene la estructura esperada
          expect(loggedData.order).toHaveProperty('id');
          expect(loggedData.order).toHaveProperty('orderNumber');
          expect(loggedData.order).toHaveProperty('userId');
          expect(loggedData.order).toHaveProperty('payment_method');

          // Limpiar spy
          consoleLogSpy.mockRestore();
        }
      ),
      { numRuns: 100 } // 100 iteraciones para probar con diferentes datos
    );
  });

  /**
   * Feature: frontend-security-fixes, Property 7: Secure logging for order operations
   * Validates: Requirements 5.3, 5.4
   * 
   * Esta propiedad verifica que secureLogger.error sanitiza correctamente
   * los errores que contienen datos de pedidos.
   */
  it('should sanitize sensitive data when logging order errors', async () => {
    // Importar secureLogger para probar su comportamiento
    const { secureLogger } = require('@/shared/lib/security');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          error: fc.record({
            message: fc.string({ minLength: 10, maxLength: 100 }),
            code: fc.constantFrom('PAYMENT_FAILED', 'INVALID_ADDRESS', 'OUT_OF_STOCK'),
            orderData: fc.record({
              cardNumber: fc.integer({ min: 1000000000000, max: 9999999999999999 }).map(n => n.toString()),
              cvv: fc.integer({ min: 100, max: 9999 }).map(n => n.toString()),
              token: fc.string({ minLength: 20, maxLength: 100 }),
              userId: fc.uuid(),
              orderNumber: fc.string({ minLength: 10, maxLength: 20 }),
            }),
          }),
        }),
        async (errorData) => {
          // Arrange: Guardar valores originales antes de loguear
          const originalCardNumber = errorData.error.orderData.cardNumber;
          const originalCvv = errorData.error.orderData.cvv;
          const originalToken = errorData.error.orderData.token;
          
          // Arrange: Espiar console.error para verificar qué se loguea
          const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

          // Act: Loguear error usando secureLogger
          secureLogger.error('Order error:', errorData);

          // Assert: Verificar que se llamó a console.error
          expect(consoleErrorSpy).toHaveBeenCalled();

          // Assert: Obtener los argumentos logueados
          const loggedArgs = consoleErrorSpy.mock.calls[0];
          const loggedData = loggedArgs[1]; // El segundo argumento es el objeto

          // Assert: Verificar que los datos sensibles fueron sanitizados
          if (originalCardNumber && originalCardNumber.length > 0) {
            expect(loggedData.error.orderData.cardNumber).not.toBe(originalCardNumber);
            expect(loggedData.error.orderData.cardNumber).toMatch(/\*+/); // Debe contener asteriscos
          }

          if (originalCvv && originalCvv.length > 0) {
            expect(loggedData.error.orderData.cvv).not.toBe(originalCvv);
            expect(loggedData.error.orderData.cvv).toMatch(/\*+/); // Debe contener asteriscos
          }

          if (originalToken && originalToken.length > 0) {
            expect(loggedData.error.orderData.token).not.toBe(originalToken);
            expect(loggedData.error.orderData.token).toMatch(/^.{3}\.\.\..{3}$/); // Formato enmascarado
          }

          // Assert: Verificar que el objeto logueado tiene la estructura esperada
          expect(loggedData.error).toHaveProperty('message');
          expect(loggedData.error).toHaveProperty('code');
          expect(loggedData.error.orderData).toHaveProperty('userId');
          expect(loggedData.error.orderData).toHaveProperty('orderNumber');

          // Limpiar spy
          consoleErrorSpy.mockRestore();
        }
      ),
      { numRuns: 100 } // 100 iteraciones para probar con diferentes datos
    );
  });
});
