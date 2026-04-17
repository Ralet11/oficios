const express = require('express');
const controller = require('../controllers/notifications-controller');
const { requireAuth } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(controller.listNotifications));
router.patch('/:id/read', asyncHandler(controller.markNotificationAsRead));

module.exports = router;
