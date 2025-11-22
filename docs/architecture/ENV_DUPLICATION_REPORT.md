# Reporte de Análisis de Duplicaciones de Archivos .env

**Fecha de análisis:** 6/11/2025, 23:17:16

---

## 1. Resumen Ejecutivo

- **Total de archivos .env encontrados:** 8
- **Variables únicas duplicadas:** 51
- **Pares de archivos similares (>20%):** 7

## 2. Archivos .env Encontrados

### Root

- `.env.docker`
- `.env.docker.example`
- `.env.logging.example`
- `.env.prod.example`
- `.env.shared.example`
- `.env.staging.example`

### Frontend

- `frontend/.env.local.example`

### ApiGateway

- `api-gateway/.env.security.example`

## 3. Variables Más Duplicadas (Top 30)

| Variable | Archivos | Ubicaciones |
|----------|----------|-------------|
| `JWT_SECRET` | 5 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example`<br>`api-gateway/.env.security.example` |
| `NEXT_PUBLIC_API_URL` | 5 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `NEXT_PUBLIC_APP_URL` | 5 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `NEXT_PUBLIC_CHATBOT_URL` | 5 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `NEXT_PUBLIC_SOCKET_URL` | 5 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `RATE_LIMIT_WINDOW_MS` | 5 | `.env.docker`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example`<br>`api-gateway/.env.security.example` |
| `LOG_LEVEL` | 5 | `.env.docker`<br>`.env.docker.example`<br>`.env.logging.example`<br>`.env.prod.example`<br>`.env.staging.example` |
| `POSTGRES_PASSWORD` | 4 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example` |
| `REDIS_PASSWORD` | 4 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 4 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | 4 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | 4 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `NEXT_PUBLIC_SENTRY_DSN` | 4 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example`<br>`frontend/.env.local.example` |
| `RATE_LIMIT_MAX_REQUESTS` | 4 | `.env.docker`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `NODE_ENV` | 4 | `.env.docker`<br>`.env.docker.example`<br>`.env.prod.example`<br>`.env.staging.example` |
| `SMTP_USER` | 4 | `.env.docker.example`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `SMTP_PASS` | 4 | `.env.docker.example`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `AMAZON_API_KEY` | 4 | `.env.docker.example`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `ALIEXPRESS_API_KEY` | 4 | `.env.docker.example`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `EBAY_API_KEY` | 4 | `.env.docker.example`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `BANGGOOD_API_KEY` | 4 | `.env.docker.example`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `NEWEGG_API_KEY` | 4 | `.env.docker.example`<br>`.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `MONGO_USERNAME` | 3 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example` |
| `MONGO_PASSWORD` | 3 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example` |
| `POSTGRES_USERNAME` | 3 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example` |
| `FRONTEND_URL` | 3 | `.env.docker`<br>`.env.docker.example`<br>`.env.staging.example` |
| `CSRF_ENABLED` | 3 | `.env.docker`<br>`.env.shared.example`<br>`api-gateway/.env.security.example` |
| `AMAZON_SECRET_KEY` | 3 | `.env.docker.example`<br>`.env.shared.example`<br>`.env.staging.example` |
| `ELASTICSEARCH_ENABLED` | 3 | `.env.logging.example`<br>`.env.prod.example`<br>`.env.staging.example` |
| `SMTP_HOST` | 3 | `.env.prod.example`<br>`.env.shared.example`<br>`.env.staging.example` |

## 4. Archivos Similares (Top 15)

| # | Archivo 1 | Archivo 2 | Similitud | Variables Compartidas |
|---|-----------|-----------|-----------|----------------------|
| 1 | `.env.docker.example` | `.env.staging.example` | 59.5% | 25/42 |
| 2 | `.env.docker` | `.env.docker.example` | 42.5% | 17/40 |
| 3 | `.env.docker` | `.env.staging.example` | 42.2% | 19/45 |
| 4 | `.env.docker.example` | `.env.prod.example` | 35.1% | 20/57 |
| 5 | `.env.prod.example` | `.env.staging.example` | 33.3% | 21/63 |
| 6 | `.env.docker` | `frontend/.env.local.example` | 25.8% | 8/31 |
| 7 | `.env.docker.example` | `frontend/.env.local.example` | 23.5% | 8/34 |

## 5. Análisis de Variables por Categoría

### Database

Variables duplicadas: 8

- `MONGO_USERNAME` (3 archivos)
- `MONGO_PASSWORD` (3 archivos)
- `POSTGRES_USERNAME` (3 archivos)
- `POSTGRES_PASSWORD` (4 archivos)
- `REDIS_PASSWORD` (4 archivos)
- `MONGO_ROOT_USERNAME` (2 archivos)
- `MONGO_ROOT_PASSWORD` (2 archivos)
- `POSTGRES_USER` (2 archivos)

### Security

Variables duplicadas: 10

- `MONGO_PASSWORD` (3 archivos)
- `POSTGRES_PASSWORD` (4 archivos)
- `REDIS_PASSWORD` (4 archivos)
- `JWT_SECRET` (5 archivos)
- `CSRF_ENABLED` (3 archivos)
- `MONGO_ROOT_PASSWORD` (2 archivos)
- `GRAFANA_ADMIN_PASSWORD` (2 archivos)
- `AMAZON_SECRET_KEY` (3 archivos)
- `JWT_EXPIRES_IN` (2 archivos)
- `JWT_REFRESH_EXPIRES_IN` (2 archivos)

### Api

Variables duplicadas: 17

- `NEXT_PUBLIC_API_URL` (5 archivos)
- `NEXT_PUBLIC_APP_URL` (5 archivos)
- `NEXT_PUBLIC_CHATBOT_URL` (5 archivos)
- `NEXT_PUBLIC_SOCKET_URL` (5 archivos)
- `FRONTEND_URL` (3 archivos)
- `CHATBOT_SERVICE_URL` (2 archivos)
- `TICKET_SERVICE_URL` (2 archivos)
- `USER_SERVICE_URL` (2 archivos)
- `PRODUCT_SERVICE_URL` (2 archivos)
- `PAYMENT_SERVICE_URL` (2 archivos)
- `NOTIFICATION_SERVICE_URL` (2 archivos)
- `ORDER_SERVICE_URL` (2 archivos)
- `AMAZON_API_KEY` (4 archivos)
- `ALIEXPRESS_API_KEY` (4 archivos)
- `EBAY_API_KEY` (4 archivos)
- `BANGGOOD_API_KEY` (4 archivos)
- `NEWEGG_API_KEY` (4 archivos)

### Email

Variables duplicadas: 4

- `SMTP_USER` (4 archivos)
- `SMTP_PASS` (4 archivos)
- `SMTP_HOST` (3 archivos)
- `SMTP_PORT` (3 archivos)

### Oauth

Variables duplicadas: 3

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (4 archivos)
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` (4 archivos)
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` (4 archivos)

### Logging

Variables duplicadas: 4

- `LOG_LEVEL` (5 archivos)
- `ELASTICSEARCH_ENABLED` (3 archivos)
- `ELASTICSEARCH_NODE` (2 archivos)
- `ELASTICSEARCH_INDEX` (2 archivos)

### Monitoring

Variables duplicadas: 2

- `GRAFANA_ADMIN_PASSWORD` (2 archivos)
- `ALERTS_ENABLED` (2 archivos)

### External

Variables duplicadas: 6

- `AMAZON_API_KEY` (4 archivos)
- `AMAZON_SECRET_KEY` (3 archivos)
- `ALIEXPRESS_API_KEY` (4 archivos)
- `EBAY_API_KEY` (4 archivos)
- `BANGGOOD_API_KEY` (4 archivos)
- `NEWEGG_API_KEY` (4 archivos)

## 6. Recomendaciones de Consolidación

### Archivos de la Raíz

Los archivos en la raíz del proyecto tienen mucha duplicación:

- **`.env.docker`**: Usado activamente en desarrollo con Docker
- **`.env.docker.example`**: Template para Docker (mantener)
- **`.env.example`**: Template general (consolidar con .env.docker.example)
- **`.env.logging.example`**: Configuración específica de logging (mantener separado)
- **`.env.prod.example`**: Template para producción (mantener)
- **`.env.staging.example`**: Template para staging (mantener)

**Acción recomendada:**
1. Consolidar `.env.example` y `.env.docker.example` en un solo archivo
2. Mantener archivos específicos por entorno (prod, staging, logging)

### Archivos de Servicios

Cada microservicio tiene su propio `.env.example` con configuraciones específicas.

**Variables comunes que se repiten:**
- `NODE_ENV`, `PORT`, `LOG_LEVEL`
- Configuración de bases de datos (MONGODB_URI, POSTGRES_*, REDIS_*)
- URLs de otros servicios

**Acción recomendada:**
1. Crear archivo `.env.shared.example` con variables comunes
2. Mantener solo variables específicas en cada servicio
3. Documentar en README cómo combinar archivos

### Frontend

- **`frontend/.env.local`**: Usado en desarrollo (contiene valores reales)
- **`frontend/.env.local.example`**: Template con documentación extensa

**Acción recomendada:**
1. Mantener `.env.local.example` como template documentado
2. Asegurar que `.env.local` esté en `.gitignore`
3. Eliminar valores reales de `.env.local` si está en el repositorio

---

*Reporte generado automáticamente por `scripts/analyze-env-duplications.js`*
