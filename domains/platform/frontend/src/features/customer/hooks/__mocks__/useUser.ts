/**
 * Mock para useUser hook
 */

export const useUser = jest.fn(() => ({
  user: {
    id: 1,
    email: 'test@example.com',
    first_name: 'Juan',
    last_name: 'Pérez',
    phone: '123456789',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  loading: false,
  error: null,
  refetch: jest.fn()
}));
