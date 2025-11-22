# Arquitectura de TechNovaStore

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Principios Arquitectónicos](#principios-arquitectónicos)
3. [Arquitectura General](#arquitectura-general)
4. [Organización por Dominios](#organización-por-dominios)
5. [Estructura de Microservicios](#estructura-de-microservicios)
6. [Comunicación entre Servicios](#comunicación-entre-servicios)
7. [Bases de Datos](#bases-de-datos)
8. [Infraestructura](#infraestructura)
9. [Seguridad](#seguridad)
10. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
11. [Deployment](#deployment)
12. [Guía de Desarrollo](#guía-de-desarrollo)

---

## Introducción

**TechNovaStore** es una plataforma de e-commerce especializada en tecnología e informática, construida con una arquitectura de microservicios moderna que sigue los principios de **Screaming Architecture**.

### ¿Qué es Screaming Architecture?

Screaming Architecture es un enfoque arquitectónico donde **la estructura del código "grita" el dominio del negocio**, no las tecnologías utilizadas. Al ver la organización de carpetas, debe ser inmediatamente obvio QUÉ HACE el sistema.

### Características Principales

- **Arquitectura de Microservicios**: 13 servicios independientes organizados por dominios de negocio
- **Screaming Architecture**: Estructura que refleja casos de uso del negocio
- **Containerización**: Todo ejecutado en Docker para consistencia
- **Observabilidad Completa**: Stack ELK + Prometheus + Grafana
- **IA Integrada**: Chatbot conversacional con Ollama (Phi-3) y sistema de recomendaciones ML
- **Automatización**: Sincronización automática con proveedores y compras automatizadas

### Stack Tecnológico

- **Backend**: Node.js + TypeScript + Express
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Bases de Datos**: MongoDB, PostgreSQL, Redis
- **IA/ML**: Ollama (Phi-3 Mini), TensorFlow.js
- **Observabilidad**: Elasticsearch, Logstash, Kibana, Prometheus, Grafana
- **Containerización**: Docker + Docker Compose


---

## Principios Arquitectónicos

### 1. Screaming Architecture

La estructura del proyecto refleja el dominio del negocio:

```
domains/
├── catalog/          # GRITA: "Gestión de catálogo de productos"
├── commerce/         # GRITA: "Transacciones comerciales"
├── customer/         # GRITA: "Gestión de clientes"
├── support/          # GRITA: "Soporte al cliente"
└── platform/         # GRITA: "Plataforma e infraestructura"
```

### 2. Domain-Driven Design (DDD)

- **Dominios Acotados**: Cada dominio tiene responsabilidades claras y bien definidas
- **Lenguaje Ubicuo**: Nombres de carpetas y código reflejan el lenguaje del negocio
- **Contextos Delimitados**: Cada servicio es autónomo con su propia base de datos

### 3. Microservicios

- **Independencia**: Cada servicio puede desplegarse independientemente
- **Responsabilidad Única**: Cada servicio tiene una responsabilidad específica
- **Comunicación Asíncrona**: Uso de eventos y mensajería (Redis)
- **Base de Datos por Servicio**: Cada servicio gestiona su propia persistencia

### 4. Separation of Concerns

- **Casos de Uso**: Lógica de negocio organizada por casos de uso
- **Infraestructura Compartida**: Código técnico separado de lógica de negocio
- **API Layer**: Capa de presentación HTTP separada
- **Tests Junto al Código**: Tests ubicados junto al código que prueban

### 5. Testabilidad

- **Tests por Caso de Uso**: Cada caso de uso tiene sus propios tests
- **Tests de Integración**: Validación de comunicación entre servicios
- **Tests E2E**: Validación de flujos completos de usuario


---

## Arquitectura General

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                      http://localhost:3011                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express)                       │
│                      http://localhost:3000                       │
│  • Autenticación JWT                                            │
│  • Rate Limiting                                                │
│  • Enrutamiento a microservicios                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  CATALOG DOMAIN │  │ COMMERCE DOMAIN │  │ CUSTOMER DOMAIN │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ • Product       │  │ • Order         │  │ • User          │
│ • Sync Engine   │  │ • Payment       │  │ • Notification  │
│ • Recommender   │  │ • Auto-Purchase │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPPORT DOMAIN                                │
├─────────────────────────────────────────────────────────────────┤
│  • Ticket Service                                               │
│  • Chatbot (Ollama + Phi-3)                                     │
│  • Shipment Tracker                                             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  • MongoDB (Productos, Tickets, Chatbot)                        │
│  • PostgreSQL (Usuarios, Pedidos, Pagos)                        │
│  • Redis (Cache, Sesiones, Mensajería)                          │
│  • Ollama (IA Local - Phi-3 Mini)                               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  • Elasticsearch + Logstash + Kibana (Logs)                     │
│  • Prometheus + Grafana (Métricas)                              │
│  • Alertmanager (Alertas)                                       │
└─────────────────────────────────────────────────────────────────┘
```


### Estructura de Directorios del Proyecto

```
TechNovaStore/
├── domains/                           # Dominios de negocio (Screaming Architecture)
│   ├── catalog/                       # Gestión de catálogo
│   │   ├── product-service/
│   │   ├── sync-engine/
│   │   └── recommender-service/
│   ├── commerce/                      # Comercio y transacciones
│   │   ├── order-service/
│   │   ├── payment-service/
│   │   └── auto-purchase-service/
│   ├── customer/                      # Gestión de clientes
│   │   ├── user-service/
│   │   └── notification-service/
│   ├── support/                       # Soporte al cliente
│   │   ├── ticket-service/
│   │   ├── chatbot-service/
│   │   └── shipment-tracker/
│   └── platform/                      # Plataforma
│       ├── api-gateway/
│       └── frontend/
│
├── shared/                            # Código compartido
│   ├── domain/                        # Lógica de dominio compartida
│   │   ├── models/
│   │   └── types/
│   └── infrastructure/                # Utilidades de infraestructura
│       ├── config/
│       ├── middleware/
│       └── utils/
│
├── infrastructure/                    # Configuración de infraestructura
│   ├── alertmanager/
│   ├── backup/
│   ├── cache/
│   ├── cdn/
│   ├── grafana/
│   ├── kibana/
│   ├── logstash/
│   ├── mongodb/
│   ├── nginx/
│   ├── ollama/
│   ├── postgresql/
│   ├── prometheus/
│   └── scaling/
│
├── e2e-tests/                         # Tests end-to-end
│   ├── integration-tests/
│   └── performance-tests/
│
├── docs/                              # Documentación
│   ├── api/
│   ├── architecture/
│   ├── deployment/
│   ├── development/
│   ├── migration/
│   ├── monitoring/
│   └── security/
│
├── scripts/                           # Scripts de utilidad
│   ├── deployment/
│   ├── docker/
│   ├── setup/
│   ├── testing/
│   └── utilities/
│
├── docker-compose.yml                 # Orquestación de servicios (desarrollo)
├── docker-compose.optimized.yml       # Orquestación optimizada (USAR ESTE)
├── docker-compose.prod.yml            # Orquestación de producción
├── package.json                       # Dependencias raíz
├── tsconfig.base.json                 # Configuración TypeScript base
└── README.md                          # Documentación principal
```


---

## Organización por Dominios

### Dominio: Catalog (Catálogo)

**Propósito**: Gestión del catálogo de productos, sincronización con proveedores y recomendaciones ML.

**Servicios**:
- **product-service** (Puerto 3001): CRUD de productos, búsqueda, filtrado
- **sync-engine** (Puerto 3006): Sincronización automática con proveedores externos
- **recommender-service** (Puerto 3010): Recomendaciones basadas en ML

**Responsabilidades**:
- Gestión de productos, categorías, inventario y precios
- Integración con APIs de proveedores (Amazon, MercadoLibre, etc.)
- Generación de recomendaciones personalizadas

**Base de Datos**: MongoDB (productos, categorías, recomendaciones)

**Eventos Publicados**:
- `product.created`, `product.updated`, `product.deleted`
- `product.synced`, `inventory.updated`

**Eventos Consumidos**:
- `order.completed` (actualizar inventario)
- `user.activity` (mejorar recomendaciones)

---

### Dominio: Commerce (Comercio)

**Propósito**: Gestión de transacciones comerciales, pedidos y pagos.

**Servicios**:
- **order-service** (Puerto 3002): Gestión del ciclo de vida de pedidos
- **payment-service** (Puerto 3004): Procesamiento de pagos
- **auto-purchase-service** (Puerto 3007): Compras automáticas

**Responsabilidades**:
- Creación y seguimiento de pedidos
- Procesamiento de pagos con múltiples pasarelas
- Ejecución de compras automáticas basadas en reglas

**Base de Datos**: PostgreSQL (pedidos, pagos, transacciones)

**Eventos Publicados**:
- `order.created`, `order.confirmed`, `order.completed`, `order.cancelled`
- `payment.processed`, `payment.failed`
- `auto-purchase.executed`

**Eventos Consumidos**:
- `product.updated` (validar disponibilidad)
- `inventory.updated` (verificar stock)
- `user.verified` (validar usuario)

---

### Dominio: Customer (Cliente)

**Propósito**: Gestión de clientes y comunicaciones.

**Servicios**:
- **user-service** (Puerto 3003): Autenticación, autorización, perfiles
- **notification-service** (Puerto 3005): Notificaciones multicanal

**Responsabilidades**:
- Registro y autenticación de usuarios (JWT + OAuth)
- Gestión de perfiles y preferencias
- Envío de notificaciones por email, SMS, push

**Base de Datos**: PostgreSQL (usuarios, sesiones)

**Eventos Publicados**:
- `user.registered`, `user.verified`, `user.updated`, `user.deleted`
- `notification.sent`, `notification.failed`

**Eventos Consumidos**:
- `order.created`, `order.confirmed`, `order.completed`
- `payment.processed`
- `shipment.updated`


---

### Dominio: Support (Soporte)

**Propósito**: Soporte al cliente con IA, tickets y seguimiento de envíos.

**Servicios**:
- **ticket-service** (Puerto 3012): Gestión de tickets de soporte
- **chatbot-service** (Puerto 3009): Chatbot conversacional con Ollama (Phi-3)
- **shipment-tracker** (Puerto 3008): Seguimiento de envíos en tiempo real

**Responsabilidades**:
- Gestión de tickets de soporte
- Asistente conversacional inteligente con IA local
- Tracking de envíos con múltiples transportistas

**Base de Datos**: MongoDB (tickets, conversaciones), PostgreSQL (envíos)

**Eventos Publicados**:
- `ticket.created`, `ticket.updated`, `ticket.resolved`, `ticket.closed`
- `shipment.updated`, `shipment.delivered`
- `chatbot.conversation.started`, `chatbot.conversation.ended`

**Eventos Consumidos**:
- `order.confirmed` (iniciar seguimiento)
- `order.completed` (actualizar envío)
- `user.registered` (mensaje de bienvenida)
- `product.updated` (actualizar conocimiento del chatbot)

---

### Dominio: Platform (Plataforma)

**Propósito**: Infraestructura base y punto de entrada de la aplicación.

**Servicios**:
- **api-gateway** (Puerto 3000): Gateway principal, autenticación, enrutamiento
- **frontend** (Puerto 3011): Aplicación web Next.js

**Responsabilidades**:
- Enrutamiento de peticiones a microservicios
- Autenticación y autorización centralizada
- Rate limiting y seguridad
- Interfaz de usuario web

**Base de Datos**: Redis (sesiones, cache)

---

## Estructura de Microservicios

### Estructura Estándar (Screaming Architecture)

Todos los microservicios siguen la misma estructura basada en casos de uso:

```
service-name/
├── use-case-1/                    # Caso de uso (nombre de negocio)
│   ├── UseCaseHandler.ts          # Lógica del caso de uso
│   ├── UseCaseEntities.ts         # Entidades específicas
│   └── UseCase.test.ts            # Tests junto al código
│
├── use-case-2/
│   ├── UseCaseHandler.ts
│   └── UseCase.test.ts
│
├── shared/                        # Infraestructura compartida
│   ├── models/                    # Modelos de datos
│   ├── repositories/              # Acceso a datos
│   ├── clients/                   # Clientes externos
│   ├── utils/                     # Utilidades
│   └── types/                     # Tipos TypeScript
│
├── api/                           # Capa HTTP
│   ├── Controller.ts              # Controlador
│   ├── routes.ts                  # Rutas
│   └── middleware/                # Middleware
│
├── config/                        # Configuración
│   └── index.ts
│
├── Dockerfile                     # Imagen Docker
├── package.json                   # Dependencias
├── tsconfig.json                  # Config TypeScript
├── jest.config.js                 # Config tests
└── index.ts                       # Entry point
```


### Ejemplo Concreto: notification-service

```
notification-service/
├── send-order-confirmation/       # GRITA: "Enviar confirmación de pedido"
│   ├── SendOrderConfirmation.ts
│   ├── OrderConfirmationTemplate.ts
│   └── SendOrderConfirmation.test.ts
│
├── send-shipment-status/          # GRITA: "Enviar estado de envío"
│   ├── SendShipmentStatus.ts
│   ├── ShipmentStatusTemplate.ts
│   └── SendShipmentStatus.test.ts
│
├── send-payment-confirmation/     # GRITA: "Enviar confirmación de pago"
│   ├── SendPaymentConfirmation.ts
│   └── SendPaymentConfirmation.test.ts
│
├── check-delivery-delays/         # GRITA: "Verificar retrasos"
│   ├── CheckDeliveryDelays.ts
│   ├── DelayDetector.ts
│   └── CheckDeliveryDelays.test.ts
│
├── shared/
│   ├── email/
│   │   └── EmailService.ts        # Servicio SMTP
│   ├── templates/
│   │   └── BaseTemplate.ts
│   └── types/
│       └── index.ts
│
├── api/
│   ├── NotificationController.ts
│   ├── routes.ts
│   └── middleware/
│       └── validation.ts
│
├── config/
│   └── index.ts
│
└── index.ts
```

### Ventajas de Esta Estructura

1. **Claridad**: Al ver las carpetas, es obvio qué hace el servicio
2. **Cohesión**: Todo lo relacionado con un caso de uso está junto
3. **Testabilidad**: Tests junto al código que prueban
4. **Mantenibilidad**: Fácil agregar/eliminar funcionalidad
5. **Navegabilidad**: Encontrar código es intuitivo
6. **Independencia**: Casos de uso son independientes entre sí

---

## Comunicación entre Servicios

### Patrones de Comunicación

#### 1. Comunicación Síncrona (HTTP/REST)

Usada para operaciones que requieren respuesta inmediata:

```
Frontend → API Gateway → Microservicio → Base de Datos
```

**Ejemplo**: Consultar detalles de un producto

```typescript
// API Gateway enruta a product-service
GET /api/products/:id → http://product-service:3001/products/:id
```

#### 2. Comunicación Asíncrona (Eventos)

Usada para operaciones que no requieren respuesta inmediata:

```
Servicio A → Redis Pub/Sub → Servicio B
```

**Ejemplo**: Notificar cuando se crea un pedido

```typescript
// order-service publica evento
redis.publish('order.created', { orderId, userId, items });

// notification-service escucha evento
redis.subscribe('order.created', async (data) => {
  await sendOrderConfirmation(data);
});
```


### Flujo de Ejemplo: Crear un Pedido

```
1. Usuario hace clic en "Comprar" en Frontend
   ↓
2. Frontend → API Gateway: POST /api/orders
   ↓
3. API Gateway valida JWT y enruta a order-service
   ↓
4. order-service:
   - Valida datos del pedido
   - Consulta product-service para verificar stock (HTTP)
   - Crea pedido en PostgreSQL
   - Publica evento 'order.created' en Redis
   ↓
5. Servicios que escuchan 'order.created':
   - notification-service: Envía email de confirmación
   - payment-service: Inicia proceso de pago
   - product-service: Actualiza inventario
   - shipment-tracker: Prepara seguimiento de envío
   ↓
6. order-service responde al API Gateway con el pedido creado
   ↓
7. API Gateway responde al Frontend
   ↓
8. Frontend muestra confirmación al usuario
```

### Manejo de Errores en Comunicación

- **Circuit Breaker**: Previene cascadas de fallos
- **Retry con Backoff**: Reintentos exponenciales
- **Timeouts**: Límites de tiempo para operaciones
- **Fallbacks**: Respuestas alternativas cuando falla un servicio

---

## Bases de Datos

### Estrategia: Base de Datos por Servicio

Cada microservicio gestiona su propia base de datos para mantener independencia.

### MongoDB (NoSQL)

**Servicios que usan MongoDB**:
- **product-service**: Productos, categorías, inventario
- **chatbot-service**: Conversaciones, knowledge base
- **ticket-service**: Tickets de soporte
- **recommender-service**: Datos de recomendaciones

**Puerto**: 27017

**Ventajas**:
- Esquema flexible para productos con atributos variables
- Alto rendimiento para lecturas
- Escalabilidad horizontal

### PostgreSQL (SQL)

**Servicios que usan PostgreSQL**:
- **user-service**: Usuarios, autenticación, perfiles
- **order-service**: Pedidos, items de pedido
- **payment-service**: Transacciones, pagos
- **shipment-tracker**: Seguimiento de envíos

**Puerto**: 5432

**Ventajas**:
- ACID para transacciones críticas
- Relaciones complejas entre entidades
- Integridad referencial

### Redis (Cache + Mensajería)

**Usos**:
- **Cache**: Productos frecuentes, sesiones de usuario
- **Pub/Sub**: Mensajería entre microservicios
- **Rate Limiting**: Control de tasa de peticiones
- **Sesiones**: Tokens JWT, sesiones de usuario

**Puerto**: 6379

**Ventajas**:
- Latencia ultra-baja (< 1ms)
- Pub/Sub para eventos en tiempo real
- TTL automático para cache


### Diagrama de Bases de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         MONGODB (27017)                          │
├─────────────────────────────────────────────────────────────────┤
│  • products (product-service)                                   │
│  • categories (product-service)                                 │
│  • conversations (chatbot-service)                              │
│  • knowledge_base (chatbot-service)                             │
│  • tickets (ticket-service)                                     │
│  • recommendations (recommender-service)                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       POSTGRESQL (5432)                          │
├─────────────────────────────────────────────────────────────────┤
│  • users (user-service)                                         │
│  • orders (order-service)                                       │
│  • order_items (order-service)                                  │
│  • payments (payment-service)                                   │
│  • transactions (payment-service)                               │
│  • shipments (shipment-tracker)                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          REDIS (6379)                            │
├─────────────────────────────────────────────────────────────────┤
│  • Cache: products:*, users:*, sessions:*                       │
│  • Pub/Sub: order.*, product.*, user.*, payment.*              │
│  • Rate Limiting: rate:*                                        │
│  • Sessions: session:*                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Infraestructura

### Containerización con Docker

**Todos los servicios se ejecutan en contenedores Docker**. No se ejecuta nada directamente en el host.

#### Contenedores Principales

| Servicio | Container Name | Puerto | Descripción |
|----------|---------------|--------|-------------|
| Frontend | technovastore-frontend | 3011 | Aplicación web Next.js |
| API Gateway | technovastore-api-gateway | 3000 | Gateway principal |
| Product Service | technovastore-product-service | 3001 | Gestión de productos |
| Order Service | technovastore-order-service | 3002 | Gestión de pedidos |
| User Service | technovastore-user-service | 3003 | Gestión de usuarios |
| Payment Service | technovastore-payment-service | 3004 | Procesamiento de pagos |
| Notification Service | technovastore-notification-service | 3005 | Notificaciones |
| Sync Engine | technovastore-sync-engine | 3006 | Sincronización |
| Auto Purchase | technovastore-auto-purchase | 3007 | Compras automáticas |
| Shipment Tracker | technovastore-shipment-tracker | 3008 | Seguimiento de envíos |
| Chatbot | technovastore-chatbot | 3009 | Chatbot con IA |
| Recommender | technovastore-recommender | 3010 | Recomendaciones ML |
| Ticket Service | technovastore-ticket-service | 3012 | Tickets de soporte |

#### Bases de Datos

| Servicio | Container Name | Puerto | Descripción |
|----------|---------------|--------|-------------|
| MongoDB | technovastore-mongodb | 27017 | Base de datos NoSQL |
| PostgreSQL | technovastore-postgresql | 5432 | Base de datos SQL |
| Redis | technovastore-redis | 6379 | Cache y mensajería |
| Ollama | technovastore-ollama | 11434 | Motor de IA local |


#### Observabilidad

| Servicio | Container Name | Puerto | Descripción |
|----------|---------------|--------|-------------|
| Prometheus | technovastore-prometheus | 9090 | Recolección de métricas |
| Grafana | technovastore-grafana | 3013 | Visualización de métricas |
| Alertmanager | technovastore-alertmanager | 9093 | Gestión de alertas |
| Elasticsearch | technovastore-elasticsearch | 9200, 9300 | Motor de búsqueda y logs |
| Logstash | technovastore-logstash | 5000, 5044, 9600 | Procesamiento de logs |
| Kibana | technovastore-kibana | 5601 | Visualización de logs |

#### Exporters (Métricas)

| Servicio | Container Name | Puerto | Descripción |
|----------|---------------|--------|-------------|
| Node Exporter | technovastore-node-exporter | 9100 | Métricas del sistema |
| MongoDB Exporter | technovastore-mongodb-exporter | 9216 | Métricas de MongoDB |
| Redis Exporter | technovastore-redis-exporter | 9121 | Métricas de Redis |
| Postgres Exporter | technovastore-postgres-exporter | 9187 | Métricas de PostgreSQL |

### Docker Compose

**Archivo principal**: `docker-compose.optimized.yml` (USAR ESTE)

```bash
# Iniciar todos los servicios
docker-compose -f docker-compose.optimized.yml up -d

# Ver estado de servicios
docker-compose -f docker-compose.optimized.yml ps

# Ver logs de un servicio
docker-compose -f docker-compose.optimized.yml logs -f chatbot

# Detener todos los servicios
docker-compose -f docker-compose.optimized.yml down
```

### Networking

Todos los contenedores están en la misma red Docker (`technovastore-network`) y pueden comunicarse entre sí usando nombres de servicio:

```typescript
// Desde order-service, llamar a product-service
const response = await fetch('http://product-service:3001/products/123');
```

---

## Seguridad

### Autenticación y Autorización

#### JWT (JSON Web Tokens)

- **Emisión**: user-service genera tokens JWT al autenticar
- **Validación**: API Gateway valida tokens en cada petición
- **Expiración**: Tokens expiran en 24 horas
- **Refresh**: Tokens de refresh para renovar sesión

```typescript
// Estructura del JWT
{
  "userId": "user-123",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1234567890,
  "exp": 1234654290
}
```

#### OAuth 2.0

Soporte para autenticación con proveedores externos:
- Google OAuth
- GitHub OAuth
- Facebook OAuth

### Seguridad en API Gateway

- **Rate Limiting**: Límite de peticiones por IP/usuario
- **CORS**: Configuración de orígenes permitidos
- **Helmet**: Headers de seguridad HTTP
- **CSRF Protection**: Protección contra CSRF
- **XSS Protection**: Sanitización de inputs
- **SQL Injection Prevention**: Queries parametrizadas


### Seguridad en Microservicios

- **Validación de Entrada**: Joi/Zod para validar requests
- **Sanitización**: Limpieza de inputs para prevenir XSS
- **Secrets Management**: Variables de entorno para credenciales
- **Least Privilege**: Cada servicio solo tiene permisos necesarios
- **Network Isolation**: Servicios en red privada Docker

### Seguridad en Bases de Datos

- **Credenciales**: Almacenadas en variables de entorno
- **Conexiones Cifradas**: SSL/TLS para conexiones
- **Backups**: Backups automáticos diarios
- **Acceso Restringido**: Solo servicios autorizados pueden conectar

---

## Monitoreo y Observabilidad

### Stack ELK (Logs)

#### Elasticsearch
- **Puerto**: 9200, 9300
- **Función**: Almacenamiento y búsqueda de logs
- **Índices**: Logs organizados por servicio y fecha

#### Logstash
- **Puerto**: 5000 (TCP), 5044 (Beats), 9600 (API)
- **Función**: Procesamiento y transformación de logs
- **Pipeline**: Parseo, enriquecimiento, filtrado

#### Kibana
- **Puerto**: 5601
- **Función**: Visualización de logs
- **Dashboards**: Dashboards predefinidos por servicio
- **URL**: http://localhost:5601

### Prometheus + Grafana (Métricas)

#### Prometheus
- **Puerto**: 9090
- **Función**: Recolección de métricas
- **Scrape Interval**: 15 segundos
- **Retention**: 15 días
- **URL**: http://localhost:9090

**Métricas recolectadas**:
- HTTP requests (latencia, tasa de error, throughput)
- Uso de CPU y memoria por servicio
- Conexiones a bases de datos
- Tamaño de colas de mensajes
- Métricas de negocio (pedidos, pagos, etc.)

#### Grafana
- **Puerto**: 3013
- **Función**: Visualización de métricas
- **Dashboards**: Dashboards por dominio y servicio
- **Alertas**: Alertas configurables
- **URL**: http://localhost:3013

**Dashboards principales**:
- Overview del sistema
- Performance por servicio
- Bases de datos
- Errores y excepciones
- Métricas de negocio

#### Alertmanager
- **Puerto**: 9093
- **Función**: Gestión de alertas
- **Notificaciones**: Email, Slack, PagerDuty
- **Agrupación**: Alertas agrupadas por severidad

### Health Checks

Todos los servicios exponen endpoint `/health`:

```bash
# Verificar salud de un servicio
curl http://localhost:3001/health

# Respuesta
{
  "status": "healthy",
  "service": "product-service",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```


### Logging

Todos los servicios usan Winston para logging estructurado:

```typescript
logger.info('Order created', {
  orderId: 'ORD-123',
  userId: 'user-456',
  total: 99.99,
  timestamp: new Date().toISOString()
});
```

**Niveles de log**:
- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `debug`: Información de depuración

**Destinos**:
- Console (desarrollo)
- Archivos locales (desarrollo)
- Logstash → Elasticsearch (producción)

---

## Deployment

### Entornos

#### Desarrollo (Local)

```bash
# Usar docker-compose.optimized.yml
docker-compose -f docker-compose.optimized.yml up -d

# Hot reload habilitado en todos los servicios
# Frontend: http://localhost:3011
# API Gateway: http://localhost:3000
```

#### Staging

```bash
# Usar docker-compose.staging.yml
docker-compose -f docker-compose.staging.yml up -d

# Configuración similar a producción
# Datos de prueba
```

#### Producción

```bash
# Usar docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Optimizaciones de producción:
# - Builds optimizados
# - Réplicas de servicios
# - Load balancing
# - SSL/TLS
# - Backups automáticos
```

### CI/CD

**Pipeline de Deployment**:

```
1. Commit → GitHub
   ↓
2. GitHub Actions ejecuta:
   - Linting (ESLint)
   - Tests unitarios (Jest)
   - Tests de integración
   - Build de servicios
   ↓
3. Si todos los tests pasan:
   - Build de imágenes Docker
   - Push a Docker Registry
   ↓
4. Deployment automático a staging
   ↓
5. Tests E2E en staging
   ↓
6. Aprobación manual para producción
   ↓
7. Deployment a producción
   - Rolling update
   - Health checks
   - Rollback automático si falla
```

### Escalabilidad

#### Escalado Horizontal

Servicios pueden escalarse horizontalmente con réplicas:

```yaml
# docker-compose.prod.yml
product-service:
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '1'
        memory: 512M
```

#### Load Balancing

Nginx como load balancer para distribuir tráfico:

```nginx
upstream product_service {
    server product-service-1:3001;
    server product-service-2:3001;
    server product-service-3:3001;
}
```

#### Auto-scaling

Kubernetes para auto-scaling basado en métricas:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```


---

## Guía de Desarrollo

### Configuración del Entorno de Desarrollo

#### Prerrequisitos

- **Docker Desktop**: Versión 20.10 o superior
- **Docker Compose**: Versión 2.0 o superior
- **Git**: Para control de versiones
- **Node.js**: Versión 18+ (solo para desarrollo local sin Docker)
- **Editor**: VS Code recomendado con extensiones:
  - ESLint
  - Prettier
  - Docker
  - TypeScript

#### Clonar el Repositorio

```bash
git clone https://github.com/tu-org/technovastore.git
cd technovastore
```

#### Configurar Variables de Entorno

```bash
# Copiar archivos de ejemplo
cp .env.docker.example .env.docker
cp .env.shared .env.shared

# Editar con tus credenciales
# Nota: Los valores por defecto funcionan para desarrollo local
```

#### Iniciar el Sistema

```bash
# Iniciar todos los servicios
docker-compose -f docker-compose.optimized.yml up -d

# Verificar que todos los servicios estén corriendo
docker-compose -f docker-compose.optimized.yml ps

# Ver logs de todos los servicios
docker-compose -f docker-compose.optimized.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.optimized.yml logs -f chatbot
```

#### Verificar Instalación

```bash
# Frontend
curl http://localhost:3011

# API Gateway
curl http://localhost:3000/health

# Servicios individuales
curl http://localhost:3001/health  # product-service
curl http://localhost:3009/health  # chatbot-service

# Grafana
# Abrir en navegador: http://localhost:3013

# Kibana
# Abrir en navegador: http://localhost:5601
```

### Flujo de Trabajo de Desarrollo

#### 1. Crear una Nueva Funcionalidad

```bash
# Crear rama desde main
git checkout -b feature/nueva-funcionalidad

# Identificar el servicio a modificar
cd domains/catalog/product-service

# Crear nuevo caso de uso
mkdir create-product-bundle
cd create-product-bundle

# Crear archivos
touch CreateProductBundle.ts
touch CreateProductBundle.test.ts
```

#### 2. Implementar el Caso de Uso

```typescript
// CreateProductBundle.ts
export class CreateProductBundle {
  constructor(
    private productRepository: ProductRepository,
    private logger: Logger
  ) {}

  async execute(bundleData: BundleData): Promise<Bundle> {
    this.logger.info('Creating product bundle', { bundleData });
    
    // Validar datos
    this.validateBundleData(bundleData);
    
    // Crear bundle
    const bundle = await this.productRepository.createBundle(bundleData);
    
    // Publicar evento
    await this.publishBundleCreatedEvent(bundle);
    
    return bundle;
  }

  private validateBundleData(data: BundleData): void {
    // Validación
  }

  private async publishBundleCreatedEvent(bundle: Bundle): Promise<void> {
    // Publicar evento en Redis
  }
}
```

#### 3. Escribir Tests

```typescript
// CreateProductBundle.test.ts
describe('CreateProductBundle', () => {
  let useCase: CreateProductBundle;
  let mockRepository: jest.Mocked<ProductRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    useCase = new CreateProductBundle(mockRepository, mockLogger);
  });

  it('should create a product bundle successfully', async () => {
    // Arrange
    const bundleData = { name: 'Gaming Bundle', products: ['prod1', 'prod2'] };
    mockRepository.createBundle.mockResolvedValue({ id: 'bundle1', ...bundleData });

    // Act
    const result = await useCase.execute(bundleData);

    // Assert
    expect(result.id).toBe('bundle1');
    expect(mockRepository.createBundle).toHaveBeenCalledWith(bundleData);
  });

  it('should throw error if bundle data is invalid', async () => {
    // Arrange
    const invalidData = { name: '', products: [] };

    // Act & Assert
    await expect(useCase.execute(invalidData)).rejects.toThrow('Invalid bundle data');
  });

  // Más tests...
});
```

#### 4. Ejecutar Tests

```bash
# Ejecutar tests dentro del contenedor
docker exec technovastore-product-service npm test

# Ejecutar tests con coverage
docker exec technovastore-product-service npm run test:coverage

# Ejecutar tests en modo watch (desarrollo)
docker exec technovastore-product-service npm run test:watch
```

#### 5. Integrar en el Controlador

```typescript
// api/ProductController.ts
export class ProductController {
  constructor(
    private createProductBundle: CreateProductBundle,
    // otros casos de uso...
  ) {}

  async createBundle(req: Request, res: Response): Promise<void> {
    try {
      const bundleData = req.body;
      const bundle = await this.createProductBundle.execute(bundleData);
      res.status(201).json(bundle);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

#### 6. Agregar Ruta

```typescript
// api/routes.ts
router.post('/bundles', 
  authenticate,
  validateBundleData,
  productController.createBundle.bind(productController)
);
```

#### 7. Reconstruir y Probar

```bash
# Reconstruir el servicio con los cambios
docker-compose -f docker-compose.optimized.yml up -d --build product-service

# Verificar logs
docker-compose -f docker-compose.optimized.yml logs -f product-service

# Probar endpoint
curl -X POST http://localhost:3001/bundles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Gaming Bundle","products":["prod1","prod2"]}'
```

#### 8. Commit y Push

```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat(product): add create product bundle use case"

# Push a rama
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
```

### Convenciones de Código

#### Nombres de Archivos

- **Casos de Uso**: PascalCase (ej: `CreateProductBundle.ts`)
- **Tests**: Mismo nombre + `.test.ts` (ej: `CreateProductBundle.test.ts`)
- **Controladores**: PascalCase + `Controller` (ej: `ProductController.ts`)
- **Rutas**: camelCase (ej: `routes.ts`)
- **Configuración**: camelCase (ej: `index.ts`, `database.ts`)

#### Nombres de Variables y Funciones

```typescript
// Variables: camelCase
const productId = 'prod-123';
const userEmail = 'user@example.com';

// Funciones: camelCase
function calculateTotal(items: Item[]): number { }
async function sendNotification(userId: string): Promise<void> { }

// Clases: PascalCase
class ProductRepository { }
class OrderService { }

// Interfaces: PascalCase con prefijo 'I' (opcional)
interface IProduct { }
interface Product { }  // También válido

// Tipos: PascalCase
type OrderStatus = 'pending' | 'confirmed' | 'completed';

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;
```

#### Estructura de Funciones

```typescript
// Orden recomendado:
class MyService {
  // 1. Propiedades privadas
  private repository: Repository;
  private logger: Logger;

  // 2. Constructor
  constructor(repository: Repository, logger: Logger) {
    this.repository = repository;
    this.logger = logger;
  }

  // 3. Métodos públicos
  async execute(data: Data): Promise<Result> {
    // Implementación
  }

  // 4. Métodos privados
  private validate(data: Data): void {
    // Validación
  }

  private async publishEvent(event: Event): Promise<void> {
    // Publicar evento
  }
}
```

#### Comentarios

```typescript
/**
 * Crea un nuevo bundle de productos.
 * 
 * @param bundleData - Datos del bundle a crear
 * @returns El bundle creado con su ID
 * @throws {ValidationError} Si los datos son inválidos
 * @throws {DatabaseError} Si falla la creación en la base de datos
 */
async createBundle(bundleData: BundleData): Promise<Bundle> {
  // Implementación
}

// Comentarios inline para lógica compleja
// Calcular descuento basado en cantidad de productos
const discount = items.length > 5 ? 0.15 : 0.10;
```

### Debugging

#### Logs en Desarrollo

```typescript
// Usar logger estructurado
logger.info('Processing order', { 
  orderId: order.id, 
  userId: order.userId,
  total: order.total 
});

logger.error('Failed to process payment', { 
  orderId: order.id,
  error: error.message,
  stack: error.stack 
});
```

#### Debugging con VS Code

Configuración en `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Docker: Attach to Node",
      "remoteRoot": "/app",
      "localRoot": "${workspaceFolder}/domains/catalog/product-service",
      "protocol": "inspector",
      "port": 9229,
      "restart": true,
      "sourceMaps": true
    }
  ]
}
```

Modificar `docker-compose.optimized.yml` para habilitar debugging:

```yaml
product-service:
  command: npm run dev:debug
  ports:
    - "3001:3001"
    - "9229:9229"  # Puerto de debugging
```

#### Inspeccionar Contenedores

```bash
# Entrar al contenedor
docker exec -it technovastore-product-service sh

# Ver variables de entorno
docker exec technovastore-product-service env

# Ver procesos
docker exec technovastore-product-service ps aux

# Ver uso de recursos
docker stats technovastore-product-service
```

### Testing

#### Tipos de Tests

**1. Tests Unitarios**

```typescript
// Probar lógica aislada
describe('calculateDiscount', () => {
  it('should apply 15% discount for orders over $100', () => {
    const result = calculateDiscount(150);
    expect(result).toBe(22.5);
  });
});
```

**2. Tests de Integración**

```typescript
// Probar interacción con base de datos
describe('ProductRepository', () => {
  let repository: ProductRepository;
  let db: MongoClient;

  beforeAll(async () => {
    db = await connectToTestDatabase();
    repository = new ProductRepository(db);
  });

  it('should save and retrieve a product', async () => {
    const product = { name: 'Test Product', price: 99.99 };
    const saved = await repository.save(product);
    const retrieved = await repository.findById(saved.id);
    expect(retrieved.name).toBe('Test Product');
  });

  afterAll(async () => {
    await db.close();
  });
});
```

**3. Tests E2E**

```typescript
// Probar flujo completo
describe('Order Flow', () => {
  it('should create order and send confirmation email', async () => {
    // 1. Crear usuario
    const user = await createTestUser();
    
    // 2. Crear pedido
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ items: [{ productId: 'prod1', quantity: 2 }] });
    
    expect(response.status).toBe(201);
    
    // 3. Verificar email enviado
    const emails = await getTestEmails();
    expect(emails).toContainEqual(
      expect.objectContaining({
        to: user.email,
        subject: 'Order Confirmation'
      })
    );
  });
});
```

#### Ejecutar Tests

```bash
# Tests unitarios
docker exec technovastore-product-service npm test

# Tests de integración
docker exec technovastore-product-service npm run test:integration

# Tests E2E (desde raíz del proyecto)
docker-compose -f docker-compose.optimized.yml exec api-gateway npm run test:e2e

# Coverage
docker exec technovastore-product-service npm run test:coverage
```

#### Mocks y Stubs

```typescript
// Mock de repositorio
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};

// Mock de cliente HTTP
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockResolvedValue({ data: { id: '123' } });

// Stub de logger
const stubLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
```

### Mejores Prácticas

#### 1. Screaming Architecture

✅ **HACER**:
```
send-order-confirmation/
  SendOrderConfirmation.ts
  SendOrderConfirmation.test.ts
```

❌ **NO HACER**:
```
services/
  OrderConfirmationService.ts
test/
  OrderConfirmationService.test.ts
```

#### 2. Casos de Uso Independientes

✅ **HACER**:
```typescript
// Cada caso de uso es independiente
class CreateOrder { }
class CancelOrder { }
class UpdateOrder { }
```

❌ **NO HACER**:
```typescript
// Clase monolítica con múltiples responsabilidades
class OrderService {
  createOrder() { }
  cancelOrder() { }
  updateOrder() { }
  sendConfirmation() { }
  processPayment() { }
}
```

#### 3. Inyección de Dependencias

✅ **HACER**:
```typescript
class CreateOrder {
  constructor(
    private orderRepository: OrderRepository,
    private eventPublisher: EventPublisher,
    private logger: Logger
  ) {}
}
```

❌ **NO HACER**:
```typescript
class CreateOrder {
  private orderRepository = new OrderRepository();
  private eventPublisher = new EventPublisher();
  private logger = new Logger();
}
```

#### 4. Manejo de Errores

✅ **HACER**:
```typescript
try {
  const order = await this.createOrder(data);
  return order;
} catch (error) {
  this.logger.error('Failed to create order', { 
    error: error.message,
    data 
  });
  throw new OrderCreationError('Could not create order', error);
}
```

❌ **NO HACER**:
```typescript
try {
  const order = await this.createOrder(data);
  return order;
} catch (error) {
  console.log(error);  // No usar console.log
  throw error;  // No re-lanzar error genérico
}
```

#### 5. Validación de Datos

✅ **HACER**:
```typescript
import Joi from 'joi';

const orderSchema = Joi.object({
  userId: Joi.string().required(),
  items: Joi.array().min(1).required(),
  total: Joi.number().positive().required()
});

const { error, value } = orderSchema.validate(data);
if (error) {
  throw new ValidationError(error.message);
}
```

❌ **NO HACER**:
```typescript
if (!data.userId || !data.items || data.items.length === 0) {
  throw new Error('Invalid data');
}
```

#### 6. Logging Estructurado

✅ **HACER**:
```typescript
logger.info('Order created', {
  orderId: order.id,
  userId: order.userId,
  total: order.total,
  timestamp: new Date().toISOString()
});
```

❌ **NO HACER**:
```typescript
console.log(`Order ${order.id} created for user ${order.userId}`);
```

#### 7. Configuración

✅ **HACER**:
```typescript
// config/index.ts
export const config = {
  port: process.env.PORT || 3001,
  database: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
    name: process.env.DB_NAME || 'products'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
};
```

❌ **NO HACER**:
```typescript
// Hardcodear valores en el código
const dbUrl = 'mongodb://localhost:27017';
const redisHost = 'localhost';
```

#### 8. Async/Await

✅ **HACER**:
```typescript
async function processOrder(orderId: string): Promise<Order> {
  try {
    const order = await orderRepository.findById(orderId);
    const payment = await paymentService.process(order);
    await notificationService.sendConfirmation(order);
    return order;
  } catch (error) {
    logger.error('Failed to process order', { orderId, error });
    throw error;
  }
}
```

❌ **NO HACER**:
```typescript
function processOrder(orderId: string): Promise<Order> {
  return orderRepository.findById(orderId)
    .then(order => paymentService.process(order))
    .then(payment => notificationService.sendConfirmation(order))
    .catch(error => {
      console.log(error);
      throw error;
    });
}
```

### Recursos Adicionales

#### Documentación

- [API Documentation](../api/README.md)
- [Deployment Guide](../deployment/README.md)
- [Security Guidelines](../security/README.md)
- [Monitoring Guide](../monitoring/README.md)
- [Makefile Guide](../development/MAKEFILE_GUIDE.md)

#### Herramientas

- **Postman Collection**: Colección de endpoints para testing
- **Grafana Dashboards**: Dashboards predefinidos para monitoreo
- **Kibana Dashboards**: Dashboards para análisis de logs

#### Contacto

- **Equipo de Desarrollo**: dev@technovastore.com
- **Soporte Técnico**: support@technovastore.com
- **Documentación**: https://docs.technovastore.com

---

## Conclusión

La arquitectura de TechNovaStore está diseñada para ser:

- **Escalable**: Microservicios independientes que pueden escalar horizontalmente
- **Mantenible**: Screaming Architecture hace el código fácil de entender y modificar
- **Resiliente**: Manejo de errores, circuit breakers, y fallbacks
- **Observable**: Logging y métricas completas en todos los servicios
- **Segura**: Autenticación, autorización, y mejores prácticas de seguridad
- **Testeable**: Tests unitarios, de integración y E2E

Esta arquitectura permite al equipo desarrollar y desplegar funcionalidades de manera independiente, manteniendo la calidad y consistencia del sistema.

---

**Última actualización**: Noviembre 2025  
**Versión**: 2.0  
**Mantenido por**: Equipo de Arquitectura TechNovaStore
