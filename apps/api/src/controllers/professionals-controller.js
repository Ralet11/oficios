const { ProfessionalStatus, UserRole } = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { searchProfessionals } = require('../services/professionals');
const { serializeProfessional } = require('../utils/serializers');

async function listProfessionals(req, res) {
  const result = await searchProfessionals(req.models, req.validated.query);
  res.json(result);
}

async function getProfessional(req, res) {
  const professional = await req.models.ProfessionalProfile.findByPk(req.params.id, {
    include: [
      { model: req.models.User, as: 'user' },
      { model: req.models.Category, as: 'categories', through: { attributes: [] } },
      { model: req.models.ServiceArea, as: 'serviceAreas' },
      { model: req.models.ProfessionalWorkPost, as: 'workPosts' },
      {
        model: req.models.ServiceRequest,
        as: 'serviceRequests',
        required: false,
      },
    ],
  });

  if (!professional) {
    throw new AppError('Professional not found', 404);
  }

  if (professional.status !== ProfessionalStatus.APPROVED && req.auth?.user?.id !== professional.userId) {
    throw new AppError('Professional not public', 404);
  }

  const reviews = await req.models.Review.findAll({
    where: {
      professionalId: professional.id,
      status: 'VISIBLE',
    },
    include: [{ model: req.models.User, as: 'reviewer' }],
    order: [['createdAt', 'DESC']],
  });

  res.json({
    data: serializeProfessional(professional, {
      includeContact: req.auth?.user?.id === professional.userId,
    }),
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: review.reviewer
        ? {
            id: review.reviewer.id,
            firstName: review.reviewer.firstName,
            lastName: review.reviewer.lastName,
          }
        : null,
    })),
  });
}

async function getOwnProfessionalProfile(req, res) {
  const professional = await req.models.ProfessionalProfile.findOne({
    where: { userId: req.auth.user.id },
    include: [
      { model: req.models.User, as: 'user' },
      { model: req.models.Category, as: 'categories', through: { attributes: [] } },
      { model: req.models.ServiceArea, as: 'serviceAreas' },
      { model: req.models.ProfessionalWorkPost, as: 'workPosts' },
    ],
  });

  if (!professional) {
    throw new AppError('Professional profile not found', 404);
  }

  res.json({
    data: serializeProfessional(professional, { includeContact: true }),
  });
}

async function upsertProfessionalProfile(req, res) {
  const payload = req.validated.body;
  const user = req.auth.user;
  const roles = Array.from(new Set([...(user.roles || []), UserRole.PROFESSIONAL]));
  await user.update({ roles });

  let professional = await req.models.ProfessionalProfile.findOne({
    where: { userId: user.id },
  });

  if (!professional) {
    professional = await req.models.ProfessionalProfile.create({
      userId: user.id,
      businessName: payload.businessName,
      status: ProfessionalStatus.DRAFT,
    });
  }

  await professional.update({
    ...payload,
    status:
      professional.status === ProfessionalStatus.REJECTED
        ? ProfessionalStatus.DRAFT
        : professional.status,
  });

  res.json({
    data: serializeProfessional(await professional.reload(), { includeContact: true }),
  });
}

async function updateProfessionalCategories(req, res) {
  const professional = await req.models.ProfessionalProfile.findOne({
    where: { userId: req.auth.user.id },
  });
  if (!professional) {
    throw new AppError('Professional profile not found', 404);
  }

  const categories = await req.models.Category.findAll({
    where: { id: req.validated.body.categoryIds },
  });

  if (categories.length !== req.validated.body.categoryIds.length) {
    throw new AppError('One or more categories are invalid', 422);
  }

  await professional.setCategories(categories);

  res.json({
    data: await req.models.ProfessionalProfile.findByPk(professional.id, {
      include: [{ model: req.models.Category, as: 'categories', through: { attributes: [] } }],
    }),
  });
}

async function updateProfessionalServiceAreas(req, res) {
  const professional = await req.models.ProfessionalProfile.findOne({
    where: { userId: req.auth.user.id },
  });
  if (!professional) {
    throw new AppError('Professional profile not found', 404);
  }

  await req.models.ServiceArea.destroy({
    where: { professionalProfileId: professional.id },
  });

  const areas = await Promise.all(
    req.validated.body.serviceAreas.map((area) =>
      req.models.ServiceArea.create({
        professionalProfileId: professional.id,
        ...area,
      }),
    ),
  );

  res.json({
    data: areas,
  });
}

async function updateProfessionalWorkPosts(req, res) {
  const professional = await req.models.ProfessionalProfile.findOne({
    where: { userId: req.auth.user.id },
  });
  if (!professional) {
    throw new AppError('Professional profile not found', 404);
  }

  await req.models.ProfessionalWorkPost.destroy({
    where: { professionalProfileId: professional.id },
  });

  const workPosts = await Promise.all(
    req.validated.body.workPosts.map((post, index) =>
      req.models.ProfessionalWorkPost.create({
        professionalProfileId: professional.id,
        title: post.title,
        body: post.body,
        photoUrls: post.photoUrls || [],
        highlightLines: post.highlightLines || [],
        orderIndex: index,
      })),
  );

  res.json({
    data: workPosts,
  });
}

async function submitProfessionalForApproval(req, res) {
  const professional = await req.models.ProfessionalProfile.findOne({
    where: { userId: req.auth.user.id },
    include: [
      { model: req.models.Category, as: 'categories', through: { attributes: [] } },
      { model: req.models.ServiceArea, as: 'serviceAreas' },
      { model: req.models.ProfessionalWorkPost, as: 'workPosts' },
    ],
  });

  if (!professional) {
    throw new AppError('Professional profile not found', 404);
  }

  if (!professional.bio || !professional.headline || !professional.contactPhone) {
    throw new AppError('Complete profile information before submitting for approval', 422);
  }

  if (!professional.categories?.length || !professional.serviceAreas?.length) {
    throw new AppError('Add at least one category and one service area', 422);
  }

  await professional.update({
    status: ProfessionalStatus.PENDING_APPROVAL,
    rejectionReason: null,
  });

  res.json({
    data: serializeProfessional(await professional.reload(), { includeContact: true }),
  });
}

module.exports = {
  getOwnProfessionalProfile,
  getProfessional,
  listProfessionals,
  submitProfessionalForApproval,
  updateProfessionalCategories,
  updateProfessionalServiceAreas,
  updateProfessionalWorkPosts,
  upsertProfessionalProfile,
};
