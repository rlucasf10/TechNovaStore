/**
 * GetAdminMetrics - Caso de uso para obtener métricas de administración
 * 
 * Agrega métricas de todos los microservicios para el dashboard de admin.
 * 
 * Requisitos: 15.1, 15.2, 15.3, 15.4
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../shared/utils/logger';

// ============================================================================
// Tipos
// ============================================================================

export type ServiceHealthStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface ServiceHealth {
  name: string;
  status: ServiceHealthStatus;
  latency?: number;
  uptime?: string;
  lastCheck: string;
  version?: string;
  details?: Record<string, unknown>;
}

export interface ChatbotMetrics {
  status: ServiceHealthStatus;
  usingFallback: boolean;
  ollamaAvailable: boolean;
  geminiAvailable: boolean;
  totalSessions: number;
  activeSessions: number;
  messagesProcessed: number;
  averageResponseTime: number;
  fallbackUsagePercent: number;
  lastModelUsed: string;
  errorRate: number;
}

export interface RecommenderMetrics {
  status: ServiceHealthStatus;
  totalRecommendations: number;
  cacheHitRate: number;
  averageResponseTime: number;
  activeModels: string[];
  lastModelUpdate?: string;
  interactionsProcessed: number;
}

export interface AutomationMetrics {
  autoPurchase: {
    status: ServiceHealthStatus;
    pendingOrders: number;
    processedToday: number;
    successRate: number;
    averageProcessingTime: number;
    lastProcessedAt?: string;
  };
  syncEngine: {
    status: ServiceHealthStatus;
    lastSyncAt?: string;
    productsUpdated: number;
    pricesUpdated: number;
    syncErrors: number;
    nextScheduledSync?: string;
  };
}

export interface SystemMetrics {
  services: ServiceHealth[];
  database: {
    mongodb: { status: ServiceHealthStatus; connections: number };
    postgresql: { status: ServiceHealthStatus; connections: number };
    redis: { status: ServiceHealthStatus; connections: number };
  };
  performance: {
    cpuUsage?: number;
    memoryUsage?: number;
    requestsPerMinute: number;
    averageLatency: number;
    errorRate: number;
  };
}

export interface BusinessKPIs {
  sales: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    change: number;
  };
  orders: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    total: number;
  };
  tickets: {
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number;
  };
  users: {
    total: number;
    activeToday: number;
    newThisWeek: number;
  };
}

// ============================================================================
// Configuración de Servicios
// ============================================================================

interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
}

// ============================================================================
// Clase Principal
// ============================================================================

export class GetAdminMetrics {
  private httpClient: AxiosInstance;
  private services: ServiceConfig[];

  constructor() {
    this.httpClient = axios.create({
      timeout: 5000,
    });

    // Configuración de servicios
    this.services = [
      {
        name: 'API Gateway',
        url: 'http://localhost:3000',
        healthEndpoint: '/health',
      },
      {
        name: 'AI Chatbot',
        url: process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001',
        healthEndpoint: '/health',
      },
      {
        name: 'Product Service',
        url: process.env['PRODUCT_SERVICE_URL'] || 'http://product-service:3001',
        healthEndpoint: '/health',
      },
      {
        name: 'Order Service',
        url: process.env['ORDER_SERVICE_URL'] || 'http://order-service:3002',
        healthEndpoint: '/health',
      },
      {
        name: 'User Service',
        url: process.env['USER_SERVICE_URL'] || 'http://user-service:3003',
        healthEndpoint: '/health',
      },
      {
        name: 'Payment Service',
        url: process.env['PAYMENT_SERVICE_URL'] || 'http://payment-service:3004',
        healthEndpoint: '/health',
      },
      {
        name: 'Notification Service',
        url: process.env['NOTIFICATION_SERVICE_URL'] || 'http://notification-service:3005',
        healthEndpoint: '/health',
      },
      {
        name: 'Recommender',
        url: process.env['RECOMMENDER_SERVICE_URL'] || 'http://recommender:3000',
        healthEndpoint: '/health',
      },
      {
        name: 'Sync Engine',
        url: process.env['SYNC_ENGINE_URL'] || 'http://sync-engine:3006',
        healthEndpoint: '/health',
      },
      {
        name: 'Auto Purchase',
        url: process.env['AUTO_PURCHASE_URL'] || 'http://auto-purchase:3007',
        healthEndpoint: '/health',
      },
      {
        name: 'Shipment Tracker',
        url: process.env['SHIPMENT_TRACKER_URL'] || 'http://shipment-tracker:3008',
        healthEndpoint: '/health',
      },
      {
        name: 'Ticket Service',
        url: process.env['TICKET_SERVICE_URL'] || 'http://ticket-service:3012',
        healthEndpoint: '/health',
      },
    ];
  }

  /**
   * Obtener métricas del Chatbot
   */
  async getChatbotMetrics(): Promise<ChatbotMetrics> {
    try {
      const chatbotUrl = process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001';
      const response = await this.httpClient.get(`${chatbotUrl}/health`);
      const health = response.data;

      return {
        status: this.parseHealthStatus(health),
        usingFallback: health.usingFallback || false,
        ollamaAvailable: health.ollamaAvailable || health.ollama?.available || false,
        geminiAvailable: health.geminiAvailable || health.gemini?.available || false,
        totalSessions: health.totalSessions || health.sessions?.total || 0,
        activeSessions: health.activeSessions || health.sessions?.active || 0,
        messagesProcessed: health.messagesProcessed || health.messages?.processed || 0,
        averageResponseTime: health.averageResponseTime || health.performance?.avgResponseTime || 0,
        fallbackUsagePercent: health.fallbackUsagePercent || 0,
        lastModelUsed: health.lastModelUsed || health.model?.current || 'unknown',
        errorRate: health.errorRate || 0,
      };
    } catch (error) {
      logger.warn('Error obteniendo métricas del chatbot:', error);
      return this.getDefaultChatbotMetrics();
    }
  }

  /**
   * Obtener métricas del Recommender
   */
  async getRecommenderMetrics(): Promise<RecommenderMetrics> {
    try {
      const recommenderUrl = process.env['RECOMMENDER_SERVICE_URL'] || 'http://recommender:3000';
      const response = await this.httpClient.get(`${recommenderUrl}/health`);
      const health = response.data;

      return {
        status: this.parseHealthStatus(health),
        totalRecommendations: health.totalRecommendations || 0,
        cacheHitRate: health.cacheHitRate || health.cache?.hitRate || 0,
        averageResponseTime: health.averageResponseTime || 0,
        activeModels: health.activeModels || ['collaborative', 'content-based'],
        lastModelUpdate: health.lastModelUpdate,
        interactionsProcessed: health.interactionsProcessed || 0,
      };
    } catch (error) {
      logger.warn('Error obteniendo métricas del recommender:', error);
      return this.getDefaultRecommenderMetrics();
    }
  }

  /**
   * Obtener métricas de Automatización
   */
  async getAutomationMetrics(): Promise<AutomationMetrics> {
    const [autoPurchaseResult, syncEngineResult] = await Promise.allSettled([
      this.getAutoPurchaseHealth(),
      this.getSyncEngineHealth(),
    ]);

    return {
      autoPurchase: autoPurchaseResult.status === 'fulfilled' 
        ? autoPurchaseResult.value 
        : this.getDefaultAutoPurchaseMetrics(),
      syncEngine: syncEngineResult.status === 'fulfilled'
        ? syncEngineResult.value
        : this.getDefaultSyncEngineMetrics(),
    };
  }

  /**
   * Obtener métricas del Sistema
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const services = await this.getAllServicesHealth();
    
    // Calcular métricas de rendimiento
    const healthyServices = services.filter(s => s.status === 'healthy');
    const avgLatency = healthyServices.length > 0
      ? healthyServices.reduce((sum, s) => sum + (s.latency || 0), 0) / healthyServices.length
      : 0;

    return {
      services,
      database: {
        mongodb: { status: 'healthy', connections: 0 },
        postgresql: { status: 'healthy', connections: 0 },
        redis: { status: 'healthy', connections: 0 },
      },
      performance: {
        requestsPerMinute: 0,
        averageLatency: Math.round(avgLatency),
        errorRate: services.filter(s => s.status === 'error').length / services.length * 100,
      },
    };
  }

  /**
   * Obtener KPIs de negocio
   */
  async getBusinessKPIs(): Promise<BusinessKPIs> {
    const [ordersResult, ticketsResult, usersResult] = await Promise.allSettled([
      this.getOrderStats(),
      this.getTicketStats(),
      this.getUserStats(),
    ]);

    return {
      sales: {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        thisMonth: 0,
        change: 0,
      },
      orders: ordersResult.status === 'fulfilled' ? ordersResult.value : this.getDefaultOrderStats(),
      tickets: ticketsResult.status === 'fulfilled' ? ticketsResult.value : this.getDefaultTicketStats(),
      users: usersResult.status === 'fulfilled' ? usersResult.value : this.getDefaultUserStats(),
    };
  }

  /**
   * Obtener estado de salud de todos los servicios
   */
  async getAllServicesHealth(): Promise<ServiceHealth[]> {
    const healthChecks = await Promise.allSettled(
      this.services.map(async (service) => {
        const startTime = Date.now();
        try {
          const response = await this.httpClient.get(`${service.url}${service.healthEndpoint}`);
          const latency = Date.now() - startTime;

          return {
            name: service.name,
            status: this.parseHealthStatus(response.data),
            latency,
            uptime: response.data.uptime,
            lastCheck: new Date().toISOString(),
            version: response.data.version,
            details: response.data,
          } as ServiceHealth;
        } catch (error) {
          return {
            name: service.name,
            status: 'error' as ServiceHealthStatus,
            latency: Date.now() - startTime,
            lastCheck: new Date().toISOString(),
          } as ServiceHealth;
        }
      })
    );

    return healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        name: this.services[index].name,
        status: 'unknown' as ServiceHealthStatus,
        lastCheck: new Date().toISOString(),
      };
    });
  }

  // ============================================================================
  // Métodos Privados
  // ============================================================================

  private parseHealthStatus(data: any): ServiceHealthStatus {
    if (!data) return 'unknown';
    
    const status = (data.status || '').toLowerCase();
    if (status === 'healthy' || status === 'ok' || status === 'up') {
      return 'healthy';
    }
    if (status === 'degraded' || status === 'warning') {
      return 'warning';
    }
    if (status === 'unhealthy' || status === 'error' || status === 'down') {
      return 'error';
    }
    return 'unknown';
  }

  private async getAutoPurchaseHealth(): Promise<AutomationMetrics['autoPurchase']> {
    try {
      const url = process.env['AUTO_PURCHASE_URL'] || 'http://auto-purchase:3007';
      const response = await this.httpClient.get(`${url}/health`);
      const health = response.data;

      return {
        status: this.parseHealthStatus(health),
        pendingOrders: health.pendingOrders || 0,
        processedToday: health.processedToday || 0,
        successRate: health.successRate || 0,
        averageProcessingTime: health.averageProcessingTime || 0,
        lastProcessedAt: health.lastProcessedAt,
      };
    } catch {
      return this.getDefaultAutoPurchaseMetrics();
    }
  }

  private async getSyncEngineHealth(): Promise<AutomationMetrics['syncEngine']> {
    try {
      const url = process.env['SYNC_ENGINE_URL'] || 'http://sync-engine:3006';
      const response = await this.httpClient.get(`${url}/health`);
      const health = response.data;

      return {
        status: this.parseHealthStatus(health),
        lastSyncAt: health.lastSyncAt,
        productsUpdated: health.productsUpdated || 0,
        pricesUpdated: health.pricesUpdated || 0,
        syncErrors: health.syncErrors || 0,
        nextScheduledSync: health.nextScheduledSync,
      };
    } catch {
      return this.getDefaultSyncEngineMetrics();
    }
  }

  private async getOrderStats(): Promise<BusinessKPIs['orders']> {
    try {
      const url = process.env['ORDER_SERVICE_URL'] || 'http://order-service:3002';
      const response = await this.httpClient.get(`${url}/orders/stats`);
      const data = response.data?.data || response.data;

      return {
        pending: data.pending || 0,
        processing: data.processing || 0,
        shipped: data.shipped || 0,
        delivered: data.delivered || 0,
        total: data.total || 0,
      };
    } catch {
      return this.getDefaultOrderStats();
    }
  }

  private async getTicketStats(): Promise<BusinessKPIs['tickets']> {
    try {
      const url = process.env['TICKET_SERVICE_URL'] || 'http://ticket-service:3012';
      const response = await this.httpClient.get(`${url}/api/tickets/metrics`);
      const data = response.data?.data || response.data;

      return {
        open: data.open || 0,
        inProgress: data.inProgress || 0,
        resolved: data.resolved || 0,
        averageResolutionTime: data.averageResolutionTime || 0,
      };
    } catch {
      return this.getDefaultTicketStats();
    }
  }

  private async getUserStats(): Promise<BusinessKPIs['users']> {
    try {
      const url = process.env['USER_SERVICE_URL'] || 'http://user-service:3003';
      const response = await this.httpClient.get(`${url}/users/stats`);
      const data = response.data?.data || response.data;

      return {
        total: data.total || 0,
        activeToday: data.activeToday || 0,
        newThisWeek: data.newThisWeek || 0,
      };
    } catch {
      return this.getDefaultUserStats();
    }
  }

  /**
   * Obtener logs del Chatbot
   */
  async getChatbotLogs(limit: number = 50): Promise<{ logs: any[]; total: number }> {
    try {
      const chatbotUrl = process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001';
      const response = await this.httpClient.get(`${chatbotUrl}/api/admin/logs?limit=${limit}`);
      return response.data?.data || { logs: [], total: 0 };
    } catch (error) {
      logger.warn('Error obteniendo logs del chatbot:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Reiniciar el servicio del Chatbot
   */
  async restartChatbot(): Promise<{ success: boolean; message: string; clearedSessions?: number }> {
    try {
      const chatbotUrl = process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001';
      const response = await this.httpClient.post(`${chatbotUrl}/api/admin/restart`);
      return response.data?.data || { success: true, message: 'Servicio reiniciado' };
    } catch (error) {
      logger.warn('Error reiniciando chatbot:', error);
      return { success: false, message: 'Error al reiniciar el servicio' };
    }
  }

  // Valores por defecto
  private getDefaultChatbotMetrics(): ChatbotMetrics {
    return {
      status: 'unknown',
      usingFallback: false,
      ollamaAvailable: false,
      geminiAvailable: false,
      totalSessions: 0,
      activeSessions: 0,
      messagesProcessed: 0,
      averageResponseTime: 0,
      fallbackUsagePercent: 0,
      lastModelUsed: 'unknown',
      errorRate: 0,
    };
  }

  private getDefaultRecommenderMetrics(): RecommenderMetrics {
    return {
      status: 'unknown',
      totalRecommendations: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      activeModels: [],
      interactionsProcessed: 0,
    };
  }

  private getDefaultAutoPurchaseMetrics(): AutomationMetrics['autoPurchase'] {
    return {
      status: 'unknown',
      pendingOrders: 0,
      processedToday: 0,
      successRate: 0,
      averageProcessingTime: 0,
    };
  }

  private getDefaultSyncEngineMetrics(): AutomationMetrics['syncEngine'] {
    return {
      status: 'unknown',
      productsUpdated: 0,
      pricesUpdated: 0,
      syncErrors: 0,
    };
  }

  private getDefaultOrderStats(): BusinessKPIs['orders'] {
    return { pending: 0, processing: 0, shipped: 0, delivered: 0, total: 0 };
  }

  private getDefaultTicketStats(): BusinessKPIs['tickets'] {
    return { open: 0, inProgress: 0, resolved: 0, averageResolutionTime: 0 };
  }

  private getDefaultUserStats(): BusinessKPIs['users'] {
    return { total: 0, activeToday: 0, newThisWeek: 0 };
  }
}
