import { User } from '../src/models/User';
import { RefreshToken } from '../src/models/RefreshToken';
import { PasswordReset } from '../src/models/PasswordReset';

describe('User Service Integration Tests', () => {
  
  describe('User CRUD Operations', () => {
    it('should create a new user with password', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = await User.hashPassword(plainPassword);
      
      const userData = {
        email: 'test@example.com',
        password_hash: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.first_name).toBe(userData.first_name);
      expect(user.last_name).toBe(userData.last_name);
      expect(user.role).toBe('customer');
      expect(user.password_hash).not.toBe(plainPassword);
      expect(user.is_active).toBe(true);
      expect(user.email_verified).toBe(false);
    });

    it('should not create user with duplicate email', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const userData = {
        email: 'duplicate@example.com',
        password_hash: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      };

      await User.create(userData);

      // Try to create another user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should find user by email', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const userData = {
        email: 'findme@example.com',
        password_hash: hashedPassword,
        first_name: 'Find',
        last_name: 'Me',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      };

      const createdUser = await User.create(userData);
      const foundUser = await User.findOne({ where: { email: userData.email } });

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
      expect(foundUser?.first_name).toBe(userData.first_name);
    });

    it('should update user information', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'update@example.com',
        password_hash: hashedPassword,
        first_name: 'Old',
        last_name: 'Name',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      const userId = user.id;
      user.first_name = 'New';
      user.last_name = 'Updated';
      await user.save();

      const updatedUser = await User.findByPk(userId);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.first_name).toBe('New');
      expect(updatedUser?.last_name).toBe('Updated');
    });
  });

  describe('Password Management', () => {
    it('should hash password correctly', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = await User.hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = await User.hashPassword(plainPassword);
      
      const user = await User.create({
        email: 'verify@example.com',
        password_hash: hashedPassword,
        first_name: 'Verify',
        last_name: 'Test',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      const isValid = await user.validatePassword(plainPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hashedPassword = await User.hashPassword('CorrectPassword123!');
      const user = await User.create({
        email: 'reject@example.com',
        password_hash: hashedPassword,
        first_name: 'Reject',
        last_name: 'Test',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      const isValid = await user.validatePassword('WrongPassword123!');
      expect(isValid).toBe(false);
    });

    it('should create password reset token', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'reset@example.com',
        password_hash: hashedPassword,
        first_name: 'Reset',
        last_name: 'Test',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      const resetToken = await PasswordReset.create({
        user_id: user.id,
        token: PasswordReset.generateToken(),
        expires_at: new Date(Date.now() + 3600000), // 1 hour
        used: false
      });

      expect(resetToken).toBeDefined();
      expect(resetToken.user_id).toBe(user.id);
      expect(resetToken.token).toBeDefined();
      expect(resetToken.used).toBe(false);
    });
  });

  describe('Refresh Token Management', () => {
    it('should create refresh token for user', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'token@example.com',
        password_hash: hashedPassword,
        first_name: 'Token',
        last_name: 'Test',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      const refreshToken = await RefreshToken.create({
        user_id: user.id,
        token: RefreshToken.generateToken(),
        expires_at: new Date(Date.now() + 7 * 24 * 3600000), // 7 days
        revoked: false,
        device_info: 'Test Device'
      });

      expect(refreshToken).toBeDefined();
      expect(refreshToken.user_id).toBe(user.id);
      expect(refreshToken.token).toBeDefined();
      expect(refreshToken.revoked).toBe(false);
    });

    it('should revoke refresh token', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'revoke@example.com',
        password_hash: hashedPassword,
        first_name: 'Revoke',
        last_name: 'Test',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      const refreshToken = await RefreshToken.create({
        user_id: user.id,
        token: RefreshToken.generateToken(),
        expires_at: new Date(Date.now() + 7 * 24 * 3600000),
        revoked: false,
        device_info: 'Test Device'
      });

      refreshToken.revoked = true;
      await refreshToken.save();

      const revokedToken = await RefreshToken.findByPk(refreshToken.id);
      expect(revokedToken?.revoked).toBe(true);
    });

    it('should find all tokens for a user', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'multiple@example.com',
        password_hash: hashedPassword,
        first_name: 'Multiple',
        last_name: 'Tokens',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      // Usar el método createToken que maneja la generación de tokens de manera más segura
      await RefreshToken.createToken(user.id, '7d', 'Device 1');
      await RefreshToken.createToken(user.id, '7d', 'Device 2');

      const tokens = await RefreshToken.findAll({ where: { user_id: user.id } });
      expect(tokens.length).toBe(2);
    });
  });

  describe('User Roles', () => {
    it('should create user with customer role', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'customer@example.com',
        password_hash: hashedPassword,
        first_name: 'Customer',
        last_name: 'User',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      expect(user.role).toBe('customer');
    });

    it('should create user with admin role', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'admin@example.com',
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      expect(user.role).toBe('admin');
    });
  });

  describe('User Verification', () => {
    it('should mark user as verified', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'verify-me@example.com',
        password_hash: hashedPassword,
        first_name: 'Verify',
        last_name: 'Me',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      expect(user.email_verified).toBe(false);

      user.email_verified = true;
      await user.save();

      const verifiedUser = await User.findByPk(user.id);
      expect(verifiedUser?.email_verified).toBe(true);
    });
  });

  describe('User Activity Tracking', () => {
    it('should update last login timestamp', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'login@example.com',
        password_hash: hashedPassword,
        first_name: 'Login',
        last_name: 'Test',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      expect(user.last_login).toBeNull();

      const userId = user.id;
      user.last_login = new Date();
      await user.save();

      const updatedUser = await User.findByPk(userId);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.last_login).toBeDefined();
    });
  });

  describe('Auth Methods', () => {
    it('should check if user has password auth method', async () => {
      const hashedPassword = await User.hashPassword('TestPassword123!');
      const user = await User.create({
        email: 'authmethod@example.com',
        password_hash: hashedPassword,
        first_name: 'Auth',
        last_name: 'Method',
        role: 'customer' as const,
        is_active: true,
        email_verified: false,
        auth_methods: [{ type: 'password' as const, linkedAt: new Date() }]
      });

      expect(user.hasAuthMethod('password')).toBe(true);
      expect(user.hasAuthMethod('google')).toBe(false);
    });
  });
});
