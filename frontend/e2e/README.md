# E2E Testing Suite - TechNovaStore

This directory contains the end-to-end testing suite for TechNovaStore, built with Playwright and designed to test critical user flows, visual regression, performance, and accessibility.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install

# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:critical      # Critical user flows
npm run test:e2e:visual        # Visual regression tests
npm run test:e2e:performance   # Performance tests
npm run test:e2e:accessibility # Accessibility tests
```

## 📁 Directory Structure

```
e2e/
├── fixtures/           # Test data and mock responses
│   └── test-data.ts   # Centralized test data
├── pages/             # Page Object Models
│   ├── HomePage.ts    # Home page interactions
│   ├── ProductPage.ts # Product detail page
│   ├── CartPage.ts    # Shopping cart page
│   └── CheckoutPage.ts # Checkout process
├── tests/             # Test specifications
│   ├── critical-flows.spec.ts    # Critical user journeys
│   ├── visual-regression.spec.ts # Visual comparison tests
│   ├── performance.spec.ts       # Performance benchmarks
│   └── accessibility.spec.ts     # Accessibility compliance
├── utils/             # Test utilities
│   ├── test-helpers.ts # Common test functions
│   └── mock-api.ts    # API mocking utilities
├── global-setup.ts    # Global test setup
├── global-teardown.ts # Global test cleanup
└── run-tests.ts       # Advanced test runner
```

## 🧪 Test Categories

### Critical Flows (`critical-flows.spec.ts`)
Tests the most important user journeys that directly impact business value:

- **Complete Purchase Flow**: Browse → Search → Product Detail → Add to Cart → Checkout
- **Product Search and Filtering**: Search functionality and category filtering
- **Cart Management**: Add, update, remove items from cart
- **Price Comparison**: Multi-provider price comparison functionality
- **Responsive Design**: Mobile viewport compatibility
- **Chat Widget**: AI chatbot interaction

**Requirements Covered**: 7.1, 7.2, 7.5

### Visual Regression (`visual-regression.spec.ts`)
Ensures UI consistency across releases:

- **Homepage Screenshots**: Full page and component-level comparisons
- **Product Pages**: Product details, price comparison, specifications
- **Shopping Cart**: Cart items, summary, empty states
- **Mobile Responsive**: Mobile viewport screenshots
- **Dark Mode**: Theme switching visual validation
- **Error States**: Error message and loading state screenshots

**Requirements Covered**: 7.1, 7.2, 7.5

### Performance (`performance.spec.ts`)
Monitors application performance and Core Web Vitals:

- **Page Load Times**: Homepage and critical pages under 3 seconds
- **Search Performance**: Product search response times under 2 seconds
- **Bundle Size Analysis**: JavaScript and CSS bundle optimization
- **Memory Usage**: Memory leak detection during navigation
- **Network Optimization**: Request count and duplicate request detection
- **Image Loading**: Lazy loading and image optimization validation

**Requirements Covered**: 7.1, 7.2, 7.5

### Accessibility (`accessibility.spec.ts`)
Ensures WCAG 2.1 AA compliance:

- **Automated Scanning**: axe-core integration for comprehensive accessibility testing
- **Keyboard Navigation**: Tab order and keyboard-only interaction
- **Screen Reader Compatibility**: ARIA labels, landmarks, and live regions
- **Color Contrast**: Visual accessibility and focus indicators
- **Form Accessibility**: Labels, error messages, and required field indicators
- **Mobile Accessibility**: Touch target sizes and mobile navigation
- **Dynamic Content**: Accessibility of interactive and changing content

**Requirements Covered**: 7.1, 7.2, 7.5

## 🛠️ Configuration

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Environment Variables

```bash
# Test configuration
BASE_URL=http://localhost:3000    # Application URL
CI=true                          # CI environment flag
DEBUG=false                      # Debug mode

# Performance thresholds
PERF_LOAD_TIME_THRESHOLD=3000    # Page load time limit (ms)
PERF_SEARCH_TIME_THRESHOLD=2000  # Search response time limit (ms)
PERF_BUNDLE_SIZE_THRESHOLD=1024  # JS bundle size limit (KB)

# Visual regression
UPDATE_SNAPSHOTS=false           # Update visual baselines
VISUAL_THRESHOLD=0.2            # Visual diff threshold
```

## 🎯 Page Object Model

The test suite uses the Page Object Model pattern for maintainable and reusable test code:

```typescript
// Example: HomePage usage
const homePage = new HomePage(page);
await homePage.goto();
await homePage.searchProduct('laptop');
await homePage.clickFeaturedProduct(0);
```

### Key Benefits:
- **Maintainability**: UI changes only require updates in one place
- **Reusability**: Page objects can be used across multiple tests
- **Readability**: Tests read like user actions
- **Type Safety**: Full TypeScript support with IntelliSense

## 🔧 Test Utilities

### TestHelpers Class
Common utilities for all tests:

```typescript
const helpers = new TestHelpers(page);

// Wait for elements with retry logic
await helpers.waitForElement('[data-testid="product-grid"]');

// Fill forms with validation
await helpers.fillField('#email', 'test@example.com');

// Take screenshots with descriptive names
await helpers.takeScreenshot('checkout-complete');

// Wait for API responses
await helpers.waitForApiResponse('/api/products');
```

### MockApi Class
Consistent API mocking across tests:

```typescript
const mockApi = new MockApi(page);

// Mock all endpoints with default data
await mockApi.mockAllEndpoints();

// Mock specific endpoints with custom responses
await mockApi.mockEndpoint('**/api/products', customProducts);

// Mock error responses for error handling tests
await mockApi.mockErrorResponses();
```

## 📊 Test Execution Modes

### Local Development

```bash
# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# Run specific browser
npx playwright test --project=chromium
```

### CI/CD Pipeline

```bash
# Run all tests in CI mode
npm run test:e2e

# Run with specific configuration
npm run test:e2e -- --workers=1 --retries=2
```

### Advanced Test Runner

```bash
# Use the custom test runner for advanced options
npx ts-node e2e/run-tests.ts --mode critical --browser chromium --headed
npx ts-node e2e/run-tests.ts --mode visual --workers 1
npx ts-node e2e/run-tests.ts --mode performance --timeout 60000
```

## 📈 Reporting and Analysis

### HTML Report
```bash
# Generate and view HTML report
npm run test:e2e:report
```

### Test Results
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests
- **Traces**: Detailed execution traces for debugging
- **Performance Metrics**: Core Web Vitals and custom metrics
- **Accessibility Reports**: WCAG compliance results

### CI Integration
- **GitHub Actions**: Automated test execution on PR and push
- **Artifact Upload**: Test results, screenshots, and reports
- **Performance Monitoring**: Trend analysis and alerts
- **Visual Regression**: Baseline management and diff reports

## 🚨 Troubleshooting

### Common Issues

#### Tests Timing Out
```bash
# Increase timeout
npx playwright test --timeout=60000

# Check if application is running
curl http://localhost:3000
```

#### Visual Regression Failures
```bash
# Update baselines after UI changes
npm run test:e2e:visual -- --update-snapshots

# Compare visual diffs
npm run test:e2e:report
```

#### Performance Test Failures
```bash
# Run performance tests in isolation
npm run test:e2e:performance -- --workers=1

# Check system resources during test execution
```

#### Accessibility Violations
```bash
# Run accessibility tests with detailed output
npm run test:e2e:accessibility -- --reporter=list

# Check axe-core documentation for violation details
```

### Debug Mode
```bash
# Run single test in debug mode
npx playwright test critical-flows.spec.ts --debug

# Use Playwright Inspector
npx playwright test --ui
```

## 🔄 Maintenance

### Updating Test Data
1. Modify `fixtures/test-data.ts` for new test scenarios
2. Update page objects when UI changes
3. Refresh visual baselines after design updates
4. Review and update performance thresholds

### Adding New Tests
1. Create test file in appropriate category
2. Use existing page objects or create new ones
3. Follow naming conventions and test structure
4. Add to CI pipeline if needed

### Performance Optimization
- Run tests in parallel when possible
- Use selective test execution for faster feedback
- Optimize test data and mock responses
- Monitor test execution times and optimize slow tests

## 📚 Best Practices

1. **Test Independence**: Each test should be able to run independently
2. **Data Isolation**: Use unique test data to avoid conflicts
3. **Stable Selectors**: Use `data-testid` attributes for reliable element selection
4. **Meaningful Assertions**: Test user-visible behavior, not implementation details
5. **Error Handling**: Test both happy paths and error scenarios
6. **Performance Awareness**: Keep tests fast and efficient
7. **Documentation**: Document complex test scenarios and edge cases

## 🤝 Contributing

When adding new E2E tests:

1. Follow the existing patterns and structure
2. Use the Page Object Model for UI interactions
3. Add appropriate test data to fixtures
4. Include both positive and negative test cases
5. Ensure tests work across all supported browsers
6. Update documentation for new test categories or utilities

For questions or issues, please refer to the main project documentation or create an issue in the repository.