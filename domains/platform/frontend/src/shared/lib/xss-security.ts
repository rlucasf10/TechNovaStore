/**
 * Utilidades de Seguridad XSS
 * 
 * Este módulo proporciona funciones para prevenir ataques XSS (Cross-Site Scripting)
 * en el frontend de TechNovaStore.
 * 
 * Requisitos: 20.1 - Seguridad de autenticación y protección de datos
 * 
 * IMPORTANTE: 
 * - NUNCA usar dangerouslySetInnerHTML con contenido de usuario sin sanitizar
 * - Siempre usar estas utilidades cuando se necesite renderizar HTML dinámico
 * - Preferir texto plano sobre HTML cuando sea posible
 */

import DOMPurify, { Config } from 'isomorphic-dompurify';

/**
 * Configuración por defecto de DOMPurify
 * Permite solo tags y atributos seguros para contenido de usuario
 */
const DEFAULT_PURIFY_CONFIG: Config = {
  // Tags HTML permitidos (solo formato básico)
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 
    'ul', 'ol', 'li', 
    'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre'
  ],
  // Atributos permitidos
  ALLOWED_ATTR: ['class', 'id', 'style'],
  // No permitir URLs en atributos de estilo (previene CSS injection)
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  // No permitir tags de script
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  // Eliminar contenido de tags prohibidos en lugar de solo el tag
  KEEP_CONTENT: false,
};

/**
 * Configuración estricta - solo texto, sin HTML
 */
const STRICT_PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

/**
 * Configuración para markdown renderizado (chat, descripciones)
 */
const MARKDOWN_PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i',
    'ul', 'ol', 'li',
    'span', 'code', 'pre',
    'a', 'blockquote'
  ],
  ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
  // Forzar target="_blank" y rel="noopener noreferrer" en links
  ADD_ATTR: ['target', 'rel'],
};

/**
 * Sanitiza HTML usando DOMPurify con configuración por defecto
 * Usar para contenido de usuario que puede contener HTML básico
 * 
 * @param dirty - HTML potencialmente peligroso
 * @returns HTML sanitizado seguro para renderizar
 * 
 * @example
 * const safeHtml = sanitizeHtml(userInput);
 * <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, DEFAULT_PURIFY_CONFIG);
};

/**
 * Sanitiza HTML de forma estricta - elimina TODO el HTML
 * Usar para inputs de texto plano donde no se espera HTML
 * 
 * @param dirty - Texto potencialmente con HTML
 * @returns Texto plano sin HTML
 * 
 * @example
 * const plainText = sanitizeStrict(userInput);
 */
export const sanitizeStrict = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, STRICT_PURIFY_CONFIG);
};

/**
 * Sanitiza HTML para contenido markdown renderizado
 * Permite tags de formato pero previene XSS
 * 
 * @param dirty - HTML generado desde markdown
 * @returns HTML sanitizado seguro
 * 
 * @example
 * const safeMarkdown = sanitizeMarkdown(renderedMarkdown);
 */
export const sanitizeMarkdown = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  // Sanitizar el HTML
  let clean = DOMPurify.sanitize(dirty, MARKDOWN_PURIFY_CONFIG);
  
  // Asegurar que los links externos tengan atributos de seguridad
  clean = clean.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );
  
  return clean;
};

/**
 * Escapa caracteres HTML especiales
 * Usar cuando se necesita mostrar texto que podría contener HTML
 * pero se quiere mostrar como texto literal
 * 
 * @param text - Texto a escapar
 * @returns Texto con caracteres HTML escapados
 * 
 * @example
 * const escaped = escapeHtml('<script>alert("xss")</script>');
 * // Resultado: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return text.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char] || char);
};

/**
 * Sanitiza una URL para prevenir javascript: y data: URLs maliciosas
 * 
 * @param url - URL a validar
 * @returns URL segura o cadena vacía si es peligrosa
 * 
 * @example
 * const safeUrl = sanitizeUrl(userProvidedUrl);
 * <a href={safeUrl}>Link</a>
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Bloquear protocolos peligrosos
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ];
  
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      console.warn(`[XSS Security] URL bloqueada por protocolo peligroso: ${protocol}`);
      return '';
    }
  }
  
  // Permitir URLs relativas, http, https, mailto, tel
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', '//', '/'];
  const hasAllowedProtocol = allowedProtocols.some(
    (protocol) => trimmedUrl.startsWith(protocol) || !trimmedUrl.includes(':')
  );
  
  if (!hasAllowedProtocol) {
    console.warn(`[XSS Security] URL bloqueada por protocolo no permitido: ${url}`);
    return '';
  }
  
  return url;
};

/**
 * Sanitiza un objeto de datos de usuario
 * Aplica sanitización estricta a todos los valores string
 * 
 * @param data - Objeto con datos de usuario
 * @returns Objeto con valores sanitizados
 * 
 * @example
 * const safeData = sanitizeObject(formData);
 */
export const sanitizeObject = <T extends Record<string, unknown>>(data: T): T => {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeStrict(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeStrict(item) : item
      );
    }
  }
  
  return sanitized;
};

/**
 * Valida y sanitiza input de formulario
 * Combina validación de longitud con sanitización
 * 
 * @param value - Valor del input
 * @param maxLength - Longitud máxima permitida (default: 1000)
 * @returns Valor sanitizado y truncado si es necesario
 */
export const sanitizeFormInput = (value: string, maxLength: number = 1000): string => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Primero sanitizar
  let sanitized = sanitizeStrict(value);
  
  // Luego truncar si es necesario
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
};

/**
 * Verifica si un string contiene posibles intentos de XSS
 * Útil para logging y monitoreo de seguridad
 * 
 * @param value - Valor a verificar
 * @returns true si se detectan patrones sospechosos
 */
export const detectXssAttempt = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onerror=, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /expression\s*\(/gi, // CSS expression
    /url\s*\(\s*["']?\s*javascript:/gi,
  ];
  
  return xssPatterns.some((pattern) => pattern.test(value));
};

/**
 * Crea un sanitizador personalizado con configuración específica
 * 
 * @param config - Configuración de DOMPurify
 * @returns Función sanitizadora
 */
export const createSanitizer = (config: Config) => {
  return (dirty: string): string => {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }
    return DOMPurify.sanitize(dirty, config);
  };
};

// Exportar configuraciones para uso avanzado
export const PURIFY_CONFIGS = {
  DEFAULT: DEFAULT_PURIFY_CONFIG,
  STRICT: STRICT_PURIFY_CONFIG,
  MARKDOWN: MARKDOWN_PURIFY_CONFIG,
};
