'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('reviews', 'reviewer_role', {
      type: Sequelize.ENUM('CUSTOMER', 'PROFESSIONAL'),
      allowNull: false,
      defaultValue: 'CUSTOMER',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('reviews', 'reviewer_role');
  },
};