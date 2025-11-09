# Componente Tabs

Componente de navegación por pestañas (tabs) con soporte completo para accesibilidad y navegación por teclado.

## Características

- ✅ **Navegación por teclado**: Flechas izquierda/derecha, Home, End
- ✅ **Indicador visual del tab activo**: Diferentes estilos según la variante
- ✅ **Múltiples variantes**: default, pills, underline
- ✅ **Tabs deshabilitados**: Soporte para tabs no disponibles
- ✅ **Iconos opcionales**: Agrega iconos antes de las etiquetas
- ✅ **Accesible**: Cumple con WCAG 2.1 AA (roles ARIA, navegación por teclado)
- ✅ **Responsive**: Se adapta a diferentes tamaños de pantalla
- ✅ **Callback de cambio**: Notifica cuando cambia el tab activo

## Uso Básico

```tsx
import { Tabs, TabItem } from '@/components/ui/Tabs'

const tabs: TabItem[] = [
  {
    id: 'description',
    label: 'Descripción',
    content: <p>Contenido de descripción...</p>,
  },
  {
    id: 'specifications',
    label: 'Especificaciones',
    content: <p>Contenido de especificaciones...</p>,
  },
  {
    id: 'reviews',
    label: 'Reviews',
    content: <p>Contenido de reviews...</p>,
  },
]

function MyComponent() {
  return <Tabs tabs={tabs} defaultActiveTab="description" />
}
```

## Props

### Tabs

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `tabs` | `TabItem[]` | **requerido** | Lista de tabs a mostrar |
| `defaultActiveTab` | `string` | `tabs[0].id` | ID del tab activo por defecto |
| `onTabChange` | `(tabId: string) => void` | - | Callback cuando cambia el tab activo |
| `className` | `string` | - | Clase CSS adicional para el contenedor |
| `variant` | `'default' \| 'pills' \| 'underline'` | `'default'` | Variante visual de los tabs |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alineación de los tabs |

### TabItem

| Prop | Tipo | Descripción |
|------|------|-------------|
| `id` | `string` | Identificador único del tab |
| `label` | `string` | Etiqueta visible del tab |
| `content` | `ReactNode` | Contenido del tab |
| `disabled` | `boolean` | Indica si el tab está deshabilitado |
| `icon` | `ReactNode` | Icono opcional a mostrar antes de la etiqueta |

## Variantes

### Default

Tabs con borde inferior y fondo de color al activarse. Ideal para páginas de detalle de producto.

```tsx
<Tabs tabs={tabs} variant="default" />
```

### Pills

Tabs con forma de píldora (bordes redondeados completos). Ideal para filtros y navegación secundaria.

```tsx
<Tabs tabs={tabs} variant="pills" />
```

### Underline

Tabs con solo una línea inferior como indicador. Ideal para dashboards y navegación minimalista.

```tsx
<Tabs tabs={tabs} variant="underline" />
```

## Ejemplos

### Con Iconos

```tsx
import { Tabs, TabItem } from '@/components/ui/Tabs'

const DescriptionIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
)

const tabs: TabItem[] = [
  {
    id: 'description',
    label: 'Descripción',
    icon: <DescriptionIcon />,
    content: <p>Contenido...</p>,
  },
  // ... más tabs
]

<Tabs tabs={tabs} />
```

### Con Tab Deshabilitado

```tsx
const tabs: TabItem[] = [
  {
    id: 'available',
    label: 'Disponible',
    content: <p>Contenido disponible</p>,
  },
  {
    id: 'premium',
    label: 'Premium',
    content: <p>Contenido premium</p>,
    disabled: true, // Este tab no se puede seleccionar
  },
]

<Tabs tabs={tabs} />
```

### Con Callback de Cambio

```tsx
const handleTabChange = (tabId: string) => {
  console.log('Tab cambiado a:', tabId)
  // Aquí puedes hacer tracking, cargar datos, etc.
}

<Tabs 
  tabs={tabs} 
  onTabChange={handleTabChange}
/>
```

### Alineación Centrada

```tsx
<Tabs 
  tabs={tabs} 
  variant="pills"
  align="center"
/>
```

## Navegación por Teclado

El componente soporta navegación completa por teclado:

| Tecla | Acción |
|-------|--------|
| `←` (Flecha Izquierda) | Ir al tab anterior (circular) |
| `→` (Flecha Derecha) | Ir al siguiente tab (circular) |
| `Home` | Ir al primer tab |
| `End` | Ir al último tab |
| `Tab` | Mover el foco al contenido del tab |

**Nota**: Los tabs deshabilitados se saltan automáticamente durante la navegación por teclado.

## Accesibilidad

El componente implementa las mejores prácticas de accesibilidad:

- ✅ Roles ARIA correctos (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
- ✅ Atributos ARIA apropiados (`aria-selected`, `aria-controls`, `aria-labelledby`)
- ✅ Gestión de foco con `tabIndex`
- ✅ Navegación por teclado completa
- ✅ Indicadores visuales de foco (`focus:ring`)
- ✅ Texto alternativo para lectores de pantalla (`sr-only`)

## Casos de Uso

### Página de Detalle de Producto

```tsx
const productTabs: TabItem[] = [
  {
    id: 'description',
    label: 'Descripción',
    content: <ProductDescription />,
  },
  {
    id: 'specifications',
    label: 'Especificaciones',
    content: <SpecificationsTable />,
  },
  {
    id: 'reviews',
    label: 'Reviews (24)',
    content: <ReviewsList />,
  },
]

<Tabs tabs={productTabs} defaultActiveTab="description" />
```

### Dashboard de Usuario

```tsx
const dashboardTabs: TabItem[] = [
  {
    id: 'overview',
    label: 'Resumen',
    content: <DashboardOverview />,
  },
  {
    id: 'orders',
    label: 'Mis Pedidos',
    content: <OrdersList />,
  },
  {
    id: 'profile',
    label: 'Perfil',
    content: <ProfileSettings />,
  },
]

<Tabs tabs={dashboardTabs} variant="underline" />
```

### Filtros de Productos

```tsx
const filterTabs: TabItem[] = [
  {
    id: 'all',
    label: 'Todos',
    content: <ProductGrid filter="all" />,
  },
  {
    id: 'laptops',
    label: 'Laptops',
    content: <ProductGrid filter="laptops" />,
  },
  {
    id: 'components',
    label: 'Componentes',
    content: <ProductGrid filter="components" />,
  },
]

<Tabs tabs={filterTabs} variant="pills" align="center" />
```

## Personalización

### Estilos Personalizados

Puedes agregar clases CSS personalizadas al contenedor:

```tsx
<Tabs 
  tabs={tabs} 
  className="my-custom-class bg-gray-50 p-4 rounded-lg"
/>
```

### Contenido Dinámico

El contenido de los tabs puede ser cualquier componente React:

```tsx
const tabs: TabItem[] = [
  {
    id: 'chart',
    label: 'Gráfico',
    content: (
      <div>
        <h3>Ventas del Mes</h3>
        <LineChart data={salesData} />
      </div>
    ),
  },
  {
    id: 'table',
    label: 'Tabla',
    content: (
      <DataTable 
        columns={columns} 
        data={tableData}
      />
    ),
  },
]
```

## Requisitos Cumplidos

Este componente cumple con los siguientes requisitos del spec:

- **Requisito 8.1**: Implementación de tabs para navegación en página de detalle de producto
- **Navegación por pestañas**: Permite cambiar entre diferentes secciones de contenido
- **Indicador de tab activo**: Visual claro del tab seleccionado
- **Navegación por teclado**: Soporte completo para flechas, Home y End

## Notas de Implementación

- El componente usa `useState` para gestionar el tab activo
- Los refs se usan para gestionar el foco durante la navegación por teclado
- La navegación es circular (al llegar al final, vuelve al principio)
- Los tabs deshabilitados se saltan automáticamente
- El contenido del tab se renderiza solo cuando está activo (optimización)

## Testing

Para testear el componente:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs } from './Tabs'

test('cambia de tab al hacer clic', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1', content: <div>Contenido 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Contenido 2</div> },
  ]

  render(<Tabs tabs={tabs} />)
  
  // Verificar que el primer tab está activo
  expect(screen.getByText('Contenido 1')).toBeInTheDocument()
  
  // Hacer clic en el segundo tab
  fireEvent.click(screen.getByText('Tab 2'))
  
  // Verificar que el contenido cambió
  expect(screen.getByText('Contenido 2')).toBeInTheDocument()
})
```

## Referencias

- [WAI-ARIA Authoring Practices - Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
