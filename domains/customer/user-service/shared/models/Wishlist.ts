/**
 * Modelo de Wishlist (Lista de Deseos)
 * 
 * Almacena los productos guardados por cada usuario
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface WishlistAttributes {
  id: number;
  user_id: number;
  product_id: string; // ID del producto (puede ser de MongoDB)
  product_sku: string; // SKU del producto para referencia
  added_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WishlistCreationAttributes extends Optional<WishlistAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Wishlist extends Model<WishlistAttributes, WishlistCreationAttributes> implements WishlistAttributes {
  declare id: number;
  declare user_id: number;
  declare product_id: string;
  declare product_sku: string;
  declare added_at: Date;
  declare created_at: Date;
  declare updated_at: Date;
}

Wishlist.init(
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
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_sku: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    added_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    modelName: 'Wishlist',
    tableName: 'wishlists',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['product_id'],
      },
      {
        // Evitar duplicados: un usuario no puede tener el mismo producto dos veces
        unique: true,
        fields: ['user_id', 'product_id'],
      },
    ],
  }
);
