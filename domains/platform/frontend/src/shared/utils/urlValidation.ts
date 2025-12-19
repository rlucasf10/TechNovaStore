/**
 * Utilidades para validación segura de URLs y redirecciones
 * 
 * Este módulo proporciona funciones para prevenir ataques de Open Redirect
 * validando que las URLs de redirección sean internas al dominio actual.
 */

/**
 * Valida que una URL es interna al dominio actual
 * 
 * Esta función previene ataques de Open Redirect verificando que la URL
 * de destino pertenece al mismo dominio que la aplicación.
 * 
 * @param url - URL a validar (puede ser relativa o absoluta)
 * @returns true si la URL es interna, false si es externa o inválida
 * 
 * @example
 * // URLs relativas son siempre válidas
 * isValidInternalUrl('/productos'); // true
 * isValidInternalUrl('/dashboard/perfil'); // true
 * 
 * @example
 * // URLs absolutas del mismo dominio son válidas
 * isValidInternalUrl('http://localhost:3020/productos'); // true (en desarrollo)
 * isValidInternalUrl('https://technovastore.com/productos'); // true (en producción)
 * 
 * @example
 * // URLs externas son bloqueadas
 * isValidInternalUrl('https://malicious-site.com/phishing'); // false
 * isValidInternalUrl('http://evil.com'); // false
 * 
 * @example
 * // URLs malformadas son bloqueadas
 * isValidInternalUrl('javascript:alert(1)'); // false
 * isValidInternalUrl('data:text/html,<script>alert(1)</script>'); // false
 */
export function isValidInternalUrl(url: string): boolean {
  try {
    // URLs relativas son siempre válidas
    if (url.startsWith('/')) {
      return true;
    }
    
    // Bloquear esquemas peligrosos
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase();
    if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) {
      console.warn('[Security] Blocked dangerous URL scheme:', url);
      return false;
    }
    
    // Parsear URL absoluta
    const parsed = new URL(url, window.location.origin);
    
    // Verificar que el origin coincide
    const isValid = parsed.origin === window.location.origin;
    
    if (!isValid) {
      console.warn('[Security] Blocked external URL:', url, 'Expected origin:', window.location.origin);
    }
    
    return isValid;
  } catch (error) {
    // Si no se puede parsear, es inválida
    console.warn('[Security] Invalid URL format:', url, error);
    return false;
  }
}

/**
 * Redirige de forma segura a una URL validada
 * 
 * Esta función valida la URL antes de redirigir, previniendo ataques
 * de Open Redirect. Si la URL no es válida, redirige a una URL de fallback.
 * 
 * @param url - URL de destino
 * @param fallback - URL de fallback si la validación falla (default: '/')
 * 
 * @example
 * // Redirección segura a URL interna
 * safeRedirect('/productos'); // Redirige a /productos
 * 
 * @example
 * // Redirección bloqueada con fallback
 * safeRedirect('https://evil.com', '/dashboard'); // Redirige a /dashboard
 * 
 * @example
 * // Redirección desde notificación
 * const notification = { action_url: '/pedidos/123' };
 * safeRedirect(notification.action_url); // Redirige a /pedidos/123
 * 
 * @example
 * // Redirección con fallback personalizado
 * safeRedirect(userProvidedUrl, '/home'); // Si falla, va a /home
 */
export function safeRedirect(url: string, fallback: string = '/'): void {
  if (isValidInternalUrl(url)) {
    window.location.href = url;
  } else {
    console.warn('[Security] Blocked redirect to external URL:', url, '- Redirecting to fallback:', fallback);
    window.location.href = fallback;
  }
}
