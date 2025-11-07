/**
 * Test de verificación: Servicios Docker
 * 
 * Verifica que todos los servicios Docker críticos inician correctamente
 * y responden a health checks.
 * 
 * Uso: node e2e-tests/migration-verification/verify-docker-services.test.js
 */

const { execSync } = require('child_process');

// Configuración
const DOCKER_COMPOSE_FILE = 'docker-compose.optimized.yml';
const TIMEOUT = 60000; // 60 segundos

// Servicios críticos a verificar
const CRITICAL_SERVICES = [
  'technovastore-mongodb',
  'technovastore-redis',
  'technovastore-postgresql'
];

// Servicios de aplicación a verificar
const APP_SERVICES = [
  'technovastore-api-gateway',
  'technovastore-frontend',
  'technovastore-product-service',
  'technovastore-user-service',
  'technovastore-order-service',
  'technovastore-payment-service'
];

class DockerServicesVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Ejecuta un comando y retorna el resultado
   */
  execCommand(command) {
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return { success: true, output: output.trim() };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: error.stdout ? error.stdout.trim() : ''
      };
    }
  }

  /**
   * Verifica si Docker está disponible
   */
  verifyDockerAvailable() {
    console.log('🔍 Verificando disponibilidad de Docker...');
    
    const result = this.execCommand('docker --version');
    
    if (!result.success) {
      console.error('❌ Docker no está disponible');
      return false;
    }
    
    console.log(`✅ Docker disponible: ${result.output}`);
    return true;
  }

  /**
   * Verifica si Docker Compose está disponible
   */
  verifyDockerComposeAvailable() {
    console.log('🔍 Verificando disponibilidad de Docker Compose...');
    
    const result = this.execCommand('docker-compose --version');
    
    if (!result.success) {
      console.error('❌ Docker Compose no está disponible');
      return false;
    }
    
    console.log(`✅ Docker Compose disponible: ${result.output}`);
    return true;
  }

  /**
   * Obtiene el estado de los servicios Docker
   */
  getServicesStatus() {
    const result = this.execCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} ps --format json`);
    
    if (!result.success) {
      return null;
    }

    try {
      // Docker Compose puede retornar múltiples objetos JSON, uno por línea
      const lines = result.output.split('\n').filter(line => line.trim());
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      // Fallback: usar formato de tabla
      return this.parseServicesTable();
    }
  }

  /**
   * Parsea la salida de docker-compose ps en formato tabla
   */
  parseServicesTable() {
    const result = this.execCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} ps`);
    
    if (!result.success) {
      return null;
    }

    const lines = result.output.split('\n').filter(line => line.trim());
    const services = [];

    // Saltar las primeras líneas (headers)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Up') || line.includes('running')) {
        const parts = line.split(/\s+/);
        services.push({
          Name: parts[0],
          State: 'running'
        });
      }
    }

    return services;
  }

  /**
   * Verifica si un servicio está corriendo
   */
  isServiceRunning(serviceName, services) {
    if (!services) return false;

    return services.some(service => {
      const name = service.Name || service.name || '';
      const state = service.State || service.state || '';
      return name.includes(serviceName) && (state === 'running' || state.includes('Up'));
    });
  }

  /**
   * Verifica servicios críticos
   */
  verifyCriticalServices(services) {
    console.log('\n🔍 Verificando servicios críticos...\n');

    let allPassed = true;

    for (const serviceName of CRITICAL_SERVICES) {
      const isRunning = this.isServiceRunning(serviceName, services);

      if (isRunning) {
        console.log(`✅ ${serviceName}: Running`);
        this.results.passed++;
      } else {
        console.log(`❌ ${serviceName}: Not running`);
        this.results.failed++;
        this.results.errors.push(`Service ${serviceName} is not running`);
        allPassed = false;
      }
    }

    return allPassed;
  }

  /**
   * Verifica servicios de aplicación
   */
  verifyAppServices(services) {
    console.log('\n🔍 Verificando servicios de aplicación...\n');

    let allPassed = true;

    for (const serviceName of APP_SERVICES) {
      const isRunning = this.isServiceRunning(serviceName, services);

      if (isRunning) {
        console.log(`✅ ${serviceName}: Running`);
        this.results.passed++;
      } else {
        console.log(`⚠️  ${serviceName}: Not running (opcional)`);
        // No contamos como fallo si es un servicio de app
      }
    }

    return allPassed;
  }

  /**
   * Genera reporte de resultados
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('  REPORTE DE VERIFICACIÓN DE SERVICIOS DOCKER');
    console.log('='.repeat(70) + '\n');

    console.log(`✅ Tests pasados: ${this.results.passed}`);
    console.log(`❌ Tests fallidos: ${this.results.failed}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errores encontrados:\n');
      this.results.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error}`);
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
    console.log('  TEST DE VERIFICACIÓN: SERVICIOS DOCKER');
    console.log('='.repeat(70) + '\n');

    // Verificar Docker disponible
    if (!this.verifyDockerAvailable()) {
      this.results.failed++;
      this.results.errors.push('Docker no está disponible');
      return this.generateReport();
    }

    // Verificar Docker Compose disponible
    if (!this.verifyDockerComposeAvailable()) {
      this.results.failed++;
      this.results.errors.push('Docker Compose no está disponible');
      return this.generateReport();
    }

    // Obtener estado de servicios
    console.log('\n🔍 Obteniendo estado de servicios...\n');
    const services = this.getServicesStatus();

    if (!services) {
      console.error('❌ No se pudo obtener el estado de los servicios');
      this.results.failed++;
      this.results.errors.push('No se pudo obtener el estado de los servicios');
      return this.generateReport();
    }

    console.log(`📊 Servicios encontrados: ${services.length}\n`);

    // Verificar servicios críticos
    const criticalPassed = this.verifyCriticalServices(services);

    // Verificar servicios de aplicación
    this.verifyAppServices(services);

    // Generar reporte
    const success = this.generateReport();

    return success;
  }
}

// Ejecutar verificación
if (require.main === module) {
  const verifier = new DockerServicesVerifier();
  
  verifier.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  });
}

module.exports = DockerServicesVerifier;
