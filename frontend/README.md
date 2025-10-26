# TechNovaStore Frontend

Frontend de la aplicación TechNovaStore construido con Next.js 14, React 18, TypeScript y Tailwind CSS.

## Tecnologías Utilizadas

- **Next.js 14** - Framework de React con App Router
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS** - Framework de CSS utilitario
- **React Query (TanStack Query)** - Gestión de estado del servidor
- **Axios** - Cliente HTTP para APIs

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── globals.css        # Estilos globales con Tailwind
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página de inicio
│   ├── providers.tsx      # Proveedores de React Query
│   ├── carrito/           # Página del carrito
│   ├── login/             # Página de login
│   └── productos/         # Página de productos
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes de interfaz básicos
├── hooks/                # Custom hooks de React Query
├── lib/                  # Utilidades y configuraciones
├── types/                # Definiciones de tipos TypeScript
└── utils/                # Funciones utilitarias
```

## Configuración

### Variables de Entorno

Copia `.env.local.example` a `.env.local` y configura las variables:

```bash
cp .env.local.example .env.local
```

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3001](http://localhost:3001)

### Build de Producción

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Características Implementadas

### ✅ Configuración Base
- [x] Estructura de proyecto Next.js con App Router
- [x] Configuración de Tailwind CSS
- [x] Sistema de routing básico
- [x] Configuración de React Query
- [x] Configuración de TypeScript
- [x] Configuración de ESLint

### ✅ Componentes UI Básicos
- [x] Button component con variantes
- [x] Input component con validación
- [x] Loading components
- [x] Layout responsive

### ✅ Hooks y Utilidades
- [x] Hooks de React Query para productos
- [x] Hooks de React Query para categorías
- [x] Cliente API con Axios
- [x] Funciones utilitarias (formateo, slugify, etc.)

### ✅ Páginas Base
- [x] Página de inicio con hero section
- [x] Página de productos (placeholder)
- [x] Página de carrito (placeholder)
- [x] Página de login
- [x] Layout responsive con navegación

## Próximos Pasos

Las siguientes funcionalidades se implementarán en las tareas posteriores:

- **Tarea 9.2**: Componentes del catálogo de productos
- **Tarea 9.3**: Proceso de compra
- **Tarea 9.4**: Dashboard de usuario
- **Tarea 9.5**: Integración del chatbot

## Arquitectura

### Gestión de Estado
- **React Query** para estado del servidor (productos, categorías, pedidos)
- **React Context** para estado global de la aplicación
- **Local Storage** para persistencia de datos del usuario

### Routing
- **App Router** de Next.js para navegación
- **Dynamic Routes** para páginas de productos y categorías
- **Middleware** para autenticación y autorización

### Estilos
- **Tailwind CSS** para estilos utilitarios
- **CSS Modules** para componentes específicos cuando sea necesario
- **Responsive Design** mobile-first

### Performance
- **Server-Side Rendering (SSR)** para SEO
- **Static Generation** para páginas estáticas
- **Image Optimization** con Next.js Image
- **Code Splitting** automático

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Tests (cuando se implementen)
npm test
npm run test:e2e
```