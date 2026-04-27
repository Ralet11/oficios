'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_service_requests_status" ADD VALUE IF NOT EXISTS 'AWAITING_PRO_CONFIRMATION';`,
    );

    await queryInterface.addColumn('service_requests', 'service_need_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'service_needs',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addColumn('service_requests', 'origin', {
      type: Sequelize.ENUM('DIRECT_INVITE', 'PUBLIC_BOARD'),
      allowNull: true,
    });

    await queryInterface.addColumn('service_requests', 'close_reason', {
      type: Sequelize.ENUM(
        'CUSTOMER_CANCELLED',
        'PROFESSIONAL_REJECTED',
        'CUSTOMER_SELECTED_OTHER',
        'BOARD_CLOSED',
        'EXPIRED',
      ),
      allowNull: true,
    });

    await queryInterface.addIndex('service_requests', ['service_need_id']);
    await queryInterface.addIndex('service_requests', ['service_need_id', 'professional_id'], {
      name: 'service_requests_service_need_professional_unique',
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('service_requests', 'service_requests_service_need_professional_unique');
    await queryInterface.removeIndex('service_requests', ['service_need_id']);
    await queryInterface.removeColumn('service_requests', 'close_reason');
    await queryInterface.removeColumn('service_requests', 'origin');
    await queryInterface.removeColumn('service_requests', 'service_need_id');
  },
};
