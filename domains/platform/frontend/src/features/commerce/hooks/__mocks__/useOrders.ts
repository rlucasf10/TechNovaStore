/**
 * Mock para useOrders hook
 */

export const useOrders = jest.fn(() => ({
  orders: [],
  loading: false,
  error: null,
  refetch: jest.fn(),
}));
