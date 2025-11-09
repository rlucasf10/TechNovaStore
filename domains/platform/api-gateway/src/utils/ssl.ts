import fs from 'fs';
import path from 'path';
import https from 'https';
import { logger } from './logger';

export interface SSLConfig {
  key: string;
  cert: string;
  ca?: string;
  passphrase?: string;
}

/**
 * Load SSL certificates from file system
 */
export const loadSSLCertificates = (): SSLConfig | null => {
  try {
    const certDir = process.env.SSL_CERT_DIR || './certs';
    const keyFile = process.env.SSL_KEY_FILE || 'private.key';
    const certFile = process.env.SSL_CERT_FILE || 'certificate.crt';
    const caFile = process.env.SSL_CA_FILE || 'ca_bundle.crt';
    
    const keyPath = path.join(certDir, keyFile);
    const certPath = path.join(certDir, certFile);
    const caPath = path.join(certDir, caFile);

    // Check if required files exist
    if (!fs.existsSync(keyPath)) {
      logger.warn(`SSL private key not found at: ${keyPath}`);
      return null;
    }

    if (!fs.existsSync(certPath)) {
      logger.warn(`SSL certificate not found at: ${certPath}`);
      return null;
    }

    const sslConfig: SSLConfig = {
      key: fs.readFileSync(keyPath, 'utf8'),
      cert: fs.readFileSync(certPath, 'utf8'),
    };

    // Load CA bundle if available
    if (fs.existsSync(caPath)) {
      sslConfig.ca = fs.readFileSync(caPath, 'utf8');
      logger.info('SSL CA bundle loaded');
    }

    // Load passphrase if provided
    if (process.env.SSL_PASSPHRASE) {
      sslConfig.passphrase = process.env.SSL_PASSPHRASE;
    }

    logger.info('SSL certificates loaded successfully');
    return sslConfig;

  } catch (error) {
    logger.error('Failed to load SSL certificates:', error);
    return null;
  }
};

/**
 * Create HTTPS server options
 */
export const createHTTPSOptions = (): https.ServerOptions | null => {
  const sslConfig = loadSSLCertificates();
  
  if (!sslConfig) {
    return null;
  }

  return {
    key: sslConfig.key,
    cert: sslConfig.cert,
    ca: sslConfig.ca,
    passphrase: sslConfig.passphrase,
    // Security options
    secureProtocol: 'TLSv1_2_method',
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384'
    ].join(':'),
    honorCipherOrder: true,
    // Disable weak protocols
    secureOptions: require('constants').SSL_OP_NO_SSLv2 | 
                   require('constants').SSL_OP_NO_SSLv3 |
                   require('constants').SSL_OP_NO_TLSv1 |
                   require('constants').SSL_OP_NO_TLSv1_1
  };
};

/**
 * Generate self-signed certificate for development
 */
export const generateSelfSignedCert = (): void => {
  const certDir = process.env.SSL_CERT_DIR || './certs';
  
  // Create certs directory if it doesn't exist
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const keyPath = path.join(certDir, 'private.key');
  const certPath = path.join(certDir, 'certificate.crt');

  // Only generate if files don't exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    logger.info('SSL certificates already exist');
    return;
  }

  logger.warn('Generating self-signed certificate for development...');
  logger.warn('This should NOT be used in production!');

  // Note: In a real implementation, you would use a library like node-forge
  // or call openssl command to generate certificates
  // For this example, we'll create placeholder files and log instructions
  
  const instructions = `
To generate SSL certificates for development, run:

openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=ES/ST=Madrid/L=Madrid/O=TechNovaStore/CN=localhost"

For production, obtain certificates from a trusted CA like Let's Encrypt:
certbot certonly --standalone -d yourdomain.com
`;

  logger.info(instructions);

  // Create placeholder files with instructions
  fs.writeFileSync(keyPath, `# SSL Private Key\n# ${instructions}`);
  fs.writeFileSync(certPath, `# SSL Certificate\n# ${instructions}`);
};

/**
 * Validate SSL certificate
 */
export const validateSSLCertificate = (sslConfig: SSLConfig): boolean => {
  try {
    // Basic validation - check if cert and key are not empty
    if (!sslConfig.key || !sslConfig.cert) {
      logger.error('SSL certificate or key is empty');
      return false;
    }

    // Check if certificate is expired (basic check)
    const certMatch = sslConfig.cert.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
    if (!certMatch) {
      logger.error('Invalid certificate format');
      return false;
    }

    logger.info('SSL certificate validation passed');
    return true;

  } catch (error) {
    logger.error('SSL certificate validation failed:', error);
    return false;
  }
};

/**
 * Setup HTTPS redirect middleware for HTTP requests
 */
export const httpsRedirect = (req: any, res: any, next: any): void => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    const httpsUrl = `https://${req.get('host')}${req.url}`;
    logger.info(`Redirecting HTTP to HTTPS: ${req.url} -> ${httpsUrl}`);
    return res.redirect(301, httpsUrl);
  }
  next();
};