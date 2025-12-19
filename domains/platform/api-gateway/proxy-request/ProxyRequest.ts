import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { logger } from '../shared/utils/logger';
import { logSecurityEvent } from '../shared/utils/securityMonitor';

/**
 * Caso de uso: Proxy Request
 * 
 * Enruta peticiones HTTP a los microservicios correspondientes
 * con manejo de errores y logging de seguridad.
 */
export class ProxyRequest {
  /**
   * Crea un middleware de proxy para un servicio específico
   */
  execute(config: ProxyConfig): any {
    const options: Options = {
      target: config.targetUrl,
      changeOrigin: true,
      timeout: config.timeout || 30000,
      proxyTimeout: config.proxyTimeout || 30000,
      pathRewrite: config.pathRewrite,
      onError: (err: any, req: any, res: any) => {
        logger.error(`${config.serviceName} service proxy error:`, err);
        logSecurityEvent(req, 'SUSPICIOUS_REQUEST', config.securityLevel || 'MEDIUM', {
          error: err.message,
          service: config.serviceName
        });
        res.status(503).json({ error: `${config.serviceName} service unavailable` });
      },
      onProxyReq: (proxyReq: any, req: any) => {
        // Reenviar header Authorization si existe
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }

        // Reenviar información del usuario si está disponible (desde authMiddleware)
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id.toString());
          proxyReq.setHeader('X-User-Role', req.user.role);
        }

        // También verificar si los headers ya vienen en req.headers (establecidos por AuthenticateRequest)
        if (!req.user && req.headers['x-user-id']) {
          proxyReq.setHeader('X-User-ID', req.headers['x-user-id']);
          proxyReq.setHeader('X-User-Role', req.headers['x-user-role'] || 'customer');
        }

        // Reenviar body si existe (para POST/PUT/PATCH)
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }

        // Ejecutar callback personalizado si existe
        if (config.onProxyReq) {
          config.onProxyReq(proxyReq, req);
        }
      },
      onProxyRes: (proxyRes: any, req: any) => {
        // Asegurar headers CORS para credenciales
        const origin = req.headers.origin;
        if (origin) {
          proxyRes.headers['access-control-allow-origin'] = origin;
          proxyRes.headers['access-control-allow-credentials'] = 'true';
          proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
          proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Session-ID';
          proxyRes.headers['access-control-expose-headers'] = 'X-CSRF-Token';
        }

        // Ejecutar callback personalizado si existe
        if (config.onProxyRes) {
          config.onProxyRes(proxyRes, req);
        }
      }
    };

    return createProxyMiddleware(options);
  }
}

export interface ProxyConfig {
  serviceName: string;
  targetUrl: string;
  pathRewrite?: { [key: string]: string };
  timeout?: number;
  proxyTimeout?: number;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  onProxyReq?: (proxyReq: any, req: any) => void;
  onProxyRes?: (proxyRes: any, req: any) => void;
}
