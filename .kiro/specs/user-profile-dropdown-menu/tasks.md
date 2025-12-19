# Plan de Implementación - Menú Desplegable de Perfil de Usuario

> **⚠️ IMPORTANTE**: Antes de implementar cualquier tarea, SIEMPRE leer el archivo `Header.tsx` actual completo (`domains/platform/frontend/src/shared/components/layout/Header.tsx`) para entender la estructura existente y no romper funcionalidades. El Header ya tiene:
> - Lógica de autenticación con useAuth
> - CartDropdown para el carrito
> - NotificationDropdown para notificaciones
> - Menú móvil con sidebar
> - GlobalSearch
> 
> **NO romper ninguna de estas funcionalidades existentes.**

## Fase 1: Componente Principal y Avatar

- [ ] 1. Crear componente UserProfileDropdown





  - [x] 1.1 Crear archivo UserProfileDropdown.tsx en shared/components/layout


    - Implementar estructura base del componente con estado isOpen
    - Crear función getUserInitials para generar iniciales del nombre
    - Crear función getAvatarColor para color consistente basado en nombre
    - Implementar renderizado condicional: avatar con foto vs iniciales
    - _Requisitos: 1.1, 1.2, 1.3_


  - [x] 1.2 Implementar avatar clickeable con estados visuales

    - Agregar efecto hover con elevación/borde sutil
    - Implementar tamaños responsivos (32px desktop, 40px móvil)
    - Agregar transiciones suaves para estados hover/active
    - _Requisitos: 1.4, 1.5_

## Fase 2: Menú Desplegable y Cabecera

- [x] 2. Implementar menú desplegable





  - [x] 2.1 Crear estructura del dropdown con animaciones


    - Implementar animación fade-in y slide-down al abrir
    - Posicionar debajo del avatar alineado a la derecha
    - Agregar sombra y bordes redondeados
    - Establecer ancho máximo de 320px en desktop
    - _Requisitos: 9.1, 9.4, 9.5, 9.6_


  - [x] 2.2 Implementar cabecera del perfil

    - Mostrar avatar grande (64x64px) centrado
    - Mostrar nombre completo del usuario
    - Mostrar email del usuario
    - Agregar fondo diferenciado (gradiente sutil o color)
    - Hacer clickeable para navegar a /dashboard/usuario/perfil
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

## Fase 3: Secciones Colapsables

- [x] 3. Implementar secciones del menú







  - [x] 3.1 Crear componente CollapsibleSection

    - Implementar acordeón con título, icono y flecha
    - Agregar animación de expansión/colapso suave
    - Manejar estado expandido/colapsado por sección
    - _Requisitos: 3.1, 4.1, 5.1, 6.1_

  - [x] 3.2 Implementar sección "Pedidos y Devoluciones"


    - Agregar icono de paquete (Package de Lucide)
    - Incluir opciones: Pedidos y facturas, Cancelados, Devoluciones
    - Configurar como expandida por defecto
    - _Requisitos: 3.1, 3.2_

  - [x] 3.3 Implementar sección "Mi Cuenta"


    - Agregar icono de usuario (User de Lucide)
    - Incluir opciones: Datos, Direcciones, Suscripciones, Documentos, Lista de deseos, Configuraciones, Mensajes, Opiniones
    - _Requisitos: 4.1, 4.2_

  - [x] 3.4 Implementar sección "Pago"


    - Agregar icono de tarjeta (CreditCard de Lucide)
    - Incluir opciones: Métodos de pago, Historial de pagos
    - _Requisitos: 5.1, 5.2_

  - [x] 3.5 Implementar sección "¿Necesitas ayuda?"


    - Agregar icono de ayuda (HelpCircle de Lucide)
    - Incluir opciones: Centro de ayuda, Mis tickets, Contactar soporte, FAQ
    - Implementar acción especial para "Contactar soporte" que abre ChatWidget
    - _Requisitos: 6.1, 6.2, 6.3_

## Fase 4: Acciones Rápidas y Logout

- [x] 4. Implementar acciones finales





  - [x] 4.1 Crear sección de acciones rápidas


    - Agregar separador visual (borde superior)
    - Incluir "Rastrear pedido" con icono de ubicación
    - Incluir "Notificaciones" con badge de contador dinámico
    - _Requisitos: 7.1, 7.2_

  - [x] 4.2 Implementar botón de cerrar sesión y mira haber si tenemos la pagina de cerrar sesion creado, si no habrá que crearla


    - Agregar icono de salida (LogOut de Lucide)
    - Destacar visualmente con color diferente
    - Implementar llamada a logout del AuthService
    - después de cerrar sesión no debe redirigir a la página de inicio, debe quedarse en la misma página en la que se está el usuario a no ser que esa página requiera auntenticacion en cuyo caso si debe redirigir a la pagina de inicio
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_

## Fase 5: Comportamiento e Interacciones

- [x] 5. Implementar comportamientos del menú





  - [x] 5.1 Implementar cierre automático


    - Cerrar al hacer clic fuera del menú (useClickOutside)
    - Cerrar al presionar tecla Escape
    - Cerrar al navegar a una opción
    - _Requisitos: 9.2, 9.3_

  - [x] 5.2 Implementar navegación funcional


    - Conectar todas las opciones con sus rutas correspondientes
    - Usar Next.js router para navegación
    - Cerrar menú antes de navegar
    - _Requisitos: 3.3, 4.3, 5.3, 6.3_

## Fase 6: Diseño Responsivo

- [x] 6. Implementar versión móvil





  - [x] 6.1 Crear panel deslizante para móvil


    - Detectar viewport < 768px
    - Implementar panel que desliza desde la derecha
    - Ocupar ancho completo menos márgenes
    - Agregar overlay oscuro detrás del menú
    - _Requisitos: 10.1, 10.2, 10.5_



  - [ ] 6.2 Optimizar para touch
    - Asegurar elementos táctiles de mínimo 44x44px
    - Hacer menú scrolleable si excede altura de pantalla
    - Ajustar espaciado para mejor usabilidad táctil
    - _Requisitos: 10.3, 10.4_

## Fase 7: Accesibilidad

- [x] 7. Implementar accesibilidad completa




  - [x] 7.1 Agregar atributos ARIA


    - Implementar aria-expanded en botón del avatar
    - Agregar aria-haspopup="menu" al botón
    - Usar role="menu" en el contenedor del dropdown
    - Usar role="menuitem" en cada opción
    - _Requisitos: 11.2, 11.3_


  - [x] 7.2 Implementar navegación por teclado

    - Permitir navegación con Tab entre opciones
    - Activar opciones con Enter
    - Implementar focus trap mientras el menú está abierto
    - Devolver foco al avatar al cerrar el menú
    - _Requisitos: 11.1, 11.4, 11.5_

## Fase 8: Integración con Header

- [ ] 8. Integrar en Header existente




  - [x] 8.1 Reemplazar enlace actual por UserProfileDropdown


    - **IMPORTANTE**: Descomentar la importación de UserProfileDropdown en Header.tsx (línea 27: `// import { UserProfileDropdown } from './UserProfileDropdown';`)
    - Modificar Header.tsx para usar el nuevo componente
    - Mantener lógica de mostrar botón login si no autenticado
    - Asegurar que el dropdown recibe datos del usuario correctamente
    - _Requisitos: 12.1, 12.2, 12.3_

  - [x] 8.2 Actualizar menú móvil del Header


    - Integrar UserProfileDropdown en el sidebar móvil existente
    - Mantener consistencia visual entre desktop y móvil
    - _Requisitos: 12.4_

- [ ] 9. Checkpoint - Verificar funcionamiento
  - Verificar que el menú funciona correctamente en desktop y móvil
  - Comprobar que todas las rutas navegan correctamente
  - Verificar que el logout funciona y redirige a home
  - Preguntar al usuario si hay ajustes necesarios
