/**
 * Mock para auth.service
 */

export const authService = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  setPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
  oauthLogin: jest.fn(),
};
