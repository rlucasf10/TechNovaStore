import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class CartPage {
  private helpers: TestHelpers;

  // Locators
  readonly cartItems: Locator;
  readonly itemQuantity: Locator;
  readonly itemPrice: Locator;
  readonly removeItemButton: Locator;
  readonly updateQuantityButton: Locator;
  readonly subtotal: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly emptyCartMessage: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Initialize locators
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.itemQuantity = page.locator('[data-testid="item-quantity"]');
    this.itemPrice = page.locator('[data-testid="item-price"]');
    this.removeItemButton = page.locator('[data-testid="remove-item"]');
    this.updateQuantityButton = page.locator('[data-testid="update-quantity"]');
    this.subtotal = page.locator('[data-testid="cart-subtotal"]');
    this.total = page.locator('[data-testid="cart-total"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.continueShoppingButton = page.locator('[data-testid="continue-shopping"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"]');
  }

  async goto() {
    await this.page.goto('/carrito');
    await this.helpers.waitForPageLoad();
  }

  async updateItemQuantity(itemIndex: number, quantity: number) {
    const quantityInput = this.itemQuantity.nth(itemIndex);
    await quantityInput.fill(quantity.toString());
    
    const updateButton = this.updateQuantityButton.nth(itemIndex);
    await updateButton.click();
    
    // Wait for cart to update
    await this.helpers.waitForApiResponse('/api/cart');
  }

  async removeItem(itemIndex: number) {
    const removeButton = this.removeItemButton.nth(itemIndex);
    await removeButton.click();
    
    // Wait for confirmation dialog if it exists
    const confirmButton = this.page.locator('[data-testid="confirm-remove"]');
    if (await this.helpers.elementExists('[data-testid="confirm-remove"]')) {
      await confirmButton.click();
    }
    
    // Wait for cart to update
    await this.helpers.waitForApiResponse('/api/cart');
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.helpers.waitForNavigation('/checkout');
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await this.helpers.waitForNavigation('/');
  }

  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async getTotalAmount(): Promise<string> {
    return await this.total.textContent() || '';
  }

  async isCartEmpty(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="empty-cart"]');
  }

  async isLoaded(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="cart-page"]');
  }
}