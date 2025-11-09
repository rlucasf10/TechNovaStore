# Componentes de Autenticación

Este directorio contiene los componentes compartidos para todas las páginas de autenticación (login, registro, recuperación de contraseña).

## Componentes

### AuthLayout

Layout principal para páginas de autenticación. Proporciona:

- Diseño centrado y responsive
- Header con logo de TechNovaStore
- Fondo con gradiente y efectos visuales
- Footer con enlaces legales
- Botón opcional "Volver al inicio"

**Uso:**

```tsx
import { AuthLayout } from '@/components/auth';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión en tu cuenta de TechNovaStore"
      showBackToHome={true}
    >
      {/* Contenido del formulario */}
    </AuthLayout>
  );
}
```

**Props:**

- `children`: React.ReactNode - Contenido del formulario
- `title`: string - Título principal de la página
- `subtitle?`: string - Subtítulo opcional
- `showBackToHome?`: boolean - Mostrar botón "Volver al inicio" (default: true)

### AuthCard

Card reutilizable para contenido de autenticación. Puede usarse dentro de AuthLayout o de forma independiente.

**Uso:**

```tsx
import { AuthCard } from '@/components/auth';

<AuthCard title="Título del card" subtitle="Subtítulo opcional" footer={<div>Footer opcional</div>}>
  {/* Contenido */}
</AuthCard>;
```

**Props:**

- `children`: React.ReactNode - Contenido principal
- `title?`: string - Título del card (opcional)
- `subtitle?`: string - Subtítulo del card (opcional)
- `footer?`: React.ReactNode - Footer del card (opcional)

### AuthDivider

Divider con texto para separar secciones en formularios de autenticación. Comúnmente usado para separar login con email vs OAuth.

**Uso:**

```tsx
import { AuthDivider } from '@/components/auth';

<AuthDivider text="O continúa con" />;
```

**Props:**

- `text?`: string - Texto del divider (default: "o")

## Diseño Visual

### Paleta de Colores

- **Fondo**: Gradiente de `primary-50` a `accent-50` con blanco en el centro
- **Card**: Fondo blanco con sombra `shadow-xl` y bordes redondeados `rounded-2xl`
- **Botones primarios**: Gradiente de `primary-600` a `primary-700`
- **Enlaces**: Color `primary-600` con hover `primary-500`

### Efectos Visuales

- **Fondo decorativo**: Círculos difuminados con `blur-3xl` para efecto de profundidad
- **Animaciones**: Transiciones suaves en hover y focus
- **Responsive**: Diseño mobile-first que se adapta a todos los tamaños de pantalla

## Páginas que Usan estos Componentes

- `/login` - Página de inicio de sesión
- `/registro` - Página de registro
- `/recuperar-contrasena` - Página de recuperación de contraseña (próximamente)
- `/reset-password` - Página de restablecimiento de contraseña (próximamente)

## Requisitos Cumplidos

Esta implementación cumple con los siguientes requisitos del spec:

- **Requisito 20.6**: Páginas de Login, Registro y Recuperación con diseño consistente
- **Requisito 21.5**: Estilo visual profesional y moderno
- **Requisito 4.1**: Diseño responsive y mobile-first
- **Requisito 5.1**: Accesibilidad con contraste adecuado y HTML semántico

## Próximos Pasos

Los siguientes componentes serán implementados en tareas futuras:

- `PasswordStrengthIndicator` - Indicador visual de fortaleza de contraseña
- `SocialLoginButtons` - Botones de login con Google y GitHub
- `SetPasswordModal` - Modal para establecer contraseña (usuarios OAuth)
- Páginas de recuperación y restablecimiento de contraseña
