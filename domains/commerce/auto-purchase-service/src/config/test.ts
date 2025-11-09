export const TEST_CONFIG = {
  // Disable Order Service calls during testing
  DISABLE_ORDER_SERVICE: process.env.NODE_ENV === 'test',
  
  // Reduce logging during tests
  LOG_LEVEL: process.env.NODE_ENV === 'test' ? 'error' : 'info',
  
  // Faster timeouts for testing
  PURCHASE_TIMEOUT_MS: process.env.NODE_ENV === 'test' ? 5000 : 300000,
  
  // Disable confirmation handling during tests
  ENABLE_CONFIRMATION_HANDLING: process.env.NODE_ENV !== 'test',
};