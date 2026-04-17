const { z, paginationSchema } = require('./common');
const { ReviewStatus } = require('@oficios/domain');

const createReviewSchema = z.object({
  serviceRequestId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10).max(1500),
});

const listReviewsSchema = paginationSchema.extend({
  professionalId: z.coerce.number().int().positive().optional(),
  status: z.enum([ReviewStatus.VISIBLE, ReviewStatus.HIDDEN]).optional(),
});

const reviewModerationSchema = z.object({
  status: z.enum([ReviewStatus.VISIBLE, ReviewStatus.HIDDEN]),
});

module.exports = {
  createReviewSchema,
  listReviewsSchema,
  reviewModerationSchema,
};
