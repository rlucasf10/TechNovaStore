# Requirements Document - Personalización del Chatbot con Contexto de Usuario

## Introduction

Este documento define los requisitos para implementar personalización avanzada en el chatbot de TechNovaStore, aprovechando la autenticación de usuarios para proporcionar una experiencia contextual y personalizada. El chatbot podrá acceder a información específica del usuario (pedidos, carrito, wishlist, tickets, historial) para ofrecer respuestas más relevantes y útiles.

## Glossary

- **Chatbot Service**: Servicio de asistente virtual que procesa mensajes de usuarios
- **User Context**: Información específica del usuario autenticado (pedidos, carrito, preferencias)
- **Order Service**: Servicio que gestiona pedidos de usuarios
- **Cart**: Carrito de compras del usuario en el frontend
- **Wishlist**: Lista de deseos del usuario con productos guardados
- **Ticket Service**: Servicio de soporte técnico que gestiona tickets
- **Recommender Service**: Servicio que genera recomendaciones personalizadas
- **Notification Service**: Servicio que gestiona notificaciones de usuario
- **User Service**: Servicio que gestiona información de usuarios
- **Authenticated User**: Usuario que ha iniciado sesión y tiene un token JWT válido
- **Anonymous User**: Usuario sin autenticar que usa el chatbot públicamente
- **Session Context**: Contexto de conversación que persiste durante una sesión de chat

## Requirements

### Requirement 1: Saludo y Contexto Personalizado

**User Story:** Como usuario autenticado, quiero que el chatbot me salude por mi nombre y tenga contexto de mi actividad, para sentir una experiencia personalizada.

#### Acceptance Criteria

1. WHEN un usuario autenticado inicia una conversación THEN el Chatbot Service SHALL saludar al usuario usando su nombre de perfil
2. WHEN el Chatbot Service procesa un mensaje de usuario autenticado THEN el Chatbot Service SHALL incluir el userId en el contexto de la sesión
3. WHEN el Chatbot Service genera respuestas THEN el Chatbot Service SHALL adaptar el tono y contenido según el historial del usuario
4. WHEN un usuario anónimo usa el chatbot THEN el Chatbot Service SHALL funcionar normalmente sin personalización
5. WHEN el Chatbot Service detecta un usuario autenticado THEN el Chatbot Service SHALL registrar el userId en los logs de conversación

### Requirement 2: Consulta de Pedidos

**User Story:** Como usuario autenticado, quiero consultar el estado de mis pedidos a través del chatbot, para obtener información rápida sin navegar por la web.

#### Acceptance Criteria

1. WHEN un usuario pregunta por sus pedidos THEN el Chatbot Service SHALL consultar el Order Service con el userId autenticado
2. WHEN el Order Service retorna pedidos activos THEN el Chatbot Service SHALL mostrar los últimos 3 pedidos con estado, fecha y total
3. WHEN un usuario pregunta por un pedido específico THEN el Chatbot Service SHALL buscar el pedido por número y mostrar detalles completos
4. WHEN el Chatbot Service consulta pedidos THEN el Chatbot Service SHALL verificar que el pedido pertenece al usuario autenticado
5. WHEN no hay pedidos para el usuario THEN el Chatbot Service SHALL informar amablemente y sugerir explorar productos

### Requirement 3: Gestión de Carrito

**User Story:** Como usuario autenticado, quiero consultar y gestionar mi carrito a través del chatbot, para una experiencia de compra más fluida.

#### Acceptance Criteria

1. WHEN un usuario pregunta por su carrito THEN el Chatbot Service SHALL mostrar el número de productos y el total del carrito
2. WHEN el Chatbot Service muestra el carrito THEN el Chatbot Service SHALL listar los productos con nombre, cantidad y precio
3. WHEN un usuario pide agregar un producto al carrito THEN el Chatbot Service SHALL proporcionar un enlace directo para agregar el producto
4. WHEN el carrito está vacío THEN el Chatbot Service SHALL sugerir productos populares o recomendaciones personalizadas
5. WHEN el Chatbot Service accede al carrito THEN el Chatbot Service SHALL usar el userId para obtener el carrito correcto

### Requirement 4: Consulta de Wishlist

**User Story:** Como usuario autenticado, quiero consultar mi lista de deseos y recibir alertas de ofertas, para no perder oportunidades de compra.

#### Acceptance Criteria

1. WHEN un usuario pregunta por su wishlist THEN el Chatbot Service SHALL mostrar los productos guardados con nombre y precio actual
2. WHEN un producto de la wishlist tiene descuento THEN el Chatbot Service SHALL destacar la oferta y el porcentaje de descuento
3. WHEN un usuario pide agregar un producto a la wishlist THEN el Chatbot Service SHALL proporcionar un enlace para agregarlo
4. WHEN la wishlist está vacía THEN el Chatbot Service SHALL sugerir explorar categorías populares
5. WHEN el Chatbot Service accede a la wishlist THEN el Chatbot Service SHALL verificar que pertenece al usuario autenticado

### Requirement 5: Tickets de Soporte

**User Story:** Como usuario autenticado, quiero consultar y crear tickets de soporte a través del chatbot, para resolver problemas rápidamente.

#### Acceptance Criteria

1. WHEN un usuario pregunta por sus tickets THEN el Chatbot Service SHALL consultar el Ticket Service y mostrar tickets abiertos
2. WHEN el Chatbot Service muestra tickets THEN el Chatbot Service SHALL incluir número de ticket, asunto, estado y última actualización
3. WHEN un usuario solicita crear un ticket THEN el Chatbot Service SHALL usar el caso de uso escalate-to-human existente
4. WHEN el Chatbot Service crea un ticket THEN el Chatbot Service SHALL asociar el ticket al userId autenticado
5. WHEN no hay tickets abiertos THEN el Chatbot Service SHALL informar que no hay tickets pendientes

### Requirement 6: Recomendaciones Personalizadas

**User Story:** Como usuario autenticado, quiero recibir recomendaciones basadas en mi historial de compras, para descubrir productos relevantes.

#### Acceptance Criteria

1. WHEN un usuario pide recomendaciones THEN el Chatbot Service SHALL consultar el Recommender Service con el userId
2. WHEN el Recommender Service retorna productos THEN el Chatbot Service SHALL mostrar hasta 5 recomendaciones con razón de recomendación
3. WHEN el Chatbot Service genera recomendaciones THEN el Chatbot Service SHALL considerar el historial de compras del usuario
4. WHEN el Chatbot Service genera recomendaciones THEN el Chatbot Service SHALL considerar las categorías de interés del usuario
5. WHEN el usuario es nuevo sin historial THEN el Chatbot Service SHALL mostrar productos trending o populares

### Requirement 7: Notificaciones Pendientes

**User Story:** Como usuario autenticado, quiero que el chatbot me informe sobre notificaciones pendientes, para estar al día con actualizaciones importantes.

#### Acceptance Criteria

1. WHEN un usuario autenticado inicia conversación THEN el Chatbot Service SHALL consultar el Notification Service para notificaciones no leídas
2. WHEN hay notificaciones pendientes THEN el Chatbot Service SHALL mencionar el número de notificaciones en el saludo inicial
3. WHEN un usuario pregunta por notificaciones THEN el Chatbot Service SHALL mostrar las últimas 5 notificaciones con título y fecha
4. WHEN el Chatbot Service muestra notificaciones THEN el Chatbot Service SHALL proporcionar enlaces para ver detalles
5. WHEN no hay notificaciones THEN el Chatbot Service SHALL informar que está todo al día

### Requirement 8: Historial de Compras y Productos Complementarios

**User Story:** Como usuario autenticado, quiero que el chatbot recuerde mis compras anteriores y sugiera productos complementarios, para mejorar mi experiencia de compra.

#### Acceptance Criteria

1. WHEN un usuario pregunta por compras anteriores THEN el Chatbot Service SHALL consultar el Order Service para pedidos completados
2. WHEN el Chatbot Service muestra historial THEN el Chatbot Service SHALL listar productos comprados con fecha y precio
3. WHEN el Chatbot Service identifica una compra reciente THEN el Chatbot Service SHALL sugerir accesorios o productos complementarios
4. WHEN un usuario compró un producto hace tiempo THEN el Chatbot Service SHALL sugerir actualizaciones o nuevas versiones
5. WHEN el Chatbot Service sugiere complementarios THEN el Chatbot Service SHALL usar el Product Service para obtener productos relacionados

### Requirement 9: Integración con Servicios Externos

**User Story:** Como desarrollador, quiero que el chatbot se integre correctamente con todos los servicios del ecosistema, para proporcionar información precisa y actualizada.

#### Acceptance Criteria

1. WHEN el Chatbot Service consulta servicios externos THEN el Chatbot Service SHALL incluir el token JWT en las peticiones
2. WHEN un servicio externo falla THEN el Chatbot Service SHALL manejar el error gracefully y informar al usuario
3. WHEN el Chatbot Service consulta servicios THEN el Chatbot Service SHALL implementar timeout de 5 segundos
4. WHEN el Chatbot Service consulta servicios THEN el Chatbot Service SHALL cachear respuestas por 30 segundos para mejorar rendimiento
5. WHEN el Chatbot Service consulta servicios THEN el Chatbot Service SHALL loggear todas las peticiones para debugging

### Requirement 10: Privacidad y Seguridad

**User Story:** Como usuario, quiero que mi información personal esté protegida y solo sea accesible para mí, para mantener mi privacidad.

#### Acceptance Criteria

1. WHEN el Chatbot Service accede a datos de usuario THEN el Chatbot Service SHALL verificar que el userId del token coincide con el userId solicitado
2. WHEN un usuario intenta acceder a datos de otro usuario THEN el Chatbot Service SHALL denegar el acceso y loggear el intento
3. WHEN el Chatbot Service almacena conversaciones THEN el Chatbot Service SHALL asociar conversaciones al userId para privacidad
4. WHEN el Chatbot Service muestra información sensible THEN el Chatbot Service SHALL enmascarar datos sensibles (últimos 4 dígitos de tarjeta, etc.)
5. WHEN el Chatbot Service loggea información THEN el Chatbot Service SHALL NO loggear información sensible del usuario

### Requirement 11: Arquitectura y Casos de Uso

**User Story:** Como desarrollador, quiero que la implementación siga Screaming Architecture, para mantener consistencia con el resto del proyecto.

#### Acceptance Criteria

1. WHEN se implementa personalización THEN el Chatbot Service SHALL crear casos de uso separados para cada funcionalidad
2. WHEN se crean casos de uso THEN cada caso de uso SHALL estar en su propia carpeta con nombre descriptivo
3. WHEN se integran servicios externos THEN el Chatbot Service SHALL crear clientes en shared/clients para cada servicio
4. WHEN se implementan casos de uso THEN cada caso de uso SHALL tener su archivo de tests correspondiente
5. WHEN se modifica process-message THEN el Chatbot Service SHALL mantener la estructura existente y agregar enriquecimiento de contexto

### Requirement 12: Experiencia de Usuario

**User Story:** Como usuario, quiero que el chatbot entienda mis preguntas sobre mi cuenta de forma natural, para una interacción fluida.

#### Acceptance Criteria

1. WHEN un usuario pregunta "¿dónde está mi pedido?" THEN el Chatbot Service SHALL reconocer la intención y mostrar pedidos activos
2. WHEN un usuario pregunta "¿qué tengo en mi carrito?" THEN el Chatbot Service SHALL reconocer la intención y mostrar el carrito
3. WHEN un usuario pregunta "¿tengo notificaciones?" THEN el Chatbot Service SHALL reconocer la intención y mostrar notificaciones
4. WHEN un usuario pregunta "¿qué compré antes?" THEN el Chatbot Service SHALL reconocer la intención y mostrar historial
5. WHEN el Chatbot Service no entiende una pregunta THEN el Chatbot Service SHALL ofrecer opciones de lo que puede hacer

