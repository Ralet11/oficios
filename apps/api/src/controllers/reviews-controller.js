const { ReviewStatus, ServiceRequestStatus } = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { recalculateProfessionalStats } = require('../services/professionals');

async function createReview(req, res) {
  const payload = req.validated.body;
  const serviceRequest = await req.models.ServiceRequest.findByPk(payload.serviceRequestId, {
    include: [{ model: req.models.ProfessionalProfile, as: 'professional' }],
  });

  if (!serviceRequest) {
    throw new AppError('Service request not found', 404);
  }

  if (serviceRequest.customerId !== req.auth.user.id) {
    throw new AppError('Only the customer can review the service', 403);
  }

  if (![ServiceRequestStatus.ACCEPTED, ServiceRequestStatus.COMPLETED].includes(serviceRequest.status)) {
    throw new AppError('Review only allowed after acceptance or completion', 422);
  }

  const existingReview = await req.models.Review.findOne({
    where: { serviceRequestId: serviceRequest.id },
  });

  if (existingReview) {
    throw new AppError('A review already exists for this request', 409);
  }

  const review = await req.models.Review.create({
    serviceRequestId: serviceRequest.id,
    reviewerUserId: req.auth.user.id,
    professionalId: serviceRequest.professionalId,
    rating: payload.rating,
    comment: payload.comment,
    status: ReviewStatus.VISIBLE,
  });

  await recalculateProfessionalStats(req.models, serviceRequest.professionalId);

  res.status(201).json({
    data: review,
  });
}

async function listReviews(req, res) {
  const filters = req.validated.query;
  const where = {};

  if (filters.professionalId) {
    where.professionalId = filters.professionalId;
  }

  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = ReviewStatus.VISIBLE;
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;

  const { rows, count } = await req.models.Review.findAndCountAll({
    where,
    include: [
      { model: req.models.User, as: 'reviewer' },
      { model: req.models.ServiceRequest, as: 'serviceRequest' },
    ],
    order: [['createdAt', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  res.json({
    data: rows,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    },
  });
}

module.exports = {
  createReview,
  listReviews,
};
