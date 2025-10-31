# Dropdown Component

Componente de menú desplegable con posicionamiento inteligente, navegación por teclado y accesibilidad completa.

## Características

- ✅ **Posicionamiento Inteligente**: Ajusta automáticamente su posición si no hay espacio
- ✅ **Navegación por Teclado**: Soporte completo para ↑↓ Home End Enter Escape
- ✅ **Accesibilidad**: ARIA roles, focus management, screen reader friendly
- ✅ **Animaciones**: Transiciones suaves de entrada/salida
- ✅ **Tema Oscuro**: Soporte completo para dark mode
- ✅ **Responsive**: Se adapta a diferentes tamaños de pantalla
- ✅ **Cierre Automático**: Cierra al hacer clic fuera o presionar Escape

## Uso Básico

```tsx
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui'

function MyComponent() {
  return (
    <Dropdown trigger={<Button>Abrir Menú</Button>}>
      <DropdownItem onClick={() => console.log('Perfil')}>
        Mi Perfil
      </DropdownItem>
      <DropdownItem onClick={() => console.log('Configuración')}>
        Configuración
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem variant="danger" onClick={() => console.log('Salir')}>
        Cerrar Sesión
      </DropdownItem>
    </Dropdown>
  )
}
```

## Props

### Dropdown

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `trigger` | `ReactNode` | - | **Requerido**. Elemento que activa el dropdown |
| `children` | `ReactNode` | - | **Requerido**. Contenido del dropdown |
| `placement` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end' \| 'left' \| 'right'` | `'bottom-start'` | Posición del dropdown |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alineación del dropdown |
| `offset` | `number` | `8` | Offset en píxeles desde el trigger |
| `disabled` | `boolean` | `false` | Deshabilitar el dropdown |
| `closeOnItemClick` | `boolean` | `true` | Cerrar al hacer clic en un item |
| `containerClassName` | `string` | - | Clase CSS para el contenedor |
| `contentClassName` | `string` | - | Clase CSS para el contenido |
| `onOpen` | `() => void` | - | Callback cuando se abre |
| `onClose` | `() => void` | - | Callback cuando se cierra |

### DropdownItem

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'danger'` | `'default'` | Variante visual del item |
| `icon` | `ReactNode` | - | Icono a mostrar antes del texto |
| `disabled` | `boolean` | `false` | Deshabilitar el item |
| `active` | `boolean` | `false` | Mostrar como activo/seleccionado |
| `onClick` | `(e: MouseEvent) => void` | - | Handler del click |

### DropdownDivider

Separador visual entre items. No tiene props adicionales.

### DropdownLabel

Etiqueta para agrupar items. Acepta `children` como texto.

## Ejemplos

### Menú de Usuario

```tsx
<Dropdown
  trigger={
    <button className="flex items-center gap-2">
      <img src="/avatar.jpg" alt="Usuario" className="w-8 h-8 rounded-full" />
      <span>Juan Pérez</span>
    </button>
  }
  placement="bottom-end"
>
  <DropdownLabel>Mi Cuenta</DropdownLabel>
  <DropdownItem
    icon={<UserIcon />}
    onClick={() => router.push('/perfil')}
  >
    Mi Perfil
  </DropdownItem>
  <DropdownItem
    icon={<SettingsIcon />}
    onClick={() => router.push('/configuracion')}
  >
    Configuración
  </DropdownItem>
  <DropdownDivider />
  <DropdownItem
    icon={<LogoutIcon />}
    variant="danger"
    onClick={handleLogout}
  >
    Cerrar Sesión
  </DropdownItem>
</Dropdown>
```

### Menú de Acciones

```tsx
<Dropdown
  trigger={
    <Button variant="ghost" size="sm">
      <MoreVerticalIcon />
    </Button>
  }
  placement="bottom-end"
>
  <DropdownItem icon={<EditIcon />} onClick={handleEdit}>
    Editar
  </DropdownItem>
  <DropdownItem icon={<CopyIcon />} onClick={handleDuplicate}>
    Duplicar
  </DropdownItem>
  <DropdownItem icon={<ShareIcon />} onClick={handleShare}>
    Compartir
  </DropdownItem>
  <DropdownDivider />
  <DropdownItem
    icon={<TrashIcon />}
    variant="danger"
    onClick={handleDelete}
  >
    Eliminar
  </DropdownItem>
</Dropdown>
```

### Selector de Idioma

```tsx
const [language, setLanguage] = useState('es')

<Dropdown
  trigger={
    <Button variant="ghost">
      <GlobeIcon />
      {language === 'es' ? 'Español' : 'English'}
    </Button>
  }
>
  <DropdownLabel>Idioma</DropdownLabel>
  <DropdownItem
    active={language === 'es'}
    onClick={() => setLanguage('es')}
  >
    🇪🇸 Español
  </DropdownItem>
  <DropdownItem
    active={language === 'en'}
    onClick={() => setLanguage('en')}
  >
    🇺🇸 English
  </DropdownItem>
  <DropdownItem
    active={language === 'fr'}
    onClick={() => setLanguage('fr')}
  >
    🇫🇷 Français
  </DropdownItem>
</Dropdown>
```

### Menú con Grupos

```tsx
<Dropdown trigger={<Button>Filtros</Button>}>
  <DropdownLabel>Ordenar por</DropdownLabel>
  <DropdownItem onClick={() => handleSort('name')}>
    Nombre
  </DropdownItem>
  <DropdownItem onClick={() => handleSort('price')}>
    Precio
  </DropdownItem>
  <DropdownItem onClick={() => handleSort('date')}>
    Fecha
  </DropdownItem>
  
  <DropdownDivider />
  
  <DropdownLabel>Mostrar</DropdownLabel>
  <DropdownItem onClick={() => handleView('grid')}>
    Vista de Cuadrícula
  </DropdownItem>
  <DropdownItem onClick={() => handleView('list')}>
    Vista de Lista
  </DropdownItem>
</Dropdown>
```

### Dropdown Deshabilitado

```tsx
<Dropdown
  trigger={<Button>Menú</Button>}
  disabled={true}
>
  <DropdownItem>Item 1</DropdownItem>
  <DropdownItem>Item 2</DropdownItem>
</Dropdown>
```

### Posicionamiento Personalizado

```tsx
// Arriba a la izquierda
<Dropdown trigger={<Button>Arriba</Button>} placement="top-start">
  <DropdownItem>Item 1</DropdownItem>
</Dropdown>

// Abajo a la derecha
<Dropdown trigger={<Button>Abajo</Button>} placement="bottom-end">
  <DropdownItem>Item 1</DropdownItem>
</Dropdown>

// A la izquierda
<Dropdown trigger={<Button>Izquierda</Button>} placement="left">
  <DropdownItem>Item 1</DropdownItem>
</Dropdown>

// A la derecha
<Dropdown trigger={<Button>Derecha</Button>} placement="right">
  <DropdownItem>Item 1</DropdownItem>
</Dropdown>
```

## Navegación por Teclado

| Tecla | Acción |
|-------|--------|
| `↓` | Mover al siguiente item |
| `↑` | Mover al item anterior |
| `Home` | Ir al primer item |
| `End` | Ir al último item |
| `Enter` / `Space` | Activar el item enfocado |
| `Escape` | Cerrar el dropdown |

## Accesibilidad

El componente implementa las siguientes características de accesibilidad:

- ✅ **ARIA Roles**: `role="menu"` y `role="menuitem"`
- ✅ **ARIA Attributes**: `aria-orientation`, `aria-labelledby`
- ✅ **Focus Management**: Manejo automático del foco
- ✅ **Keyboard Navigation**: Navegación completa por teclado
- ✅ **Screen Reader**: Anuncios apropiados para lectores de pantalla
- ✅ **Focus Trap**: El foco permanece dentro del dropdown cuando está abierto

## Posicionamiento Inteligente

El dropdown ajusta automáticamente su posición si no hay suficiente espacio:

1. **Vertical**: Si no hay espacio abajo, se coloca arriba
2. **Horizontal**: Si no hay espacio a la derecha, se coloca a la izquierda
3. **Viewport**: Siempre se mantiene dentro de los límites de la pantalla

Ejemplo:
```tsx
// Si se especifica 'bottom-start' pero no hay espacio abajo,
// automáticamente cambiará a 'top-start'
<Dropdown trigger={<Button>Menú</Button>} placement="bottom-start">
  {/* ... */}
</Dropdown>
```

## Callbacks

```tsx
<Dropdown
  trigger={<Button>Menú</Button>}
  onOpen={() => console.log('Dropdown abierto')}
  onClose={() => console.log('Dropdown cerrado')}
>
  <DropdownItem onClick={(e) => {
    console.log('Item clickeado')
    // Para prevenir el cierre automático:
    // e.preventDefault()
  }}>
    Item
  </DropdownItem>
</Dropdown>
```

## Estilos Personalizados

```tsx
<Dropdown
  trigger={<Button>Menú</Button>}
  containerClassName="custom-container"
  contentClassName="custom-content min-w-[20rem]"
>
  <DropdownItem className="text-lg py-3">
    Item Grande
  </DropdownItem>
</Dropdown>
```

## Requisitos Cumplidos

- ✅ **Requisito 5.2**: Navegación por teclado completa
- ✅ **Accesibilidad WCAG 2.1**: Roles ARIA, focus management
- ✅ **Posicionamiento Inteligente**: Ajuste automático de posición
- ✅ **Responsive**: Funciona en todos los tamaños de pantalla

## Notas de Implementación

- El dropdown usa `position: fixed` para evitar problemas con `overflow: hidden` en contenedores padres
- La posición se recalcula automáticamente en resize y scroll
- El componente es completamente controlado por su estado interno
- Los items se cierran automáticamente al hacer clic (configurable con `closeOnItemClick`)
