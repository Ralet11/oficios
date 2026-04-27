const express = require('express');
const authRoutes = require('./auth-routes');
const categoriesRoutes = require('./categories-routes');
const meRoutes = require('./me-routes');
const professionalsRoutes = require('./professionals-routes');
const serviceNeedsRoutes = require('./service-needs-routes');
const serviceRequestsRoutes = require('./service-requests-routes');
const reviewsRoutes = require('./reviews-routes');
const notificationsRoutes = require('./notifications-routes');
const adminRoutes = require('./admin-routes');
const uploadsRoutes = require('./uploads-routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/me', meRoutes);
router.use('/professionals', professionalsRoutes);
router.use('/service-needs', serviceNeedsRoutes);
router.use('/service-requests', serviceRequestsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadsRoutes);

module.exports = router;
