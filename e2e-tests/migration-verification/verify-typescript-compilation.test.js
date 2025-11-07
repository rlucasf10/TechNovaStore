/**
 * Test de verificación: Compilación TypeScript
 * 
 * Verifica que todos los servicios TypeScript compilan sin errores.
 * 
 * Uso: node e2e-tests/migration-verification/verify-typescript-compilation.test.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Servicios TypeScript a verificar
const TYPESCRIPT_SERVICES = [
  'api-gateway',
  'frontend',
  'domains/catalog/product-service',
  'domains/customer/user-service',
  'services/order',
  'services/payment',
  'services/notification',
  'services/ticket',
  'ai-services/chatbot',
  'domains/catalog/recommender-service',
  'domains/catalog/sync-engine',
  'automation/auto-purchase',
  'automation/shipment-tracker'
];

class TypeScriptCompilationVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  /**
   * Ejecuta un comando y retorna el resultado
   */
  execCommand(command, cwd = PROJECT_ROOT) {
    try {
      const output = execSync(command, {
        cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return { success: true, output: output.trim() };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: error.stdout ? error.stdout.trim() : '',
        stderr: error.stderr ? error.stderr.trim() : ''
      };
    }
  }

  /**
   * Verifica si un directorio tiene tsconfig.json
   */
  hasTsConfig(servicePath) {
    const tsconfigPath = path.join(PROJECT_ROOT, servicePath, 'tsconfig.json');
    return fs.existsSync(tsconfigPath);
  }

  /**
   * Verifica si un directorio existe
   */
  serviceExists(servicePath) {
    const fullPath = path.join(PROJECT_ROOT, servicePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Verifica la compilación de un servicio
   */
  verifyServiceCompilation(servicePath) {
    const fullPath = path.join(PROJECT_ROOT, servicePath);
    const serviceName = path.basename(servicePath);

    console.log(`\n🔍 Verificando: ${servicePath}`);

    // Verificar que el servicio existe
    if (!this.serviceExists(servicePath)) {
      console.log(`   ⚠️  Servicio no encontrado (skipped)`);
      this.results.skipped++;
      return true;
    }

    // Verificar que tiene tsconfig.json
    if (!this.hasTsConfig(servicePath)) {
      console.log(`   ⚠️  No tiene tsconfig.json (skipped)`);
      this.results.skipped++;
      return true;
    }

    // Ejecutar compilación TypeScript
    console.log(`   📦 Compilando...`);
    
    const result = this.execCommand('npx tsc --noEmit', fullPath);

    if (result.success) {
      console.log(`   ✅ Compilación exitosa`);
      this.results.passed++;
      return true;
    } else {
      console.log(`   ❌ Errores de compilación`);
      
      // Extraer errores relevantes
      const errors = result.stderr || result.output || result.error;
      const errorLines = errors.split('\n').filter(line => 
        line.includes('error TS') || line.includes('Error:')
      );

      if (errorLines.length > 0) {
        console.log(`   📋 Errores encontrados: ${errorLines.length}`);
        errorLines.slice(0, 3).forEach(line => {
          console.log(`      ${line.trim()}`);
        });
        if (errorLines.length > 3) {
          console.log(`      ... y ${errorLines.length - 3} más`);
        }
      }

      this.results.failed++;
      this.results.errors.push({
        service: servicePath,
        errors: errorLines.slice(0, 5)
      });
      return false;
    }
  }

  /**
   * Verifica compilación del proyecto raíz
   */
  verifyRootCompilation() {
    console.log(`\n🔍 Verificando compilación del proyecto raíz`);

    if (!this.hasTsConfig('.')) {
      console.log(`   ⚠️  No tiene tsconfig.json en raíz (skipped)`);
      this.results.skipped++;
      return true;
    }

    console.log(`   📦 Compilando...`);
    
    const result = this.execCommand('npx tsc --noEmit', PROJECT_ROOT);

    if (result.success) {
      console.log(`   ✅ Compilación exitosa`);
      this.results.passed++;
      return true;
    } else {
      console.log(`   ❌ Errores de compilación`);
      
      const errors = result.stderr || result.output || result.error;
      const errorLines = errors.split('\n').filter(line => 
        line.includes('error TS') || line.includes('Error:')
      );

      if (errorLines.length > 0) {
        console.log(`   📋 Errores encontrados: ${errorLines.length}`);
        errorLines.slice(0, 3).forEach(line => {
          console.log(`      ${line.trim()}`);
        });
      }

      this.results.failed++;
      this.results.errors.push({
        service: 'root',
        errors: errorLines.slice(0, 5)
      });
      return false;
    }
  }

  /**
   * Genera reporte de resultados
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('  REPORTE DE VERIFICACIÓN DE COMPILACIÓN TYPESCRIPT');
    console.log('='.repeat(70) + '\n');

    console.log(`✅ Servicios compilados correctamente: ${this.results.passed}`);
    console.log(`❌ Servicios con errores: ${this.results.failed}`);
    console.log(`⚠️  Servicios omitidos: ${this.results.skipped}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Servicios con errores de compilación:\n');
      this.results.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error.service}`);
        if (error.errors.length > 0) {
          error.errors.forEach(err => {
            console.log(`      - ${err}`);
          });
        }
      });
    }

    console.log('\n' + '='.repeat(70) + '\n');

    return this.results.failed === 0;
  }

  /**
   * Ejecuta todas las verificaciones
   */
  async run() {
    console.log('\n' + '='.repeat(70));
    console.log('  TEST DE VERIFICACIÓN: COMPILACIÓN TYPESCRIPT');
    console.log('='.repeat(70) + '\n');

    console.log(`📂 Proyecto: ${PROJECT_ROOT}`);
    console.log(`📊 Servicios a verificar: ${TYPESCRIPT_SERVICES.length}\n`);

    // Verificar compilación del proyecto raíz
    this.verifyRootCompilation();

    // Verificar cada servicio
    for (const servicePath of TYPESCRIPT_SERVICES) {
      this.verifyServiceCompilation(servicePath);
    }

    // Generar reporte
    const success = this.generateReport();

    return success;
  }
}

// Ejecutar verificación
if (require.main === module) {
  const verifier = new TypeScriptCompilationVerifier();
  
  verifier.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  });
}

module.exports = TypeScriptCompilationVerifier;
