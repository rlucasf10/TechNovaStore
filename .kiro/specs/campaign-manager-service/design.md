# Documento de Diseño - Campaign Manager Service

## Overview

El Campaign Manager Service es un microservicio que gestiona automáticamente campañas promocionales en TechNovaStore. El servicio aplica y remueve descuentos en productos según reglas configuradas y fechas establecidas, integrándose con el Product Service existente y sincronizando con el frontend para mostrar campañas dinámicas.

### Objetivos Principales

- **Automatización Total**: Aplicar y remover descuentos automáticamente según fechas sin intervención manual
- **Flexibilidad**: Soportar reglas de descuento por producto, categoría o globalmente
- **Integración**: Sincronizar con Product Service y frontend de forma transparente
- **Observabilidad**: Proveer métricas, logs y analytics detallados
- **Escalabilidad**: Procesar miles de productos eficientemente

### Alcance

**Incluye:**
- Gestión CRUD de campañas promocionales
- Aplicación y remoción automática de descuentos
- Scheduler con cron jobs para automatización
- API REST para administración
- Integración con Product Service
- Analytics y reportes de campañas
- Nueva sección "Campañas" integrada en el AdminDashboard existente (no un panel nuevo)
- Integración con stack de monitoreo (Prometheus, Grafana, ELK)

**No Incluye:**
- Cambios en la lógica de negocio del Product Service (cálculo de precios, gestión de proveedores)
- Sistema de recomendaciones (usa Recommender Service existente)
- Procesamiento de pagos (usa Payment Service existente)
- Gestión de inventario (usa Product Service existente)

**Requiere Modificaciones en Product Service:**
- ✅ Agregar campos de campaña al modelo Product (in_campaign, campaign_id, campaign_price, original_price, discount_percentage)
- ✅ Crear/actualizar endpoints para que Campaign Manager pueda actualizar estos campos
- ✅ Estas modificaciones son parte del alcance del proyecto

## Architecture

### Arquitectura General


```mermaid
graph TB
    subgraph "Frontend"
        Admin[Admin Dashboard]
        Public[Public Pages]
    end
    
    subgraph "Campaign Manager Service"
        API[API Layer<br/>Express REST]
        Scheduler[Cron Scheduler<br/>node-cron]
        
        subgraph "Use Cases"
            CreateCampaign[Create Campaign]
            ApplyDiscounts[Apply Discounts]
            RemoveDiscounts[Remove Discounts]
            GetAnalytics[Get Analytics]
        end
        
        subgraph "Shared Infrastructure"
            Repos[Repositories]
            Clients[External Clients]
            Utils[Utilities]
        end
    end
    
    subgraph "External Services"
        ProductService[Product Service<br/>Port 3001]
        NotificationService[Notification Service<br/>Port 3005]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Campaigns DB)]
    end
    
    subgraph "Monitoring"
        Prometheus[Prometheus]
        Grafana[Grafana]
        ELK[ELK Stack]
    end
    
    Admin --> API
    Public --> API
    API --> CreateCampaign
    API --> ApplyDiscounts
    API --> GetAnalytics
    Scheduler --> ApplyDiscounts
    Scheduler --> RemoveDiscounts
    
    CreateCampaign --> Repos
    ApplyDiscounts --> Repos
    ApplyDiscounts --> Clients
    RemoveDiscounts --> Repos
    RemoveDiscounts --> Clients
    GetAnalytics --> Repos
    
    Repos --> PostgreSQL
    Clients --> ProductService
    Clients --> NotificationService
    
    API --> Prometheus
    API --> ELK
    Prometheus --> Grafana
```

### Screaming Architecture

El servicio sigue Screaming Architecture donde los casos de uso son carpetas en la raíz del proyecto:


```
campaign-manager-service/
├── create-campaign/              # Caso de uso: Crear campaña
│   ├── CreateCampaign.ts
│   └── CreateCampaign.test.ts
├── update-campaign/              # Caso de uso: Actualizar campaña
│   ├── UpdateCampaign.ts
│   └── UpdateCampaign.test.ts
├── delete-campaign/              # Caso de uso: Eliminar campaña
│   ├── DeleteCampaign.ts
│   └── DeleteCampaign.test.ts
├── get-campaign/                 # Caso de uso: Obtener campaña
│   ├── GetCampaign.ts
│   └── GetCampaign.test.ts
├── list-campaigns/               # Caso de uso: Listar campañas
│   ├── ListCampaigns.ts
│   └── ListCampaigns.test.ts
├── get-active-campaign/          # Caso de uso: Obtener campaña activa
│   ├── GetActiveCampaign.ts
│   └── GetActiveCampaign.test.ts
├── apply-campaign-discounts/     # Caso de uso: Aplicar descuentos
│   ├── ApplyCampaignDiscounts.ts
│   └── ApplyCampaignDiscounts.test.ts
├── remove-campaign-discounts/    # Caso de uso: Remover descuentos
│   ├── RemoveCampaignDiscounts.ts
│   └── RemoveCampaignDiscounts.test.ts
├── calculate-discount/           # Caso de uso: Calcular descuento
│   ├── CalculateDiscount.ts
│   └── CalculateDiscount.test.ts
├── get-campaign-analytics/       # Caso de uso: Obtener analytics
│   ├── GetCampaignAnalytics.ts
│   └── GetCampaignAnalytics.test.ts
├── generate-campaign-report/     # Caso de uso: Generar reporte
│   ├── GenerateCampaignReport.ts
│   └── GenerateCampaignReport.test.ts
├── check-activate-campaigns/     # Caso de uso: Verificar activación (Cron)
│   ├── CheckActivateCampaigns.ts
│   └── CheckActivateCampaigns.test.ts
├── check-deactivate-campaigns/   # Caso de uso: Verificar desactivación (Cron)
│   ├── CheckDeactivateCampaigns.ts
│   └── CheckDeactivateCampaigns.test.ts
├── shared/                       # Infraestructura compartida
│   ├── models/                   # Modelos de datos
│   │   ├── Campaign.ts
│   │   ├── CampaignProduct.ts
│   │   └── CampaignAnalytics.ts
│   ├── repositories/             # Repositorios
│   │   ├── CampaignRepository.ts
│   │   ├── CampaignProductRepository.ts
│   │   └── CampaignAnalyticsRepository.ts
│   ├── clients/                  # Clientes externos
│   │   ├── ProductServiceClient.ts
│   │   └── NotificationServiceClient.ts
│   ├── utils/                    # Utilidades
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   ├── discount-calculator.ts
│   │   └── batch-processor.ts
│   └── types/                    # Tipos compartidos
│       └── index.ts
├── api/                          # Capa de presentación HTTP
│   ├── CampaignController.ts
│   └── routes.ts
├── config/                       # Configuración
│   └── index.ts
├── cron/                         # Tareas programadas
│   └── campaign-scheduler.ts
├── index.ts                      # Entry point
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Patrones de Diseño

- **Repository Pattern**: Abstracción de acceso a datos
- **Client Pattern**: Abstracción de servicios externos
- **Use Case Pattern**: Lógica de negocio encapsulada
- **Dependency Injection**: Inyección de dependencias para testabilidad
- **Batch Processing**: Procesamiento por lotes para eficiencia

## Components and Interfaces

### Core Use Cases


#### CreateCampaign

```typescript
interface CreateCampaignInput {
  name: string
  slug: string
  startDate: Date
  endDate: Date
  priority: number
  discountRules: DiscountRules
  frontendConfig: FrontendConfig
}

interface CreateCampaignOutput {
  id: string
  campaign: Campaign
}

class CreateCampaign {
  constructor(
    private campaignRepository: CampaignRepository,
    private validator: CampaignValidator
  ) {}
  
  async execute(input: CreateCampaignInput): Promise<CreateCampaignOutput> {
    // 1. Validar datos de entrada
    // 2. Verificar unicidad del nombre
    // 3. Crear campaña en BD
    // 4. Retornar campaña creada
  }
}
```

#### ApplyCampaignDiscounts

```typescript
interface ApplyDiscountsInput {
  campaignId: string
}

interface ApplyDiscountsOutput {
  productsAffected: number
  totalDiscountAmount: number
  averageDiscountPercentage: number
}

class ApplyCampaignDiscounts {
  constructor(
    private campaignRepository: CampaignRepository,
    private campaignProductRepository: CampaignProductRepository,
    private productServiceClient: ProductServiceClient,
    private discountCalculator: DiscountCalculator,
    private batchProcessor: BatchProcessor
  ) {}
  
  async execute(input: ApplyDiscountsInput): Promise<ApplyDiscountsOutput> {
    // 1. Obtener campaña
    // 2. Obtener productos elegibles
    // 3. Calcular descuentos para cada producto
    // 4. Aplicar descuentos en lotes de 100
    // 5. Registrar en campaign_products
    // 6. Actualizar Product Service
    // 7. Retornar estadísticas
  }
}
```

#### RemoveCampaignDiscounts

```typescript
interface RemoveDiscountsInput {
  campaignId: string
}

interface RemoveDiscountsOutput {
  productsRestored: number
}

class RemoveCampaignDiscounts {
  constructor(
    private campaignProductRepository: CampaignProductRepository,
    private productServiceClient: ProductServiceClient,
    private batchProcessor: BatchProcessor
  ) {}
  
  async execute(input: RemoveDiscountsInput): Promise<RemoveDiscountsOutput> {
    // 1. Obtener productos con descuento de la campaña
    // 2. Restaurar precios originales en lotes de 100
    // 3. Limpiar campos de campaña en Product Service
    // 4. Eliminar registros de campaign_products
    // 5. Retornar estadísticas
  }
}
```

#### CalculateDiscount

```typescript
interface CalculateDiscountInput {
  product: Product
  discountRules: DiscountRules
}

interface CalculateDiscountOutput {
  originalPrice: number
  campaignPrice: number
  discountAmount: number
  discountPercentage: number
}

class CalculateDiscount {
  execute(input: CalculateDiscountInput): CalculateDiscountOutput {
    // 1. Determinar regla aplicable (producto > categoría > global)
    // 2. Calcular descuento según tipo (porcentaje o fijo)
    // 3. Aplicar descuento máximo si existe
    // 4. Calcular porcentaje de descuento
    // 5. Retornar precios calculados
  }
}
```

### Repositories


#### CampaignRepository

```typescript
interface CampaignRepository {
  create(campaign: CreateCampaignData): Promise<Campaign>
  findById(id: string): Promise<Campaign | null>
  findBySlug(slug: string): Promise<Campaign | null>
  findAll(filters?: CampaignFilters): Promise<Campaign[]>
  findActive(): Promise<Campaign[]>
  findPendingActivation(now: Date): Promise<Campaign[]>
  findPendingDeactivation(now: Date): Promise<Campaign[]>
  update(id: string, data: Partial<Campaign>): Promise<Campaign>
  delete(id: string): Promise<void>
}
```

#### CampaignProductRepository

```typescript
interface CampaignProductRepository {
  create(campaignProduct: CreateCampaignProductData): Promise<CampaignProduct>
  findByCampaignId(campaignId: string): Promise<CampaignProduct[]>
  findByProductId(productId: string): Promise<CampaignProduct[]>
  deleteByCampaignId(campaignId: string): Promise<number>
  countByCampaignId(campaignId: string): Promise<number>
}
```

#### CampaignAnalyticsRepository

```typescript
interface CampaignAnalyticsRepository {
  create(analytics: CreateAnalyticsData): Promise<CampaignAnalytics>
  findByCampaignId(campaignId: string): Promise<CampaignAnalytics[]>
  updateMetrics(campaignId: string, date: Date, metrics: Partial<Metrics>): Promise<void>
  getAggregatedMetrics(campaignId: string): Promise<AggregatedMetrics>
}
```

### External Clients

#### ProductServiceClient

```typescript
interface ProductServiceClient {
  getProduct(productId: string): Promise<Product | null>
  getProducts(filters: ProductFilters): Promise<Product[]>
  getProductsByCategory(category: string): Promise<Product[]>
  updateProduct(productId: string, data: Partial<Product>): Promise<Product>
  updateProductsBatch(updates: ProductUpdate[]): Promise<void>
}
```

#### NotificationServiceClient

```typescript
interface NotificationServiceClient {
  sendCampaignActivated(campaign: Campaign): Promise<void>
  sendCampaignDeactivated(campaign: Campaign, report: CampaignReport): Promise<void>
  sendCampaignError(campaign: Campaign, error: Error): Promise<void>
}
```

### Utilities

#### DiscountCalculator

```typescript
class DiscountCalculator {
  calculateDiscount(
    price: number,
    rule: DiscountRule
  ): { amount: number; percentage: number }
  
  applyMaxDiscount(
    discountAmount: number,
    maxDiscount?: number
  ): number
  
  getApplicableRule(
    product: Product,
    rules: DiscountRules
  ): DiscountRule | null
}
```

#### BatchProcessor

```typescript
class BatchProcessor {
  async processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]>
}
```

#### CampaignValidator

```typescript
class CampaignValidator {
  validateCampaignData(data: CreateCampaignInput): ValidationResult
  validateDiscountRules(rules: DiscountRules): ValidationResult
  validateFrontendConfig(config: FrontendConfig): ValidationResult
  validateDates(startDate: Date, endDate: Date): ValidationResult
}
```

## Data Models

### Campaign

```typescript
interface Campaign {
  id: string
  name: string
  slug: string
  startDate: Date
  endDate: Date
  priority: number
  isActive: boolean
  discountRules: DiscountRules
  frontendConfig: FrontendConfig
  discountsApplied: boolean
  appliedAt?: Date
  deactivatedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### DiscountRules

```typescript
interface DiscountRules {
  global?: DiscountRule
  categories?: Record<string, DiscountRule>
  products?: Record<string, DiscountRule>
}

interface DiscountRule {
  type: 'percentage' | 'fixed'
  value: number
  maxDiscount?: number
  minPurchase?: number
}
```

### FrontendConfig

```typescript
interface FrontendConfig {
  promoBanner: {
    messages: Array<{ icon: string; text: string }>
    backgroundColor?: string
  }
  hero: {
    title: string
    subtitle: string
    ctaText: string
    backgroundImage?: string
    badge?: string
  }
  dealsSection: {
    title: string
    subtitle: string
    badge: string
    backgroundColor?: string
  }
  categories?: string[]
}
```

### CampaignProduct

```typescript
interface CampaignProduct {
  id: string
  campaignId: string
  productId: string
  originalPrice: number
  campaignPrice: number
  discountPercentage: number
  discountAmount: number
  campaignStock?: number
  unitsSold: number
  appliedAt: Date
}
```

### CampaignAnalytics

```typescript
interface CampaignAnalytics {
  id: string
  campaignId: string
  date: Date
  views: number
  clicks: number
  conversions: number
  revenue: number
}
```

### Product (Product Service)

```typescript
interface IProduct {
  // Campos existentes (MongoDB)
  id: string
  sku: string
  name: string
  description: string
  category: string
  subcategory: string
  brand: string
  specifications: Record<string, any>
  images: string[]
  providers: IProvider[]
  our_price: number
  markup_percentage: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  
  // ⚠️ NUEVOS CAMPOS PARA CAMPAÑAS (a implementar)
  in_campaign?: boolean
  campaign_id?: string
  campaign_price?: number
  original_price?: number
  discount_percentage?: number
}
```

**Nota**: Los campos de campaña deben agregarse al schema de MongoDB en Product Service.

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero a través de todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*


### Property 1: Campaign Creation Persistence
*Para cualquier* campaña válida creada, al consultar la campaña por su ID, todos los campos (nombre, fechas, prioridad, reglas) deben coincidir exactamente con los datos originales.
**Validates: Requirements 1.1**

### Property 2: Campaign Update Validation
*Para cualquier* actualización de campaña, si las fechas son incoherentes (inicio >= fin) o las reglas son inválidas, la actualización debe ser rechazada y la campaña debe permanecer sin cambios.
**Validates: Requirements 1.2**

### Property 3: Active Campaign Cleanup
*Para cualquier* campaña activa con descuentos aplicados, al eliminarla, todos los productos deben tener sus descuentos removidos antes de que la campaña sea eliminada de la base de datos.
**Validates: Requirements 1.3**

### Property 4: Priority-Based Campaign Selection
*Para cualquier* conjunto de campañas activas simultáneamente, al consultar la campaña activa, siempre debe retornarse la campaña con la prioridad más alta.
**Validates: Requirements 1.4**

### Property 5: Campaign List Ordering
*Para cualquier* consulta de campañas, la lista retornada debe estar ordenada por prioridad en orden descendente (mayor prioridad primero).
**Validates: Requirements 1.5**

### Property 6: Percentage Discount Range Validation
*Para cualquier* descuento de tipo porcentaje, el valor debe estar entre 1 y 99 inclusive, y cualquier valor fuera de este rango debe ser rechazado.
**Validates: Requirements 2.1**

### Property 7: Fixed Discount Validation
*Para cualquier* descuento de tipo cantidad fija, el valor debe ser un número positivo mayor que cero.
**Validates: Requirements 2.2**

### Property 8: Category Discount Application
*Para cualquier* descuento definido por categoría, todos los productos de esa categoría deben recibir el mismo descuento cuando se aplica la campaña.
**Validates: Requirements 2.3**

### Property 9: Product-Specific Discount Priority
*Para cualquier* producto con descuento específico, descuento de categoría y descuento global aplicables, el descuento específico del producto debe ser el que se aplique.
**Validates: Requirements 2.4**

### Property 10: Global Discount Fallback
*Para cualquier* producto sin descuento específico ni de categoría, si existe un descuento global, ese descuento debe aplicarse.
**Validates: Requirements 2.5**

### Property 11: Maximum Discount Cap
*Para cualquier* descuento porcentual con descuento máximo definido, el descuento calculado nunca debe exceder el valor del descuento máximo en euros.
**Validates: Requirements 2.6**

### Property 12: Discount Rule Mathematical Validity
*Para cualquier* regla de descuento, los cálculos matemáticos deben ser correctos: precio con descuento = precio original - descuento, y porcentaje = (descuento / precio original) * 100.
**Validates: Requirements 2.7**

### Property 13: Original Price Preservation
*Para cualquier* producto al que se le aplica un descuento, el precio original debe guardarse antes de modificar el precio, y debe ser recuperable.
**Validates: Requirements 3.2**

### Property 14: Discount Calculation Correctness
*Para cualquier* producto con descuento aplicado, el precio con descuento y el porcentaje de descuento deben calcularse correctamente según la regla aplicada.
**Validates: Requirements 3.3**

### Property 15: Product Service Synchronization
*Para cualquier* producto con descuento aplicado, los campos campaign_price, discount_percentage, original_price e in_campaign deben actualizarse en el Product Service.
**Validates: Requirements 3.4**

### Property 16: Campaign Product Registration
*Para cualquier* producto con descuento aplicado, debe existir un registro en campaign_products con los precios original y con descuento correctos.
**Validates: Requirements 3.5**

### Property 17: Campaign Priority Resolution
*Para cualquier* producto con múltiples campañas aplicables, el descuento de la campaña con mayor prioridad debe ser el que se aplique.
**Validates: Requirements 3.7**

### Property 18: Price Restoration Round-Trip
*Para cualquier* producto con descuento aplicado, al remover el descuento, el precio debe restaurarse exactamente al precio original guardado.
**Validates: Requirements 4.2**

### Property 19: Campaign Fields Cleanup
*Para cualquier* producto con descuento removido, los campos campaign_price, discount_percentage, original_price e in_campaign deben limpiarse (null o false) en el Product Service.
**Validates: Requirements 4.3**

### Property 20: Campaign Product Records Deletion
*Para cualquier* campaña finalizada, todos los registros de campaign_products asociados deben eliminarse de la base de datos.
**Validates: Requirements 4.4**

### Property 21: Campaign Report Generation
*Para cualquier* campaña finalizada, debe generarse un reporte con métricas (productos afectados, descuento promedio, ventas, ingresos) antes de remover los descuentos.
**Validates: Requirements 4.6**

### Property 22: Campaign Activation Detection
*Para cualquier* campaña cuya fecha de inicio ha llegado y no está activa, el sistema debe detectarla y activarla automáticamente.
**Validates: Requirements 5.2**

### Property 23: Campaign Deactivation Detection
*Para cualquier* campaña cuya fecha de fin ha pasado y está activa, el sistema debe detectarla y desactivarla automáticamente.
**Validates: Requirements 5.4**

### Property 24: Activation Logging
*Para cualquier* activación o desactivación de campaña, debe registrarse un log con el nombre de la campaña, fecha/hora y resultado de la operación.
**Validates: Requirements 5.5**

### Property 25: Activation Notifications
*Para cualquier* activación o desactivación automática de campaña, debe enviarse una notificación al equipo.
**Validates: Requirements 5.6**

### Property 26: Retry on Failure
*Para cualquier* fallo al aplicar o remover descuentos, el sistema debe reintentar la operación hasta 3 veces antes de notificar el error.
**Validates: Requirements 5.7**

### Property 27: Product Service Integration
*Para cualquier* descuento aplicado, el producto debe actualizarse en el Product Service con los campos de campaña correctos.
**Validates: Requirements 6.2**

### Property 28: Product Service Cleanup Integration
*Para cualquier* descuento removido, el producto debe actualizarse en el Product Service removiendo los campos de campaña.
**Validates: Requirements 6.3**

### Property 29: Category Filtering
*Para cualquier* categoría especificada, al obtener productos del Product Service, solo deben retornarse productos de esa categoría.
**Validates: Requirements 6.4**

### Property 30: Exponential Backoff Retry
*Para cualquier* fallo de comunicación con Product Service, el sistema debe reintentar con backoff exponencial (1s, 2s, 4s, 8s, etc.).
**Validates: Requirements 6.5**

### Property 31: Product Existence Validation
*Para cualquier* producto al que se intenta aplicar un descuento, el sistema debe verificar que el producto existe en el Product Service antes de aplicar el descuento.
**Validates: Requirements 6.6**

### Property 32: Frontend Config Structure
*Para cualquier* campaña creada, el frontend_config debe contener los campos promoBanner, hero y dealsSection con sus subcampos requeridos.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 33: Analytics Metrics Calculation
*Para cualquier* campaña, las métricas (productos con descuento, descuento promedio, unidades vendidas, ingresos) deben calcularse correctamente basándose en los datos de campaign_products y campaign_analytics.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 34: Date Validation
*Para cualquier* campaña, la fecha de inicio debe ser anterior a la fecha de fin, y ambas fechas deben ser válidas.
**Validates: Requirements 10.1**

### Property 35: Future Date Validation
*Para cualquier* campaña nueva, las fechas de inicio y fin no deben estar en el pasado al momento de la creación.
**Validates: Requirements 10.2**

### Property 36: Campaign Name Uniqueness
*Para cualquier* campaña nueva, el nombre debe ser único en el sistema, y cualquier intento de crear una campaña con nombre duplicado debe ser rechazado.
**Validates: Requirements 10.3**

### Property 37: Numeric Validation
*Para cualquier* campaña, la prioridad debe ser un entero positivo, los porcentajes entre 1-99, y los descuentos fijos números positivos.
**Validates: Requirements 10.4, 10.5, 10.6**

### Property 38: Input Sanitization
*Para cualquier* entrada de usuario (nombre, slug, configuración), el sistema debe sanitizar los inputs para prevenir inyección SQL y XSS.
**Validates: Requirements 10.7**

### Property 39: Campaign Operation Logging
*Para cualquier* operación de creación, actualización o eliminación de campaña, debe registrarse un log con el tipo de operación, campaña afectada y número de productos afectados.
**Validates: Requirements 12.1, 12.2**

### Property 40: Cron Execution Logging
*Para cualquier* ejecución del cron job, debe registrarse un log con la fecha/hora, campañas procesadas y resultado de la operación.
**Validates: Requirements 12.3**


## Error Handling

### Error Types

```typescript
class CampaignError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'CampaignError'
  }
}

// Errores específicos
class CampaignNotFoundError extends CampaignError {
  constructor(campaignId: string) {
    super(
      `Campaign with ID ${campaignId} not found`,
      'CAMPAIGN_NOT_FOUND',
      404
    )
  }
}

class InvalidDiscountRuleError extends CampaignError {
  constructor(details: string) {
    super(
      `Invalid discount rule: ${details}`,
      'INVALID_DISCOUNT_RULE',
      400,
      details
    )
  }
}

class ProductServiceUnavailableError extends CampaignError {
  constructor() {
    super(
      'Product Service is unavailable',
      'PRODUCT_SERVICE_UNAVAILABLE',
      503
    )
  }
}

class DuplicateCampaignNameError extends CampaignError {
  constructor(name: string) {
    super(
      `Campaign with name "${name}" already exists`,
      'DUPLICATE_CAMPAIGN_NAME',
      409
    )
  }
}
```

### Error Handling Strategy

1. **Validation Errors**: Retornar 400 Bad Request con detalles del error
2. **Not Found Errors**: Retornar 404 Not Found
3. **Conflict Errors**: Retornar 409 Conflict (nombres duplicados)
4. **External Service Errors**: Reintentar con backoff exponencial, luego retornar 503 Service Unavailable
5. **Internal Errors**: Registrar en logs con stack trace, retornar 500 Internal Server Error
6. **Database Errors**: Rollback de transacciones, registrar en logs, retornar 500

### Retry Strategy

```typescript
class RetryStrategy {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt)
          await this.sleep(delay)
        }
      }
    }
    
    throw lastError
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### Transaction Management

```typescript
class TransactionManager {
  async executeInTransaction<T>(
    operation: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    const transaction = await this.db.beginTransaction()
    
    try {
      const result = await operation(transaction)
      await transaction.commit()
      return result
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
```

## Testing Strategy

### Unit Testing

**Framework**: Jest

**Cobertura Objetivo**: 80% mínimo

**Áreas de Testing**:

1. **Use Cases**: Testear cada caso de uso con inputs válidos e inválidos
2. **Repositories**: Testear operaciones CRUD con mocks de base de datos
3. **Clients**: Testear comunicación con servicios externos usando mocks
4. **Utilities**: Testear cálculos de descuentos, validaciones, batch processing
5. **Error Handling**: Testear manejo de errores y reintentos

**Ejemplo de Test Unitario**:

```typescript
describe('CalculateDiscount', () => {
  let calculateDiscount: CalculateDiscount
  
  beforeEach(() => {
    calculateDiscount = new CalculateDiscount()
  })
  
  it('should calculate percentage discount correctly', () => {
    const product = { id: '1', our_price: 1000, category: 'laptops' }
    const rules = {
      global: { type: 'percentage', value: 20 }
    }
    
    const result = calculateDiscount.execute({ product, discountRules: rules })
    
    expect(result.originalPrice).toBe(1000)
    expect(result.campaignPrice).toBe(800)
    expect(result.discountAmount).toBe(200)
    expect(result.discountPercentage).toBe(20)
  })
  
  it('should apply max discount cap', () => {
    const product = { id: '1', our_price: 10000, category: 'laptops' }
    const rules = {
      global: { type: 'percentage', value: 50, maxDiscount: 1000 }
    }
    
    const result = calculateDiscount.execute({ product, discountRules: rules })
    
    expect(result.discountAmount).toBe(1000) // Capped at 1000
    expect(result.campaignPrice).toBe(9000)
  })
})
```

### Property-Based Testing

**Framework**: fast-check (para TypeScript/JavaScript)

**Configuración**: Mínimo 100 iteraciones por propiedad

**Estrategia**:
- Cada correctness property del diseño debe implementarse como un property-based test
- Usar generadores inteligentes que produzcan datos válidos
- Cada test debe referenciar explícitamente la propiedad del diseño

**Ejemplo de Property-Based Test**:

```typescript
import fc from 'fast-check'

describe('Property-Based Tests', () => {
  /**
   * Feature: campaign-manager-service, Property 1: Campaign Creation Persistence
   * Validates: Requirements 1.1
   */
  it('Property 1: created campaigns should persist all fields correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        campaignArbitrary(),
        async (campaignData) => {
          // Arrange
          const createCampaign = new CreateCampaign(campaignRepository, validator)
          
          // Act
          const { id } = await createCampaign.execute(campaignData)
          const retrieved = await campaignRepository.findById(id)
          
          // Assert
          expect(retrieved).not.toBeNull()
          expect(retrieved.name).toBe(campaignData.name)
          expect(retrieved.startDate).toEqual(campaignData.startDate)
          expect(retrieved.endDate).toEqual(campaignData.endDate)
          expect(retrieved.priority).toBe(campaignData.priority)
          expect(retrieved.discountRules).toEqual(campaignData.discountRules)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  /**
   * Feature: campaign-manager-service, Property 12: Discount Rule Mathematical Validity
   * Validates: Requirements 2.7
   */
  it('Property 12: discount calculations should be mathematically correct', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 10000 }), // price
        fc.integer({ min: 1, max: 99 }), // percentage
        (price, percentage) => {
          // Arrange
          const calculator = new DiscountCalculator()
          const rule: DiscountRule = { type: 'percentage', value: percentage }
          
          // Act
          const result = calculator.calculateDiscount(price, rule)
          
          // Assert
          const expectedDiscount = price * (percentage / 100)
          const expectedPrice = price - expectedDiscount
          const expectedPercentage = Math.round((expectedDiscount / price) * 100)
          
          expect(result.amount).toBeCloseTo(expectedDiscount, 2)
          expect(result.percentage).toBe(expectedPercentage)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  /**
   * Feature: campaign-manager-service, Property 18: Price Restoration Round-Trip
   * Validates: Requirements 4.2
   */
  it('Property 18: applying then removing discount should restore original price', async () => {
    await fc.assert(
      fc.asyncProperty(
        productArbitrary(),
        campaignArbitrary(),
        async (product, campaign) => {
          // Arrange
          const originalPrice = product.our_price
          const applyDiscounts = new ApplyCampaignDiscounts(/* deps */)
          const removeDiscounts = new RemoveCampaignDiscounts(/* deps */)
          
          // Act
          await applyDiscounts.execute({ campaignId: campaign.id })
          const productAfterApply = await productService.getProduct(product.id)
          
          await removeDiscounts.execute({ campaignId: campaign.id })
          const productAfterRemove = await productService.getProduct(product.id)
          
          // Assert
          expect(productAfterRemove.our_price).toBe(originalPrice)
          expect(productAfterRemove.inCampaign).toBe(false)
          expect(productAfterRemove.campaignPrice).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Generadores (Arbitraries)
function campaignArbitrary() {
  return fc.record({
    name: fc.string({ minLength: 3, maxLength: 100 }),
    slug: fc.string({ minLength: 3, maxLength: 100 }),
    startDate: fc.date({ min: new Date() }),
    endDate: fc.date({ min: new Date(Date.now() + 86400000) }), // At least 1 day later
    priority: fc.integer({ min: 1, max: 100 }),
    discountRules: discountRulesArbitrary(),
    frontendConfig: frontendConfigArbitrary()
  })
}

function discountRulesArbitrary() {
  return fc.record({
    global: fc.option(discountRuleArbitrary(), { nil: undefined }),
    categories: fc.dictionary(fc.string(), discountRuleArbitrary()),
    products: fc.dictionary(fc.string(), discountRuleArbitrary())
  })
}

function discountRuleArbitrary() {
  return fc.oneof(
    fc.record({
      type: fc.constant('percentage' as const),
      value: fc.integer({ min: 1, max: 99 }),
      maxDiscount: fc.option(fc.float({ min: 1, max: 1000 }), { nil: undefined })
    }),
    fc.record({
      type: fc.constant('fixed' as const),
      value: fc.float({ min: 1, max: 500 })
    })
  )
}
```

### Integration Testing

**Áreas de Testing**:

1. **API Endpoints**: Testear todos los endpoints REST con requests reales
2. **Database Operations**: Testear operaciones con base de datos real (PostgreSQL en Docker)
3. **External Services**: Testear integración con Product Service y Notification Service
4. **Cron Jobs**: Testear ejecución de tareas programadas
5. **End-to-End Flows**: Testear flujos completos (crear campaña → aplicar descuentos → remover descuentos)

**Configuración**:
- Usar Docker Compose para levantar servicios necesarios
- Usar base de datos de test separada
- Limpiar datos entre tests

### Test Coverage Requirements

- **Unit Tests**: 80% cobertura mínima
- **Property-Based Tests**: Todas las correctness properties implementadas
- **Integration Tests**: Todos los endpoints y flujos principales
- **Edge Cases**: Casos límite y errores comunes


## Database Schema

### PostgreSQL Tables

```sql
-- Tabla de campañas
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- Configuración de descuentos (JSONB)
  discount_rules JSONB NOT NULL,
  
  -- Configuración de frontend (JSONB)
  frontend_config JSONB NOT NULL,
  
  -- Estado de aplicación
  discounts_applied BOOLEAN NOT NULL DEFAULT false,
  applied_at TIMESTAMP,
  deactivated_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (start_date < end_date),
  CONSTRAINT valid_priority CHECK (priority > 0)
);

-- Índices para optimizar consultas
CREATE INDEX idx_campaigns_active ON campaigns(is_active) WHERE is_active = true;
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_priority ON campaigns(priority DESC);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);

-- Tabla de productos en campaña
CREATE TABLE campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  
  -- Precios
  original_price DECIMAL(10,2) NOT NULL,
  campaign_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  
  -- Stock y ventas
  campaign_stock INTEGER,
  units_sold INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(campaign_id, product_id),
  CONSTRAINT valid_prices CHECK (campaign_price < original_price),
  CONSTRAINT valid_discount_percentage CHECK (discount_percentage BETWEEN 1 AND 99)
);

-- Índices
CREATE INDEX idx_campaign_products_campaign ON campaign_products(campaign_id);
CREATE INDEX idx_campaign_products_product ON campaign_products(product_id);

-- Tabla de analytics
CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Métricas
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Constraints
  UNIQUE(campaign_id, date),
  CONSTRAINT valid_metrics CHECK (
    views >= 0 AND 
    clicks >= 0 AND 
    conversions >= 0 AND 
    revenue >= 0
  )
);

-- Índices
CREATE INDEX idx_campaign_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_date ON campaign_analytics(date);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON campaigns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### Migrations Strategy

- Usar herramienta de migraciones (TypeORM migrations o node-pg-migrate)
- Migraciones versionadas con timestamps
- Rollback automático en caso de error
- Scripts de seed para datos de prueba

## API Specification

### REST Endpoints

#### Campaign Management

```
POST   /api/campaigns
GET    /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
```

#### Campaign Operations

```
GET    /api/campaigns/active
POST   /api/campaigns/:id/apply-discounts
POST   /api/campaigns/:id/remove-discounts
```

#### Analytics

```
GET    /api/campaigns/:id/analytics
GET    /api/campaigns/:id/report
```

#### Health & Metrics

```
GET    /health
GET    /metrics
```

### Request/Response Examples

#### POST /api/campaigns

**Request**:
```json
{
  "name": "Black Friday 2025",
  "slug": "black-friday-2025",
  "startDate": "2025-11-20T00:00:00Z",
  "endDate": "2025-12-02T23:59:59Z",
  "priority": 100,
  "discountRules": {
    "global": {
      "type": "percentage",
      "value": 20
    },
    "categories": {
      "portatiles": {
        "type": "percentage",
        "value": 40,
        "maxDiscount": 1000
      },
      "componentes": {
        "type": "percentage",
        "value": 50
      }
    }
  },
  "frontendConfig": {
    "promoBanner": {
      "messages": [
        { "icon": "🔥", "text": "BLACK FRIDAY: Hasta 70% de descuento" }
      ]
    },
    "hero": {
      "title": "🔥 BLACK FRIDAY 2025",
      "subtitle": "Los descuentos más grandes del año",
      "ctaText": "Ver Ofertas"
    },
    "dealsSection": {
      "title": "⚡ Ofertas Black Friday",
      "subtitle": "Descuentos increíbles",
      "badge": "BLACK FRIDAY"
    }
  }
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Black Friday 2025",
  "slug": "black-friday-2025",
  "startDate": "2025-11-20T00:00:00Z",
  "endDate": "2025-12-02T23:59:59Z",
  "priority": 100,
  "isActive": false,
  "discountRules": { /* ... */ },
  "frontendConfig": { /* ... */ },
  "discountsApplied": false,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

#### GET /api/campaigns/active

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Black Friday 2025",
  "slug": "black-friday-2025",
  "startDate": "2025-11-20T00:00:00Z",
  "endDate": "2025-12-02T23:59:59Z",
  "priority": 100,
  "isActive": true,
  "frontendConfig": {
    "promoBanner": {
      "messages": [
        { "icon": "🔥", "text": "BLACK FRIDAY: Hasta 70% de descuento" }
      ]
    },
    "hero": {
      "title": "🔥 BLACK FRIDAY 2025",
      "subtitle": "Los descuentos más grandes del año",
      "ctaText": "Ver Ofertas"
    },
    "dealsSection": {
      "title": "⚡ Ofertas Black Friday",
      "subtitle": "Descuentos increíbles",
      "badge": "BLACK FRIDAY"
    }
  }
}
```

#### POST /api/campaigns/:id/apply-discounts

**Response** (200 OK):
```json
{
  "success": true,
  "productsAffected": 1234,
  "totalDiscountAmount": 125678.50,
  "averageDiscountPercentage": 35,
  "processingTime": 12.5
}
```

#### GET /api/campaigns/:id/analytics

**Response** (200 OK):
```json
{
  "campaignId": "550e8400-e29b-41d4-a716-446655440000",
  "campaignName": "Black Friday 2025",
  "startDate": "2025-11-20T00:00:00Z",
  "endDate": "2025-12-02T23:59:59Z",
  "metrics": {
    "productsWithDiscount": 1234,
    "averageDiscountPercentage": 35,
    "totalViews": 125000,
    "totalClicks": 45000,
    "totalConversions": 8900,
    "totalRevenue": 456789.50,
    "conversionRate": 19.78,
    "roi": 2.63
  },
  "dailyMetrics": [
    {
      "date": "2025-11-20",
      "views": 15000,
      "clicks": 5500,
      "conversions": 1100,
      "revenue": 45678.90
    }
  ],
  "topProducts": [
    {
      "productId": "prod_123",
      "productName": "Portátil Gaming XYZ",
      "unitsSold": 45,
      "revenue": 35678.50
    }
  ]
}
```

## Monitoring and Observability

### Prometheus Metrics

```typescript
// Métricas expuestas en /metrics

// Gauges
campaign_active_count: Número de campañas activas
campaign_products_with_discount: Número de productos con descuento

// Counters
campaign_discounts_applied_total: Total de descuentos aplicados
campaign_discounts_removed_total: Total de descuentos removidos
campaign_errors_total: Total de errores

// Histograms
campaign_discount_application_duration_seconds: Tiempo de aplicación de descuentos
campaign_discount_removal_duration_seconds: Tiempo de remoción de descuentos
campaign_api_request_duration_seconds: Duración de requests API
```

### Grafana Dashboard

Dashboard pre-configurado en `infrastructure/grafana/provisioning/dashboards/campaigns.json`:

**Paneles**:
1. Campañas Activas (gauge)
2. Productos con Descuento (gauge)
3. Descuentos Aplicados por Hora (graph)
4. Tiempo de Procesamiento (histogram)
5. Tasa de Errores (graph)
6. Requests API por Endpoint (graph)
7. Ingresos por Campaña (table)

### Logging

**Formato**: JSON estructurado

**Niveles**:
- DEBUG: Detalles de operaciones
- INFO: Operaciones normales (campaña creada, descuentos aplicados)
- WARN: Advertencias (reintentos, timeouts)
- ERROR: Errores con stack trace

**Ejemplo de Log**:
```json
{
  "timestamp": "2025-11-20T00:00:15Z",
  "level": "INFO",
  "service": "campaign-manager",
  "operation": "apply_discounts",
  "campaignId": "550e8400-e29b-41d4-a716-446655440000",
  "campaignName": "Black Friday 2025",
  "productsAffected": 1234,
  "duration": 12.5,
  "message": "Discounts applied successfully"
}
```

### Alerting

**Alertmanager Rules**:

1. **Campaign Activation Failed**: Alerta si una campaña falla al activarse
2. **Campaign Deactivation Failed**: Alerta si una campaña falla al desactivarse
3. **High Error Rate**: Alerta si tasa de errores > 5%
4. **Slow Discount Application**: Alerta si aplicación de descuentos > 30s
5. **Product Service Unavailable**: Alerta si Product Service no responde

## Deployment

### Docker Configuration

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3011

CMD ["node", "dist/index.js"]
```

### Docker Compose Integration

```yaml
# Agregar a docker-compose.optimized.yml

services:
  campaign-manager:
    build:
      context: ./domains/commerce/campaign-manager-service
      dockerfile: Dockerfile
    container_name: technovastore-campaign-manager
    ports:
      - "3011:3011"
    environment:
      - NODE_ENV=development
      - PORT=3011
      - DATABASE_URL=postgresql://postgres:postgres@postgresql:5432/technovastore
      - PRODUCT_SERVICE_URL=http://product-service:3001
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
      - JWT_SECRET=${JWT_SECRET}
      - LOG_LEVEL=info
    depends_on:
      - postgresql
      - product-service
      - notification-service
    networks:
      - technovastore-network
    volumes:
      - ./domains/commerce/campaign-manager-service:/app
      - /app/node_modules
    restart: unless-stopped
```

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
PRODUCT_SERVICE_URL=http://product-service:3001
JWT_SECRET=your-secret-key
PORT=3011

# Optional
NODE_ENV=production
LOG_LEVEL=info
NOTIFICATION_SERVICE_URL=http://notification-service:3005
CRON_SCHEDULE=0 * * * * # Every hour
BATCH_SIZE=100
MAX_RETRIES=3
RETRY_BASE_DELAY=1000
```

## Security Considerations

1. **Authentication**: JWT tokens para endpoints administrativos
2. **Authorization**: Verificar rol de administrador
3. **Input Validation**: Validar y sanitizar todos los inputs
4. **SQL Injection**: Usar prepared statements y ORMs
5. **XSS Prevention**: Sanitizar datos antes de almacenar
6. **Rate Limiting**: 100 requests/minuto por IP
7. **CORS**: Configurar CORS apropiadamente
8. **Secrets Management**: Variables de entorno para secrets
9. **Audit Logging**: Registrar todas las operaciones administrativas
10. **Database Security**: Conexiones encriptadas, credenciales seguras

## Performance Considerations

1. **Batch Processing**: Procesar productos en lotes de 100
2. **Database Indexing**: Índices en columnas frecuentemente consultadas
3. **Connection Pooling**: Pool de conexiones a PostgreSQL
4. **Caching**: Cache de campañas activas (Redis opcional)
5. **Async Operations**: Operaciones asíncronas para no bloquear
6. **Transaction Optimization**: Transacciones eficientes
7. **Query Optimization**: Queries optimizadas con EXPLAIN
8. **Resource Limits**: Límites de memoria y CPU en Docker

## Future Enhancements

1. **A/B Testing**: Testear diferentes configuraciones de campañas
2. **User Segmentation**: Campañas personalizadas por segmento de usuario
3. **Geolocation**: Campañas específicas por región
4. **Machine Learning**: Optimización automática de descuentos
5. **Real-time Analytics**: Dashboard en tiempo real con WebSockets
6. **Campaign Templates**: Plantillas predefinidas de campañas
7. **Multi-currency**: Soporte para múltiples monedas
8. **Campaign Scheduling**: Programación avanzada con recurrencia
9. **Inventory Management**: Integración con gestión de inventario
10. **Email Campaigns**: Integración con email marketing

