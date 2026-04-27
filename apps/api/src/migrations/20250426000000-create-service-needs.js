'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('service_needs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      photo_urls: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      preferred_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      province: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address_line: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      place_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lat: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      lng: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      budget_amount: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      budget_currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'ARS',
      },
      contact_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_whatsapp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      visibility: {
        type: Sequelize.ENUM('DIRECT_ONLY', 'PUBLIC_BOARD'),
        allowNull: false,
        defaultValue: 'DIRECT_ONLY',
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'OPEN', 'SELECTION_PENDING_CONFIRMATION', 'MATCHED', 'CLOSED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      selected_service_request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      selection_started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      matched_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      closed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('service_needs', ['customer_id']);
    await queryInterface.addIndex('service_needs', ['status']);
    await queryInterface.addIndex('service_needs', ['visibility']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('service_needs');
  },
};
