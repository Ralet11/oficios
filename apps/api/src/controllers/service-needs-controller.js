const { Op } = require('sequelize');
const {
  NotificationType,
  ServiceNeedStatus,
  ServiceRequestCloseReason,
  ServiceRequestOrigin,
  ServiceRequestStatus,
} = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { createNotification, createServiceRequestNotification } = require('../services/notifications');
const { serializeServiceNeedDetail, serializeServiceNeedSummary } = require('../utils/serializers');

const ACTIVE_SERVICE_REQUEST_STATUSES = [
  ServiceRequestStatus.PENDING,
  ServiceRequestStatus.AWAITING_PRO_CONFIRMATION,
  ServiceRequestStatus.ACCEPTED,
];

function buildServiceNeedRequestInclude(req) {
  return [
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
    { model: req.models.Review, as: 'review' },
  ];
}

function buildServiceNeedInclude(req, options = {}) {
  const includeRequests = options.includeRequests !== false;
  const requestAttributes = options.requestAttributes;
  const include = [
    { model: req.models.User, as: 'customer' },
    { model: req.models.Category, as: 'category' },
  ];

  if (includeRequests) {
    include.push({
      model: req.models.ServiceRequest,
      as: 'requests',
      attributes: requestAttributes,
      include: requestAttributes ? [] : buildServiceNeedRequestInclude(req),
    });
  }

  return include;
}

async function loadServiceNeed(req, id, options = {}) {
  return req.models.ServiceNeed.findByPk(id, {
    include: buildServiceNeedInclude(req, options),
    transaction: options.transaction,
  });
}

function ensureServiceNeedOwner(userId, serviceNeed) {
  if (!serviceNeed || serviceNeed.customerId !== userId) {
    throw new AppError('Service need not found', 404);
  }
}

function normalizeServiceNeedPayload(payload) {
  const normalized = {
    ...payload,
  };

  if (Object.prototype.hasOwnProperty.call(payload, 'preferredDate')) {
    normalized.preferredDate = payload.preferredDate ? new Date(payload.preferredDate) : null;
  }

  return normalized;
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

async function ensureCategoryExists(models, categoryId) {
  if (!categoryId) {
    return null;
  }

  const category = await models.Category.findByPk(categoryId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
}

function ensureServiceNeedEditable(serviceNeed) {
  if (
    ![ServiceNeedStatus.DRAFT, ServiceNeedStatus.OPEN].includes(serviceNeed.status)
  ) {
    throw new AppError('This service need can no longer be edited', 422);
  }
}

function ensureServiceNeedReadyForDispatch(serviceNeed) {
  const missingFields = [];

  if (!serviceNeed.categoryId) {
    missingFields.push('categoryId');
  }
  if (!serviceNeed.title) {
    missingFields.push('title');
  }
  if (!serviceNeed.description) {
    missingFields.push('description');
  }
  if (!serviceNeed.city) {
    missingFields.push('city');
  }
  if (!serviceNeed.province) {
    missingFields.push('province');
  }
  if (!serviceNeed.addressLine) {
    missingFields.push('addressLine');
  }

  if (missingFields.length > 0) {
    throw new AppError('Complete the draft before dispatching it', 422, {
      missingFields,
    });
  }
}

async function listServiceNeeds(req, res) {
  const filters = req.validated.query;
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const where = {
    customerId: req.auth.user.id,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.visibility) {
    where.visibility = filters.visibility;
  }

  const { rows, count } = await req.models.ServiceNeed.findAndCountAll({
    where,
    include: buildServiceNeedInclude(req, {
      requestAttributes: ['id', 'status', 'closeReason'],
    }),
    distinct: true,
    order: [['updatedAt', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  res.json({
    data: rows.map((item) => serializeServiceNeedSummary(item, { includeContact: true })),
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    },
  });
}

async function createServiceNeed(req, res) {
  const payload = normalizeServiceNeedPayload(req.validated.body);

  await ensureCategoryExists(req.models, payload.categoryId);

  const serviceNeed = await req.models.ServiceNeed.create({
    ...buildContactSnapshot(req.auth.user),
    ...payload,
    customerId: req.auth.user.id,
  });

  res.status(201).json({
    data: serializeServiceNeedDetail(await loadServiceNeed(req, serviceNeed.id), req.auth.user.id, {
      includeContact: true,
    }),
  });
}

async function getServiceNeed(req, res) {
  const serviceNeed = await loadServiceNeed(req, req.params.id);
  ensureServiceNeedOwner(req.auth.user.id, serviceNeed);

  res.json({
    data: serializeServiceNeedDetail(serviceNeed, req.auth.user.id, {
      includeContact: true,
    }),
  });
}

async function updateServiceNeed(req, res) {
  const payload = normalizeServiceNeedPayload(req.validated.body);
  const serviceNeed = await loadServiceNeed(req, req.params.id, { includeRequests: false });
  ensureServiceNeedOwner(req.auth.user.id, serviceNeed);
  ensureServiceNeedEditable(serviceNeed);

  await ensureCategoryExists(req.models, payload.categoryId);

  if (serviceNeed.status === ServiceNeedStatus.OPEN) {
    const activeRequestsCount = await req.models.ServiceRequest.count({
      where: {
        serviceNeedId: serviceNeed.id,
        status: ACTIVE_SERVICE_REQUEST_STATUSES,
      },
    });

    if (activeRequestsCount > 0) {
      throw new AppError('This service need cannot be edited while it has active threads', 422);
    }
  }

  await serviceNeed.update(payload);

  res.json({
    data: serializeServiceNeedDetail(await loadServiceNeed(req, serviceNeed.id), req.auth.user.id, {
      includeContact: true,
    }),
  });
}

async function dispatchServiceNeed(req, res) {
  const payload = req.validated.body;
  const serviceNeed = await loadServiceNeed(req, req.params.id);
  ensureServiceNeedOwner(req.auth.user.id, serviceNeed);

  if (![ServiceNeedStatus.DRAFT, ServiceNeedStatus.OPEN].includes(serviceNeed.status)) {
    throw new AppError('This service need cannot receive new dispatches right now', 422);
  }

  ensureServiceNeedReadyForDispatch(serviceNeed);

  const professionalIds = [...new Set(payload.professionalIds)];
  const professionals = await req.models.ProfessionalProfile.findAll({
    where: {
      id: professionalIds,
      status: 'APPROVED',
    },
    include: [{ model: req.models.User, as: 'user' }],
  });

  if (professionals.length !== professionalIds.length) {
    throw new AppError('One or more professionals are not available', 422);
  }

  const activeExistingRequests = await req.models.ServiceRequest.findAll({
    where: {
      serviceNeedId: serviceNeed.id,
      professionalId: professionalIds,
      status: ACTIVE_SERVICE_REQUEST_STATUSES,
    },
    attributes: ['professionalId'],
  });

  if (activeExistingRequests.length > 0) {
    throw new AppError('One or more professionals already have an active thread for this need', 409, {
      professionalIds: activeExistingRequests.map((item) => item.professionalId),
    });
  }

  const now = new Date();
  const transaction = await req.models.ServiceNeed.sequelize.transaction();

  try {
    await serviceNeed.update(
      {
        status: ServiceNeedStatus.OPEN,
        publishedAt: serviceNeed.publishedAt || now,
      },
      { transaction },
    );

    const createdRequests = [];

    for (const professional of professionals) {
      const serviceRequest = await req.models.ServiceRequest.create(
        {
          serviceNeedId: serviceNeed.id,
          customerId: req.auth.user.id,
          professionalId: professional.id,
          categoryId: serviceNeed.categoryId,
          origin: ServiceRequestOrigin.DIRECT_INVITE,
          status: ServiceRequestStatus.PENDING,
          title: serviceNeed.title,
          customerMessage: payload.customerMessage,
          city: serviceNeed.city,
          province: serviceNeed.province,
          addressLine: serviceNeed.addressLine,
          placeId: serviceNeed.placeId,
          preferredDate: serviceNeed.preferredDate,
          budgetAmount: serviceNeed.budgetAmount,
          budgetCurrency: serviceNeed.budgetCurrency,
          lat: serviceNeed.lat,
          lng: serviceNeed.lng,
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

      createdRequests.push({
        professionalUserId: professional.userId,
        requestId: serviceRequest.id,
      });
    }

    await transaction.commit();

    for (const createdRequest of createdRequests) {
      await createNotification(req.models, {
        userId: createdRequest.professionalUserId,
        type: NotificationType.SERVICE_REQUEST_CREATED,
        title: 'Nueva consulta recibida',
        body: `Recibiste una nueva consulta de ${req.auth.user.firstName}.`,
        payload: { serviceRequestId: createdRequest.requestId, serviceNeedId: serviceNeed.id },
      });
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  res.json({
    data: serializeServiceNeedDetail(await loadServiceNeed(req, serviceNeed.id), req.auth.user.id, {
      includeContact: true,
    }),
  });
}

async function selectServiceNeedRequest(req, res) {
  const payload = req.validated.body;
  const serviceNeed = await loadServiceNeed(req, req.params.id);
  ensureServiceNeedOwner(req.auth.user.id, serviceNeed);

  if (serviceNeed.status !== ServiceNeedStatus.OPEN) {
    throw new AppError('Only open service needs can select a candidate request', 422);
  }

  const chosenRequest = serviceNeed.requests.find((request) => request.id === payload.serviceRequestId);
  if (!chosenRequest || chosenRequest.status !== ServiceRequestStatus.PENDING) {
    throw new AppError('Selected request is not eligible', 422);
  }

  const now = new Date();
  const transaction = await req.models.ServiceNeed.sequelize.transaction();

  try {
    await req.models.ServiceRequest.update(
      {
        status: ServiceRequestStatus.CANCELLED,
        closeReason: ServiceRequestCloseReason.CUSTOMER_SELECTED_OTHER,
        cancelledAt: now,
      },
      {
        where: {
          serviceNeedId: serviceNeed.id,
          id: { [Op.ne]: chosenRequest.id },
          status: ACTIVE_SERVICE_REQUEST_STATUSES,
        },
        transaction,
      },
    );

    await req.models.ServiceRequest.update(
      {
        status: ServiceRequestStatus.AWAITING_PRO_CONFIRMATION,
        closeReason: null,
        cancelledAt: null,
      },
      {
        where: {
          id: chosenRequest.id,
        },
        transaction,
      },
    );

    await req.models.ServiceNeed.update(
      {
        status: ServiceNeedStatus.SELECTION_PENDING_CONFIRMATION,
        selectedServiceRequestId: chosenRequest.id,
        selectionStartedAt: now,
      },
      {
        where: { id: serviceNeed.id },
        transaction,
      },
    );

    const siblingRequests = serviceNeed.requests.filter(
      (request) =>
        request.id !== chosenRequest.id && ACTIVE_SERVICE_REQUEST_STATUSES.includes(request.status),
    );

    await req.models.ServiceRequestMessage.bulkCreate(
      [
        {
          serviceRequestId: chosenRequest.id,
          senderUserId: req.auth.user.id,
          body: 'El cliente te selecciono y espera tu confirmacion.',
          isSystemMessage: true,
        },
        ...siblingRequests.map((request) => ({
          serviceRequestId: request.id,
          senderUserId: req.auth.user.id,
          body: 'La consulta se cerro porque el cliente selecciono a otro profesional.',
          isSystemMessage: true,
        })),
      ],
      { transaction },
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const reloadedServiceNeed = await loadServiceNeed(req, serviceNeed.id);
  const reloadedChosenRequest = reloadedServiceNeed.requests.find((request) => request.id === chosenRequest.id);
  await createServiceRequestNotification(
    req.models,
    reloadedChosenRequest,
    reloadedChosenRequest.professional.userId,
    'Fuiste seleccionado',
    `El cliente te selecciono para la consulta "${reloadedChosenRequest.title}".`,
  );

  res.json({
    data: serializeServiceNeedDetail(reloadedServiceNeed, req.auth.user.id, {
      includeContact: true,
    }),
  });
}

async function cancelServiceNeed(req, res) {
  const serviceNeed = await loadServiceNeed(req, req.params.id);
  ensureServiceNeedOwner(req.auth.user.id, serviceNeed);

  if ([ServiceNeedStatus.CANCELLED, ServiceNeedStatus.CLOSED].includes(serviceNeed.status)) {
    throw new AppError('This service need can no longer be cancelled', 422);
  }

  const now = new Date();
  const transaction = await req.models.ServiceNeed.sequelize.transaction();

  try {
    await req.models.ServiceNeed.update(
      {
        status: ServiceNeedStatus.CANCELLED,
        cancelledAt: now,
      },
      {
        where: { id: serviceNeed.id },
        transaction,
      },
    );

    await req.models.ServiceRequest.update(
      {
        status: ServiceRequestStatus.CANCELLED,
        closeReason: ServiceRequestCloseReason.CUSTOMER_CANCELLED,
        cancelledAt: now,
      },
      {
        where: {
          serviceNeedId: serviceNeed.id,
          status: ACTIVE_SERVICE_REQUEST_STATUSES,
        },
        transaction,
      },
    );

    const activeRequests = serviceNeed.requests.filter((request) =>
      ACTIVE_SERVICE_REQUEST_STATUSES.includes(request.status),
    );

    if (activeRequests.length > 0) {
      await req.models.ServiceRequestMessage.bulkCreate(
        activeRequests.map((request) => ({
          serviceRequestId: request.id,
          senderUserId: req.auth.user.id,
          body: 'La consulta fue cancelada por el cliente.',
          isSystemMessage: true,
        })),
        { transaction },
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  res.json({
    data: serializeServiceNeedDetail(await loadServiceNeed(req, serviceNeed.id), req.auth.user.id, {
      includeContact: true,
    }),
  });
}

async function listOpportunityNeeds(req, res) {
  const filters = req.validated.query;
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const where = {
    visibility: ServiceNeedVisibility.PUBLIC_BOARD,
    status: ServiceNeedStatus.OPEN,
  };

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.placeId) {
    where.placeId = filters.placeId;
  }

  if (filters.text) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${filters.text}%` } },
      { description: { [Op.iLike]: `%${filters.text}%` } },
    ];
  }

  const { rows, count } = await req.models.ServiceNeed.findAndCountAll({
    where,
    include: [{ model: req.models.Category, as: 'category' }],
    distinct: true,
    order: [['publishedAt', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  res.json({
    data: rows.map((item) => serializeServiceNeedSummary(item, { includeContact: false })),
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    },
  });
}

async function getOpportunityNeed(req, res) {
  const serviceNeed = await req.models.ServiceNeed.findByPk(req.params.id, {
    include: [{ model: req.models.Category, as: 'category' }],
  });

  if (!serviceNeed || serviceNeed.visibility !== ServiceNeedVisibility.PUBLIC_BOARD) {
    throw new AppError('Opportunity not found', 404);
  }

  res.json({
    data: serializeServiceNeedDetail(serviceNeed, null, { includeContact: false }),
  });
}

async function expressInterest(req, res) {
  const serviceNeed = await req.models.ServiceNeed.findByPk(req.params.id, {
    include: [{ model: req.models.ServiceRequest, as: 'requests' }],
  });

  if (!serviceNeed || serviceNeed.visibility !== ServiceNeedVisibility.PUBLIC_BOARD) {
    throw new AppError('Opportunity not found', 404);
  }

  if (serviceNeed.status !== ServiceNeedStatus.OPEN) {
    throw new AppError('This opportunity is no longer open', 422);
  }

  const user = await req.models.User.findByPk(req.auth.user.id, {
    include: [{ model: req.models.ProfessionalProfile, as: 'professionalProfile' }],
  });

  if (!user.roles.includes('PROFESSIONAL')) {
    throw new AppError('Only professionals can express interest', 403);
  }

  const professionalId = user.professionalProfile?.id;
  if (!professionalId) {
    throw new AppError('Professional profile not found', 404);
  }

  const existingRequest = serviceNeed.requests.find(
    (r) => r.professionalId === professionalId && ACTIVE_SERVICE_REQUEST_STATUSES.includes(r.status)
  );

  if (existingRequest) {
    throw new AppError('You have already expressed interest in this opportunity', 409);
  }

  const transaction = await req.models.ServiceNeed.sequelize.transaction();

  try {
    const serviceRequest = await req.models.ServiceRequest.create(
      {
        serviceNeedId: serviceNeed.id,
        customerId: serviceNeed.customerId,
        professionalId,
        categoryId: serviceNeed.categoryId,
        origin: ServiceRequestOrigin.PUBLIC_BOARD,
        status: ServiceRequestStatus.PENDING,
        title: serviceNeed.title,
        customerMessage: req.validated.body.message || null,
        city: serviceNeed.city,
        province: serviceNeed.province,
        addressLine: serviceNeed.addressLine,
        placeId: serviceNeed.placeId,
        preferredDate: serviceNeed.preferredDate,
        budgetAmount: serviceNeed.budgetAmount,
        budgetCurrency: serviceNeed.budgetCurrency,
        lat: serviceNeed.lat,
        lng: serviceNeed.lng,
      },
      { transaction }
    );

    if (req.validated.body.message) {
      await req.models.ServiceRequestMessage.create(
        {
          serviceRequestId: serviceRequest.id,
          senderUserId: req.auth.user.id,
          body: req.validated.body.message,
          isSystemMessage: false,
        },
        { transaction }
      );
    }

    await transaction.commit();

    await createNotification(req.models, {
      userId: serviceNeed.customerId,
      type: NotificationType.SERVICE_REQUEST_CREATED,
      title: 'Nuevo interés en tu consulta pública',
      body: `Un profesional está interesado en tu consulta: ${serviceNeed.title}`,
      payload: { serviceRequestId: serviceRequest.id, serviceNeedId: serviceNeed.id },
    });

    res.status(201).json({
      data: serviceRequest,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function closeBoard(req, res) {
  const serviceNeed = await req.models.ServiceNeed.findByPk(req.params.id);
  if (!serviceNeed) {
    throw new AppError('Service need not found', 404);
  }

  if (serviceNeed.customerId !== req.auth.user.id && !req.auth.user.roles.includes('ADMIN')) {
    throw new AppError('Unauthorized', 403);
  }

  if (serviceNeed.visibility !== ServiceNeedVisibility.PUBLIC_BOARD) {
    throw new AppError('This is not a public board post', 422);
  }

  const now = new Date();
  const transaction = await req.models.ServiceNeed.sequelize.transaction();

  try {
    await serviceNeed.update(
      {
        status: ServiceNeedStatus.CLOSED,
        closedAt: now,
      },
      { transaction }
    );

    await req.models.ServiceRequest.update(
      {
        status: ServiceRequestStatus.CANCELLED,
        closeReason: ServiceRequestCloseReason.BOARD_CLOSED,
        cancelledAt: now,
      },
      {
        where: {
          serviceNeedId: serviceNeed.id,
          status: ACTIVE_SERVICE_REQUEST_STATUSES,
        },
        transaction,
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  res.json({
    data: serializeServiceNeedDetail(await loadServiceNeed(req, serviceNeed.id), req.auth.user.id, {
      includeContact: false,
    }),
  });
}

async function expireSelection(req, res) {
  const serviceNeed = await loadServiceNeed(req, req.params.id, { includeRequests: true });
  
  if (!serviceNeed) {
    throw new AppError('Service need not found', 404);
  }

  // Permitir que el dueño o un admin expiren la selección
  if (serviceNeed.customerId !== req.auth.user.id && !req.auth.user.roles.includes('ADMIN')) {
    throw new AppError('Unauthorized', 403);
  }

  if (serviceNeed.status !== ServiceNeedStatus.SELECTION_PENDING_CONFIRMATION) {
    throw new AppError('This service need is not awaiting professional confirmation', 422);
  }

  const now = new Date();
  const transaction = await req.models.ServiceNeed.sequelize.transaction();

  try {
    // 1. Expirar el ServiceRequest elegido
    await req.models.ServiceRequest.update(
      {
        status: ServiceRequestStatus.EXPIRED,
        closeReason: ServiceRequestCloseReason.PROFESSIONAL_REJECTED, // Rejected by timeout
        cancelledAt: now,
      },
      {
        where: { id: serviceNeed.selectedServiceRequestId },
        transaction,
      }
    );

    // 2. Volver el ServiceNeed a OPEN
    await req.models.ServiceNeed.update(
      {
        status: ServiceNeedStatus.OPEN,
        selectedServiceRequestId: null,
        selectionStartedAt: null,
      },
      {
        where: { id: serviceNeed.id },
        transaction,
      }
    );

    // 3. Notificar al cliente
    await createNotification(req.models, {
      userId: serviceNeed.customerId,
      type: NotificationType.SERVICE_REQUEST_UPDATED,
      title: 'Selección expirada',
      body: `La selección para "${serviceNeed.title}" ha expirado. El profesional no confirmó a tiempo.`,
      payload: { serviceNeedId: serviceNeed.id },
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  res.json({
    data: serializeServiceNeedDetail(await loadServiceNeed(req, serviceNeed.id), req.auth.user.id, {
      includeContact: false,
    }),
  });
}

async function expireOldSelections(models) {
  const timeoutHours = Number(process.env.SELECTION_TIMEOUT_HOURS) || 24; // Configurable via ENV
  const cutoffTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

  const expiredNeeds = await models.ServiceNeed.findAll({
    where: {
      status: ServiceNeedStatus.SELECTION_PENDING_CONFIRMATION,
      selectionStartedAt: { [Op.lt]: cutoffTime },
    },
    include: [{ model: models.ServiceRequest, as: 'requests' }],
  });

  for (const need of expiredNeeds) {
    const now = new Date();
    const transaction = await models.ServiceNeed.sequelize.transaction();
    try {
      if (need.selectedServiceRequestId) {
        await models.ServiceRequest.update(
          {
            status: ServiceRequestStatus.EXPIRED,
            closeReason: ServiceRequestCloseReason.PROFESSIONAL_REJECTED,
            cancelledAt: now,
          },
          {
            where: { id: need.selectedServiceRequestId },
            transaction,
          }
        );
      }

      await need.update(
        {
          status: ServiceNeedStatus.OPEN,
          selectedServiceRequestId: null,
          selectionStartedAt: null,
        },
        { transaction }
      );

      await createNotification(models, {
        userId: need.customerId,
        type: NotificationType.SERVICE_REQUEST_UPDATED,
        title: 'Selección expirada automáticamente',
        body: `La selección para "${need.title}" ha expirado por tiempo. Ya podés elegir otro profesional.`,
        payload: { serviceNeedId: need.id },
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error expiring selection for need:', need.id, error);
    }
  }

  return expiredNeeds.length;
}

module.exports = {
  cancelServiceNeed,
  closeBoard,
  createServiceNeed,
  dispatchServiceNeed,
  expireOldSelections,
  expireSelection,
  expressInterest,
  getOpportunityNeed,
  getServiceNeed,
  listOpportunityNeeds,
  listServiceNeeds,
  selectServiceNeedRequest,
  updateServiceNeed,
};
