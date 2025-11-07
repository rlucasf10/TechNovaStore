#!/usr/bin/env node

/**
 * TechNovaStore Load Test Runner
 * Comprehensive script for running and managing load tests
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { reportUtils } = require('./config');

class LoadTestRunner {
  constructor() {
    this.testDir = __dirname;
    this.reportsDir = path.join(this.testDir, 'reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Run a specific test configuration
  async runTest(testFile, options = {}) {
    const testPath = path.join(this.testDir, testFile);
    const reportPath = path.join(this.reportsDir, `${path.basename(testFile, '.yml')}-${this.timestamp}.json`);
    
    console.log(`\n🚀 Starting load test: ${testFile}`);
    console.log(`📊 Report will be saved to: ${reportPath}`);
    
    const args = ['run', testPath, '--output', reportPath];
    
    // Add target override if specified
    if (options.target) {
      args.push('--target', options.target);
    }
    
    // Add environment variables
    if (options.environment) {
      args.push('--environment', options.environment);
    }
    
    return new Promise((resolve, reject) => {
      const artillery = spawn('artillery', args, {
        stdio: 'inherit',
        cwd: this.testDir,
        shell: true  // This fixes the Windows issue
      });
      
      artillery.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Load test completed successfully`);
          
          // Generate HTML report if JSON report exists
          if (fs.existsSync(reportPath)) {
            const htmlReportPath = reportPath.replace('.json', '.html');
            reportUtils.generateHTMLReport(reportPath, htmlReportPath);
            console.log(`📈 HTML report generated: ${htmlReportPath}`);
          }
          
          resolve({ code, reportPath });
        } else {
          console.error(`❌ Load test failed with exit code ${code}`);
          reject(new Error(`Load test failed with exit code ${code}`));
        }
      });
      
      artillery.on('error', (error) => {
        console.error(`❌ Failed to start load test: ${error.message}`);
        reject(error);
      });
    });
  }

  // Run all load tests in sequence
  async runAllTests(options = {}) {
    const testFiles = [
      'load-test.yml',
      'critical-apis.yml',
      'stress-test.yml',
      'benchmark.yml'
    ];
    
    console.log('🎯 Running comprehensive load test suite...\n');
    
    const results = [];
    
    for (const testFile of testFiles) {
      try {
        const result = await this.runTest(testFile, options);
        results.push({ testFile, ...result });
        
        // Wait between tests to allow system recovery
        if (testFile !== testFiles[testFiles.length - 1]) {
          console.log('⏳ Waiting 30 seconds for system recovery...');
          await this.sleep(30000);
        }
      } catch (error) {
        console.error(`❌ Test ${testFile} failed:`, error.message);
        results.push({ testFile, error: error.message });
      }
    }
    
    // Generate summary report
    this.generateSummaryReport(results);
    
    return results;
  }

  // Generate a summary report of all tests
  generateSummaryReport(results) {
    const summaryPath = path.join(this.reportsDir, `load-test-summary-${this.timestamp}.json`);
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      successfulTests: results.filter(r => !r.error).length,
      failedTests: results.filter(r => r.error).length,
      results: results.map(r => ({
        testFile: r.testFile,
        success: !r.error,
        error: r.error || null,
        reportPath: r.reportPath || null
      }))
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n📋 Load Test Summary:');
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Successful: ${summary.successfulTests}`);
    console.log(`   Failed: ${summary.failedTests}`);
    console.log(`   Summary Report: ${summaryPath}`);
    
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => r.error).forEach(r => {
        console.log(`   - ${r.testFile}: ${r.error}`);
      });
    }
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if Artillery is installed
  checkArtilleryInstallation() {
    return new Promise((resolve) => {
      const artillery = spawn('artillery', ['--version'], { 
        stdio: 'pipe',
        shell: true  // This fixes the Windows issue
      });
      
      artillery.on('close', (code) => {
        resolve(code === 0);
      });
      
      artillery.on('error', () => {
        resolve(false);
      });
    });
  }

  // Install Artillery if not present
  async installArtillery() {
    console.log('📦 Installing Artillery...');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', '-g', 'artillery'], {
        stdio: 'inherit',
        shell: true  // This fixes the Windows issue
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Artillery installed successfully');
          resolve();
        } else {
          reject(new Error(`Failed to install Artillery (exit code ${code})`));
        }
      });
      
      npm.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// CLI interface
async function main() {
  const runner = new LoadTestRunner();
  const args = process.argv.slice(2);
  
  // Check if Artillery is installed
  const isArtilleryInstalled = await runner.checkArtilleryInstallation();
  if (!isArtilleryInstalled) {
    console.log('⚠️  Artillery not found. Installing...');
    try {
      await runner.installArtillery();
    } catch (error) {
      console.error('❌ Failed to install Artillery:', error.message);
      console.log('Please install Artillery manually: npm install -g artillery');
      process.exit(1);
    }
  }
  
  const command = args[0];
  const options = {};
  
  // Parse command line arguments
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }
  
  try {
    switch (command) {
      case 'load':
        await runner.runTest('load-test.yml', options);
        break;
      case 'critical':
        await runner.runTest('critical-apis.yml', options);
        break;
      case 'stress':
        await runner.runTest('stress-test.yml', options);
        break;
      case 'benchmark':
        await runner.runTest('benchmark.yml', options);
        break;
      case 'all':
        await runner.runAllTests(options);
        break;
      default:
        console.log(`
🎯 TechNovaStore Load Test Runner

Usage: node run-load-tests.js <command> [options]

Commands:
  load       Run basic load test
  critical   Run critical APIs stress test
  stress     Run high-intensity stress test
  benchmark  Run performance benchmark
  all        Run all tests in sequence

Options:
  --target <url>        Override target URL
  --environment <env>   Set environment (local, staging, production)

Examples:
  node run-load-tests.js load
  node run-load-tests.js all --target http://localhost:3000
  node run-load-tests.js benchmark --environment staging
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Load test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = LoadTestRunner;