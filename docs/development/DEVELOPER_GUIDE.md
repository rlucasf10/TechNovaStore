# Guía del Desarrollador - TechNovaStore

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Navegando la Nueva Estructura](#navegando-la-nueva-estructura)
3. [Screaming Architecture](#screaming-architecture)
4. [Convenciones de Código](#convenciones-de-código)
5. [Estructura de Microservicios](#estructura-de-microservicios)
6. [Ejemplos de Rutas](#ejemplos-de-rutas)
7. [Flujo de Desarrollo](#flujo-de-desarrollo)
8. [Testing](#testing)
9. [Docker y Contenedores](#docker-y-contenedores)
10. [Debugging](#debugging)
11. [Mejores Prácticas](#mejores-prácticas)
12. [Recursos Adicionales](#recursos-adicionales)

---

## Introducción

Bienvenido a TechNovaStore. Este proyecto ha sido refactorizado siguiendo los principios de **Screaming Architecture**, donde la estructura del código "grita" el dominio del negocio, no las tecnologías utilizadas.

### ¿Qué es Screaming Architecture?

Al ver la estructura de carpetas, debe ser **inmediatamente obvio QUÉ HACE el sistema**:

```
domains/
├── catalog/          # GRITA: "Gestión de catálogo de productos"
├── commerce/         # GRITA: "Transacciones comerciales"
├── customer/         # GRITA: "Gestión de clientes"
├── support/          # GRITA: "Soporte al cliente"
└── platform/         # GRITA: "Plataforma e infraestructura"
```

### Principios Fundamentales

1. **Organización por Dominio**: El código se agrupa por funcionalidad de negocio
2. **Casos de Uso Visibles**: Cada carpeta representa un caso de uso específico
3. **Tests Junto al Código**: Los tests van en la misma carpeta que el código que prueban
4. **Cohesión Alta**: Todo lo relacionado con un caso de uso está junto
5. **Acoplamiento Bajo**: Los casos de uso son independientes entre sí

---

## Navegando la Nueva Estructura

### Estructura Raíz del Proyecto

```
TechNovaStore/
├── domains/                    # 🎯 Dominios de negocio (AQUÍ ESTÁ EL CÓDIGO)
├── shared/                     # 🔧 Código compartido entre dominios
├── infrastructure/             # 🏗️ Configuración de infraestructura
├── e2e-tests/                  # 🧪 Tests end-to-end
├── docs/                       # 📚 Documentación
├── scripts/                    # 🛠️ Scripts de utilidad
├── docker-compose.*.yml        # 🐳 Orquestación de contenedores
├── package.json                # 📦 Dependencias raíz
└── tsconfig.base.json          # ⚙️ Configuración TypeScript base
```


### Organización por Dominios

El proyecto está organizado en **5 dominios principales**:

#### 1. 📦 Dominio: Catalog

**Ubicación:** `domains/catalog/`

**Propósito:** Gestión del catálogo de productos, sincronización con proveedores y recomendaciones ML.

**Servicios:**
- `product-service/` - CRUD de productos, búsqueda, filtrado
- `sync-engine/` - Sincronización automática con proveedores externos
- `recommender-service/` - Recomendaciones basadas en ML

**Cuándo trabajar aquí:**
- Agregar/modificar productos
- Implementar nuevos filtros de búsqueda
- Integrar nuevos proveedores
- Mejorar algoritmos de recomendación

#### 2. 💰 Dominio: Commerce

**Ubicación:** `domains/commerce/`

**Propósito:** Gestión de transacciones comerciales, pedidos y pagos.

**Servicios:**
- `order-service/` - Gestión del ciclo de vida de pedidos
- `payment-service/` - Procesamiento de pagos
- `auto-purchase-service/` - Compras automáticas

**Cuándo trabajar aquí:**
- Modificar flujo de pedidos
- Integrar nuevos métodos de pago
- Implementar lógica de compra automática

#### 3. 👤 Dominio: Customer

**Ubicación:** `domains/customer/`

**Propósito:** Gestión de clientes y comunicaciones.

**Servicios:**
- `user-service/` - Autenticación, autorización, perfiles
- `notification-service/` - Notificaciones multicanal

**Cuándo trabajar aquí:**
- Implementar nuevos métodos de autenticación
- Agregar nuevos canales de notificación
- Modificar perfiles de usuario

#### 4. 🎫 Dominio: Support

**Ubicación:** `domains/support/`

**Propósito:** Soporte al cliente con IA, tickets y seguimiento de envíos.

**Servicios:**
- `ticket-service/` - Gestión de tickets de soporte
- `chatbot-service/` - Chatbot conversacional con Ollama (Phi-3)
- `shipment-tracker/` - Seguimiento de envíos en tiempo real

**Cuándo trabajar aquí:**
- Mejorar el chatbot
- Agregar nuevos carriers de envío
- Implementar nuevas categorías de tickets

#### 5. 🌐 Dominio: Platform

**Ubicación:** `domains/platform/`

**Propósito:** Infraestructura base y punto de entrada de la aplicación.

**Servicios:**
- `api-gateway/` - Gateway principal, autenticación, enrutamiento
- `frontend/` - Aplicación web Next.js

**Cuándo trabajar aquí:**
- Modificar rutas del API Gateway
- Implementar nuevas páginas en el frontend
- Agregar middleware de seguridad

---

## Screaming Architecture

### Estructura de un Microservicio

Todos los microservicios siguen la misma estructura basada en **casos de uso**:

```
service-name/
├── use-case-1/                    # 🎯 Caso de uso (nombre de negocio)
│   ├── UseCaseHandler.ts          # Lógica principal
│   ├── UseCaseEntities.ts         # Entidades específicas
│   └── UseCase.test.ts            # Tests JUNTO al código
│
├── use-case-2/
│   ├── UseCaseHandler.ts
│   └── UseCase.test.ts
│
├── shared/                        # 🔧 Infraestructura compartida
│   ├── models/                    # Modelos de datos
│   ├── repositories/              # Acceso a datos
│   ├── clients/                   # Clientes externos
│   ├── utils/                     # Utilidades
│   └── types/                     # Tipos TypeScript
│
├── api/                           # 🌐 Capa HTTP
│   ├── Controller.ts              # Controlador
│   ├── routes.ts                  # Rutas
│   └── middleware/                # Middleware
│
├── config/                        # ⚙️ Configuración
│   └── index.ts
│
├── Dockerfile                     # 🐳 Imagen Docker
├── package.json                   # 📦 Dependencias
├── tsconfig.json                  # ⚙️ Config TypeScript
├── jest.config.js                 # 🧪 Config tests
└── index.ts                       # 🚀 Entry point
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

### ⚠️ IMPORTANTE: NO usar carpeta test/ separada

En Screaming Architecture, **NO se usa una carpeta `test/` o `tests/` separada**. Los tests van junto al código:

```
✅ CORRECTO (Screaming Architecture):
send-order-confirmation/
├── SendOrderConfirmation.ts
├── OrderConfirmationTemplate.ts
└── SendOrderConfirmation.test.ts  ← Test JUNTO al código

❌ INCORRECTO (Arquitectura antigua):
src/
└── application/
    └── SendOrderConfirmation.ts
test/
└── SendOrderConfirmation.test.ts  ← Test SEPARADO
```

### Ventajas de Esta Estructura

1. **Claridad**: Al ver las carpetas, es obvio qué hace el servicio
2. **Cohesión**: Todo lo relacionado con un caso de uso está junto
3. **Testabilidad**: Tests junto al código que prueban
4. **Mantenibilidad**: Fácil agregar/eliminar funcionalidad
5. **Navegabilidad**: Encontrar código es intuitivo
6. **Independencia**: Casos de uso son independientes entre sí

---

## Convenciones de Código

### Nombres de Archivos y Carpetas

#### Carpetas
- **Casos de uso**: `kebab-case` (ej: `send-order-confirmation`, `check-delivery-delays`)
- **Carpetas técnicas**: `kebab-case` (ej: `shared`, `api`, `config`)

#### Archivos
- **Clases**: `PascalCase.ts` (ej: `SendOrderConfirmation.ts`, `EmailService.ts`)
- **Tests**: `*.test.ts` (ej: `SendOrderConfirmation.test.ts`)
- **Configuración**: `camelCase.ts` o `kebab-case.ts` (ej: `index.ts`, `database.ts`)
- **Tipos**: `types.ts` o `index.ts` dentro de carpeta `types/`

### Nombres en Código

#### TypeScript/JavaScript
```typescript
// Clases: PascalCase
class SendOrderConfirmation { }
class EmailService { }

// Interfaces: IPascalCase (con prefijo I)
interface IUserRepository { }
interface IEmailTemplate { }

// Funciones/métodos: camelCase
function sendEmail() { }
async function processOrder() { }

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// Variables: camelCase
const userName = 'John';
const isValid = true;

// Enums: PascalCase
enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Shipped = 'shipped'
}

// Tipos: PascalCase
type UserId = string;
type OrderData = { ... };
```


### Estructura de Imports

```typescript
// 1. Imports de Node.js / librerías externas
import express from 'express';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

// 2. Imports de shared (código compartido del proyecto)
import { logger } from '../shared/utils/logger';
import { EmailService } from '../shared/email/EmailService';

// 3. Imports locales (mismo caso de uso)
import { OrderConfirmationTemplate } from './OrderConfirmationTemplate';

// 4. Imports de tipos
import type { EmailTemplate, OrderData } from '../shared/types';
```

### Comentarios en Código

**IMPORTANTE**: Todos los comentarios deben estar en **español**.

```typescript
/**
 * Envía un email de confirmación de pedido al cliente
 * 
 * @param orderId - ID del pedido
 * @param customerEmail - Email del cliente
 * @param orderData - Datos del pedido
 * @returns Promise que se resuelve cuando el email se envía
 * @throws Error si el envío falla después de 3 reintentos
 */
async function sendOrderConfirmation(
  orderId: string,
  customerEmail: string,
  orderData: OrderData
): Promise<void> {
  // Generar template del email
  const template = new OrderConfirmationTemplate(orderData);
  
  // Enviar email con reintentos
  await this.emailService.sendEmail(customerEmail, template);
  
  // Registrar en logs
  logger.info(`Confirmación de pedido enviada: ${orderId}`);
}
```

### Manejo de Errores

```typescript
// ✅ CORRECTO: Errores personalizados con contexto
class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Pedido no encontrado: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}

// ✅ CORRECTO: Try-catch con logging
try {
  await processOrder(orderId);
} catch (error) {
  logger.error('Error procesando pedido', {
    orderId,
    error: error.message,
    stack: error.stack
  });
  throw error;
}

// ❌ INCORRECTO: Errores genéricos sin contexto
throw new Error('Error');

// ❌ INCORRECTO: Catch sin logging
try {
  await processOrder(orderId);
} catch (error) {
  // Silenciar error sin logging
}
```

### Logging

```typescript
import { logger } from '../shared/utils/logger';

// Niveles de log
logger.error('Error crítico', { error, context });  // Errores críticos
logger.warn('Advertencia', { context });            // Advertencias
logger.info('Información', { context });            // Información general
logger.debug('Debug', { context });                 // Información de depuración

// ✅ CORRECTO: Logging estructurado con contexto
logger.info('Pedido creado', {
  orderId: 'ORD-123',
  userId: 'user-456',
  total: 99.99,
  timestamp: new Date().toISOString()
});

// ❌ INCORRECTO: Logging sin contexto
console.log('Pedido creado');
```

### Validación de Datos

```typescript
import Joi from 'joi';

// ✅ CORRECTO: Validación con Joi
const createOrderSchema = Joi.object({
  userId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      price: Joi.number().min(0).required()
    })
  ).min(1).required(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required()
  }).required()
});

// Uso
const { error, value } = createOrderSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

---

## Estructura de Microservicios

### Anatomía de un Caso de Uso

Cada caso de uso sigue esta estructura:

```typescript
// send-order-confirmation/SendOrderConfirmation.ts

import { EmailService } from '../shared/email/EmailService';
import { OrderConfirmationTemplate } from './OrderConfirmationTemplate';
import { logger } from '../shared/utils/logger';
import type { OrderData } from '../shared/types';

/**
 * Caso de uso: Enviar confirmación de pedido
 * 
 * Responsabilidad: Generar y enviar email de confirmación cuando se crea un pedido
 */
export class SendOrderConfirmation {
  constructor(private emailService: EmailService) {}
  
  /**
   * Ejecuta el caso de uso
   */
  async execute(orderId: string, customerEmail: string, orderData: OrderData): Promise<void> {
    logger.info('Enviando confirmación de pedido', { orderId, customerEmail });
    
    // 1. Generar template del email
    const template = new OrderConfirmationTemplate(orderData);
    const emailContent = template.generate();
    
    // 2. Enviar email
    await this.emailService.sendEmail(customerEmail, emailContent);
    
    // 3. Registrar éxito
    logger.info('Confirmación de pedido enviada', { orderId });
  }
}
```


### Anatomía de un Controlador

```typescript
// api/NotificationController.ts

import { Request, Response } from 'express';
import { SendOrderConfirmation } from '../send-order-confirmation/SendOrderConfirmation';
import { logger } from '../shared/utils/logger';

/**
 * Controlador HTTP para notificaciones
 * 
 * Responsabilidad: Manejar requests HTTP y delegar a casos de uso
 */
export class NotificationController {
  constructor(
    private sendOrderConfirmation: SendOrderConfirmation
  ) {}
  
  /**
   * POST /notifications/order-confirmation
   * Envía confirmación de pedido
   */
  async sendOrderConfirmation(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerEmail, orderData } = req.body;
      
      // Validar entrada
      if (!orderId || !customerEmail || !orderData) {
        res.status(400).json({ 
          success: false, 
          error: 'Faltan parámetros requeridos' 
        });
        return;
      }
      
      // Ejecutar caso de uso
      await this.sendOrderConfirmation.execute(orderId, customerEmail, orderData);
      
      // Responder éxito
      res.json({ success: true });
      
    } catch (error) {
      logger.error('Error enviando confirmación', { error });
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }
}
```

### Anatomía de Rutas

```typescript
// api/routes.ts

import { Router } from 'express';
import { NotificationController } from './NotificationController';
import { validateRequest } from './middleware/validation';
import { authenticate } from './middleware/auth';

/**
 * Crea las rutas del servicio de notificaciones
 */
export function createRoutes(controller: NotificationController): Router {
  const router = Router();
  
  // POST /notifications/order-confirmation
  router.post(
    '/notifications/order-confirmation',
    authenticate,                                    // Middleware de autenticación
    validateRequest(orderConfirmationSchema),        // Middleware de validación
    (req, res) => controller.sendOrderConfirmation(req, res)
  );
  
  // POST /notifications/shipment-status
  router.post(
    '/notifications/shipment-status',
    authenticate,
    validateRequest(shipmentStatusSchema),
    (req, res) => controller.sendShipmentStatus(req, res)
  );
  
  return router;
}
```

### Entry Point del Servicio

```typescript
// index.ts

import express from 'express';
import { createRoutes } from './api/routes';
import { NotificationController } from './api/NotificationController';
import { SendOrderConfirmation } from './send-order-confirmation/SendOrderConfirmation';
import { EmailService } from './shared/email/EmailService';
import { logger } from './shared/utils/logger';
import config from './config';

/**
 * Inicializa y arranca el servicio de notificaciones
 */
async function startServer() {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Inicializar dependencias
  const emailService = new EmailService(config.email);
  const sendOrderConfirmation = new SendOrderConfirmation(emailService);
  
  // Inicializar controlador
  const controller = new NotificationController(sendOrderConfirmation);
  
  // Registrar rutas
  app.use('/api', createRoutes(controller));
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'notification-service' });
  });
  
  // Iniciar servidor
  const PORT = config.port || 3005;
  app.listen(PORT, () => {
    logger.info(`Notification service listening on port ${PORT}`);
  });
}

startServer().catch(error => {
  logger.error('Error starting server', { error });
  process.exit(1);
});
```

---

## Ejemplos de Rutas

### Rutas Antiguas vs Nuevas

#### Antes de la Refactorización

```
services/
├── product/
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── models/
│       └── routes/
├── user/
│   └── src/
│       ├── controllers/
│       ├── services/
│       └── models/
└── order/
    └── src/
        ├── controllers/
        ├── services/
        └── models/
```

#### Después de la Refactorización

```
domains/
├── catalog/
│   ├── product-service/
│   │   ├── create-product/
│   │   ├── update-product/
│   │   ├── delete-product/
│   │   ├── get-product-by-id/
│   │   ├── list-products/
│   │   ├── search-products/
│   │   ├── shared/
│   │   ├── api/
│   │   └── config/
│   ├── sync-engine/
│   └── recommender-service/
├── commerce/
│   ├── order-service/
│   ├── payment-service/
│   └── auto-purchase-service/
├── customer/
│   ├── user-service/
│   └── notification-service/
├── support/
│   ├── ticket-service/
│   ├── chatbot-service/
│   └── shipment-tracker/
└── platform/
    ├── api-gateway/
    └── frontend/
```


### Ejemplos de Rutas de Archivos

#### Product Service

```bash
# Antes
services/product/src/controllers/ProductController.ts
services/product/src/services/ProductService.ts
services/product/src/models/Product.ts
services/product/test/ProductController.test.ts

# Después
domains/catalog/product-service/create-product/CreateProduct.ts
domains/catalog/product-service/create-product/CreateProduct.test.ts
domains/catalog/product-service/update-product/UpdateProduct.ts
domains/catalog/product-service/update-product/UpdateProduct.test.ts
domains/catalog/product-service/shared/models/Product.ts
domains/catalog/product-service/api/ProductController.ts
```

#### User Service

```bash
# Antes
services/user/src/controllers/UserController.ts
services/user/src/services/AuthService.ts
services/user/src/models/User.ts
services/user/test/AuthService.test.ts

# Después
domains/customer/user-service/register-user/RegisterUser.ts
domains/customer/user-service/register-user/RegisterUser.test.ts
domains/customer/user-service/authenticate-user/AuthenticateUser.ts
domains/customer/user-service/authenticate-user/AuthenticateUser.test.ts
domains/customer/user-service/shared/models/User.ts
domains/customer/user-service/api/UserController.ts
```

#### Notification Service

```bash
# Antes
services/notification/src/services/NotificationService.ts
services/notification/src/services/EmailService.ts
services/notification/test/NotificationService.test.ts

# Después
domains/customer/notification-service/send-order-confirmation/SendOrderConfirmation.ts
domains/customer/notification-service/send-order-confirmation/SendOrderConfirmation.test.ts
domains/customer/notification-service/send-shipment-status/SendShipmentStatus.ts
domains/customer/notification-service/send-shipment-status/SendShipmentStatus.test.ts
domains/customer/notification-service/shared/email/EmailService.ts
domains/customer/notification-service/api/NotificationController.ts
```

### Cómo Encontrar Código

#### Buscar por Funcionalidad (Caso de Uso)

```bash
# ¿Dónde está el código para crear un producto?
domains/catalog/product-service/create-product/

# ¿Dónde está el código para autenticar usuarios?
domains/customer/user-service/authenticate-user/

# ¿Dónde está el código para enviar notificaciones de pedido?
domains/customer/notification-service/send-order-confirmation/

# ¿Dónde está el código del chatbot?
domains/support/chatbot-service/process-message/
```

#### Buscar por Dominio

```bash
# Todo lo relacionado con productos
domains/catalog/

# Todo lo relacionado con pedidos y pagos
domains/commerce/

# Todo lo relacionado con usuarios
domains/customer/

# Todo lo relacionado con soporte
domains/support/
```

#### Buscar Código Compartido

```bash
# Modelos compartidos entre todos los servicios
shared/domain/models/

# Utilidades de infraestructura
shared/infrastructure/utils/

# Middleware compartido
shared/infrastructure/middleware/

# Tipos TypeScript compartidos
shared/domain/types/
```

---

## Flujo de Desarrollo

### 1. Agregar un Nuevo Caso de Uso

**Ejemplo:** Agregar funcionalidad para "Enviar recordatorio de carrito abandonado"

```bash
# 1. Crear carpeta del caso de uso
cd domains/customer/notification-service/
mkdir send-cart-reminder

# 2. Crear archivos del caso de uso
cd send-cart-reminder/
touch SendCartReminder.ts
touch CartReminderTemplate.ts
touch SendCartReminder.test.ts

# 3. Implementar lógica
# Editar SendCartReminder.ts
# Editar CartReminderTemplate.ts

# 4. Escribir tests
# Editar SendCartReminder.test.ts

# 5. Agregar al controlador
# Editar ../api/NotificationController.ts

# 6. Agregar ruta
# Editar ../api/routes.ts

# 7. Ejecutar tests
npm test

# 8. Commit
git add .
git commit -m "feat(notification): agregar recordatorio de carrito abandonado"
```

### 2. Modificar un Caso de Uso Existente

**Ejemplo:** Modificar "Enviar confirmación de pedido" para incluir código QR

```bash
# 1. Navegar al caso de uso
cd domains/customer/notification-service/send-order-confirmation/

# 2. Modificar archivos necesarios
# Editar SendOrderConfirmation.ts
# Editar OrderConfirmationTemplate.ts

# 3. Actualizar tests
# Editar SendOrderConfirmation.test.ts

# 4. Ejecutar tests
npm test

# 5. Commit
git add .
git commit -m "feat(notification): agregar código QR a confirmación de pedido"
```

### 3. Agregar un Nuevo Microservicio

**Ejemplo:** Agregar servicio de "Loyalty Program"

```bash
# 1. Decidir dominio (ej: customer)
cd domains/customer/

# 2. Crear estructura del servicio
mkdir loyalty-service
cd loyalty-service/

# 3. Copiar estructura estándar
cp -r ../user-service/package.json .
cp -r ../user-service/tsconfig.json .
cp -r ../user-service/jest.config.js .
cp -r ../user-service/Dockerfile .

# 4. Crear casos de uso
mkdir earn-points
mkdir redeem-points
mkdir get-loyalty-status

# 5. Crear carpetas compartidas
mkdir -p shared/models
mkdir -p shared/repositories
mkdir -p shared/utils
mkdir -p api
mkdir config

# 6. Implementar casos de uso
# ...

# 7. Agregar al docker-compose.optimized.yml
# Editar docker-compose.optimized.yml

# 8. Commit
git add .
git commit -m "feat(customer): agregar servicio de programa de lealtad"
```


---

## Testing

### Estructura de Tests

Los tests van **junto al código** que prueban:

```
send-order-confirmation/
├── SendOrderConfirmation.ts
├── OrderConfirmationTemplate.ts
└── SendOrderConfirmation.test.ts  ← Test JUNTO al código
```

### Escribir Tests Unitarios

```typescript
// send-order-confirmation/SendOrderConfirmation.test.ts

import { SendOrderConfirmation } from './SendOrderConfirmation';
import { EmailService } from '../shared/email/EmailService';

describe('SendOrderConfirmation', () => {
  let sendOrderConfirmation: SendOrderConfirmation;
  let mockEmailService: jest.Mocked<EmailService>;
  
  beforeEach(() => {
    // Crear mock del EmailService
    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined)
    } as any;
    
    // Crear instancia del caso de uso
    sendOrderConfirmation = new SendOrderConfirmation(mockEmailService);
  });
  
  it('debe enviar email de confirmación con datos correctos', async () => {
    // Arrange
    const orderId = 'ORD-123';
    const customerEmail = 'test@example.com';
    const orderData = {
      orderNumber: 'ORD-123',
      customerName: 'John Doe',
      items: [{ name: 'Product 1', quantity: 2, price: 50 }],
      total: 100
    };
    
    // Act
    await sendOrderConfirmation.execute(orderId, customerEmail, orderData);
    
    // Assert
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      customerEmail,
      expect.objectContaining({
        subject: expect.stringContaining('ORD-123'),
        html: expect.any(String)
      })
    );
  });
  
  it('debe lanzar error si el envío falla', async () => {
    // Arrange
    mockEmailService.sendEmail.mockRejectedValue(new Error('SMTP error'));
    
    // Act & Assert
    await expect(
      sendOrderConfirmation.execute('ORD-123', 'test@example.com', {})
    ).rejects.toThrow('SMTP error');
  });
});
```

### Ejecutar Tests

```bash
# Ejecutar todos los tests de un servicio
cd domains/customer/notification-service/
npm test

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar tests con cobertura
npm test -- --coverage

# Ejecutar un test específico
npm test -- send-order-confirmation

# Ejecutar tests de todo el proyecto
npm test --workspaces
```

### Tests de Integración

Los tests de integración van en `e2e-tests/integration-tests/`:

```typescript
// e2e-tests/integration-tests/order-flow.test.ts

describe('Order Flow Integration', () => {
  it('debe crear pedido y enviar notificación', async () => {
    // 1. Crear pedido
    const orderResponse = await fetch('http://localhost:3002/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-123',
        items: [{ productId: 'prod-456', quantity: 2 }]
      })
    });
    
    const order = await orderResponse.json();
    expect(order.id).toBeDefined();
    
    // 2. Verificar que se envió notificación
    // (esperar evento o verificar en base de datos)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Verificar estado del pedido
    const statusResponse = await fetch(`http://localhost:3002/api/orders/${order.id}`);
    const orderStatus = await statusResponse.json();
    expect(orderStatus.status).toBe('confirmed');
  });
});
```

---

## Docker y Contenedores

### Comandos Esenciales

```bash
# Ver servicios activos
docker-compose -f docker-compose.optimized.yml ps

# Ver logs de un servicio
docker-compose -f docker-compose.optimized.yml logs -f notification-service

# Ejecutar comando dentro de un contenedor
docker exec -it technovastore-notification-service npm test

# Reconstruir un servicio
docker-compose -f docker-compose.optimized.yml build notification-service

# Reiniciar un servicio
docker-compose -f docker-compose.optimized.yml restart notification-service

# Detener todos los servicios
docker-compose -f docker-compose.optimized.yml down

# Iniciar solo servicios core
docker-compose -f docker-compose.optimized.yml --profile core up -d

# Iniciar todos los servicios
docker-compose -f docker-compose.optimized.yml --profile all up -d
```

### Desarrollo con Hot Reload

Todos los servicios tienen hot reload habilitado en desarrollo:

```bash
# 1. Iniciar servicios
docker-compose -f docker-compose.optimized.yml up -d

# 2. Editar código
# Los cambios se reflejan automáticamente (2-5 segundos)

# 3. Ver logs para confirmar reload
docker-compose -f docker-compose.optimized.yml logs -f notification-service
```

### Agregar Dependencias

```bash
# Opción 1: Dentro del contenedor
docker exec -it technovastore-notification-service npm install nueva-dependencia

# Opción 2: Localmente y reconstruir
cd domains/customer/notification-service/
npm install nueva-dependencia
docker-compose -f ../../../docker-compose.optimized.yml build notification-service
docker-compose -f ../../../docker-compose.optimized.yml restart notification-service
```

---

## Debugging

### Debugging con VS Code

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Docker: Attach to Node",
      "remoteRoot": "/app",
      "localRoot": "${workspaceFolder}/domains/customer/notification-service",
      "protocol": "inspector",
      "port": 9229,
      "restart": true,
      "sourceMaps": true
    }
  ]
}
```

Modificar `docker-compose.optimized.yml` para exponer puerto de debug:

```yaml
notification-service:
  # ...
  command: node --inspect=0.0.0.0:9229 dist/index.js
  ports:
    - "3005:3005"
    - "9229:9229"  # Puerto de debug
```

### Debugging con Logs

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.optimized.yml logs -f notification-service

# Ver últimas 100 líneas
docker-compose -f docker-compose.optimized.yml logs --tail=100 notification-service

# Buscar en logs
docker-compose -f docker-compose.optimized.yml logs notification-service | grep "ERROR"
```

### Debugging de Base de Datos

```bash
# MongoDB
docker exec -it technovastore-mongodb mongosh
> use technovastore
> db.products.find().limit(5)

# PostgreSQL
docker exec -it technovastore-postgresql psql -U admin -d technovastore
> SELECT * FROM users LIMIT 5;

# Redis
docker exec -it technovastore-redis redis-cli
> KEYS *
> GET session:user-123
```


---

## Mejores Prácticas

### 1. Organización de Código

✅ **HACER:**
- Agrupar código por caso de uso (funcionalidad de negocio)
- Mantener tests junto al código que prueban
- Usar nombres descriptivos que reflejen el negocio
- Mantener casos de uso independientes entre sí
- Extraer código compartido a `shared/`

❌ **NO HACER:**
- Organizar por capas técnicas (controllers/, services/, models/)
- Separar tests en carpeta `test/` aparte
- Usar nombres técnicos genéricos (handler.ts, service.ts)
- Crear dependencias entre casos de uso
- Duplicar código en múltiples casos de uso

### 2. Casos de Uso

✅ **HACER:**
- Un caso de uso = una responsabilidad clara
- Nombres que describan QUÉ HACE (send-order-confirmation)
- Lógica de negocio en el caso de uso
- Validación de entrada en el caso de uso
- Logging de operaciones importantes

❌ **NO HACER:**
- Casos de uso con múltiples responsabilidades
- Nombres técnicos (handler, processor, manager)
- Lógica de negocio en controladores
- Validación solo en controladores
- Operaciones sin logging

### 3. Tests

✅ **HACER:**
- Tests junto al código que prueban
- Tests descriptivos (debe enviar email de confirmación)
- Usar mocks para dependencias externas
- Probar casos de éxito y error
- Mantener cobertura >80%

❌ **NO HACER:**
- Tests en carpeta separada
- Tests genéricos (test1, test2)
- Tests que dependen de servicios externos reales
- Solo probar casos de éxito
- Ignorar cobertura de tests

### 4. Manejo de Errores

✅ **HACER:**
- Errores personalizados con contexto
- Logging de todos los errores
- Try-catch en puntos críticos
- Respuestas HTTP apropiadas (400, 404, 500)
- Mensajes de error claros para el usuario

❌ **NO HACER:**
- Errores genéricos sin contexto
- Silenciar errores sin logging
- Dejar errores sin manejar
- Exponer detalles técnicos al usuario
- Mensajes de error confusos

### 5. Seguridad

✅ **HACER:**
- Validar toda entrada de usuario
- Sanitizar datos antes de usar
- Usar JWT para autenticación
- Implementar rate limiting
- Logging de operaciones sensibles

❌ **NO HACER:**
- Confiar en datos de entrada sin validar
- Usar datos sin sanitizar
- Almacenar passwords en texto plano
- Permitir requests ilimitados
- Ignorar auditoría de seguridad

### 6. Performance

✅ **HACER:**
- Usar cache (Redis) para datos frecuentes
- Implementar paginación en listados
- Usar índices en base de datos
- Optimizar queries N+1
- Monitorear métricas de performance

❌ **NO HACER:**
- Consultar base de datos sin cache
- Retornar todos los registros sin límite
- Queries sin índices
- Múltiples queries en loops
- Ignorar métricas de latencia

### 7. Documentación

✅ **HACER:**
- Comentarios en español
- JSDoc para funciones públicas
- README.md en cada servicio
- Documentar decisiones arquitectónicas
- Mantener documentación actualizada

❌ **NO HACER:**
- Código sin comentarios
- Documentación desactualizada
- Asumir que el código es auto-explicativo
- Ignorar decisiones de diseño
- Documentación solo en inglés

### 8. Git y Commits

✅ **HACER:**
- Commits atómicos (un cambio lógico)
- Mensajes descriptivos en español
- Usar conventional commits (feat:, fix:, docs:)
- Branches por feature
- Pull requests con descripción

❌ **NO HACER:**
- Commits gigantes con múltiples cambios
- Mensajes genéricos ("fix", "update")
- Commits directos a main/master
- Branches sin nombre descriptivo
- PRs sin descripción

### 9. Código Limpio

✅ **HACER:**
- Funciones pequeñas (<50 líneas)
- Variables con nombres descriptivos
- Extraer lógica compleja a funciones
- Evitar anidamiento profundo (>3 niveles)
- Usar TypeScript estricto

❌ **NO HACER:**
- Funciones gigantes (>100 líneas)
- Variables con nombres crípticos (x, tmp, data)
- Lógica compleja inline
- Anidamiento profundo (>5 niveles)
- Usar `any` en TypeScript

### 10. Dependencias

✅ **HACER:**
- Mantener dependencias actualizadas
- Revisar vulnerabilidades (npm audit)
- Usar versiones específicas en package.json
- Documentar dependencias críticas
- Minimizar dependencias externas

❌ **NO HACER:**
- Usar dependencias obsoletas
- Ignorar vulnerabilidades de seguridad
- Usar rangos amplios (^, ~) en producción
- Agregar dependencias sin revisar
- Dependencias innecesarias

---

## Recursos Adicionales

### Documentación del Proyecto

- **Arquitectura General**: `docs/architecture/ARCHITECTURE.md`
- **Estructura Estándar**: `.kiro/specs/project-refactor-screaming-architecture/STANDARD_SERVICE_STRUCTURE.md`
- **Guía de Deployment**: `docs/deployment/DEPLOYMENT.md`
- **Guía de Seguridad**: `docs/security/SECURITY_SETUP.md`
- **Guía de Monitoreo**: `docs/monitoring/MONITORING.md`

### Documentación por Dominio

- **Catalog**: `domains/catalog/README.md`
- **Commerce**: `domains/commerce/README.md`
- **Customer**: `domains/customer/README.md`
- **Support**: `domains/support/README.md`
- **Platform**: `domains/platform/README.md`

### Documentación de Servicios

Cada servicio tiene su propio README:
- `domains/catalog/product-service/README.md`
- `domains/customer/user-service/README.md`
- `domains/support/chatbot-service/README.md`
- etc.

### Referencias Externas

- **Screaming Architecture**: [Blog de Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- **Domain-Driven Design**: [DDD Reference](https://www.domainlanguage.com/ddd/reference/)
- **TypeScript**: [Documentación Oficial](https://www.typescriptlang.org/docs/)
- **Docker**: [Documentación Oficial](https://docs.docker.com/)
- **Jest**: [Documentación Oficial](https://jestjs.io/docs/getting-started)

### Herramientas Útiles

- **VS Code Extensions**:
  - ESLint
  - Prettier
  - Docker
  - Jest Runner
  - GitLens
  - Thunder Client (API testing)

- **CLI Tools**:
  - `docker-compose` - Orquestación de contenedores
  - `npm` - Gestión de dependencias
  - `git` - Control de versiones
  - `curl` - Testing de APIs

### Contacto y Soporte

- **Issues**: Reportar bugs o solicitar features en GitHub Issues
- **Discussions**: Preguntas generales en GitHub Discussions
- **Wiki**: Documentación adicional en GitHub Wiki
- **Slack**: Canal #technovastore-dev (si aplica)

---

## Checklist para Nuevos Desarrolladores

### Primer Día

- [ ] Clonar repositorio
- [ ] Instalar dependencias (`install-all.ps1` o `install-deps.sh`)
- [ ] Iniciar servicios con Docker (`docker-compose up -d`)
- [ ] Verificar que todos los servicios están corriendo
- [ ] Acceder al frontend (http://localhost:3011)
- [ ] Acceder a Grafana (http://localhost:3013)
- [ ] Leer ARCHITECTURE.md
- [ ] Leer este DEVELOPER_GUIDE.md

### Primera Semana

- [ ] Explorar estructura de dominios
- [ ] Revisar un servicio completo (ej: notification-service)
- [ ] Ejecutar tests de un servicio
- [ ] Hacer un cambio pequeño y ver hot reload
- [ ] Crear un branch y hacer un commit
- [ ] Revisar documentación de API (Swagger)
- [ ] Familiarizarse con logs en Kibana
- [ ] Familiarizarse con métricas en Grafana

### Primer Mes

- [ ] Implementar un caso de uso nuevo
- [ ] Escribir tests para el caso de uso
- [ ] Hacer un pull request
- [ ] Revisar código de otros desarrolladores
- [ ] Contribuir a la documentación
- [ ] Participar en code reviews
- [ ] Entender flujo completo de un pedido
- [ ] Conocer todos los dominios del sistema

---

## Conclusión

Esta guía cubre los aspectos esenciales para desarrollar en TechNovaStore. La arquitectura basada en Screaming Architecture hace que el código sea:

- ✅ **Fácil de entender**: La estructura refleja el negocio
- ✅ **Fácil de navegar**: Encontrar código es intuitivo
- ✅ **Fácil de modificar**: Agregar/eliminar funcionalidad es simple
- ✅ **Fácil de testear**: Tests junto al código
- ✅ **Fácil de mantener**: Alta cohesión, bajo acoplamiento

**Recuerda**: Si tienes dudas, consulta la documentación o pregunta al equipo. ¡Bienvenido a TechNovaStore! 🚀

---

**Última actualización**: Noviembre 2024  
**Versión**: 1.0.0  
**Mantenido por**: Equipo de Desarrollo TechNovaStore
