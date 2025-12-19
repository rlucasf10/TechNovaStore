# Implementation Plan - Frontend Security Fixes

- [x] 1. Actualizar configuración de clientes HTTP para httpOnly cookies





  - Modificar `src/shared/lib/axios.ts` para eliminar Authorization headers con tokens de localStorage
  - Modificar `src/shared/lib/api.ts` para eliminar Authorization headers con tokens de localStorage
  - Verificar que `withCredentials: true` está configurado en ambos clientes
  - _Requirements: 2.1, 2.2_

- [x] 2. Eliminar almacenamiento de tokens en servicio de autenticación






  - Modificar `src/features/customer/services/auth.service.ts` para eliminar `localStorage.setItem('auth_token')` en método `login()`
  - Eliminar `localStorage.setItem('auth_token')` en método `oauthCallback()`
  - Eliminar `localStorage.removeItem('auth_token')` en método `logout()`
  - Eliminar verificación de token en `localStorage` en método `getCurrentUser()`
  - Actualizar interceptor de request para NO agregar Authorization header con token de localStorage
  - _Requirements: 1.1, 1.2, 1.3, 2.2_

- [x] 2.1 Escribir property test para verificar no almacenamiento de tokens


  - **Property 1: No localStorage token storage**
  - **Validates: Requirements 1.1, 1.2**

- [x] 3. Actualizar store de autenticación





  - Modificar `src/features/customer/store/auth.store.ts` para eliminar verificación periódica de token en localStorage
  - Eliminar verificación de token en `onRehydrateStorage`
  - Mantener persistencia de datos no sensibles (id, email, nombre, rol)
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 3.1 Escribir property test para store sin tokens


  - **Property 8: Store persistence without tokens**
  - **Validates: Requirements 6.4**

- [x] 4. Eliminar Authorization headers en servicios compartidos





  - Modificar `src/shared/services/wishlistService.ts` para eliminar Authorization header
  - Modificar `src/shared/services/orderService.ts` para eliminar Authorization header
  - Modificar `src/shared/services/shipmentService.ts` para eliminar Authorization header
  - Modificar `src/shared/services/recommenderService.ts` para eliminar Authorization header
  - Modificar `src/shared/services/campaignService.ts` para eliminar Authorization header
  - Modificar `src/shared/services/ticket.service.ts` para eliminar Authorization header
  - Mantener interceptores de CSRF (no relacionados con autenticación)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4.1 Escribir property test para clientes HTTP sin Authorization headers



  - **Property 2: No localStorage token reads**
  - **Property 4: No Authorization headers with localStorage tokens**
  - **Validates: Requirements 1.3, 2.2, 3.1-3.7**


- [x] 4.2 Escribir property test para withCredentials configuration


  - **Property 3: withCredentials configuration**
  - **Validates: Requirements 2.1**

- [x] 5. Actualizar componentes y páginas





  - Modificar `src/app/pedidos/[id]/page.tsx` para eliminar verificación de token en localStorage
  - Modificar `src/shared/components/ui/CookieConsent.tsx` para eliminar lectura de token en localStorage
  - Usar `useAuthStore()` en lugar de `localStorage.getItem('auth_token')` para verificar autenticación
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.1 Escribir property test para componentes usando store


  - **Property 10: Component auth check from store**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 6. Checkpoint - Verificar que no hay referencias a tokens en localStorage





  - Ejecutar búsqueda en código fuente: `localStorage.getItem('auth_token')`
  - Ejecutar búsqueda en código fuente: `localStorage.setItem('auth_token')`
  - Ejecutar búsqueda en código fuente: `localStorage.removeItem('auth_token')`
  - Verificar que no hay resultados
  - _Requirements: 1.5, 2.5, 4.4_

- [x] 7. Implementar logging seguro en servicio de autenticación





  - Importar `secureLogger` de `@/shared/lib/security` en `auth.service.ts`
  - Reemplazar `console.log` con `secureLogger.log` en todas las funciones
  - Reemplazar `console.error` con `secureLogger.error` en todas las funciones
  - Verificar que respuestas de autenticación se sanitizan antes de loguear
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 7.1 Escribir property test para logging seguro en auth


  - **Property 6: Secure logging for auth operations**
  - **Validates: Requirements 5.1, 5.2, 5.5**

- [x] 8. Implementar logging seguro en servicio de pedidos





  - Importar `secureLogger` de `@/shared/lib/security` en `orderService.ts`
  - Reemplazar `console.log` con `secureLogger.log` en todas las funciones
  - Reemplazar `console.error` con `secureLogger.error` en todas las funciones
  - Verificar que datos de pedidos se sanitizan antes de loguear
  - _Requirements: 5.3, 5.4_

- [x] 8.1 Escribir property test para logging seguro en orders


  - **Property 7: Secure logging for order operations**
  - **Validates: Requirements 5.3, 5.4**

- [x] 9. Eliminar logging de credenciales en auth.service.ts (CRÍTICO)






  - Buscar y eliminar todos los logs que expongan el objeto `credentials` completo
  - Eliminar logs que muestren `credentials.email` y `credentials.password`
  - Si es necesario loguear para debugging, solo loguear información no sensible (ej: dominio del email)
  - Verificar que NO se loguean passwords, tokens o datos de tarjetas en ningún lugar
  - _Requirements: 5.1, 5.7, 5.8_

- [x] 9.1 Escribir property test para no logging de credenciales


  - **Property 11: No credential logging**
  - **Validates: Requirements 5.1, 5.7**

- [x] 10. Implementar manejo silencioso de errores esperados






  - Modificar `handleAuthError` en `auth.service.ts` para aceptar parámetro `silent`
  - Actualizar `getCurrentUser()` para pasar `silent: true` al manejar errores 401
  - Verificar que errores 401 en `/api/auth/me` NO se loguean en consola para usuarios no autenticados
  - Implementar flag similar en otros servicios para errores esperados (404 en endpoints opcionales)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 10.1 Escribir property test para manejo silencioso de errores


  - **Property 12: Silent error handling for expected errors**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [-] 11. Implementar manejo graceful de timeouts en DealsSection

  - Modificar `DealsSection.tsx` para implementar retry logic con backoff exponencial
  - Configurar máximo 3 reintentos con delays de 1s, 2s, 4s
  - En caso de fallo final, retornar array vacío en lugar de mostrar error
  - Loguear errores de forma sanitizada usando `secureLogger.error`
  - Ocultar la sección completa si no hay productos (ya implementado)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11.1 Escribir property test para manejo graceful de timeouts
  - **Property 13: Graceful degradation for timeouts**
  - **Validates: Requirements 11.1, 11.4**

- [x] 12. Optimizar performance de compilación






  - Incrementar timeout de axios a 60s en desarrollo (mantener 30s en producción)
  - Analizar bundle de Next.js para identificar dependencias pesadas
  - Implementar dynamic imports para componentes pesados no críticos
  - Verificar que componentes above-the-fold cargan inmediatamente
  - Medir tiempos de compilación y verificar mejoras
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 12.1 Escribir property test para performance de compilación


  - **Property 14: Compilation performance**
  - **Validates: Requirements 8.1, 8.2**



- [x] 13. Mejorar secureLogger para detectar más campos sensibles





  - Actualizar lista `SENSITIVE_FIELDS` en `security.ts` para incluir: password, token, auth_token, access_token, refresh_token, secret, apiKey, creditCard, cvv, ssn
  - Implementar redacción completa (`***REDACTED***`) para campos sensibles
  - Verificar que la sanitización funciona recursivamente en objetos anidados
  - _Requirements: 5.6, 5.7_

- [ ] 14. Checkpoint - Ejecutar tests y verificar compilación
  - Ejecutar `npm run type-check` para verificar TypeScript
  - Ejecutar tests unitarios existentes
  - Ejecutar tests de propiedades nuevos
  - Verificar que no hay errores de compilación
  - Verificar que NO aparecen errores 401 en consola para usuarios no autenticados
  - Verificar que NO aparecen passwords o tokens en logs
  - _Requirements: 7.5_

- [ ] 15. Agregar comentarios de documentación en código
  - Agregar comentarios en `axios.ts` explicando uso de httpOnly cookies
  - Agregar comentarios en `auth.service.ts` explicando por qué NO se usa localStorage
  - Agregar comentarios en `auth.store.ts` explicando arquitectura de cookies
  - Agregar comentarios explicando por qué NO se loguean credenciales
  - _Requirements: 9.3_

- [ ] 16. Actualizar documentación de seguridad
  - Actualizar `SECURITY_AUDIT.md` marcando problemas como resueltos
  - Actualizar checklist de corrección en `SECURITY_AUDIT.md`
  - Actualizar `SECURITY_GUIDELINES.md` con sección de httpOnly cookies
  - Agregar ejemplos de código correcto e incorrecto en guías
  - Documentar política de no logging de credenciales
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 17. Testing manual final
  - Verificar login exitoso NO almacena tokens en localStorage (DevTools → Application → Local Storage)
  - Verificar que cookie `auth_token` aparece con flag HttpOnly (DevTools → Application → Cookies)
  - Verificar que peticiones autenticadas funcionan sin Authorization header (DevTools → Network)
  - Verificar que logout limpia la cookie
  - Verificar que refresh de página mantiene sesión
  - Verificar que token expirado redirige a login
  - Verificar que console NO muestra datos sensibles sin sanitizar
  - Verificar que NO aparecen errores 401 en consola para usuarios no autenticados
  - Verificar que NO aparecen passwords en logs
  - Verificar que la página principal carga en menos de 30 segundos
  - Verificar que DealsSection maneja timeouts gracefully sin mostrar errores
  - _Requirements: 7.1, 7.2, 7.3, 10.2, 5.7, 8.1, 11.4_
