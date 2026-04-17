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

function serializeProfessional(profile, options = {}) {
  const includeContact = options.includeContact === true;

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
    categories: profile.categories?.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
    })),
    serviceAreas: profile.serviceAreas?.map((area) => ({
      id: area.id,
      city: area.city,
      province: area.province,
      placeId: area.placeId,
      lat: area.lat,
      lng: area.lng,
      radiusKm: area.radiusKm,
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

function serializeServiceRequest(serviceRequest, viewerUserId) {
  const showContact =
    canRevealContact(serviceRequest.status) &&
    [serviceRequest.customerId, serviceRequest.professional?.userId].includes(viewerUserId);

  return {
    id: serviceRequest.id,
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
    category: serviceRequest.category
      ? {
          id: serviceRequest.category.id,
          name: serviceRequest.category.name,
          slug: serviceRequest.category.slug,
        }
      : null,
    customer: serviceRequest.customer ? serializeUser(serviceRequest.customer) : null,
    professional: serviceRequest.professional
      ? serializeProfessional(serviceRequest.professional, { includeContact: showContact })
      : null,
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

module.exports = {
  serializeProfessional,
  serializeServiceRequest,
  serializeUser,
};
