#!/usr/bin/env node

/**
 * Script de verificación de headers de seguridad
 * 
 * Este script verifica que todos los headers de seguridad configurados
 * en next.config.js estén presentes en las respuestas HTTP.
 * 
 * Uso:
 *   node scripts/verify-security-headers.js [URL]
 * 
 * Ejemplo:
 *   node scripts/verify-security-headers.js http://localhost:3020
 */

const http = require('http');
const https = require('https');

// URL a verificar (por defecto localhost:3020)
const targetUrl = process.argv[2] || 'http://localhost:3020';

// Headers de seguridad esperados
const expectedHeaders = {
  'content-security-policy': {
    required: true,
    description: 'Content Security Policy',
    check: (value) => {
      const requiredDirectives = [
        "default-src 'self'",
        "script-src",
        "style-src",
        "img-src",
        "font-src",
        "connect-src",
        "frame-src",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ];
      
      const missing = requiredDirectives.filter(directive => !value.includes(directive));
      
      if (missing.length > 0) {
        return { valid: false, message: `Faltan directivas: ${missing.join(', ')}` };
      }
      
      return { valid: true, message: 'Todas las directivas presentes' };
    }
  },
  'x-frame-options': {
    required: true,
    description: 'X-Frame-Options',
    expectedValue: 'SAMEORIGIN',
    check: (value) => {
      if (value.toUpperCase() === 'SAMEORIGIN') {
        return { valid: true, message: 'Configurado correctamente' };
      }
      return { valid: false, message: `Valor incorrecto: ${value}` };
    }
  },
  'x-content-type-options': {
    required: true,
    description: 'X-Content-Type-Options',
    expectedValue: 'nosniff',
    check: (value) => {
      if (value.toLowerCase() === 'nosniff') {
        return { valid: true, message: 'Configurado correctamente' };
      }
      return { valid: false, message: `Valor incorrecto: ${value}` };
    }
  },
  'x-xss-protection': {
    required: true,
    description: 'X-XSS-Protection',
    expectedValue: '1; mode=block',
    check: (value) => {
      if (value === '1; mode=block') {
        return { valid: true, message: 'Configurado correctamente' };
      }
      return { valid: false, message: `Valor incorrecto: ${value}` };
    }
  },
  'referrer-policy': {
    required: true,
    description: 'Referrer-Policy',
    expectedValue: 'strict-origin-when-cross-origin',
    check: (value) => {
      if (value === 'strict-origin-when-cross-origin') {
        return { valid: true, message: 'Configurado correctamente' };
      }
      return { valid: false, message: `Valor incorrecto: ${value}` };
    }
  },
  'permissions-policy': {
    required: true,
    description: 'Permissions-Policy',
    check: (value) => {
      const requiredPolicies = ['geolocation=()', 'microphone=()', 'camera=()'];
      const missing = requiredPolicies.filter(policy => !value.includes(policy));
      
      if (missing.length > 0) {
        return { valid: false, message: `Faltan políticas: ${missing.join(', ')}` };
      }
      
      return { valid: true, message: 'Todas las políticas presentes' };
    }
  },
  'x-dns-prefetch-control': {
    required: false,
    description: 'X-DNS-Prefetch-Control',
    expectedValue: 'on',
    check: (value) => {
      if (value === 'on') {
        return { valid: true, message: 'Configurado correctamente' };
      }
      return { valid: false, message: `Valor incorrecto: ${value}` };
    }
  }
};

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'HEAD',
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      headers: {
        'User-Agent': 'Security-Headers-Checker/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function verifyHeaders() {
  log('\n=== Verificación de Headers de Seguridad ===\n', 'cyan');
  log(`URL: ${targetUrl}\n`, 'blue');
  
  try {
    const response = await makeRequest(targetUrl);
    
    log(`Status Code: ${response.statusCode}\n`, 'blue');
    
    let allValid = true;
    let requiredMissing = 0;
    
    for (const [headerName, config] of Object.entries(expectedHeaders)) {
      const headerValue = response.headers[headerName];
      
      log(`\n${config.description} (${headerName}):`, 'cyan');
      
      if (!headerValue) {
        if (config.required) {
          log('  ✗ FALTA (REQUERIDO)', 'red');
          allValid = false;
          requiredMissing++;
        } else {
          log('  ⚠ FALTA (OPCIONAL)', 'yellow');
        }
        continue;
      }
      
      log(`  Valor: ${headerValue}`, 'blue');
      
      if (config.check) {
        const result = config.check(headerValue);
        if (result.valid) {
          log(`  ✓ ${result.message}`, 'green');
        } else {
          log(`  ✗ ${result.message}`, 'red');
          allValid = false;
        }
      } else if (config.expectedValue) {
        if (headerValue === config.expectedValue) {
          log('  ✓ Valor correcto', 'green');
        } else {
          log(`  ✗ Valor esperado: ${config.expectedValue}`, 'red');
          allValid = false;
        }
      } else {
        log('  ✓ Presente', 'green');
      }
    }
    
    log('\n=== Resumen ===\n', 'cyan');
    
    if (allValid && requiredMissing === 0) {
      log('✓ Todos los headers de seguridad están configurados correctamente', 'green');
      process.exit(0);
    } else {
      if (requiredMissing > 0) {
        log(`✗ Faltan ${requiredMissing} headers requeridos`, 'red');
      }
      if (!allValid) {
        log('✗ Algunos headers tienen valores incorrectos', 'red');
      }
      log('\nNOTA: En modo desarrollo, Next.js puede no aplicar todos los headers.', 'yellow');
      log('Los headers se aplicarán completamente en producción.', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n✗ Error al verificar headers: ${error.message}`, 'red');
    log('\nAsegúrate de que el servidor esté ejecutándose en la URL especificada.', 'yellow');
    process.exit(1);
  }
}

// Ejecutar verificación
verifyHeaders();
