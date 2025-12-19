# Plan de Implementación - Hardening de Seguridad 10/10

## Fase 1: Correcciones Críticas (REQUERIDAS para 10/10)

- [x] 1. Eliminar JWT_SECRET hardcodeado en chatbot-service






  - [x] 1.1 Modificar `domains/support/chatbot-service/shared/middleware/auth.ts`

    - Eliminar valor por defecto de JWT_SECRET
    - Añadir validación que falla si JWT_SECRET no está configurado
    - Añadir validación de longitud mínima (32 caracteres)
    - Añadir logging de error claro con instrucciones
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Eliminar JWT_SECRET hardcodeado en notification-service






  - [x] 2.1 Modificar `domains/customer/notification-service/shared/middleware/auth.ts`

    - Eliminar valor por defecto de JWT_SECRET
    - Añadir validación que falla si JWT_SECRET no está configurado
    - Añadir validación de longitud mínima (32 caracteres)
    - Añadir logging de error claro con instrucciones
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Eliminar JWT_SECRET hardcodeado en ticket-service






  - [x] 3.1 Modificar `domains/support/ticket-service/config/index.ts`

    - Eliminar valor por defecto de JWT_SECRET
    - Añadir validación que falla si JWT_SECRET no está configurado
    - Añadir validación de longitud mínima (32 caracteres)
    - Añadir logging de error claro con instrucciones
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Proteger endpoints administrativos en campaign-manager-service








  - [x] 4.1 Modificar `domains/commerce/campaign-manager-service/api/routes.ts`

    - Añadir `authenticateJWT` a GET /campaigns
    - Añadir `authenticateJWT` a GET /campaigns/:id
    - Eliminar comentarios "NOTA TEMPORAL"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Proteger endpoints de categorías en product-service






  - [x] 5.1 Modificar `domains/catalog/product-service/api/routes/categoryRoutes.ts`


    - Importar authMiddleware y requireRole
    - Añadir authMiddleware + requireRole(['admin']) a POST /categories
    - Añadir authMiddleware + requireRole(['admin']) a PUT /categories/:id
    - Añadir authMiddleware + requireRole(['admin']) a DELETE /categories/:id
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 6. Verificar configuración de JWT_SECRET en entornos






  - [x] 6.1 Verificar variables de entorno

    - Verificar que JWT_SECRET está configurado en `.env`
    - Verificar que JWT_SECRET tiene al menos 32 caracteres
    - Verificar que JWT_SECRET está en docker-compose.optimized.yml
    - _Requirements: 1.2, 9.1, 9.2_

- [ ] 7. Probar correcciones críticas
  - [ ] 7.1 Probar JWT_SECRET obligatorio
    - Reconstruir chatbot-service y verificar que falla sin JWT_SECRET
    - Reconstruir notification-service y verificar que falla sin JWT_SECRET
    - Reconstruir ticket-service y verificar que falla sin JWT_SECRET
    - _Requirements: 1.1_

  - [ ] 7.2 Probar autenticación en campaigns
    - Probar GET /campaigns sin token (debe retornar 401)
    - Probar GET /campaigns/:id sin token (debe retornar 401)
    - _Requirements: 2.3_

  - [ ] 7.3 Probar autorización en categories
    - Probar POST /categories sin token (debe retornar 401)
    - Probar POST /categories con token no-admin (debe retornar 403)
    - Probar POST /categories con token admin (debe funcionar)
    - _Requirements: 3.4, 3.5_

## Fase 2: Mejoras de Calidad (OPCIONALES)

- [x] 8. Reemplazar console.log en order-service






  - [x] 8.1 Modificar middleware de autenticación

    - Modificar `domains/commerce/order-service/shared/middleware/auth.ts`
    - Reemplazar 6 instancias de console.log/error con logger
    - Usar logger.info, logger.error, logger.warn según corresponda
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Reemplazar console.log en ticket-service






  - [x] 9.1 Modificar TicketController

    - Modificar `domains/support/ticket-service/api/TicketController.ts`
    - Reemplazar 10 instancias de console.error con logger.error
    - _Requirements: 4.1, 4.2, 4.3_


  - [x] 9.2 Modificar index.ts

    - Modificar `domains/support/ticket-service/index.ts`
    - Reemplazar 7 instancias de console.log/error con logger
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 10. Reemplazar console.log en shipment-tracker






  - [x] 10.1 Modificar TrackingController

    - Modificar `domains/support/shipment-tracker/api/TrackingController.ts`
    - Reemplazar 8 instancias de console.warn/error con logger
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 11. Eliminar contraseña por defecto en ticket-service (revisa como están los demas para 


mantener consistencia)
  - [x] 11.1 Modificar configuración de base de datos


    - Modificar `domains/support/ticket-service/config/database.ts`
    - Eliminar valor por defecto de POSTGRES_PASSWORD
    - Añadir validación que falla si no está configurado
    - _Requirements: 5.1, 5.2, 5.3, 5.4_


  - [x] 11.2 Modificar configuración general


    - Modificar `domains/support/ticket-service/config/index.ts`
    - Eliminar valor por defecto de POSTGRES_PASSWORD
    - _Requirements: 5.1, 5.4_

- [x] 12. Añadir validación de entrada en shipment-tracker






  - [x] 12.1 Implementar validación


    - Modificar `domains/support/shipment-tracker/api/routes.ts`
    - Añadir validación de orderNumber en todas las rutas
    - Crear middleware validateRequest
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13. Añadir validación de entrada en notification-service






  - [x] 13.1 Implementar validación


    - Modificar `domains/customer/notification-service/api/routes.ts`
    - Añadir validación de userId y notificationId
    - Crear middleware validateRequest
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 14. Implementar rate limiting en ticket-service






  - [x] 14.1 Configurar rate limiter

    - Instalar express-rate-limit
    - Crear configuración de rate limiter (100 req/15min)
    - Aplicar a todas las rutas /api/
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 15. Implementar rate limiting en payment-service




  - [x] 15.1 Configurar rate limiter

    - Instalar express-rate-limit
    - Crear configuración de rate limiter (100 req/15min)
    - Aplicar a todas las rutas /api/
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 16. Implementar rate limiting en notification-service




  - [x] 16.1 Configurar rate limiter

    - Instalar express-rate-limit
    - Crear configuración de rate limiter (100 req/15min)
    - Aplicar a todas las rutas /api/
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 17. Implementar rate limiting en shipment-tracker




  - [x] 17.1 Configurar rate limiter

    - Instalar express-rate-limit
    - Crear configuración de rate limiter (100 req/15min)
    - Aplicar a todas las rutas /api/
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 18. Implementar rate limiting en order-service




  - [x] 18.1 Configurar rate limiter

    - Instalar express-rate-limit
    - Crear configuración de rate limiter (100 req/15min)
    - Aplicar a todas las rutas /api/
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 19. Mejorar SQL logging en shipment-tracker




  - [x] 19.1 Modificar configuración de Sequelize

    - Modificar `domains/support/shipment-tracker/config/database.ts`
    - Reemplazar console.log con logger.debug
    - Añadir contexto estructurado
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Fase 3: Verificación y Documentación

- [x] 20. Actualizar documentación de seguridad






  - [x] 20.1 Actualizar SECURITY_REVIEW_FINAL.md

    - Marcar todas las vulnerabilidades como resueltas
    - Actualizar puntuación de 9.5/10 a 10/10
    - Documentar todos los cambios implementados
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 21. Pruebas finales de seguridad






  - [ ] 21.1 Ejecutar verificación completa
    - Verificar que todos los servicios inician correctamente
    - Verificar que endpoints protegidos requieren autenticación
    - Verificar que no hay regresiones en funcionalidad
    - Vuelve a verificar que ya no haya problemas de seguridad en todo el proyecto salvo lo de los secretos y las credenciales que como te he dicho ya lo implementaremos mas adelante con vault
    - _Requirements: 1.1, 2.3, 3.4_
