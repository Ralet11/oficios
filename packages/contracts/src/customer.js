const { z } = require('./common');

const customerProfileSchema = z.object({
  ratingAverage: z.number().default(0),
  reviewCount: z.number().int().default(0),
  completedRequestsCount: z.number().int().default(0),
  cancelledRequestsCount: z.number().int().default(0),
  cancellationRate: z.number().default(0),
  responseTimeMinutes: z.number().int().default(60),
  memberSince: z.string().datetime().nullable(),
  city: z.string().nullable(),
  bio: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  verifiedPhone: z.boolean().default(false),
  verifiedEmail: z.boolean().default(false),
  topTags: z.array(z.string()).default([]),
});

const updateCustomerProfileSchema = z.object({
  city: z.string().optional(),
  bio: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

module.exports = {
  customerProfileSchema,
  updateCustomerProfileSchema,
};