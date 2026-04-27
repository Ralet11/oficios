const express = require('express');
const {
  createServiceNeedSchema,
  dispatchServiceNeedSchema,
  listServiceNeedsSchema,
  selectServiceNeedRequestSchema,
  updateServiceNeedSchema,
} = require('@oficios/contracts');
const controller = require('../controllers/service-needs-controller');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.use(requireAuth);
router.get('/', validate({ query: listServiceNeedsSchema }), asyncHandler(controller.listServiceNeeds));
router.post('/', validate({ body: createServiceNeedSchema }), asyncHandler(controller.createServiceNeed));
router.get('/:id', asyncHandler(controller.getServiceNeed));
router.patch('/:id', validate({ body: updateServiceNeedSchema }), asyncHandler(controller.updateServiceNeed));
router.post(
  '/:id/dispatches',
  validate({ body: dispatchServiceNeedSchema }),
  asyncHandler(controller.dispatchServiceNeed),
);
router.post(
  '/:id/select-request',
  validate({ body: selectServiceNeedRequestSchema }),
  asyncHandler(controller.selectServiceNeedRequest),
);
router.post('/:id/cancel', asyncHandler(controller.cancelServiceNeed));

module.exports = router;
