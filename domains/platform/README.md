# Dominio: Platform (Plataforma)

## Propósito

Este dominio es responsable de la **infraestructura de la plataforma**, incluyendo el API Gateway que orquesta todas las peticiones y el frontend que proporciona la interfaz de usuario.

## Responsabilidades

- **API Gateway**: Punto de entrada único para todas las peticiones, enrutamiento, autenticación y rate limiting
- **Frontend**: Aplicación web con Next.js que proporciona la interfaz de usuario
- **Orquestación**: Coordinación de llamadas entre microservicios

## Servicios Incluidos

- `api-gateway`: Gateway principal que enruta peticiones a microservicios
- `frontend`: Aplicación web frontend con Next.js

## Casos de Uso Principales

1. Enrutar peticiones HTTP a microservicios correspondientes
2. Validar tokens JWT y autenticación
3. Aplicar rate limiting y throttling
4. Agregar respuestas de múltiples microservicios
5. Proporcionar interfaz de usuario responsive
6. Gestionar estado de la aplicación en el cliente
7. Implementar Server-Side Rendering (SSR)

## Dependencias

- **Redis**: Cache de respuestas y rate limiting
- **Todos los microservicios**: El gateway se comunica con todos los servicios
- **CDN**: Para servir assets estáticos del frontend

## Características del API Gateway

- **Autenticación**: Validación de tokens JWT
- **Autorización**: Control de acceso basado en roles
- **Rate Limiting**: Límite de peticiones por usuario/IP
- **Circuit Breaker**: Protección contra fallos en cascada
- **Request/Response Logging**: Logs estructurados de todas las peticiones
- **CORS**: Configuración de CORS para el frontend
- **Compression**: Compresión de respuestas
- **Caching**: Cache de respuestas frecuentes

## Características del Frontend

- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utility-first
- **Zustand**: Gestión de estado global
- **React Query**: Cache y sincronización de datos del servidor
- **SSR/SSG**: Renderizado del lado del servidor y generación estática
- **Responsive Design**: Diseño adaptable a todos los dispositivos
- **Accesibilidad**: Cumplimiento de estándares WCAG

## Eventos Publicados

- `api.request`: Cuando se recibe una petición en el gateway
- `api.response`: Cuando se envía una respuesta desde el gateway
- `api.error`: Cuando ocurre un error en el gateway
- `frontend.page.view`: Cuando se visualiza una página
- `frontend.user.action`: Cuando el usuario realiza una acción

## Eventos Consumidos

- Todos los eventos de todos los dominios (para logging y monitoreo)
