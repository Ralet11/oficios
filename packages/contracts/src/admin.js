const { z, paginationSchema } = require('./common');

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(2),
  icon: z.string().min(1),
  isActive: z.boolean().default(true),
});

const adminListSchema = paginationSchema.extend({
  q: z.string().optional(),
  status: z.string().optional(),
});

module.exports = {
  adminListSchema,
  categorySchema,
};
