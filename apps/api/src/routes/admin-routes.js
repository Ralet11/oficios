const express = require('express');
const { z } = require('zod');
const {
  adminListSchema,
  categorySchema,
  professionalStatusSchema,
  reviewModerationSchema,
} = require('@oficios/contracts');
const controller = require('../controllers/admin-controller');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/overview', asyncHandler(controller.getOverview));
router.get('/users', validate({ query: adminListSchema }), asyncHandler(controller.listUsers));
router.get('/professionals', validate({ query: adminListSchema }), asyncHandler(controller.listProfessionals));
router.get('/categories', asyncHandler(controller.listCategories));
router.patch(
  '/professionals/:id/status',
  validate({ body: professionalStatusSchema }),
  asyncHandler(controller.moderateProfessional),
);
router.post('/categories', validate({ body: categorySchema }), asyncHandler(controller.createCategory));
router.patch('/categories/:id', validate({ body: categorySchema.partial() }), asyncHandler(controller.updateCategory));
router.delete('/categories/:id', asyncHandler(controller.deleteCategory));
router.get('/reviews', validate({ query: adminListSchema }), asyncHandler(controller.listReviews));
router.patch('/reviews/:id/status', validate({ body: reviewModerationSchema }), asyncHandler(controller.moderateReview));
router.get('/service-requests', validate({ query: adminListSchema }), asyncHandler(controller.listServiceRequests));

module.exports = router;
