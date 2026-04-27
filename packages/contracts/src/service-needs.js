const { z, paginationSchema, idSchema } = require('./common');
const { ServiceNeedStatus, ServiceNeedVisibility } = require('@oficios/domain');

const serviceNeedFieldShapes = {
  categoryId: idSchema.optional(),
  title: z.string().min(4).max(140).optional(),
  description: z.string().min(10).max(4000).optional(),
  photoUrls: z.array(z.string().url()).max(10).default([]),
  city: z.string().min(2).max(120).optional(),
  province: z.string().min(2).max(120).optional(),
  addressLine: z.string().min(5).max(240).optional(),
  placeId: z.string().max(240).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  preferredDate: z.string().datetime().optional(),
  budgetAmount: z.coerce.number().positive().optional(),
  budgetCurrency: z.string().min(3).max(8).default('ARS'),
  contactName: z.string().min(2).max(120).optional(),
  contactPhone: z.string().min(6).max(40).optional(),
  contactWhatsapp: z.string().min(6).max(40).optional(),
  contactEmail: z.string().email().optional(),
  visibility: z
    .enum([ServiceNeedVisibility.DIRECT_ONLY, ServiceNeedVisibility.PUBLIC_BOARD])
    .default(ServiceNeedVisibility.DIRECT_ONLY),
};

const createServiceNeedSchema = z.object(serviceNeedFieldShapes);

const updateServiceNeedSchema = z.object({
  categoryId: idSchema.optional(),
  title: z.string().min(4).max(140).optional(),
  description: z.string().min(10).max(4000).optional(),
  photoUrls: z.array(z.string().url()).max(10).optional(),
  city: z.string().min(2).max(120).optional(),
  province: z.string().min(2).max(120).optional(),
  addressLine: z.string().min(5).max(240).optional(),
  placeId: z.string().max(240).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  preferredDate: z.string().datetime().optional(),
  budgetAmount: z.coerce.number().positive().optional(),
  budgetCurrency: z.string().min(3).max(8).optional(),
  contactName: z.string().min(2).max(120).optional(),
  contactPhone: z.string().min(6).max(40).optional(),
  contactWhatsapp: z.string().min(6).max(40).optional(),
  contactEmail: z.string().email().optional(),
  visibility: z.enum([ServiceNeedVisibility.DIRECT_ONLY, ServiceNeedVisibility.PUBLIC_BOARD]).optional(),
});

const listServiceNeedsSchema = paginationSchema.extend({
  status: z
    .enum([
      ServiceNeedStatus.DRAFT,
      ServiceNeedStatus.OPEN,
      ServiceNeedStatus.SELECTION_PENDING_CONFIRMATION,
      ServiceNeedStatus.MATCHED,
      ServiceNeedStatus.CLOSED,
      ServiceNeedStatus.CANCELLED,
    ])
    .optional(),
  visibility: z.enum([ServiceNeedVisibility.DIRECT_ONLY, ServiceNeedVisibility.PUBLIC_BOARD]).optional(),
});

const dispatchServiceNeedSchema = z.object({
  professionalIds: z.array(idSchema).min(1).max(20),
  customerMessage: z.string().min(1).max(2000),
});

const selectServiceNeedRequestSchema = z.object({
  serviceRequestId: idSchema,
});

const listOpportunityNeedsSchema = paginationSchema.extend({
  categoryId: idSchema.optional(),
  placeId: z.string().max(240).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  text: z.string().min(1).max(240).optional(),
});

const expressInterestSchema = z.object({
  message: z.string().max(2000).optional(),
});

module.exports = {
  createServiceNeedSchema,
  dispatchServiceNeedSchema,
  expressInterestSchema,
  listOpportunityNeedsSchema,
  listServiceNeedsSchema,
  selectServiceNeedRequestSchema,
  updateServiceNeedSchema,
};
