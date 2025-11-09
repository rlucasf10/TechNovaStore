import { Request } from 'express';
import { logger } from './logger';
import { securityConfig } from '../config/security';

interface SecurityEvent {
  type: 'RATE_LIMIT' | 'CSRF_VIOLATION' | 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'SUSPICIOUS_REQUEST' | 'AUTH_FAILURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent?: string;
  url: string;
  method: string;
  userId?: string;
  details: any;
  timestamp: Date;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private ipAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private suspiciousIPs: Set<string> = new Set();

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(fullEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log to Winston
    const logLevel = this.getLogLevel(event.severity);
    logger[logLevel]('Security event detected', fullEvent);

    // Track IP attempts
    this.trackIPAttempts(fullEvent.ip, fullEvent.type);

    // Check for suspicious patterns
    this.checkSuspiciousActivity(fullEvent);

    // Send alerts if configured
    if (securityConfig.monitoring.alertOnSuspiciousActivity) {
      this.checkAlertConditions(fullEvent);
    }
  }

  /**
   * Track failed attempts per IP
   */
  private trackIPAttempts(ip: string, eventType: SecurityEvent['type']): void {
    const current = this.ipAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
    
    // Reset count if last attempt was more than lockout duration ago
    const timeSinceLastAttempt = Date.now() - current.lastAttempt.getTime();
    if (timeSinceLastAttempt > securityConfig.monitoring.lockoutDuration) {
      current.count = 0;
    }

    current.count++;
    current.lastAttempt = new Date();
    this.ipAttempts.set(ip, current);

    // Mark IP as suspicious if too many attempts
    if (current.count >= securityConfig.monitoring.maxFailedAttempts) {
      this.suspiciousIPs.add(ip);
      
      this.logEvent({
        type: 'SUSPICIOUS_REQUEST',
        severity: 'HIGH',
        ip,
        url: '',
        method: '',
        details: {
          reason: 'Too many failed attempts',
          attemptCount: current.count,
          eventType
        }
      });
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private checkSuspiciousActivity(event: SecurityEvent): void {
    const recentEvents = this.events.filter(e => 
      Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    // Check for rapid-fire requests from same IP
    const sameIPEvents = recentEvents.filter(e => e.ip === event.ip);
    if (sameIPEvents.length > 20) {
      this.logEvent({
        type: 'SUSPICIOUS_REQUEST',
        severity: 'MEDIUM',
        ip: event.ip,
        url: event.url,
        method: event.method,
        details: {
          reason: 'Rapid requests detected',
          eventCount: sameIPEvents.length
        }
      });
    }

    // Check for distributed attacks (many IPs, same pattern)
    const uniqueIPs = new Set(recentEvents.map(e => e.ip));
    if (uniqueIPs.size > 10 && recentEvents.length > 50) {
      this.logEvent({
        type: 'SUSPICIOUS_REQUEST',
        severity: 'HIGH',
        ip: event.ip,
        url: event.url,
        method: event.method,
        details: {
          reason: 'Potential distributed attack',
          uniqueIPs: uniqueIPs.size,
          totalEvents: recentEvents.length
        }
      });
    }
  }

  /**
   * Check if alerts should be sent
   */
  private checkAlertConditions(event: SecurityEvent): void {
    // Send alert for critical events
    if (event.severity === 'CRITICAL') {
      this.sendAlert(event);
    }

    // Send alert for high severity events from suspicious IPs
    if (event.severity === 'HIGH' && this.suspiciousIPs.has(event.ip)) {
      this.sendAlert(event);
    }

    // Send alert for multiple high severity events in short time
    const recentHighSeverityEvents = this.events.filter(e => 
      e.severity === 'HIGH' && 
      Date.now() - e.timestamp.getTime() < 10 * 60 * 1000 // Last 10 minutes
    );

    if (recentHighSeverityEvents.length >= 5) {
      this.sendAlert({
        ...event,
        details: {
          ...event.details,
          reason: 'Multiple high severity events detected',
          eventCount: recentHighSeverityEvents.length
        }
      });
    }
  }

  /**
   * Send security alert
   */
  private sendAlert(event: SecurityEvent): void {
    // In a real implementation, this would send emails, Slack messages, etc.
    logger.error('SECURITY ALERT', {
      event,
      message: 'Immediate attention required'
    });

    // Could integrate with external alerting systems here
    // - Email notifications
    // - Slack/Discord webhooks
    // - PagerDuty
    // - SMS alerts
  }

  /**
   * Get appropriate log level for severity
   */
  private getLogLevel(severity: SecurityEvent['severity']): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'LOW': return 'info';
      case 'MEDIUM': return 'warn';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'info';
    }
  }

  /**
   * Check if IP is suspicious
   */
  isSuspiciousIP(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * Get security statistics
   */
  getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    suspiciousIPs: number;
    recentEvents: number;
  } {
    const now = Date.now();
    const recentEvents = this.events.filter(e => now - e.timestamp.getTime() < 24 * 60 * 60 * 1000);

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      suspiciousIPs: this.suspiciousIPs.size,
      recentEvents: recentEvents.length
    };
  }

  /**
   * Clear old events and reset counters
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - (7 * 24 * 60 * 60 * 1000); // 7 days

    // Remove old events
    this.events = this.events.filter(e => e.timestamp.getTime() > cutoff);

    // Clean up IP attempts
    for (const [ip, data] of this.ipAttempts.entries()) {
      if (now - data.lastAttempt.getTime() > securityConfig.monitoring.lockoutDuration) {
        this.ipAttempts.delete(ip);
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

// Create singleton instance
export const securityMonitor = new SecurityMonitor();

// Helper function to log security events from middleware
export const logSecurityEvent = (
  req: Request,
  type: SecurityEvent['type'],
  severity: SecurityEvent['severity'],
  details: any
): void => {
  if (!securityConfig.monitoring.logSecurityEvents) {
    return;
  }

  securityMonitor.logEvent({
    type,
    severity,
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
    userId: req.headers['x-user-id'] as string,
    details
  });
};

// Cleanup old events every hour
setInterval(() => {
  securityMonitor.cleanup();
}, 60 * 60 * 1000);

export default securityMonitor;