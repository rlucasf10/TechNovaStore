/**
 * Servicio para interactuar con la API de Campaign Manager
 */

import axios from 'axios';
import type { Campaign, CampaignFilters, PaginatedResponse, CampaignReport } from '@/shared/types';

// Usar el API Gateway para las campañas (el servicio de campañas está en el puerto 3011 internamente)
const CAMPAIGN_SERVICE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Caché para evitar múltiples peticiones a /campaigns/active
let activeCampaignCache: { data: Campaign | null; timestamp: number; promise: Promise<Campaign | null> | null } = {
  data: null,
  timestamp: 0,
  promise: null,
};
const CACHE_TTL = 60000; // 1 minuto de caché

// Cliente específico para Campaign Manager Service
const campaignApi = axios.create({
  baseURL: CAMPAIGN_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Para enviar cookies si es necesario
});

// ✅ SEGURIDAD: NO agregar interceptor de Authorization header
// La autenticación se maneja mediante httpOnly cookies que el navegador envía automáticamente
// con withCredentials: true. Esto previene ataques XSS ya que JavaScript no puede acceder
// a las cookies httpOnly.

// Interceptor para manejar errores
campaignApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Los errores 404 en campañas son esperados (no hay campaña activa)
    // No loguear nada para estos casos
    if (error.response?.status === 404) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Si no está autenticado, solo loguear en desarrollo
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        // Silenciado: es normal no estar autenticado para ver campañas públicas
      }
    }
    return Promise.reject(error);
  }
);

export const campaignService = {
  /**
   * Obtener todas las campañas con filtros opcionales
   */
  async getCampaigns(filters?: CampaignFilters): Promise<PaginatedResponse<Campaign>> {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    // La base URL ya incluye /api, así que usamos /campaigns directamente
    const url = `/campaigns${queryString ? `?${queryString}` : ''}`;
    
    const response = await campaignApi.get<any>(url);
    
    // El backend devuelve { campaigns: [...], total: ... }
    // Convertir al formato PaginatedResponse esperado
    if (response.data.campaigns) {
      return {
        data: response.data.campaigns,
        pagination: {
          page: filters?.page || 1,
          limit: filters?.limit || 10,
          total: response.data.total || 0,
          pages: Math.ceil((response.data.total || 0) / (filters?.limit || 10))
        }
      };
    }
    
    // Si ya viene en el formato correcto, devolverlo tal cual
    return response.data;
  },

  /**
   * Obtener una campaña por ID
   */
  async getCampaign(id: string): Promise<Campaign> {
    const response = await campaignApi.get<any>(`/campaigns/${id}`);
    // El backend devuelve directamente el objeto Campaign, no { data: Campaign }
    return response.data;
  },

  /**
   * Obtener la campaña activa de mayor prioridad
   * Usa caché para evitar múltiples peticiones desde diferentes componentes
   */
  async getActiveCampaign(): Promise<Campaign | null> {
    const now = Date.now();
    
    // Si hay datos en caché válidos, retornarlos
    if (activeCampaignCache.timestamp > 0 && now - activeCampaignCache.timestamp < CACHE_TTL) {
      return activeCampaignCache.data;
    }
    
    // Si ya hay una petición en curso, esperar a que termine
    if (activeCampaignCache.promise) {
      return activeCampaignCache.promise;
    }
    
    // Crear nueva petición
    activeCampaignCache.promise = (async () => {
      try {
        const response = await campaignApi.get<any>(`/campaigns/active`);
        // El backend devuelve directamente el objeto Campaign, no { data: Campaign }
        activeCampaignCache.data = response.data;
        activeCampaignCache.timestamp = Date.now();
        return response.data;
      } catch {
        // Si no hay campaña activa, guardar null en caché
        activeCampaignCache.data = null;
        activeCampaignCache.timestamp = Date.now();
        return null;
      } finally {
        activeCampaignCache.promise = null;
      }
    })();
    
    return activeCampaignCache.promise;
  },

  /**
   * Crear una nueva campaña
   */
  async createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'discountsApplied'>): Promise<Campaign> {
    const response = await campaignApi.post<any>(`/campaigns`, campaign);
    // El backend devuelve directamente el objeto Campaign
    return response.data;
  },

  /**
   * Actualizar una campaña existente
   */
  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    const response = await campaignApi.put<any>(`/campaigns/${id}`, campaign);
    // El backend devuelve directamente el objeto Campaign
    return response.data;
  },

  /**
   * Eliminar una campaña
   */
  async deleteCampaign(id: string): Promise<void> {
    await campaignApi.delete(`/campaigns/${id}`);
  },

  /**
   * Aplicar descuentos de una campaña manualmente
   */
  async applyDiscounts(id: string): Promise<{ productsAffected: number }> {
    const response = await campaignApi.post<any>(
      `/campaigns/${id}/apply-discounts`
    );
    // El backend devuelve directamente el objeto con productsAffected
    return response.data;
  },

  /**
   * Remover descuentos de una campaña manualmente
   */
  async removeDiscounts(id: string): Promise<{ productsRestored: number }> {
    const response = await campaignApi.post<any>(
      `/campaigns/${id}/remove-discounts`
    );
    // El backend devuelve directamente el objeto con productsRestored
    return response.data;
  },

  /**
   * Obtener analytics de una campaña
   */
  async getCampaignAnalytics(id: string): Promise<CampaignReport> {
    const response = await campaignApi.get<CampaignReport>(`/campaigns/${id}/analytics`);
    // El backend devuelve directamente el objeto de analytics/reporte
    return response.data;
  },
};
