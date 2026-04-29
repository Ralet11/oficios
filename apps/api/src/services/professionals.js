const { Op } = require('sequelize');
const { ProfessionalStatus, ServiceRequestSort } = require('@oficios/domain');
const { getDistanceKm } = require('../utils/haversine');
const { serializeProfessional } = require('../utils/serializers');

async function searchProfessionals(models, filters) {
  const profiles = await models.ProfessionalProfile.findAll({
    where: {
      status: ProfessionalStatus.APPROVED,
      ...(typeof filters.minRating === 'number'
        ? { ratingAverage: { [Op.gte]: filters.minRating } }
        : {}),
      ...(filters.availableNow ? { availableNow: true } : {}),
      ...(filters.text
        ? {
            [Op.or]: [
              { businessName: { [Op.iLike]: `%${filters.text}%` } },
              { headline: { [Op.iLike]: `%${filters.text}%` } },
              { bio: { [Op.iLike]: `%${filters.text}%` } },
              { city: { [Op.iLike]: `%${filters.text}%` } },
              { province: { [Op.iLike]: `%${filters.text}%` } },
            ],
          }
        : {}),
    },
    include: [
      { model: models.User, as: 'user' },
      {
        model: models.Category,
        as: 'categories',
        ...(filters.categoryId ? { where: { id: filters.categoryId } } : {}),
        through: { attributes: [] },
      },
      { model: models.ServiceArea, as: 'serviceAreas' },
    ],
  });

  let items = profiles.map((profile) => {
    const serialized = serializeProfessional(profile);
    const distanceCandidates = [];

    if (typeof filters.lat === 'number' && typeof filters.lng === 'number') {
      const profileDistance = getDistanceKm(filters.lat, filters.lng, profile.lat, profile.lng);

      if (profileDistance !== null) {
        distanceCandidates.push(profileDistance);
      }

      (profile.serviceAreas || []).forEach((area) => {
        const areaDistance = getDistanceKm(filters.lat, filters.lng, area.lat, area.lng);

        if (areaDistance !== null) {
          distanceCandidates.push(areaDistance);
        }
      });
    }

    const distanceKm = distanceCandidates.length ? Math.min(...distanceCandidates) : null;

    return {
      ...serialized,
      distanceKm,
    };
  });

  if (filters.placeId) {
    items = items.filter(
      (item) =>
        item.placeId === filters.placeId ||
        (item.serviceAreas || []).some((area) => area.placeId === filters.placeId),
    );
  }

  if (typeof filters.radiusKm === 'number') {
    items = items.filter((item) => item.distanceKm !== null && item.distanceKm <= filters.radiusKm);
  }

  items.sort((a, b) => {
    switch (filters.sort) {
      case ServiceRequestSort.RATING_DESC:
        return b.ratingAverage - a.ratingAverage;
      case ServiceRequestSort.EXPERIENCE_DESC:
        return b.yearsExperience - a.yearsExperience;
      case ServiceRequestSort.REVIEW_COUNT_DESC:
        return b.reviewCount - a.reviewCount;
      default:
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return b.ratingAverage - a.ratingAverage;
    }
  });

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const start = (page - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);

  return {
    data: paginatedItems,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    },
  };
}

async function recalculateProfessionalStats(models, professionalId) {
  const reviews = await models.Review.findAll({
    where: { professionalId, status: 'VISIBLE' },
  });

  const serviceRequests = await models.ServiceRequest.findAll({
    where: { professionalId, status: 'COMPLETED' },
  });

  const reviewCount = reviews.length;
  const ratingAverage =
    reviewCount === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;

  await models.ProfessionalProfile.update(
    {
      reviewCount,
      ratingAverage,
      completedJobsCount: serviceRequests.length,
    },
    {
      where: { id: professionalId },
    },
  );
}

module.exports = {
  recalculateProfessionalStats,
  searchProfessionals,
};
