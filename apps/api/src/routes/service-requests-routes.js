const express = require('express');
const { z } = require('zod');
const {
  createServiceRequestMessageSchema,
  createServiceRequestSchema,
  listServiceRequestsSchema,
  updateServiceRequestStatusSchema,
} = require('@oficios/contracts');
const controller = require('../controllers/service-requests-controller');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.use(requireAuth);
router.get('/', validate({ query: listServiceRequestsSchema }), asyncHandler(controller.listServiceRequests));
router.post('/', validate({ body: createServiceRequestSchema }), asyncHandler(controller.createServiceRequest));
router.get('/:id', asyncHandler(controller.getServiceRequest));
router.patch(
  '/:id/status',
  validate({ body: updateServiceRequestStatusSchema }),
  asyncHandler(controller.updateServiceRequestStatus),
);
router.post(
  '/:id/messages',
  validate({ body: createServiceRequestMessageSchema }),
  asyncHandler(controller.createServiceRequestMessage),
);

module.exports = router;
