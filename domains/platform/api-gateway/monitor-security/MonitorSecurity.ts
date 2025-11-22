import { Request } from 'express';
import { logger } from '../shared/utils/logger';

/**
 * Caso de uso: Monitor Security
 * 
 * Monitorea eventos de seguridad y mantiene estadísticas
 * sobre intentos de ataque y comportamiento sospechoso.
 */
export class MonitorSecurity {
  private stats: SecurityStats;
  private suspiciousIPs: Map<string, IPActivity>;

  constructor() {
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      rateLimitExceeded: 0,
      csrfViolations: 0,
      xssAttempts: 0,
      sqlInjectionAttempts: 0,
      authFailures: 0
    };
    this.suspiciousIPs = new Map();
  }

  /**
   * Registra un evento de seguridad
   */
  logSecurityEvent(
    req: Request,
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    details?: any
  ): void {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Actualizar estadísticas
    this.updateStats(eventType);

    // Registrar actividad de IP
    this.trackIPActivity(ip, eventType, severity);

    // Log del evento
    logger.warn('Security event detected', {
      eventType,
      severity,
      ip,
      userAgent,
      url: req.url,
      method: req.method,
      details
    });

    // Alertar si es crítico
    if (severity === 'CRITICAL') {
      this.alertCriticalEvent(ip, eventType, details);
    }
  }

  /**
   * Actualiza las estadísticas de seguridad
   */
  private updateStats(eventType: SecurityEventType): void {
    this.stats.totalRequests++;

    switch (eventType) {
      case 'BLOCKED_REQUEST':
        this.stats.blockedRequests++;
        break;
      case 'SUSPICIOUS_REQUEST':
        this.stats.suspiciousRequests++;
        break;
      case 'RATE_LIMIT_EXCEEDED':
        this.stats.rateLimitExceeded++;
        break;
      case 'CSRF_VIOLATION':
        this.stats.csrfViolations++;
        break;
      case 'XSS_ATTEMPT':
        this.stats.xssAttempts++;
        break;
      case 'SQL_INJECTION_ATTEMPT':
        this.stats.sqlInjectionAttempts++;
        break;
      case 'AUTH_FAILURE':
        this.stats.authFailures++;
        break;
    }
  }

  /**
   * Rastrea la actividad de una IP
   */
  private trackIPActivity(
    ip: string,
    eventType: SecurityEventType,
    severity: SecuritySeverity
  ): void {
    let activity = this.suspiciousIPs.get(ip);

    if (!activity) {
      activity = {
        ip,
        events: [],
        suspicionScore: 0,
        firstSeen: new Date(),
        lastSeen: new Date()
      };
      this.suspiciousIPs.set(ip, activity);
    }

    activity.events.push({
      type: eventType,
      severity,
      timestamp: new Date()
    });
    activity.lastSeen = new Date();

    // Calcular score de sospecha
    activity.suspicionScore += this.getSeverityScore(severity);

    // Limpiar eventos antiguos (más de 24 horas)
    this.cleanupOldEvents(activity);
  }

  /**
   * Obtiene el score de severidad
   */
  private getSeverityScore(severity: SecuritySeverity): number {
    switch (severity) {
      case 'LOW':
        return 1;
      case 'MEDIUM':
        return 5;
      case 'HIGH':
        return 10;
      case 'CRITICAL':
        return 25;
      default:
        return 0;
    }
  }

  /**
   * Limpia eventos antiguos de una IP
   */
  private cleanupOldEvents(activity: IPActivity): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    activity.events = activity.events.filter(
      event => event.timestamp > oneDayAgo
    );

    // Recalcular score
    activity.suspicionScore = activity.events.reduce(
      (score, event) => score + this.getSeverityScore(event.severity),
      0
    );
  }

  /**
   * Alerta sobre un evento crítico
   */
  private alertCriticalEvent(
    ip: string,
    eventType: SecurityEventType,
    details?: any
  ): void {
    logger.error('CRITICAL SECURITY EVENT', {
      ip,
      eventType,
      details,
      timestamp: new Date().toISOString()
    });

    // Aquí se podría integrar con sistemas de alertas externos
    // como Slack, PagerDuty, etc.
  }

  /**
   * Obtiene las estadísticas de seguridad
   */
  getStats(): SecurityStats {
    return { ...this.stats };
  }

  /**
   * Obtiene IPs sospechosas
   */
  getSuspiciousIPs(minScore: number = 10): IPActivity[] {
    const suspicious: IPActivity[] = [];

    for (const activity of this.suspiciousIPs.values()) {
      this.cleanupOldEvents(activity);
      if (activity.suspicionScore >= minScore) {
        suspicious.push({ ...activity });
      }
    }

    return suspicious.sort((a, b) => b.suspicionScore - a.suspicionScore);
  }

  /**
   * Verifica si una IP es sospechosa
   */
  isIPSuspicious(ip: string, threshold: number = 50): boolean {
    const activity = this.suspiciousIPs.get(ip);
    if (!activity) return false;

    this.cleanupOldEvents(activity);
    return activity.suspicionScore >= threshold;
  }

  /**
   * Limpia las estadísticas (para testing)
   */
  clearStats(): void {
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      rateLimitExceeded: 0,
      csrfViolations: 0,
      xssAttempts: 0,
      sqlInjectionAttempts: 0,
      authFailures: 0
    };
    this.suspiciousIPs.clear();
  }
}

export type SecurityEventType =
  | 'BLOCKED_REQUEST'
  | 'SUSPICIOUS_REQUEST'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_VIOLATION'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'AUTH_FAILURE';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityStats {
  totalRequests: number;
  blockedRequests: number;
  suspiciousRequests: number;
  rateLimitExceeded: number;
  csrfViolations: number;
  xssAttempts: number;
  sqlInjectionAttempts: number;
  authFailures: number;
}

export interface IPActivity {
  ip: string;
  events: SecurityEvent[];
  suspicionScore: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
}
