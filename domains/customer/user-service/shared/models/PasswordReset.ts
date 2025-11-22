import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import crypto from 'crypto';

export interface PasswordResetAttributes {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordResetCreationAttributes extends Optional<PasswordResetAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class PasswordReset extends Model<PasswordResetAttributes, PasswordResetCreationAttributes> implements PasswordResetAttributes {
  public id!: number;
  public user_id!: number;
  public token!: string;
  public expires_at!: Date;
  public used!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Static methods
  public static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public static async createResetToken(userId: number): Promise<PasswordReset> {
    // Invalidate any existing tokens for this user
    await PasswordReset.update(
      { used: true },
      { where: { user_id: userId, used: false } }
    );

    // Create new token (expires in 1 hour)
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    return PasswordReset.create({
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: false,
    });
  }

  public static async validateToken(token: string): Promise<PasswordReset | null> {
    const { Op } = require('sequelize');
    const resetToken = await PasswordReset.findOne({
      where: {
        token,
        used: false,
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
    });

    return resetToken;
  }

  public async markAsUsed(): Promise<void> {
    this.used = true;
    await this.save();
  }

  public isExpired(): boolean {
    return new Date() > this.expires_at;
  }
}

PasswordReset.init(
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
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: 'PasswordReset',
    tableName: 'password_resets',
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
        fields: ['used'],
      },
    ],
  }
);