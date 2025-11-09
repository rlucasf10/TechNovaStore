# Header Component

Componente de encabezado principal de la aplicación TechNovaStore.

## Características

### ✅ Implementadas

1. **Logo con link a home**
   - Logo de TechNovaStore con enlace a la página principal
   - Versión completa en desktop, versión abreviada (TNS) en móvil

2. **Barra de búsqueda global**
   - Input de búsqueda con placeholder
   - Icono de lupa
   - Versión desktop (centro del header)
   - Versión móvil (debajo del header principal)
   - **Nota**: La funcionalidad de búsqueda se implementará en la Fase 6 (Requisito 17)

3. **Navegación principal**
   - Enlaces a: Categorías, Ofertas, Soporte
   - Highlight del enlace activo
   - Visible solo en desktop (lg+)

4. **Iconos de acción**
   - **Notificaciones**: Icono de campana con badge rojo (placeholder)
   - **Carrito**: Icono con contador de items (integrado con Zustand store)
   - **Usuario**: 
     - Si está autenticado: Avatar o iniciales + nombre
     - Si no está autenticado: Botón "Iniciar Sesión"

5. **Sticky header en scroll**
   - Header fijo en la parte superior
   - Sombra que aumenta al hacer scroll
   - Transición suave

6. **Responsive con hamburger menu**
   - Botón hamburger en móvil (< md)
   - Sidebar deslizante desde la derecha
   - Overlay oscuro al abrir
   - Cierre automático al cambiar de ruta
   - Navegación completa en el sidebar
   - Perfil de usuario en el sidebar

## Uso

```tsx
import { Header } from '@/components/layout';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
```

## Integración con Stores

### useAuth
- Obtiene el usuario actual y estado de autenticación
- Muestra información del usuario en el header
- Redirige a login si no está autenticado

### useCartStore
- Obtiene el contador de items del carrito
- Muestra el badge con el número de items
- Actualización en tiempo real

## Breakpoints

- **Mobile**: < 768px
  - Logo abreviado (TNS)
  - Búsqueda debajo del header
  - Hamburger menu
  - Solo carrito visible

- **Tablet**: 768px - 1024px
  - Logo completo
  - Búsqueda en el centro
  - Iconos de acción visibles
  - Sin navegación principal

- **Desktop**: > 1024px
  - Todas las características visibles
  - Navegación principal visible
  - Búsqueda expandida

## Accesibilidad

- ✅ Navegación por teclado completa
- ✅ Labels ARIA para iconos
- ✅ Estados focus visibles
- ✅ Contraste de color adecuado (WCAG 2.1 AA)
- ✅ Tamaño mínimo de elementos interactivos (44x44px)

## Animaciones

- Transición de sombra en scroll
- Slide-in del sidebar móvil
- Fade-in del overlay
- Transiciones de hover en enlaces

## Próximas Mejoras

- [ ] Implementar búsqueda global funcional (Fase 6)
- [ ] Integrar notificaciones reales
- [ ] Agregar dropdown de usuario con opciones
- [ ] Implementar mega-menu para categorías
- [ ] Agregar indicador de carga en búsqueda

## Requisitos Cumplidos

- ✅ Requisito 4.1: Diseño Mobile-First y responsivo
- ✅ Requisito 17.1: Búsqueda global visible (funcionalidad pendiente)
