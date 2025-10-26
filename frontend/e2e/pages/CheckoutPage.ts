import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class CheckoutPage {
  private helpers: TestHelpers;

  // Locators
  readonly shippingForm: Locator;
  readonly billingForm: Locator;
  readonly paymentForm: Locator;
  readonly orderSummary: Locator;
  readonly placeOrderButton: Locator;
  readonly backToCartButton: Locator;
  readonly stepIndicator: Locator;
  readonly nextStepButton: Locator;
  readonly previousStepButton: Locator;

  // Form fields
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly postalCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly paymentMethodSelect: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Initialize locators
    this.shippingForm = page.locator('[data-testid="shipping-form"]');
    this.billingForm = page.locator('[data-testid="billing-form"]');
    this.paymentForm = page.locator('[data-testid="payment-form"]');
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.placeOrderButton = page.locator('[data-testid="place-order"]');
    this.backToCartButton = page.locator('[data-testid="back-to-cart"]');
    this.stepIndicator = page.locator('[data-testid="step-indicator"]');
    this.nextStepButton = page.locator('[data-testid="next-step"]');
    this.previousStepButton = page.locator('[data-testid="previous-step"]');

    // Form fields
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.firstNameInput = page.locator('[data-testid="firstname-input"]');
    this.lastNameInput = page.locator('[data-testid="lastname-input"]');
    this.addressInput = page.locator('[data-testid="address-input"]');
    this.cityInput = page.locator('[data-testid="city-input"]');
    this.postalCodeInput = page.locator('[data-testid="postal-code-input"]');
    this.phoneInput = page.locator('[data-testid="phone-input"]');
    this.paymentMethodSelect = page.locator('[data-testid="payment-method-select"]');
  }

  async goto() {
    await this.page.goto('/checkout');
    await this.helpers.waitForPageLoad();
  }

  async fillShippingInfo(shippingData: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  }) {
    await this.helpers.fillField('[data-testid="email-input"]', shippingData.email);
    await this.helpers.fillField('[data-testid="firstname-input"]', shippingData.firstName);
    await this.helpers.fillField('[data-testid="lastname-input"]', shippingData.lastName);
    await this.helpers.fillField('[data-testid="address-input"]', shippingData.address);
    await this.helpers.fillField('[data-testid="city-input"]', shippingData.city);
    await this.helpers.fillField('[data-testid="postal-code-input"]', shippingData.postalCode);
    await this.helpers.fillField('[data-testid="phone-input"]', shippingData.phone);
  }

  async selectPaymentMethod(method: string) {
    await this.paymentMethodSelect.selectOption(method);
  }

  async proceedToNextStep() {
    await this.nextStepButton.click();
    await this.helpers.waitForPageLoad();
  }

  async goToPreviousStep() {
    await this.previousStepButton.click();
    await this.helpers.waitForPageLoad();
  }

  async placeOrder() {
    await this.placeOrderButton.click();
    
    // Wait for order confirmation or redirect
    await this.helpers.waitForNavigation();
  }

  async backToCart() {
    await this.backToCartButton.click();
    await this.helpers.waitForNavigation('/carrito');
  }

  async getCurrentStep(): Promise<string> {
    const activeStep = this.page.locator('[data-testid="step-indicator"] .active');
    return await activeStep.textContent() || '';
  }

  async getOrderTotal(): Promise<string> {
    const totalElement = this.page.locator('[data-testid="order-total"]');
    return await totalElement.textContent() || '';
  }

  async isLoaded(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="checkout-page"]');
  }

  async isFormValid(): Promise<boolean> {
    const submitButton = this.placeOrderButton;
    return await submitButton.isEnabled();
  }
}