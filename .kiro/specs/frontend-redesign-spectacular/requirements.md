# Documento de Requisitos - Rediseño Espectacular del Frontend TechNovaStore

## Introducción

Este documento define los requisitos para el rediseño completo del frontend de TechNovaStore, una plataforma de e-commerce especializada en tecnología e informática con dropshipping automatizado. El objetivo es crear una experiencia de usuario moderna, rápida y profesional que esté a la altura de las grandes empresas tecnológicas, manteniendo la integración con la arquitectura de microservicios existente.

## Glosario

- **Frontend**: Aplicación web del cliente construida con React 18, Next.js, Tailwind CSS y React Query
- **ChatWidget**: Componente de chat flotante que se integra con el AI Chatbot (Ollama/Phi-3 Mini)
- **Streaming**: Técnica de transmisión de datos en tiempo real usando Socket.IO para mostrar respuestas del chatbot progresivamente
- **SimpleFallbackRecognizer**: Sistema de respaldo del chatbot cuando Ollama no está disponible
- **ProductCatalog**: Página de listado de productos con filtros avanzados
- **ProductDetail**: Página de detalle de un producto individual
- **UserDashboard**: Panel de control para usuarios finales
- **AdminDashboard**: Panel de control para administradores del sistema
- **OrderTracking**: Sistema de seguimiento de pedidos en tiempo real
- **Checkout**: Proceso de finalización de compra
- **SSR/SSG**: Server-Side Rendering / Static Site Generation (características de Next.js)
- **WCAG 2.1**: Web Content Accessibility Guidelines versión 2.1

## Requisitos

### Requisito 1: Arquitectura y Stack Tecnológico

**User Story:** Como desarrollador del sistema, quiero que el frontend utilice tecnologías modernas y escalables, para que la aplicación sea mantenible y de alto rendimiento.

#### Acceptance Criteria

1. THE Frontend SHALL utilizar React 18 como biblioteca principal de interfaz de usuario
2. THE Frontend SHALL utilizar Next.js para implementar SSR y SSG con el objetivo de optimizar SEO
3. THE Frontend SHALL utilizar Tailwind CSS como framework de estilos
4. THE Frontend SHALL utilizar React Query para la gestión de estado del servidor y caché de datos
5. THE Frontend SHALL utilizar Socket.IO client para la comunicación en tiempo real con el ChatWidget

### Requisito 2: Integración del ChatWidget con IA

**User Story:** Como usuario de la tienda, quiero interactuar con un chatbot moderno que responda en tiempo real, para que pueda obtener ayuda inmediata sobre productos técnicos.

#### Acceptance Criteria

1. WHEN el usuario envía un mensaje al chatbot, THE ChatWidget SHALL mostrar un indicador visual de "escribiendo" inmediatamente
2. WHEN el chatbot genera una respuesta, THE ChatWidget SHALL recibir y mostrar chunks de texto en tiempo real mediante el evento 'chat_stream_chunk'
3. WHEN el chatbot finaliza la respuesta, THE ChatWidget SHALL detectar el evento 'chat_stream_end' y detener el indicador de escritura
4. WHEN el sistema está usando SimpleFallbackRecognizer, THE ChatWidget SHALL mostrar un badge discreto indicando "Modo Básico"
5. THE ChatWidget SHALL ser un componente flotante minimalista que se expande a una ventana de chat completa

### Requisito 3: Rendimiento y Optimización

**User Story:** Como usuario de la tienda, quiero que las páginas carguen rápidamente, para que pueda navegar sin frustraciones.

#### Acceptance Criteria

1. THE Frontend SHALL cargar cada página en menos de 2 segundos en condiciones de red estándar
2. THE Frontend SHALL implementar lazy loading para imágenes de productos
3. THE Frontend SHALL utilizar code splitting de Next.js para reducir el tamaño del bundle inicial
4. THE Frontend SHALL implementar caché de datos con React Query para minimizar solicitudes redundantes al backend
5. THE Frontend SHALL optimizar imágenes usando el componente Image de Next.js

### Requisito 4: Diseño Responsivo y Mobile-First

**User Story:** Como usuario móvil, quiero que la tienda se vea y funcione perfectamente en mi dispositivo, para que pueda comprar desde cualquier lugar.

#### Acceptance Criteria

1. THE Frontend SHALL implementar un diseño Mobile-First que priorice la experiencia en dispositivos móviles
2. THE Frontend SHALL adaptarse correctamente a pantallas de escritorio, tablet y móvil
3. THE Frontend SHALL mantener la legibilidad y usabilidad en todos los tamaños de pantalla
4. THE Frontend SHALL implementar menús de navegación adaptables (hamburger menu en móvil, navbar completo en escritorio)
5. THE Frontend SHALL asegurar que todos los elementos interactivos tengan un tamaño mínimo de 44x44 píxeles en móvil

### Requisito 5: Accesibilidad WCAG 2.1

**User Story:** Como usuario con discapacidad, quiero que la tienda sea accesible mediante tecnologías asistivas, para que pueda navegar y comprar sin barreras.

#### Acceptance Criteria

1. THE Frontend SHALL cumplir con las pautas WCAG 2.1 nivel AA
2. THE Frontend SHALL implementar navegación completa por teclado en todos los componentes interactivos
3. THE Frontend SHALL utilizar etiquetas ARIA apropiadas para elementos dinámicos
4. THE Frontend SHALL mantener un contraste de color mínimo de 4.5:1 para texto normal
5. THE Frontend SHALL proporcionar textos alternativos descriptivos para todas las imágenes de productos

### Requisito 6: Página de Inicio (Home Page)

**User Story:** Como visitante de la tienda, quiero ver una página de inicio atractiva con recomendaciones personalizadas, para que pueda descubrir productos relevantes rápidamente.

#### Acceptance Criteria

1. THE Home Page SHALL incluir una Hero Section con un mensaje claro de valor de la tienda
2. THE Home Page SHALL mostrar un Product Recommender Widget con recomendaciones personalizadas del Product_Recommender
3. THE Home Page SHALL incluir secciones dinámicas de categorías destacadas
4. THE Home Page SHALL mostrar productos con mejor precio del día
5. THE Home Page SHALL cargar en menos de 2 segundos

### Requisito 7: Catálogo de Productos

**User Story:** Como comprador técnico, quiero filtrar productos por especificaciones técnicas detalladas, para que pueda encontrar exactamente lo que necesito.

#### Acceptance Criteria

1. THE ProductCatalog SHALL implementar filtros avanzados por especificaciones técnicas, marca y rango de precio
2. THE ProductCatalog SHALL mostrar productos en un grid layout moderno y limpio
3. THE ProductCatalog SHALL actualizar los resultados sin recargar la página completa
4. THE ProductCatalog SHALL mostrar el número total de productos que coinciden con los filtros aplicados
5. THE ProductCatalog SHALL implementar paginación o scroll infinito para grandes conjuntos de resultados

### Requisito 8: Página de Detalle de Producto

**User Story:** Como comprador informado, quiero ver especificaciones técnicas detalladas y comparar precios entre proveedores, para que pueda tomar una decisión de compra informada.

#### Acceptance Criteria

1. THE ProductDetail SHALL mostrar una tabla de especificaciones técnicas destacada con navegación por pestañas
2. THE ProductDetail SHALL mostrar un comparador de precios transparente entre proveedores disponibles (Amazon, AliExpress, etc.)
3. THE ProductDetail SHALL incluir una sección de Preguntas y Respuestas con integración del ChatWidget
4. THE ProductDetail SHALL mostrar imágenes de alta calidad con zoom
5. THE ProductDetail SHALL indicar claramente la disponibilidad en stock del producto

### Requisito 9: Carrito de Compras

**User Story:** Como comprador, quiero gestionar fácilmente los productos en mi carrito, para que pueda revisar mi compra antes de proceder al pago.

#### Acceptance Criteria

1. THE ShoppingCart SHALL permitir modificar cantidades de productos de forma interactiva
2. THE ShoppingCart SHALL permitir eliminar productos del carrito con confirmación
3. THE ShoppingCart SHALL calcular y mostrar el subtotal, impuestos y costo de envío en tiempo real
4. THE ShoppingCart SHALL persistir el contenido del carrito entre sesiones del usuario
5. THE ShoppingCart SHALL mostrar el precio total actualizado inmediatamente al realizar cambios

### Requisito 10: Proceso de Checkout

**User Story:** Como comprador, quiero completar mi compra de forma rápida y segura, para que pueda recibir mis productos sin complicaciones.

#### Acceptance Criteria

1. THE Checkout SHALL implementar un proceso multi-paso simplificado con secciones claras: Envío, Pago, Revisión
2. THE Checkout SHALL validar los datos del usuario en tiempo real mientras escribe
3. THE Checkout SHALL integrar métodos de pago seguros mediante el Payment_Service
4. THE Checkout SHALL mostrar un resumen claro del pedido antes de la confirmación final
5. THE Checkout SHALL redirigir al usuario a una página de confirmación con número de pedido después de completar la compra

### Requisito 11: Dashboard de Usuario

**User Story:** Como usuario registrado, quiero acceder a un panel de control centralizado, para que pueda gestionar mis pedidos, perfil y notificaciones.

#### Acceptance Criteria

1. THE UserDashboard SHALL implementar un diseño modular con tarjetas para métricas recientes
2. THE UserDashboard SHALL mostrar el historial de pedidos del usuario
3. THE UserDashboard SHALL mostrar notificaciones importantes del sistema
4. THE UserDashboard SHALL proporcionar acceso rápido a la gestión de perfil y direcciones
5. THE UserDashboard SHALL mostrar estadísticas de compras del usuario

### Requisito 12: Seguimiento de Pedidos

**User Story:** Como comprador, quiero rastrear el estado de mi pedido en tiempo real, para que sepa cuándo llegará mi producto.

#### Acceptance Criteria

1. THE OrderTracking SHALL mostrar un timeline visual animado del estado del envío
2. THE OrderTracking SHALL integrar el tracking_number del proveedor para seguimiento externo
3. THE OrderTracking SHALL mostrar la fecha estimada de entrega de forma prominente
4. THE OrderTracking SHALL actualizar el estado automáticamente basándose en datos del Shipment_Tracker
5. THE OrderTracking SHALL enviar notificaciones al usuario cuando el estado del pedido cambie

### Requisito 13: Historial de Pedidos

**User Story:** Como usuario frecuente, quiero acceder fácilmente a mis pedidos anteriores, para que pueda reordenar o revisar facturas.

#### Acceptance Criteria

1. THE Order History SHALL mostrar todos los pedidos del usuario ordenados por fecha
2. THE Order History SHALL implementar filtros por estado, fecha y monto
3. THE Order History SHALL proporcionar acceso rápido a la factura legal generada por Invoice_Generator
4. THE Order History SHALL permitir reordenar productos de pedidos anteriores con un clic
5. THE Order History SHALL mostrar el estado actual de cada pedido

### Requisito 14: Gestión de Perfil y Cuenta

**User Story:** Como usuario registrado, quiero gestionar mi información personal y configuración de privacidad, para que pueda mantener mis datos actualizados y seguros.

#### Acceptance Criteria

1. THE Profile Management SHALL permitir actualizar información personal del usuario
2. THE Profile Management SHALL permitir cambiar la contraseña de forma segura
3. THE Profile Management SHALL permitir gestionar direcciones de envío múltiples
4. THE Profile Management SHALL incluir una sección de privacidad para cumplir con GDPR/LOPD
5. THE Profile Management SHALL permitir al usuario eliminar su cuenta con confirmación

### Requisito 15: Dashboard de Administración

**User Story:** Como administrador del sistema, quiero monitorear la salud de los servicios y métricas de negocio, para que pueda tomar decisiones informadas y detectar problemas rápidamente.

#### Acceptance Criteria

1. THE AdminDashboard SHALL mostrar KPIs clave: ventas, margen de beneficio, tickets abiertos
2. THE AdminDashboard SHALL mostrar el estado de salud del AI_Chatbot incluyendo uso de fallback
3. THE AdminDashboard SHALL monitorear el estado del Product_Sync_Engine y Auto_Purchase_System
4. THE AdminDashboard SHALL mostrar gráficos de rendimiento de los microservicios
5. THE AdminDashboard SHALL estar protegido con autenticación y autorización de rol de administrador

### Requisito 16: Gestión de Tickets de Soporte

**User Story:** Como administrador de soporte, quiero gestionar tickets de clientes de forma eficiente, para que pueda resolver problemas rápidamente.

#### Acceptance Criteria

1. THE Ticket Management SHALL mostrar todos los tickets ordenados por prioridad y fecha
2. THE Ticket Management SHALL permitir categorizar y priorizar tickets
3. THE Ticket Management SHALL permitir asignar tickets a agentes de soporte
4. THE Ticket Management SHALL mostrar el historial completo de cada ticket
5. THE Ticket Management SHALL integrarse con el Ticket_System del backend

### Requisito 17: Componente de Búsqueda Global

**User Story:** Como usuario, quiero buscar productos rápidamente desde cualquier página, para que pueda encontrar lo que necesito sin navegar por categorías.

#### Acceptance Criteria

1. THE Global Search SHALL estar visible de forma prominente en todas las páginas
2. THE Global Search SHALL implementar autocompletado inteligente mientras el usuario escribe
3. THE Global Search SHALL priorizar productos, categorías y marcas en los resultados
4. THE Global Search SHALL integrarse con la lógica de keyword extraction del NLPEngine
5. THE Global Search SHALL mostrar resultados en menos de 500 milisegundos

### Requisito 18: Componente de Comparación Técnica

**User Story:** Como comprador técnico, quiero comparar especificaciones de múltiples productos lado a lado, para que pueda elegir el producto que mejor se ajuste a mis necesidades.

#### Acceptance Criteria

1. THE Technical Comparison SHALL permitir comparar hasta 5 productos simultáneamente
2. THE Technical Comparison SHALL mostrar especificaciones técnicas en formato de tabla
3. THE Technical Comparison SHALL resaltar diferencias significativas entre productos
4. THE Technical Comparison SHALL permitir agregar o eliminar productos de la comparación fácilmente
5. THE Technical Comparison SHALL ser accesible desde el catálogo y páginas de detalle

### Requisito 19: Sistema de Notificaciones

**User Story:** Como usuario, quiero recibir notificaciones visuales sobre eventos importantes, para que esté informado sin interrumpir mi navegación.

#### Acceptance Criteria

1. THE Notification System SHALL mostrar notificaciones tipo toast de forma no intrusiva
2. THE Notification System SHALL categorizar notificaciones por tipo: éxito, error, advertencia, información
3. THE Notification System SHALL permitir cerrar notificaciones manualmente
4. THE Notification System SHALL auto-cerrar notificaciones después de 5 segundos
5. THE Notification System SHALL apilar múltiples notificaciones de forma ordenada

### Requisito 20: Autenticación y Seguridad

**User Story:** Como usuario, quiero que mis datos estén protegidos con autenticación segura, para que pueda confiar en la plataforma.

#### Acceptance Criteria

1. THE Frontend SHALL utilizar JWT para autenticación de usuarios
2. THE Frontend SHALL almacenar tokens de forma segura usando httpOnly cookies
3. THE Frontend SHALL redirigir a login cuando el token expire
4. THE Frontend SHALL implementar refresh token automático antes de la expiración
5. THE Frontend SHALL proteger rutas sensibles (dashboard, checkout) requiriendo autenticación
6. THE Frontend SHALL implementar páginas de Login, Registro y Recuperación de Contraseña con diseño consistente
7. THE Frontend SHALL validar la fortaleza de contraseñas en el registro (mínimo 8 caracteres, mayúsculas, minúsculas, números)
8. THE Frontend SHALL implementar autenticación OAuth con Google y GitHub
9. THE Frontend SHALL permitir vincular múltiples métodos de autenticación a una misma cuenta
10. THE Frontend SHALL permitir a usuarios con OAuth establecer una contraseña local posteriormente

### Requisito 23: Sistema de Recuperación de Contraseña

**User Story:** Como usuario que olvidó su contraseña, quiero poder recuperar el acceso a mi cuenta de forma segura, para que pueda volver a usar la plataforma sin perder mis datos.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "Olvidé mi contraseña", THE Frontend SHALL mostrar un formulario para ingresar su email
2. WHEN el usuario envía su email, THE Frontend SHALL solicitar al backend el envío de un token de recuperación por email
3. THE Frontend SHALL mostrar un mensaje confirmando que se envió el email con instrucciones
4. WHEN el usuario hace clic en el link del email, THE Frontend SHALL validar el token de recuperación
5. IF el token es válido, THE Frontend SHALL mostrar un formulario para establecer una nueva contraseña
6. THE Frontend SHALL validar que la nueva contraseña cumpla con los requisitos de seguridad
7. THE Frontend SHALL requerir que el usuario confirme la nueva contraseña (ambos campos deben coincidir)
8. WHEN el usuario establece la nueva contraseña exitosamente, THE Frontend SHALL redirigir a la página de login con un mensaje de éxito
9. IF el token es inválido o expiró, THE Frontend SHALL mostrar un mensaje de error y ofrecer reenviar el email
10. THE Frontend SHALL implementar expiración de tokens de recuperación (válidos por 1 hora)
11. IF el usuario se registró solo con OAuth (sin contraseña), THE Frontend SHALL permitir usar el flujo de recuperación para establecer una contraseña por primera vez

### Requisito 24: Autenticación OAuth y Account Linking

**User Story:** Como usuario, quiero poder iniciar sesión con Google o GitHub, y posteriormente establecer una contraseña local si lo deseo, para que tenga flexibilidad en cómo accedo a mi cuenta.

#### Acceptance Criteria

1. THE Frontend SHALL implementar botones de "Continuar con Google" y "Continuar con GitHub" en las páginas de Login y Registro
2. WHEN el usuario hace clic en un botón OAuth, THE Frontend SHALL iniciar el flujo OAuth 2.0 correspondiente
3. WHEN el usuario completa la autenticación OAuth exitosamente, THE Frontend SHALL crear o vincular la cuenta usando el email del proveedor OAuth
4. IF el email ya existe en el sistema, THE Frontend SHALL vincular el método OAuth a la cuenta existente
5. THE Frontend SHALL almacenar en la cuenta del usuario qué métodos de autenticación tiene vinculados (password, google, github)
6. WHEN un usuario con solo OAuth intenta usar "Olvidé mi contraseña", THE Frontend SHALL permitir establecer una contraseña local por primera vez
7. THE Frontend SHALL mostrar en el Dashboard de Usuario una sección "Métodos de Inicio de Sesión" con todos los métodos vinculados
8. THE Frontend SHALL permitir al usuario agregar o eliminar métodos de autenticación desde el Dashboard
9. THE Frontend SHALL requerir al menos un método de autenticación activo antes de permitir eliminar otro
10. WHEN el usuario establece una contraseña local, THE Frontend SHALL permitir iniciar sesión con email/password sin afectar el login con OAuth

### Requisito 21: Estilo Visual y Branding

**User Story:** Como visitante, quiero que la tienda tenga una identidad visual profesional y moderna, para que confíe en realizar compras.

#### Acceptance Criteria

1. THE Frontend SHALL implementar una paleta de colores moderna adecuada para tecnología
2. THE Frontend SHALL utilizar tipografía legible y profesional
3. THE Frontend SHALL implementar uso estratégico de espacios en blanco para mejorar legibilidad
4. THE Frontend SHALL ofrecer opcionalmente un Modo Oscuro para mejorar la experiencia en condiciones de baja luz
5. THE Frontend SHALL mantener consistencia visual en todos los componentes y páginas

### Requisito 22: Integración con Microservicios

**User Story:** Como desarrollador, quiero que el frontend se integre correctamente con todos los microservicios del backend, para que la funcionalidad completa esté disponible.

#### Acceptance Criteria

1. THE Frontend SHALL consumir datos del Product_Service para mostrar productos
2. THE Frontend SHALL integrarse con el Order_Service para gestionar pedidos
3. THE Frontend SHALL utilizar el Payment_Service para procesar pagos
4. THE Frontend SHALL consumir el Product_Recommender para mostrar recomendaciones
5. THE Frontend SHALL integrarse con el Notification_Service para alertas en tiempo real
