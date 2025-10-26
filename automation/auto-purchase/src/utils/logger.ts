import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';

export const logger = createLogger('auto-purchase');

// Export utility functions for structured logging
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };

// Export logger with additional utility methods for auto-purchase specific logging
export class Logger {
  static info(message: string, meta?: any): void {
    logger.info(message, meta);
  }
  
  static error(message: string, meta?: any): void {
    logger.error(message, meta);
  }
  
  static warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }
  
  static debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }
  
  static logPurchaseAttempt(orderId: number, provider: string, attempt: number): void {
    logBusinessEvent(logger, 'purchase_attempt_started', {
      orderId,
      provider,
      attempt,
    });
  }
  
  static logPurchaseSuccess(orderId: number, provider: string, providerOrderId: string, cost: number): void {
    logBusinessEvent(logger, 'purchase_completed_successfully', {
      orderId,
      provider,
      providerOrderId,
      cost,
    });
  }
  
  static logPurchaseFailure(orderId: number, provider: string, error: string, attempt: number): void {
    logError(logger, new Error(`Purchase attempt failed: ${error}`), {
      orderId,
      provider,
      attempt,
    });
  }
  
  static logConfirmationStart(orderId: number, provider: string, providerOrderId: string): void {
    logBusinessEvent(logger, 'confirmation_handling_started', {
      orderId,
      provider,
      providerOrderId,
    });
  }
  
  static logConfirmationComplete(orderId: number, provider: string, status: string): void {
    logBusinessEvent(logger, 'confirmation_handling_completed', {
      orderId,
      provider,
      status,
    });
  }
  
  static logOrderServiceUpdate(orderId: number, updateType: string, success: boolean, error?: string): void {
    if (success) {
      logBusinessEvent(logger, 'order_service_update_success', {
        orderId,
        updateType,
      });
    } else {
      logError(logger, new Error(`Order Service update failed: ${error}`), {
        orderId,
        updateType,
      });
    }
  }
  
  static logProviderApiCall(provider: string, endpoint: string, method: string, success: boolean, responseTime?: number): void {
    if (responseTime) {
      logPerformance(logger, `provider_api_call_${provider}`, responseTime, {
        endpoint,
        method,
        success,
      });
    } else {
      logBusinessEvent(logger, 'provider_api_call', {
        provider,
        endpoint,
        method,
        success,
      });
    }
  }
  
  static logRetryAttempt(orderId: number, provider: string, attempt: number, maxAttempts: number, delay: number): void {
    logger.warn('Retrying operation', {
      orderId,
      provider,
      attempt,
      maxAttempts,
      delay,
      critical: attempt >= maxAttempts - 1, // Mark as critical if it's the last attempt
    });
  }
  
  static logBatchProcessing(batchSize: number, successCount: number, failureCount: number, processingTime: number): void {
    logPerformance(logger, 'batch_processing', processingTime, {
      batchSize,
      successCount,
      failureCount,
      successRate: (successCount / batchSize) * 100,
    });
  }
}

// Export default logger instance
export default logger;