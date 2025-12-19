#!/usr/bin/env node

/**
 * Script para generar secretos criptográficamente seguros
 * 
 * Uso:
 *   node scripts/generate-secrets.js
 * 
 * Este script genera:
 * - JWT_SECRET (512 bits)
 * - JWT_REFRESH_SECRET (512 bits)
 * - SESSION_SECRET (512 bits)
 * - Contraseñas de base de datos (256 bits)
 * - CSRF_SECRET (256 bits)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generatePassword(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

log('\n🔐 Generador de Secretos Seguros - TechNovaStore\n', 'bright');
log('═══════════════════════════════════════════════════════\n', 'cyan');

// Generar secretos
const secrets = {
  JWT_SECRET: generateSecret(64),           // 512 bits
  JWT_REFRESH_SECRET: generateSecret(64),   // 512 bits
  SESSION_SECRET: generateSecret(64),       // 512 bits
  CSRF_SECRET: generateSecret(32),          // 256 bits
  ENCRYPTION_KEY: generateSecret(32),       // 256 bits
  MONGO_PASSWORD: generatePassword(32),
  POSTGRES_PASSWORD: generatePassword(32),
  REDIS_PASSWORD: generatePassword(32),
};

log('✅ Secretos generados exitosamente:\n', 'green');

// Mostrar secretos
Object.entries(secrets).forEach(([key, value]) => {
  log(`${key}:`, 'yellow');
  log(`  ${value}\n`, 'cyan');
});

log('═══════════════════════════════════════════════════════\n', 'cyan');

// Crear archivo .env.secrets (NO commitear)
const envSecretsPath = path.join(__dirname, '..', '.env.secrets');
const envContent = Object.entries(secrets)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(envSecretsPath, envContent + '\n');

log('📝 Archivo .env.secrets creado', 'green');
log(`   Ubicación: ${envSecretsPath}\n`, 'blue');

log('⚠️  IMPORTANTE:', 'yellow');
log('   1. NO commitear .env.secrets al repositorio', 'red');
log('   2. Copiar estos valores a tu archivo .env local', 'yellow');
log('   3. En producción, usar variables de entorno del servidor', 'yellow');
log('   4. Guardar estos secretos en un gestor de contraseñas', 'yellow');
log('   5. Rotar los secretos cada 90 días\n', 'yellow');

// Crear archivo .env.prod.example actualizado
const envProdExamplePath = path.join(__dirname, '..', '.env.prod.example');
const envProdExample = `# TechNovaStore Production Environment
# ⚠️ IMPORTANTE: Reemplazar TODOS los valores con secretos reales

# Database Configuration
MONGO_USERNAME=admin
MONGO_PASSWORD=<GENERAR_CON_generate-secrets.js>
POSTGRES_USERNAME=admin
POSTGRES_PASSWORD=<GENERAR_CON_generate-secrets.js>
REDIS_PASSWORD=<GENERAR_CON_generate-secrets.js>

# JWT Configuration (CRÍTICO - Usar secretos fuertes)
JWT_SECRET=<GENERAR_CON_generate-secrets.js>
JWT_REFRESH_SECRET=<GENERAR_CON_generate-secrets.js>
SESSION_SECRET=<GENERAR_CON_generate-secrets.js>

# Security
CSRF_SECRET=<GENERAR_CON_generate-secrets.js>
ENCRYPTION_KEY=<GENERAR_CON_generate-secrets.js>

# API URLs (Actualizar con tu dominio)
NEXT_PUBLIC_API_URL=https://api.technovastore.com/api
NEXT_PUBLIC_APP_URL=https://technovastore.com
NEXT_PUBLIC_CHATBOT_URL=https://api.technovastore.com/chatbot
NEXT_PUBLIC_SOCKET_URL=https://api.technovastore.com
FRONTEND_URL=https://technovastore.com

# OAuth Configuration (Generar nuevas credenciales)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<TU_GOOGLE_CLIENT_SECRET>
GITHUB_CLIENT_ID=<TU_GITHUB_CLIENT_ID>
GITHUB_CLIENT_SECRET=<TU_GITHUB_CLIENT_SECRET>

# Analytics Configuration
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=<TU_GA_ID>
NEXT_PUBLIC_SENTRY_DSN=<TU_SENTRY_DSN>

# Service URLs (internal)
CHATBOT_SERVICE_URL=http://chatbot:3001
TICKET_SERVICE_URL=http://ticket-service:3005
USER_SERVICE_URL=http://user-service:3002
PRODUCT_SERVICE_URL=http://product-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
ORDER_SERVICE_URL=http://order-service:3006
CAMPAIGN_MANAGER_SERVICE_URL=http://campaign-manager-service:3011

# Security Configuration
CSRF_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
HTTPS_ENABLED=true
HTTPS_PORT=443

# Cookie Configuration (HttpOnly Cookies)
COOKIE_DOMAIN=.technovastore.com

# Logging
LOG_LEVEL=info
NODE_ENV=production

# Google Gemini AI Configuration
GEMINI_API_KEY=<TU_GEMINI_API_KEY>

# SMTP Configuration (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<TU_EMAIL>
SMTP_PASS=<TU_APP_PASSWORD>

# External APIs
AMAZON_API_KEY=<TU_AMAZON_API_KEY>
ALIEXPRESS_API_KEY=<TU_ALIEXPRESS_API_KEY>
EBAY_API_KEY=<TU_EBAY_API_KEY>

# Elasticsearch Configuration
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_NODE=http://elasticsearch:9200

# Grafana Configuration
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=<GENERAR_PASSWORD_FUERTE>
GF_USERS_ALLOW_SIGN_UP=false

# Database URL
DATABASE_URL=postgresql://admin:<PASSWORD>@postgresql:5432/technovastore_campaigns
`;

fs.writeFileSync(envProdExamplePath, envProdExample);

log('📝 Archivo .env.prod.example actualizado', 'green');
log(`   Ubicación: ${envProdExamplePath}\n`, 'blue');

log('═══════════════════════════════════════════════════════\n', 'cyan');
log('✅ Proceso completado exitosamente\n', 'green');

// Verificar que .env.secrets esté en .gitignore
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('.env.secrets')) {
    fs.appendFileSync(gitignorePath, '\n# Secretos generados (NO commitear)\n.env.secrets\n');
    log('✅ .env.secrets añadido a .gitignore\n', 'green');
  }
}

log('🎯 Próximos pasos:', 'bright');
log('   1. Revisar los secretos generados', 'cyan');
log('   2. Copiar a tu archivo .env local para desarrollo', 'cyan');
log('   3. Configurar en el servidor de producción', 'cyan');
log('   4. Revocar credenciales OAuth antiguas', 'cyan');
log('   5. Generar nuevas credenciales OAuth', 'cyan');
log('   6. Actualizar contraseñas de bases de datos', 'cyan');
log('   7. Reiniciar todos los servicios\n', 'cyan');
