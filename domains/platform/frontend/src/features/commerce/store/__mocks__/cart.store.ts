/**
 * Mock para cart.store
 */

const mockState = {
  items: [],
  total: 0,
  itemCount: 0,
  addItem: jest.fn(),
  removeItem: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getTotalPrice: jest.fn(() => 0),
  getItem: jest.fn(() => null),
}

export const useCartStore = jest.fn((selector?: any) => {
  if (selector) {
    return selector(mockState)
  }
  return mockState
})
