const express = require('express');
const { createImageUploadIntentSchema } = require('@oficios/contracts');
const controller = require('../controllers/uploads-controller');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.post(
  '/images/intents',
  requireAuth,
  validate({ body: createImageUploadIntentSchema }),
  asyncHandler(controller.createImageUploadIntent),
);

module.exports = router;
