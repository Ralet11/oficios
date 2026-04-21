const { z } = require('./common');

const createImageUploadIntentSchema = z.object({
  scope: z.enum(['professional-work-post']).default('professional-work-post'),
  fileName: z.string().min(1).max(180).optional(),
  mimeType: z.string().min(3).max(120).optional(),
});

module.exports = {
  createImageUploadIntentSchema,
};
