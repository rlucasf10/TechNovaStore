/**
 * Tests MUY COMPLETOS para el caso de uso: Autenticar usuario
 * Basados en la lógica original de AuthService.login()
 */

import { AuthenticateUser, LoginCredentials } from './AuthenticateUser';
import { User } from '../shared/models/User';
import { generateTokens } from '../shared/auth/token-generator';

// Mocks
jest.mock('../shared/models/User');
jest.mock('../shared/auth/token-generator');
jest.mock('../shared/utils/logger');

describe('AuthenticateUser', () => {
  let authenticateUser: AuthenticateUser;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    authenticateUser = new AuthenticateUser();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'customer',
      is_active: true,
      last_login: null,
      validatePassword: jest.fn(),
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'customer',
      }),
    };
  });

  describe('Casos exitosos', () => {
    it('should authenticate user with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      });

      const result = await authenticateUser.execute(credentials);

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: credentials.email.toLowerCase(),
          is_active: true,
        },
      });
      expect(mockUser.validatePassword).toHaveBeenCalledWith(credentials.password);
      expect(mockUser.save).toHaveBeenCalled();
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: 'test@example.com',
        }),
        tokens: {
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
        },
      });
    });

    it('should update last_login timestamp on successful login', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await authenticateUser.execute(credentials);

      expect(mockUser.last_login).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle email case insensitivity', async () => {
      const credentials: LoginCredentials = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await authenticateUser.execute(credentials);

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          is_active: true,
        },
      });
    });

    it('should generate tokens after successful authentication', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result = await authenticateUser.execute(credentials);

      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result.tokens.accessToken).toBe('new_access_token');
      expect(result.tokens.refreshToken).toBe('new_refresh_token');
    });

    it('should return user data without password', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const result = await authenticateUser.execute(credentials);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(mockUser.toJSON).toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if user not found', async () => {
      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Invalid credentials');

      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if user is inactive', async () => {
      const credentials: LoginCredentials = {
        email: 'inactive@example.com',
        password: 'Password123!',
      };

      const inactiveUser = { ...mockUser, is_active: false };
      (User.findOne as jest.Mock).mockResolvedValue(null); // findOne filtra por is_active: true

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is invalid', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'WrongPassword123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Invalid credentials');

      expect(mockUser.save).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if password validation fails', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockRejectedValue(new Error('Validation error'));

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Validation error');

      expect(mockUser.save).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if database connection fails', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Database connection failed');
    });

    it('should throw error if token generation fails', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (generateTokens as jest.Mock).mockRejectedValue(new Error('Token generation failed'));

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Token generation failed');
    });

    it('should throw error if save fails after updating last_login', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      mockUser.save.mockRejectedValue(new Error('Save failed'));

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Save failed');

      expect(generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('Seguridad', () => {
    it('should not reveal if email exists when user not found', async () => {
      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should not reveal if email exists when password is wrong', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should use same error message for both cases', async () => {
      const credentials1: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      const credentials2: LoginCredentials = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      (User.findOne as jest.Mock).mockResolvedValueOnce(null);
      
      let error1: Error | undefined;
      try {
        await authenticateUser.execute(credentials1);
      } catch (e) {
        error1 = e as Error;
      }

      (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      let error2: Error | undefined;
      try {
        await authenticateUser.execute(credentials2);
      } catch (e) {
        error2 = e as Error;
      }

      expect(error1?.message).toBe(error2?.message);
      expect(error1?.message).toBe('Invalid credentials');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty email', async () => {
      const credentials: LoginCredentials = {
        email: '',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle empty password', async () => {
      const credentials: LoginCredentials = {
        email: 'user@example.com',
        password: '',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      await expect(authenticateUser.execute(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle special characters in email', async () => {
      const credentials: LoginCredentials = {
        email: 'user+test@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await authenticateUser.execute(credentials);

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: 'user+test@example.com',
          is_active: true,
        },
      });
    });
  });
});
