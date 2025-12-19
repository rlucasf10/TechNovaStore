# Plan de Implementación - Correcciones de Seguridad

## Fase 1: Autenticación en Microservicios (CRÍTICA 🔴)

- [x] 1. Implementar autenticación en payment-service




  - Crear middleware, proteger rutas, añadir verificación de propiedad
  - Validar funcionamiento con Docker
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 6.1, 6.2, 6.3, 7.1, 7.2, 8.1, 8.7, 12.1, 12.2, 12.3_

  - [x] 1.1 Crear middleware de autenticación en payment-service


    - Crear archivo `domains/commerce/payment-service/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para payment-service
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3_

  - [x] 1.2 Proteger rutas en payment-service


    - Modificar `domains/commerce/payment-service/api/routes.ts`
    - Añadir `authMiddleware` a todas las rutas de negocio
    - Añadir `requireRole(['admin'])` a ruta de refund
    - Mantener `/health` y `/metrics` sin autenticación
    - _Requirements: 3.1, 3.4, 7.1, 7.2_

  - [x] 1.3 Añadir verificación de propiedad en handlers


    - Modificar handlers en `process-payment/` y `get-payment-status/`
    - Verificar que el order/payment pertenece al usuario autenticado
    - Retornar 403 si el usuario no es el dueño (excepto admins)
    - Loggear intentos de acceso no autorizado
    - _Requirements: 3.6, 8.1, 8.7_

  - [x] 1.4 Validar payment-service



    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build payment-service`
    - Verificar que arranca sin errores en logs
    - Probar endpoint con token válido (debe funcionar)
    - Probar endpoint sin token (debe retornar 401)
    - Probar refund sin rol admin (debe retornar 403)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 2. Implementar autenticación en ticket-service







  - Crear middleware, proteger rutas, añadir verificación de propiedad
  - Validar funcionamiento con Docker
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 7.1, 7.2, 8.1, 8.2, 8.7, 12.1, 12.2, 12.3_


  - [x] 2.1 Crear middleware de autenticación en ticket-service


    - Crear archivo `domains/support/ticket-service/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para ticket-service
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3_


  - [x] 2.2 Proteger rutas en ticket-service

    - Modificar `domains/support/ticket-service/api/routes.ts`
    - Añadir `authMiddleware` a todas las rutas de negocio
    - Añadir `requireRole(['admin'])` a rutas de métricas
    - Mantener `/health` y `/metrics` sin autenticación
    - _Requirements: 1.1, 1.4, 7.1, 7.2_


  - [x] 2.3 Añadir verificación de propiedad en handlers de tickets

    - Modificar handlers en casos de uso (get-ticket, update-ticket, etc.)
    - Verificar que el ticket pertenece al usuario autenticado
    - Retornar 403 si el usuario no es el dueño (excepto admins)
    - Loggear intentos de acceso no autorizado
    - _Requirements: 1.3, 8.1, 8.2, 8.7_


  - [x] 2.4 Validar ticket-service (crea un script como el de payment-service)




    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build ticket-service`
    - Verificar que arranca sin errores en logs
    - Probar endpoint con token válido (debe funcionar)
    - Probar endpoint sin token (debe retornar 401)
    - Probar acceso a ticket de otro usuario (debe retornar 403)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 3. Implementar autenticación en notification-service (No te olvides del script temporal de verificacion final)
  - Crear middleware, proteger rutas, añadir verificación de propiedad
  - Validar funcionamiento con Docker
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 8.3, 8.4, 8.7, 12.1, 12.2, 12.3_

  - [x] 3.1 Crear middleware de autenticación en notification-service
    - Crear archivo `domains/customer/notification-service/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para notification-service
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3_

  - [x] 3.2 Proteger rutas en notification-service
    - Modificar `domains/customer/notification-service/api/routes.ts`
    - Añadir `authMiddleware` a todas las rutas de negocio
    - Mantener `/health` y `/metrics` sin autenticación
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Añadir verificación de propiedad en handlers de notifications
    - Modificar handlers en casos de uso (get-user-notifications, mark-notification-read, etc.)
    - Verificar que la notification pertenece al usuario autenticado
    - Retornar 403 si el usuario no es el dueño (excepto admins)
    - Loggear intentos de acceso no autorizado
    - _Requirements: 2.3, 2.4, 8.3, 8.4, 8.7_

  - [x] 3.4 Validar notification-service
    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build notification-service`
    - Verificar que arranca sin errores en logs
    - Probar endpoint con token válido (debe funcionar)
    - Probar endpoint sin token (debe retornar 401)
    - Probar acceso a notification de otro usuario (debe retornar 403)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 4. Implementar autenticación en shipment-tracker (No te olvides del script temporal de verificacion final)






  - Crear middleware, proteger rutas, añadir verificación de propiedad
  - Validar funcionamiento con Docker
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 8.5, 8.6, 8.7, 12.1, 12.2, 12.3_

  - [x] 4.1 Crear middleware de autenticación en shipment-tracker


    - Crear archivo `domains/support/shipment-tracker/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para shipment-tracker
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

  - [x] 4.2 Proteger rutas en shipment-tracker


    - Modificar `domains/support/shipment-tracker/api/routes.ts`
    - Añadir `authMiddleware` a todas las rutas de negocio
    - Mantener `/health` y `/metrics` sin autenticación
    - _Requirements: 5.1, 5.2_

  - [x] 4.3 Añadir verificación de propiedad en handlers de shipment



    - Modificar handlers en casos de uso (track-shipment, get-shipment-status, etc.)
    - Consultar order-service para verificar que el order pertenece al usuario
    - Retornar 403 si el usuario no es el dueño (excepto admins)
    - Loggear intentos de acceso no autorizado
    - _Requirements: 5.3, 5.4, 8.5, 8.6, 8.7_


  - [x] 4.4 Validar shipment-tracker


    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build shipment-tracker`
    - Verificar que arranca sin errores en logs
    - Probar endpoint con token válido (debe funcionar)
    - Probar endpoint sin token (debe retornar 401)
    - Probar acceso a shipment de otro usuario (debe retornar 403)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 5. Implementar autenticación en recommender-service (No te olvides del script temporal de verificacion final)





  - Crear middleware, proteger rutas privadas (dejar públicas las trending)
  - Añadir verificación de userId, validar funcionamiento
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 8.7, 12.1, 12.2, 12.3_


  - [x] 5.1 Crear middleware de autenticación en recommender-service

    - Crear archivo `domains/catalog/recommender-service/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para recommender-service
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3_


  - [x] 5.2 Proteger rutas privadas en recommender-service

    - Modificar `domains/catalog/recommender-service/api/routes.ts`
    - Añadir `authMiddleware` solo a rutas de recomendaciones personalizadas
    - Dejar `/recommendations/trending` sin autenticación (público)
    - Mantener `/health` y `/metrics` sin autenticación
    - _Requirements: 4.1, 4.4_


  - [x] 5.3 Añadir verificación de userId en get-user-recommendations

    - Modificar `domains/catalog/recommender-service/get-user-recommendations/GetUserRecommendations.ts`
    - Verificar que el userId del request coincide con el userId autenticado
    - Retornar 403 si no coinciden (excepto admins)
    - Loggear intentos de acceso no autorizado
    - _Requirements: 4.3, 8.7_


  - [x] 5.4 Validar recommender-service
    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build recommender`
    - Verificar que arranca sin errores en logs
    - Probar endpoint privado con token válido (debe funcionar)
    - Probar endpoint privado sin token (debe retornar 401)
    - Probar endpoint público sin token (debe funcionar)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 6. Implementar autenticación en product-service (No te olvides del script temporal de verificacion final)




  - Crear middleware, proteger rutas administrativas (crear/editar/eliminar)
  - Dejar públicas las rutas de consulta (listado, búsqueda, detalles)
  - Validar funcionamiento
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 12.1, 12.2, 12.3_


  - [x] 6.1 Crear middleware de autenticación en product-service

    - Crear archivo `domains/catalog/product-service/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para product-service
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 6.1, 6.2, 6.3_


  - [x] 6.2 Proteger rutas administrativas en product-service

    - Modificar `domains/catalog/product-service/api/routes.ts`
    - Añadir `authMiddleware` + `requireRole(['admin'])` a rutas POST, PUT, DELETE
    - Dejar rutas GET públicas (listado, búsqueda, detalles)
    - Mantener `/health` y `/metrics` sin autenticación
    - _Requirements: 7.1, 7.2_


  - [x] 6.3 Validar product-service


    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build product-service`
    - Verificar que arranca sin errores en logs
    - Probar GET sin token (debe funcionar - público)
    - Probar POST/PUT/DELETE sin token (debe retornar 401)
    - Probar POST/PUT/DELETE con token no-admin (debe retornar 403)
    - Probar POST/PUT/DELETE con token admin (debe funcionar)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 7. Implementar autenticación en auto-purchase-service (No te olvides del script temporal de verificacion final, este es un servicio critico osea que el test de verificaion de pasar completamente)



  - Crear middleware, proteger todas las rutas
  - Añadir verificación de propiedad de pedidos
  - Validar funcionamiento
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 8.1, 8.7, 12.1, 12.2, 12.3_


  - [x] 7.1 Crear middleware de autenticación en auto-purchase-service

    - Crear archivo `domains/commerce/auto-purchase-service/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para auto-purchase-service
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 6.1, 6.2, 6.3_



  - [x] 7.2 Proteger rutas en auto-purchase-service
    - Modificar `domains/commerce/auto-purchase-service/api/routes.ts`
    - Añadir `authMiddleware` a todas las rutas de negocio
    - Añadir `requireRole(['admin'])` a rutas administrativas
    - Mantener `/health` y `/metrics` sin autenticación
    - _Requirements: 7.1, 7.2_

  - [x] 7.3 Añadir verificación de propiedad en handlers
    - Modificar handlers de casos de uso
    - Verificar que el pedido pertenece al usuario autenticado
    - Retornar 403 si el usuario no es el dueño (excepto admins)
    - Loggear intentos de acceso no autorizado
    - Instalar dependencia jsonwebtoken. Necesito verificar el package.json y añadirla
    - _Requirements: 8.1, 8.7_

  - [x] 7.4 Validar auto-purchase-service



    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build auto-purchase`
    - Verificar que arranca sin errores en logs
    - Probar endpoint con token válido (debe funcionar)
    - Probar endpoint sin token (debe retornar 401)
    - Probar acceso a pedido de otro usuario (debe retornar 403)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 8. Implementar autenticación en chatbot-service (No te olvides del script temporal de verificacion final)







  - Crear middleware, hacer autenticación opcional para personalización
  - Proteger endpoints administrativos
  - Validar funcionamiento

  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 12.1, 12.2, 12.3_

  - [x] 8.1 Crear middleware de autenticación en chatbot-service

    - Crear archivo `domains/support/chatbot-service/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para chatbot-service
    - Exportar `authMiddleware` y `requireRole`
    - Crear `optionalAuthMiddleware` para endpoints públicos con personalización
    - _Requirements: 6.1, 6.2, 6.3_


  - [x] 8.2 Proteger rutas en chatbot-service

    - Modificar `domains/support/chatbot-service/api/routes.ts`
    - Añadir `optionalAuthMiddleware` a rutas de chat (personaliza si hay token)
    - Añadir `authMiddleware` + `requireRole(['admin'])` a rutas administrativas
    - Mantener `/health` y `/metrics` sin autenticación
    - Instalar dependencia jsonwebtoken. Necesito verificar el package.json y añadirla
    - _Requirements: 7.1, 7.2_


  - [x] 8.3 Validar chatbot-service








    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build chatbot`
    - Verificar que arranca sin errores en logs
    - Probar chat sin token (debe funcionar - público)
    - Probar chat con token (debe funcionar - personalizado)
    - Probar rutas admin sin token (debe retornar 401)
    - Probar rutas admin con token admin (debe funcionar)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 9. Implementar autenticación en sync-engine (No te olvides del script temporal de verificacion final, debes probar la autenticacion del servicio tanto con defense in depth como pasando por 


el api-gateway (que es la ruta original que debe seguir realmente). es decir, el flujo real 
debe ser pasar por el api-gateway pero si este falla o es hackeado pues tenemos autenticacion 
en el propio servicio, esto es lo que debes verificar en el script (USA EL USUARIO admin de la 
base de datos para obtener el token y cuidado con el api-gateway que tienen autenticacion CSRF))
  - Crear middleware, proteger endpoints administrativos
  - Validar funcionamiento
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 12.1, 12.2, 12.3_

  - [x] 9.1 Crear middleware de autenticación en sync-engine


    - Crear archivo `domains/catalog/sync-engine/shared/middleware/auth.ts`
    - Copiar implementación de `user-service/shared/middleware/auth.ts`
    - Adaptar imports para sync-engine
    - Exportar `authMiddleware` y `requireRole`
    - _Requirements: 6.1, 6.2, 6.3_


  - [x] 9.2 Proteger rutas administrativas en sync-engine

    - Modificar `domains/catalog/sync-engine/api/routes.ts`
    - Añadir `authMiddleware` + `requireRole(['admin'])` a todas las rutas administrativas
    - Mantener `/health` y `/metrics` sin autenticación
    - Instalar dependencia jsonwebtoken. Necesito verificar el package.json y añadirla
    - _Requirements: 7.1, 7.2_

  - [x] 9.3 Validar sync-engine




    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build sync-engine`
    - Verificar que arranca sin errores en logs
    - Probar rutas admin sin token (debe retornar 401)
    - Probar rutas admin con token no-admin (debe retornar 403)
    - Probar rutas admin con token admin (debe funcionar)
    - _Requirements: 12.1, 12.2, 12.3_

## Fase 2: Validación de Redirecciones (ALTA 🟠)

- [x] 10. Crear utilidad de validación de URLs y proteger redirecciones





  - Crear función de validación de URLs internas
  - Proteger redirección en NotificationCenter
  - Validar funcionamiento en navegador
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 12.1, 12.2, 12.3_


  - [x] 10.1 Crear función de validación de URLs internas

    - Crear archivo `domains/platform/frontend/src/shared/utils/urlValidation.ts`
    - Implementar función `isValidInternalUrl(url: string): boolean`
    - Implementar función `safeRedirect(url: string, fallback?: string): void`
    - Añadir JSDoc con ejemplos de uso
    - _Requirements: 10.1, 10.2, 10.4_


  - [x] 10.2 Proteger redirección en NotificationCenter

    - Modificar `domains/platform/frontend/src/features/customer/components/dashboard/NotificationCenter.tsx`
    - Importar `safeRedirect` de `@/shared/utils/urlValidation`
    - Reemplazar `window.location.href = notification.action_url` con `safeRedirect(notification.action_url)`
    - Añadir logging de intentos bloqueados
    - _Requirements: 10.2, 10.3, 10.5_

  - [x] 10.3 Validar redirecciones en frontend


    - Verificar que el frontend compila sin errores: `docker exec technovastore-frontend npx tsc --noEmit`
    - Refrescar navegador en http://localhost:3020
    - Probar redirección con URL interna (debe funcionar)
    - Probar redirección con URL externa en consola (debe bloquearse)
    - _Requirements: 12.1, 12.2, 12.3_

## Fase 3: Manejo de Errores JSON (MEDIA 🟡)

- [x] 11. Crear utilidad de parsing seguro y proteger OllamaAdapter





  - Crear función de parsing seguro de JSON
  - Proteger JSON.parse() en OllamaAdapter
  - Validar funcionamiento del chatbot

  - _Requirements: 11.1, 11.2, 11.3, 11.5, 12.1, 12.2, 12.3_

  - [x] 11.1 Crear función de parsing seguro en chatbot-service

    - Crear archivo `domains/support/chatbot-service/shared/utils/safeJsonParse.ts`
    - Implementar función `safeJsonParse<T>(jsonString: string, defaultValue: T, context: string): T`
    - Añadir logging de errores con contexto
    - Añadir JSDoc con ejemplos de uso
    - _Requirements: 11.1, 11.2, 11.3_


  - [x] 11.2 Proteger JSON.parse() en OllamaAdapter

    - Modificar `domains/support/chatbot-service/shared/clients/OllamaAdapter.ts`
    - Importar `safeJsonParse`
    - Reemplazar `JSON.parse(line)` con `safeJsonParse<OllamaResponse>(line, defaultValue, 'OllamaAdapter.parseStreamLine')`
    - Definir valor por defecto apropiado para OllamaResponse
    - _Requirements: 11.1, 11.2, 11.3, 11.5_


  - [x] 11.3 Validar chatbot-service


    - Reconstruir container: `docker-compose -f docker-compose.optimized.yml up -d --build chatbot`
    - Verificar que arranca sin errores en logs
    - Probar chat con Ollama (debe funcionar normalmente)
    - Verificar logs para confirmar que errores de parsing se manejan
    - _Requirements: 12.1, 12.2, 12.3_

## Fase 4: Validación Final

- [ ] 12. Verificación completa del sistema
  - Verificar todos los servicios están corriendo
  - Pruebas end-to-end de autenticación
  - Pruebas de validación de redirecciones
  - Actualizar documentación de seguridad
  - _Requirements: 12.2, 12.3, 12.4_

  - [ ] 12.1 Verificar todos los servicios están corriendo
    - Ejecutar `docker ps` y verificar que todos los containers están UP
    - Revisar logs de cada servicio modificado
    - Confirmar que no hay errores de compilación o runtime
    - _Requirements: 12.2_

  - [ ] 12.2 Pruebas end-to-end de autenticación
    - Probar flujo completo: login → obtener token → acceder a endpoint protegido
    - Probar con usuario normal: debe poder acceder a sus recursos
    - Probar con usuario normal: NO debe poder acceder a recursos de otros
    - Probar con admin: debe poder acceder a todos los recursos
    - _Requirements: 12.3_

  - [ ] 12.3 Pruebas de validación de redirecciones
    - Abrir NotificationCenter en el navegador
    - Verificar que redirecciones internas funcionan
    - Verificar en consola que redirecciones externas se bloquean
    - _Requirements: 12.3_

  - [x] 12.4 Actualizar documentación de seguridad





    - Actualizar `SECURITY_REVIEW_FINAL.md` con estado de implementación
    - Marcar checklist items como completados
    - Actualizar puntuación de seguridad de 8.5/10 a 9.5/10
    - Documentar cambios realizados
    - _Requirements: 12.4_
