import { Page, expect } from '@playwright/test';

/**
 * Test utilities for E2E tests
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for element to be visible and stable
   */
  async waitForElement(selector: string, timeout = 5000) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string) {
    const field = await this.waitForElement(selector);
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }

  /**
   * Click element with retry logic
   */
  async clickElement(selector: string, options?: { timeout?: number }) {
    const element = await this.waitForElement(selector, options?.timeout);
    await element.click();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(url?: string) {
    if (url) {
      await this.page.waitForURL(url);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string) {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout = 10000) {
    return await this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string' 
          ? url.includes(urlPattern)
          : urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Mock API response
   */
  async mockApiResponse(urlPattern: string | RegExp, response: any) {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
}