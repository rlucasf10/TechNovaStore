#!/usr/bin/env node

/**
 * Validation script to ensure E2E test setup is working correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating E2E Test Setup...\n');

// Check if Playwright is installed
try {
    const version = execSync('npx playwright --version', { encoding: 'utf8' });
    console.log('✅ Playwright installed:', version.trim());
} catch (error) {
    console.error('❌ Playwright not installed');
    process.exit(1);
}

// Check if browsers are installed
try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    console.log('✅ Playwright browsers are installed');
} catch (error) {
    console.log('⚠️  Playwright browsers may need installation');
    console.log('   Run: npm run test:e2e:install');
}

// Check configuration files
const configFiles = [
    'playwright.config.ts',
    'e2e/global-setup.ts',
    'e2e/global-teardown.ts'
];

configFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`✅ Configuration file exists: ${file}`);
    } else {
        console.error(`❌ Missing configuration file: ${file}`);
    }
});

// Check test files
const testFiles = [
    'e2e/tests/critical-flows.spec.ts',
    'e2e/tests/visual-regression.spec.ts',
    'e2e/tests/performance.spec.ts',
    'e2e/tests/accessibility.spec.ts'
];

testFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`✅ Test file exists: ${file}`);
    } else {
        console.error(`❌ Missing test file: ${file}`);
    }
});

// Check page objects
const pageFiles = [
    'e2e/pages/HomePage.ts',
    'e2e/pages/ProductPage.ts',
    'e2e/pages/CartPage.ts',
    'e2e/pages/CheckoutPage.ts'
];

pageFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`✅ Page object exists: ${file}`);
    } else {
        console.error(`❌ Missing page object: ${file}`);
    }
});

// Validate test listing
try {
    const output = execSync('npx playwright test --list', { encoding: 'utf8' });
    const testCount = (output.match(/Total: (\d+) tests/)?.[1]) || '0';
    console.log(`✅ Test discovery successful: ${testCount} tests found`);
} catch (error) {
    console.error('❌ Test discovery failed:', error.message);
    process.exit(1);
}

// Check Jest exclusion
try {
    const jestOutput = execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
    if (!jestOutput.includes('e2e/tests')) {
        console.log('✅ Jest correctly excludes E2E tests');
    } else {
        console.error('❌ Jest is picking up E2E tests (should be excluded)');
    }
} catch (error) {
    console.error('⚠️  Could not validate Jest exclusion');
}

console.log('\n🎉 E2E Test Setup Validation Complete!');
console.log('\nNext steps:');
console.log('1. Start your application: npm run dev');
console.log('2. Run E2E tests: npm run test:e2e');
console.log('3. View test report: npm run test:e2e:report');