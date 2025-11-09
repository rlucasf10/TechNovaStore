/**
 * Mock para useAuth hook
 */

export const useAuth = jest.fn(() => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  status: 'unauthenticated',
  logout: jest.fn(),
}));
