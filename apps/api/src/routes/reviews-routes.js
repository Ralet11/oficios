const express = require('express');
const { createReviewSchema, listReviewsSchema } = require('@oficios/contracts');
const controller = require('../controllers/reviews-controller');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.get('/', validate({ query: listReviewsSchema }), asyncHandler(controller.listReviews));
router.post('/', requireAuth, validate({ body: createReviewSchema }), asyncHandler(controller.createReview));

module.exports = router;
