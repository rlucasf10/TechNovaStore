# Footer Component

Componente de pie de página principal de la aplicación TechNovaStore.

## Ubicación

`frontend/src/components/layout/Footer.tsx`

## Descripción

El Footer es un componente completo y profesional que proporciona navegación adicional, información de contacto, suscripción a newsletter y enlaces legales. Está diseñado para ser responsive y mantener la consistencia visual con el resto de la aplicación.

## Características

### 1. Columnas de Navegación

El Footer incluye cuatro secciones principales de navegación:

- **Empresa**: Información sobre la compañía (Sobre Nosotros, Historia, Carreras, Prensa, Blog)
- **Ayuda**: Enlaces de soporte al cliente (Centro de Ayuda, FAQ, Seguimiento, Devoluciones, Garantías, Contacto)
- **Legal**: Enlaces legales y de privacidad (Términos, Privacidad, Cookies, Aviso Legal, Protección de Datos)
- **Redes Sociales**: Enlaces a perfiles sociales (Facebook, Twitter, Instagram, LinkedIn, YouTube)

### 2. Información de Contacto

Muestra información de contacto de la empresa:
- Dirección física
- Número de teléfono
- Email de contacto

### 3. Newsletter Signup

Formulario de suscripción a newsletter con:
- Input de email con validación
- Botón de suscripción con estados (normal, loading, success)
- Mensajes de feedback (éxito/error)
- Animación de confirmación

### 4. Métodos de Pago

Muestra los métodos de pago aceptados:
- Visa
- Mastercard
- American Express
- PayPal
- Transferencia bancaria

### 5. Copyright y Enlaces Legales

Sección inferior con:
- Copyright dinámico (año actual)
- Enlaces rápidos a términos, privacidad y cookies

## Uso

### Importación

```tsx
import { Footer } from '@/components/layout';
// o
import { Footer } from '@/components/ui'; // backward compatibility
```

### Ejemplo Básico

```tsx
export default function Page() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Contenido de la página */}
      </main>
      <Footer />
    </div>
  );
}
```

### En Layout

```tsx
export default function RootLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

## Diseño Responsive

### Desktop (lg+)
- Layout de 5 columnas (2 para info + 3 para enlaces)
- Newsletter en fila completa
- Métodos de pago en línea horizontal

### Tablet (md)
- Layout de 2 columnas
- Newsletter en fila completa
- Métodos de pago en línea horizontal

### Mobile (sm)
- Layout de 1 columna (stack vertical)
- Newsletter con botón debajo del input
- Métodos de pago en línea horizontal con scroll si es necesario

## Estilos

El Footer utiliza:
- **Fondo**: `bg-gray-900` (oscuro)
- **Texto**: `text-gray-300` (claro)
- **Enlaces hover**: `hover:text-white`
- **Botones**: Estilo primary de la aplicación
- **Iconos**: Lucide React icons

## Funcionalidad del Newsletter

### Estados

1. **Idle**: Estado inicial, formulario listo para usar
2. **Subscribing**: Mostrando spinner mientras se procesa
3. **Success**: Confirmación visual con checkmark
4. **Error**: Mensaje de error si el email es inválido

### Validación

- Email requerido
- Formato de email válido (contiene @)
- Deshabilitado durante el proceso de suscripción
- Deshabilitado después de suscripción exitosa

### Integración Backend

```typescript
// TODO: Implementar integración con servicio de newsletter
// Endpoint esperado: POST /api/newsletter/subscribe
// Body: { email: string }
// Response: { success: boolean, message: string }
```

## Accesibilidad

- Todos los enlaces tienen texto descriptivo
- Los iconos sociales tienen `aria-label`
- El formulario tiene validación HTML5
- Contraste de color WCAG 2.1 AA compliant
- Navegación por teclado completa

## Personalización

### Modificar Enlaces

Edita las constantes en el archivo:

```typescript
const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Empresa',
    links: [
      { label: 'Tu Enlace', href: '/tu-ruta' },
      // ...
    ],
  },
  // ...
];
```

### Modificar Redes Sociales

```typescript
const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'TuRed',
    href: 'https://tured.com/tuusuario',
    icon: <TuIcono className="w-5 h-5" />,
  },
  // ...
];
```

### Modificar Métodos de Pago

```typescript
const PAYMENT_METHODS = [
  { name: 'TuMetodo', logo: '🔒' },
  // ...
];
```

## Requisitos Cumplidos

- ✅ **Requisito 4.1**: Implementar columnas de navegación (Empresa, Ayuda, Legal, Redes Sociales)
- ✅ Formulario de newsletter signup funcional
- ✅ Métodos de pago aceptados visibles
- ✅ Copyright y enlaces legales
- ✅ Diseño responsive y mobile-first
- ✅ Consistencia visual con el Header

## Notas de Implementación

1. El componente es **client-side** (`'use client'`) debido al estado del formulario
2. La suscripción al newsletter es un placeholder que debe integrarse con el backend
3. Los enlaces sociales apuntan a URLs de ejemplo que deben actualizarse
4. El año del copyright se actualiza automáticamente
5. El Footer antiguo en `components/ui` se mantiene por compatibilidad pero re-exporta este componente

## Testing

Para probar el componente:

```bash
# Verificar que no hay errores de TypeScript
docker exec technovastore-frontend npx tsc --noEmit

# Verificar en el navegador
# Navegar a cualquier página que incluya el Footer
# Probar el formulario de newsletter
# Verificar responsive design en diferentes tamaños de pantalla
```

## Próximos Pasos

1. Integrar con servicio de newsletter del backend
2. Agregar analytics para tracking de clics en enlaces
3. Implementar lazy loading de iconos sociales
4. Agregar más métodos de pago según se integren
5. Considerar agregar un mapa del sitio en el footer
