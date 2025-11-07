module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('account_deletion_requests', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processed', 'cancelled', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      scheduled_deletion_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('account_deletion_requests', ['user_id']);
    await queryInterface.addIndex('account_deletion_requests', ['status']);
    await queryInterface.addIndex('account_deletion_requests', ['scheduled_deletion_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('account_deletion_requests');
  },
};