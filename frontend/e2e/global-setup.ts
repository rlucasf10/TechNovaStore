import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  // Wait for the application to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be available
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    console.log('✅ Application is ready for E2E tests');
  } catch (error) {
    console.error('❌ Failed to connect to application:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;