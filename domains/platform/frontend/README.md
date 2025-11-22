# TechNovaStore Frontend

Aplicación web frontend para TechNovaStore - E-commerce de tecnología e informática.

## Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Validación**: Zod
- **HTTP Client**: Axios
- **Testing**: Playwright (E2E), Jest (Unit)

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                  # App Router de Next.js
│   │   ├── (auth)/          # Rutas de autenticación
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── productos/       # Catálogo de productos
│   │   ├── carrito/         # Carrito de compras
│   │   ├── checkout/        # Proceso de compra
│   │   ├── pedidos/         # Historial de pedidos
│   │   ├── perfil/          # Perfil de usuario
│   │   ├── dashboard/       # Dashboard admin
│   │   └── layout.tsx       # Layout principal
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/              # Componentes UI básicos
│   │   ├── layout/          # Componentes de layout
│   │   ├── product/         # Componentes de productos
│   │   ├── cart/            # Componentes de carrito
│   │   └── checkout/        # Componentes de checkout
│   ├── features/            # Features por dominio
│   │   ├── auth/            # Autenticación
│   │   ├── products/        # Productos
│   │   ├── cart/            # Carrito
│   │   ├── orders/          # Pedidos
│   │   └── customer/        # Cliente
│   ├── lib/                 # Utilidades y configuración
│   │   ├── api/             # Clientes API
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utilidades
│   │   └── constants/       # Constantes
│   ├── stores/              # Stores de Zustand
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── notificationStore.ts
│   │   └── themeStore.ts
│   ├── styles/              # Estilos globales
│   │   └── globals.css
│   └── types/               # Tipos TypeScript
│       └── index.ts
├── public/                  # Archivos estáticos
│   ├── images/
│   └── icons/
├── test/                    # Tests E2E
│   └── e2e/
└── playwright.config.ts     # Configuración de Playwright
```

## Características Principales

### 1. Catálogo de Productos
- Listado de productos con paginación
- Búsqueda de texto completo
- Filtros por categoría, marca, precio
- Vista de detalles de producto
- Imágenes con zoom
- Especificaciones técnicas

### 2. Carrito de Compras
- Agregar/eliminar productos
- Actualizar cantidades
- Cálculo automático de totales
- Persistencia en localStorage
- Sincronización con backend

### 3. Proceso de Checkout
- Formulario de dirección de envío
- Selección de método de pago
- Resumen de pedido
- Confirmación de compra
- Integración con Payment Service

### 4. Gestión de Pedidos
- Historial de pedidos
- Detalles de pedido
- Seguimiento de envío
- Estado de pago
- Facturas descargables

### 5. Autenticación
- Registro de usuarios
- Login con email/contraseña
- Login con Google OAuth
- Login con GitHub OAuth
- Recuperación de contraseña
- Gestión de perfil

### 6. Dashboard Admin
- Gestión de productos (CRUD)
- Gestión de pedidos
- Estadísticas de ventas
- Gestión de usuarios
- Configuración del sistema

### 7. Chatbot
- Asistente virtual en tiempo real
- Búsqueda de productos por voz
- Recomendaciones personalizadas
- Soporte al cliente

### 8. Recomendaciones
- Productos relacionados
- Productos similares
- Productos trending
- Recomendaciones personalizadas

## Páginas Principales

### Públicas
- `/` - Página de inicio
- `/productos` - Catálogo de productos
- `/productos/[id]` - Detalle de producto
- `/ofertas` - Ofertas especiales
- `/login` - Iniciar sesión
- `/register` - Registrarse

### Autenticadas
- `/carrito` - Carrito de compras
- `/checkout` - Proceso de compra
- `/pedidos` - Historial de pedidos
- `/pedidos/[id]` - Detalle de pedido
- `/perfil` - Perfil de usuario
- `/perfil/direcciones` - Direcciones de envío
- `/perfil/seguridad` - Configuración de seguridad

### Admin
- `/dashboard` - Dashboard principal
- `/dashboard/productos` - Gestión de productos
- `/dashboard/pedidos` - Gestión de pedidos
- `/dashboard/usuarios` - Gestión de usuarios
- `/dashboard/estadisticas` - Estadísticas

## Desarrollo

### Instalación

```bash
# Instalar dependencias
npm install
```

### Desarrollo Local

```bash
# Ejecutar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3011
```

### Build de Producción

```bash
# Compilar para producción
npm run build

# Ejecutar build de producción
npm start
```

### Tests

```bash
# Tests unitarios
npm test

# Tests E2E con Playwright
npm run test:e2e

# Tests E2E en modo UI
npm run test:e2e:ui

# Tests E2E con reporte
npm run test:e2e:report
```

### Linting y Formato

```bash
# Ejecutar ESLint
npm run lint

# Formatear código con Prettier
npm run format
```

## Variables de Entorno

Crear archivo `.env.local`:

```env
# API Gateway
NEXT_PUBLIC_API_URL=http://localhost:3000

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id

# Features
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_RECOMMENDATIONS=true

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your-ga-tracking-id
```

## Stores de Estado

### Auth Store
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}
```

### Cart Store
```typescript
interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}
```

### Notification Store
```typescript
interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}
```

## Componentes UI Reutilizables

- `Button` - Botón con variantes
- `Input` - Campo de entrada
- `Select` - Selector dropdown
- `Modal` - Modal/Dialog
- `Card` - Tarjeta de contenido
- `Badge` - Badge/Etiqueta
- `Spinner` - Indicador de carga
- `Alert` - Alertas y notificaciones
- `Tabs` - Pestañas
- `Accordion` - Acordeón

## Integración con Backend

### API Client

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Interceptor para agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Servicios

- `authService` - Autenticación
- `productService` - Productos
- `cartService` - Carrito
- `orderService` - Pedidos
- `userService` - Usuario
- `chatbotService` - Chatbot
- `recommendationService` - Recomendaciones

## Optimizaciones

### Performance
- Server Components por defecto
- Lazy loading de componentes
- Optimización de imágenes con Next/Image
- Code splitting automático
- Caché de API con SWR

### SEO
- Metadata dinámica
- Open Graph tags
- Sitemap automático
- Robots.txt
- Structured data (JSON-LD)

### Accesibilidad
- Semantic HTML
- ARIA labels
- Navegación por teclado
- Contraste de colores WCAG AA
- Screen reader friendly

## Docker

### Desarrollo

```bash
# Construir imagen de desarrollo
docker build -f Dockerfile.dev -t technovastore-frontend:dev .

# Ejecutar contenedor de desarrollo
docker run -p 3011:3011 \
  -v $(pwd):/app \
  -v /app/node_modules \
  technovastore-frontend:dev
```

### Producción

```bash
# Construir imagen de producción
docker build -t technovastore-frontend:prod .

# Ejecutar contenedor de producción
docker run -p 3011:3011 \
  -e NEXT_PUBLIC_API_URL=https://api.technovastore.com \
  technovastore-frontend:prod
```

## Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Compose

El frontend está incluido en `docker-compose.optimized.yml`:

```bash
# Levantar todos los servicios
docker-compose -f docker-compose.optimized.yml up -d

# Solo frontend
docker-compose -f docker-compose.optimized.yml up -d frontend
```

## Troubleshooting

### Error: Cannot find module

```bash
# Limpiar caché y reinstalar
rm -rf node_modules .next
npm install
```

### Error: Port 3011 already in use

```bash
# Cambiar puerto en package.json
"dev": "next dev -p 3012"
```

### Error: Build fails with TypeScript errors

```bash
# Verificar tipos
npx tsc --noEmit

# Ignorar errores de build (no recomendado)
# next.config.js
typescript: {
  ignoreBuildErrors: true,
}
```

## Contribución

1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto es parte de TechNovaStore y está bajo licencia MIT.
