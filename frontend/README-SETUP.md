# Frontend TechNovaStore - Configuración del Proyecto

## 📋 Descripción

Frontend moderno de TechNovaStore construido con Next.js 15, React 18, TypeScript y Tailwind CSS. Diseñado para ofrecer una experiencia de usuario excepcional en una plataforma de e-commerce especializada en tecnología.

## 🚀 Stack Tecnológico

### Core
- **Next.js 15** - Framework React con App Router, SSR y SSG
- **React 18** - Biblioteca de UI
- **TypeScript** - Type safety y mejor DX
- **Tailwind CSS** - Framework de estilos utility-first

### Estado y Data Fetching
- **React Query (@tanstack/react-query)** - Gestión de estado del servidor y caché
- **Zustand** - Gestión de estado global del cliente
- **Axios** - Cliente HTTP con interceptors

### Formularios y Validación
- **React Hook Form** - Gestión de formularios performante
- **Zod** - Validación de esquemas TypeScript-first

### Comunicación en Tiempo Real
- **Socket.IO Client** - WebSockets para chat en tiempo real

### Animaciones
- **Framer Motion** - Animaciones fluidas y declarativas

### Testing
- **Jest** - Framework de testing unitario
- **React Testing Library** - Testing de componentes
- **Playwright** - Testing E2E

### Linting y Formatting
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **TypeScript ESLint** - Reglas de TypeScript

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rutas de autenticación
│   │   ├── (public)/          # Rutas públicas
│   │   ├── admin/             # Dashboard de administración
│   │   ├── dashboard/         # Dashboard de usuario
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página de inicio
│   │   └── globals.css        # Estilos globales
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes base (Button, Input, etc.)
│   │   ├── layout/           # Componentes de layout (Header, Footer)
│   │   ├── product/          # Componentes de productos
│   │   ├── cart/             # Componentes de carrito
│   │   ├── chat/             # ChatWidget y relacionados
│   │   └── admin/            # Componentes de administración
│   ├── hooks/                # Custom React Hooks
│   ├── lib/                  # Utilidades y configuraciones
│   │   ├── axios.ts          # Configuración de Axios
│   │   ├── react-query.ts    # Configuración de React Query
│   │   └── utils.ts          # Utilidades generales
│   ├── services/             # Servicios de API
│   ├── store/                # Estado global (Zustand)
│   ├── types/                # Definiciones de TypeScript
│   └── styles/               # Estilos adicionales
│       └── variables.css     # Variables CSS personalizadas
├── public/                   # Assets estáticos
├── .eslintrc.json           # Configuración de ESLint
├── .prettierrc              # Configuración de Prettier
├── next.config.js           # Configuración de Next.js
├── tailwind.config.js       # Configuración de Tailwind CSS
├── tsconfig.json            # Configuración de TypeScript
└── package.json             # Dependencias y scripts
```

## 🛠️ Configuración Realizada

### 1. TypeScript con Strict Mode ✅
- `strict: true` habilitado
- `noUnusedLocals` y `noUnusedParameters` activados
- `forceConsistentCasingInFileNames` habilitado
- Path aliases configurados:
  - `@/*` → `./src/*`
  - `@/components/*` → `./src/components/*`
  - `@/lib/*` → `./src/lib/*`
  - `@/hooks/*` → `./src/hooks/*`
  - `@/types/*` → `./src/types/*`
  - `@/services/*` → `./src/services/*`
  - `@/store/*` → `./src/store/*`
  - `@/styles/*` → `./src/styles/*`

### 2. Tailwind CSS con Tema Personalizado ✅
- Paleta de colores completa (primary, accent, gray, semantic)
- Tema oscuro configurado con `darkMode: 'class'`
- Variables CSS personalizadas en `src/styles/variables.css`
- Tipografía: Inter (sans) y JetBrains Mono (mono)
- Animaciones personalizadas: fade-in, slide-up, slide-down, shimmer
- Breakpoints responsivos configurados
- Plugins: @tailwindcss/forms, @tailwindcss/typography

### 3. ESLint y Prettier ✅
- ESLint configurado con reglas de Next.js y TypeScript
- Prettier integrado con ESLint
- Scripts de formateo: `npm run format` y `npm run format:check`
- Reglas personalizadas para mejor DX

### 4. Next.js Optimizado ✅
- App Router habilitado
- Headers de seguridad configurados
- Optimización de imágenes (WebP, AVIF)
- Code splitting automático
- Variables de entorno configuradas
- Hot reload optimizado para Docker

### 5. Dependencias Instaladas ✅
- React Query para data fetching
- Zustand para estado global
- Socket.IO Client para chat en tiempo real
- Axios con interceptors
- React Hook Form + Zod para formularios
- Framer Motion para animaciones

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Build
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Linting y Formateo
npm run lint             # Ejecutar ESLint
npm run lint:check       # Verificar errores de ESLint
npm run format           # Formatear código con Prettier
npm run format:check     # Verificar formateo

# Type Checking
npm run type-check       # Verificar tipos de TypeScript

# Testing
npm run test             # Ejecutar tests unitarios
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con coverage
npm run test:e2e         # Tests E2E con Playwright
```

## 🎨 Sistema de Diseño

### Colores
- **Primary**: Azul (#3b82f6) - Acciones principales
- **Accent**: Púrpura (#8b5cf6) - CTAs especiales
- **Success**: Verde (#10b981) - Éxito
- **Warning**: Amarillo (#f59e0b) - Advertencias
- **Error**: Rojo (#ef4444) - Errores
- **Info**: Azul (#3b82f6) - Información

### Tipografía
- **Sans**: Inter - Texto general
- **Mono**: JetBrains Mono - Código y datos técnicos

### Espaciado
Sistema basado en 4px: 1, 2, 3, 4, 6, 8, 12, 16, 24

### Breakpoints
- xs: 475px
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## 🔧 Próximos Pasos

1. **Instalar dependencias**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno**:
   - Copiar `.env.local.example` a `.env.local`
   - Configurar las URLs de los servicios

3. **Iniciar desarrollo**:
   ```bash
   npm run dev
   ```

4. **Implementar componentes base** (Fase 2 del plan):
   - Button, Input, Card, Modal, Dropdown, Badge, Spinner, Rating
   - Breadcrumbs, Pagination, Tabs, Skeleton Loader

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

## ✅ Checklist de Configuración

- [x] Proyecto Next.js 15 con App Router
- [x] TypeScript con strict mode
- [x] Tailwind CSS con tema personalizado
- [x] ESLint y Prettier configurados
- [x] Path aliases configurados
- [x] React Query instalado y configurado
- [x] Zustand instalado
- [x] Socket.IO Client instalado
- [x] Axios con interceptors configurado
- [x] React Hook Form + Zod instalados
- [x] Framer Motion instalado
- [x] Variables CSS personalizadas
- [x] Headers de seguridad configurados
- [x] Estructura de carpetas creada

## 🎯 Requisitos Cumplidos

✅ **Requisito 1.1**: Next.js 15 con App Router  
✅ **Requisito 1.2**: TypeScript con strict mode  
✅ **Requisito 1.3**: Tailwind CSS con custom theme  
✅ **Requisito 1.4**: React Query configurado  
✅ **Requisito 1.5**: Socket.IO Client instalado  
✅ **Requisito 21.1**: Paleta de colores moderna  
✅ **Requisito 21.2**: Tipografía profesional  
✅ **Requisito 21.3**: Espaciado estratégico  
✅ **Requisito 21.4**: Modo oscuro opcional  
✅ **Requisito 21.5**: Consistencia visual
