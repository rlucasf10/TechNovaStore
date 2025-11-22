/**
 * Tests MUY COMPLETOS para el caso de uso: Validar token de acceso
 * Basados en la lógica original de AuthService.validateAccessToken()
 */

// Mock ANTES de cualquier import
jest.mock('../config', () => ({
  config: {
    jwt: {
      secret: 'test_secret',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    },
    postgresql: {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
    },
  },
}));

jest.mock('jsonwebtoken');
jest.mock('../shared/models/User');
jest.mock('../shared/models/RefreshToken');
jest.mock('../shared/models/PasswordReset');
jest.mock('../shared/models/UserConsent');
jest.mock('../shared/models/AccountDeletionRequest');

import { ValidateAccessToken } from './ValidateAccessToken';
import { User } from '../shared/models/User';
import jwt from 'jsonwebtoken';

describe('ValidateAccessToken', () => {
  let validateAccessToken: ValidateAccessToken;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    validateAccessToken = new ValidateAccessToken();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'customer',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
    };
  });

  describe('Casos exitosos', () => {
    it('should validate valid access token', async () => {
      const decoded = { id: 1, email: 'test@example.com', role: 'customer' };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await validateAccessToken.execute('valid_token');

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret');
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        valid: true,
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'customer',
          first_name: 'John',
          last_name: 'Doe',
        },
      });
    });

    it('should return user information on valid token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await validateAccessToken.execute('token');

      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(1);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should not include password in returned user data', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockResolvedValue({
        ...mockUser,
        password_hash: 'hashed_password',
      });

      const result = await validateAccessToken.execute('token');

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password_hash');
    });
  });

  describe('Manejo de errores - Token inválido', () => {
    it('should return invalid for expired token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      const result = await validateAccessToken.execute('expired_token');

      expect(result).toEqual({
        valid: false,
        error: 'Token expired',
      });
    });

    it('should return invalid for malformed token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      const result = await validateAccessToken.execute('malformed_token');

      expect(result).toEqual({
        valid: false,
        error: 'Invalid token',
      });
    });

    it('should return invalid for user not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 999 });
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await validateAccessToken.execute('token');

      expect(result).toEqual({
        valid: false,
        error: 'User not found or inactive',
      });
    });

    it('should return invalid for inactive user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockResolvedValue({ ...mockUser, is_active: false });

      const result = await validateAccessToken.execute('token');

      expect(result).toEqual({
        valid: false,
        error: 'User not found or inactive',
      });
    });

    it('should handle generic JWT errors', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unknown error');
      });

      const result = await validateAccessToken.execute('token');

      expect(result).toEqual({
        valid: false,
        error: 'Token validation failed',
      });
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt must be provided');
      });

      const result = await validateAccessToken.execute('');

      expect(result.valid).toBe(false);
    });

    it('should handle token without Bearer prefix', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await validateAccessToken.execute('raw_token_string');

      expect(result.valid).toBe(true);
    });

    it('should handle very long tokens', async () => {
      const longToken = 'A'.repeat(10000);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      const result = await validateAccessToken.execute(longToken);

      expect(result.valid).toBe(false);
    });
  });

  describe('Seguridad', () => {
    it('should not reveal specific error details', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Secret key mismatch');
      });

      const result = await validateAccessToken.execute('token');

      expect(result.error).toBe('Token validation failed');
      expect(result.error).not.toContain('Secret');
    });

    it('should verify token with correct secret', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await validateAccessToken.execute('token');

      expect(jwt.verify).toHaveBeenCalledWith('token', 'test_secret');
    });

    it('should check user is active before returning valid', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockResolvedValue({ ...mockUser, is_active: false });

      const result = await validateAccessToken.execute('token');

      expect(result.valid).toBe(false);
    });
  });

  describe('Casos edge', () => {
    it('should handle token with missing user id', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ email: 'test@example.com' });
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await validateAccessToken.execute('token');

      expect(result.valid).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await validateAccessToken.execute('token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token validation failed');
    });

    it('should handle null user gracefully', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await validateAccessToken.execute('token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('User not found or inactive');
    });
  });
});
