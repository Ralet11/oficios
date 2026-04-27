const { Op } = require('sequelize');
const {
  NotificationType,
  ServiceNeedStatus,
  ServiceRequestCloseReason,
  ServiceRequestOrigin,
  ServiceRequestStatus,
} = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { serializeServiceRequest } = require('../utils/serializers');
const { createNotification, createServiceRequestNotification } = require('../services/notifications');

const ACTIVE_SERVICE_REQUEST_STATUSES = [
  ServiceRequestStatus.PENDING,
  ServiceRequestStatus.AWAITING_PRO_CONFIRMATION,
  ServiceRequestStatus.ACCEPTED,
];

function buildServiceRequestInclude(req, options = {}) {
  const professionalInclude = [{ model: req.models.User, as: 'user' }];

  if (options.includeProfessionalMeta !== false) {
    professionalInclude.push(
      { model: req.models.Category, as: 'categories', through: { attributes: [] } },
      { model: req.models.ServiceArea, as: 'serviceAreas' },
    );
  }

  const include = [
    { model: req.models.Category, as: 'category' },
    { model: req.models.User, as: 'customer' },
    {
      model: req.models.ProfessionalProfile,
      as: 'professional',
      include: professionalInclude,
    },
    { model: req.models.ServiceNeed, as: 'serviceNeed' },
    { model: req.models.Review, as: 'review' },
  ];

  if (options.includeMessages === 'all') {
    include.push({
      model: req.models.ServiceRequestMessage,
      as: 'messages',
      separate: true,
      include: [{ model: req.models.User, as: 'sender' }],
      order: [['createdAt', 'ASC']],
    });
  } else if (options.includeMessages === 'latest') {
    include.push({
      model: req.models.ServiceRequestMessage,
      as: 'messages',
      separate: true,
      limit: 1,
      order: [['createdAt', 'DESC']],
      include: [{ model: req.models.User, as: 'sender' }],
    });
  }

  return include;
}

async function loadServiceRequest(req, id, options = {}) {
  return req.models.ServiceRequest.findByPk(id, {
    include: buildServiceRequestInclude(req, {
      includeMessages: options.includeMessages || 'all',
      includeProfessionalMeta: options.includeProfessionalMeta,
    }),
    transaction: options.transaction,
  });
}

function ensureParticipant(userId, serviceRequest) {
  const professionalUserId = serviceRequest.professional?.userId;
  if (![serviceRequest.customerId, professionalUserId].includes(userId)) {
    throw new AppError('You are not a participant in this request', 403);
  }
}

function buildContactSnapshot(user) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const phone = user.phone || null;

  return {
    contactName: fullName || null,
    contactPhone: phone,
    contactWhatsapp: phone,
    contactEmail: user.email || null,
  };
}

async function reopenSiblingRequests(req, serviceRequest, transaction) {
  if (!serviceRequest.serviceNeedId) {
    return;
  }

  const siblings = await req.models.ServiceRequest.findAll({
    where: {
      serviceNeedId: serviceRequest.serviceNeedId,
      id: { [Op.ne]: serviceRequest.id },
      status: ServiceRequestStatus.CANCELLED,
      closeReason: ServiceRequestCloseReason.CUSTOMER_SELECTED_OTHER,
    },
    transaction,
  });

  if (siblings.length === 0) {
    return;
  }

  const siblingIds = siblings.map((item) => item.id);
  await req.models.ServiceRequest.update(
    {
      status: ServiceRequestStatus.PENDING,
      closeReason: null,
      cancelledAt: null,
    },
    {
      where: { id: siblingIds },
      transaction,
    },
  );

  await req.models.ServiceRequestMessage.bulkCreate(
    siblingIds.map((id) => ({
      serviceRequestId: id,
      senderUserId: serviceRequest.customerId,
      body: 'La consulta fue reabierta porque la seleccion anterior no se confirmo.',
      isSystemMessage: true,
    })),
    { transaction },
  );
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

  const now = new Date();
  const transaction = await req.models.ServiceRequest.sequelize.transaction();
  let serviceRequest;

  try {
    const serviceNeed = await req.models.ServiceNeed.create(
      {
        ...buildContactSnapshot(req.auth.user),
        categoryId: category.id,
        title: payload.title,
        description: payload.customerMessage,
        city: payload.city,
        province: payload.province,
        addressLine: payload.addressLine,
        placeId: payload.placeId,
        preferredDate: payload.preferredDate ? new Date(payload.preferredDate) : null,
        budgetAmount: payload.budgetAmount,
        budgetCurrency: payload.budgetCurrency,
        lat: payload.lat,
        lng: payload.lng,
        customerId: req.auth.user.id,
        status: ServiceNeedStatus.OPEN,
        visibility: 'DIRECT_ONLY',
        publishedAt: now,
      },
      { transaction },
    );

    serviceRequest = await req.models.ServiceRequest.create(
      {
        ...payload,
        customerId: req.auth.user.id,
        professionalId: professional.id,
        categoryId: category.id,
        serviceNeedId: serviceNeed.id,
        origin: ServiceRequestOrigin.DIRECT_INVITE,
        status: ServiceRequestStatus.PENDING,
      },
      { transaction },
    );

    await req.models.ServiceRequestMessage.create(
      {
        serviceRequestId: serviceRequest.id,
        senderUserId: req.auth.user.id,
        body: payload.customerMessage,
        isSystemMessage: false,
      },
      { transaction },
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

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
    include: buildServiceRequestInclude(req, {
      includeMessages: 'latest',
      includeProfessionalMeta: false,
    }),
    distinct: true,
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
  const isSelectedThread = serviceRequest.serviceNeed?.selectedServiceRequestId === serviceRequest.id;
  const isSelectionPending =
    serviceRequest.serviceNeed?.status === ServiceNeedStatus.SELECTION_PENDING_CONFIRMATION;

  if ([ServiceRequestStatus.ACCEPTED, ServiceRequestStatus.REJECTED].includes(payload.status) && !isProfessional) {
    throw new AppError('Only the professional can accept or reject the request', 403);
  }

  if (payload.status === ServiceRequestStatus.CANCELLED && !isCustomer) {
    throw new AppError('Only the customer can cancel the request', 403);
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

  if (payload.status === ServiceRequestStatus.ACCEPTED) {
    const canAcceptLegacyRequest =
      serviceRequest.status === ServiceRequestStatus.PENDING &&
      (!serviceRequest.serviceNeedId || (isSelectedThread && isSelectionPending));
    const canAcceptSelectedRequest =
      serviceRequest.status === ServiceRequestStatus.AWAITING_PRO_CONFIRMATION;

    if (!canAcceptLegacyRequest && !canAcceptSelectedRequest) {
      throw new AppError('This request is not waiting for professional confirmation', 422);
    }
  }

  if (payload.status === ServiceRequestStatus.REJECTED) {
    if (
      ![ServiceRequestStatus.PENDING, ServiceRequestStatus.AWAITING_PRO_CONFIRMATION].includes(
        serviceRequest.status,
      )
    ) {
      throw new AppError('Only pending requests can be rejected', 422);
    }
  }

  if (payload.status === ServiceRequestStatus.CANCELLED) {
    if (
      ![
        ServiceRequestStatus.PENDING,
        ServiceRequestStatus.AWAITING_PRO_CONFIRMATION,
        ServiceRequestStatus.ACCEPTED,
      ].includes(serviceRequest.status)
    ) {
      throw new AppError('This request cannot be cancelled from its current state', 422);
    }
  }

  if (payload.status === ServiceRequestStatus.COMPLETED && serviceRequest.status !== ServiceRequestStatus.ACCEPTED) {
    throw new AppError('Only accepted requests can be marked as completed', 422);
  }

  const nextValues = { status: payload.status };
  const now = new Date();
  const transaction = await req.models.ServiceRequest.sequelize.transaction();

  if (payload.status === ServiceRequestStatus.ACCEPTED) {
    nextValues.acceptedAt = now;
    nextValues.contactUnlockedAt = now;
  }
  if (payload.status === ServiceRequestStatus.REJECTED) {
    nextValues.rejectedAt = now;
    nextValues.closeReason = ServiceRequestCloseReason.PROFESSIONAL_REJECTED;
  }
  if (payload.status === ServiceRequestStatus.CANCELLED) {
    nextValues.cancelledAt = now;
    nextValues.closeReason = ServiceRequestCloseReason.CUSTOMER_CANCELLED;
  }
  if (payload.status === ServiceRequestStatus.COMPLETED) {
    nextValues.completedAt = now;
  }

  try {
    await serviceRequest.update(nextValues, { transaction });

    if (serviceRequest.serviceNeedId) {
      const parentUpdates = {};

      if (payload.status === ServiceRequestStatus.ACCEPTED && isSelectedThread) {
        parentUpdates.status = ServiceNeedStatus.MATCHED;
        parentUpdates.matchedAt = now;
      }

      if (
        payload.status === ServiceRequestStatus.REJECTED &&
        isSelectedThread &&
        isSelectionPending
      ) {
        parentUpdates.status = ServiceNeedStatus.OPEN;
        parentUpdates.selectedServiceRequestId = null;
        parentUpdates.selectionStartedAt = null;
        await reopenSiblingRequests(req, serviceRequest, transaction);
      }

      if (
        payload.status === ServiceRequestStatus.CANCELLED &&
        isSelectedThread &&
        isSelectionPending
      ) {
        parentUpdates.status = ServiceNeedStatus.CANCELLED;
        parentUpdates.selectedServiceRequestId = null;
        parentUpdates.selectionStartedAt = null;
        parentUpdates.cancelledAt = now;
      }

      if (
        payload.status === ServiceRequestStatus.CANCELLED &&
        isSelectedThread &&
        serviceRequest.serviceNeed?.status === ServiceNeedStatus.MATCHED
      ) {
        parentUpdates.status = ServiceNeedStatus.CANCELLED;
        parentUpdates.cancelledAt = now;
      }

      if (
        payload.status === ServiceRequestStatus.COMPLETED &&
        isSelectedThread &&
        serviceRequest.serviceNeed?.status === ServiceNeedStatus.MATCHED
      ) {
        parentUpdates.status = ServiceNeedStatus.CLOSED;
        parentUpdates.closedAt = now;
      }

      if (Object.keys(parentUpdates).length > 0) {
        await req.models.ServiceNeed.update(parentUpdates, {
          where: { id: serviceRequest.serviceNeedId },
          transaction,
        });
      }
    }

    await req.models.ServiceRequestMessage.create(
      {
        serviceRequestId: serviceRequest.id,
        senderUserId: req.auth.user.id,
        body: `Estado actualizado a ${payload.status}.`,
        isSystemMessage: true,
      },
      { transaction },
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const targetUserId = isProfessional ? serviceRequest.customerId : serviceRequest.professional.userId;
  await createServiceRequestNotification(
    req.models,
    serviceRequest,
    targetUserId,
    'Actualizacion de solicitud',
    `La solicitud "${serviceRequest.title}" ahora esta en estado ${payload.status}.`,
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
