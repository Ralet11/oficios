const { canRevealContact } = require('@oficios/domain');

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    roles: user.roles || [],
  };
}

function serializeCategory(category) {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
  };
}

function serializeProfessional(profile, options = {}) {
  const includeContact = options.includeContact === true;
  const workPosts = [...(profile.workPosts || [])].sort((left, right) => {
    if ((left.orderIndex || 0) !== (right.orderIndex || 0)) {
      return (left.orderIndex || 0) - (right.orderIndex || 0);
    }

    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });

  return {
    id: profile.id,
    status: profile.status,
    rejectionReason: profile.rejectionReason,
    businessName: profile.businessName,
    headline: profile.headline,
    bio: profile.bio,
    yearsExperience: profile.yearsExperience,
    ratingAverage: profile.ratingAverage,
    reviewCount: profile.reviewCount,
    completedJobsCount: profile.completedJobsCount,
    responseTimeMinutes: profile.responseTimeMinutes,
    availableNow: profile.availableNow,
    city: profile.city,
    province: profile.province,
    placeId: profile.placeId,
    lat: profile.lat,
    lng: profile.lng,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    photoUrls: profile.photoUrls || [],
    user: profile.user ? serializeUser(profile.user) : undefined,
    categories: profile.categories?.map((category) => serializeCategory(category)),
    serviceAreas: profile.serviceAreas?.map((area) => ({
      id: area.id,
      city: area.city,
      province: area.province,
      placeId: area.placeId,
      lat: area.lat,
      lng: area.lng,
      radiusKm: area.radiusKm,
    })),
    workPosts: workPosts.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      photoUrls: post.photoUrls || [],
      highlightLines: post.highlightLines || [],
      orderIndex: post.orderIndex || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })),
    contact: includeContact
      ? {
          phone: profile.contactPhone,
          whatsapp: profile.contactWhatsApp,
          email: profile.contactEmail,
        }
      : null,
  };
}

function buildServiceNeedRequestCounts(requests = []) {
  return requests.reduce(
    (counts, request) => {
      if (request?.status) {
        counts[request.status] = (counts[request.status] || 0) + 1;
      }

      counts.total += 1;
      return counts;
    },
    { total: 0 },
  );
}

function serializeServiceNeedReference(serviceNeed) {
  if (!serviceNeed) {
    return null;
  }

  return {
    id: serviceNeed.id,
    status: serviceNeed.status,
    visibility: serviceNeed.visibility,
    title: serviceNeed.title,
    selectedServiceRequestId: serviceNeed.selectedServiceRequestId,
  };
}

function serializeServiceNeedSummary(serviceNeed, options = {}) {
  if (!serviceNeed) {
    return null;
  }

  const includeContact = options.includeContact === true;

  return {
    id: serviceNeed.id,
    status: serviceNeed.status,
    visibility: serviceNeed.visibility,
    title: serviceNeed.title,
    description: serviceNeed.description,
    photoUrls: serviceNeed.photoUrls || [],
    city: serviceNeed.city,
    province: serviceNeed.province,
    addressLine: serviceNeed.addressLine,
    placeId: serviceNeed.placeId,
    lat: serviceNeed.lat,
    lng: serviceNeed.lng,
    preferredDate: serviceNeed.preferredDate,
    budgetAmount: serviceNeed.budgetAmount,
    budgetCurrency: serviceNeed.budgetCurrency,
    contact:
      includeContact
        ? {
            name: serviceNeed.contactName,
            phone: serviceNeed.contactPhone,
            whatsapp: serviceNeed.contactWhatsapp,
            email: serviceNeed.contactEmail,
          }
        : null,
    selectedServiceRequestId: serviceNeed.selectedServiceRequestId,
    publishedAt: serviceNeed.publishedAt,
    selectionStartedAt: serviceNeed.selectionStartedAt,
    matchedAt: serviceNeed.matchedAt,
    closedAt: serviceNeed.closedAt,
    cancelledAt: serviceNeed.cancelledAt,
    category: serializeCategory(serviceNeed.category),
    requestCounts: buildServiceNeedRequestCounts(serviceNeed.requests || []),
    createdAt: serviceNeed.createdAt,
    updatedAt: serviceNeed.updatedAt,
  };
}

function serializeServiceRequest(serviceRequest, viewerUserId, options = {}) {
  const showContact =
    canRevealContact(serviceRequest.status) &&
    [serviceRequest.customerId, serviceRequest.professional?.userId].includes(viewerUserId);

  return {
    id: serviceRequest.id,
    origin: serviceRequest.origin || null,
    closeReason: serviceRequest.closeReason || null,
    status: serviceRequest.status,
    title: serviceRequest.title,
    customerMessage: serviceRequest.customerMessage,
    city: serviceRequest.city,
    province: serviceRequest.province,
    addressLine: serviceRequest.addressLine,
    placeId: serviceRequest.placeId,
    lat: serviceRequest.lat,
    lng: serviceRequest.lng,
    preferredDate: serviceRequest.preferredDate,
    budgetAmount: serviceRequest.budgetAmount,
    budgetCurrency: serviceRequest.budgetCurrency,
    acceptedAt: serviceRequest.acceptedAt,
    rejectedAt: serviceRequest.rejectedAt,
    cancelledAt: serviceRequest.cancelledAt,
    completedAt: serviceRequest.completedAt,
    contactUnlockedAt: serviceRequest.contactUnlockedAt,
    createdAt: serviceRequest.createdAt,
    updatedAt: serviceRequest.updatedAt,
    category: serializeCategory(serviceRequest.category),
    customer: serviceRequest.customer ? serializeUser(serviceRequest.customer) : null,
    professional: serviceRequest.professional
      ? serializeProfessional(serviceRequest.professional, { includeContact: showContact })
      : null,
    serviceNeed: options.omitServiceNeed ? null : serializeServiceNeedReference(serviceRequest.serviceNeed),
    messages:
      serviceRequest.messages?.map((message) => ({
        id: message.id,
        body: message.body,
        isSystemMessage: message.isSystemMessage,
        createdAt: message.createdAt,
        sender: message.sender ? serializeUser(message.sender) : null,
      })) || [],
    review: serviceRequest.review
      ? {
          id: serviceRequest.review.id,
          rating: serviceRequest.review.rating,
          comment: serviceRequest.review.comment,
          status: serviceRequest.review.status,
        }
      : null,
  };
}

function serializeServiceNeedDetail(serviceNeed, viewerUserId, options = {}) {
  if (!serviceNeed) {
    return null;
  }

  const resolvedViewerUserId = viewerUserId || serviceNeed.customerId;
  const includeContact = options.includeContact === true;

  return {
    ...serializeServiceNeedSummary(serviceNeed, { includeContact }),
    customer: serviceNeed.customer ? serializeUser(serviceNeed.customer) : null,
    requests:
      serviceNeed.requests?.map((request) => serializeServiceRequest(request, resolvedViewerUserId, { omitServiceNeed: true })) || [],
  };
}

module.exports = {
  serializeProfessional,
  serializeServiceNeedDetail,
  serializeServiceNeedSummary,
  serializeServiceRequest,
  serializeUser,
};
