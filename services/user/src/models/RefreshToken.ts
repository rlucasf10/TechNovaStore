import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import crypto from 'crypto';

export interface RefreshTokenAttributes {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  revoked: boolean;
  device_info?: string;
  ip_address?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: number;
  public user_id!: number;
  public token!: string;
  public expires_at!: Date;
  public revoked!: boolean;
  public device_info?: string;
  public ip_address?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Static methods
  public static generateToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  public static async createToken(
    userId: number, 
    expiresIn: string = '7d',
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<RefreshToken> {
    const token = this.generateToken();
    const expiresAt = new Date();
    
    // Parse expiration time (simple implementation for common formats)
    if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn.slice(0, -1));
      expiresAt.setDate(expiresAt.getDate() + days);
    } else if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn.slice(0, -1));
      expiresAt.setHours(expiresAt.getHours() + hours);
    } else {
      // Default to 7 days
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    return RefreshToken.create({
      user_id: userId,
      token,
      expires_at: expiresAt,
      revoked: false,
      device_info: deviceInfo,
      ip_address: ipAddress,
    });
  }

  public static async validateToken(token: string): Promise<RefreshToken | null> {
    const { Op } = require('sequelize');
    const refreshToken = await RefreshToken.findOne({
      where: {
        token,
        revoked: false,
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
    });

    return refreshToken;
  }

  public static async revokeToken(token: string): Promise<boolean> {
    const result = await RefreshToken.update(
      { revoked: true },
      { where: { token, revoked: false } }
    );

    return result[0] > 0;
  }

  public static async revokeAllUserTokens(userId: number): Promise<number> {
    const result = await RefreshToken.update(
      { revoked: true },
      { where: { user_id: userId, revoked: false } }
    );

    return result[0];
  }

  public static async cleanupExpiredTokens(): Promise<number> {
    const { Op } = require('sequelize');
    const result = await RefreshToken.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date(),
        },
      },
    });

    return result;
  }

  public async revoke(): Promise<void> {
    this.revoked = true;
    await this.save();
  }

  public isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  public isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 compatible
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['token'],
        unique: true,
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['revoked'],
      },
      {
        fields: ['user_id', 'revoked'],
      },
    ],
  }
);