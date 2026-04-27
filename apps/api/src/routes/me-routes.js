const express = require('express');
const { customerProfileSchema, updateCustomerProfileSchema } = require('@oficios/contracts');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');
const { AppError } = require('../utils/app-error');

const router = express.Router();

function calculateDerivedFields(profile) {
  const total = profile.completedRequestsCount + profile.cancelledRequestsCount;
  const cancellationRate = total > 0 ? (profile.cancelledRequestsCount / total) * 100 : 0;

  const topTags = profile.tags?.slice(0, 5) || [];

  return {
    ...profile,
    cancellationRate: Math.round(cancellationRate * 10) / 10,
    topTags,
  };
}

router.get(
  '/customer-profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    let profile = await req.models.CustomerProfile.findOne({
      where: { userId: req.auth.user.id },
    });

    if (!profile) {
      profile = await req.models.CustomerProfile.create({
        userId: req.auth.user.id,
        memberSince: req.auth.user.createdAt,
        ratingAverage: 0,
        reviewCount: 0,
        completedRequestsCount: 0,
        cancelledRequestsCount: 0,
        responseTimeMinutes: 60,
        tags: [],
        verifiedPhone: false,
        verifiedEmail: false,
      });
    }

    const serialized = profile.toJSON();
    const derived = calculateDerivedFields(serialized);

    res.json(customerProfileSchema.parse(derived));
  }),
);

router.patch(
  '/customer-profile',
  requireAuth,
  validate({ body: updateCustomerProfileSchema }),
  asyncHandler(async (req, res) => {
    let profile = await req.models.CustomerProfile.findOne({
      where: { userId: req.auth.user.id },
    });

    if (!profile) {
      profile = await req.models.CustomerProfile.create({
        userId: req.auth.user.id,
        memberSince: req.auth.user.createdAt,
      });
    }

    const { city, bio, tags } = req.body;

    if (city !== undefined) profile.city = city;
    if (bio !== undefined) profile.bio = bio;
    if (tags !== undefined) profile.tags = tags;

    await profile.save();

    const serialized = profile.toJSON();
    const derived = calculateDerivedFields(serialized);

    res.json(customerProfileSchema.parse(derived));
  }),
);

module.exports = router;