const { DataTypes } = require('sequelize');
const {
  AuthProvider,
  ProfessionalStatus,
  ReviewStatus,
  ServiceRequestStatus,
} = require('@oficios/domain');

function initModels(sequelize) {
  const commonOptions = {
    underscored: true,
    timestamps: true,
  };

  const User = sequelize.define(
    'User',
    {
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: true },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: true },
      roles: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: ['CUSTOMER'],
      },
    },
    commonOptions,
  );

  const AuthIdentity = sequelize.define(
    'AuthIdentity',
    {
      provider: {
        type: DataTypes.ENUM(...Object.values(AuthProvider)),
        allowNull: false,
      },
      providerUserId: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
    },
    {
      ...commonOptions,
      indexes: [{ unique: true, fields: ['provider', 'provider_user_id'] }],
    },
  );

  const Session = sequelize.define(
    'Session',
    {
      tokenHash: { type: DataTypes.STRING, allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      userAgent: { type: DataTypes.STRING, allowNull: true },
      ipAddress: { type: DataTypes.STRING, allowNull: true },
    },
    commonOptions,
  );

  const ProfessionalProfile = sequelize.define(
    'ProfessionalProfile',
    {
      status: {
        type: DataTypes.ENUM(...Object.values(ProfessionalStatus)),
        allowNull: false,
        defaultValue: ProfessionalStatus.DRAFT,
      },
      rejectionReason: { type: DataTypes.TEXT, allowNull: true },
      businessName: { type: DataTypes.STRING, allowNull: false },
      headline: { type: DataTypes.STRING, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      yearsExperience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ratingAverage: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      reviewCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      completedJobsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      responseTimeMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
      availableNow: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      placeId: { type: DataTypes.STRING, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      province: { type: DataTypes.STRING, allowNull: true },
      lat: { type: DataTypes.FLOAT, allowNull: true },
      lng: { type: DataTypes.FLOAT, allowNull: true },
      contactPhone: { type: DataTypes.STRING, allowNull: true },
      contactWhatsApp: { type: DataTypes.STRING, allowNull: true },
      contactEmail: { type: DataTypes.STRING, allowNull: true },
      avatarUrl: { type: DataTypes.STRING, allowNull: true },
      coverUrl: { type: DataTypes.STRING, allowNull: true },
      photoUrls: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    },
    commonOptions,
  );

  const Category = sequelize.define(
    'Category',
    {
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    commonOptions,
  );

  const ProfessionalCategory = sequelize.define('ProfessionalCategory', {}, commonOptions);

  const ServiceArea = sequelize.define(
    'ServiceArea',
    {
      placeId: { type: DataTypes.STRING, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: false },
      province: { type: DataTypes.STRING, allowNull: false },
      lat: { type: DataTypes.FLOAT, allowNull: true },
      lng: { type: DataTypes.FLOAT, allowNull: true },
      radiusKm: { type: DataTypes.FLOAT, allowNull: false },
    },
    commonOptions,
  );

  const ProfessionalWorkPost = sequelize.define(
    'ProfessionalWorkPost',
    {
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      photoUrls: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      highlightLines: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    commonOptions,
  );

  const ServiceRequest = sequelize.define(
    'ServiceRequest',
    {
      status: {
        type: DataTypes.ENUM(...Object.values(ServiceRequestStatus)),
        allowNull: false,
        defaultValue: ServiceRequestStatus.PENDING,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      customerMessage: { type: DataTypes.TEXT, allowNull: false },
      preferredDate: { type: DataTypes.DATE, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: false },
      province: { type: DataTypes.STRING, allowNull: false },
      addressLine: { type: DataTypes.STRING, allowNull: false },
      placeId: { type: DataTypes.STRING, allowNull: true },
      lat: { type: DataTypes.FLOAT, allowNull: true },
      lng: { type: DataTypes.FLOAT, allowNull: true },
      budgetAmount: { type: DataTypes.FLOAT, allowNull: true },
      budgetCurrency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ARS' },
      acceptedAt: { type: DataTypes.DATE, allowNull: true },
      rejectedAt: { type: DataTypes.DATE, allowNull: true },
      cancelledAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      contactUnlockedAt: { type: DataTypes.DATE, allowNull: true },
    },
    commonOptions,
  );

  const ServiceRequestMessage = sequelize.define(
    'ServiceRequestMessage',
    {
      body: { type: DataTypes.TEXT, allowNull: false },
      isSystemMessage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    commonOptions,
  );

  const Review = sequelize.define(
    'Review',
    {
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM(...Object.values(ReviewStatus)),
        allowNull: false,
        defaultValue: ReviewStatus.VISIBLE,
      },
    },
    {
      ...commonOptions,
      indexes: [{ unique: true, fields: ['service_request_id'] }],
    },
  );

  const Notification = sequelize.define(
    'Notification',
    {
      type: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    commonOptions,
  );

  const AdminActionLog = sequelize.define(
    'AdminActionLog',
    {
      actionType: { type: DataTypes.STRING, allowNull: false },
      targetType: { type: DataTypes.STRING, allowNull: false },
      targetId: { type: DataTypes.STRING, allowNull: false },
      metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    commonOptions,
  );

  User.hasMany(AuthIdentity, { as: 'authIdentities', foreignKey: 'userId' });
  AuthIdentity.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  User.hasMany(Session, { as: 'sessions', foreignKey: 'userId' });
  Session.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  User.hasOne(ProfessionalProfile, { as: 'professionalProfile', foreignKey: 'userId' });
  ProfessionalProfile.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  ProfessionalProfile.belongsToMany(Category, {
    through: ProfessionalCategory,
    as: 'categories',
    foreignKey: 'professionalProfileId',
  });
  Category.belongsToMany(ProfessionalProfile, {
    through: ProfessionalCategory,
    as: 'professionals',
    foreignKey: 'categoryId',
  });

  ProfessionalProfile.hasMany(ServiceArea, { as: 'serviceAreas', foreignKey: 'professionalProfileId' });
  ServiceArea.belongsTo(ProfessionalProfile, { as: 'professionalProfile', foreignKey: 'professionalProfileId' });

  ProfessionalProfile.hasMany(ProfessionalWorkPost, { as: 'workPosts', foreignKey: 'professionalProfileId' });
  ProfessionalWorkPost.belongsTo(ProfessionalProfile, { as: 'professionalProfile', foreignKey: 'professionalProfileId' });

  User.hasMany(ServiceRequest, { as: 'customerRequests', foreignKey: 'customerId' });
  ServiceRequest.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

  ProfessionalProfile.hasMany(ServiceRequest, { as: 'serviceRequests', foreignKey: 'professionalId' });
  ServiceRequest.belongsTo(ProfessionalProfile, { as: 'professional', foreignKey: 'professionalId' });

  Category.hasMany(ServiceRequest, { as: 'serviceRequests', foreignKey: 'categoryId' });
  ServiceRequest.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });

  ServiceRequest.hasMany(ServiceRequestMessage, { as: 'messages', foreignKey: 'serviceRequestId' });
  ServiceRequestMessage.belongsTo(ServiceRequest, { as: 'serviceRequest', foreignKey: 'serviceRequestId' });

  User.hasMany(ServiceRequestMessage, { as: 'sentMessages', foreignKey: 'senderUserId' });
  ServiceRequestMessage.belongsTo(User, { as: 'sender', foreignKey: 'senderUserId' });

  ServiceRequest.hasOne(Review, { as: 'review', foreignKey: 'serviceRequestId' });
  Review.belongsTo(ServiceRequest, { as: 'serviceRequest', foreignKey: 'serviceRequestId' });
  Review.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewerUserId' });
  Review.belongsTo(ProfessionalProfile, { as: 'professional', foreignKey: 'professionalId' });

  User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
  Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  User.hasMany(AdminActionLog, { as: 'adminLogs', foreignKey: 'adminUserId' });
  AdminActionLog.belongsTo(User, { as: 'admin', foreignKey: 'adminUserId' });

  return {
    AdminActionLog,
    AuthIdentity,
    Category,
    Notification,
    ProfessionalCategory,
    ProfessionalProfile,
    ProfessionalWorkPost,
    Review,
    ServiceArea,
    ServiceRequest,
    ServiceRequestMessage,
    Session,
    User,
  };
}

module.exports = {
  initModels,
};
