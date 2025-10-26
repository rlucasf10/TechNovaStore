import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  });

  test('Homepage accessibility compliance', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Verify h1 exists and is unique
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBe(1);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper form labels
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
    
    // Check for skip links
    const skipLink = await page.locator('a[href="#main-content"]').count();
    expect(skipLink).toBeGreaterThan(0);
  });

  test('Keyboard navigation', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test navigation through interactive elements
    const interactiveElements = await page.locator('a, button, input, select, textarea').all();
    
    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      
      const currentFocus = await page.evaluate(() => {
        const element = document.activeElement;
        return element ? {
          tagName: element.tagName,
          type: element.getAttribute('type'),
          role: element.getAttribute('role')
        } : null;
      });
      
      expect(currentFocus).toBeTruthy();
    }
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
  });

  test('Screen reader compatibility', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    // Check for ARIA landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').count();
    expect(landmarks).toBeGreaterThan(0);
    
    // Check for proper ARIA labels on interactive elements
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      expect(ariaLabel || textContent?.trim()).toBeTruthy();
    }
    
    // Check for live regions for dynamic content
    const liveRegions = await page.locator('[aria-live]').count();
    expect(liveRegions).toBeGreaterThan(0);
    
    // Check for proper table headers
    const tables = await page.locator('table').all();
    for (const table of tables) {
      const headers = await table.locator('th').count();
      if (headers > 0) {
        const headerElements = await table.locator('th').all();
        for (const header of headerElements) {
          const scope = await header.getAttribute('scope');
          expect(scope).toBeTruthy();
        }
      }
    }
  });

  test('Color contrast and visual accessibility', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    // Check for sufficient color contrast (basic check)
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
    
    for (const element of textElements.slice(0, 10)) { // Check first 10 elements
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Verify text has color (not transparent)
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.color).not.toBe('transparent');
    }
    
    // Check for focus indicators
    const focusableElements = await page.locator('a, button, input, select, textarea').all();
    
    for (const element of focusableElements.slice(0, 5)) {
      await element.focus();
      
      const focusStyles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow
        };
      });
      
      // Should have some form of focus indicator
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' || 
        focusStyles.outlineWidth !== '0px' || 
        focusStyles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('Form accessibility', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await checkoutPage.goto();
    
    // Run axe accessibility scan on forms
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check form structure
    const forms = await page.locator('form').all();
    expect(forms.length).toBeGreaterThan(0);
    
    // Check for fieldsets and legends
    const fieldsets = await page.locator('fieldset').all();
    for (const fieldset of fieldsets) {
      const legend = await fieldset.locator('legend').count();
      expect(legend).toBeGreaterThan(0);
    }
    
    // Check for error message associations
    const errorMessages = await page.locator('[role="alert"], .error-message').all();
    for (const error of errorMessages) {
      const id = await error.getAttribute('id');
      if (id) {
        const associatedInput = await page.locator(`[aria-describedby*="${id}"]`).count();
        expect(associatedInput).toBeGreaterThan(0);
      }
    }
    
    // Check required field indicators
    const requiredFields = await page.locator('input[required], select[required], textarea[required]').all();
    for (const field of requiredFields) {
      const ariaRequired = await field.getAttribute('aria-required');
      const hasRequiredIndicator = ariaRequired === 'true';
      expect(hasRequiredIndicator).toBeTruthy();
    }
  });

  test('Mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Check touch target sizes (minimum 44px)
    const touchTargets = await page.locator('button, a, input[type="button"], input[type="submit"]').all();
    
    for (const target of touchTargets.slice(0, 10)) {
      const boundingBox = await target.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    // Check for proper viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
    
    // Test mobile navigation
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Check if mobile menu is accessible
      const mobileNav = page.locator('[data-testid="mobile-nav"]');
      await expect(mobileNav).toBeVisible();
      
      const ariaExpanded = await mobileMenuButton.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('true');
    }
  });

  test('Dynamic content accessibility', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    
    await homePage.goto();
    
    // Test search functionality accessibility
    await homePage.searchProduct('laptop');
    
    // Check if search results are announced
    const searchResults = page.locator('[data-testid="search-results"]');
    const ariaLive = await searchResults.getAttribute('aria-live');
    expect(ariaLive).toBeTruthy();
    
    // Test product interaction
    await homePage.clickFeaturedProduct(0);
    await productPage.addToCart();
    
    // Check if cart update is announced
    const cartNotification = page.locator('[data-testid="cart-notification"]');
    if (await cartNotification.isVisible()) {
      const notificationAriaLive = await cartNotification.getAttribute('aria-live');
      expect(notificationAriaLive).toBeTruthy();
    }
  });

  test('Error handling accessibility', async ({ page }) => {
    // Mock error responses
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Check error message accessibility
    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      const role = await errorMessage.getAttribute('role');
      const ariaLive = await errorMessage.getAttribute('aria-live');
      
      expect(role === 'alert' || ariaLive === 'assertive').toBeTruthy();
    }
  });
});