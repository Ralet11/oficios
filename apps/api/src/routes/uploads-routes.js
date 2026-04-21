const express = require('express');
const { createImageUploadIntentSchema } = require('@oficios/contracts');
const controller = require('../controllers/uploads-controller');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.post(
  '/images/intents',
  requireAuth,
  requireRole('PROFESSIONAL'),
  validate({ body: createImageUploadIntentSchema }),
  asyncHandler(controller.createWorkPostImageUploadIntent),
);

module.exports = router;
