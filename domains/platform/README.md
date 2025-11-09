# Platform Domain

Este dominio contiene los servicios de plataforma que proporcionan la infraestructura base para toda la aplicación TechNovaStore.

## Servicios

### API Gateway
**Puerto**: 3000  
**Descripción**: Gateway principal que enruta todas las peticiones HTTP a los microservicios correspondientes.

**Responsabilidades**:
- Enrutamiento de peticiones a microservicios
- Autenticación y autorización centralizada
- Rate limiting y protección contra ataques
- CORS y seguridad HTTP
- Monitoreo y métricas
- Documentación API (Swagger)

**Endpoints principales**:
- `/api/products` → Product Service
- `/api/auth` → User Service (Auth)
- `/api/users` → User Service
- `/api/orders` → Order Service
- `/api/payments` → Payment Service
- `/api/notifications` → Notification Service
- `/api/chat` → Chatbot Service
- `/health` → Health check
- `/metrics` → Prometheus metrics
- `/api-docs` → Swagger documentation

**Seguridad**:
- JWT authentication
- CSRF protection
- XSS protection
- Rate limiting por endpoint
- Security event monitoring
- SSL/TLS support

### Frontend
**Puerto**: 3011  
**Descripción**: Aplicación web Next.js que proporciona la interfaz de usuario.

**Características**:
- Server-side rendering (SSR)
- Static site generation (SSG)
- Optimización de imágenes
- Internacionalización (i18n)
- PWA support
- SEO optimizado

## Arquitectura

```
┌─────────────────┐
│    Frontend     │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │
│   (Express)     │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
    [Catalog]      [Commerce]     [Customer]     [Support]
    Services       Services       Services       Services
```

## Desarrollo

**IMPORTANTE**: Este proyecto usa Docker exclusivamente. NO ejecutar comandos npm directamente.

### Iniciar servicios con Docker

```bash
# Iniciar API Gateway
docker-compose -f docker-compose.optimized.yml up -d api-gateway

# Iniciar Frontend
docker-compose -f docker-compose.optimized.yml up -d frontend

# Ver logs en tiempo real
docker-compose -f docker-compose.optimized.yml logs -f api-gateway
docker-compose -f docker-compose.optimized.yml logs -f frontend
```

### Ejecutar tests en Docker

```bash
# API Gateway
docker exec technovastore-api-gateway npm test

# Frontend
docker exec technovastore-frontend npm test
```

### Compilar servicios en Docker

```bash
# API Gateway
docker exec technovastore-api-gateway npm run build

# Frontend
docker exec technovastore-frontend npm run build
```

### Reconstruir contenedores

```bash
# Reconstruir API Gateway
docker-compose -f docker-compose.optimized.yml up -d --build api-gateway

# Reconstruir Frontend
docker-compose -f docker-compose.optimized.yml up -d --build frontend
```

## Variables de Entorno

### API Gateway
- `PORT`: Puerto del servidor (default: 3000)
- `NODE_ENV`: Entorno de ejecución
- `JWT_SECRET`: Secret para JWT
- `PRODUCT_SERVICE_URL`: URL del servicio de productos
- `USER_SERVICE_URL`: URL del servicio de usuarios
- `ORDER_SERVICE_URL`: URL del servicio de pedidos
- `PAYMENT_SERVICE_URL`: URL del servicio de pagos
- `NOTIFICATION_SERVICE_URL`: URL del servicio de notificaciones
- `CHATBOT_SERVICE_URL`: URL del servicio de chatbot

### Frontend
- `NEXT_PUBLIC_API_URL`: URL del API Gateway
- `NEXT_PUBLIC_SOCKET_URL`: URL del servidor WebSocket
- `NEXT_PUBLIC_APP_URL`: URL de la aplicación

## Monitoreo

### Health Checks
- API Gateway: `http://localhost:3000/health`
- Frontend: `http://localhost:3011/api/health`

### Métricas
- API Gateway: `http://localhost:3000/metrics` (Prometheus format)

### Logs
Los logs se almacenan en:
- API Gateway: `domains/platform/api-gateway/logs/`
- Frontend: `domains/platform/frontend/.next/`

## Seguridad

### API Gateway
- Autenticación JWT
- CSRF protection
- XSS protection
- Rate limiting
- Security headers (Helmet)
- CORS configurado
- SSL/TLS support

### Frontend
- CSP (Content Security Policy)
- Sanitización de inputs
- Secure cookies
- HTTPS redirect
- XSS protection

## Documentación

- [API Gateway Documentation](./api-gateway/README.md)
- [Frontend Documentation](./frontend/README.md)
- [API Swagger Docs](http://localhost:3000/api-docs)
