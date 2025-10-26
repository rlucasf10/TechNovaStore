import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class HomePage {
  private helpers: TestHelpers;

  // Locators
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly categoryLinks: Locator;
  readonly featuredProducts: Locator;
  readonly cartIcon: Locator;
  readonly loginButton: Locator;
  readonly chatWidget: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Initialize locators
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.categoryLinks = page.locator('[data-testid="category-link"]');
    this.featuredProducts = page.locator('[data-testid="featured-product"]');
    this.cartIcon = page.locator('[data-testid="cart-icon"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.chatWidget = page.locator('[data-testid="chat-widget"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.helpers.waitForPageLoad();
  }

  async searchProduct(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.helpers.waitForNavigation();
  }

  async selectCategory(categoryName: string) {
    const category = this.categoryLinks.filter({ hasText: categoryName });
    await category.click();
    await this.helpers.waitForNavigation();
  }

  async clickFeaturedProduct(index: number = 0) {
    const product = this.featuredProducts.nth(index);
    await product.click();
    await this.helpers.waitForNavigation();
  }

  async openCart() {
    await this.cartIcon.click();
    await this.helpers.waitForNavigation('/carrito');
  }

  async openLogin() {
    await this.loginButton.click();
    await this.helpers.waitForNavigation('/login');
  }

  async openChat() {
    await this.chatWidget.click();
  }

  async isLoaded(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="home-page"]');
  }
}