/**
 * Mock para useNotifications hook
 */

export const useNotifications = jest.fn(() => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  refetch: jest.fn(),
}));
