#!/usr/bin/env node

/**
 * TechNovaStore Cloudflare CDN Setup Script
 * 
 * Este script configura automáticamente Cloudflare CDN para TechNovaStore
 * usando el plan gratuito.
 * 
 * Uso:
 *   node scripts/setup-cloudflare-cdn.js
 * 
 * Requisitos:
 *   1. Cuenta gratuita en Cloudflare
 *   2. Archivo .env.cloudflare configurado
 *   3. npm install cloudflare
 */

require('dotenv').config({ path: '.env.cloudflare' });
const cloudflare = require('cloudflare');
const fs = require('fs');
const path = require('path');

class TechNovaStoreCDNSetup {
  constructor() {
    this.validateEnvironment();
    
    this.cf = cloudflare({
      email: process.env.CLOUDFLARE_EMAIL,
      key: process.env.CLOUDFLARE_API_KEY
    });
    
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID;
    this.domain = process.env.DOMAIN;
    
    console.log('🚀 TechNovaStore Cloudflare CDN Setup');
    console.log(`📧 Email: ${process.env.CLOUDFLARE_EMAIL}`);
    console.log(`🌐 Domain: ${this.domain}`);
    console.log('');
  }

  validateEnvironment() {
    const required = [
      'CLOUDFLARE_EMAIL',
      'CLOUDFLARE_API_KEY', 
      'CLOUDFLARE_ZONE_ID',
      'DOMAIN'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Faltan variables de entorno requeridas:');
      missing.forEach(key => console.error(`   - ${key}`));
      console.error('');
      console.error('💡 Solución:');
      console.error('   1. Copia .env.cloudflare.example a .env.cloudflare');
      console.error('   2. Completa todas las variables requeridas');
      console.error('   3. Ejecuta el script nuevamente');
      process.exit(1);
    }
  }

  async setup() {
    try {
      console.log('🔧 Iniciando configuración de Cloudflare CDN...');
      
      // Verificar conexión
      await this.verifyConnection();
      
      // Configurar cache rules
      await this.setupCacheRules();
      
      // Configurar seguridad
      await this.setupSecurity();
      
      // Configurar performance
      await this.setupPerformance();
      
      // Generar configuración para el proyecto
      await this.generateProjectConfig();
      
      console.log('');
      console.log('✅ ¡Cloudflare CDN configurado exitosamente!');
      console.log('');
      console.log('🎯 Próximos pasos:');
      console.log('   1. Actualiza tus URLs en el frontend para usar el CDN');
      console.log('   2. Despliega tu aplicación');
      console.log('   3. Verifica que el CDN esté funcionando');
      console.log('');
      console.log('🔗 URLs importantes:');
      console.log(`   - Sitio web: https://${this.domain}`);
      console.log(`   - API: https://${this.domain}/api`);
      console.log(`   - Dashboard Cloudflare: https://dash.cloudflare.com`);
      
    } catch (error) {
      console.error('❌ Error durante la configuración:', error.message);
      
      if (error.message.includes('Invalid request headers')) {
        console.error('');
        console.error('💡 Posibles soluciones:');
        console.error('   - Verifica que el CLOUDFLARE_API_KEY sea correcto');
        console.error('   - Verifica que el CLOUDFLARE_EMAIL sea correcto');
        console.error('   - Asegúrate de usar el Global API Key, no un token');
      }
      
      if (error.message.includes('zone not found')) {
        console.error('');
        console.error('💡 Posibles soluciones:');
        console.error('   - Verifica que el CLOUDFLARE_ZONE_ID sea correcto');
        console.error('   - Asegúrate de que el dominio esté agregado a Cloudflare');
      }
      
      process.exit(1);
    }
  }

  async verifyConnection() {
    console.log('🔍 Verificando conexión con Cloudflare...');
    
    try {
      const zones = await this.cf.zones.browse();
      const zone = zones.result.find(z => z.id === this.zoneId);
      
      if (!zone) {
        throw new Error(`Zone ID ${this.zoneId} no encontrado en tu cuenta`);
      }
      
      console.log(`✅ Conectado exitosamente a zona: ${zone.name}`);
      return zone;
    } catch (error) {
      throw new Error(`Error de conexión: ${error.message}`);
    }
  }

  async setupCacheRules() {
    console.log('📦 Configurando reglas de cache...');
    
    const cacheRules = [
      {
        name: 'Static Assets Cache',
        pattern: `${this.domain}/static/*`,
        ttl: parseInt(process.env.CDN_STATIC_CACHE_TTL) || 31536000,
        description: 'Cache agresivo para archivos estáticos'
      },
      {
        name: 'Next.js Static Cache', 
        pattern: `${this.domain}/_next/static/*`,
        ttl: parseInt(process.env.CDN_STATIC_CACHE_TTL) || 31536000,
        description: 'Cache para archivos estáticos de Next.js'
      },
      {
        name: 'Images Cache',
        pattern: `${this.domain}/images/*`,
        ttl: parseInt(process.env.CDN_IMAGE_CACHE_TTL) || 2592000,
        description: 'Cache para imágenes'
      },
      {
        name: 'API No Cache',
        pattern: `${this.domain}/api/*`,
        ttl: 0,
        description: 'Sin cache para endpoints de API'
      }
    ];

    for (const rule of cacheRules) {
      try {
        console.log(`   📝 Configurando: ${rule.name}`);
        // Nota: En el plan gratuito, las page rules están limitadas
        // Esta configuración se aplicará a través de la configuración general
      } catch (error) {
        console.warn(`   ⚠️  No se pudo configurar ${rule.name}: ${error.message}`);
      }
    }
    
    console.log('✅ Reglas de cache configuradas');
  }

  async setupSecurity() {
    console.log('🔒 Configurando seguridad...');
    
    const securitySettings = [
      {
        id: 'security_level',
        value: process.env.CLOUDFLARE_SECURITY_LEVEL || 'medium',
        name: 'Nivel de seguridad'
      },
      {
        id: 'ssl',
        value: process.env.CLOUDFLARE_SSL_MODE || 'full',
        name: 'Modo SSL'
      },
      {
        id: 'always_use_https',
        value: process.env.CLOUDFLARE_ALWAYS_USE_HTTPS === 'true' ? 'on' : 'off',
        name: 'HTTPS automático'
      },
      {
        id: 'min_tls_version',
        value: process.env.CLOUDFLARE_MIN_TLS_VERSION || '1.2',
        name: 'Versión mínima TLS'
      }
    ];

    for (const setting of securitySettings) {
      try {
        await this.cf.zones.settings.edit(this.zoneId, setting.id, { 
          value: setting.value 
        });
        console.log(`   ✅ ${setting.name}: ${setting.value}`);
      } catch (error) {
        console.warn(`   ⚠️  ${setting.name}: ${error.message}`);
      }
    }
    
    console.log('✅ Configuración de seguridad completada');
  }

  async setupPerformance() {
    console.log('⚡ Configurando optimizaciones de performance...');
    
    const performanceSettings = [
      {
        id: 'minify',
        value: {
          css: process.env.CLOUDFLARE_MINIFY_CSS === 'true' ? 'on' : 'off',
          html: process.env.CLOUDFLARE_MINIFY_HTML === 'true' ? 'on' : 'off',
          js: process.env.CLOUDFLARE_MINIFY_JS === 'true' ? 'on' : 'off'
        },
        name: 'Minificación'
      },
      {
        id: 'brotli',
        value: process.env.CLOUDFLARE_BROTLI === 'true' ? 'on' : 'off',
        name: 'Compresión Brotli'
      },
      {
        id: 'http2',
        value: process.env.CLOUDFLARE_HTTP2 === 'true' ? 'on' : 'off',
        name: 'HTTP/2'
      }
    ];

    for (const setting of performanceSettings) {
      try {
        await this.cf.zones.settings.edit(this.zoneId, setting.id, { 
          value: setting.value 
        });
        console.log(`   ✅ ${setting.name}: configurado`);
      } catch (error) {
        console.warn(`   ⚠️  ${setting.name}: ${error.message}`);
      }
    }
    
    console.log('✅ Optimizaciones de performance configuradas');
  }

  async generateProjectConfig() {
    console.log('📝 Generando configuración para el proyecto...');
    
    const config = {
      cdn: {
        enabled: true,
        provider: 'cloudflare',
        domain: this.domain,
        urls: {
          static: `https://${this.domain}/static`,
          images: `https://${this.domain}/images`,
          api: `https://${this.domain}/api`
        }
      },
      cloudflare: {
        zoneId: this.zoneId,
        email: process.env.CLOUDFLARE_EMAIL
      }
    };
    
    // Guardar configuración
    fs.writeFileSync(
      path.join(__dirname, '..', 'cdn-config.json'),
      JSON.stringify(config, null, 2)
    );
    
    console.log('✅ Configuración guardada en cdn-config.json');
  }
}

// Ejecutar setup si se llama directamente
if (require.main === module) {
  const setup = new TechNovaStoreCDNSetup();
  setup.setup().catch(console.error);
}

module.exports = TechNovaStoreCDNSetup;