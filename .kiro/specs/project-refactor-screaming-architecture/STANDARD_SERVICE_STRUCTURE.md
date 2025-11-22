# Estructura Estándar de Microservicios - TechNovaStore (Screaming Architecture)

## Introducción

Este documento define la estructura estándar que todos los microservicios de TechNovaStore deben seguir. La estructura está basada en los principios de **Screaming Architecture**, donde la organización del código **GRITA** el dominio del negocio y los casos de uso, no las tecnologías utilizadas.

## Principios de Screaming Architecture

1. **El Código Grita el Negocio**: Al ver la estructura de carpetas, debe ser inmediatamente obvio QUÉ HACE el sistema
2. **Organización por Casos de Uso**: El código se agrupa por funcionalidad de negocio, no por capas técnicas
3. **Cohesión Alta**: Todo lo relacionado con un caso de uso está junto (lógica, entidades, **tests**)
4. **Tests Junto al Código**: Los tests van en la misma carpeta que el código que prueban, no en carpeta separada
5. **Acoplamiento Bajo**: Los casos de uso son independientes entre sí
6. **Fácil de Navegar**: Encontrar código es intuitivo porque los nombres reflejan el negocio
7. **Fácil de Modificar**: Agregar o eliminar funcionalidad es simple (agregar/eliminar carpeta completa con código y tests)
8. **Testabilidad**: Cada caso de uso puede testearse independientemente

## ⚠️ IMPORTANTE: NO usar carpeta test/ separada

En Screaming Architecture, **NO se usa una carpeta `test/` o `tests/` separada**. Los tests van junto al código:

```
✅ CORRECTO (Screaming Architecture):
send-order-confirmation/
├── SendOrderConfirmation.ts
├── OrderConfirmationTemplate.ts
└── SendOrderConfirmation.test.ts  ← Test JUNTO al código

❌ INCORRECTO (Clean Architecture antigua):
src/
└── application/
    └── SendOrderConfirmation.ts
test/
└── SendOrderConfirmation.test.ts  ← Test SEPARADO
```

## Estructura de Carpetas Estándar (Screaming Architecture)

### Estructura General

```
service-name/
├── use-case-1/                    # Caso de uso 1 (nombre descriptivo del negocio)
│   ├── UseCaseHandler.ts          # Lógica principal del caso de uso
│   ├── UseCaseEntities.ts         # Entidades específicas del caso de uso
│   ├── UseCaseRepository.ts       # Repositorio si es necesario
│   ├── UseCaseHelpers.ts          # Helpers/utilidades específicas
│   └── UseCase.test.ts            # Tests del caso de uso
│
├── use-case-2/                    # Caso de uso 2
│   ├── UseCaseHandler.ts
│   ├── UseCaseEntities.ts
│   └── UseCase.test.ts
│
├── use-case-3/                    # Caso de uso 3
│   └── ...
│
├── shared/                        # Código compartido entre casos de uso
│   ├── infrastructure/            # Servicios de infraestructura
│   │   ├── database/              # Acceso a base de datos
│   │   │   ├── connection.ts
│   │   │   └── BaseRepository.ts
│   │   ├── email/                 # Servicio de email
│   │   │   └── EmailService.ts
│   │   ├── http/                  # Cliente HTTP
│   │   │   └── HttpClient.ts
│   │   └── messaging/             # Mensajería
│   │       └── MessageBroker.ts
│   ├── types/                     # Tipos compartidos
│   │   └── index.ts
│   ├── utils/                     # Utilidades compartidas
│   │   └── helpers.ts
│   └── errors/                    # Errores personalizados
│       └── CustomErrors.ts
│
├── api/                           # Capa de presentación HTTP
│   ├── controllers/               # Controladores HTTP
│   │   └── ServiceController.ts
│   ├── routes/                    # Definición de rutas
│   │   └── routes.ts
│   └── middleware/                # Middleware HTTP
│       ├── auth.ts
│       ├── validation.ts
│       └── errorHandler.ts
│
├── config/                        # Configuración
│   └── index.ts
│
├── docs/                          # Documentación
│   ├── README.md
│   ├── API.md
│   └── ARCHITECTURE.md
│
├── scripts/                       # Scripts de utilidad
│   └── seed.ts
│
├── dist/                          # Código compilado (generado)
├── node_modules/                  # Dependencias (generado)
├── logs/                          # Logs (generado)
│
├── .dockerignore
├── .gitignore
├── Dockerfile
├── Dockerfile.prod
├── jest.config.js
├── package.json
├── tsconfig.json
├── index.ts                       # Punto de entrada
└── README.md
```

### Ejemplo Concreto: notification-service

```
notification-service/
├── send-order-confirmation/       # GRITA: "Enviar confirmación de pedido"
│   ├── SendOrderConfirmation.ts   # Handler del caso de uso
│   ├── OrderConfirmationTemplate.ts # Template específico
│   └── SendOrderConfirmation.test.ts
│
├── send-shipment-status/          # GRITA: "Enviar estado de envío"
│   ├── SendShipmentStatus.ts
│   ├── ShipmentStatusTemplate.ts
│   └── SendShipmentStatus.test.ts
│
├── send-delay-alert/              # GRITA: "Enviar alerta de retraso"
│   ├── SendDelayAlert.ts
│   ├── DelayAlertTemplate.ts
│   └── SendDelayAlert.test.ts
│
├── send-payment-confirmation/     # GRITA: "Enviar confirmación de pago"
│   ├── SendPaymentConfirmation.ts
│   ├── PaymentConfirmationTemplate.ts
│   └── SendPaymentConfirmation.test.ts
│
├── send-order-cancellation/       # GRITA: "Enviar cancelación de pedido"
│   ├── SendOrderCancellation.ts
│   ├── OrderCancellationTemplate.ts
│   └── SendOrderCancellation.test.ts
│
├── send-invoice-generated/        # GRITA: "Enviar factura generada"
│   ├── SendInvoiceGenerated.ts
│   ├── InvoiceGeneratedTemplate.ts
│   └── SendInvoiceGenerated.test.ts
│
├── check-delivery-delays/         # GRITA: "Verificar retrasos en entregas"
│   ├── CheckDeliveryDelays.ts     # Handler principal
│   ├── DelayDetector.ts           # Lógica de detección
│   ├── DelayScheduler.ts          # Programación de verificaciones
│   └── CheckDeliveryDelays.test.ts
│
├── shared/                        # Infraestructura compartida
│   ├── email/
│   │   └── EmailService.ts        # Servicio SMTP
│   ├── types/
│   │   └── index.ts               # Tipos compartidos
│   └── templates/
│       └── BaseTemplate.ts        # Template base
│
├── api/                           # Presentación HTTP
│   ├── NotificationController.ts  # Controlador
│   ├── routes.ts                  # Rutas
│   └── middleware/
│       └── validation.ts
│
├── config/
│   └── index.ts
│
├── docs/
│   ├── README.md
│   └── API.md
│
├── Dockerfile
├── Dockerfile.prod
├── jest.config.js
├── package.json
├── tsconfig.json
├── index.ts
└── README.md
```

## Descripción de Componentes (Screaming Architecture)

### 1. Carpetas de Casos de Uso

**Propósito**: Cada carpeta representa un caso de uso específico del negocio y contiene TODO lo necesario para ese caso de uso.

**Contenido de una carpeta de caso de uso**:

- **Handler**: Lógica principal del caso de uso
  ```typescript
  // send-order-confirmation/SendOrderConfirmation.ts
  import { EmailService } from '../shared/email/EmailService';
  import { OrderConfirmationTemplate } from './OrderConfirmationTemplate';
  
  export class SendOrderConfirmation {
    constructor(private emailService: EmailService) {}
    
    async execute(orderId: string, customerEmail: string, orderData: any): Promise<void> {
      const template = new OrderConfirmationTemplate(orderData);
      const emailContent = template.generate();
      
      await this.emailService.sendEmail(customerEmail, emailContent);
      console.log(`Order confirmation sent for ${orderId}`);
    }
  }
  ```

- **Entities/Templates**: Entidades o helpers específicos del caso de uso
  ```typescript
  // send-order-confirmation/OrderConfirmationTemplate.ts
  export class OrderConfirmationTemplate {
    constructor(private orderData: any) {}
    
    generate(): EmailTemplate {
      return {
        subject: `Confirmación de pedido #${this.orderData.orderNumber}`,
        html: this.generateHTML(),
        text: this.generateText()
      };
    }
    
    private generateHTML(): string {
      return `<h1>Gracias por tu pedido</h1>...`;
    }
  }
  ```

- **Tests**: Tests del caso de uso
  ```typescript
  // send-order-confirmation/SendOrderConfirmation.test.ts
  import { SendOrderConfirmation } from './SendOrderConfirmation';
  
  describe('SendOrderConfirmation', () => {
    it('should send order confirmation email', async () => {
      const mockEmailService = { sendEmail: jest.fn() };
      const useCase = new SendOrderConfirmation(mockEmailService);
      
      await useCase.execute('ORD-123', 'test@example.com', {
        orderNumber: 'ORD-123',
        customerName: 'John Doe'
      });
      
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });
  });
  ```

**Ventajas**:
- ✅ Todo lo relacionado está junto
- ✅ Fácil de encontrar
- ✅ Fácil de eliminar si ya no se necesita
- ✅ Tests junto al código que prueban

### 2. Carpeta shared/

**Propósito**: Contiene código compartido entre múltiples casos de uso (infraestructura, utilidades, tipos).

**Subcarpetas**:

- **infrastructure/**: Servicios de infraestructura compartidos
  ```typescript
  // shared/email/EmailService.ts
  import nodemailer from 'nodemailer';
  
  export class EmailService {
    private transporter: any;
    
    constructor(config: EmailConfig) {
      this.transporter = nodemailer.createTransporter(config);
    }
    
    async sendEmail(to: string, template: EmailTemplate): Promise<void> {
      await this.transporter.sendMail({
        from: 'noreply@technovastore.com',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    }
  }
  ```

- **types/**: Tipos TypeScript compartidos
  ```typescript
  // shared/types/index.ts
  export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
  }
  
  export interface EmailConfig {
    host: string;
    port: number;
    auth: {
      user: string;
      pass: string;
    };
  }
  ```

- **utils/**: Utilidades compartidas
  ```typescript
  // shared/utils/helpers.ts
  export function formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES');
  }
  
  export function generateId(): string {
    return `${Date.now()}-${Math.random()}`;
  }
  ```

### 3. Carpeta api/

**Propósito**: Capa de presentación HTTP que expone los casos de uso como endpoints.

**Componentes**:

- **Controller**: Maneja requests HTTP y delega a casos de uso
  ```typescript
  // api/NotificationController.ts
  import { Request, Response } from 'express';
  import { SendOrderConfirmation } from '../send-order-confirmation/SendOrderConfirmation';
  
  export class NotificationController {
    constructor(private sendOrderConfirmation: SendOrderConfirmation) {}
    
    async sendOrderConfirmation(req: Request, res: Response): Promise<void> {
      try {
        const { orderId, customerEmail, orderData } = req.body;
        await this.sendOrderConfirmation.execute(orderId, customerEmail, orderData);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
  ```

- **Routes**: Define endpoints HTTP
  ```typescript
  // api/routes.ts
  import { Router } from 'express';
  import { NotificationController } from './NotificationController';
  
  export function createRoutes(controller: NotificationController): Router {
    const router = Router();
    
    router.post('/notifications/order-confirmation', 
      (req, res) => controller.sendOrderConfirmation(req, res)
    );
    
    return router;
  }
  ```

### 3. Infrastructure (Infraestructura)

**Propósito**: Implementa los detalles técnicos (base de datos, APIs externas, etc.).

**Componentes**:

- **Database Repositories**: Implementaciones concretas de repositorios
  ```typescript
  // src/infrastructure/database/repositories/MongoUserRepository.ts
  export class MongoUserRepository implements IUserRepository {
    constructor(private model: Model<UserDocument>) {}
    
    async findById(id: string): Promise<User | null> {
      const doc = await this.model.findById(id);
      if (!doc) return null;
      return this.toDomain(doc);
    }
    
    async save(user: User): Promise<void> {
      await this.model.create(this.toPersistence(user));
    }
    
    private toDomain(doc: UserDocument): User {
      return new User(
        doc._id.toString(),
        doc.name,
        new Email(doc.email),
        doc.createdAt
      );
    }
    
    private toPersistence(user: User): any {
      return {
        _id: user.id,
        name: user.name,
        email: user.email.toString(),
        createdAt: user.createdAt
      };
    }
  }
  ```

- **Database Models**: Esquemas de base de datos
  ```typescript
  // src/infrastructure/database/models/UserModel.ts
  import mongoose from 'mongoose';
  
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  export const UserModel = mongoose.model('User', userSchema);
  ```

- **External Services**: Integraciones con servicios externos
  ```typescript
  // src/infrastructure/external/EmailService.ts
  export class EmailService {
    async sendWelcomeEmail(email: string, name: string): Promise<void> {
      // Implementación de envío de email
    }
  }
  ```

### 4. Presentation (Presentación)

**Propósito**: Maneja la interfaz HTTP, validación de entrada y serialización de respuestas.

**Componentes**:

- **Controllers**: Manejan requests HTTP
  ```typescript
  // src/presentation/controllers/UserController.ts
  export class UserController {
    constructor(private createUserUseCase: CreateUserUseCase) {}
    
    async create(req: Request, res: Response): Promise<void> {
      try {
        const dto: CreateUserDTO = req.body;
        const user = await this.createUserUseCase.execute(dto);
        res.status(201).json(user);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  }
  ```

- **Routes**: Definen endpoints
  ```typescript
  // src/presentation/routes/userRoutes.ts
  import { Router } from 'express';
  
  export function createUserRoutes(controller: UserController): Router {
    const router = Router();
    
    router.post('/users', 
      validateRequest(createUserSchema),
      (req, res) => controller.create(req, res)
    );
    
    return router;
  }
  ```

- **Validators**: Validan entrada
  ```typescript
  // src/presentation/validators/userValidator.ts
  import Joi from 'joi';
  
  export const createUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required()
  });
  ```

## Flujo de Datos

```
Request → Controller → Use Case → Domain Service → Repository → Database
                                       ↓
                                   Entity
                                       ↓
Response ← Controller ← DTO ← Mapper ← Entity
```

## Reglas de Dependencia

1. **Domain** no depende de ninguna otra capa
2. **Application** depende solo de **Domain**
3. **Infrastructure** depende de **Domain** y **Application**
4. **Presentation** depende de **Application**
5. Las dependencias siempre apuntan hacia adentro (hacia Domain)

## Convenciones de Nombres

### Archivos y Carpetas
- Carpetas: `kebab-case` (ej: `use-cases`, `value-objects`)
- Archivos de clases: `PascalCase` (ej: `UserController.ts`, `CreateUser.ts`)
- Archivos de configuración: `camelCase` (ej: `database.ts`, `logger.ts`)

### Código
- Clases: `PascalCase` (ej: `User`, `CreateUserUseCase`)
- Interfaces: `IPascalCase` (ej: `IUserRepository`)
- Funciones/métodos: `camelCase` (ej: `findById`, `createUser`)
- Constantes: `UPPER_SNAKE_CASE` (ej: `MAX_RETRY_ATTEMPTS`)
- Variables: `camelCase` (ej: `userName`, `isValid`)

### Tests
- Archivos de test: `*.test.ts` (ej: `User.test.ts`)
- Describe blocks: Nombre de la clase/función
- It blocks: Descripción del comportamiento esperado

## Configuración de Archivos Base

### package.json
```json
{
  "name": "@technovastore/service-name",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^7.0.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@domain/*": ["domain/*"],
      "@application/*": ["application/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@presentation/*": ["presentation/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## Adaptaciones por Tipo de Servicio

### Servicios Simples (ej: notification-service)
- Pueden omitir `domain/services` si no hay lógica de dominio compleja
- Pueden tener menos capas de abstracción
- Mantener estructura básica para consistencia

### Servicios de IA/ML (ej: chatbot, recommender)
- Agregar carpeta `src/ml/` para modelos y algoritmos
- Agregar carpeta `src/training/` para scripts de entrenamiento
- Mantener separación entre lógica de ML y lógica de negocio

### Servicios de Automatización (ej: sync-engine)
- Agregar carpeta `src/jobs/` para trabajos programados
- Agregar carpeta `src/schedulers/` para configuración de cron
- Mantener casos de uso claros para cada automatización

### API Gateway
- Enfocarse en `presentation/` y `infrastructure/`
- Agregar carpeta `src/proxy/` para configuración de proxy
- Agregar carpeta `src/aggregation/` para agregación de respuestas

## Checklist de Migración

Al migrar un servicio a esta estructura:

- [ ] Crear estructura de carpetas estándar
- [ ] Identificar y mover entidades a `domain/entities/`
- [ ] Identificar y mover value objects a `domain/value-objects/`
- [ ] Crear interfaces de repositorios en `domain/repositories/`
- [ ] Mover lógica de negocio a `domain/services/`
- [ ] Identificar casos de uso y moverlos a `application/use-cases/`
- [ ] Crear DTOs en `application/dtos/`
- [ ] Crear mappers en `application/mappers/`
- [ ] Mover implementaciones de repositorios a `infrastructure/database/repositories/`
- [ ] Mover modelos de BD a `infrastructure/database/models/`
- [ ] Mover controladores a `presentation/controllers/`
- [ ] Mover rutas a `presentation/routes/`
- [ ] Mover middleware a `presentation/middleware/`
- [ ] Mover validadores a `presentation/validators/`
- [ ] Reorganizar tests según estructura (unit, integration, e2e)
- [ ] Actualizar imports en todos los archivos
- [ ] Actualizar tsconfig.json con paths
- [ ] Actualizar jest.config.js con moduleNameMapper
- [ ] Ejecutar tests para verificar que todo funciona
- [ ] Actualizar documentación del servicio

## Beneficios de Esta Estructura

1. **Mantenibilidad**: Código organizado y fácil de encontrar
2. **Testabilidad**: Cada capa puede testearse independientemente
3. **Escalabilidad**: Fácil agregar nuevas funcionalidades
4. **Claridad**: La estructura refleja el dominio del negocio
5. **Independencia**: Cambios en una capa no afectan otras
6. **Reutilización**: Lógica de dominio puede reutilizarse
7. **Onboarding**: Nuevos desarrolladores entienden rápidamente la estructura

## Referencias

- Clean Architecture (Robert C. Martin)
- Domain-Driven Design (Eric Evans)
- Hexagonal Architecture (Alistair Cockburn)
- Screaming Architecture (Robert C. Martin)
