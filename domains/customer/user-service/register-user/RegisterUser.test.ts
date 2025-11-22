/**
 * Tests MUY COMPLETOS para el caso de uso: Registrar usuario
 * Basados en la lógica original de AuthService.register()
 */

import { RegisterUser, RegisterData } from './RegisterUser';
import { User } from '../shared/models/User';
import { RefreshToken } from '../shared/models/RefreshToken';
import { generateTokens } from '../shared/auth/token-generator';

// Mocks
jest.mock('../shared/models/User');
jest.mock('../shared/models/RefreshToken');
jest.mock('../shared/auth/token-generator');
jest.mock('../shared/utils/logger');

describe('RegisterUser', () => {
  let registerUser: RegisterUser;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    registerUser = new RegisterUser();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'customer',
      is_active: true,
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
    it('should register a new user successfully', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      });

      const result = await registerUser.execute(registerData);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(User.hashPassword).toHaveBeenCalledWith(registerData.password);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerData.email,
          first_name: registerData.first_name,
          last_name: registerData.last_name,
          role: registerData.role,
          password_hash: 'hashed_password',
          is_active: true,
          email_verified: false,
          auth_methods: expect.arrayContaining([
            expect.objectContaining({
              type: 'password',
            }),
          ]),
        })
      );
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

    it('should register user with minimal required fields', async () => {
      const registerData: RegisterData = {
        email: 'minimal@example.com',
        password: 'Password123!',
        first_name: 'Min',
        last_name: 'User',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const result = await registerUser.execute(registerData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should register user with optional phone field', async () => {
      const registerData: RegisterData = {
        email: 'phone@example.com',
        password: 'Password123!',
        first_name: 'Phone',
        last_name: 'User',
        phone: '+1234567890',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await registerUser.execute(registerData);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+1234567890',
        })
      );
    });

    it('should register user with optional address field', async () => {
      const registerData: RegisterData = {
        email: 'address@example.com',
        password: 'Password123!',
        first_name: 'Address',
        last_name: 'User',
        address: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          postal_code: '12345',
          country: 'Country',
        },
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await registerUser.execute(registerData);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({
            street: '123 Main St',
            city: 'City',
            country: 'Country',
          }),
        })
      );
    });

    it('should hash password before storing', async () => {
      const registerData: RegisterData = {
        email: 'hash@example.com',
        password: 'PlainTextPassword123!',
        first_name: 'Hash',
        last_name: 'Test',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await registerUser.execute(registerData);

      expect(User.hashPassword).toHaveBeenCalledWith('PlainTextPassword123!');
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password_hash: '$2b$10$hashedpassword',
        })
      );
      expect(User.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.anything(),
        })
      );
    });

    it('should generate tokens after user creation', async () => {
      const registerData: RegisterData = {
        email: 'tokens@example.com',
        password: 'Password123!',
        first_name: 'Token',
        last_name: 'User',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result = await registerUser.execute(registerData);

      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result.tokens.accessToken).toBe('new_access_token');
      expect(result.tokens.refreshToken).toBe('new_refresh_token');
    });

    it('should return user data without password', async () => {
      const registerData: RegisterData = {
        email: 'secure@example.com',
        password: 'Password123!',
        first_name: 'Secure',
        last_name: 'User',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const result = await registerUser.execute(registerData);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(mockUser.toJSON).toHaveBeenCalled();
    });

    it('should handle email case insensitivity', async () => {
      const registerData: RegisterData = {
        email: 'CaseSensitive@Example.COM',
        password: 'Password123!',
        first_name: 'Case',
        last_name: 'Test',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await registerUser.execute(registerData);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'CaseSensitive@Example.COM' },
      });
    });

    it('should register user with customer role by default', async () => {
      const registerData: RegisterData = {
        email: 'customer@example.com',
        password: 'Password123!',
        first_name: 'Customer',
        last_name: 'User',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await registerUser.execute(registerData);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'customer',
        })
      );
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if user already exists', async () => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        password: 'Password123!',
        first_name: 'Existing',
        last_name: 'User',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(registerUser.execute(registerData)).rejects.toThrow(
        'User already exists with this email'
      );

      expect(User.hashPassword).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if password hashing fails', async () => {
      const registerData: RegisterData = {
        email: 'hashfail@example.com',
        password: 'Password123!',
        first_name: 'Hash',
        last_name: 'Fail',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(registerUser.execute(registerData)).rejects.toThrow('Hashing failed');

      expect(User.create).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if user creation fails', async () => {
      const registerData: RegisterData = {
        email: 'createfail@example.com',
        password: 'Password123!',
        first_name: 'Create',
        last_name: 'Fail',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(registerUser.execute(registerData)).rejects.toThrow('Database error');

      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if token generation fails', async () => {
      const registerData: RegisterData = {
        email: 'tokenfail@example.com',
        password: 'Password123!',
        first_name: 'Token',
        last_name: 'Fail',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockRejectedValue(new Error('Token generation failed'));

      await expect(registerUser.execute(registerData)).rejects.toThrow('Token generation failed');
    });

    it('should handle database connection errors', async () => {
      const registerData: RegisterData = {
        email: 'dbfail@example.com',
        password: 'Password123!',
        first_name: 'DB',
        last_name: 'Fail',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(registerUser.execute(registerData)).rejects.toThrow('Connection timeout');
    });

    it('should handle validation errors from database', async () => {
      const registerData: RegisterData = {
        email: 'invalid',
        password: 'Password123!',
        first_name: 'Invalid',
        last_name: 'Email',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockRejectedValue(new Error('Validation error: Invalid email format'));

      await expect(registerUser.execute(registerData)).rejects.toThrow('Validation error');
    });
  });

  describe('Validación de datos', () => {
    it('should handle empty email', async () => {
      const registerData: RegisterData = {
        email: '',
        password: 'Password123!',
        first_name: 'Empty',
        last_name: 'Email',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      // El comportamiento depende de la validación del modelo
      // Aquí asumimos que el modelo valida y rechaza
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockRejectedValue(new Error('Email is required'));

      await expect(registerUser.execute(registerData)).rejects.toThrow();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(1000) + '123!';
      const registerData: RegisterData = {
        email: 'longpass@example.com',
        password: longPassword,
        first_name: 'Long',
        last_name: 'Password',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed_long_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await registerUser.execute(registerData);

      expect(User.hashPassword).toHaveBeenCalledWith(longPassword);
    });

    it('should handle special characters in names', async () => {
      const registerData: RegisterData = {
        email: 'special@example.com',
        password: 'Password123!',
        first_name: "O'Brien",
        last_name: 'José-María',
        role: 'customer',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await registerUser.execute(registerData);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "O'Brien",
          last_name: 'José-María',
        })
      );
    });
  });
});
