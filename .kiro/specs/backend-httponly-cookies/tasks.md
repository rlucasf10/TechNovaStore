# Implementation Plan - Backend HttpOnly Cookies

- [x] 1. Buscar y eliminar referencias a localStorage en el backend







  - Ejecutar búsqueda de `localStorage` en user-service
  - Ejecutar búsqueda de `localStorage` en api-gateway
  - Eliminar o actualizar código/comentarios que mencionen localStorage
  - Agregar comentarios explicando que se usan httpOnly cookies
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2. Crear utilidades de manejo de cookies





  - Crear archivo `shared/infrastructure/utils/cookie.utils.ts`
  - Implementar función `getCookieConfig()` con configuración por entorno
  - Implementar función `setAuthCookie(res, token)` para establecer cookie httpOnly
  - Implementar función `clearAuthCookie(res)` para invalidar cookie
  - Implementar función `getAuthToken(req)` para leer token desde cookie (con fallback a header)
  - Agregar logging en cada función (sin incluir tokens)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 9.1, 9.2_

- [x] 3. Actualizar endpoint de login para establecer cookie





  - Modificar `domains/customer/user-service/authenticate-user/handler.ts`
  - Importar `setAuthCookie` de cookie.utils
  - Después de generar JWT, llamar a `setAuthCookie(res, token)`
  - Mantener token en body de respuesta para compatibilidad temporal
  - Agregar comentario explicando que el token en body es temporal
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.3, 9.1_

- [x] 4. Actualizar endpoint de logout para invalidar cookie





  - Modificar `domains/customer/user-service/logout-user/handler.ts`
  - Importar `clearAuthCookie` de cookie.utils
  - Llamar a `clearAuthCookie(res)` antes de responder
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.4_

- [x] 5. Actualizar middleware de autenticación para leer desde cookie





  - Modificar `shared/infrastructure/middleware/auth.middleware.ts` o similar
  - Importar `getAuthToken` de cookie.utils
  - Reemplazar lectura de Authorization header con `getAuthToken(req)`
  - Mantener fallback a Authorization header para compatibilidad
  - Agregar logging cuando se usa cookie vs header
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 9.2, 9.3_

- [x] 6. Actualizar endpoint de refresh token





  - Modificar `domains/customer/user-service/refresh-token/handler.ts`
  - Importar `getAuthToken` y `setAuthCookie` de cookie.utils
  - Leer token actual con `getAuthToken(req)`
  - Establecer nuevo token con `setAuthCookie(res, newToken)`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Actualizar endpoint de OAuth callback





  - Modificar `domains/customer/user-service/oauth-authentication/handler.ts`
  - Importar `setAuthCookie` de cookie.utils
  - Después de generar JWT, llamar a `setAuthCookie(res, token)`
  - _Requirements: 5.1, 5.2_

- [x] 8. Actualizar endpoint de registro para establecer cookie





  - Modificar `domains/customer/user-service/register-user/handler.ts`
  - Importar `setAuthCookie` de cookie.utils
  - Después de generar JWT, llamar a `setAuthCookie(res, token)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 9. Verificar configuración de CORS en API Gateway





  - Revisar `domains/platform/api-gateway/index.ts` o `app.ts`
  - Verificar que `credentials: true` está configurado en CORS
  - Verificar que `origin` apunta al frontend correcto
  - Verificar que `cookie-parser` está instalado y configurado
  - Agregar comentario explicando la importancia de `credentials: true`
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Configurar variables de entorno (Recuerda que debe funcionar en cualquier equipo, o si cambio la ip de mi equipo, no solo en localhost y recuerda actualizar todas las variables de entorno del docker-compose-optimized y los 5 archivos env del proyecto)








  - Actualizar `.env` con `COOKIE_DOMAIN=localhost` para desarrollo
  - Actualizar `.env.prod.example` con ejemplo de `COOKIE_DOMAIN` para producción
  - Verificar que `FRONTEND_URL` está configurado correctamente
  - Documentar variables de entorno en README o docs
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Escribir tests unitarios para utilidades de cookies
  - Crear archivo `shared/infrastructure/utils/__tests__/cookie.utils.test.ts`
  - Test: `setAuthCookie` establece cookie con configuración correcta
  - Test: `clearAuthCookie` invalida cookie correctamente
  - Test: `getAuthToken` lee token desde cookie
  - Test: `getAuthToken` usa fallback a Authorization header
  - Test: `getAuthToken` retorna null si no hay token
  - Test: `getCookieConfig` retorna configuración correcta por entorno
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 12. Escribir tests de integración para autenticación con cookies
  - Crear archivo `domains/customer/user-service/__tests__/auth-cookies.integration.test.ts`
  - Test: Login establece cookie httpOnly
  - Test: Petición autenticada funciona con cookie
  - Test: Logout invalida cookie
  - Test: Refresh token funciona con cookie
  - Test: OAuth callback establece cookie
  - Test: Fallback a Authorization header funciona
  - Test: Cookie tiene flags correctos (httpOnly, secure, sameSite)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Checkpoint - Ejecutar todos los tests
  - Ejecutar tests unitarios: `npm test cookie.utils.test.ts`
  - Ejecutar tests de integración: `npm test auth-cookies.integration.test.ts`
  - Verificar que todos los tests pasan
  - Verificar que no hay errores de compilación TypeScript

- [ ] 14. Testing manual en desarrollo
  - Iniciar backend en modo desarrollo
  - Hacer login desde frontend
  - Verificar en DevTools que cookie `auth_token` aparece con flag HttpOnly
  - Verificar que peticiones autenticadas funcionan
  - Verificar que logout invalida la cookie
  - Verificar que refresh token funciona
  - Verificar que OAuth funciona (si aplica)

- [ ] 15. Actualizar documentación
  - Actualizar README del user-service explicando httpOnly cookies
  - Documentar configuración de variables de entorno
  - Documentar cómo el frontend debe configurar `withCredentials: true`
  - Agregar diagrama de flujo de autenticación con cookies
  - Documentar estrategia de migración y compatibilidad

- [ ] 16. Preparar para deployment
  - Verificar que variables de entorno están configuradas en staging
  - Verificar que CORS está configurado correctamente para staging
  - Crear checklist de verificación post-deployment
  - Documentar plan de rollback si algo falla
