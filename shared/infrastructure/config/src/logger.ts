import winston from 'winston';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { createLoggerTransports, loggingConfig, logLevels, logColors } from './logging';

export interface AlertContext {
  service: string;
  level: string;
  message: string;
  timestamp: string;
  meta?: any;
  stack?: string;
}

class AlertManager {
  private emailTransporter?: nodemailer.Transporter;
  private lastAlertTime: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (loggingConfig.alerts.enabled && loggingConfig.alerts.email) {
      this.emailTransporter = nodemailer.createTransport({
        host: loggingConfig.alerts.email.host,
        port: loggingConfig.alerts.email.port,
        secure: loggingConfig.alerts.email.secure,
        auth: loggingConfig.alerts.email.auth,
      });
    }
  }

  private shouldSendAlert(alertKey: string): boolean {
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alertKey);
    
    if (!lastAlert || now - lastAlert > this.ALERT_COOLDOWN) {
      this.lastAlertTime.set(alertKey, now);
      return true;
    }
    
    return false;
  }

  async sendAlert(context: AlertContext): Promise<void> {
    if (!loggingConfig.alerts.enabled) return;

    const alertKey = `${context.service}-${context.level}-${context.message}`;
    
    if (!this.shouldSendAlert(alertKey)) {
      return; // Skip duplicate alerts within cooldown period
    }

    const promises: Promise<any>[] = [];

    // Send webhook alert
    if (loggingConfig.alerts.webhook) {
      promises.push(this.sendWebhookAlert(context));
    }

    // Send email alert
    if (this.emailTransporter && loggingConfig.alerts.email) {
      promises.push(this.sendEmailAlert(context));
    }

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to send alerts:', error);
    }
  }

  private async sendWebhookAlert(context: AlertContext): Promise<void> {
    if (!loggingConfig.alerts.webhook) return;

    const payload = {
      text: `🚨 Critical Error Alert - ${context.service}`,
      attachments: [
        {
          color: context.level === 'error' ? 'danger' : 'warning',
          fields: [
            {
              title: 'Service',
              value: context.service,
              short: true,
            },
            {
              title: 'Level',
              value: context.level.toUpperCase(),
              short: true,
            },
            {
              title: 'Message',
              value: context.message,
              short: false,
            },
            {
              title: 'Timestamp',
              value: context.timestamp,
              short: true,
            },
            {
              title: 'Environment',
              value: process.env.NODE_ENV || 'development',
              short: true,
            },
          ],
        },
      ],
    };

    if (context.stack) {
      payload.attachments[0].fields.push({
        title: 'Stack Trace',
        value: `\`\`\`${context.stack}\`\`\``,
        short: false,
      });
    }

    await axios.post(loggingConfig.alerts.webhook, payload, {
      timeout: 5000,
    });
  }

  private async sendEmailAlert(context: AlertContext): Promise<void> {
    if (!this.emailTransporter || !loggingConfig.alerts.email) return;

    const subject = `🚨 TechNovaStore Alert: ${context.level.toUpperCase()} in ${context.service}`;
    
    const html = `
      <h2>Critical Error Alert</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Service</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${context.service}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Level</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${context.level.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Message</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${context.message}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Timestamp</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${context.timestamp}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Environment</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${process.env.NODE_ENV || 'development'}</td>
        </tr>
      </table>
      ${context.stack ? `<h3>Stack Trace</h3><pre style="background: #f4f4f4; padding: 10px; overflow-x: auto;">${context.stack}</pre>` : ''}
      ${context.meta ? `<h3>Additional Context</h3><pre style="background: #f4f4f4; padding: 10px; overflow-x: auto;">${JSON.stringify(context.meta, null, 2)}</pre>` : ''}
    `;

    await this.emailTransporter.sendMail({
      from: loggingConfig.alerts.email.from,
      to: loggingConfig.alerts.email.to,
      subject,
      html,
    });
  }
}

const alertManager = new AlertManager();

export function createLogger(serviceName: string): winston.Logger {
  const transports = createLoggerTransports(serviceName);

  const logger = winston.createLogger({
    level: loggingConfig.level,
    levels: logLevels,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] })
    ),
    defaultMeta: { 
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
      hostname: process.env.HOSTNAME || require('os').hostname(),
    },
    transports,
    exitOnError: false,
  });

  // Add colors for console output
  winston.addColors(logColors);

  // Hook into error and warn levels for alerting
  const originalError = logger.error.bind(logger);
  const originalWarn = logger.warn.bind(logger);

  logger.error = function(message: any, meta?: any) {
    const result = originalError(message, meta);
    
    // Send alert for critical errors
    if (loggingConfig.alerts.enabled) {
      const context: AlertContext = {
        service: serviceName,
        level: 'error',
        message: typeof message === 'string' ? message : JSON.stringify(message),
        timestamp: new Date().toISOString(),
        meta,
        stack: meta?.stack || (message instanceof Error ? message.stack : undefined),
      };
      
      alertManager.sendAlert(context).catch(err => {
        console.error('Failed to send error alert:', err);
      });
    }
    
    return result;
  };

  logger.warn = function(message: any, meta?: any) {
    const result = originalWarn(message, meta);
    
    // Send alert for critical warnings (optional)
    if (loggingConfig.alerts.enabled && meta?.critical) {
      const context: AlertContext = {
        service: serviceName,
        level: 'warn',
        message: typeof message === 'string' ? message : JSON.stringify(message),
        timestamp: new Date().toISOString(),
        meta,
      };
      
      alertManager.sendAlert(context).catch(err => {
        console.error('Failed to send warning alert:', err);
      });
    }
    
    return result;
  };

  return logger;
}

// Utility functions for structured logging
export const logRequest = (logger: winston.Logger, req: any, res: any, responseTime?: number) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection?.remoteAddress,
    userId: req.user?.id,
    sessionId: req.sessionID,
  });
};

export const logError = (logger: winston.Logger, error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context,
  });
};

export const logBusinessEvent = (logger: winston.Logger, event: string, data: any) => {
  logger.info('Business Event', {
    event,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const logPerformance = (logger: winston.Logger, operation: string, duration: number, metadata?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

export const logSecurity = (logger: winston.Logger, event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    critical: true, // This will trigger alerts
  });
};