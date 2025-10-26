#!/usr/bin/env node

/**
 * TechNovaStore Load Testing Setup Verification
 * Verifies that all load testing components are properly configured
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SetupVerifier {
  constructor() {
    this.testDir = __dirname;
    this.errors = [];
    this.warnings = [];
  }

  // Check if file exists
  checkFile(filePath, description) {
    const fullPath = path.join(this.testDir, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${description}: ${filePath}`);
      return true;
    } else {
      this.errors.push(`❌ Missing ${description}: ${filePath}`);
      return false;
    }
  }

  // Check if directory exists
  checkDirectory(dirPath, description) {
    const fullPath = path.join(this.testDir, dirPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      console.log(`✅ ${description}: ${dirPath}`);
      return true;
    } else {
      this.errors.push(`❌ Missing ${description}: ${dirPath}`);
      return false;
    }
  }

  // Check Artillery installation
  async checkArtillery() {
    return new Promise((resolve) => {
      const artillery = spawn('npx', ['artillery', '--version'], { 
        stdio: 'pipe',
        cwd: path.join(this.testDir, '..', '..'),
        shell: true
      });
      
      let output = '';
      artillery.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      artillery.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Artillery installed: ${output.trim()}`);
          resolve(true);
        } else {
          this.errors.push('❌ Artillery not found or not working');
          resolve(false);
        }
      });
      
      artillery.on('error', () => {
        this.errors.push('❌ Artillery not found or not working');
        resolve(false);
      });
    });
  }

  // Validate YAML configuration files
  validateYamlConfig(filePath) {
    try {
      const content = fs.readFileSync(path.join(this.testDir, filePath), 'utf8');
      
      // Basic YAML structure validation
      if (!content.includes('config:')) {
        this.warnings.push(`⚠️  ${filePath}: Missing 'config' section`);
      }
      
      if (!content.includes('scenarios:')) {
        this.warnings.push(`⚠️  ${filePath}: Missing 'scenarios' section`);
      }
      
      if (!content.includes('target:')) {
        this.warnings.push(`⚠️  ${filePath}: Missing 'target' configuration`);
      }
      
      console.log(`✅ YAML structure valid: ${filePath}`);
      return true;
    } catch (error) {
      this.errors.push(`❌ Invalid YAML in ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Check package.json scripts
  checkPackageScripts() {
    try {
      const packagePath = path.join(this.testDir, '..', '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredScripts = [
        'test:load',
        'test:load:critical',
        'test:stress',
        'test:benchmark'
      ];
      
      let allScriptsPresent = true;
      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          console.log(`✅ NPM script configured: ${script}`);
        } else {
          this.errors.push(`❌ Missing NPM script: ${script}`);
          allScriptsPresent = false;
        }
      });
      
      return allScriptsPresent;
    } catch (error) {
      this.errors.push(`❌ Error checking package.json: ${error.message}`);
      return false;
    }
  }

  // Test basic HTTP connectivity
  async testConnectivity(target = 'http://localhost:3000') {
    const http = require('http');
    const https = require('https');
    
    return new Promise((resolve) => {
      const url = new URL(target);
      const httpModule = url.protocol === 'https:' ? https : http;
      
      const req = httpModule.get(target + '/health', { timeout: 5000 }, (res) => {
        console.log(`✅ Target accessible: ${target} (Status: ${res.statusCode})`);
        resolve(true);
      });
      
      req.on('error', (error) => {
        this.warnings.push(`⚠️  Target not accessible: ${target} (${error.message})`);
        resolve(false);
      });
      
      req.on('timeout', () => {
        this.warnings.push(`⚠️  Target timeout: ${target}`);
        req.destroy();
        resolve(false);
      });
    });
  }

  // Run comprehensive verification
  async verify() {
    console.log('🔍 Verifying TechNovaStore Load Testing Setup...\n');
    
    // Check required files
    console.log('📁 Checking configuration files:');
    this.checkFile('load-test.yml', 'Basic load test config');
    this.checkFile('critical-apis.yml', 'Critical APIs test config');
    this.checkFile('stress-test.yml', 'Stress test config');
    this.checkFile('benchmark.yml', 'Benchmark test config');
    this.checkFile('config.js', 'Load test utilities');
    this.checkFile('run-load-tests.js', 'Test runner script');
    this.checkFile('performance-monitor.js', 'Performance monitor');
    this.checkFile('README.md', 'Documentation');
    
    console.log('\n📂 Checking directories:');
    this.checkDirectory('reports', 'Reports directory');
    
    console.log('\n🔧 Checking tools:');
    await this.checkArtillery();
    
    console.log('\n📋 Checking package configuration:');
    this.checkPackageScripts();
    
    console.log('\n📝 Validating YAML configurations:');
    this.validateYamlConfig('load-test.yml');
    this.validateYamlConfig('critical-apis.yml');
    this.validateYamlConfig('stress-test.yml');
    this.validateYamlConfig('benchmark.yml');
    
    console.log('\n🌐 Testing connectivity:');
    await this.testConnectivity('http://localhost:3000');
    
    // Display results
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('🎉 Load testing setup verification PASSED!');
      console.log('\n✅ All required components are properly configured.');
      console.log('✅ You can now run load tests using the provided scripts.');
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings (non-critical):');
        this.warnings.forEach(warning => console.log(`   ${warning}`));
      }
      
      console.log('\n🚀 Quick start commands:');
      console.log('   npm run test:load              # Basic load test');
      console.log('   npm run test:load:critical     # Critical APIs test');
      console.log('   npm run test:stress            # Stress test');
      console.log('   npm run test:benchmark         # Performance benchmark');
      console.log('   node tests/load/run-load-tests.js all  # Run all tests');
      
      return true;
    } else {
      console.log('❌ Load testing setup verification FAILED!');
      console.log('\n🔧 Issues found:');
      this.errors.forEach(error => console.log(`   ${error}`));
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        this.warnings.forEach(warning => console.log(`   ${warning}`));
      }
      
      console.log('\n💡 Please fix the issues above and run verification again.');
      return false;
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new SetupVerifier();
  verifier.verify().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  });
}

module.exports = SetupVerifier;