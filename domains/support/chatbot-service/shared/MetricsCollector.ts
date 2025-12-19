/**
 * MetricsCollector - Recolector de métricas del chatbot
 * 
 * Recopila y almacena métricas de rendimiento del chatbot en memoria.
 * Las métricas se resetean cada 24 horas para evitar acumulación infinita.
 */

import { logger } from './utils/logger';

export interface ChatbotMetrics {
  messagesProcessed: number;
  totalResponseTime: number;
  errorCount: number;
  fallbackUsageCount: number;
  geminiUsageCount: number;
  ollamaUsageCount: number;
  startTime: Date;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export class MetricsCollector {
  private metrics: ChatbotMetrics;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 500; // Máximo de logs en memoria

  constructor() {
    this.metrics = this.createEmptyMetrics();
    this.startMetricsReset();
    this.addLog('info', 'MetricsCollector inicializado');
  }

  /**
   * Registrar un mensaje procesado
   */
  recordMessage(responseTime: number, aiProvider: 'gemini' | 'ollama' | 'fallback', hadError: boolean = false): void {
    this.metrics.messagesProcessed++;
    this.metrics.totalResponseTime += responseTime;

    if (hadError) {
      this.metrics.errorCount++;
      this.addLog('error', `Error procesando mensaje con ${aiProvider}`, { responseTime });
    } else {
      this.addLog('info', `Mensaje procesado con ${aiProvider}`, { responseTime });
    }

    // Registrar uso por proveedor
    switch (aiProvider) {
      case 'gemini':
        this.metrics.geminiUsageCount++;
        break;
      case 'ollama':
        this.metrics.ollamaUsageCount++;
        break;
      case 'fallback':
        this.metrics.fallbackUsageCount++;
        break;
    }
  }

  /**
   * Añadir entrada de log
   */
  addLog(level: LogEntry['level'], message: string, details?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };

    this.logs.push(entry);

    // Mantener solo los últimos MAX_LOGS
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
  }

  /**
   * Obtener logs recientes
   */
  getRecentLogs(limit: number = 50): LogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Obtener métricas actuales
   */
  getMetrics(): {
    messagesProcessed: number;
    averageResponseTime: number;
    errorRate: number;
    fallbackUsagePercent: number;
    geminiUsagePercent: number;
    ollamaUsagePercent: number;
  } {
    const { messagesProcessed, totalResponseTime, errorCount, fallbackUsageCount, geminiUsageCount, ollamaUsageCount } = this.metrics;

    return {
      messagesProcessed,
      averageResponseTime: messagesProcessed > 0 ? totalResponseTime / messagesProcessed : 0,
      errorRate: messagesProcessed > 0 ? errorCount / messagesProcessed : 0,
      fallbackUsagePercent: messagesProcessed > 0 ? (fallbackUsageCount / messagesProcessed) * 100 : 0,
      geminiUsagePercent: messagesProcessed > 0 ? (geminiUsageCount / messagesProcessed) * 100 : 0,
      ollamaUsagePercent: messagesProcessed > 0 ? (ollamaUsageCount / messagesProcessed) * 100 : 0,
    };
  }

  /**
   * Crear métricas vacías
   */
  private createEmptyMetrics(): ChatbotMetrics {
    return {
      messagesProcessed: 0,
      totalResponseTime: 0,
      errorCount: 0,
      fallbackUsageCount: 0,
      geminiUsageCount: 0,
      ollamaUsageCount: 0,
      startTime: new Date(),
    };
  }

  /**
   * Resetear métricas manualmente (para reinicio del servicio)
   */
  reset(): void {
    logger.info('Reseteando métricas del chatbot manualmente');
    this.addLog('warn', 'Métricas reseteadas manualmente');
    this.metrics = this.createEmptyMetrics();
    this.logs = [];
    this.addLog('info', 'Servicio reiniciado');
  }

  /**
   * Resetear métricas (se ejecuta cada 24 horas)
   */
  private resetMetrics(): void {
    logger.info('Reset automático de métricas (24h)');
    this.addLog('info', 'Reset automático de métricas (24h)');
    this.metrics = this.createEmptyMetrics();
  }

  /**
   * Iniciar reset automático de métricas cada 24 horas
   */
  private startMetricsReset(): void {
    setInterval(() => {
      this.resetMetrics();
    }, 24 * 60 * 60 * 1000); // 24 horas
  }
}
