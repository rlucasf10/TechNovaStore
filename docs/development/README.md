# Documentación para Desarrolladores - TechNovaStore

Esta sección contiene toda la información necesaria para desarrolladores que trabajen en TechNovaStore, incluyendo arquitectura, estándares de código, guías de desarrollo y mejores prácticas.

## Índice

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Guías de Desarrollo](#guías-de-desarrollo)
- [Testing](#testing)
- [Debugging](#debugging)
- [Contribución](#contribución)

## Arquitectura del Sistema

### Visión General

TechNovaStore utiliza una arquitectura de microservicios basada en Node.js con TypeScript, diseñada para ser escalable, mantenible y resiliente.

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App    │
│   (Next.js)     │    │   (React Native)│
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌─────────────────┐
          │   API Gateway   │
          │   (Express.js)  │
          └─────────┬───────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼───┐    ┌─────▼─────┐    ┌───▼───┐
│Product│    │   User    │    │ Order │
│Service│    │  Service  │    │Service│
└───┬───┘    └─────┬─────┘    └───┬───┘
    │              │              │
┌───▼───┐    ┌─────▼─────┐    ┌───▼───┐
│MongoDB│    │PostgreSQL │    │ Redis │
└───────┘    └───────────┘    └───────┘
```

### Principios Arquitectónicos

1. **Separación de Responsabilidades**: Cada microservicio tiene una responsabilidad específica
2. **Comunicación Asíncrona**: Uso de eventos para comunicación entre servicios
3. **Tolerancia a Fallos**: Circuit breakers y mecanismos de retry
4. **Escalabilidad Horizontal**: Servicios stateless que pueden escalarse independientemente
5. **Observabilidad**: Logging, métricas y tracing distribuido

### Microservicios

#### API Gateway
- **Responsabilidad**: Punto de entrada único, autenticación, rate limiting
- **Tecnología**: Express.js, JWT, Redis
- **Puerto**: 3000

#### Product Service
- **Responsabilidad**: Gestión del catálogo de productos
- **Tecnología**: Express.js, MongoDB, Mongoose
- **Puerto**: 3001

#### User Service
- **Responsabilidad**: Autenticación y gestión de usuarios
- **Tecnología**: Express.js, PostgreSQL, Sequelize
- **Puerto**: 3002

#### Order Service
- **Responsabilidad**: Procesamiento de pedidos
- **Tecnología**: Express.js, PostgreSQL, Sequelize
- **Puerto**: 3003

#### Payment Service
- **Responsabilidad**: Procesamiento de pagos
- **Tecnología**: Express.js, PostgreSQL
- **Puerto**: 3004

#### Notification Service
- **Responsabilidad**: Envío de notificaciones
- **Tecnología**: Express.js, Redis, Nodemailer
- **Puerto**: 3005

### Servicios de Automatización

#### Product Sync Engine
- **Responsabilidad**: Sincronización automática de productos
- **Tecnología**: Node.js, MongoDB, Cron Jobs
- **Ubicación**: `automation/sync-engine/`

#### Auto Purchase System
- **Responsabilidad**: Compra automática en proveedores
- **Tecnología**: Node.js, PostgreSQL, Queue System
- **Ubicación**: `automation/auto-purchase/`

#### Shipment Tracker
- **Responsabilidad**: Seguimiento de envíos
- **Tecnología**: Node.js, APIs de tracking
- **Ubicación**: `automation/shipment-tracker/`

## Configuración del Entorno de Desarrollo

### Prerrequisitos

- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **Docker**: v20.0.0 o superior
- **Git**: Para control de versiones
- **VS Code**: Editor recomendado

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/technovastore/technovastore.git
cd technovastore
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

4. **Iniciar bases de datos**
```bash
docker-compose up -d mongodb postgresql redis
```

5. **Ejecutar migraciones**
```bash
npm run migrate
```

6. **Iniciar servicios en modo desarrollo**
```bash
npm run dev
```

### Estructura del Proyecto

```
technovastore/
├── api-gateway/           # API Gateway
├── services/             # Microservicios
│   ├── product/         # Servicio de productos
│   ├── user/           # Servicio de usuarios
│   ├── order/          # Servicio de pedidos
│   ├── payment/        # Servicio de pagos
│   └── notification/   # Servicio de notificaciones
├── automation/          # Servicios de automatización
│   ├── sync-engine/    # Motor de sincronización
│   ├── auto-purchase/  # Sistema de compra automática
│   └── shipment-tracker/ # Seguimiento de envíos
├── frontend/           # Aplicación React/Next.js
├── shared/            # Código compartido
│   ├── config/       # Configuración compartida
│   ├── models/       # Modelos de datos
│   ├── types/        # Tipos TypeScript
│   └── utils/        # Utilidades compartidas
├── infrastructure/    # Configuración de infraestructura
├── tests/            # Tests de integración
├── docs/             # Documentación
└── scripts/          # Scripts de utilidad
```

### Configuración de VS Code

#### Extensiones Recomendadas

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "ms-vscode-remote.remote-containers"
  ]
}
```

#### Configuración del Workspace

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.workingDirectories": [
    "api-gateway",
    "services/product",
    "services/user",
    "services/order",
    "frontend"
  ]
}
```

## Estándares de Código

### TypeScript

#### Configuración Base

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Convenciones de Nomenclatura

```typescript
// Interfaces - PascalCase con prefijo I
interface IUser {
  id: string;
  email: string;
}

// Types - PascalCase
type UserRole = 'admin' | 'customer';

// Enums - PascalCase
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped'
}

// Clases - PascalCase
class UserService {
  private readonly repository: IUserRepository;
  
  constructor(repository: IUserRepository) {
    this.repository = repository;
  }
}

// Funciones y variables - camelCase
const getUserById = async (id: string): Promise<IUser | null> => {
  return await userRepository.findById(id);
};

// Constantes - UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 5;
const JWT_EXPIRATION_TIME = '1h';
```

### ESLint Configuration

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Estructura de Archivos

#### Microservicio Típico

```
service/
├── src/
│   ├── controllers/     # Controladores HTTP
│   ├── services/       # Lógica de negocio
│   ├── repositories/   # Acceso a datos
│   ├── models/         # Modelos de datos
│   ├── middleware/     # Middleware personalizado
│   ├── routes/         # Definición de rutas
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilidades
│   ├── config/         # Configuración
│   └── index.ts        # Punto de entrada
├── tests/              # Tests unitarios
├── package.json
├── tsconfig.json
├── jest.config.js
└── Dockerfile
```

#### Ejemplo de Controlador

```typescript
// src/controllers/ProductController.ts
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';
import { CreateProductDto, UpdateProductDto } from '../types/ProductDto';
import { validateDto } from '../utils/validation';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  public async getProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page = 1, limit = 20, category } = req.query;
      
      const products = await this.productService.getProducts({
        page: Number(page),
        limit: Number(limit),
        category: category as string,
      });

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const createProductDto = await validateDto(CreateProductDto, req.body);
      const product = await this.productService.createProduct(createProductDto);

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

#### Ejemplo de Servicio

```typescript
// src/services/ProductService.ts
import { IProductRepository } from '../repositories/IProductRepository';
import { IProduct, CreateProductDto, UpdateProductDto } from '../types/Product';
import { PaginationOptions, PaginatedResult } from '../types/Pagination';
import { BusinessError } from '../utils/errors';

export class ProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  public async getProducts(
    options: PaginationOptions & { category?: string }
  ): Promise<PaginatedResult<IProduct>> {
    return await this.productRepository.findMany(options);
  }

  public async getProductById(id: string): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    
    if (!product) {
      throw new BusinessError('Product not found', 404);
    }

    return product;
  }

  public async createProduct(dto: CreateProductDto): Promise<IProduct> {
    // Validar que el SKU no exista
    const existingProduct = await this.productRepository.findBySku(dto.sku);
    
    if (existingProduct) {
      throw new BusinessError('Product with this SKU already exists', 400);
    }

    return await this.productRepository.create(dto);
  }

  public async updateProduct(
    id: string,
    dto: UpdateProductDto
  ): Promise<IProduct> {
    const product = await this.getProductById(id);
    
    return await this.productRepository.update(id, dto);
  }
}
```

## Guías de Desarrollo

### Desarrollo de Nuevas Funcionalidades

#### 1. Planificación
- Crear issue en GitHub con descripción detallada
- Definir criterios de aceptación
- Estimar complejidad y tiempo

#### 2. Desarrollo
- Crear rama feature desde develop: `git checkout -b feature/nueva-funcionalidad`
- Implementar funcionalidad siguiendo TDD
- Escribir tests unitarios y de integración
- Documentar cambios en código

#### 3. Testing
- Ejecutar tests localmente: `npm test`
- Verificar cobertura de código: `npm run test:coverage`
- Probar manualmente en entorno local

#### 4. Code Review
- Crear Pull Request hacia develop
- Solicitar revisión de al menos 2 desarrolladores
- Abordar comentarios y sugerencias

#### 5. Deployment
- Merge a develop para despliegue en staging
- Verificar funcionalidad en staging
- Merge a main para despliegue en producción

### Patrones de Diseño

#### Repository Pattern

```typescript
// IProductRepository.ts
export interface IProductRepository {
  findById(id: string): Promise<IProduct | null>;
  findMany(options: FindManyOptions): Promise<PaginatedResult<IProduct>>;
  create(data: CreateProductDto): Promise<IProduct>;
  update(id: string, data: UpdateProductDto): Promise<IProduct>;
  delete(id: string): Promise<void>;
}

// MongoProductRepository.ts
export class MongoProductRepository implements IProductRepository {
  constructor(private readonly model: Model<IProduct>) {}

  async findById(id: string): Promise<IProduct | null> {
    return await this.model.findById(id).lean();
  }

  async findMany(options: FindManyOptions): Promise<PaginatedResult<IProduct>> {
    const { page, limit, filters } = options;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.model.find(filters).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filters),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

#### Factory Pattern

```typescript
// ServiceFactory.ts
export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  public getProductService(): ProductService {
    if (!this.services.has('ProductService')) {
      const repository = new MongoProductRepository(ProductModel);
      const service = new ProductService(repository);
      this.services.set('ProductService', service);
    }
    return this.services.get('ProductService');
  }
}
```

#### Observer Pattern para Eventos

```typescript
// EventEmitter.ts
export class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  public emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }
}

// Uso en servicios
export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter
  ) {}

  public async createOrder(dto: CreateOrderDto): Promise<IOrder> {
    const order = await this.orderRepository.create(dto);
    
    // Emitir evento para otros servicios
    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
    });

    return order;
  }
}
```

### Manejo de Errores

#### Jerarquía de Errores

```typescript
// errors/BaseError.ts
export abstract class BaseError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: any) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// errors/BusinessError.ts
export class BusinessError extends BaseError {
  public readonly statusCode: number;
  public readonly isOperational = true;

  constructor(message: string, statusCode = 400, context?: any) {
    super(message, context);
    this.statusCode = statusCode;
  }
}

// errors/ValidationError.ts
export class ValidationError extends BaseError {
  public readonly statusCode = 400;
  public readonly isOperational = true;

  constructor(
    message: string,
    public readonly errors: ValidationErrorDetail[]
  ) {
    super(message);
  }
}
```

#### Error Handler Middleware

```typescript
// middleware/errorHandler.ts
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof BaseError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.constructor.name,
        context: error.context,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
    return;
  }

  // Error no manejado
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      requestId: req.id,
    },
  });
};
```

### Logging

#### Configuración de Winston

```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown',
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export { logger };
```

#### Uso del Logger

```typescript
// Ejemplo de uso en servicios
export class ProductService {
  private readonly logger = logger.child({ component: 'ProductService' });

  public async createProduct(dto: CreateProductDto): Promise<IProduct> {
    this.logger.info('Creating product', { sku: dto.sku });

    try {
      const product = await this.productRepository.create(dto);
      
      this.logger.info('Product created successfully', {
        productId: product.id,
        sku: product.sku,
      });

      return product;
    } catch (error) {
      this.logger.error('Failed to create product', {
        error: error.message,
        sku: dto.sku,
      });
      throw error;
    }
  }
}
```

## Testing

### Configuración de Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### Tests Unitarios

```typescript
// tests/services/ProductService.test.ts
import { ProductService } from '../../src/services/ProductService';
import { IProductRepository } from '../../src/repositories/IProductRepository';
import { BusinessError } from '../../src/utils/errors';

describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findBySku: jest.fn(),
    };
    productService = new ProductService(mockRepository);
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        id: '1',
        sku: 'TEST-001',
        name: 'Test Product',
        price: 99.99,
      };
      mockRepository.findById.mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw BusinessError when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(productService.getProductById('1')).rejects.toThrow(
        BusinessError
      );
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const createDto = {
        sku: 'TEST-001',
        name: 'Test Product',
        price: 99.99,
      };
      const mockProduct = { id: '1', ...createDto };

      mockRepository.findBySku.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockProduct);

      const result = await productService.createProduct(createDto);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findBySku).toHaveBeenCalledWith('TEST-001');
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw error when SKU already exists', async () => {
      const createDto = {
        sku: 'TEST-001',
        name: 'Test Product',
        price: 99.99,
      };
      const existingProduct = { id: '1', ...createDto };

      mockRepository.findBySku.mockResolvedValue(existingProduct);

      await expect(productService.createProduct(createDto)).rejects.toThrow(
        'Product with this SKU already exists'
      );
    });
  });
});
```

### Tests de Integración

```typescript
// tests/integration/ProductController.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../helpers/database';

describe('ProductController Integration', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /products', () => {
    it('should return paginated products', async () => {
      const response = await request(app)
        .get('/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/products')
        .query({ category: 'electronics' })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.products.forEach((product: any) => {
        expect(product.category).toBe('electronics');
      });
    });
  });

  describe('POST /products', () => {
    it('should create product with valid data', async () => {
      const productData = {
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Test description',
        category: 'electronics',
        brand: 'Test Brand',
        price: 99.99,
      };

      const response = await request(app)
        .post('/products')
        .set('Authorization', 'Bearer valid-admin-token')
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(productData);
    });

    it('should return 401 without authentication', async () => {
      const productData = {
        sku: 'TEST-002',
        name: 'Test Product',
        price: 99.99,
      };

      await request(app)
        .post('/products')
        .send(productData)
        .expect(401);
    });
  });
});
```

### Tests E2E

```typescript
// tests/e2e/purchase-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test('complete purchase flow', async ({ page }) => {
    // 1. Navegar a la página principal
    await page.goto('http://localhost:3000');

    // 2. Buscar producto
    await page.fill('[data-testid="search-input"]', 'laptop');
    await page.click('[data-testid="search-button"]');

    // 3. Seleccionar producto
    await page.click('[data-testid="product-card"]:first-child');

    // 4. Agregar al carrito
    await page.click('[data-testid="add-to-cart"]');

    // 5. Ir al carrito
    await page.click('[data-testid="cart-icon"]');

    // 6. Proceder al checkout
    await page.click('[data-testid="checkout-button"]');

    // 7. Llenar información de envío
    await page.fill('[data-testid="shipping-address"]', 'Calle Mayor 123');
    await page.fill('[data-testid="shipping-city"]', 'Madrid');
    await page.fill('[data-testid="shipping-postal-code"]', '28001');

    // 8. Seleccionar método de pago
    await page.click('[data-testid="payment-method-card"]');

    // 9. Completar compra
    await page.click('[data-testid="complete-purchase"]');

    // 10. Verificar confirmación
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
  });
});
```

## Debugging

### Configuración de Debug

#### VS Code Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Gateway",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/api-gateway/src/index.ts",
      "outFiles": ["${workspaceFolder}/api-gateway/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Product Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/services/product/src/index.ts",
      "outFiles": ["${workspaceFolder}/services/product/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "PORT": "3001"
      }
    }
  ]
}
```

#### Debug con Docker

```dockerfile
# Dockerfile.debug
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Instalar ts-node para debugging
RUN npm install -g ts-node

EXPOSE 3000 9229

CMD ["node", "--inspect=0.0.0.0:9229", "-r", "ts-node/register", "src/index.ts"]
```

### Herramientas de Debug

#### Request ID Tracking

```typescript
// middleware/requestId.ts
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};
```

#### Performance Monitoring

```typescript
// middleware/performance.ts
export const performanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      requestId: req.id,
    });
  });

  next();
};
```

## Contribución

### Flujo de Trabajo Git

1. **Fork del repositorio**
2. **Crear rama feature**: `git checkout -b feature/nueva-funcionalidad`
3. **Commits descriptivos**: Usar conventional commits
4. **Push a tu fork**: `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

### Conventional Commits

```
feat: add user authentication
fix: resolve memory leak in product sync
docs: update API documentation
style: format code with prettier
refactor: extract validation logic
test: add unit tests for order service
chore: update dependencies
```

### Code Review Checklist

- [ ] Código sigue estándares de estilo
- [ ] Tests unitarios incluidos
- [ ] Documentación actualizada
- [ ] No hay secretos hardcodeados
- [ ] Manejo de errores apropiado
- [ ] Performance considerada
- [ ] Seguridad revisada

### Recursos Adicionales

- [Guía de TypeScript](https://www.typescriptlang.org/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Docker Documentation](https://docs.docker.com/)

## FAQ

### ¿Cómo agregar un nuevo microservicio?

1. Crear directorio en `services/`
2. Copiar estructura base de otro servicio
3. Configurar package.json y dependencias
4. Implementar controladores, servicios y repositorios
5. Agregar rutas al API Gateway
6. Configurar Docker y docker-compose
7. Escribir tests
8. Documentar endpoints

### ¿Cómo manejar migraciones de base de datos?

```typescript
// migrations/001-create-users-table.ts
export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('users');
};
```

### ¿Cómo implementar autenticación en un nuevo endpoint?

```typescript
// Usar middleware de autenticación
app.get('/api/protected-endpoint', authMiddleware, (req, res) => {
  // req.user contiene información del usuario autenticado
  res.json({ message: 'Acceso autorizado', user: req.user });
});
```

Para más preguntas, consulta la [documentación completa](../README.md) o abre un [issue en GitHub](https://github.com/technovastore/issues).