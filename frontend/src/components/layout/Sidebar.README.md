# Sidebar Navigation Component

Componente de navegación lateral para móvil con menú hamburger y animación slide-in.

## Características

- ✅ Menú hamburger con animación slide-in desde la derecha
- ✅ Navegación por categorías con iconos
- ✅ Enlaces rápidos a cuenta y pedidos
- ✅ Overlay con cierre al hacer clic fuera
- ✅ Accesibilidad completa (ARIA, navegación por teclado, trap de foco)
- ✅ Cierre con tecla Escape
- ✅ Prevención de scroll del body cuando está abierto
- ✅ Diseño responsive (máximo 85% del viewport en móviles pequeños)
- ✅ Sección de usuario con avatar o iniciales
- ✅ Botón de cerrar sesión para usuarios autenticados
- ✅ Indicadores visuales de página activa

## Requisitos Cumplidos

- **4.2**: Diseño Mobile-First con menú adaptable
- **4.4**: Elementos interactivos con tamaño mínimo de 44x44 píxeles en móvil

## Uso Básico

```tsx
import { Sidebar } from '@/components/layout/Sidebar';

function MyComponent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsSidebarOpen(true)}>
        Abrir Menú
      </button>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}
```

## Props

### `isOpen` (requerido)
- **Tipo**: `boolean`
- **Descripción**: Controla si el sidebar está visible o no

### `onClose` (requerido)
- **Tipo**: `() => void`
- **Descripción**: Callback que se ejecuta cuando el usuario cierra el sidebar

### `categories` (opcional)
- **Tipo**: `Category[]`
- **Descripción**: Array de categorías personalizadas. Si no se proporciona, usa categorías por defecto
- **Estructura**:
  ```typescript
  interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: React.ComponentType<{ className?: string }>;
  }
  ```

## Ejemplo con Categorías Personalizadas

```tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { Laptop, Smartphone, Monitor } from 'lucide-react';

const customCategories = [
  { id: '1', name: 'Laptops', slug: 'laptops', icon: Laptop },
  { id: '2', name: 'Móviles', slug: 'moviles', icon: Smartphone },
  { id: '3', name: 'Monitores', slug: 'monitores', icon: Monitor },
];

function MyComponent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Sidebar
      isOpen={isSidebarOpen}
      onClose={() => setIsSidebarOpen(false)}
      categories={customCategories}
    />
  );
}
```

## Integración con Header

El componente está diseñado para integrarse fácilmente con el Header existente:

```tsx
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main>{children}</main>
    </>
  );
}
```

## Estructura del Sidebar

El sidebar está organizado en las siguientes secciones:

1. **Header**: Título "Menú" y botón de cerrar
2. **Usuario**: 
   - Si está autenticado: Avatar/iniciales, nombre y enlace al perfil
   - Si no está autenticado: Botones de "Iniciar Sesión" y "Regístrate"
3. **Enlaces Rápidos**: Inicio, Ofertas, Soporte
4. **Categorías**: Lista de categorías de productos con iconos
5. **Mi Cuenta** (solo autenticados): Perfil, Pedidos, Lista de Deseos, Configuración
6. **Footer** (solo autenticados): Botón de cerrar sesión

## Accesibilidad

El componente implementa las siguientes características de accesibilidad:

- **ARIA**: Roles y labels apropiados (`role="dialog"`, `aria-modal="true"`, `aria-label`)
- **Navegación por teclado**: Todos los elementos son accesibles con Tab
- **Trap de foco**: El foco se mantiene dentro del sidebar cuando está abierto
- **Tecla Escape**: Cierra el sidebar
- **Overlay**: Cierra el sidebar al hacer clic fuera
- **Prevención de scroll**: El body no hace scroll cuando el sidebar está abierto

## Animaciones

El sidebar utiliza la clase `animate-slide-in-right` para la animación de entrada. Asegúrate de tener esta animación definida en tu configuración de Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
};
```

## Categorías por Defecto

Si no se proporcionan categorías personalizadas, el componente usa las siguientes categorías por defecto:

- Laptops
- Smartphones
- Componentes
- Periféricos
- Audio
- Accesorios

## Estilos

El componente utiliza:
- **Ancho**: 320px (80 en Tailwind) con máximo 85% del viewport
- **Posición**: Fixed, desde el borde derecho
- **Z-index**: 50 para el sidebar, 40 para el overlay
- **Colores**: Paleta primary del tema
- **Sombras**: shadow-2xl para el sidebar

## Notas de Implementación

1. El componente requiere que el hook `useAuth` esté configurado correctamente
2. Las rutas de navegación asumen la siguiente estructura:
   - `/dashboard` - Dashboard del usuario
   - `/dashboard/perfil` - Perfil del usuario
   - `/dashboard/pedidos` - Pedidos del usuario
   - `/dashboard/wishlist` - Lista de deseos
   - `/dashboard/configuracion` - Configuración
   - `/categorias/{slug}` - Páginas de categorías
3. El componente cierra automáticamente el sidebar al navegar a una nueva página

## Testing

Para testear el componente:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('should render when open', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should call onClose when clicking overlay', () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);
    
    const overlay = screen.getByRole('dialog').previousSibling;
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when pressing Escape', () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });
});
```

## Mejoras Futuras

- [ ] Agregar soporte para subcategorías expandibles
- [ ] Implementar búsqueda de categorías
- [ ] Agregar badges de notificaciones en enlaces de cuenta
- [ ] Soporte para temas (modo oscuro)
- [ ] Animación de salida (slide-out)
- [ ] Soporte para múltiples idiomas
