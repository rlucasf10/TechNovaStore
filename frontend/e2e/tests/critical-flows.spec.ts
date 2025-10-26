import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/products**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'test-product-1',
              name: 'Test Laptop',
              price: 999.99,
              image: '/images/test-laptop.jpg',
              category: 'Laptops'
            }
          ],
          total: 1
        })
      });
    });
  });

  test('Complete purchase flow - Browse to Checkout', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Step 1: Navigate to home page
    await homePage.goto();
    await expect(page).toHaveTitle(/TechNovaStore/);

    // Step 2: Search for a product
    await homePage.searchProduct('laptop');
    await expect(page).toHaveURL(/productos/);

    // Step 3: Select a product
    await homePage.clickFeaturedProduct(0);
    await expect(productPage.productTitle).toBeVisible();

    // Step 4: Add product to cart
    await productPage.addToCart(1);
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();

    // Step 5: Go to cart
    await homePage.openCart();
    await expect(cartPage.cartItems).toHaveCount(1);

    // Step 6: Proceed to checkout
    await cartPage.proceedToCheckout();
    await expect(checkoutPage.shippingForm).toBeVisible();

    // Step 7: Fill shipping information
    await checkoutPage.fillShippingInfo({
      email: 'test@example.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      address: 'Calle Test 123',
      city: 'Madrid',
      postalCode: '28001',
      phone: '+34 600 123 456'
    });

    // Step 8: Select payment method
    await checkoutPage.selectPaymentMethod('credit-card');

    // Step 9: Verify order can be placed
    await expect(checkoutPage.placeOrderButton).toBeEnabled();
  });

  test('Product search and filtering', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    // Test search functionality
    await homePage.searchProduct('gaming');
    await expect(page).toHaveURL(/productos.*search=gaming/);

    // Test category filtering
    await homePage.selectCategory('Laptops');
    await expect(page).toHaveURL(/productos.*category=laptops/);
  });

  test('Cart management operations', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    // Add multiple products to cart
    await homePage.goto();
    await homePage.clickFeaturedProduct(0);
    await productPage.addToCart(2);

    await homePage.goto();
    await homePage.clickFeaturedProduct(1);
    await productPage.addToCart(1);

    // Go to cart and verify items
    await homePage.openCart();
    await expect(cartPage.cartItems).toHaveCount(2);

    // Update quantity
    await cartPage.updateItemQuantity(0, 3);

    // Remove an item
    await cartPage.removeItem(1);
    await expect(cartPage.cartItems).toHaveCount(1);
  });

  test('Price comparison functionality', async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.goto('test-product-1');

    // Verify price comparison is visible
    await expect(productPage.priceComparison).toBeVisible();

    // Check that multiple provider prices are shown
    const providerPrices = page.locator('[data-testid="provider-price"]');
    const priceCount = await providerPrices.count();
    expect(priceCount).toBeGreaterThan(1);
  });

  test('Responsive design - Mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const homePage = new HomePage(page);
    await homePage.goto();

    // Verify mobile navigation works
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenu).toBeVisible();

    await mobileMenu.click();
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });

  test('Chat widget functionality', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    // Open chat widget
    await homePage.openChat();
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

    // Send a test message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Hola, necesito ayuda');

    const sendButton = page.locator('[data-testid="chat-send"]');
    await sendButton.click();

    // Verify message appears
    await expect(page.locator('[data-testid="chat-message"]')).toContainText('Hola, necesito ayuda');
  });
});