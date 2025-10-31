# Plan de Implementación - Frontend TechNovaStore

## Fase 1: Configuración Inicial y Fundamentos

- [x] 1. Configurar proyecto Next.js con TypeScript
  - Crear proyecto Next.js 15 con App Router
  - Configurar TypeScript con strict mode
  - Configurar Tailwind CSS con custom theme
  - Configurar ESLint y Prettier
  - Configurar path aliases (@/components, @/lib, etc.)
  - _Requisitos: 1.1, 1.2, 1.3_

- [x] 2. Configurar herramientas de desarrollo
  - Instalar y configurar React Query
  - Instalar y configurar Zustand para estado global
  - Instalar Socket.IO client
  - Instalar Axios con interceptors
  - Instalar React Hook Form y Zod
  - Instalar Framer Motion para animaciones
  - _Requisitos: 1.4, 1.5_

- [x] 3. Configurar sistema de diseño base
  - Definir variables CSS para colores (tema claro y oscuro)
  - Definir variables CSS para tipografía
  - Definir variables CSS para espaciado
  - Configurar breakpoints responsivos en Tailwind
  - Crear archivo de configuración de tema
  - _Requisitos: 21.1, 21.2, 21.3, 21.4_

- [x] 4. Crear estructura de carpetas
  - Crear carpeta src/app con rutas principales
  - Crear carpeta src/components con subcarpetas (ui, layout, product, cart, chat, admin)
  - Crear carpeta src/hooks para custom hooks
  - Crear carpeta src/lib para utilidades
  - Crear carpeta src/services para servicios de API
  - Crear carpeta src/store para estado global
  - Crear carpeta src/types para definiciones TypeScript
  - _Requisitos: 1.1_

## Fase 2: Componentes de UI Base

- [x] 5. Crear componentes de UI fundamentales
  - [x] 5.1 Crear componente Button
    - Implementar variantes: primary, secondary, ghost, danger
    - Implementar tamaños: sm, md, lg
    - Implementar estados: default, hover, active, disabled, loading
    - Agregar soporte para iconos
    - _Requisitos: 21.1_

  - [x] 5.2 Crear componente Input
    - Implementar variantes: text, email, password, number
    - Implementar estados: default, focus, error, disabled
    - Agregar soporte para labels flotantes
    - Agregar iconos de validación inline
    - _Requisitos: 21.1_

  - [x] 5.3 Crear componente Card
    - Implementar con bordes redondeados y sombras
    - Agregar variantes de padding
    - Implementar hover con elevación
    - _Requisitos: 21.3_

  - [x] 5.4 Crear componente Modal
    - Implementar overlay con backdrop
    - Agregar animaciones de entrada/salida
    - Implementar cierre con ESC y click fuera
    - Agregar trap de foco para accesibilidad
    - _Requisitos: 5.2, 5.3_

  - [x] 5.5 Crear componente Dropdown
    - Implementar menú desplegable
    - Agregar navegación por teclado
    - Implementar posicionamiento inteligente
    - _Requisitos: 5.2_

  - [x] 5.6 Crear componente Badge
    - Implementar variantes de color
    - Implementar tamaños
    - Agregar soporte para iconos
    - _Requisitos: 2.4_

  - [x] 5.7 Crear componente Spinner/Loader
    - Implementar animación de carga
    - Implementar tamaños
    - Agregar variante de overlay
    - _Requisitos: 3.1_

  - [x] 5.8 Crear componente Rating
    - Implementar estrellas llenas, medias y vacías
    - Agregar modo interactivo y solo lectura
    - Implementar tamaños
    - Mostrar valor numérico opcional
    - _Requisitos: 7.1, 8.1_

- [x] 6. Crear componentes de navegación y layout
  - [x] 6.1 Crear componente Breadcrumbs
    - Implementar navegación jerárquica
    - Agregar separadores personalizables
    - Implementar truncado para rutas largas
    - Hacer responsive (solo último item en móvil)
    - _Requisitos: 8.1_

  - [x] 6.2 Crear componente Pagination
    - Implementar botones de navegación
    - Agregar números de página con ellipsis
    - Mostrar "Página X de Y"
    - Deshabilitar botones en límites
    - _Requisitos: 7.1_

  - [x] 6.3 Crear componente Tabs
    - Implementar navegación por pestañas
    - Agregar indicador de tab activo
    - Implementar navegación por teclado
    - _Requisitos: 8.1_

  - [x] 6.4 Crear componente Skeleton Loader
    - Implementar ProductCardSkeleton
    - Implementar ProductDetailSkeleton
    - Implementar DashboardSkeleton
    - Agregar animación shimmer
    - _Requisitos: 3.1_

## Fase 3: Sistema de Autenticación

- [x] 7. Implementar servicio de autenticación
  - Crear servicio AuthService con métodos: login, logout, register, refreshToken, forgotPassword, validateResetToken, resetPassword, oauthLogin, oauthCallback, setPassword, linkAuthMethod, unlinkAuthMethod
  - Configurar Axios con withCredentials para cookies httpOnly
  - Implementar interceptor para refresh token automático
  - Crear tipos TypeScript para User, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData, OAuthProvider, AuthMethod, UserAuthMethods
  - Implementar manejo de errores específicos de autenticación
  - Agregar rate limiting en cliente (tracking de intentos)
  - Implementar lógica de OAuth 2.0 con state y PKCE
  - _Requisitos: 20.1, 20.2, 20.3, 20.4, 20.8, 20.9, 20.10, 23.1, 23.2, 23.4, 23.5, 23.10, 24.1, 24.2_

- [x] 8. Crear hook useAuth
  - Implementar hook con React Query para gestión de estado de autenticación
  - Agregar métodos: login, logout, register, checkAuth
  - Implementar caché de usuario autenticado
  - Manejar estados: loading, authenticated, unauthenticated
  - _Requisitos: 20.1_

- [ ] 9. Crear componentes de autenticación
  - [x] 9.1 Crear layout compartido para páginas de autenticación
    - Crear componente AuthLayout con diseño centrado
    - Implementar AuthCard con logo, título y subtítulo
    - Agregar fondo con gradiente o imagen de tecnología
    - Implementar diseño responsive
    - _Requisitos: 20.6, 21.5_

  - [x] 9.2 Crear componente PasswordStrengthIndicator
    - Implementar barra de progreso con colores (rojo/amarillo/verde)
    - Crear lista de requisitos con checkmarks dinámicos
    - Validar: 8+ caracteres, mayúscula, minúscula, número, especial
    - Calcular nivel de fortaleza: Débil, Media, Fuerte

    - _Requisitos: 20.7_

  - [x] 9.3 Crear página de Login
    - Implementar formulario con React Hook Form y Zod
    - Agregar input de email con validación
    - Agregar input de password con toggle show/hide
    - Implementar checkbox "Recordarme"
    - Agregar link "¿Olvidaste tu contraseña?"
    - Implementar botón "Iniciar Sesión" con loading state
    - Agregar link "¿No tienes cuenta? Regístrate"
    - Implementar mensajes de error claros
    - _Requisitos: 20.1, 20.6_

  - [x] 9.4 Crear página de Register
    - Implementar formulario de registro con validación
    - Agregar inputs: nombre, apellido, email
    - Implementar input de password con PasswordStrengthIndicator
    - Agregar input de confirmar password con validación en tiempo real
    - Implementar checkbox "Acepto términos y condiciones" (obligatorio)
    - Agregar botón "Crear Cuenta" con loading state
    - Implementar link "¿Ya tienes cuenta? Inicia sesión"
    - Validar que passwords coincidan
    - _Requisitos: 20.1, 20.6, 20.7_

  - [x] 9.5 Crear sistema de recuperación de contraseña
    - [x] 9.5.1 Crear página Forgot Password (Paso 1)
      - Implementar formulario con input de email
      - Agregar validación de formato de email
      - Implementar botón "Enviar instrucciones"
      - Agregar link "Volver al inicio de sesión"
      - Mostrar mensaje de éxito después de enviar
      - Integrar con endpoint POST /api/auth/forgot-password
      - _Requisitos: 23.1, 23.2, 23.3_

    - [x] 9.5.2 Crear página Reset Password (Paso 2)
      - Extraer token de URL query params
      - Validar token al cargar página (GET /api/auth/validate-reset-token)
      - Mostrar formulario si token es válido
      - Mostrar error y botón "Solicitar nuevo link" si token inválido/expirado
      - Implementar input de nueva password con PasswordStrengthIndicator
      - Agregar input de confirmar password

      - Validar que passwords coincidan
      - Implementar botón "Restablecer contraseña"
      - Integrar con endpoint POST /api/auth/reset-password
      - _Requisitos: 23.4, 23.5, 23.6, 23.7, 23.9_

    - [x] 9.5.3 Implementar confirmación y redirección (Paso 3)
      - Mostrar modal o página de confirmación de éxito
      - Implementar auto-redirección a login después de 3 segundos
      - Mostrar toast en login: "Contraseña actualizada"
      - _Requisitos: 23.8_

    - [x] 9.5.4 Implementar manejo de errores de autenticación
      - Crear diccionario de mensajes de error
      - Implementar componente ErrorMessage
      - Mostrar errores debajo del campo correspondiente
      - Agregar iconos de alerta
      - _Requisitos: 23.9_

  - [x] 9.6 Implementar validación de seguridad de contraseñas
    - Crear schema de Zod para validación de contraseña
    - Validar: mínimo 8 caracteres, mayúscula, minúscula, número, especial
    - Implementar lista de contraseñas comunes prohibidas
    - Agregar validación de coincidencia de passwords
    - _Requisitos: 20.7, 23.6_

  - [x] 9.7 Crear componente ProtectedRoute
    - Implementar verificación de autenticación
    - Redirigir a login si no autenticado
    - Mostrar spinner mientras verifica
    - _Requisitos: 20.5_

  - [x] 9.8 Crear componente AdminRoute
    - Implementar verificación de rol de admin
    - Redirigir a unauthorized si no es admin
    - _Requisitos: 20.5_

  - [x] 9.9 Implementar rate limiting en frontend




    - Agregar contador de intentos fallidos de login
    - Mostrar mensaje después de 5 intentos: "Demasiados intentos. Intenta en 15 minutos"
    - Implementar cooldown visual con countdown timer
    - Limitar solicitudes de recuperación de contraseña
    - _Requisitos: 23.10_

  - [ ] 9.10 Implementar autenticación OAuth
    - [ ] 9.10.1 Crear configuración de proveedores OAuth
      - Configurar Google OAuth (clientId, redirectUri, scope)
      - Configurar GitHub OAuth (clientId, redirectUri, scope)
      - Crear variables de entorno para credenciales
      - Implementar generación de state y PKCE
      - _Requisitos: 20.8, 24.1, 24.2_

    - [ ] 9.10.2 Crear componente SocialLoginButtons
      - Implementar botón "Continuar con Google" con logo
      - Implementar botón "Continuar con GitHub" con logo
      - Agregar loading state durante OAuth
      - Implementar onClick que inicia flujo OAuth
      - _Requisitos: 24.1_

    - [ ] 9.10.3 Implementar flujo de OAuth en Login y Registro
      - Agregar SocialLoginButtons en página de Login
      - Agregar SocialLoginButtons en página de Registro
      - Implementar divider "o" entre métodos
      - Redirigir a URL de autorización del proveedor
      - _Requisitos: 24.1, 24.2_

    - [ ] 9.10.4 Crear páginas de callback de OAuth
      - Crear página /auth/callback/google
      - Crear página /auth/callback/github
      - Extraer code y state de URL query params
      - Validar state contra sessionStorage
      - Enviar code al backend (POST /api/auth/oauth/callback)
      - Mostrar spinner durante procesamiento
      - Redirigir a dashboard si éxito
      - Redirigir a login con error si falla
      - Manejar caso de usuario canceló autorización
      - _Requisitos: 24.2, 24.3_

    - [ ] 9.10.5 Implementar manejo de conflictos de email
      - Detectar cuando email de OAuth ya existe
      - Mostrar mensaje: "Este email ya está registrado. Inicia sesión para vincular."
      - Redirigir a login con mensaje informativo
      - Permitir vincular después de autenticarse
      - _Requisitos: 24.4_

  - [ ] 9.11 Implementar establecimiento de contraseña para usuarios OAuth
    - [ ] 9.11.1 Modificar flujo de "Olvidé mi contraseña"
      - Detectar si usuario no tiene contraseña (solo OAuth)
      - Mostrar mensaje: "Tu cuenta usa {Provider}. ¿Quieres establecer una contraseña?"
      - Botón "Establecer Contraseña"
      - Usar mismo flujo de recuperación (enviar email con token)
      - _Requisitos: 23.11, 24.6_

    - [ ] 9.11.2 Crear modal de establecer contraseña en Dashboard
      - Implementar modal SetPasswordModal
      - Input de nueva contraseña con PasswordStrengthIndicator
      - Input de confirmar contraseña
      - Botón "Establecer Contraseña"
      - Validar y enviar a POST /api/auth/set-password
      - Mostrar confirmación de éxito
      - _Requisitos: 24.6, 24.10_

## Fase 4: Layout Principal y Navegación

- [ ] 10. Crear Header component
  - Implementar logo con link a home
  - Agregar barra de búsqueda global (placeholder, implementar después)
  - Crear navegación principal: Categorías, Ofertas, Soporte
  - Agregar iconos: Usuario, Carrito (con contador), Notificaciones
  - Implementar sticky header en scroll
  - Hacer responsive con hamburger menu en móvil
  - _Requisitos: 4.1, 17.1_

- [ ] 11. Crear Footer component
  - Implementar columnas: Empresa, Ayuda, Legal, Redes Sociales
  - Agregar formulario de newsletter signup
  - Mostrar métodos de pago aceptados
  - Agregar copyright y enlaces legales
  - _Requisitos: 4.1_

- [ ] 12. Crear Sidebar Navigation (móvil)
  - Implementar menú hamburger con animación slide-in
  - Agregar navegación por categorías
  - Incluir enlaces rápidos a cuenta y pedidos
  - Implementar overlay con cierre al hacer clic fuera
  - _Requisitos: 4.2, 4.4_

- [ ] 13. Crear layout principal (RootLayout)
  - Integrar Header, Footer y Sidebar
  - Configurar providers: React Query, Auth, Theme
  - Implementar sistema de notificaciones global
  - Agregar ChatWidget flotante
  - _Requisitos: 4.1, 4.2_

## Fase 5: Sistema de Notificaciones

- [ ] 14. Crear sistema de notificaciones Toast
  - Crear componente Toast con variantes: success, error, warning, info
  - Implementar NotificationProvider con contexto
  - Crear hook useNotification para mostrar notificaciones
  - Implementar queue de notificaciones (máximo 3 visibles)
  - Agregar animaciones de entrada/salida
  - Implementar auto-close con barra de progreso
  - _Requisitos: 19.1, 19.2, 19.3, 19.4, 19.5_

## Fase 6: Búsqueda Global

- [ ] 15. Implementar búsqueda global rápida
  - Crear servicio SearchService con endpoint GET /api/products/search
  - Crear componente GlobalSearch con input y dropdown
  - Implementar autocompletado con debounce de 300ms
  - Agrupar resultados por tipo: productos, categorías, marcas
  - Implementar navegación por teclado (↑↓ Enter)
  - Agregar highlight de términos coincidentes
  - Implementar shortcut Ctrl+K / Cmd+K
  - Limitar a 10 resultados (3 productos, 3 categorías, 4 marcas)
  - _Requisitos: 17.1, 17.2, 17.3, 17.4, 17.5_
  - **NOTA**: NO usar NLPEngine aquí, solo búsqueda directa rápida

## Fase 7: Gestión de Productos

- [ ] 16. Crear servicios de productos
  - Crear ProductService con métodos: getProducts, getProduct, searchProducts
  - Crear CategoryService con métodos: getCategories, getCategory
  - Implementar tipos TypeScript: Product, Category, ProductFilters
  - Configurar React Query hooks: useProducts, useProduct, useCategories
  - _Requisitos: 22.1_

- [ ] 17. Crear componente ProductCard
  - Implementar imagen con aspect ratio 1:1
  - Agregar badge de descuento si aplica
  - Mostrar nombre (2 líneas max con ellipsis)
  - Agregar Rating con número de reviews
  - Mostrar precio (tachado si hay descuento + precio final)
  - Agregar botón "Agregar al carrito"
  - Implementar icono de "Quick View" en hover
  - Agregar animación de hover
  - _Requisitos: 7.1, 7.2_

- [ ] 18. Crear página de Catálogo de Productos
  - [ ] 18.1 Crear Sidebar de Filtros
    - Implementar filtros por categorías (checkboxes con contador)
    - Agregar filtros por marcas (checkboxes con búsqueda)
    - Implementar slider dual para rango de precio
    - Agregar filtros por especificaciones técnicas (acordeón)
    - Implementar toggle "Solo en stock"
    - Agregar botones "Aplicar Filtros" y "Limpiar Todo"
    - _Requisitos: 7.1, 7.2_

  - [ ] 18.2 Crear Grid de Productos
    - Implementar grid responsivo (4-3-2-1 columnas)
    - Agregar ProductCard para cada producto
    - Implementar skeleton loading
    - Agregar paginación o scroll infinito
    - _Requisitos: 7.1, 7.2, 7.5_

  - [ ] 18.3 Crear Toolbar de Catálogo
    - Mostrar contador de productos
    - Agregar selector de ordenamiento
    - Implementar toggle de vista (grid/list)
    - Agregar botón de filtros para móvil
    - _Requisitos: 7.1, 7.3_

  - [ ] 18.4 Integrar filtros con URL query params
    - Sincronizar filtros con URL
    - Implementar navegación con historial del navegador
    - Permitir compartir URLs con filtros aplicados
    - _Requisitos: 7.3_

- [ ] 19. Crear página de Detalle de Producto
  - [ ] 19.1 Crear Galería de Imágenes
    - Implementar imagen principal grande con zoom
    - Agregar thumbnails con scroll horizontal
    - Implementar lightbox con navegación
    - Agregar indicador de imagen actual
    - Implementar lazy loading
    - _Requisitos: 8.1, 8.4_

  - [ ] 19.2 Crear sección de información principal
    - Mostrar nombre, marca, SKU
    - Agregar rating con reviews
    - Mostrar precio con descuento si aplica
    - Indicar disponibilidad en stock
    - Agregar selector de cantidad
    - Implementar botones "Agregar al Carrito" y "Comprar Ahora"
    - _Requisitos: 8.1, 8.5_

  - [ ] 19.3 Crear Comparador de Precios
    - Implementar tabla expandible/colapsable
    - Mostrar proveedores: Amazon, AliExpress, etc.
    - Incluir columnas: Proveedor, Precio, Envío, Total, Entrega
    - Highlight del mejor precio
    - Agregar badge "Mejor oferta"
    - _Requisitos: 8.1, 8.2_

  - [ ] 19.4 Crear Tabs de contenido
    - Implementar tab de Descripción
    - Crear tab de Especificaciones Técnicas (tabla)
    - Agregar tab de Reviews
    - _Requisitos: 8.1_

  - [ ] 19.5 Crear sección de Preguntas y Respuestas
    - Integrar ChatWidget embebido (no flotante)
    - Pre-cargar contexto con producto actual
    - Agregar botón "Hacer una pregunta"
    - _Requisitos: 8.1, 8.3_

  - [ ] 19.6 Agregar sección de Productos Relacionados
    - Mostrar grid de 4 productos relacionados
    - Usar ProductCard component
    - _Requisitos: 8.1_

## Fase 8: Carrito de Compras

- [ ] 20. Crear servicio de carrito
  - Crear CartService con métodos: getCart, addItem, updateQuantity, removeItem, clearCart
  - Implementar tipos TypeScript: Cart, CartItem
  - Configurar React Query hooks: useCart, useAddToCart, useUpdateCart
  - Implementar persistencia en localStorage
  - _Requisitos: 9.1, 9.4_

- [ ] 21. Crear componente CartItem
  - Mostrar imagen del producto (100x100px)
  - Agregar nombre con link a detalle
  - Mostrar SKU y marca
  - Implementar selector de cantidad (- [input] +)
  - Mostrar precio unitario y subtotal
  - Agregar botón eliminar
  - Implementar animación al agregar/eliminar
  - _Requisitos: 9.1, 9.2_

- [ ] 22. Crear página de Carrito de Compras
  - [ ] 22.1 Crear lista de productos del carrito
    - Implementar layout de 70% lista + 30% resumen
    - Agregar CartItem para cada producto
    - Mostrar mensaje si carrito está vacío
    - Agregar botón "Limpiar Carrito"
    - _Requisitos: 9.1, 9.2_

  - [ ] 22.2 Crear resumen del carrito
    - Mostrar desglose: Subtotal, Envío, Impuestos, Total
    - Agregar input para código de descuento
    - Implementar estimación de envío
    - Agregar botones "Continuar Comprando" y "Proceder al Checkout"
    - Mostrar badges de seguridad
    - _Requisitos: 9.3, 9.5_

  - [ ] 22.3 Implementar cálculo en tiempo real
    - Actualizar totales al cambiar cantidades
    - Calcular impuestos basado en ubicación
    - Estimar costo de envío
    - _Requisitos: 9.3_

## Fase 9: Proceso de Checkout

- [ ] 23. Crear servicio de checkout
  - Crear CheckoutService con métodos: createOrder, processPayment
  - Crear PaymentService con integración de Stripe/PayPal
  - Implementar tipos TypeScript: Order, OrderItem, PaymentMethod
  - _Requisitos: 10.1, 10.3, 22.3_

- [ ] 24. Crear página de Checkout multi-paso
  - [ ] 24.1 Implementar navegación de pasos
    - Crear indicador de progreso: ① Envío → ② Pago → ③ Revisión
    - Implementar navegación entre pasos
    - Validar cada paso antes de avanzar
    - _Requisitos: 10.1_

  - [ ] 24.2 Crear Paso 1: Información de Envío
    - Implementar formulario con React Hook Form
    - Agregar validación con Zod
    - Implementar autocompletado de dirección (Google Places API)
    - Agregar opción de usar dirección guardada
    - Implementar checkbox "Usar como dirección de facturación"
    - Mostrar estimación de tiempo de entrega
    - _Requisitos: 10.1, 10.2_

  - [ ] 24.3 Crear Paso 2: Método de Pago
    - Implementar formulario de tarjeta de crédito
    - Agregar validación de número de tarjeta (Luhn algorithm)
    - Implementar campos enmascarados (CVV, número)
    - Agregar iconos de tarjetas aceptadas
    - Implementar integración con Stripe/PayPal
    - Agregar opción de guardar tarjeta
    - Mostrar badges de seguridad (SSL, PCI DSS)
    - _Requisitos: 10.1, 10.2, 22.3_

  - [ ] 24.4 Crear Paso 3: Revisión Final
    - Mostrar resumen de productos
    - Mostrar dirección de envío (editable)
    - Mostrar método de pago (editable)
    - Mostrar desglose de costos
    - Agregar checkbox de términos y condiciones
    - Implementar botón "Confirmar Pedido"
    - Agregar indicador de procesamiento
    - _Requisitos: 10.1, 10.4_

  - [ ] 24.5 Crear Paso 4: Confirmación
    - Mostrar icono de éxito animado
    - Mostrar número de pedido
    - Mostrar fecha estimada de entrega
    - Agregar botones "Ver detalles" y "Seguir comprando"
    - Enviar confirmación por email
    - _Requisitos: 10.1_

- [ ] 25. Implementar resumen lateral del pedido
  - Mostrar productos del carrito
  - Mostrar subtotal, envío, impuestos, total
  - Mantener visible en todos los pasos
  - _Requisitos: 10.1_

## Fase 10: ChatWidget con Streaming

- [ ] 26. Crear servicio de chat
  - Configurar Socket.IO client
  - Crear ChatService con métodos: createSession, sendMessage, connectSocket
  - Implementar tipos TypeScript: ChatSession, ChatMessage, ChatContext
  - Configurar eventos Socket.IO: bot_typing, chat_stream_chunk, chat_stream_end, chat_stream_error
  - _Requisitos: 2.1, 2.2_

- [ ] 27. Crear componente ChatWidget
  - [ ] 27.1 Crear botón flotante
    - Implementar botón circular con icono de chat
    - Posicionar fixed bottom-right (20px desde bordes)
    - Agregar badge de notificación
    - Implementar animación de pulso sutil
    - _Requisitos: 2.5_

  - [ ] 27.2 Crear ventana de chat expandida
    - Implementar tamaño: 400x600px (desktop), full screen (móvil)
    - Crear header con título, estado de conexión, botones minimizar/cerrar
    - Implementar body con lista de mensajes y scroll automático
    - Crear footer con input de texto y botón enviar
    - _Requisitos: 2.5_

  - [ ] 27.3 Implementar indicadores visuales
    - Crear typing indicator (tres puntos animados)
    - Implementar streaming de texto con cursor parpadeante
    - Agregar badge "Modo Básico" cuando usingFallback es true
    - Implementar indicador de estado de conexión (verde/amarillo/rojo)
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

  - [ ] 27.4 Integrar Socket.IO
    - Conectar al servidor de chatbot al abrir widget
    - Escuchar evento bot_typing para mostrar indicador
    - Escuchar evento chat_stream_chunk para mostrar texto progresivamente
    - Escuchar evento chat_stream_end para finalizar mensaje
    - Manejar evento chat_stream_error
    - Emitir evento chat_message_stream al enviar mensaje
    - _Requisitos: 2.1, 2.2, 2.3_

  - [ ] 27.5 Implementar productos recomendados en chat
    - Mostrar cards compactas cuando el bot menciona productos
    - Cada card: Imagen, nombre, precio, botón "Ver detalles"
    - Implementar scroll horizontal si hay más de 3 productos
    - _Requisitos: 2.2_

  - [ ] 27.6 Implementar reconexión automática
    - Detectar desconexión de Socket.IO
    - Intentar reconexión automática
    - Mostrar estado de reconexión al usuario
    - _Requisitos: 2.1_

## Fase 11: Página de Inicio

- [ ] 28. Crear Hero Section
  - Implementar full width con altura 500px (desktop), 400px (móvil)
  - Agregar imagen de fondo con overlay oscuro
  - Mostrar título, subtítulo y CTA prominente
  - Implementar animación fade-in al cargar
  - _Requisitos: 6.1_

- [ ] 29. Crear Product Recommender Widget
  - Integrar con Product_Recommender service
  - Mostrar grid de productos (4 columnas desktop, 2 móvil)
  - Usar ProductCard component
  - Implementar skeleton loading
  - Agregar título "Recomendado para ti"
  - _Requisitos: 6.2, 22.5_

- [ ] 30. Crear sección de Categorías Destacadas
  - Implementar grid de 6 categorías (3x2 desktop, 2x3 móvil)
  - Crear CategoryCard con imagen de fondo y overlay
  - Agregar hover con zoom sutil
  - Mostrar contador de productos por categoría
  - _Requisitos: 6.1_

- [ ] 31. Crear sección de Ofertas del Día
  - Mostrar productos con mejor descuento
  - Usar ProductCard component
  - Agregar countdown timer si aplica
  - _Requisitos: 6.1_

- [ ] 32. Ensamblar Home Page completa
  - Integrar todas las secciones en orden
  - Agregar sección de Newsletter Signup
  - Implementar lazy loading de secciones
  - Optimizar para Core Web Vitals
  - _Requisitos: 6.1, 6.5_

## Fase 12: Dashboard de Usuario

- [ ] 33. Crear layout del Dashboard de Usuario
  - Implementar sidebar de navegación (20% ancho)
  - Crear área de contenido principal (80% ancho)
  - Hacer responsive (sidebar colapsable en móvil)
  - _Requisitos: 11.1_

- [ ] 34. Crear Sidebar de Navegación
  - Implementar lista de navegación con iconos
  - Agregar badges para notificaciones
  - Highlight del item activo
  - Implementar navegación con Next.js Link
  - Secciones: Resumen, Pedidos, Seguimiento, Lista de Deseos, Perfil, Direcciones, Métodos de Pago, Notificaciones, Soporte
  - _Requisitos: 11.1_

- [ ] 35. Crear vista de Resumen (Overview)
  - [ ] 35.1 Crear tarjeta de Bienvenida
    - Mostrar saludo personalizado
    - Mostrar fecha de registro
    - Agregar nivel de usuario si aplica
    - _Requisitos: 11.1, 11.2_

  - [ ] 35.2 Crear tarjeta de Pedidos Recientes
    - Mostrar últimos 3 pedidos
    - Mostrar estado de cada pedido
    - Agregar link "Ver todos los pedidos"
    - _Requisitos: 11.2_

  - [ ] 35.3 Crear tarjeta de Estadísticas
    - Mostrar total gastado este año
    - Mostrar número de pedidos completados
    - Mostrar productos en lista de deseos
    - Agregar mini gráfico de gastos mensuales
    - _Requisitos: 11.5_

  - [ ] 35.4 Crear tarjeta de Recomendaciones
    - Integrar con Product_Recommender
    - Mostrar 4 productos recomendados
    - Usar ProductCard component
    - _Requisitos: 11.1_

  - [ ] 35.5 Crear tarjeta de Notificaciones
    - Mostrar últimas 5 notificaciones
    - Agregar link "Ver todas"
    - _Requisitos: 11.3_

  - [ ] 35.6 Crear tarjeta de Acciones Rápidas
    - Agregar botones: "Rastrear pedido", "Contactar soporte", "Ver ofertas"
    - _Requisitos: 11.4_

- [ ] 36. Crear vista de Mis Pedidos
  - Implementar filtros: Estado, Rango de fechas, Búsqueda
  - Crear tabla/lista de pedidos
  - Mostrar: Número, Fecha, Estado (badge), Total, Productos (thumbnails)
  - Agregar acciones: Ver detalles, Rastrear, Descargar factura
  - Implementar paginación
  - _Requisitos: 13.1, 13.2, 13.3, 13.5_

- [ ] 37. Crear vista de Seguimiento de Pedidos
  - [ ] 37.1 Crear componente OrderTimeline
    - Implementar timeline vertical con iconos
    - Mostrar estados: Confirmado, Procesando, Enviado, En reparto, Entregado
    - Diferenciar estados completados (círculo lleno) y pendientes (círculo vacío)
    - Agregar animación al actualizar estado
    - _Requisitos: 12.1, 12.2_

  - [ ] 37.2 Integrar con Shipment_Tracker
    - Consumir datos del servicio de seguimiento
    - Mostrar tracking_number del proveedor
    - Agregar link para rastrear en sitio del carrier
    - Implementar actualización automática cada 30 segundos
    - _Requisitos: 12.2, 12.4_

  - [ ] 37.3 Mostrar información del pedido
    - Mostrar número de pedido y estado actual
    - Mostrar fecha estimada de entrega prominente
    - Mostrar dirección de envío
    - _Requisitos: 12.1, 12.3_

  - [ ] 37.4 Implementar notificaciones de cambio de estado
    - Enviar notificación cuando el estado cambie
    - Integrar con sistema de notificaciones
    - _Requisitos: 12.5_

- [ ] 38. Crear vista de Historial de Pedidos
  - Reutilizar componente de Mis Pedidos
  - Agregar filtros adicionales
  - Implementar botón "Reordenar" para pedidos anteriores
  - Agregar acceso rápido a facturas
  - _Requisitos: 13.1, 13.2, 13.3, 13.4_

- [ ] 39. Crear vista de Gestión de Perfil
  - [ ] 39.1 Crear sección de Información Personal
    - Implementar formulario editable
    - Agregar upload de avatar
    - Implementar validación
    - Agregar botón "Guardar cambios"
    - _Requisitos: 14.1_

  - [ ] 39.2 Crear sección de Seguridad
    - Implementar formulario de cambio de contraseña
    - Agregar opción de autenticación de dos factores (2FA)
    - Mostrar sesiones activas
    - _Requisitos: 14.2_

  - [ ] 39.3 Crear sección de Preferencias
    - Agregar selector de idioma
    - Agregar selector de moneda
    - Implementar toggles para notificaciones por email
    - Agregar toggle para newsletter
    - _Requisitos: 14.3_

  - [ ] 39.4 Crear sección de Privacidad
    - Agregar botón "Descargar mis datos" (GDPR)
    - Implementar botón "Eliminar cuenta" con confirmación
    - _Requisitos: 14.4, 14.5_

  - [ ] 39.5 Crear sección de Métodos de Inicio de Sesión
    - [ ] 39.5.1 Crear componente AuthMethodsManagement
      - Mostrar lista de métodos de autenticación disponibles
      - Indicar métodos vinculados (✓) y no vinculados (○)
      - Mostrar fecha de vinculación para métodos activos
      - Mostrar última vez usado (opcional)
      - _Requisitos: 24.5, 24.7_

    - [ ] 39.5.2 Implementar vinculación de métodos OAuth
      - Botón "Vincular Google" si no está vinculado
      - Botón "Vincular GitHub" si no está vinculado
      - Iniciar flujo OAuth al hacer clic
      - Después de OAuth exitoso, actualizar lista de métodos
      - Mostrar confirmación: "✓ {Provider} vinculado exitosamente"
      - _Requisitos: 24.7, 24.8_

    - [ ] 39.5.3 Implementar desvinculación de métodos
      - Botón "Desvincular" para cada método vinculado
      - Modal de confirmación antes de desvincular
      - Validar que no sea el único método activo
      - Mostrar advertencia si intenta desvincular único método
      - Enviar DELETE /api/auth/unlink-method
      - Actualizar lista después de desvincular
      - _Requisitos: 24.8, 24.9_

    - [ ] 39.5.4 Implementar gestión de contraseña local
      - Mostrar "Contraseña" en lista de métodos
      - Si tiene contraseña: Botón "Cambiar Contraseña"
      - Si NO tiene contraseña: Botón "Establecer Contraseña"
      - Abrir modal SetPasswordModal al hacer clic
      - Actualizar lista después de establecer contraseña
      - _Requisitos: 24.6, 24.7, 24.10_

    - [ ] 39.5.5 Implementar indicadores visuales
      - Iconos de proveedores (Google, GitHub)
      - Checkmarks para métodos vinculados
      - Badges de "Recomendado" para múltiples métodos
      - Tooltip explicativo: "Tener múltiples métodos aumenta la seguridad"
      - _Requisitos: 24.7_

- [ ] 40. Crear vista de Gestión de Direcciones
  - Mostrar lista de direcciones guardadas
  - Implementar formulario para agregar/editar dirección
  - Agregar opción de marcar como predeterminada
  - Implementar botón eliminar con confirmación
  - _Requisitos: 14.1_

## Fase 13: Dashboard de Administración

- [ ] 41. Crear layout del Dashboard de Administración
  - Implementar sidebar de navegación similar al de usuario
  - Proteger con AdminRoute
  - Crear área de contenido principal
  - _Requisitos: 15.5_

- [ ] 42. Crear Sidebar de Navegación Admin
  - Implementar lista de navegación con iconos
  - Secciones: Resumen General, Analíticas, Productos, Pedidos, Clientes, Tickets, Servicios de IA, Automatización, Configuración
  - Agregar badges para tickets pendientes
  - _Requisitos: 15.5_

- [ ] 43. Crear servicio de Monitoreo Unificado
  - Crear AdminService con métodos para obtener métricas
  - Implementar endpoints: getChatbotMetrics, getRecommenderMetrics, getAutomationMetrics, getSystemMetrics
  - Configurar React Query hooks con polling cada 30 segundos
  - _Requisitos: 15.1, 15.2, 15.3, 15.4_
  - **NOTA**: Requiere implementación de servicio de Monitoreo Unificado en backend

- [ ] 44. Crear vista de Resumen General
  - [ ] 44.1 Crear tarjetas de KPIs
    - Implementar tarjeta de Ventas del Día
    - Crear tarjeta de Pedidos Activos
    - Implementar tarjeta de Margen de Beneficio
    - Crear tarjeta de Tickets Abiertos
    - Agregar comparación con período anterior
    - Agregar mini gráficos de tendencia
    - _Requisitos: 15.1_

  - [ ] 44.2 Crear gráficos de analíticas
    - Implementar gráfico de Ventas por Día (últimos 30 días)
    - Crear gráfico de Productos Más Vendidos (top 10)
    - Implementar gráfico de Categorías Más Populares
    - Crear embudo de Tasa de Conversión
    - Usar librería de gráficos (Chart.js o Recharts)
    - _Requisitos: 15.1_

- [ ] 45. Crear vista de Servicios de IA
  - [ ] 45.1 Crear tarjeta de monitoreo del Chatbot
    - Mostrar estado de salud (healthy/degraded/down)
    - Mostrar estado de Ollama (conectado/desconectado)
    - Indicar si modelo está cargado
    - Mostrar si está usando fallback
    - Mostrar métricas: Solicitudes, Tasa de éxito, Tiempo promedio, Uso de fallback
    - Agregar botones: Ver Logs, Reiniciar Servicio
    - _Requisitos: 15.2_

  - [ ] 45.2 Crear tarjeta de monitoreo del Recommender
    - Mostrar estado de salud
    - Mostrar métricas: Recomendaciones generadas, Tasa de clics, Conversión
    - _Requisitos: 15.2_

- [ ] 46. Crear vista de Automatización
  - [ ] 46.1 Crear tarjeta de Product Sync Engine
    - Mostrar última sincronización
    - Mostrar productos sincronizados
    - Mostrar errores de sincronización
    - Mostrar proveedores activos
    - Agregar botones: Pausar, Reanudar, Configurar
    - _Requisitos: 15.3_

  - [ ] 46.2 Crear tarjeta de Auto Purchase System
    - Mostrar compras automáticas hoy
    - Mostrar tasa de éxito
    - Mostrar pedidos pendientes
    - Mostrar errores recientes
    - _Requisitos: 15.3_

  - [ ] 46.3 Crear tarjeta de Shipment Tracker
    - Mostrar envíos rastreados
    - Mostrar actualizaciones hoy
    - Mostrar entregas completadas
    - Mostrar retrasos detectados
    - _Requisitos: 15.3_

- [ ] 47. Crear vista de Gestión de Tickets
  - [ ] 47.1 Crear lista de tickets
    - Implementar tabla con filtros: Estado, Prioridad, Categoría, Asignado a
    - Agregar búsqueda por número de ticket o cliente
    - Implementar ordenamiento por fecha y prioridad
    - Mostrar: Número, Asunto, Cliente, Estado, Prioridad, Asignado a, Fecha
    - _Requisitos: 16.1, 16.2_

  - [ ] 47.2 Crear vista de detalle del ticket
    - Mostrar información completa del ticket
    - Implementar sistema de mensajería interno
    - Agregar opciones: Cambiar estado, Cambiar prioridad, Asignar a
    - Mostrar historial completo
    - _Requisitos: 16.4_

  - [ ] 47.3 Integrar con Ticket_System
    - Consumir datos del servicio de tickets
    - Implementar actualización en tiempo real
    - _Requisitos: 16.5_

## Fase 14: Componentes Avanzados

- [ ] 48. Crear Comparador Técnico
  - Implementar modal o página completa
  - Crear tabla horizontal con scroll
  - Mostrar especificaciones técnicas en filas
  - Highlight de diferencias significativas
  - Implementar sticky header con imágenes de productos
  - Agregar botón "Agregar al carrito" por producto
  - Permitir comparar hasta 5 productos
  - Agregar opción de exportar comparación (PDF o imagen)
  - _Requisitos: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 49. Crear sistema de Wishlist (Lista de Deseos)
  - Crear WishlistService con métodos: getWishlist, addItem, removeItem
  - Implementar botón de "corazón" en ProductCard
  - Crear página de Wishlist con grid de productos
  - Agregar opción de mover a carrito
  - Implementar persistencia para usuarios autenticados
  - _Requisitos: 11.1_

- [ ] 50. Crear componente de Reviews
  - Implementar formulario para escribir review
  - Agregar selector de rating (estrellas)
  - Permitir subir imágenes
  - Mostrar lista de reviews con paginación
  - Implementar filtros por rating
  - Agregar votos útiles (helpful/not helpful)
  - _Requisitos: 8.1_

## Fase 15: Optimización y Performance

- [ ] 51. Implementar optimizaciones de Next.js
  - Configurar Static Generation para páginas estáticas
  - Implementar Server-Side Rendering para páginas dinámicas
  - Configurar Incremental Static Regeneration (ISR)
  - Implementar generateStaticParams para rutas dinámicas
  - _Requisitos: 3.2_

- [ ] 52. Optimizar imágenes
  - Usar Next.js Image component en todos los componentes
  - Configurar formatos modernos (WebP, AVIF)
  - Implementar lazy loading
  - Agregar blur placeholders
  - _Requisitos: 3.2_

- [ ] 53. Implementar code splitting
  - Usar dynamic imports para componentes pesados
  - Implementar lazy loading de rutas
  - Separar vendor bundles
  - _Requisitos: 3.2_

- [ ] 54. Optimizar data fetching
  - Configurar staleTime y cacheTime en React Query
  - Implementar prefetching de datos
  - Usar infinite queries para paginación
  - Implementar optimistic updates
  - _Requisitos: 3.4_

- [ ] 55. Implementar virtualización para listas largas
  - Usar react-window para catálogo de productos
  - Implementar virtualización en lista de pedidos
  - _Requisitos: 3.2_

- [ ] 56. Optimizar bundle size
  - Analizar bundle con @next/bundle-analyzer
  - Eliminar dependencias no utilizadas
  - Implementar tree shaking
  - Optimizar imports (importar solo lo necesario)
  - _Requisitos: 3.2_

## Fase 16: Seguridad

- [ ] 57. Implementar medidas de seguridad XSS
  - Evitar dangerouslySetInnerHTML
  - Usar DOMPurify si es necesario renderizar HTML
  - Validar y sanitizar inputs de usuario
  - _Requisitos: 20.1_

- [ ] 58. Implementar protección CSRF
  - Configurar CSRF token en requests
  - Usar SameSite cookies
  - _Requisitos: 20.1_

- [ ] 59. Configurar Content Security Policy
  - Implementar CSP headers en next.config.js
  - Configurar X-Frame-Options
  - Configurar X-Content-Type-Options
  - _Requisitos: 20.1_

- [ ] 60. Implementar validación de inputs
  - Usar Zod para validación de esquemas
  - Validar en cliente y servidor
  - Mostrar mensajes de error claros
  - _Requisitos: 20.1_

- [ ] 61. Implementar manejo seguro de datos sensibles
  - No almacenar datos sensibles en localStorage
  - Enmascarar números de tarjeta
  - No loggear información sensible
  - Usar variables de entorno para secrets
  - _Requisitos: 20.1, 20.2_

## Fase 17: Accesibilidad

- [ ] 62. Implementar navegación por teclado
  - Asegurar que todos los elementos interactivos sean accesibles por teclado
  - Implementar focus visible en todos los componentes
  - Agregar skip links
  - _Requisitos: 5.2_

- [ ] 63. Implementar etiquetas ARIA
  - Agregar roles ARIA apropiados
  - Implementar aria-label y aria-describedby
  - Agregar aria-live para contenido dinámico
  - _Requisitos: 5.3_

- [ ] 64. Asegurar contraste de colores
  - Verificar contraste mínimo 4.5:1 para texto normal
  - Verificar contraste mínimo 3:1 para texto grande
  - Usar herramientas de verificación de contraste
  - _Requisitos: 5.1_

- [ ] 65. Implementar HTML semántico
  - Usar elementos semánticos (header, nav, main, article, footer)
  - Implementar estructura de headings correcta
  - Agregar landmarks ARIA
  - _Requisitos: 5.4_

- [ ] 66. Agregar textos alternativos
  - Implementar alt text descriptivo para todas las imágenes
  - Agregar captions para videos
  - _Requisitos: 5.1_

## Fase 18: Testing

- [ ] 67. Configurar entorno de testing
  - Instalar Jest y React Testing Library
  - Configurar Playwright o Cypress para E2E
  - Instalar axe-core para tests de accesibilidad
  - Configurar coverage reports
  - _Requisitos: 3.1_

- [ ] 68. Crear tests unitarios para componentes de UI
  - Testear Button component
  - Testear Input component
  - Testear Card component
  - Testear Modal component
  - Testear Rating component
  - _Requisitos: 3.1_

- [ ] 69. Crear tests unitarios para custom hooks
  - Testear useAuth hook
  - Testear useCart hook
  - Testear useNotification hook
  - _Requisitos: 3.1_

- [ ] 70. Crear tests de integración
  - Testear flujo de agregar al carrito
  - Testear flujo de búsqueda
  - Testear flujo de filtrado de productos
  - Testear flujo de login/logout
  - _Requisitos: 3.1_

- [ ] 71. Crear tests E2E
  - Testear flujo completo de compra
  - Testear flujo de seguimiento de pedido
  - Testear interacción con chatbot
  - Testear gestión de tickets (admin)
  - _Requisitos: 3.1_

- [ ] 72. Crear tests de accesibilidad
  - Testear componentes con axe-core
  - Verificar navegación por teclado
  - Verificar contraste de colores
  - _Requisitos: 5.1, 5.2, 5.3_

- [ ] 73. Implementar tests de performance
  - Configurar Lighthouse CI
  - Medir Web Vitals (FCP, LCP, TTI, CLS, FID)
  - Establecer budgets de performance
  - _Requisitos: 3.1, 3.2_

## Fase 19: Monitoreo y Analytics

- [ ] 74. Implementar monitoreo de performance
  - Integrar Web Vitals
  - Configurar Next.js Analytics
  - Implementar reportWebVitals
  - _Requisitos: 3.1_

- [ ] 75. Implementar error tracking
  - Integrar Sentry
  - Configurar captura de errores
  - Implementar error boundaries
  - _Requisitos: 3.1_

- [ ] 76. Implementar analytics de usuario
  - Integrar Google Analytics 4
  - Implementar tracking de page views
  - Implementar tracking de eventos personalizados
  - Implementar e-commerce tracking
  - _Requisitos: 3.1_

- [ ] 77. Implementar Real User Monitoring (RUM)
  - Rastrear tiempo de carga de páginas
  - Rastrear errores de JavaScript
  - Rastrear llamadas API fallidas
  - Rastrear interacciones de usuario
  - _Requisitos: 3.1_

## Fase 20: Deployment y CI/CD

- [ ] 78. Configurar variables de entorno
  - Crear archivo .env.local para desarrollo
  - Crear archivo .env.production para producción
  - Documentar todas las variables necesarias:
    - NEXT_PUBLIC_API_URL
    - NEXT_PUBLIC_CHATBOT_URL
    - NEXT_PUBLIC_SOCKET_URL
    - NEXT_PUBLIC_APP_URL
    - NEXT_PUBLIC_GOOGLE_CLIENT_ID
    - NEXT_PUBLIC_GITHUB_CLIENT_ID
    - NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
    - NEXT_PUBLIC_SENTRY_DSN
  - _Requisitos: 22.1, 22.2, 22.3, 22.4, 22.5, 24.1_

- [ ] 79. Crear Dockerfile
  - Implementar multi-stage build
  - Optimizar capas de Docker
  - Configurar healthcheck
  - _Requisitos: 22.1_

- [ ] 80. Configurar CI/CD pipeline
  - Crear workflow de GitHub Actions
  - Implementar jobs: lint, type-check, test, build
  - Configurar deploy automático a producción
  - _Requisitos: 22.1_

- [ ] 81. Configurar Docker Compose
  - Agregar servicio frontend a docker-compose.optimized.yml
  - Configurar puerto 3011
  - Configurar variables de entorno
  - Configurar healthcheck
  - _Requisitos: 22.1_

## Fase 21: Documentación

- [ ] 82. Crear documentación técnica
  - Documentar arquitectura del frontend
  - Documentar estructura de carpetas
  - Documentar convenciones de código
  - Documentar componentes principales
  - _Requisitos: 22.1_

- [ ] 83. Crear guía de desarrollo
  - Documentar setup del entorno de desarrollo
  - Documentar comandos útiles
  - Documentar proceso de testing
  - Documentar proceso de deployment
  - _Requisitos: 22.1_

- [ ] 84. Crear documentación de componentes
  - Documentar props de cada componente
  - Agregar ejemplos de uso
  - Documentar casos de uso comunes
  - Considerar usar Storybook para documentación interactiva
  - _Requisitos: 22.1_

## Fase 22: Refinamiento y Pulido

- [ ] 85. Implementar tema oscuro
  - Crear toggle de tema en header
  - Implementar variables CSS para tema oscuro
  - Persistir preferencia de tema
  - Respetar preferencia del sistema (prefers-color-scheme)
  - _Requisitos: 21.4_

- [ ] 86. Implementar animaciones y transiciones
  - Agregar animaciones con Framer Motion
  - Implementar transiciones suaves entre páginas
  - Agregar micro-interacciones
  - Optimizar para performance (usar transform y opacity)
  - _Requisitos: 4.1_

- [ ] 87. Implementar estados de carga
  - Agregar skeleton loaders en todas las páginas
  - Implementar spinners para acciones
  - Agregar progress bars para procesos largos
  - _Requisitos: 3.1_

- [ ] 88. Implementar manejo de errores
  - Crear páginas de error: 404, 500, Offline
  - Implementar error boundaries
  - Agregar mensajes de error amigables
  - Implementar retry logic
  - _Requisitos: 3.1_

- [ ] 89. Optimizar para SEO
  - Implementar metadata en todas las páginas
  - Agregar Open Graph tags
  - Implementar structured data (JSON-LD)
  - Crear sitemap.xml
  - Crear robots.txt
  - _Requisitos: 1.2_

- [ ] 90. Realizar auditoría final
  - Ejecutar Lighthouse en todas las páginas principales
  - Verificar Core Web Vitals
  - Verificar accesibilidad WCAG 2.1 AA
  - Verificar compatibilidad cross-browser
  - Verificar responsive design en múltiples dispositivos
  - _Requisitos: 3.1, 3.2, 4.1, 4.2, 5.1_

## Notas Importantes

### Prioridades de Implementación

**Alta Prioridad (MVP):**

- Fases 1-4: Configuración, UI base, autenticación, layout
- Fases 6-9: Búsqueda, productos, carrito, checkout
- Fase 10: ChatWidget (funcionalidad core del negocio)
- Fase 11: Home page

**Media Prioridad:**

- Fases 12-13: Dashboards de usuario y admin
- Fase 14: Componentes avanzados
- Fases 15-17: Optimización, seguridad, accesibilidad

**Baja Prioridad (Post-MVP):**

- Fases 18-21: Testing comprehensivo, monitoreo, deployment, documentación
- Fase 22: Refinamiento y pulido

### Dependencias Críticas

**Backend:**

- Servicio de Monitoreo Unificado para AdminDashboard (Fase 13)
- Endpoints de API Gateway para todos los servicios
- Socket.IO server para ChatWidget (Fase 10)
- **Sistema de Recuperación de Contraseña (Fase 3):**
  - POST /api/auth/forgot-password - Generar token y enviar email
  - GET /api/auth/validate-reset-token?token=xxx - Validar token
  - POST /api/auth/reset-password - Actualizar contraseña
  - Servicio de envío de emails (SMTP configurado)
  - Almacenamiento de tokens con expiración (Redis o BD)
  - Rate limiting en endpoints de autenticación
- **Sistema de OAuth y Account Linking (Fase 3):**
  - POST /api/auth/oauth/callback - Procesar callback de OAuth (Google, GitHub)
  - GET /api/auth/methods - Obtener métodos de autenticación del usuario
  - POST /api/auth/set-password - Establecer contraseña para usuarios OAuth
  - POST /api/auth/link-method - Vincular método de autenticación
  - DELETE /api/auth/unlink-method - Desvincular método de autenticación
  - Almacenamiento de authMethods en modelo de User
  - Configuración de OAuth apps en Google Cloud Console y GitHub
  - Validación de emails verificados de proveedores OAuth

**Externas:**

- Google Places API para autocompletado de direcciones (Fase 9)
- Stripe/PayPal para procesamiento de pagos (Fase 9)
- Sentry para error tracking (Fase 19)
- Google Analytics para analytics (Fase 19)
- **OAuth Providers (Fase 3):**
  - Google OAuth 2.0 (Google Cloud Console)
  - GitHub OAuth Apps (GitHub Developer Settings)
  - Configurar redirect URIs en ambos proveedores
  - Obtener Client ID y Client Secret

### Consideraciones de Performance

- Objetivo: Todas las páginas < 2 segundos de carga
- Core Web Vitals:
  - FCP < 1.8s
  - LCP < 2.5s
  - TTI < 3.8s
  - CLS < 0.1
  - FID < 100ms

### Consideraciones de Seguridad

- Usar httpOnly cookies para tokens (NO localStorage)
- Implementar CSP headers
- Validar todos los inputs
- Sanitizar HTML si es necesario renderizarlo
- No exponer secrets en el cliente

### Consideraciones de Accesibilidad

- Cumplir con WCAG 2.1 Level AA
- Navegación completa por teclado
- Contraste mínimo 4.5:1
- Etiquetas ARIA apropiadas
- HTML semántico
