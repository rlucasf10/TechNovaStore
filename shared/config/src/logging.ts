import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export interface LoggingConfig {
  level: string;
  elasticsearch: {
    enabled: boolean;
    node: string;
    index: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  alerts: {
    enabled: boolean;
    webhook?: string;
    email?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      from: string;
      to: string[];
    };
  };
  file: {
    enabled: boolean;
    maxSize: number;
    maxFiles: number;
  };
}

export const loggingConfig: LoggingConfig = {
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  elasticsearch: {
    enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'technovastore-logs',
    auth: process.env.ELASTICSEARCH_USERNAME ? {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD || '',
    } : undefined,
  },
  alerts: {
    enabled: process.env.ALERTS_ENABLED === 'true',
    webhook: process.env.ALERT_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL_HOST ? {
      host: process.env.ALERT_EMAIL_HOST,
      port: parseInt(process.env.ALERT_EMAIL_PORT || '587'),
      secure: process.env.ALERT_EMAIL_SECURE === 'true',
      auth: {
        user: process.env.ALERT_EMAIL_USER || '',
        pass: process.env.ALERT_EMAIL_PASS || '',
      },
      from: process.env.ALERT_EMAIL_FROM || 'alerts@technovastore.com',
      to: (process.env.ALERT_EMAIL_TO || '').split(',').filter(Boolean),
    } : undefined,
  },
  file: {
    enabled: process.env.FILE_LOGGING_ENABLED !== 'false',
    maxSize: parseInt(process.env.LOG_FILE_MAX_SIZE || '5242880'), // 5MB
    maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5'),
  },
};

export const createLoggerTransports = (serviceName: string): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport for non-production
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
          })
        ),
      })
    );
  }

  // File transports
  if (loggingConfig.file.enabled) {
    transports.push(
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        maxsize: loggingConfig.file.maxSize,
        maxFiles: loggingConfig.file.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        maxsize: loggingConfig.file.maxSize,
        maxFiles: loggingConfig.file.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );
  }

  // Elasticsearch transport for ELK Stack integration
  if (loggingConfig.elasticsearch.enabled) {
    const esTransportOptions: any = {
      level: 'info',
      client: {
        host: loggingConfig.elasticsearch.node,
        auth: loggingConfig.elasticsearch.auth,
        requestTimeout: 10000,
      },
      index: `${loggingConfig.elasticsearch.index}-${serviceName}`,
      indexSuffixPattern: 'YYYY.MM.DD',
      transformer: (logData: any) => {
        return {
          '@timestamp': new Date().toISOString(),
          service: serviceName,
          level: logData.level,
          message: logData.message,
          meta: logData.meta,
          environment: process.env.NODE_ENV || 'development',
          hostname: process.env.HOSTNAME || require('os').hostname(),
          ...logData,
        };
      },
    };

    try {
      transports.push(new ElasticsearchTransport(esTransportOptions));
    } catch (error) {
      console.warn('Failed to initialize Elasticsearch transport:', error);
    }
  }

  return transports;
};

export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

export const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'grey',
  debug: 'white',
  silly: 'rainbow',
};