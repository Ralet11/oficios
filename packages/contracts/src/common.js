const { z } = require('zod');

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const idSchema = z.coerce.number().int().positive();

module.exports = {
  idSchema,
  paginationSchema,
  z,
};
