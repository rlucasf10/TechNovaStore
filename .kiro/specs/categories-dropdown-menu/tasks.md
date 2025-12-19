# Plan de Implementación - Menú Desplegable de Categorías y Ofertas

## ⚠️ IMPORTANTE - NO MODIFICAR EL LOGO

**NUNCA cambiar el logo SVG de TechNovaStore en el Header.**

El logo correcto es:
```svg
<rect width="32" height="32" rx="6" fill="currentColor" />
<path d="M8 12h16M8 16h16M8 20h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
```

Este logo representa un rectángulo con esquinas redondeadas y 3 líneas horizontales dentro.
**NO usar iconos de hamburguesa (Menu) ni otros iconos en su lugar.**

## Fase 1: Componente Principal y Configuración

- [x] 1. Crear componente CategoriesDropdown






  - [x] 1.1 Crear archivo CategoriesDropdown.tsx en shared/components/layout

    - Implementar estructura base del componente con estado isOpen
    - Crear configuración de categorías (CATEGORIES array)
    - Crear configuración de enlaces rápidos (QUICK_LINKS array)
    - Implementar renderizado condicional del panel
    - _Requisitos: 1.1, 3.1_


  - [x] 1.2 Implementar sección de ofertas destacadas

    - Agregar enlace de ofertas con estilo destacado (color primario/naranja)
    - Incluir icono de etiqueta (Tag de Lucide)
    - Configurar navegación a /ofertas
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

## Fase 2: Lista de Categorías

- [x] 2. Implementar lista de categorías principales






  - [x] 2.1 Crear componente CategoryItem

    - Mostrar icono, nombre y flecha ">" para categorías con subcategorías
    - Implementar estados hover con cambio de color
    - Agregar transiciones suaves
    - _Requisitos: 3.1, 4.1_

  - [x] 2.2 Implementar todas las categorías


    - Ordenadores con subcategorías
    - Componentes con subcategorías
    - Periféricos con subcategorías
    - Smartphones y Tablets con subcategorías
    - Gaming con subcategorías
    - Redes y Conectividad con subcategorías
    - Software y Licencias con subcategorías
    - Accesorios y Cables con subcategorías
    - _Requisitos: 3.1, 3.2_

## Fase 3: Panel de Subcategorías (Desktop)

- [x] 3. Implementar panel lateral de subcategorías








  - [x] 3.1 Crear componente SubcategoryPanel
    - Mostrar título de categoría padre en la parte superior
    - Listar todas las subcategorías de la categoría activa
    - Implementar animación de deslizamiento desde la izquierda
    - _Requisitos: 4.2, 4.3, 4.5_

  - [x] 3.2 Implementar lógica de hover/activación


    - Mostrar panel al hacer hover en categoría con subcategorías
    - Cerrar panel al mover cursor fuera
    - Mantener panel abierto mientras el cursor está sobre él
    - _Requisitos: 3.2, 4.2, 4.6_

  - [x] 3.3 Implementar navegación de subcategorías


    - Configurar enlaces a rutas de subcategorías
    - Cerrar menú al hacer clic en subcategoría
    - _Requisitos: 4.4_

## Fase 4: Enlaces Rápidos (si haces una pagina de prueba, metelo todo en la actual ·http://localhost:3020/test-categories-dropdown·)

- [x] 4. Implementar sección de enlaces rápidos




  - [x] 4.1 Crear sección "Trending" / "Destacados"

    - Agregar separador visual (borde superior)
    - Incluir título de sección
    - _Requisitos: 5.1, 5.3_



  - [x] 4.2 Implementar enlaces rápidos

    - Novedades con icono Sparkles
    - Más Vendidos con icono TrendingUp
    - Reacondicionados con icono RefreshCw
    - Outlet con icono Percent
    - _Requisitos: 5.2_

## Fase 5: Comportamiento e Interacciones (si haces una pagina de prueba, metelo todo en la actual ·http://localhost:3020/test-categories-dropdown· que es la que estamos usando para evitar crear 10 paginas de prueba)

- [x] 5. Implementar comportamientos del menú





  - [x] 5.1 Implementar cierre automático


    - Cerrar al hacer clic fuera del menú (useClickOutside)
    - Cerrar al presionar tecla Escape
    - Cerrar al navegar a una opción
    - _Requisitos: 6.1, 6.2, 6.3_


  - [x] 5.2 Implementar animaciones

    - Animación de apertura (deslizamiento desde izquierda)
    - Animación de cierre
    - Transiciones suaves en hover
    - _Requisitos: 6.4_

## Fase 6: Diseño Responsivo - Móvil (si haces una pagina de prueba, metelo todo en la actual ·http://localhost:3020/test-categories-dropdown· que es la que estamos usando para evitar crear 10 paginas de prueba)

- [x] 6. Implementar versión móvil





  - [x] 6.1 Crear panel deslizante para móvil

    - Detectar viewport < 768px
    - Implementar panel que desliza desde la izquierda
    - Ocupar ancho completo de pantalla
    - Agregar overlay oscuro detrás del menú
    - _Requisitos: 8.1, 8.2, 8.3_


  - [x] 6.2 Implementar acordeón para subcategorías móvil

    - Mostrar flecha ">" en categorías con subcategorías
    - Al hacer clic, expandir subcategorías en acordeón
    - Cambiar flecha a "↓/↑" según estado
    - Animación suave de expansión/contracción
    - _Requisitos: 8.4, 8.5_

  - [x] 6.3 Optimizar para touch


    - Asegurar elementos táctiles de mínimo 44x44px
    - Hacer menú scrolleable si excede altura de pantalla
    - _Requisitos: 8.6_

## Fase 7: Accesibilidad (si haces una pagina de prueba, metelo todo en la actual ·http://localhost:3020/test-categories-dropdown· que es la que estamos usando para evitar crear 10 paginas de prueba)

- [x] 7. Implementar accesibilidad completa



  - [x] 7.1 Agregar atributos ARIA


    - Implementar aria-expanded en botón del menú
    - Agregar aria-haspopup="menu" al botón
    - Usar role="menu" en el contenedor
    - Usar role="menuitem" en cada opción
    - _Requisitos: 9.2_



  - [x] 7.2 Implementar navegación por teclado

    - Permitir navegación con Tab y flechas
    - Activar opciones con Enter
    - Implementar focus trap mientras el menú está abierto
    - Devolver foco al botón al cerrar el menú
    - _Requisitos: 9.1, 9.3, 9.4_

## Fase 8: Integración con Header (si haces una pagina de prueba, metelo todo en la actual ·http://localhost:3020/test-categories-dropdown· que es la que estamos usando para evitar crear 10 paginas de prueba)

- [x] 8. Integrar en Header existente





  - [x] 8.1 Separar logo de texto en Header (no te pases, que quede bonito, moderno y consistente)


    - Hacer el icono SVG clickeable para abrir CategoriesDropdown
    - Mantener texto "TechNovaStore"/"TNS" como enlace a inicio
    - _Requisitos: 1.1, 1.5_

  - [x] 8.2 Eliminar enlaces de navegación antiguos

    - Eliminar enlace "Categorías" del Header
    - Eliminar enlace "Ofertas" del Header
    - Eliminar enlace "Soporte" del Header (ya está en UserProfileDropdown)
    - _Requisitos: 10.1_

  - [x] 8.3 Reorganizar estructura del Header

    - Izquierda: Botón menú (logo icon) + Logo texto (enlace a inicio)
    - Centro: Barra de búsqueda
    - Derecha: Notificaciones + Carrito + Perfil usuario (si no me he logueado, en la estructura de la derecha, debe aparecer como hasta ahora, con las tres opciones de "categorias, ofertas y soporte" + el boton de "iniciar sesion" )
    - _Requisitos: 10.2, 10.3_

  - [x] 8.4 Implementar exclusión mutua de dropdowns

    - Cerrar UserProfileDropdown al abrir CategoriesDropdown
    - Cerrar CategoriesDropdown al abrir UserProfileDropdown
    - _Requisitos: 11.2, 11.3_

- [x] 9. Checkpoint - Verificar funcionamiento




  - Verificar que el menú funciona correctamente en desktop y móvil
  - Comprobar que todas las categorías navegan correctamente
  - Verificar que los dropdowns no interfieren entre sí
  - Preguntar al usuario si hay ajustes necesarios
