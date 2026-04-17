const express = require('express');
const { z } = require('zod');
const {
  professionalCategoriesSchema,
  professionalProfileSchema,
  professionalServiceAreaSchema,
  searchProfessionalsSchema,
} = require('@oficios/contracts');
const controller = require('../controllers/professionals-controller');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.get('/', validate({ query: searchProfessionalsSchema }), asyncHandler(controller.listProfessionals));
router.get('/me', requireAuth, requireRole('PROFESSIONAL'), asyncHandler(controller.getOwnProfessionalProfile));
router.post(
  '/me',
  requireAuth,
  validate({ body: professionalProfileSchema }),
  asyncHandler(controller.upsertProfessionalProfile),
);
router.put(
  '/me',
  requireAuth,
  validate({ body: professionalProfileSchema }),
  asyncHandler(controller.upsertProfessionalProfile),
);
router.put(
  '/me/categories',
  requireAuth,
  requireRole('PROFESSIONAL'),
  validate({ body: professionalCategoriesSchema }),
  asyncHandler(controller.updateProfessionalCategories),
);
router.put(
  '/me/service-areas',
  requireAuth,
  requireRole('PROFESSIONAL'),
  validate({ body: professionalServiceAreaSchema }),
  asyncHandler(controller.updateProfessionalServiceAreas),
);
router.post(
  '/me/submit',
  requireAuth,
  requireRole('PROFESSIONAL'),
  asyncHandler(controller.submitProfessionalForApproval),
);
router.get('/:id', asyncHandler(controller.getProfessional));

module.exports = router;
