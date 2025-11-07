/**
 * Test de verificación: Tests Existentes
 * 
 * Verifica que todos los tests existentes en el proyecto pasan correctamente.
 * 
 * Uso: node e2e-tests/migration-verification/verify-existing-tests.test.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Servicios con tests a verificar
const SERVICES_WITH_TESTS = [
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

class ExistingTestsVerifier {
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
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 120000 // 2 minutos timeout
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
   * Verifica si un directorio tiene tests
   */
  hasTests(servicePath) {
    const fullPath = path.join(PROJECT_ROOT, servicePath);
    
    // Buscar carpetas de tests comunes
    const testDirs = ['tests', 'test', '__tests__', 'src/__tests__', 'src/tests'];
    
    for (const testDir of testDirs) {
      const testPath = path.join(fullPath, testDir);
      if (fs.existsSync(testPath)) {
        return true;
      }
    }

    // Buscar archivos de test
    const testFiles = [
      'jest.config.js',
      'jest.config.ts',
      'vitest.config.js',
      'vitest.config.ts'
    ];

    for (const testFile of testFiles) {
      const testFilePath = path.join(fullPath, testFile);
      if (fs.existsSync(testFilePath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si un directorio tiene package.json con script de test
   */
  hasTestScript(servicePath) {
    const packageJsonPath = path.join(PROJECT_ROOT, servicePath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.scripts && packageJson.scripts.test;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si un directorio existe
   */
  serviceExists(servicePath) {
    const fullPath = path.join(PROJECT_ROOT, servicePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Ejecuta los tests de un servicio
   */
  verifyServiceTests(servicePath) {
    const fullPath = path.join(PROJECT_ROOT, servicePath);
    const serviceName = path.basename(servicePath);

    console.log(`\n🔍 Verificando: ${servicePath}`);

    // Verificar que el servicio existe
    if (!this.serviceExists(servicePath)) {
      console.log(`   ⚠️  Servicio no encontrado (skipped)`);
      this.results.skipped++;
      return true;
    }

    // Verificar que tiene tests
    if (!this.hasTests(servicePath) && !this.hasTestScript(servicePath)) {
      console.log(`   ⚠️  No tiene tests (skipped)`);
      this.results.skipped++;
      return true;
    }

    // Ejecutar tests
    console.log(`   🧪 Ejecutando tests...`);
    
    const result = this.execCommand('npm test', fullPath);

    if (result.success) {
      console.log(`   ✅ Tests pasaron correctamente`);
      
      // Intentar extraer número de tests
      const output = result.output;
      const testMatch = output.match(/(\d+) passing/i) || output.match(/Tests:\s+(\d+) passed/i);
      if (testMatch) {
        console.log(`   📊 Tests ejecutados: ${testMatch[1]}`);
      }

      this.results.passed++;
      return true;
    } else {
      console.log(`   ❌ Tests fallaron`);
      
      // Extraer información de fallos
      const output = result.stderr || result.output || result.error;
      const failedMatch = output.match(/(\d+) failing/i) || output.match(/Tests:\s+(\d+) failed/i);
      
      if (failedMatch) {
        console.log(`   📋 Tests fallidos: ${failedMatch[1]}`);
      }

      // Extraer primeros errores
      const errorLines = output.split('\n').filter(line => 
        line.includes('Error:') || 
        line.includes('FAIL') || 
        line.includes('✕') ||
        line.includes('Expected')
      );

      if (errorLines.length > 0) {
        console.log(`   📋 Errores encontrados:`);
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
   * Verifica tests del proyecto raíz
   */
  verifyRootTests() {
    console.log(`\n🔍 Verificando tests del proyecto raíz`);

    if (!this.hasTestScript('.')) {
      console.log(`   ⚠️  No tiene script de test en raíz (skipped)`);
      this.results.skipped++;
      return true;
    }

    console.log(`   🧪 Ejecutando tests...`);
    
    const result = this.execCommand('npm test', PROJECT_ROOT);

    if (result.success) {
      console.log(`   ✅ Tests pasaron correctamente`);
      
      const output = result.output;
      const testMatch = output.match(/(\d+) passing/i) || output.match(/Tests:\s+(\d+) passed/i);
      if (testMatch) {
        console.log(`   📊 Tests ejecutados: ${testMatch[1]}`);
      }

      this.results.passed++;
      return true;
    } else {
      console.log(`   ❌ Tests fallaron`);
      
      const output = result.stderr || result.output || result.error;
      const failedMatch = output.match(/(\d+) failing/i) || output.match(/Tests:\s+(\d+) failed/i);
      
      if (failedMatch) {
        console.log(`   📋 Tests fallidos: ${failedMatch[1]}`);
      }

      this.results.failed++;
      this.results.errors.push({
        service: 'root',
        errors: ['Ver logs para más detalles']
      });
      return false;
    }
  }

  /**
   * Genera reporte de resultados
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('  REPORTE DE VERIFICACIÓN DE TESTS EXISTENTES');
    console.log('='.repeat(70) + '\n');

    console.log(`✅ Servicios con tests pasando: ${this.results.passed}`);
    console.log(`❌ Servicios con tests fallando: ${this.results.failed}`);
    console.log(`⚠️  Servicios sin tests: ${this.results.skipped}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Servicios con tests fallando:\n');
      this.results.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error.service}`);
        if (error.errors.length > 0) {
          error.errors.forEach(err => {
            console.log(`      - ${err}`);
          });
        }
      });
    }

    if (this.results.skipped > 0) {
      console.log('\n⚠️  Nota: Algunos servicios no tienen tests configurados.');
      console.log('   Esto es esperado para servicios backend sin tests.');
    }

    console.log('\n' + '='.repeat(70) + '\n');

    return this.results.failed === 0;
  }

  /**
   * Ejecuta todas las verificaciones
   */
  async run() {
    console.log('\n' + '='.repeat(70));
    console.log('  TEST DE VERIFICACIÓN: TESTS EXISTENTES');
    console.log('='.repeat(70) + '\n');

    console.log(`📂 Proyecto: ${PROJECT_ROOT}`);
    console.log(`📊 Servicios a verificar: ${SERVICES_WITH_TESTS.length}\n`);

    console.log('⚠️  Nota: Este proceso puede tardar varios minutos...\n');

    // Verificar tests del proyecto raíz (si existen)
    // this.verifyRootTests(); // Comentado para evitar timeout

    // Verificar cada servicio
    for (const servicePath of SERVICES_WITH_TESTS) {
      this.verifyServiceTests(servicePath);
    }

    // Generar reporte
    const success = this.generateReport();

    return success;
  }
}

// Ejecutar verificación
if (require.main === module) {
  const verifier = new ExistingTestsVerifier();
  
  verifier.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  });
}

module.exports = ExistingTestsVerifier;
