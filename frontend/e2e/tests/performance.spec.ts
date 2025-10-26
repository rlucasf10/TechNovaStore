import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent performance testing
    await page.route('**/api/**', route => {
      // Simulate realistic API response times
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }, 100);
    });
  });

  test('Homepage performance metrics', async ({ page }) => {
    const homePage = new HomePage(page);

    // Start performance measurement
    const startTime = Date.now();

    await homePage.goto();

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Assert load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check Core Web Vitals using Performance API
    const webVitals = await page.evaluate(() => {
      return new Promise<Record<string, number>>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};

          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              vitals.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
              vitals.loadComplete = navEntry.loadEventEnd - navEntry.loadEventStart;
            }

            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            }
          });

          resolve(vitals);
        });

        observer.observe({ entryTypes: ['navigation', 'paint'] });

        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    }) as Record<string, number>;

    console.log('Web Vitals:', webVitals);

    // Assert performance metrics
    if (webVitals.fcp) {
      expect(webVitals.fcp).toBeLessThan(2500); // FCP should be under 2.5s
    }
  });

  test('Product search performance', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    // Measure search performance
    const searchStartTime = Date.now();

    await homePage.searchProduct('laptop');

    // Wait for search results to load
    await page.waitForSelector('[data-testid="product-grid"]');

    const searchTime = Date.now() - searchStartTime;

    // Search should complete within 2 seconds
    expect(searchTime).toBeLessThan(2000);

    // Check that results are displayed
    const productCount = await page.locator('[data-testid="product-card"]').count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('Page bundle size analysis', async ({ page }) => {
    await page.goto('/');

    // Get resource loading information
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries.map(entry => ({
        name: entry.name,
        size: entry.transferSize || 0,
        type: entry.initiatorType,
        duration: entry.duration
      }));
    });

    // Analyze JavaScript bundle sizes
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);

    console.log(`Total JS bundle size: ${(totalJSSize / 1024).toFixed(2)} KB`);

    // Assert bundle size is reasonable (under 1MB)
    expect(totalJSSize).toBeLessThan(1024 * 1024);

    // Analyze CSS bundle sizes
    const cssResources = resources.filter(r => r.name.includes('.css'));
    const totalCSSSize = cssResources.reduce((sum, r) => sum + r.size, 0);

    console.log(`Total CSS bundle size: ${(totalCSSSize / 1024).toFixed(2)} KB`);

    // CSS should be under 200KB
    expect(totalCSSSize).toBeLessThan(200 * 1024);
  });

  test('Memory usage monitoring', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);

    await homePage.goto();

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });

    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory);

      // Navigate through several pages
      await homePage.clickFeaturedProduct(0);
      await productPage.addToCart();
      await homePage.openCart();
      await homePage.goto();

      // Get memory usage after navigation
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        };
      });

      console.log('Final memory usage:', finalMemory);

      // Memory growth should be reasonable (less than 50MB increase)
      const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('Network request optimization', async ({ page }) => {
    const requests: string[] = [];

    // Monitor network requests
    page.on('request', request => {
      requests.push(request.url());
    });

    const homePage = new HomePage(page);
    await homePage.goto();
    await page.waitForLoadState('networkidle');

    // Analyze request patterns
    const apiRequests = requests.filter(url => url.includes('/api/'));
    const staticRequests = requests.filter(url =>
      url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg')
    );

    console.log(`API requests: ${apiRequests.length}`);
    console.log(`Static resource requests: ${staticRequests.length}`);

    // Should not make excessive API requests
    expect(apiRequests.length).toBeLessThan(10);

    // Check for duplicate requests
    const uniqueRequests = new Set(requests);
    expect(uniqueRequests.size).toBe(requests.length);
  });

  test('Image loading optimization', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    // Check image loading performance
    const imageMetrics = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        loading: img.loading,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      }));
    });

    // Verify lazy loading is implemented
    const lazyImages = imageMetrics.filter(img => img.loading === 'lazy');
    expect(lazyImages.length).toBeGreaterThan(0);

    // Verify images have proper dimensions
    const validImages = imageMetrics.filter(img => img.naturalWidth > 0 && img.naturalHeight > 0);
    expect(validImages.length).toBe(imageMetrics.length);
  });
});