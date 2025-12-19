# Sistema de Gestión de Campañas Backend

## Problema

Actualmente el frontend muestra "Descuentos hasta 70%" pero los productos no tienen esos descuentos aplicados realmente. Necesitamos un sistema backend que:

1. Aplique descuentos automáticamente según la campaña activa
2. Gestione reglas de descuento por categoría/producto
3. Se active/desactive automáticamente según fechas
4. Sincronice con el frontend

## Arquitectura Propuesta

### 1. Base de Datos - Nuevas Colecciones/Tablas

#### Tabla: `campaigns`
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  -- Configuración de descuentos
  discount_rules JSONB NOT NULL,
  
  -- Configuración de frontend
  frontend_config JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ejemplo de discount_rules:
{
  "global": {
    "type": "percentage",
    "value": 20,
    "max_discount": 500
  },
  "categories": {
    "portatiles": {
      "type": "percentage",
      "value": 30,
      "max_discount": 1000
    },
    "componentes": {
      "type": "percentage",
      "value": 40
    }
  },
  "products": {
    "prod_123": {
      "type": "fixed",
      "value": 100
    }
  }
}

-- Ejemplo de frontend_config:
{
  "promoBanner": {
    "messages": [
      { "icon": "🔥", "text": "BLACK FRIDAY: Hasta 70% de descuento" }
    ]
  },
  "hero": {
    "title": "🔥 BLACK FRIDAY 2025",
    "subtitle": "Los descuentos más grandes del año"
  }
}
```

#### Tabla: `campaign_products`
```sql
CREATE TABLE campaign_products (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  product_id VARCHAR(255) NOT NULL,
  
  -- Precios
  original_price DECIMAL(10,2) NOT NULL,
  campaign_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER,
  discount_amount DECIMAL(10,2),
  
  -- Stock para la campaña
  campaign_stock INTEGER,
  units_sold INTEGER DEFAULT 0,
  
  -- Metadata
  applied_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(campaign_id, product_id)
);
```

#### Tabla: `campaign_analytics`
```sql
CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  date DATE NOT NULL,
  
  -- Métricas
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  
  UNIQUE(campaign_id, date)
);
```

### 2. Microservicio: Campaign Manager

Nuevo microservicio `campaign-manager-service` que:

#### Endpoints:

```typescript
// Gestión de campañas (Admin)
POST   /api/campaigns                    // Crear campaña
GET    /api/campaigns                    // Listar campañas
GET    /api/campaigns/:id                // Obtener campaña
PUT    /api/campaigns/:id                // Actualizar campaña
DELETE /api/campaigns/:id                // Eliminar campaña
POST   /api/campaigns/:id/activate       // Activar manualmente
POST   /api/campaigns/:id/deactivate     // Desactivar manualmente

// Aplicación de descuentos
POST   /api/campaigns/:id/apply-discounts    // Aplicar descuentos a productos
POST   /api/campaigns/:id/remove-discounts   // Remover descuentos

// Consulta pública
GET    /api/campaigns/active             // Obtener campaña activa
GET    /api/campaigns/active/products    // Productos con descuento de campaña activa
GET    /api/campaigns/upcoming           // Próximas campañas

// Analytics
GET    /api/campaigns/:id/analytics      // Métricas de campaña
```

#### Lógica Principal:

```typescript
// campaign-manager-service/apply-campaign-discounts/ApplyCampaignDiscounts.ts

interface DiscountRule {
  type: 'percentage' | 'fixed' | 'buy_x_get_y'
  value: number
  maxDiscount?: number
  minPurchase?: number
  categories?: string[]
  products?: string[]
  brands?: string[]
}

class ApplyCampaignDiscounts {
  async execute(campaignId: string): Promise<void> {
    // 1. Obtener campaña
    const campaign = await this.campaignRepository.findById(campaignId)
    
    // 2. Obtener productos elegibles
    const products = await this.getEligibleProducts(campaign.discount_rules)
    
    // 3. Calcular y aplicar descuentos
    for (const product of products) {
      const discount = this.calculateDiscount(product, campaign.discount_rules)
      
      // 4. Guardar en campaign_products
      await this.campaignProductRepository.create({
        campaign_id: campaignId,
        product_id: product.id,
        original_price: product.our_price,
        campaign_price: product.our_price - discount.amount,
        discount_percentage: discount.percentage,
        discount_amount: discount.amount,
        campaign_stock: product.stock // Opcional: limitar stock para campaña
      })
      
      // 5. Actualizar precio en Product (agregar campos campaign_price, discount_percentage)
      await this.productRepository.update(product.id, {
        campaign_price: product.our_price - discount.amount,
        discount_percentage: discount.percentage,
        original_price: product.our_price, // Guardar precio original
        in_campaign: true,
        campaign_id: campaignId
      })
    }
    
    // 6. Marcar campaña como aplicada
    await this.campaignRepository.update(campaignId, {
      discounts_applied: true,
      applied_at: new Date()
    })
  }
  
  private calculateDiscount(product: Product, rules: DiscountRules): Discount {
    // Prioridad: Producto específico > Categoría > Global
    
    // 1. Descuento específico de producto
    if (rules.products?.[product.id]) {
      return this.applyRule(product.our_price, rules.products[product.id])
    }
    
    // 2. Descuento por categoría
    if (rules.categories?.[product.category]) {
      return this.applyRule(product.our_price, rules.categories[product.category])
    }
    
    // 3. Descuento global
    if (rules.global) {
      return this.applyRule(product.our_price, rules.global)
    }
    
    return { amount: 0, percentage: 0 }
  }
  
  private applyRule(price: number, rule: DiscountRule): Discount {
    let discountAmount = 0
    
    if (rule.type === 'percentage') {
      discountAmount = price * (rule.value / 100)
      
      // Aplicar descuento máximo si existe
      if (rule.maxDiscount && discountAmount > rule.maxDiscount) {
        discountAmount = rule.maxDiscount
      }
    } else if (rule.type === 'fixed') {
      discountAmount = rule.value
    }
    
    const percentage = Math.round((discountAmount / price) * 100)
    
    return {
      amount: discountAmount,
      percentage
    }
  }
}
```

### 3. Cron Job Automático

```typescript
// campaign-manager-service/cron/campaign-scheduler.ts

import cron from 'node-cron'

class CampaignScheduler {
  start() {
    // Ejecutar cada hora
    cron.schedule('0 * * * *', async () => {
      await this.checkAndActivateCampaigns()
      await this.checkAndDeactivateCampaigns()
    })
  }
  
  private async checkAndActivateCampaigns() {
    const now = new Date()
    
    // Buscar campañas que deberían estar activas pero no lo están
    const campaignsToActivate = await this.campaignRepository.find({
      start_date: { $lte: now },
      end_date: { $gte: now },
      is_active: false,
      auto_activate: true
    })
    
    for (const campaign of campaignsToActivate) {
      console.log(`🚀 Activando campaña: ${campaign.name}`)
      
      // Aplicar descuentos
      await this.applyCampaignDiscounts.execute(campaign.id)
      
      // Marcar como activa
      await this.campaignRepository.update(campaign.id, {
        is_active: true,
        activated_at: new Date()
      })
      
      // Notificar al equipo
      await this.notificationService.send({
        type: 'campaign_activated',
        campaign: campaign.name,
        message: `Campaña ${campaign.name} activada automáticamente`
      })
    }
  }
  
  private async checkAndDeactivateCampaigns() {
    const now = new Date()
    
    // Buscar campañas que deberían estar inactivas pero están activas
    const campaignsToDeactivate = await this.campaignRepository.find({
      end_date: { $lt: now },
      is_active: true
    })
    
    for (const campaign of campaignsToDeactivate) {
      console.log(`🛑 Desactivando campaña: ${campaign.name}`)
      
      // Remover descuentos
      await this.removeCampaignDiscounts.execute(campaign.id)
      
      // Marcar como inactiva
      await this.campaignRepository.update(campaign.id, {
        is_active: false,
        deactivated_at: new Date()
      })
      
      // Generar reporte final
      await this.generateCampaignReport.execute(campaign.id)
    }
  }
}
```

### 4. Modificaciones en Product Service

Agregar campos al modelo Product:

```typescript
interface Product {
  // ... campos existentes
  
  // Campos de campaña
  in_campaign: boolean
  campaign_id?: string
  campaign_price?: number
  original_price?: number  // Precio antes de campaña
  discount_percentage?: number
  campaign_stock?: number  // Stock limitado para campaña
  campaign_units_sold?: number
}
```

### 5. Integración Frontend

El frontend ya está preparado, solo necesita consumir los datos reales:

```typescript
// El ProductCard ya muestra discount_percentage y original_price
// Solo necesitamos que el backend los provea

// En ProductRecommenderWidget y DealsSection:
const response = await productService.getProducts({
  in_campaign: true,  // Filtrar solo productos en campaña
  sortBy: 'discount_percentage', // Ordenar por mayor descuento
  limit: 8
})
```

### 6. Panel de Administración

Crear interfaz en AdminDashboard para:

```typescript
// Gestión de Campañas
- Crear nueva campaña
- Configurar reglas de descuento
- Preview de campaña
- Activar/desactivar manualmente
- Ver analytics en tiempo real
- Exportar reportes

// Vista de campaña:
{
  nombre: "Black Friday 2025",
  fechas: "20 Nov - 2 Dic",
  estado: "Activa",
  productos_con_descuento: 1234,
  ventas_generadas: "€45,678",
  conversión: "12.3%",
  descuento_promedio: "35%"
}
```

## Flujo Completo

### Ejemplo: Black Friday

**1. Configuración (Manual - Una vez al año)**
```typescript
POST /api/campaigns
{
  "name": "Black Friday 2025",
  "slug": "black-friday-2025",
  "start_date": "2025-11-20T00:00:00Z",
  "end_date": "2025-12-02T23:59:59Z",
  "priority": 100,
  "discount_rules": {
    "global": {
      "type": "percentage",
      "value": 20
    },
    "categories": {
      "portatiles": { "type": "percentage", "value": 40 },
      "componentes": { "type": "percentage", "value": 50 },
      "monitores": { "type": "percentage", "value": 35 }
    }
  },
  "frontend_config": {
    // Configuración del frontend
  }
}
```

**2. Activación Automática (20 Nov 00:00)**
- Cron job detecta que es hora de activar
- Aplica descuentos a todos los productos elegibles
- Actualiza precios en base de datos
- Notifica al equipo

**3. Durante la Campaña**
- Frontend muestra productos con descuentos reales
- Analytics registra ventas, conversiones
- Stock se va reduciendo

**4. Desactivación Automática (2 Dic 23:59)**
- Cron job detecta fin de campaña
- Restaura precios originales
- Genera reporte final
- Archiva datos de campaña

## Ventajas del Sistema

✅ **Automatización Total**: No requiere intervención manual
✅ **Descuentos Reales**: Los productos tienen precios reales con descuento
✅ **Flexible**: Reglas por producto, categoría o global
✅ **Auditable**: Historial completo de cambios de precio
✅ **Analytics**: Métricas en tiempo real
✅ **Escalable**: Soporta múltiples campañas simultáneas
✅ **Seguro**: Restaura precios automáticamente al finalizar

## Implementación Recomendada

### Fase 1: Backend Core (Prioridad Alta)
1. Crear microservicio campaign-manager
2. Implementar base de datos
3. Crear endpoints básicos
4. Implementar lógica de aplicación de descuentos

### Fase 2: Automatización (Prioridad Alta)
1. Implementar cron jobs
2. Sistema de activación/desactivación automática
3. Notificaciones

### Fase 3: Frontend Integration (Prioridad Media)
1. Actualizar Product Service para incluir campos de campaña
2. Modificar ProductCard para mostrar descuentos reales
3. Sincronizar frontend_config con backend

### Fase 4: Admin Panel (Prioridad Media)
1. Interfaz de gestión de campañas
2. Preview de campañas
3. Analytics dashboard

### Fase 5: Advanced Features (Prioridad Baja)
1. A/B testing de campañas
2. Segmentación por usuario
3. Campañas por geolocalización
4. Machine learning para optimizar descuentos

## Próximos Pasos

¿Quieres que implemente:
1. El microservicio campaign-manager completo?
2. Las modificaciones en Product Service?
3. El panel de administración?
4. Todo lo anterior?
