# Implementation Plan - Personalización del Chatbot con Contexto de Usuario

## Fase 1: Infraestructura y Clientes HTTP

- [ ] 1. Crear tipos e interfaces base
  - Crear archivo `shared/types/user-context.ts` con interfaces UserContext, CartSummary, WishlistItem, etc.
  - Crear archivo `shared/types/service-responses.ts` con tipos de respuesta de servicios externos
  - Actualizar `shared/types/index.ts` para exportar nuevos tipos
  - Agregar campo `userContext?: UserContext` a ChatContext existente
  - _Requirements: 1.2, 9.1, 10.3, 11.3_

- [ ] 2. Implementar sistema de caché simple
  - Crear archivo `shared/utils/SimpleCache.ts` con clase SimpleCache
  - Implementar métodos: set(), get(), has(), clear()
  - Implementar lógica de expiración basada en TTL
  - Implementar límite máximo de entradas (1000)
  - Agregar logging de cache hits/misses
  - _Requirements: 9.4_

- [ ] 3. Crear cliente base HTTP reutilizable
  - Crear archivo `shared/clients/BaseHttpClient.ts`
  - Implementar método get() con timeout de 5 segundos
  - Implementar método post() con timeout de 5 segundos
  - Agregar manejo de errores (timeout, 401, 403, 404, network)
  - Agregar logging de peticiones y respuestas
  - Incluir token JWT en header Authorization
  - _Requirements: 9.1, 9.2, 9.3, 9.5, 10.1_

- [ ] 4. Crear OrderServiceClient
  - Crear carpeta `shared/clients/order-service/`
  - Crear archivo `OrderServiceClient.ts` extendiendo BaseHttpClient
  - Implementar método `getUserOrders(userId: string, token: string, limit?: number)`
  - Implementar método `getOrderById(orderId: string, token: string)`
  - Implementar método `getCompletedOrders(userId: string, token: string, limit?: number)`
  - Configurar baseUrl: `http://order-service:3000`
  - _Requirements: 2.1, 2.3, 8.1, 9.1_

- [ ] 5. Crear TicketServiceClient
  - Crear carpeta `shared/clients/ticket-service/`
  - Crear archivo `TicketServiceClient.ts` extendiendo BaseHttpClient
  - Implementar método `getUserTickets(userId: string, token: string, onlyOpen?: boolean)`
  - Implementar método `getTicketById(ticketId: string, token: string)`
  - Configurar baseUrl: `http://ticket-service:3005`
  - _Requirements: 5.1, 9.1_

- [ ] 6. Crear NotificationServiceClient
  - Crear carpeta `shared/clients/notification-service/`
  - Crear archivo `NotificationServiceClient.ts` extendiendo BaseHttpClient
  - Implementar método `getUserNotifications(userId: string, token: string, onlyUnread?: boolean, limit?: number)`
  - Implementar método `getUnreadCount(userId: string, token: string)`
  - Configurar baseUrl: `http://notification-service:3000`
  - _Requirements: 7.1, 7.3, 9.1_

- [ ] 7. Crear RecommenderServiceClient
  - Crear carpeta `shared/clients/recommender-service/`
  - Crear archivo `RecommenderServiceClient.ts` extendiendo BaseHttpClient
  - Implementar método `getPersonalizedRecommendations(userId: string, token: string, limit?: number)`
  - Configurar baseUrl: `http://recommender:3000`
  - _Requirements: 6.1, 9.1_

- [ ] 8. Crear ProductServiceClient
  - Crear carpeta `shared/clients/product-service/`
  - Crear archivo `ProductServiceClient.ts` extendiendo BaseHttpClient
  - Implementar método `getRelatedProducts(productId: string, limit?: number)`
  - Implementar método `getProductsByCategory(category: string, limit?: number)`
  - Configurar baseUrl: `http://product-service:3000`
  - _Requirements: 8.5, 9.1_

- [ ] 9. Crear CartServiceClient (Frontend API)
  - Crear carpeta `shared/clients/cart-service/`
  - Crear archivo `CartServiceClient.ts` extendiendo BaseHttpClient
  - Implementar método `getUserCart(userId: string, token: string)`
  - Configurar baseUrl: `http://frontend:3000` o usar API Gateway
  - Nota: El carrito puede estar en localStorage del frontend, evaluar mejor enfoque
  - _Requirements: 3.1, 3.5, 9.1_

- [ ] 10. Crear WishlistServiceClient (Frontend API)
  - Crear carpeta `shared/clients/wishlist-service/`
  - Crear archivo `WishlistServiceClient.ts` extendiendo BaseHttpClient
  - Implementar método `getUserWishlist(userId: string, token: string)`
  - Configurar baseUrl: `http://frontend:3000` o usar API Gateway
  - Nota: La wishlist puede estar en localStorage del frontend, evaluar mejor enfoque
  - _Requirements: 4.1, 4.5, 9.1_

## Fase 2: Casos de Uso Core

- [ ] 11. Implementar GetUserOrders
  - Crear carpeta `get-user-orders/`
  - Crear archivo `GetUserOrders.ts` con clase GetUserOrders
  - Inyectar OrderServiceClient en constructor
  - Implementar método `execute(userId: string, token: string, limit?: number = 3)`
  - Consultar OrderServiceClient.getUserOrders()
  - Transformar respuesta a formato Order[]
  - Manejar errores y retornar array vacío si falla
  - Agregar logging
  - _Requirements: 2.1, 2.2, 2.4, 9.2_

- [ ] 12. Implementar GetUserNotifications
  - Crear carpeta `get-user-notifications/`
  - Crear archivo `GetUserNotifications.ts` con clase GetUserNotifications
  - Inyectar NotificationServiceClient en constructor
  - Implementar método `execute(userId: string, token: string, onlyUnread?: boolean = true, limit?: number = 5)`
  - Consultar NotificationServiceClient.getUserNotifications()
  - Transformar respuesta a formato Notification[]
  - Manejar errores y retornar array vacío si falla
  - _Requirements: 7.1, 7.3, 9.2_

- [ ] 13. Implementar GetUserTickets
  - Crear carpeta `get-user-tickets/`
  - Crear archivo `GetUserTickets.ts` con clase GetUserTickets
  - Inyectar TicketServiceClient en constructor
  - Implementar método `execute(userId: string, token: string, onlyOpen?: boolean = true)`
  - Consultar TicketServiceClient.getUserTickets()
  - Transformar respuesta a formato Ticket[]
  - Manejar errores y retornar array vacío si falla
  - _Requirements: 5.1, 5.2, 9.2_

- [ ] 14. Implementar EnrichUserContext
  - Crear carpeta `enrich-user-context/`
  - Crear archivo `EnrichUserContext.ts` con clase EnrichUserContext
  - Inyectar todos los clientes necesarios en constructor
  - Implementar método `execute(userId: string, userName: string, email: string, token: string)`
  - Consultar servicios en paralelo con Promise.allSettled():
    * GetUserOrders (últimos 3 pedidos activos)
    * GetUserNotifications (notificaciones no leídas)
    * GetUserTickets (tickets abiertos)
  - Construir objeto UserContext con resultados
  - Registrar errores en enrichmentErrors si algún servicio falla
  - Implementar caché de 30 segundos usando SimpleCache
  - Retornar UserContext completo
  - _Requirements: 1.2, 7.1, 9.2, 9.4_

- [ ] 15. Integrar EnrichUserContext en ProcessMessage
  - Modificar `process-message/ProcessMessage.ts`
  - Inyectar EnrichUserContext en constructor
  - Al inicio de execute(), verificar si req.user existe
  - Si existe req.user, llamar a enrichUserContext.execute()
  - Agregar userContext al session.context
  - Pasar userContext al prompt de Gemini/Ollama para personalización
  - Mantener compatibilidad con usuarios anónimos (sin req.user)
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

## Fase 3: Casos de Uso Adicionales

- [ ] 16. Implementar GetUserCart
  - Crear carpeta `get-user-cart/`
  - Crear archivo `GetUserCart.ts` con clase GetUserCart
  - Inyectar CartServiceClient en constructor
  - Implementar método `execute(userId: string, token: string)`
  - Consultar CartServiceClient.getUserCart()
  - Transformar respuesta a formato CartSummary
  - Calcular itemCount y total
  - Manejar errores y retornar carrito vacío si falla
  - _Requirements: 3.1, 3.2, 3.5, 9.2_

- [ ] 17. Implementar GetUserWishlist
  - Crear carpeta `get-user-wishlist/`
  - Crear archivo `GetUserWishlist.ts` con clase GetUserWishlist
  - Inyectar WishlistServiceClient en constructor
  - Implementar método `execute(userId: string, token: string)`
  - Consultar WishlistServiceClient.getUserWishlist()
  - Transformar respuesta a formato WishlistItem[]
  - Calcular discountPercentage si hay originalPrice
  - Destacar productos con descuento
  - Manejar errores y retornar array vacío si falla
  - _Requirements: 4.1, 4.2, 4.5, 9.2_

- [ ] 18. Implementar GetPersonalizedRecommendations
  - Crear carpeta `get-personalized-recs/`
  - Crear archivo `GetPersonalizedRecommendations.ts` con clase GetPersonalizedRecommendations
  - Inyectar RecommenderServiceClient en constructor
  - Implementar método `execute(userId: string, token: string, limit?: number = 5)`
  - Consultar RecommenderServiceClient.getPersonalizedRecommendations()
  - Transformar respuesta a formato PersonalizedRecommendation[]
  - Limitar a máximo 5 recomendaciones
  - Manejar errores y retornar array vacío si falla
  - _Requirements: 6.1, 6.2, 9.2_

- [ ] 19. Implementar GetPurchaseHistory
  - Crear carpeta `get-purchase-history/`
  - Crear archivo `GetPurchaseHistory.ts` con clase GetPurchaseHistory
  - Inyectar OrderServiceClient en constructor
  - Implementar método `execute(userId: string, token: string, limit?: number = 10)`
  - Consultar OrderServiceClient.getCompletedOrders()
  - Extraer productos de pedidos completados
  - Transformar a formato PurchaseHistoryItem[]
  - Ordenar por fecha de compra (más reciente primero)
  - Manejar errores y retornar array vacío si falla
  - _Requirements: 8.1, 8.2, 9.2_

- [ ] 20. Implementar GetComplementaryProducts
  - Crear carpeta `get-complementary-products/`
  - Crear archivo `GetComplementaryProducts.ts` con clase GetComplementaryProducts
  - Inyectar ProductServiceClient en constructor
  - Implementar método `execute(productId: string, category: string, limit?: number = 3)`
  - Consultar ProductServiceClient.getRelatedProducts()
  - Filtrar productos complementarios (accesorios, compatibles)
  - Transformar a formato ProductInfo[]
  - Manejar errores y retornar array vacío si falla
  - _Requirements: 8.3, 8.5, 9.2_

## Fase 4: Reconocimiento de Intenciones Personalizadas

- [ ] 21. Actualizar SimpleFallbackRecognizer con intenciones personalizadas
  - Modificar `shared/recognizers/SimpleFallbackRecognizer.ts`
  - Agregar nueva intención: `user_orders` con patrones: "mis pedidos", "dónde está mi pedido", "estado de mi pedido", "tracking"
  - Agregar nueva intención: `user_cart` con patrones: "mi carrito", "qué tengo en el carrito", "ver carrito"
  - Agregar nueva intención: `user_wishlist` con patrones: "mi lista de deseos", "wishlist", "productos guardados"
  - Agregar nueva intención: `user_tickets` con patrones: "mis tickets", "soporte", "tickets abiertos"
  - Agregar nueva intención: `user_notifications` con patrones: "notificaciones", "tengo notificaciones", "avisos"
  - Agregar nueva intención: `user_history` con patrones: "qué compré", "mis compras", "historial de compras"
  - Agregar nueva intención: `user_recommendations` con patrones: "recomiéndame", "qué me recomiendas", "sugerencias"
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 22. Crear GeneratePersonalizedResponse
  - Crear carpeta `generate-personalized-response/`
  - Crear archivo `GeneratePersonalizedResponse.ts` con clase GeneratePersonalizedResponse
  - Inyectar todos los casos de uso necesarios
  - Implementar método `execute(intent: Intent, userContext: UserContext, token: string)`
  - Implementar switch por tipo de intención:
    * `user_orders`: Llamar GetUserOrders y formatear respuesta
    * `user_cart`: Llamar GetUserCart y formatear respuesta
    * `user_wishlist`: Llamar GetUserWishlist y formatear respuesta
    * `user_tickets`: Llamar GetUserTickets y formatear respuesta
    * `user_notifications`: Usar userContext.unreadNotifications y formatear
    * `user_history`: Llamar GetPurchaseHistory y formatear respuesta
    * `user_recommendations`: Llamar GetPersonalizedRecommendations y formatear
  - Generar respuestas en lenguaje natural amigable
  - Incluir enlaces relevantes cuando sea apropiado
  - _Requirements: 2.2, 3.1, 3.2, 4.1, 5.2, 7.3, 8.2, 12.1, 12.2, 12.3, 12.4_

- [ ] 23. Integrar GeneratePersonalizedResponse en ProcessMessage
  - Modificar `process-message/ProcessMessage.ts`
  - Inyectar GeneratePersonalizedResponse en constructor
  - Después de reconocer intención, verificar si es intención personalizada
  - Si es intención personalizada y hay userContext, llamar a GeneratePersonalizedResponse
  - Retornar respuesta personalizada directamente sin pasar por Gemini/Ollama
  - Si no es intención personalizada, continuar flujo normal
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

## Fase 5: Mejoras de Prompt y Personalización

- [ ] 24. Enriquecer system prompt de Gemini con contexto de usuario
  - Modificar `process-message/ProcessMessage.ts` en método processWithNLP()
  - Cuando hay userContext, agregar sección al system prompt con:
    * Nombre del usuario
    * Número de pedidos activos
    * Número de notificaciones pendientes
    * Número de tickets abiertos
    * Productos en carrito
    * Productos en wishlist
  - Instruir a Gemini para usar esta información en respuestas
  - Mantener prompt conciso (no exceder límite de tokens)
  - _Requirements: 1.1, 1.3_

- [ ] 25. Implementar saludo personalizado
  - Modificar `process-message/ProcessMessage.ts`
  - Detectar si es el primer mensaje de la sesión (conversationHistory vacío)
  - Si hay userContext, generar saludo personalizado:
    * "¡Hola [nombre]! 👋"
    * Mencionar notificaciones si hay: "Tienes [N] notificaciones nuevas"
    * Mencionar pedidos activos si hay: "Tu pedido #[X] está en camino"
  - Si no hay userContext, usar saludo genérico
  - _Requirements: 1.1, 7.2_

- [ ] 26. Implementar sugerencias de productos complementarios
  - Modificar `generate-personalized-response/GeneratePersonalizedResponse.ts`
  - En respuesta de `user_history`, identificar compra más reciente
  - Llamar a GetComplementaryProducts con el producto más reciente
  - Agregar sugerencias al final de la respuesta:
    * "Basándome en tu compra de [producto], te recomiendo..."
  - Limitar a 3 sugerencias máximo
  - _Requirements: 8.3, 8.4_

- [ ] 27. Implementar detección de productos con descuento en wishlist
  - Modificar `generate-personalized-response/GeneratePersonalizedResponse.ts`
  - En respuesta de `user_wishlist`, filtrar productos con descuento
  - Destacar productos con descuento al inicio:
    * "¡Buenas noticias! [Producto] tiene [X]% de descuento"
  - Mostrar precio original tachado y precio actual
  - _Requirements: 4.2_

- [ ] 28. Implementar generación de enlaces directos
  - Crear utilidad `shared/utils/generateLinks.ts`
  - Implementar función `generateProductLink(productId: string): string`
  - Implementar función `generateCartLink(): string`
  - Implementar función `generateWishlistLink(): string`
  - Implementar función `generateOrderLink(orderId: string): string`
  - Implementar función `generateTicketLink(ticketId: string): string`
  - Implementar función `generateNotificationLink(notificationId: string): string`
  - Usar FRONTEND_URL de variables de entorno
  - _Requirements: 3.3, 4.3, 7.4_

- [ ] 29. Integrar enlaces en respuestas personalizadas
  - Modificar `generate-personalized-response/GeneratePersonalizedResponse.ts`
  - Usar utilidades de generateLinks para crear enlaces
  - Agregar enlaces al final de cada respuesta relevante:
    * Pedidos: "Ver detalles del pedido"
    * Carrito: "Ir al carrito"
    * Wishlist: "Ver mi lista de deseos"
    * Tickets: "Ver ticket #[X]"
    * Notificaciones: "Ver todas las notificaciones"
  - Formatear enlaces como botones o texto clickeable
  - _Requirements: 3.3, 4.3, 7.4_

## Fase 6: Manejo de Edge Cases

- [ ] 30. Implementar respuestas para casos vacíos
  - Modificar `generate-personalized-response/GeneratePersonalizedResponse.ts`
  - Para pedidos vacíos: "No tienes pedidos activos. ¿Te gustaría explorar nuestros productos?"
  - Para carrito vacío: "Tu carrito está vacío. ¿Quieres ver nuestras ofertas?"
  - Para wishlist vacía: "Tu lista de deseos está vacía. ¿Te ayudo a encontrar algo?"
  - Para tickets vacíos: "No tienes tickets abiertos. ¡Todo está al día!"
  - Para notificaciones vacías: "No tienes notificaciones nuevas. ¡Estás al día!"
  - Para historial vacío: "Aún no has realizado compras. ¿Te ayudo a encontrar algo?"
  - Agregar sugerencias relevantes en cada caso
  - _Requirements: 2.5, 3.4, 4.4, 5.5, 7.5_

- [ ] 31. Implementar manejo de usuario anónimo
  - Modificar `process-message/ProcessMessage.ts`
  - Detectar intenciones personalizadas sin userContext
  - Responder amablemente: "Para ver [pedidos/carrito/etc.], necesitas iniciar sesión"
  - Proporcionar enlace para login
  - Mantener funcionalidad básica del chatbot
  - _Requirements: 1.4_

- [ ] 32. Implementar manejo de intenciones no reconocidas
  - Modificar `generate-personalized-response/GeneratePersonalizedResponse.ts`
  - Para intención `unknown` con usuario autenticado, ofrecer opciones:
    * "Puedo ayudarte con:"
    * "• Ver tus pedidos"
    * "• Consultar tu carrito"
    * "• Ver tu lista de deseos"
    * "• Revisar tus tickets de soporte"
    * "• Ver notificaciones"
    * "• Recomendaciones personalizadas"
  - Mantener opciones genéricas del chatbot (búsqueda de productos, etc.)
  - _Requirements: 12.5_

## Fase 7: Seguridad y Privacidad

- [ ] 33. Implementar verificación de propiedad de recursos
  - Crear utilidad `shared/utils/verifyOwnership.ts`
  - Implementar función `verifyOrderOwnership(orderId: string, userId: string, token: string)`
  - Implementar función `verifyTicketOwnership(ticketId: string, userId: string, token: string)`
  - Consultar servicio correspondiente para verificar propiedad
  - Retornar true/false
  - Loggear intentos de acceso no autorizado
  - _Requirements: 2.4, 5.4, 10.1, 10.2_

- [ ] 34. Integrar verificación de propiedad en casos de uso
  - Modificar `get-user-orders/GetUserOrders.ts`
  - Antes de retornar pedido específico, verificar propiedad
  - Si no es propietario, loggear intento y retornar error 403
  - Aplicar mismo patrón en GetUserTickets
  - _Requirements: 2.4, 5.4, 10.2_

- [ ] 35. Implementar enmascaramiento de datos sensibles
  - Crear utilidad `shared/utils/maskSensitiveData.ts`
  - Implementar función `maskCardNumber(cardNumber: string): string` - Mostrar solo últimos 4 dígitos
  - Implementar función `maskEmail(email: string): string` - Mostrar solo primeras 2 letras y dominio
  - Implementar función `maskPhone(phone: string): string` - Mostrar solo últimos 3 dígitos
  - Aplicar enmascaramiento en respuestas que muestren datos sensibles
  - _Requirements: 10.4_

- [ ] 36. Implementar logging seguro
  - Crear utilidad `shared/utils/secureLogger.ts`
  - Implementar función `sanitizeLogData(data: any): any` - Remover campos sensibles
  - Lista de campos a remover: password, cardNumber, cvv, token, apiKey
  - Usar en todos los logs del chatbot
  - Verificar que no se loggea información sensible
  - _Requirements: 10.5_

- [ ] 37. Implementar asociación de conversaciones con userId
  - Modificar `manage-session/ManageSession.ts`
  - Agregar campo userId a la sesión cuando hay req.user
  - Almacenar userId en logs de conversación
  - Usar userId para filtrar conversaciones en futuras consultas
  - _Requirements: 10.3_

## Fase 8: Configuración y Variables de Entorno

- [ ] 38. Actualizar archivo de configuración
  - Modificar `config/index.ts`
  - Agregar configuración de URLs de servicios:
    * ORDER_SERVICE_URL
    * TICKET_SERVICE_URL
    * NOTIFICATION_SERVICE_URL
    * RECOMMENDER_SERVICE_URL
    * PRODUCT_SERVICE_URL
    * FRONTEND_URL
  - Agregar configuración de timeouts: SERVICE_TIMEOUT_MS (default: 5000)
  - Agregar configuración de caché: CACHE_TTL_SECONDS (default: 30), CACHE_MAX_ENTRIES (default: 1000)
  - Agregar feature flags: ENABLE_USER_CONTEXT (default: true), ENABLE_PERSONALIZATION (default: true)
  - _Requirements: 9.3, 9.4_

- [ ] 39. Actualizar docker-compose.yml con variables de entorno
  - Modificar `docker-compose.optimized.yml`
  - Agregar variables de entorno al servicio chatbot:
    * ORDER_SERVICE_URL=http://order-service:3000
    * TICKET_SERVICE_URL=http://ticket-service:3005
    * NOTIFICATION_SERVICE_URL=http://notification-service:3000
    * RECOMMENDER_SERVICE_URL=http://recommender:3000
    * PRODUCT_SERVICE_URL=http://product-service:3000
    * FRONTEND_URL=http://frontend:3000
    * SERVICE_TIMEOUT_MS=5000
    * CACHE_TTL_SECONDS=30
    * ENABLE_USER_CONTEXT=true
  - _Requirements: 9.3, 9.4_

- [ ] 40. Actualizar README del chatbot
  - Modificar `domains/support/chatbot-service/README.md`
  - Documentar nuevas funcionalidades de personalización
  - Documentar variables de entorno requeridas
  - Documentar intenciones personalizadas disponibles
  - Agregar ejemplos de uso con usuario autenticado
  - Documentar arquitectura de casos de uso
  - _Requirements: 11.1, 11.2, 11.3_

## Fase 9: Testing Manual y Ajustes

- [ ] 41. Testing manual de flujo completo
  - Iniciar sesión con usuario de prueba
  - Probar saludo personalizado
  - Probar consulta de pedidos: "¿dónde está mi pedido?"
  - Probar consulta de carrito: "¿qué tengo en mi carrito?"
  - Probar consulta de wishlist: "muéstrame mi lista de deseos"
  - Probar consulta de tickets: "¿tengo tickets abiertos?"
  - Probar consulta de notificaciones: "¿tengo notificaciones?"
  - Probar consulta de historial: "¿qué compré antes?"
  - Probar recomendaciones: "¿qué me recomiendas?"
  - Verificar enlaces generados
  - Verificar manejo de casos vacíos
  - Verificar comportamiento con usuario anónimo
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 42. Testing de manejo de errores
  - Simular fallo de Order Service (detener contenedor)
  - Verificar que chatbot continúa funcionando
  - Verificar mensaje de error amigable
  - Verificar logging de errores
  - Repetir para cada servicio externo
  - Verificar timeout de 5 segundos
  - Verificar que caché funciona correctamente
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 43. Testing de seguridad
  - Intentar acceder a pedido de otro usuario
  - Verificar que se deniega el acceso
  - Verificar que se loggea el intento
  - Verificar enmascaramiento de datos sensibles
  - Verificar que logs no contienen información sensible
  - Verificar que JWT se incluye en peticiones
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ] 44. Optimizaciones y ajustes finales
  - Revisar tiempos de respuesta
  - Optimizar consultas paralelas si es necesario
  - Ajustar mensajes de respuesta para mejor UX
  - Ajustar límites de resultados si es necesario
  - Revisar y mejorar logging
  - Documentar cualquier limitación conocida
  - _Requirements: 9.4_

- [ ] 45. Checkpoint final - Validación completa
  - Verificar que todos los casos de uso funcionan correctamente
  - Verificar que la integración con servicios externos es estable
  - Verificar que el rendimiento es aceptable (< 5 segundos respuesta total)
  - Verificar que la seguridad está implementada correctamente
  - Verificar que el código sigue Screaming Architecture
  - Confirmar que la funcionalidad está lista para producción
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1_
