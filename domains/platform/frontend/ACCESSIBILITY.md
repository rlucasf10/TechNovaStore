# Guía de Accesibilidad - TechNovaStore Frontend

Esta guía documenta las prácticas de accesibilidad implementadas en el frontend de TechNovaStore para cumplir con WCAG 2.1 nivel AA.

## Tabla de Contenidos

1. [Navegación por Teclado](#navegación-por-teclado)
2. [Skip Links](#skip-links)
3. [Focus Visible](#focus-visible)
4. [Hooks de Accesibilidad](#hooks-de-accesibilidad)
5. [Componentes Accesibles](#componentes-accesibles)
6. [Testing de Accesibilidad](#testing-de-accesibilidad)

## Navegación por Teclado

### Principios Básicos

Todos los elementos interactivos deben ser accesibles mediante teclado:

- **Tab**: Navegar al siguiente elemento
- **Shift + Tab**: Navegar al elemento anterior
- **Enter/Space**: Activar botones y enlaces
- **Escape**: Cerrar modales y dropdowns
- **Arrow Keys**: Navegar dentro de listas y menús

### Implementación

```typescript
// Ejemplo: Navegación en un menú
import { useKeyboardNavigation } from '@/shared/hooks/useKeyboardNavigation'

function MyMenu() {
  const { focusedIndex, handleKeyDown } = useKeyboardNavigation({
    itemCount: items.length,
    onSelect: (index) => handleItemClick(items[index]),
    onEscape: closeMenu,
  })

  return (
    <div onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <button
          key={item.id}
          className={focusedIndex === index ? 'focused' : ''}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

## Skip Links

Los skip links permiten a usuarios de teclado saltar directamente a secciones importantes.

### Uso

El componente `SkipLinks` está incluido en el layout principal:

```typescript
import { SkipLinks } from '@/shared/components/ui/SkipLinks'

// En layout.tsx
<SkipLinks />
```

### Skip Links Disponibles

- **#main-content**: Contenido principal
- **#main-navigation**: Navegación principal
- **#search**: Barra de búsqueda
- **#footer**: Pie de página

### Agregar Nuevos Skip Links

```typescript
<SkipLinks
  links={[
    { href: '#main-content', label: 'Saltar al contenido' },
    { href: '#custom-section', label: 'Saltar a sección personalizada' },
  ]}
/>
```

## Focus Visible

### Estilos Globales

Los estilos de focus están definidos en `globals.css`:

```css
/* Focus visible para todos los elementos */
*:focus-visible {
  outline: 2px solid theme('colors.primary.600');
  outline-offset: 2px;
  border-radius: 4px;
}

/* Focus específico para botones */
button:focus-visible {
  outline: 2px solid theme('colors.primary.600');
  ring: 2px theme('colors.primary.500');
  ring-offset: 2px;
}
```

### Personalizar Focus en Componentes

```typescript
// Usar clases de Tailwind
<button className="focus:ring-2 focus:ring-primary-500 focus:outline-none">
  Mi Botón
</button>

// O usar focus-visible para solo mostrar en navegación por teclado
<button className="focus-visible:ring-2 focus-visible:ring-primary-500">
  Mi Botón
</button>
```

## Hooks de Accesibilidad

### useKeyboardNavigation

Proporciona navegación por teclado para listas y menús.

```typescript
import { useKeyboardNavigation } from '@/shared/hooks/useKeyboardNavigation'

const { focusedIndex, handleKeyDown, moveFocus } = useKeyboardNavigation({
  itemCount: 10,
  onSelect: (index) => console.log('Selected:', index),
  onEscape: () => console.log('Escaped'),
  loop: true, // Navegación circular
  orientation: 'vertical', // o 'horizontal'
})
```

### useFocusTrap

Atrapa el foco dentro de un contenedor (útil para modales).

```typescript
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'

function MyModal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null)

  useFocusTrap({
    containerRef: modalRef,
    isActive: isOpen,
    onEscape: onClose,
  })

  return (
    <div ref={modalRef}>
      {/* Contenido del modal */}
    </div>
  )
}
```

## Componentes Accesibles

### Modal

```typescript
import { Modal } from '@/ui'

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Mi Modal"
  // El modal incluye:
  // - Trap de foco automático
  // - Cierre con Escape
  // - aria-modal="true"
  // - role="dialog"
>
  Contenido
</Modal>
```

### Dropdown

```typescript
import { Dropdown } from '@/ui'

<Dropdown
  trigger={<button>Abrir Menú</button>}
  // El dropdown incluye:
  // - Navegación con flechas
  // - Cierre con Escape
  // - aria-haspopup="true"
  // - aria-expanded
>
  <DropdownItem>Opción 1</DropdownItem>
  <DropdownItem>Opción 2</DropdownItem>
</Dropdown>
```

### Tabs

```typescript
import { Tabs } from '@/ui'

<Tabs
  tabs={[
    { id: 'tab1', label: 'Tab 1', content: <div>Contenido 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Contenido 2</div> },
  ]}
  // Los tabs incluyen:
  // - Navegación con flechas
  // - role="tablist", role="tab", role="tabpanel"
  // - aria-selected, aria-controls
/>
```

## Testing de Accesibilidad

### Herramientas Recomendadas

1. **axe DevTools** (Extensión de navegador)
   - Detecta problemas de accesibilidad automáticamente
   - https://www.deque.com/axe/devtools/

2. **WAVE** (Extensión de navegador)
   - Evaluación visual de accesibilidad
   - https://wave.webaim.org/extension/

3. **Lighthouse** (Chrome DevTools)
   - Auditoría de accesibilidad integrada
   - Incluye puntuación y recomendaciones

### Testing Manual

#### Navegación por Teclado

1. Desconectar el mouse
2. Usar solo Tab, Shift+Tab, Enter, Escape, Flechas
3. Verificar que:
   - Todos los elementos interactivos son accesibles
   - El orden de tabulación es lógico
   - El focus es siempre visible
   - No hay trampas de teclado

#### Lectores de Pantalla

1. **NVDA** (Windows, gratuito)
   - https://www.nvaccess.org/

2. **JAWS** (Windows, comercial)
   - https://www.freedomscientific.com/products/software/jaws/

3. **VoiceOver** (macOS/iOS, integrado)
   - Activar con Cmd+F5

4. **TalkBack** (Android, integrado)

### Checklist de Accesibilidad

- [ ] Todos los elementos interactivos son accesibles por teclado
- [ ] El focus es visible en todos los elementos
- [ ] Los skip links funcionan correctamente
- [ ] Los modales atrapan el foco
- [ ] Los dropdowns se cierran con Escape
- [ ] Las listas permiten navegación con flechas
- [ ] Todas las imágenes tienen alt text
- [ ] Los formularios tienen labels asociados
- [ ] Los errores se anuncian a lectores de pantalla
- [ ] El contraste de colores cumple WCAG AA (4.5:1)
- [ ] Los botones tienen tamaño mínimo de 44x44px
- [ ] Los enlaces tienen texto descriptivo
- [ ] Los headings siguen jerarquía lógica (h1, h2, h3...)

## Recursos Adicionales

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

## Contacto

Si encuentras problemas de accesibilidad, por favor reporta en:
- GitHub Issues
- Email: accessibility@technovastore.com
