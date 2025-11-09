/**
 * Mock para notification.store
 */

export const useNotificationStore = jest.fn(() => ({
  notifications: [],
  addNotification: jest.fn(),
  removeNotification: jest.fn(),
  clearNotifications: jest.fn(),
}));
