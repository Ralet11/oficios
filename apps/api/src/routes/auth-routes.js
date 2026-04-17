const express = require('express');
const { z } = require('zod');
const {
  activateProfessionalRoleSchema,
  loginSchema,
  registerSchema,
  socialLoginSchema,
} = require('@oficios/contracts');
const controller = require('../controllers/auth-controller');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), asyncHandler(controller.register));
router.post('/login', validate({ body: loginSchema }), asyncHandler(controller.login));
router.post('/social', validate({ body: socialLoginSchema }), asyncHandler(controller.socialLogin));
router.get('/me', requireAuth, asyncHandler(controller.me));
router.post('/logout', requireAuth, asyncHandler(controller.logout));
router.post(
  '/roles/professional',
  requireAuth,
  validate({ body: activateProfessionalRoleSchema }),
  asyncHandler(controller.activateProfessionalRole),
);

module.exports = router;
