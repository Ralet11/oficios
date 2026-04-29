const { z } = require('zod');

const paginationSchema = z.object({});

const idSchema = z.coerce.number().int().positive();

module.exports = {
  idSchema,
  paginationSchema,
  z,
};
