const express = require('express');
const {
  createServiceNeedSchema,
  dispatchServiceNeedSchema,
  listServiceNeedsSchema,
  selectServiceNeedRequestSchema,
  updateServiceNeedSchema,
  listOpportunityNeedsSchema,
  expressInterestSchema,
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

// Opportunities board routes
router.get('/opportunities', validate({ query: listOpportunityNeedsSchema }), asyncHandler(controller.listOpportunityNeeds));
router.get('/opportunities/:id', asyncHandler(controller.getOpportunityNeed));
router.post('/:id/express-interest', validate({ body: expressInterestSchema }), asyncHandler(controller.expressInterest));
router.post('/:id/close-board', asyncHandler(controller.closeBoard));
router.post('/:id/expire-selection', asyncHandler(controller.expireSelection));

module.exports = router;
