#!/usr/bin/env node

/**
 * E2E Test Runner Script
 * Provides different test execution modes and configurations
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestConfig {
  mode: 'critical' | 'visual' | 'performance' | 'accessibility' | 'all';
  browser?: 'chromium' | 'firefox' | 'webkit' | 'all';
  headed?: boolean;
  debug?: boolean;
  ui?: boolean;
  workers?: number;
  retries?: number;
  timeout?: number;
  reporter?: string;
  outputDir?: string;
}

class E2ETestRunner {
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * Run E2E tests based on configuration
   */
  async run(): Promise<void> {
    console.log('🚀 Starting E2E Test Runner...');
    console.log(`Mode: ${this.config.mode}`);
    console.log(`Browser: ${this.config.browser || 'all'}`);

    // Validate environment
    this.validateEnvironment();

    // Build command
    const command = this.buildCommand();

    console.log(`Executing: ${command}`);

    try {
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('✅ E2E tests completed successfully!');

      // Generate report if not in debug mode
      if (!this.config.debug && !this.config.ui) {
        this.generateReport();
      }

    } catch (error) {
      console.error('❌ E2E tests failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate test environment
   */
  private validateEnvironment(): void {
    // Check if Playwright is installed
    const playwrightConfig = path.join(process.cwd(), 'playwright.config.ts');
    if (!existsSync(playwrightConfig)) {
      throw new Error('Playwright configuration not found. Run npm run test:e2e:install first.');
    }

    // Check if browsers are installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
    } catch {
      console.log('Installing Playwright browsers...');
      execSync('npx playwright install', { stdio: 'inherit' });
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Build Playwright command based on configuration
   */
  private buildCommand(): string {
    let command = 'npx playwright test';

    // Add test files based on mode
    switch (this.config.mode) {
      case 'critical':
        command += ' e2e/tests/critical-flows.spec.ts';
        break;
      case 'visual':
        command += ' e2e/tests/visual-regression.spec.ts';
        break;
      case 'performance':
        command += ' e2e/tests/performance.spec.ts';
        break;
      case 'accessibility':
        command += ' e2e/tests/accessibility.spec.ts';
        break;
      case 'all':
        command += ' e2e/tests/';
        break;
    }

    // Add browser selection
    if (this.config.browser && this.config.browser !== 'all') {
      command += ` --project=${this.config.browser}`;
    }

    // Add execution options
    if (this.config.headed) {
      command += ' --headed';
    }

    if (this.config.debug) {
      command += ' --debug';
    }

    if (this.config.ui) {
      command += ' --ui';
    }

    if (this.config.workers) {
      command += ` --workers=${this.config.workers}`;
    }

    if (this.config.retries !== undefined) {
      command += ` --retries=${this.config.retries}`;
    }

    if (this.config.timeout) {
      command += ` --timeout=${this.config.timeout}`;
    }

    if (this.config.reporter) {
      command += ` --reporter=${this.config.reporter}`;
    }

    if (this.config.outputDir) {
      command += ` --output=${this.config.outputDir}`;
    }

    return command;
  }

  /**
   * Generate test report
   */
  private generateReport(): void {
    console.log('📊 Generating test report...');

    try {
      execSync('npx playwright show-report', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ Could not generate report:', error);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    mode: 'all'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--mode':
        if (nextArg && ['critical', 'visual', 'performance', 'accessibility', 'all'].includes(nextArg)) {
          config.mode = nextArg as TestConfig['mode'];
          i++;
        }
        break;
      case '--browser':
        if (nextArg && ['chromium', 'firefox', 'webkit', 'all'].includes(nextArg)) {
          config.browser = nextArg as TestConfig['browser'];
          i++;
        }
        break;
      case '--headed':
        config.headed = true;
        break;
      case '--debug':
        config.debug = true;
        break;
      case '--ui':
        config.ui = true;
        break;
      case '--workers':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          config.workers = parseInt(nextArg);
          i++;
        }
        break;
      case '--retries':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          config.retries = parseInt(nextArg);
          i++;
        }
        break;
      case '--timeout':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          config.timeout = parseInt(nextArg);
          i++;
        }
        break;
      case '--reporter':
        if (nextArg) {
          config.reporter = nextArg;
          i++;
        }
        break;
      case '--output':
        if (nextArg) {
          config.outputDir = nextArg;
          i++;
        }
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
E2E Test Runner

Usage: npm run test:e2e:runner [options]

Options:
  --mode <mode>         Test mode: critical, visual, performance, accessibility, all (default: all)
  --browser <browser>   Browser: chromium, firefox, webkit, all (default: all)
  --headed             Run tests in headed mode
  --debug              Run tests in debug mode
  --ui                 Run tests with Playwright UI
  --workers <number>   Number of worker processes
  --retries <number>   Number of retries for failed tests
  --timeout <ms>       Test timeout in milliseconds
  --reporter <type>    Reporter type (html, json, junit, etc.)
  --output <dir>       Output directory for test results
  --help               Show this help message

Examples:
  npm run test:e2e:runner --mode critical --browser chromium
  npm run test:e2e:runner --mode visual --headed
  npm run test:e2e:runner --mode accessibility --workers 1
  npm run test:e2e:runner --debug
  `);
}

// Main execution
if (require.main === module) {
  const config = parseArgs();
  const runner = new E2ETestRunner(config);

  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { E2ETestRunner };
export type { TestConfig };