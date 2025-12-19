# Documento de Requisitos - Menú Desplegable de Perfil de Usuario

> **⚠️ IMPORTANTE**: Antes de implementar cualquier tarea, SIEMPRE leer el archivo `Header.tsx` actual completo para entender la estructura existente y no romper funcionalidades. El Header ya tiene lógica de autenticación, carrito, notificaciones y menú móvil que debe mantenerse.

## Introducción

Este documento define los requisitos para implementar un menú desplegable moderno y funcional para el perfil de usuario en el Header de TechNovaStore. El diseño se inspira en la experiencia de usuario de Google y PCComponentes, adaptado al estilo visual de la plataforma. El menú debe ser completamente responsivo y funcional en todos los dispositivos.

## Glosario

- **UserProfileDropdown**: Componente de menú desplegable que aparece al hacer clic en el avatar/icono del usuario autenticado
- **Avatar**: Imagen de perfil del usuario, puede ser la foto de Google OAuth o las iniciales del nombre
- **Secciones Colapsables**: Grupos de opciones que se pueden expandir/contraer (acordeón)
- **Header**: Componente de encabezado principal de la aplicación donde se integra el dropdown
- **OAuth**: Sistema de autenticación con proveedores externos (Google, GitHub)

## Requisitos

### Requisito 1: Avatar de Usuario Dinámico

**User Story:** Como usuario autenticado, quiero ver mi foto de perfil o mis iniciales en el header, para que pueda identificar rápidamente mi cuenta.

#### Acceptance Criteria

1. WHEN el usuario está autenticado con Google y tiene foto de perfil, THE Header SHALL mostrar la foto de perfil de Google como avatar circular
2. WHEN el usuario está autenticado pero no tiene foto de perfil, THE Header SHALL mostrar un círculo con las iniciales del nombre y apellido del usuario
3. THE Avatar SHALL tener un tamaño de 32x32 píxeles en desktop y 40x40 píxeles en móvil
4. WHEN el usuario hace hover sobre el avatar, THE Avatar SHALL mostrar un efecto visual sutil de elevación o borde
5. THE Avatar SHALL ser clickeable para abrir el menú desplegable

### Requisito 2: Cabecera del Menú Desplegable

**User Story:** Como usuario autenticado, quiero ver mi información de cuenta en la parte superior del menú, para que pueda confirmar que estoy en la cuenta correcta.

#### Acceptance Criteria

1. WHEN el menú se abre, THE UserProfileDropdown SHALL mostrar una cabecera con el avatar grande (64x64 píxeles)
2. THE Cabecera SHALL mostrar el nombre completo del usuario debajo del avatar
3. THE Cabecera SHALL mostrar el email del usuario debajo del nombre
4. THE Cabecera SHALL tener un fondo diferenciado del resto del menú para destacar la información del usuario
5. WHEN el usuario hace clic en la cabecera, THE UserProfileDropdown SHALL redirigir a la página de perfil del usuario

### Requisito 3: Sección de Pedidos y Devoluciones

**User Story:** Como comprador, quiero acceder rápidamente a mis pedidos y devoluciones desde el menú, para que pueda gestionar mis compras fácilmente.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL incluir una sección colapsable "Pedidos y Devoluciones" con icono de paquete
2. WHEN la sección está expandida, THE Sección SHALL mostrar las siguientes opciones:
   - Pedidos, devoluciones y facturas (redirige a /dashboard/usuario/pedidos)
   - Pedidos cancelados (redirige a /dashboard/usuario/pedidos?estado=cancelado)
   - Historial de devoluciones (redirige a /dashboard/usuario/devoluciones)
3. WHEN el usuario hace clic en una opción, THE UserProfileDropdown SHALL cerrar el menú y navegar a la ruta correspondiente
4. THE Sección SHALL estar expandida por defecto al abrir el menú

### Requisito 4: Sección Mi Cuenta

**User Story:** Como usuario registrado, quiero acceder a todas las opciones de mi cuenta desde un solo lugar, para que pueda gestionar mi información personal.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL incluir una sección colapsable "Mi Cuenta" con icono de usuario
2. WHEN la sección está expandida, THE Sección SHALL mostrar las siguientes opciones:
   - Mis datos (redirige a /dashboard/usuario/perfil)
   - Mis direcciones (redirige a /dashboard/usuario/direcciones)
   - Mis suscripciones (redirige a /dashboard/usuario/suscripciones)
   - Mis documentos (redirige a /dashboard/usuario/documentos)
   - Lista de deseos (redirige a /dashboard/usuario/lista-deseos)
   - Mis configuraciones (redirige a /dashboard/usuario/configuracion)
   - Mensajes (redirige a /dashboard/usuario/mensajes)
   - Opiniones (redirige a /dashboard/usuario/opiniones)
3. WHEN el usuario hace clic en una opción, THE UserProfileDropdown SHALL cerrar el menú y navegar a la ruta correspondiente

### Requisito 5: Sección de Pago

**User Story:** Como comprador frecuente, quiero gestionar mis métodos de pago rápidamente, para que pueda actualizar mis tarjetas sin buscar en el dashboard.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL incluir una sección colapsable "Pago" con icono de tarjeta de crédito
2. WHEN la sección está expandida, THE Sección SHALL mostrar las siguientes opciones:
   - Métodos de pago (redirige a /dashboard/usuario/metodos-pago)
   - Historial de pagos (redirige a /dashboard/usuario/historial-pagos)
3. WHEN el usuario hace clic en una opción, THE UserProfileDropdown SHALL cerrar el menú y navegar a la ruta correspondiente

### Requisito 6: Sección de Ayuda y Soporte

**User Story:** Como usuario, quiero acceder fácilmente a la ayuda y soporte desde el menú, para que pueda resolver mis dudas rápidamente.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL incluir una sección colapsable "¿Necesitas ayuda?" con icono de interrogación
2. WHEN la sección está expandida, THE Sección SHALL mostrar las siguientes opciones:
   - Centro de ayuda (redirige a /soporte)
   - Mis tickets (redirige a /dashboard/usuario/tickets)
   - Contactar soporte (abre el ChatWidget)
   - Preguntas frecuentes (redirige a /faq)
3. WHEN el usuario hace clic en "Contactar soporte", THE UserProfileDropdown SHALL cerrar el menú y abrir el ChatWidget

### Requisito 7: Acciones Rápidas

**User Story:** Como usuario, quiero tener acceso rápido a acciones comunes sin navegar por secciones, para que pueda realizar tareas frecuentes más rápido.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL incluir una sección de acciones rápidas sin colapsable al final del menú
2. THE Sección de acciones rápidas SHALL incluir:
   - Rastrear pedido (redirige a /seguimiento)
   - Notificaciones (redirige a /notificaciones) con badge de contador si hay no leídas
3. THE Sección SHALL estar separada visualmente del resto con un borde superior

### Requisito 8: Botón de Cerrar Sesión

**User Story:** Como usuario autenticado, quiero poder cerrar sesión fácilmente, para que pueda proteger mi cuenta cuando uso dispositivos compartidos.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL incluir un botón "Cerrar sesión" al final del menú
2. THE Botón SHALL tener un icono de salida y estar destacado visualmente
3. WHEN el usuario hace clic en "Cerrar sesión", THE Sistema SHALL cerrar la sesión del usuario
4. WHEN la sesión se cierra, THE Sistema SHALL redirigir al usuario a la página de inicio
5. THE Botón SHALL estar separado del resto de opciones con espacio adicional

### Requisito 9: Comportamiento del Menú Desplegable

**User Story:** Como usuario, quiero que el menú se comporte de forma intuitiva y fluida, para que pueda navegar sin frustraciones.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el avatar, THE UserProfileDropdown SHALL abrirse con una animación suave de fade-in y slide-down
2. WHEN el usuario hace clic fuera del menú, THE UserProfileDropdown SHALL cerrarse automáticamente
3. WHEN el usuario presiona la tecla Escape, THE UserProfileDropdown SHALL cerrarse
4. THE UserProfileDropdown SHALL posicionarse debajo del avatar alineado a la derecha
5. THE UserProfileDropdown SHALL tener un ancho máximo de 320 píxeles en desktop
6. THE UserProfileDropdown SHALL tener sombra y borde redondeado acorde al diseño de la aplicación

### Requisito 10: Diseño Responsivo

**User Story:** Como usuario móvil, quiero que el menú funcione perfectamente en mi dispositivo, para que pueda acceder a todas las opciones sin problemas.

#### Acceptance Criteria

1. WHEN el viewport es menor a 768 píxeles, THE UserProfileDropdown SHALL ocupar el ancho completo de la pantalla menos márgenes
2. WHEN el viewport es menor a 768 píxeles, THE UserProfileDropdown SHALL aparecer como un panel deslizante desde la derecha
3. THE UserProfileDropdown SHALL ser scrolleable si el contenido excede la altura de la pantalla
4. THE UserProfileDropdown SHALL mantener todos los elementos táctiles con un tamaño mínimo de 44x44 píxeles
5. WHEN el menú está abierto en móvil, THE Sistema SHALL mostrar un overlay oscuro detrás del menú

### Requisito 11: Accesibilidad

**User Story:** Como usuario con discapacidad, quiero que el menú sea accesible mediante teclado y lectores de pantalla, para que pueda navegar sin barreras.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL ser navegable completamente por teclado usando Tab y Enter
2. THE UserProfileDropdown SHALL implementar atributos ARIA apropiados (aria-expanded, aria-haspopup, role="menu")
3. THE UserProfileDropdown SHALL anunciar cambios de estado a lectores de pantalla
4. THE UserProfileDropdown SHALL mantener el foco dentro del menú mientras está abierto (focus trap)
5. WHEN el menú se cierra, THE Sistema SHALL devolver el foco al botón del avatar

### Requisito 12: Integración con Estado de Autenticación

**User Story:** Como sistema, quiero que el menú refleje correctamente el estado del usuario, para que la información mostrada sea siempre precisa.

#### Acceptance Criteria

1. THE UserProfileDropdown SHALL obtener los datos del usuario del contexto de autenticación (useAuth)
2. WHEN los datos del usuario cambian, THE UserProfileDropdown SHALL actualizarse automáticamente
3. IF el usuario no está autenticado, THE Header SHALL mostrar el botón "Iniciar Sesión" en lugar del avatar
4. THE UserProfileDropdown SHALL mostrar el método de autenticación usado (Google, GitHub, Email) si está disponible
