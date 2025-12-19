/**
 * Tipos compartidos para el Campaign Manager Service
 * 
 * Este archivo define todas las interfaces y tipos utilizados
 * en el servicio de gestión de campañas promocionales.
 */

/**
 * Regla de descuento individual
 * 
 * Define cómo se aplica un descuento específico:
 * - percentage: Descuento porcentual (1-99%)
 * - fixed: Descuento de cantidad fija en euros
 */
export interface DiscountRule {
  /** Tipo de descuento: porcentaje o cantidad fija */
  type: 'percentage' | 'fixed'
  
  /** Valor del descuento (porcentaje 1-99 o cantidad en euros) */
  value: number
  
  /** Descuento máximo en euros (solo para descuentos porcentuales) */
  maxDiscount?: number
  
  /** Compra mínima requerida para aplicar el descuento */
  minPurchase?: number
}

/**
 * Conjunto de reglas de descuento para una campaña
 * 
 * Permite definir descuentos a diferentes niveles:
 * - global: Aplica a todos los productos sin descuento específico
 * - categories: Descuentos por categoría de producto
 * - products: Descuentos específicos por producto (mayor prioridad)
 */
export interface DiscountRules {
  /** Descuento global aplicable a todos los productos */
  global?: DiscountRule
  
  /** Descuentos específicos por categoría (key: nombre de categoría) */
  categories?: Record<string, DiscountRule>
  
  /** Descuentos específicos por producto (key: product_id) */
  products?: Record<string, DiscountRule>
}

/**
 * Configuración de visualización del banner promocional
 */
export interface PromoBannerConfig {
  /** Lista de mensajes rotativos con iconos */
  messages: Array<{
    icon: string
    text: string
  }>
  
  /** Color de fondo del banner (opcional) */
  backgroundColor?: string
}

/**
 * Configuración de la sección hero (cabecera principal)
 */
export interface HeroConfig {
  /** Título principal de la campaña */
  title: string
  
  /** Subtítulo descriptivo */
  subtitle: string
  
  /** Texto del botón de llamada a la acción */
  ctaText: string
  
  /** URL de imagen de fondo (opcional) */
  backgroundImage?: string
  
  /** Badge o etiqueta destacada (opcional) */
  badge?: string
}

/**
 * Configuración de la sección de ofertas
 */
export interface DealsSectionConfig {
  /** Título de la sección */
  title: string
  
  /** Subtítulo descriptivo */
  subtitle: string
  
  /** Badge o etiqueta de la sección */
  badge: string
  
  /** Color de fondo (opcional) */
  backgroundColor?: string
}

/**
 * Configuración completa de frontend para una campaña
 * 
 * Define cómo se visualiza la campaña en el frontend,
 * incluyendo banners, hero section y sección de ofertas.
 */
export interface FrontendConfig {
  /** Configuración del banner promocional superior */
  promoBanner: PromoBannerConfig
  
  /** Configuración de la sección hero principal */
  hero: HeroConfig
  
  /** Configuración de la sección de ofertas */
  dealsSection: DealsSectionConfig
  
  /** Categorías destacadas en la campaña (opcional) */
  categories?: string[]
}

/**
 * Campaña promocional completa
 * 
 * Representa una campaña con todas sus propiedades,
 * reglas de descuento y configuración de visualización.
 */
export interface Campaign {
  /** ID único de la campaña (UUID) */
  id: string
  
  /** Nombre descriptivo de la campaña */
  name: string
  
  /** Slug único para URLs amigables */
  slug: string
  
  /** Fecha y hora de inicio de la campaña */
  startDate: Date
  
  /** Fecha y hora de fin de la campaña */
  endDate: Date
  
  /** Prioridad de la campaña (mayor número = mayor prioridad) */
  priority: number
  
  /** Indica si la campaña está actualmente activa */
  isActive: boolean
  
  /** Reglas de descuento de la campaña */
  discountRules: DiscountRules
  
  /** Configuración de visualización en el frontend */
  frontendConfig: FrontendConfig
  
  /** Indica si los descuentos ya fueron aplicados */
  discountsApplied: boolean
  
  /** Fecha y hora en que se aplicaron los descuentos */
  appliedAt?: Date
  
  /** Fecha y hora en que se desactivó la campaña */
  deactivatedAt?: Date
  
  /** Fecha de creación del registro */
  createdAt: Date
  
  /** Fecha de última actualización del registro */
  updatedAt: Date
}

/**
 * Producto con descuento aplicado en una campaña
 * 
 * Registra la relación entre una campaña y un producto,
 * incluyendo precios originales, con descuento y métricas de venta.
 */
export interface CampaignProduct {
  /** ID único del registro (UUID) */
  id: string
  
  /** ID de la campaña asociada */
  campaignId: string
  
  /** ID del producto en el Product Service */
  productId: string
  
  /** Precio original del producto antes del descuento */
  originalPrice: number
  
  /** Precio del producto con el descuento aplicado */
  campaignPrice: number
  
  /** Porcentaje de descuento aplicado (1-99) */
  discountPercentage: number
  
  /** Cantidad de descuento en euros */
  discountAmount: number
  
  /** Stock disponible durante la campaña (opcional) */
  campaignStock?: number
  
  /** Número de unidades vendidas durante la campaña */
  unitsSold: number
  
  /** Fecha y hora en que se aplicó el descuento */
  appliedAt: Date
}

/**
 * Métricas diarias de una campaña
 * 
 * Registra las métricas de rendimiento de una campaña
 * para análisis y generación de reportes.
 */
export interface CampaignAnalytics {
  /** ID único del registro (UUID) */
  id: string
  
  /** ID de la campaña asociada */
  campaignId: string
  
  /** Fecha de las métricas */
  date: Date
  
  /** Número de visualizaciones de productos en campaña */
  views: number
  
  /** Número de clics en productos en campaña */
  clicks: number
  
  /** Número de conversiones (compras) */
  conversions: number
  
  /** Ingresos generados en euros */
  revenue: number
}

/**
 * Datos para crear una nueva campaña
 * 
 * Versión sin ID ni timestamps para la creación de campañas.
 */
export interface CreateCampaignData {
  name: string
  slug: string
  startDate: Date
  endDate: Date
  priority: number
  discountRules: DiscountRules
  frontendConfig: FrontendConfig
}

/**
 * Datos para crear un registro de producto en campaña
 */
export interface CreateCampaignProductData {
  campaignId: string
  productId: string
  originalPrice: number
  campaignPrice: number
  discountPercentage: number
  discountAmount: number
  campaignStock?: number
}

/**
 * Datos para crear un registro de analytics
 */
export interface CreateAnalyticsData {
  campaignId: string
  date: Date
  views?: number
  clicks?: number
  conversions?: number
  revenue?: number
}

/**
 * Filtros para consultar campañas
 */
export interface CampaignFilters {
  /** Filtrar por estado activo */
  isActive?: boolean
  
  /** Filtrar por rango de fechas de inicio */
  startDateFrom?: Date
  startDateTo?: Date
  
  /** Filtrar por rango de fechas de fin */
  endDateFrom?: Date
  endDateTo?: Date
  
  /** Filtrar por prioridad mínima */
  minPriority?: number
  
  /** Ordenar por campo */
  orderBy?: 'priority' | 'startDate' | 'endDate' | 'createdAt'
  
  /** Dirección de ordenamiento */
  orderDirection?: 'ASC' | 'DESC'
  
  /** Límite de resultados */
  limit?: number
  
  /** Offset para paginación */
  offset?: number
}

/**
 * Métricas agregadas de una campaña
 */
export interface AggregatedMetrics {
  /** Número total de productos con descuento */
  productsWithDiscount: number
  
  /** Porcentaje promedio de descuento */
  averageDiscountPercentage: number
  
  /** Total de visualizaciones */
  totalViews: number
  
  /** Total de clics */
  totalClicks: number
  
  /** Total de conversiones */
  totalConversions: number
  
  /** Ingresos totales generados */
  totalRevenue: number
  
  /** Tasa de conversión (conversiones / clics) */
  conversionRate: number
  
  /** ROI (Return on Investment) */
  roi: number
}

/**
 * Reporte final de una campaña
 */
export interface CampaignReport {
  campaign: Campaign
  metrics: AggregatedMetrics
  topProducts: Array<{
    productId: string
    productName: string
    unitsSold: number
    revenue: number
  }>
  dailyMetrics: CampaignAnalytics[]
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  /** Indica si la validación fue exitosa */
  isValid: boolean
  
  /** Lista de errores encontrados */
  errors: string[]
}

/**
 * Actualización de producto para batch processing
 */
export interface ProductUpdate {
  productId: string
  data: {
    inCampaign?: boolean
    campaignId?: string
    campaignPrice?: number
    originalPrice?: number
    discountPercentage?: number
    /** Precio del producto (para restaurar precio original) */
    our_price?: number
    /** Alias camelCase para our_price */
    ourPrice?: number
  }
}

/**
 * Filtros para obtener productos del Product Service
 */
export interface ProductFilters {
  category?: string
  subcategory?: string
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
  limit?: number
  offset?: number
}
