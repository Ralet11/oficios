'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('professional_profiles', 'personal_details', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    });

    await queryInterface.addColumn('professional_profiles', 'certifications', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });

    await queryInterface.addColumn('professional_profiles', 'references', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('professional_profiles', 'references');
    await queryInterface.removeColumn('professional_profiles', 'certifications');
    await queryInterface.removeColumn('professional_profiles', 'personal_details');
  },
};
