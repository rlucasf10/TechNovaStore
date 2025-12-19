/**
 * Servicio de Automatización
 * 
 * Gestiona las llamadas a los servicios de automatización:
 * - Product Sync Engine
 * - Auto Purchase System
 * - Shipment Tracker
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ============================================================================
// Tipos
// ============================================================================

export interface SyncEngineStatus {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastSync: string | null;
  productsSynced: number;
  syncErrors: number;
  activeProviders: string[];
  nextSync: string | null;
  isRunning: boolean;
}

export interface SyncEngineMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  lastSyncDuration: number;
  productsUpdated: number;
  pricesUpdated: number;
}

export interface AutoPurchaseStats {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  purchasesToday: number;
  successRate: number;
  pendingOrders: number;
  recentErrors: Array<{
    orderId: string;
    error: string;
    timestamp: string;
  }>;
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
}

export interface ShipmentTrackerStats {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  shipmentsTracked: number;
  updatesToday: number;
  deliveriesCompleted: number;
  delaysDetected: number;
  activeShipments: number;
  averageDeliveryTime: number;
}

export interface ProviderInfo {
  name: string;
  enabled: boolean;
  lastSync: string | null;
  productsCount: number;
  errorRate: number;
}

// ============================================================================
// Servicio
// ============================================================================

class AutomationService {
  private getAuthHeaders() {
    // El token JWT se envía automáticamente como cookie httpOnly
    // No necesitamos agregarlo manualmente
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Obtener estado del Product Sync Engine
   */
  async getSyncEngineStatus(): Promise<SyncEngineStatus> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sync-engine/status`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      });

      const data = response.data;

      return {
        status: data.status || 'unknown',
        lastSync: data.lastSync || null,
        productsSynced: data.productsSynced || 0,
        syncErrors: data.syncErrors || 0,
        activeProviders: data.activeProviders || [],
        nextSync: data.nextSync || null,
        isRunning: data.isRunning || false,
      };
    } catch (error) {
      console.error('Error fetching sync engine status:', error);
      return {
        status: 'error',
        lastSync: null,
        productsSynced: 0,
        syncErrors: 0,
        activeProviders: [],
        nextSync: null,
        isRunning: false,
      };
    }
  }

  /**
   * Obtener métricas del Product Sync Engine
   */
  async getSyncEngineMetrics(): Promise<SyncEngineMetrics> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sync-engine/metrics`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      });

      const data = response.data;

      return {
        totalSyncs: data.totalSyncs || 0,
        successfulSyncs: data.successfulSyncs || 0,
        failedSyncs: data.failedSyncs || 0,
        averageSyncTime: data.averageSyncTime || 0,
        lastSyncDuration: data.lastSyncDuration || 0,
        productsUpdated: data.productsUpdated || 0,
        pricesUpdated: data.pricesUpdated || 0,
      };
    } catch (error) {
      console.error('Error fetching sync engine metrics:', error);
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncTime: 0,
        lastSyncDuration: 0,
        productsUpdated: 0,
        pricesUpdated: 0,
      };
    }
  }

  /**
   * Obtener lista de proveedores
   */
  async getProviders(): Promise<ProviderInfo[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sync-engine/providers`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      });

      return response.data.providers || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  }

  /**
   * Pausar sincronización
   */
  async pauseSync(): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/sync-engine/pause`,
      {},
      {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  /**
   * Reanudar sincronización
   */
  async resumeSync(): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/sync-engine/resume`,
      {},
      {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  /**
   * Forzar sincronización completa
   */
  async triggerFullSync(): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/sync-engine/sync/full`,
      {},
      {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  /**
   * Obtener estadísticas del Auto Purchase System
   */
  async getAutoPurchaseStats(): Promise<AutoPurchaseStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/auto-purchase/stats`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      });

      const data = response.data;

      return {
        status: data.status || 'unknown',
        purchasesToday: data.purchasesToday || 0,
        successRate: data.successRate || 0,
        pendingOrders: data.pendingOrders || 0,
        recentErrors: data.recentErrors || [],
        totalProcessed: data.totalProcessed || 0,
        totalSuccess: data.totalSuccess || 0,
        totalFailed: data.totalFailed || 0,
      };
    } catch (error) {
      console.error('Error fetching auto purchase stats:', error);
      return {
        status: 'error',
        purchasesToday: 0,
        successRate: 0,
        pendingOrders: 0,
        recentErrors: [],
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 0,
      };
    }
  }

  /**
   * Procesar pedidos pendientes manualmente
   */
  async processPendingOrders(): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/auto-purchase/process-pending`,
      {},
      {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  /**
   * Obtener estadísticas del Shipment Tracker
   */
  async getShipmentTrackerStats(): Promise<ShipmentTrackerStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/shipment-tracker/stats`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      });

      const data = response.data;

      return {
        status: data.status || 'unknown',
        shipmentsTracked: data.shipmentsTracked || 0,
        updatesToday: data.updatesToday || 0,
        deliveriesCompleted: data.deliveriesCompleted || 0,
        delaysDetected: data.delaysDetected || 0,
        activeShipments: data.activeShipments || 0,
        averageDeliveryTime: data.averageDeliveryTime || 0,
      };
    } catch (error) {
      console.error('Error fetching shipment tracker stats:', error);
      return {
        status: 'error',
        shipmentsTracked: 0,
        updatesToday: 0,
        deliveriesCompleted: 0,
        delaysDetected: 0,
        activeShipments: 0,
        averageDeliveryTime: 0,
      };
    }
  }
}

export const automationService = new AutomationService();
