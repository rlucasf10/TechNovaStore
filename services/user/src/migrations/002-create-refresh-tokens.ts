import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('refresh_tokens', {
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
  });

  // Create indexes
  await queryInterface.addIndex('refresh_tokens', ['token'], {
    unique: true,
    name: 'refresh_tokens_token_unique',
  });

  await queryInterface.addIndex('refresh_tokens', ['user_id'], {
    name: 'refresh_tokens_user_id_index',
  });

  await queryInterface.addIndex('refresh_tokens', ['expires_at'], {
    name: 'refresh_tokens_expires_at_index',
  });

  await queryInterface.addIndex('refresh_tokens', ['revoked'], {
    name: 'refresh_tokens_revoked_index',
  });

  await queryInterface.addIndex('refresh_tokens', ['user_id', 'revoked'], {
    name: 'refresh_tokens_user_id_revoked_index',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('refresh_tokens');
};