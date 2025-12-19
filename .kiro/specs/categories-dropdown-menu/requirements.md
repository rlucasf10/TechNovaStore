# Documento de Requisitos - Menú Desplegable de Categorías y Ofertas

## Introducción

Este documento define los requisitos para implementar un menú desplegable de categorías y ofertas en el Header de TechNovaStore. El diseño se inspira en PCComponentes, adaptado al catálogo de productos de tecnología e informática de la plataforma. El menú reemplazará los enlaces actuales de "Categorías", "Ofertas" y "Soporte" del Header, centralizando la navegación en un único botón de menú hamburguesa.

## Glosario

- **CategoriesDropdown**: Componente de menú desplegable que muestra las categorías de productos y ofertas
- **Header**: Componente de encabezado principal de la aplicación
- **Categoría Principal**: Categoría de primer nivel (ej: Ordenadores, Componentes)
- **Subcategoría**: Categoría de segundo nivel dentro de una categoría principal
- **Mega Menu**: Menú desplegable grande que muestra múltiples columnas de opciones
- **Sidebar**: Panel lateral deslizante para versión móvil

## Requisitos

### Requisito 1: Funcionalidad del Logo/Botón Existente

**User Story:** Como usuario, quiero que al hacer clic en el logo de TechNovaStore se abra el menú de categorías, para que pueda acceder rápidamente a todas las categorías de productos.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el logo de TechNovaStore (SVG con 3 líneas), THE CategoriesDropdown SHALL abrirse con una animación suave
2. THE Logo existente SHALL mantener su diseño actual (rectángulo con 3 líneas horizontales)
3. WHEN el menú está abierto y el usuario hace clic en el logo nuevamente, THE CategoriesDropdown SHALL cerrarse
4. THE Logo SHALL ser clickeable tanto en desktop como en móvil para abrir el menú
5. THE Texto "TechNovaStore" o "TNS" junto al logo SHALL seguir redirigiendo a la página de inicio al hacer clic

### Requisito 2: Estructura del Menú - Ofertas Destacadas

**User Story:** Como comprador, quiero ver las ofertas destacadas al inicio del menú, para que pueda encontrar rápidamente las mejores promociones.

#### Acceptance Criteria

1. THE CategoriesDropdown SHALL mostrar una sección de ofertas destacadas en la parte superior del menú
2. THE Sección de ofertas SHALL incluir un enlace destacado con color diferenciado (naranja/primario)
3. WHEN el usuario hace clic en una oferta, THE Sistema SHALL navegar a la página de ofertas correspondiente
4. THE Sección de ofertas SHALL mostrar el texto "Ofertas" con un icono de etiqueta o porcentaje

### Requisito 3: Categorías Principales de Tecnología

**User Story:** Como usuario, quiero ver las categorías principales de productos tecnológicos organizadas, para que pueda navegar fácilmente al tipo de producto que busco.

#### Acceptance Criteria

1. THE CategoriesDropdown SHALL mostrar las siguientes categorías principales con iconos representativos:
   - Ordenadores (portátiles, sobremesa, workstations)
   - Componentes (procesadores, tarjetas gráficas, memoria RAM, almacenamiento)
   - Periféricos (teclados, ratones, monitores, auriculares)
   - Smartphones y Tablets
   - Gaming (consolas, accesorios gaming, sillas gaming)
   - Redes y Conectividad (routers, switches, cables)
   - Software y Licencias
   - Accesorios y Cables
2. WHEN el usuario hace hover sobre una categoría principal, THE Sistema SHALL mostrar las subcategorías correspondientes
3. WHEN el usuario hace clic en una categoría, THE Sistema SHALL navegar a la página de listado de esa categoría

### Requisito 4: Subcategorías Expandibles con Panel Lateral

**User Story:** Como usuario, quiero poder ver las subcategorías de cada categoría principal en un panel lateral, para que pueda encontrar productos específicos más rápidamente.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar una flecha ">" a la derecha de cada categoría que tiene subcategorías
2. WHEN el usuario hace hover o clic en una categoría con subcategorías, THE Sistema SHALL mostrar un panel lateral a la derecha con las subcategorías
3. THE Panel lateral SHALL aparecer con una animación suave de deslizamiento desde la izquierda
4. WHEN el usuario hace clic en una subcategoría, THE Sistema SHALL navegar a la página de listado filtrada
5. THE Panel lateral SHALL mostrar el nombre de la categoría padre en la parte superior
6. WHEN el usuario mueve el cursor fuera de la categoría y el panel, THE Panel lateral SHALL cerrarse

### Requisito 5: Sección de Enlaces Rápidos

**User Story:** Como usuario, quiero acceder rápidamente a secciones especiales de la tienda, para que pueda encontrar contenido relevante sin buscar.

#### Acceptance Criteria

1. THE CategoriesDropdown SHALL incluir una sección "Trending" o "Destacados" separada visualmente
2. THE Sección SHALL incluir los siguientes enlaces:
   - Novedades (productos recién llegados)
   - Más vendidos
   - Reacondicionados
   - Outlet / Liquidación
3. THE Sección SHALL estar separada de las categorías principales con un divisor visual

### Requisito 6: Comportamiento del Menú Desplegable

**User Story:** Como usuario, quiero que el menú se comporte de forma intuitiva, para que pueda navegar sin frustraciones.

#### Acceptance Criteria

1. WHEN el usuario hace clic fuera del menú, THE CategoriesDropdown SHALL cerrarse automáticamente
2. WHEN el usuario presiona la tecla Escape, THE CategoriesDropdown SHALL cerrarse
3. WHEN el usuario navega a una opción, THE CategoriesDropdown SHALL cerrarse después de la navegación
4. THE CategoriesDropdown SHALL abrirse con una animación de deslizamiento desde la izquierda
5. THE CategoriesDropdown SHALL tener un ancho máximo de 400px en desktop

### Requisito 7: Diseño Responsivo - Desktop

**User Story:** Como usuario de escritorio, quiero que el menú se muestre de forma óptima en pantallas grandes, para que pueda ver todas las opciones claramente.

#### Acceptance Criteria

1. WHEN el viewport es mayor o igual a 768 píxeles, THE CategoriesDropdown SHALL mostrarse como un panel desplegable desde la izquierda
2. THE Panel SHALL tener un ancho fijo de 320-400 píxeles
3. THE Panel SHALL mostrar las categorías en una lista vertical con iconos
4. WHEN el usuario hace hover en una categoría con subcategorías, THE Sistema SHALL mostrar un segundo panel con las subcategorías

### Requisito 8: Diseño Responsivo - Móvil

**User Story:** Como usuario móvil, quiero que el menú funcione perfectamente en mi dispositivo, para que pueda navegar cómodamente.

#### Acceptance Criteria

1. WHEN el viewport es menor a 768 píxeles, THE CategoriesDropdown SHALL ocupar el ancho completo de la pantalla
2. THE CategoriesDropdown SHALL aparecer como un panel deslizante desde la izquierda
3. THE Sistema SHALL mostrar un overlay oscuro detrás del menú
4. THE Categorías con subcategorías SHALL mostrar una flecha ">" y al hacer clic SHALL expandir las subcategorías en acordeón (con flecha ↓/↑)
5. THE Subcategorías SHALL expandirse/contraerse con animación suave y flecha indicadora de estado (↓ cerrado, ↑ abierto)
6. THE Elementos táctiles SHALL tener un tamaño mínimo de 44x44 píxeles

### Requisito 9: Accesibilidad

**User Story:** Como usuario con discapacidad, quiero que el menú sea accesible, para que pueda navegar sin barreras.

#### Acceptance Criteria

1. THE CategoriesDropdown SHALL ser navegable completamente por teclado usando Tab, Enter y flechas
2. THE CategoriesDropdown SHALL implementar atributos ARIA apropiados (aria-expanded, aria-haspopup, role="menu")
3. THE Sistema SHALL mantener el foco dentro del menú mientras está abierto (focus trap)
4. WHEN el menú se cierra, THE Sistema SHALL devolver el foco al botón de menú

### Requisito 10: Reorganización del Header

**User Story:** Como usuario, quiero un header más limpio y organizado, para que pueda encontrar lo que busco más fácilmente.

#### Acceptance Criteria

1. THE Header SHALL eliminar los enlaces individuales de "Categorías", "Ofertas" y "Soporte"
2. THE Header SHALL mantener la siguiente estructura de izquierda a derecha:
   - Botón de menú hamburguesa (nuevo)
   - Logo TechNovaStore (enlace a inicio)
   - Barra de búsqueda (centro)
   - Notificaciones (si autenticado)
   - Carrito
   - Perfil de usuario / Login
3. THE Logo "TechNovaStore" (o "TNS" en móvil) SHALL seguir redirigiendo a la página de inicio

### Requisito 11: Integración con Navegación Existente

**User Story:** Como sistema, quiero que el nuevo menú se integre correctamente con la navegación existente, para que no haya conflictos.

#### Acceptance Criteria

1. THE CategoriesDropdown SHALL usar el mismo sistema de rutas que la navegación actual
2. THE Sistema SHALL cerrar el UserProfileDropdown si está abierto cuando se abre el CategoriesDropdown
3. THE Sistema SHALL cerrar el CategoriesDropdown si está abierto cuando se abre el UserProfileDropdown
4. THE Sistema SHALL mantener la funcionalidad del menú móvil existente para el perfil de usuario
