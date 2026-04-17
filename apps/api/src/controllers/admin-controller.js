const { Op } = require('sequelize');
const { ReviewStatus } = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { createNotification } = require('../services/notifications');
const { recalculateProfessionalStats } = require('../services/professionals');

async function logAction(req, actionType, targetType, targetId, metadata = {}) {
  await req.models.AdminActionLog.create({
    adminUserId: req.auth.user.id,
    actionType,
    targetType,
    targetId: String(targetId),
    metadata,
  });
}

async function getOverview(req, res) {
  const [users, professionals, pendingProfessionals, serviceRequests, reviews] = await Promise.all([
    req.models.User.count(),
    req.models.ProfessionalProfile.count(),
    req.models.ProfessionalProfile.count({ where: { status: 'PENDING_APPROVAL' } }),
    req.models.ServiceRequest.count(),
    req.models.Review.count(),
  ]);

  res.json({
    data: {
      users,
      professionals,
      pendingProfessionals,
      serviceRequests,
      reviews,
    },
  });
}

async function listUsers(req, res) {
  const { q, page, pageSize } = req.validated.query;
  const where = q
    ? {
        [Op.or]: [
          { email: { [Op.iLike]: `%${q}%` } },
          { firstName: { [Op.iLike]: `%${q}%` } },
          { lastName: { [Op.iLike]: `%${q}%` } },
        ],
      }
    : {};

  const { rows, count } = await req.models.User.findAndCountAll({
    where,
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

async function listProfessionals(req, res) {
  const { page, pageSize, status } = req.validated.query;
  const { rows, count } = await req.models.ProfessionalProfile.findAndCountAll({
    where: status ? { status } : {},
    include: [
      { model: req.models.User, as: 'user' },
      { model: req.models.Category, as: 'categories', through: { attributes: [] } },
      { model: req.models.ServiceArea, as: 'serviceAreas' },
    ],
    order: [['updatedAt', 'DESC']],
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

async function moderateProfessional(req, res) {
  const professional = await req.models.ProfessionalProfile.findByPk(req.params.id, {
    include: [{ model: req.models.User, as: 'user' }],
  });

  if (!professional) {
    throw new AppError('Professional profile not found', 404);
  }

  await professional.update(req.validated.body);
  await logAction(req, 'PROFESSIONAL_STATUS_UPDATED', 'ProfessionalProfile', professional.id, req.validated.body);

  await createNotification(req.models, {
    userId: professional.userId,
    title: 'Actualización de perfil profesional',
    body: `Tu perfil ahora está en estado ${professional.status}.`,
    payload: { professionalId: professional.id, status: professional.status },
  });

  res.json({
    data: professional,
  });
}

async function createCategory(req, res) {
  const category = await req.models.Category.create(req.validated.body);
  await logAction(req, 'CATEGORY_CREATED', 'Category', category.id, req.validated.body);

  res.status(201).json({
    data: category,
  });
}

async function listCategories(req, res) {
  const categories = await req.models.Category.findAll({
    order: [['name', 'ASC']],
  });

  res.json({
    data: categories,
  });
}

async function updateCategory(req, res) {
  const category = await req.models.Category.findByPk(req.params.id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  await category.update(req.validated.body);
  await logAction(req, 'CATEGORY_UPDATED', 'Category', category.id, req.validated.body);

  res.json({
    data: category,
  });
}

async function deleteCategory(req, res) {
  const category = await req.models.Category.findByPk(req.params.id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  await category.update({ isActive: false });
  await logAction(req, 'CATEGORY_DEACTIVATED', 'Category', category.id);

  res.status(204).send();
}

async function listReviews(req, res) {
  const { page, pageSize, status } = req.validated.query;
  const where = status ? { status } : {};

  const { rows, count } = await req.models.Review.findAndCountAll({
    where,
    include: [
      { model: req.models.User, as: 'reviewer' },
      { model: req.models.ProfessionalProfile, as: 'professional' },
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

async function moderateReview(req, res) {
  const review = await req.models.Review.findByPk(req.params.id);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await review.update(req.validated.body);
  await recalculateProfessionalStats(req.models, review.professionalId);
  await logAction(req, 'REVIEW_STATUS_UPDATED', 'Review', review.id, req.validated.body);

  res.json({
    data: review,
  });
}

async function listServiceRequests(req, res) {
  const { page, pageSize, status } = req.validated.query;
  const { rows, count } = await req.models.ServiceRequest.findAndCountAll({
    where: status ? { status } : {},
    include: [
      { model: req.models.Category, as: 'category' },
      { model: req.models.User, as: 'customer' },
      {
        model: req.models.ProfessionalProfile,
        as: 'professional',
        include: [{ model: req.models.User, as: 'user' }],
      },
    ],
    order: [['updatedAt', 'DESC']],
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
  createCategory,
  deleteCategory,
  getOverview,
  listCategories,
  listProfessionals,
  listReviews,
  listServiceRequests,
  listUsers,
  moderateProfessional,
  moderateReview,
  updateCategory,
};
