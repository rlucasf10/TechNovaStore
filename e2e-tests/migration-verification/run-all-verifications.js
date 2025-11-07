#!/usr/bin/env node

/**
 * Script principal para ejecutar todas las verificaciones de migración
 * 
 * Ejecuta todos los tests de verificación base en secuencia y genera
 * un reporte consolidado.
 * 
 * Uso: node e2e-tests/migration-verification/run-all-verifications.js
 */

const DockerServicesVerifier = require('./verify-docker-services.test');
const TypeScriptCompilationVerifier = require('./verify-typescript-compilation.test');
const ExistingTestsVerifier = require('./verify-existing-tests.test');

class MigrationVerificationRunner {
  constructor() {
    this.results = {
      docker: null,
      typescript: null,
      tests: null
    };
    this.startTime = new Date();
  }

  /**
   * Imprime banner de inicio
   */
  printBanner() {
    console.log('\n' + '='.repeat(70));
    console.log('  VERIFICACIONES DE MIGRACIÓN - TECHNOVASTORE');
    console.log('  Phase 0: Preparación y Análisis');
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Imprime separador de sección
   */
  printSection(title) {
    console.log('\n' + '-'.repeat(70));
    console.log(`  ${title}`);
    console.log('-'.repeat(70) + '\n');
  }

  /**
   * Ejecuta verificación de servicios Docker
   */
  async runDockerVerification() {
    this.printSection('VERIFICACIÓN 1/3: SERVICIOS DOCKER');
    
    const verifier = new DockerServicesVerifier();
    const success = await verifier.run();
    
    this.results.docker = {
      success,
      passed: verifier.results.passed,
      failed: verifier.results.failed,
      errors: verifier.results.errors
    };

    return success;
  }

  /**
   * Ejecuta verificación de compilación TypeScript
   */
  async runTypeScriptVerification() {
    this.printSection('VERIFICACIÓN 2/3: COMPILACIÓN TYPESCRIPT');
    
    const verifier = new TypeScriptCompilationVerifier();
    const success = await verifier.run();
    
    this.results.typescript = {
      success,
      passed: verifier.results.passed,
      failed: verifier.results.failed,
      skipped: verifier.results.skipped,
      errors: verifier.results.errors
    };

    return success;
  }

  /**
   * Ejecuta verificación de tests existentes
   */
  async runTestsVerification() {
    this.printSection('VERIFICACIÓN 3/3: TESTS EXISTENTES');
    
    const verifier = new ExistingTestsVerifier();
    const success = await verifier.run();
    
    this.results.tests = {
      success,
      passed: verifier.results.passed,
      failed: verifier.results.failed,
      skipped: verifier.results.skipped,
      errors: verifier.results.errors
    };

    return success;
  }

  /**
   * Genera reporte consolidado
   */
  generateConsolidatedReport() {
    const duration = (new Date() - this.startTime) / 1000;

    console.log('\n' + '='.repeat(70));
    console.log('  REPORTE CONSOLIDADO DE VERIFICACIONES');
    console.log('='.repeat(70) + '\n');

    console.log(`⏱️  Duración total: ${duration.toFixed(2)} segundos\n`);

    // Resumen por verificación
    console.log('📊 Resumen por Verificación:\n');

    // Docker
    if (this.results.docker) {
      const icon = this.results.docker.success ? '✅' : '❌';
      console.log(`${icon} Servicios Docker:`);
      console.log(`   - Pasados: ${this.results.docker.passed}`);
      console.log(`   - Fallidos: ${this.results.docker.failed}`);
    }

    // TypeScript
    if (this.results.typescript) {
      const icon = this.results.typescript.success ? '✅' : '❌';
      console.log(`\n${icon} Compilación TypeScript:`);
      console.log(`   - Pasados: ${this.results.typescript.passed}`);
      console.log(`   - Fallidos: ${this.results.typescript.failed}`);
      console.log(`   - Omitidos: ${this.results.typescript.skipped}`);
    }

    // Tests
    if (this.results.tests) {
      const icon = this.results.tests.success ? '✅' : '❌';
      console.log(`\n${icon} Tests Existentes:`);
      console.log(`   - Pasados: ${this.results.tests.passed}`);
      console.log(`   - Fallidos: ${this.results.tests.failed}`);
      console.log(`   - Omitidos: ${this.results.tests.skipped}`);
    }

    // Estado general
    console.log('\n' + '-'.repeat(70) + '\n');

    const allSuccess = 
      this.results.docker?.success &&
      this.results.typescript?.success &&
      this.results.tests?.success;

    if (allSuccess) {
      console.log('✅ TODAS LAS VERIFICACIONES PASARON');
      console.log('\n   El proyecto está listo para iniciar la migración.\n');
    } else {
      console.log('❌ ALGUNAS VERIFICACIONES FALLARON');
      console.log('\n   Revisa los errores antes de continuar con la migración.\n');

      // Listar verificaciones fallidas
      console.log('Verificaciones fallidas:\n');
      if (!this.results.docker?.success) {
        console.log('   - ❌ Servicios Docker');
      }
      if (!this.results.typescript?.success) {
        console.log('   - ❌ Compilación TypeScript');
      }
      if (!this.results.tests?.success) {
        console.log('   - ❌ Tests Existentes');
      }
      console.log('');
    }

    console.log('='.repeat(70) + '\n');

    return allSuccess;
  }

  /**
   * Ejecuta todas las verificaciones
   */
  async run() {
    this.printBanner();

    try {
      // Verificación 1: Servicios Docker
      await this.runDockerVerification();

      // Verificación 2: Compilación TypeScript
      await this.runTypeScriptVerification();

      // Verificación 3: Tests Existentes
      await this.runTestsVerification();

      // Generar reporte consolidado
      const success = this.generateConsolidatedReport();

      return success;
    } catch (error) {
      console.error('\n❌ Error durante las verificaciones:', error);
      console.error(error.stack);
      return false;
    }
  }
}

// Ejecutar verificaciones
if (require.main === module) {
  const runner = new MigrationVerificationRunner();
  
  runner.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = MigrationVerificationRunner;
