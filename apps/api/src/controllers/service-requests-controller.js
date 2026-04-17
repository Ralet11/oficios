const { Op } = require('sequelize');
const { NotificationType, ServiceRequestStatus } = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { serializeServiceRequest } = require('../utils/serializers');
const { createNotification, createServiceRequestNotification } = require('../services/notifications');

async function loadServiceRequest(req, id) {
  return req.models.ServiceRequest.findByPk(id, {
    include: [
      { model: req.models.Category, as: 'category' },
      { model: req.models.User, as: 'customer' },
      {
        model: req.models.ProfessionalProfile,
        as: 'professional',
        include: [
          { model: req.models.User, as: 'user' },
          { model: req.models.Category, as: 'categories', through: { attributes: [] } },
          { model: req.models.ServiceArea, as: 'serviceAreas' },
        ],
      },
      {
        model: req.models.ServiceRequestMessage,
        as: 'messages',
        separate: true,
        include: [{ model: req.models.User, as: 'sender' }],
        order: [['createdAt', 'ASC']],
      },
      { model: req.models.Review, as: 'review' },
    ],
  });
}

function ensureParticipant(userId, serviceRequest) {
  const professionalUserId = serviceRequest.professional?.userId;
  if (![serviceRequest.customerId, professionalUserId].includes(userId)) {
    throw new AppError('You are not a participant in this request', 403);
  }
}

async function createServiceRequest(req, res) {
  const payload = req.validated.body;
  const professional = await req.models.ProfessionalProfile.findByPk(payload.professionalId, {
    include: [{ model: req.models.User, as: 'user' }],
  });

  if (!professional || professional.status !== 'APPROVED') {
    throw new AppError('Professional not available', 422);
  }

  const category = await req.models.Category.findByPk(payload.categoryId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const serviceRequest = await req.models.ServiceRequest.create({
    ...payload,
    customerId: req.auth.user.id,
    professionalId: professional.id,
  });

  await req.models.ServiceRequestMessage.create({
    serviceRequestId: serviceRequest.id,
    senderUserId: req.auth.user.id,
    body: payload.customerMessage,
    isSystemMessage: false,
  });

  await createNotification(req.models, {
    userId: professional.userId,
    type: NotificationType.SERVICE_REQUEST_CREATED,
    title: 'Nueva solicitud recibida',
    body: `Recibiste una nueva solicitud de ${req.auth.user.firstName}.`,
    payload: { serviceRequestId: serviceRequest.id },
  });

  res.status(201).json({
    data: serializeServiceRequest(await loadServiceRequest(req, serviceRequest.id), req.auth.user.id),
  });
}

async function listServiceRequests(req, res) {
  const filters = req.validated.query;
  const where = {};
  const professionalProfile = await req.models.ProfessionalProfile.findOne({
    where: { userId: req.auth.user.id },
  });

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.scope === 'customer') {
    where.customerId = req.auth.user.id;
  } else if (filters.scope === 'professional') {
    where.professionalId = professionalProfile?.id || -1;
  } else {
    where[Op.or] = [
      { customerId: req.auth.user.id },
      { professionalId: professionalProfile?.id || -1 },
    ];
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;

  const { rows, count } = await req.models.ServiceRequest.findAndCountAll({
    where,
    include: [
      { model: req.models.Category, as: 'category' },
      { model: req.models.User, as: 'customer' },
      {
        model: req.models.ProfessionalProfile,
        as: 'professional',
        include: [{ model: req.models.User, as: 'user' }],
      },
      {
        model: req.models.ServiceRequestMessage,
        as: 'messages',
        separate: true,
        limit: 1,
        order: [['createdAt', 'DESC']],
        include: [{ model: req.models.User, as: 'sender' }],
      },
      { model: req.models.Review, as: 'review' },
    ],
    order: [['updatedAt', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  res.json({
    data: rows.map((item) => serializeServiceRequest(item, req.auth.user.id)),
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    },
  });
}

async function getServiceRequest(req, res) {
  const serviceRequest = await loadServiceRequest(req, req.params.id);
  if (!serviceRequest) {
    throw new AppError('Service request not found', 404);
  }

  ensureParticipant(req.auth.user.id, serviceRequest);

  res.json({
    data: serializeServiceRequest(serviceRequest, req.auth.user.id),
  });
}

async function updateServiceRequestStatus(req, res) {
  const payload = req.validated.body;
  const serviceRequest = await loadServiceRequest(req, req.params.id);

  if (!serviceRequest) {
    throw new AppError('Service request not found', 404);
  }

  ensureParticipant(req.auth.user.id, serviceRequest);

  const isProfessional = req.auth.user.id === serviceRequest.professional.userId;
  const isCustomer = req.auth.user.id === serviceRequest.customerId;

  if ([ServiceRequestStatus.ACCEPTED, ServiceRequestStatus.REJECTED].includes(payload.status) && !isProfessional) {
    throw new AppError('Only the professional can accept or reject the request', 403);
  }

  if (payload.status === ServiceRequestStatus.CANCELLED && !isCustomer) {
    throw new AppError('Only the customer can cancel the request', 403);
  }

  if (payload.status === ServiceRequestStatus.COMPLETED && serviceRequest.status !== ServiceRequestStatus.ACCEPTED) {
    throw new AppError('Only accepted requests can be marked as completed', 422);
  }

  if (
    [
      ServiceRequestStatus.REJECTED,
      ServiceRequestStatus.CANCELLED,
      ServiceRequestStatus.COMPLETED,
      ServiceRequestStatus.EXPIRED,
    ].includes(serviceRequest.status)
  ) {
    throw new AppError('This request can no longer change state', 422);
  }

  const nextValues = { status: payload.status };
  const now = new Date();

  if (payload.status === ServiceRequestStatus.ACCEPTED) {
    nextValues.acceptedAt = now;
    nextValues.contactUnlockedAt = now;
  }
  if (payload.status === ServiceRequestStatus.REJECTED) {
    nextValues.rejectedAt = now;
  }
  if (payload.status === ServiceRequestStatus.CANCELLED) {
    nextValues.cancelledAt = now;
  }
  if (payload.status === ServiceRequestStatus.COMPLETED) {
    nextValues.completedAt = now;
  }

  await serviceRequest.update(nextValues);

  await req.models.ServiceRequestMessage.create({
    serviceRequestId: serviceRequest.id,
    senderUserId: req.auth.user.id,
    body: `Estado actualizado a ${payload.status}.`,
    isSystemMessage: true,
  });

  const targetUserId = isProfessional ? serviceRequest.customerId : serviceRequest.professional.userId;
  await createServiceRequestNotification(
    req.models,
    serviceRequest,
    targetUserId,
    'Actualización de solicitud',
    `La solicitud "${serviceRequest.title}" ahora está en estado ${payload.status}.`,
  );

  res.json({
    data: serializeServiceRequest(await loadServiceRequest(req, serviceRequest.id), req.auth.user.id),
  });
}

async function createServiceRequestMessage(req, res) {
  const serviceRequest = await loadServiceRequest(req, req.params.id);
  if (!serviceRequest) {
    throw new AppError('Service request not found', 404);
  }

  ensureParticipant(req.auth.user.id, serviceRequest);

  const message = await req.models.ServiceRequestMessage.create({
    serviceRequestId: serviceRequest.id,
    senderUserId: req.auth.user.id,
    body: req.validated.body.body,
  });

  const targetUserId =
    req.auth.user.id === serviceRequest.customerId
      ? serviceRequest.professional.userId
      : serviceRequest.customerId;

  await createNotification(req.models, {
    userId: targetUserId,
    type: NotificationType.NEW_MESSAGE,
    title: 'Nuevo mensaje',
    body: `Tienes un nuevo mensaje en la solicitud "${serviceRequest.title}".`,
    payload: { serviceRequestId: serviceRequest.id, messageId: message.id },
  });

  res.status(201).json({
    data: serializeServiceRequest(await loadServiceRequest(req, serviceRequest.id), req.auth.user.id),
  });
}

module.exports = {
  createServiceRequest,
  createServiceRequestMessage,
  getServiceRequest,
  listServiceRequests,
  updateServiceRequestStatus,
};
