import jwt from 'jsonwebtoken';
import { config } from '@technovastore/shared-config';
import { User, UserCreationAttributes } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { PasswordReset } from '../models/PasswordReset';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends Omit<UserCreationAttributes, 'password_hash'> {
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: Partial<User>;
  error?: string;
}

export class AuthService {
  static async register(userData: RegisterData): Promise<AuthResponse> {
    const { password, ...userInfo } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      ...userInfo,
      password_hash,
    });

    logger.info(`User registered: ${user.email}`, { userId: user.id });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        is_active: true,
      } 
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  static async refreshToken(
    refreshTokenString: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    try {
      // Validate refresh token in database
      const refreshToken = await RefreshToken.validateToken(refreshTokenString);
      if (!refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Find user
      const user = await User.findByPk(refreshToken.user_id);
      if (!user || !user.is_active) {
        throw new Error('Invalid refresh token');
      }

      // Revoke the old refresh token
      await refreshToken.revoke();

      // Generate new tokens
      return this.generateTokens(user, deviceInfo, ipAddress);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async getUserById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: email.toLowerCase() } });
  }

  static async updateUser(id: number, updateData: Partial<UserCreationAttributes & { password?: string }>): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password_hash = await User.hashPassword(updateData.password);
      delete updateData.password;
    }

    await user.update(updateData);
    return user;
  }

  static async deactivateUser(id: number): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) {
      return false;
    }

    user.is_active = false;
    await user.save();
    
    logger.info(`User deactivated: ${user.email}`, { userId: user.id });
    return true;
  }

  static async requestPasswordReset(email: string): Promise<string> {
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        is_active: true,
      } 
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      throw new Error('If the email exists, a password reset link has been sent');
    }

    // Create password reset token
    const resetToken = await PasswordReset.createResetToken(user.id);

    logger.info(`Password reset requested for user: ${user.email}`, { 
      userId: user.id,
      resetTokenId: resetToken.id 
    });

    return resetToken.token;
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Validate reset token
    const resetToken = await PasswordReset.validateToken(token);
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Find user
    const user = await User.findByPk(resetToken.user_id);
    if (!user || !user.is_active) {
      throw new Error('Invalid reset token');
    }

    // Hash new password
    const password_hash = await User.hashPassword(newPassword);

    // Update user password
    await user.update({ password_hash });

    // Mark reset token as used
    await resetToken.markAsUsed();

    // Revoke all refresh tokens for security
    await RefreshToken.revokeAllUserTokens(user.id);

    logger.info(`Password reset completed for user: ${user.email}`, { 
      userId: user.id 
    });

    return true;
  }

  static async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Find user to ensure they still exist and are active
      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        return { valid: false, error: 'User not found or inactive' };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Token validation failed' };
    }
  }

  static async revokeRefreshToken(token: string): Promise<boolean> {
    return RefreshToken.revokeToken(token);
  }

  static async revokeAllUserTokens(userId: number): Promise<number> {
    return RefreshToken.revokeAllUserTokens(userId);
  }

  static async cleanupExpiredTokens(): Promise<number> {
    return RefreshToken.cleanupExpiredTokens();
  }

  private static async generateTokens(
    user: User,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as any);

    // Create refresh token in database
    const refreshTokenRecord = await RefreshToken.createToken(
      user.id,
      config.jwt.refreshExpiresIn,
      deviceInfo,
      ipAddress
    );

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
    };
  }
}