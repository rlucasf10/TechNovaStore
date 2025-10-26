import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up after E2E tests...');
  
  // Add any cleanup logic here if needed
  // For example, clearing test data, stopping services, etc.
  
  console.log('✅ E2E test cleanup completed');
}

export default globalTeardown;