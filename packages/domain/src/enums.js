const UserRole = {
  CUSTOMER: 'CUSTOMER',
  PROFESSIONAL: 'PROFESSIONAL',
  ADMIN: 'ADMIN',
};

const ProfessionalStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAUSED: 'PAUSED',
};

const ServiceRequestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
};

const ReviewStatus = {
  VISIBLE: 'VISIBLE',
  HIDDEN: 'HIDDEN',
};

const AuthProvider = {
  PASSWORD: 'PASSWORD',
  GOOGLE: 'GOOGLE',
  APPLE: 'APPLE',
};

const NotificationType = {
  SERVICE_REQUEST_CREATED: 'SERVICE_REQUEST_CREATED',
  SERVICE_REQUEST_UPDATED: 'SERVICE_REQUEST_UPDATED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  REVIEW_CREATED: 'REVIEW_CREATED',
  ADMIN_ACTION: 'ADMIN_ACTION',
};

const ServiceRequestSort = {
  RELEVANCE: 'relevance',
  RATING_DESC: 'rating_desc',
  EXPERIENCE_DESC: 'experience_desc',
  REVIEW_COUNT_DESC: 'review_count_desc',
};

module.exports = {
  AuthProvider,
  NotificationType,
  ProfessionalStatus,
  ReviewStatus,
  ServiceRequestSort,
  ServiceRequestStatus,
  UserRole,
};
