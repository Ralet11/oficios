const { z } = require('./common');
const { AuthProvider, UserRole } = require('@oficios/domain');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(6).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const socialLoginSchema = z.object({
  provider: z.enum([AuthProvider.GOOGLE, AuthProvider.APPLE]),
  providerUserId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

const activateProfessionalRoleSchema = z.object({
  businessName: z.string().min(2),
});

const sessionResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable().optional(),
    roles: z.array(z.enum([UserRole.CUSTOMER, UserRole.PROFESSIONAL, UserRole.ADMIN])),
  }),
});

module.exports = {
  activateProfessionalRoleSchema,
  loginSchema,
  registerSchema,
  sessionResponseSchema,
  socialLoginSchema,
};
