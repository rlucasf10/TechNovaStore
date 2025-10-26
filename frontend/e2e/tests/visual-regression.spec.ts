import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock consistent data for visual tests
    await page.route('**/api/products**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: Array.from({ length: 6 }, (_, i) => ({
            id: `product-${i + 1}`,
            name: `Test Product ${i + 1}`,
            price: 99.99 + (i * 10),
            image: `/images/product-${i + 1}.jpg`,
            category: 'Electronics',
            rating: 4.5,
            reviews: 123
          })),
          total: 6
        })
      });
    });

    await page.route('**/api/categories**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Laptops', slug: 'laptops' },
          { id: 2, name: 'Smartphones', slug: 'smartphones' },
          { id: 3, name: 'Tablets', slug: 'tablets' }
        ])
      });
    });
  });

  test('Homepage visual comparison', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    await page.waitForLoadState('networkidle');
    
    // Wait for images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Take header screenshot
    await expect(page.locator('[data-testid="header"]')).toHaveScreenshot('homepage-header.png');

    // Take featured products section screenshot
    await expect(page.locator('[data-testid="featured-products"]')).toHaveScreenshot('homepage-featured.png');
  });

  test('Product page visual comparison', async ({ page }) => {
    const productPage = new ProductPage(page);
    
    // Mock product details
    await page.route('**/api/products/test-product-1**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-product-1',
          name: 'Test Gaming Laptop',
          price: 1299.99,
          description: 'High-performance gaming laptop with RTX graphics',
          images: ['/images/laptop-1.jpg', '/images/laptop-2.jpg'],
          specifications: {
            processor: 'Intel i7-12700H',
            memory: '16GB DDR4',
            storage: '1TB SSD',
            graphics: 'RTX 3070'
          },
          providers: [
            { name: 'Amazon', price: 1299.99, shipping: 0 },
            { name: 'AliExpress', price: 1199.99, shipping: 25 }
          ]
        })
      });
    });

    await productPage.goto('test-product-1');
    await page.waitForLoadState('networkidle');

    // Product details screenshot
    await expect(page.locator('[data-testid="product-details"]')).toHaveScreenshot('product-details.png');

    // Price comparison screenshot
    await expect(page.locator('[data-testid="price-comparison"]')).toHaveScreenshot('price-comparison.png');

    // Product specifications screenshot
    await productPage.viewSpecifications();
    await expect(page.locator('[data-testid="specifications-content"]')).toHaveScreenshot('product-specs.png');
  });

  test('Shopping cart visual comparison', async ({ page }) => {
    const cartPage = new CartPage(page);
    
    // Mock cart data
    await page.route('**/api/cart**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              name: 'Gaming Laptop',
              price: 1299.99,
              quantity: 1,
              image: '/images/laptop.jpg'
            },
            {
              id: 'item-2',
              productId: 'product-2',
              name: 'Wireless Mouse',
              price: 49.99,
              quantity: 2,
              image: '/images/mouse.jpg'
            }
          ],
          subtotal: 1399.97,
          tax: 139.99,
          total: 1539.96
        })
      });
    });

    await cartPage.goto();
    await page.waitForLoadState('networkidle');

    // Full cart screenshot
    await expect(page).toHaveScreenshot('cart-full.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Cart items screenshot
    await expect(page.locator('[data-testid="cart-items"]')).toHaveScreenshot('cart-items.png');

    // Cart summary screenshot
    await expect(page.locator('[data-testid="cart-summary"]')).toHaveScreenshot('cart-summary.png');
  });

  test('Mobile responsive visual comparison', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const homePage = new HomePage(page);
    await homePage.goto();
    await page.waitForLoadState('networkidle');

    // Mobile homepage screenshot
    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Open mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await mobileMenuButton.click();
    
    // Mobile menu screenshot
    await expect(page.locator('[data-testid="mobile-nav"]')).toHaveScreenshot('mobile-menu.png');
  });

  test('Dark mode visual comparison', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    // Switch to dark mode
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      
      // Dark mode homepage screenshot
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('Error states visual comparison', async ({ page }) => {
    // Mock error responses
    await page.route('**/api/products**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Wait for error state to appear
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Error state screenshot
    await expect(page.locator('[data-testid="error-state"]')).toHaveScreenshot('error-state.png');
  });

  test('Loading states visual comparison', async ({ page }) => {
    // Delay API responses to capture loading states
    await page.route('**/api/products**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], total: 0 })
      });
    });

    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Capture loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-state"]')).toHaveScreenshot('loading-state.png');
  });
});