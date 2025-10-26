/**
 * Types and interfaces for the Resource Cleanup Manager system
 */

export type ResourceType = 'database' | 'server' | 'timer' | 'socket' | 'process' | 'custom';

export type CleanupFunction = () => Promise<void> | void;

export interface CleanupResource {
  id: string;
  type: ResourceType;
  resource: any;
  cleanup: CleanupFunction;
  priority: number;
  timeout?: number;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface CleanupConfig {
  // Timeouts
  gracefulTimeout: number; // 5000ms por defecto
  forceTimeout: number;    // 10000ms por defecto

  // Reintentos
  maxRetries: number;      // 3 por defecto
  retryDelay: number;      // 1000ms por defecto

  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logToFile: boolean;
  logFilePath?: string;

  // Detección de handles
  detectHandles: boolean;
  handleDetectionTimeout: number; // 2000ms por defecto

  // Estrategias específicas
  databaseStrategy: 'graceful' | 'force' | 'hybrid';
  serverStrategy: 'graceful' | 'force' | 'hybrid';

  // Configuraciones adicionales para robustez
  strictMode: boolean; // Modo estricto para CI
  enableMetrics: boolean; // Habilitar métricas de rendimiento
  enableDiagnostics: boolean; // Habilitar herramientas de diagnóstico

  // Configuraciones específicas por tipo de recurso
  database: {
    connectionTimeout: number;
    queryTimeout: number;
    poolCleanupTimeout: number;
  };

  server: {
    shutdownTimeout: number;
    keepAliveTimeout: number;
    requestTimeout: number;
  };

  timer: {
    cleanupBatchSize: number;
    maxActiveTimers: number;
  };

  // Configuraciones de entorno
  environment: 'development' | 'testing' | 'ci' | 'production';
}

export interface CleanupResult {
  resourceId: string;
  success: boolean;
  duration: number;
  error?: Error;
  forced?: boolean;
}

export interface CleanupReport {
  startTime: number;
  endTime: number;
  duration: number;

  resources: {
    total: number;
    cleaned: number;
    failed: number;
    forced: number;
  };

  byType: Record<ResourceType, {
    count: number;
    success: number;
    failed: number;
    avgTime: number;
  }>;

  errors: CleanupError[];
  warnings: string[];

  openHandles?: {
    before: number;
    after: number;
    leaks: OpenHandleLeak[];
  };
}

export enum CleanupErrorType {
  TIMEOUT = 'TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  RESOURCE_BUSY = 'RESOURCE_BUSY',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN'
}

export class CleanupError extends Error {
  constructor(
    public type: CleanupErrorType,
    public resourceId: string,
    public resourceType: ResourceType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CleanupError';
  }
}

export interface OpenHandleLeak {
  type: string;
  description: string;
  stack?: string;
}

export interface HandleDetectionReport {
  total: number;
  baseline: number;
  current: HandleInfo[];
  leaks: OpenHandleLeak[];
}

export interface HandleInfo {
  type: string;
  description: string;
}

export interface CleanupLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  resourceId: string;
  resourceType: ResourceType;
  action: 'register' | 'cleanup' | 'force' | 'error';
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}