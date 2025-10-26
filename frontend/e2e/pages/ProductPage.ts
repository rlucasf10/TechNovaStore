import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class ProductPage {
  private helpers: TestHelpers;

  // Locators
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productDescription: Locator;
  readonly productImages: Locator;
  readonly addToCartButton: Locator;
  readonly quantitySelector: Locator;
  readonly priceComparison: Locator;
  readonly recommendedProducts: Locator;
  readonly reviewsSection: Locator;
  readonly specificationsTabs: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Initialize locators
    this.productTitle = page.locator('[data-testid="product-title"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.productDescription = page.locator('[data-testid="product-description"]');
    this.productImages = page.locator('[data-testid="product-image"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.quantitySelector = page.locator('[data-testid="quantity-selector"]');
    this.priceComparison = page.locator('[data-testid="price-comparison"]');
    this.recommendedProducts = page.locator('[data-testid="recommended-product"]');
    this.reviewsSection = page.locator('[data-testid="reviews-section"]');
    this.specificationsTabs = page.locator('[data-testid="specifications-tab"]');
  }

  async goto(productId: string) {
    await this.page.goto(`/productos/${productId}`);
    await this.helpers.waitForPageLoad();
  }

  async addToCart(quantity: number = 1) {
    if (quantity > 1) {
      await this.quantitySelector.selectOption(quantity.toString());
    }
    await this.addToCartButton.click();
    
    // Wait for cart update confirmation
    await this.helpers.waitForElement('[data-testid="cart-notification"]');
  }

  async selectProductImage(index: number) {
    const image = this.productImages.nth(index);
    await image.click();
  }

  async viewSpecifications() {
    await this.specificationsTabs.click();
    await this.helpers.waitForElement('[data-testid="specifications-content"]');
  }

  async viewReviews() {
    await this.helpers.scrollToElement('[data-testid="reviews-section"]');
  }

  async clickRecommendedProduct(index: number = 0) {
    const product = this.recommendedProducts.nth(index);
    await product.click();
    await this.helpers.waitForNavigation();
  }

  async getProductTitle(): Promise<string> {
    return await this.productTitle.textContent() || '';
  }

  async getProductPrice(): Promise<string> {
    return await this.productPrice.textContent() || '';
  }

  async isLoaded(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="product-page"]');
  }

  async isPriceComparisonVisible(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="price-comparison"]');
  }
}