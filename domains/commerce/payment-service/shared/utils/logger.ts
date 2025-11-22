/**
 * Logger configurado para el Payment Service
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const serviceName = 'payment-service';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: serviceName,
    metadata: {
      environment: process.env.NODE_ENV || 'development',
      hostname: process.env.HOSTNAME || 'unknown',
    },
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${serviceName}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

// Si estamos en producción, también logear a archivo
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}
