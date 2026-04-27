'use strict';

const { DataTypes } = require('sequelize');

const commonOptions = {
  underscored: true,
  timestamps: true,
};

module.exports = (sequelize) => {
  const CustomerProfile = sequelize.define(
    'CustomerProfile',
    {
      ratingAverage: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      reviewCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      completedRequestsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      cancelledRequestsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      responseTimeMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
      memberSince: { type: DataTypes.DATE, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      tags: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      verifiedPhone: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      verifiedEmail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    commonOptions,
  );

  return CustomerProfile;
};