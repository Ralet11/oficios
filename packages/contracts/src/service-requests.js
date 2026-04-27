const { z, paginationSchema } = require('./common');
const { ServiceRequestStatus } = require('@oficios/domain');

const createServiceRequestSchema = z.object({
  professionalId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  title: z.string().min(4),
  customerMessage: z.string().min(10),
  city: z.string().min(2),
  province: z.string().min(2),
  addressLine: z.string().min(5),
  placeId: z.string().optional(),
  preferredDate: z.string().datetime().optional(),
  budgetAmount: z.coerce.number().positive().optional(),
  budgetCurrency: z.string().default('ARS'),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

const listServiceRequestsSchema = paginationSchema.extend({
  status: z
    .enum([
      ServiceRequestStatus.PENDING,
      ServiceRequestStatus.AWAITING_PRO_CONFIRMATION,
      ServiceRequestStatus.ACCEPTED,
      ServiceRequestStatus.REJECTED,
      ServiceRequestStatus.CANCELLED,
      ServiceRequestStatus.COMPLETED,
      ServiceRequestStatus.EXPIRED,
    ])
    .optional(),
  scope: z.enum(['customer', 'professional', 'all']).default('all'),
});

const updateServiceRequestStatusSchema = z.object({
  status: z.enum([
    ServiceRequestStatus.ACCEPTED,
    ServiceRequestStatus.REJECTED,
    ServiceRequestStatus.CANCELLED,
    ServiceRequestStatus.COMPLETED,
  ]),
});

const createServiceRequestMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

module.exports = {
  createServiceRequestMessageSchema,
  createServiceRequestSchema,
  listServiceRequestsSchema,
  updateServiceRequestStatusSchema,
};
