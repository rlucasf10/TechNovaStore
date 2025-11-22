/**
 * Controlador del Sync Engine
 * 
 * Maneja todas las peticiones HTTP y coordina los casos de uso
 */

import { Request, Response } from 'express';
import { TriggerFullSync } from '../trigger-full-sync/TriggerFullSync';
import { TriggerPriceUpdate } from '../trigger-price-update/TriggerPriceUpdate';
import { CompareProductPrices } from '../compare-product-prices/CompareProductPrices';
import { AnalyzeMarket } from '../analyze-market/AnalyzeMarket';
import { UpdateDynamicPrice } from '../update-dynamic-price/UpdateDynamicPrice';
import { GetSyncStatus } from '../get-sync-status/GetSyncStatus';
import { GetSyncMetrics } from '../get-sync-metrics/GetSyncMetrics';
import { GetCacheStats } from '../get-cache-stats/GetCacheStats';
import { GetPricingAlerts } from '../get-pricing-alerts/GetPricingAlerts';
import { ManageProviders } from '../manage-providers/ManageProviders';
import { CleanupOldData } from '../cleanup-old-data/CleanupOldData';
import { HealthCheck } from '../health-check/HealthCheck';
import { ProviderType } from '../shared/types/provider';

export class SyncEngineController {
  constructor(
    private triggerFullSync: TriggerFullSync,
    private triggerPriceUpdate: TriggerPriceUpdate,
    private compareProductPrices: CompareProductPrices,
    private analyzeMarket: AnalyzeMarket,
    private updateDynamicPrice: UpdateDynamicPrice,
    private getSyncStatus: GetSyncStatus,
    private getSyncMetrics: GetSyncMetrics,
    private getCacheStats: GetCacheStats,
    private getPricingAlerts: GetPricingAlerts,
    private manageProviders: ManageProviders,
    private cleanupOldData: CleanupOldData,
    private healthCheck: HealthCheck
  ) {}

  // Health check
  async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthCheck.execute();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Status
  handleGetStatus(req: Request, res: Response): void {
    try {
      const status = this.getSyncStatus.execute();
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Metrics
  async handleGetMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.getSyncMetrics.execute();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Cache stats
  async handleGetCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getCacheStats.execute();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get cache stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Pricing alerts
  handleGetPricingAlerts(req: Request, res: Response): void {
    try {
      const alerts = this.getPricingAlerts.execute();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get pricing alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Trigger full sync
  async handleTriggerFullSync(req: Request, res: Response): Promise<void> {
    try {
      const { providers } = req.body;
      await this.triggerFullSync.execute(providers);
      res.json({ message: 'Full sync triggered successfully' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to trigger full sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Trigger price update
  async handleTriggerPriceUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { providers } = req.body;
      await this.triggerPriceUpdate.execute(providers);
      res.json({ message: 'Price update triggered successfully' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to trigger price update',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Compare product prices
  async handleCompareProductPrices(req: Request, res: Response): Promise<void> {
    try {
      const { sku, productName } = req.body;

      if (!sku || !productName) {
        res.status(400).json({
          error: 'Missing required fields',
          message: 'sku and productName are required'
        });
        return;
      }

      const comparison = await this.compareProductPrices.execute(sku, productName);
      res.json(comparison);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to compare prices',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Analyze market
  async handleAnalyzeMarket(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.body;

      if (!sku) {
        res.status(400).json({
          error: 'Missing required field',
          message: 'sku is required'
        });
        return;
      }

      const analysis = await this.analyzeMarket.execute(sku);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to analyze market',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update dynamic price
  async handleUpdateDynamicPrice(req: Request, res: Response): Promise<void> {
    try {
      const { sku, productName } = req.body;

      if (!sku || !productName) {
        res.status(400).json({
          error: 'Missing required fields',
          message: 'sku and productName are required'
        });
        return;
      }

      const result = await this.updateDynamicPrice.execute(sku, productName);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update dynamic price',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // List providers
  async handleListProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = await this.manageProviders.listProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to list providers',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Cleanup
  async handleCleanup(req: Request, res: Response): Promise<void> {
    try {
      const { hoursOld } = req.body;
      const result = await this.cleanupOldData.execute(hoursOld);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to run cleanup',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
