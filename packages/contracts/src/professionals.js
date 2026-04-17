const { z, paginationSchema } = require('./common');
const { ProfessionalStatus, ServiceRequestSort } = require('@oficios/domain');

const searchProfessionalsSchema = paginationSchema.extend({
  categoryId: z.coerce.number().int().positive().optional(),
  placeId: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  availableNow: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === 'true')
    .optional(),
  text: z.string().min(1).optional(),
  sort: z
    .enum([
      ServiceRequestSort.RELEVANCE,
      ServiceRequestSort.RATING_DESC,
      ServiceRequestSort.EXPERIENCE_DESC,
      ServiceRequestSort.REVIEW_COUNT_DESC,
    ])
    .default(ServiceRequestSort.RELEVANCE),
});

const professionalProfileSchema = z.object({
  businessName: z.string().min(2),
  headline: z.string().min(2),
  bio: z.string().min(20),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  availableNow: z.boolean().default(false),
  city: z.string().min(2),
  province: z.string().min(2),
  placeId: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  contactPhone: z.string().min(6),
  contactWhatsApp: z.string().min(6).optional(),
  contactEmail: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  photoUrls: z.array(z.string().url()).max(10).default([]),
});

const professionalCategoriesSchema = z.object({
  categoryIds: z.array(z.coerce.number().int().positive()).min(1).max(10),
});

const professionalServiceAreaSchema = z.object({
  serviceAreas: z
    .array(
      z.object({
        placeId: z.string().optional(),
        city: z.string().min(2),
        province: z.string().min(2),
        lat: z.coerce.number().optional(),
        lng: z.coerce.number().optional(),
        radiusKm: z.coerce.number().positive().max(100),
      }),
    )
    .min(1)
    .max(10),
});

const professionalStatusSchema = z.object({
  status: z.enum([
    ProfessionalStatus.DRAFT,
    ProfessionalStatus.PENDING_APPROVAL,
    ProfessionalStatus.APPROVED,
    ProfessionalStatus.REJECTED,
    ProfessionalStatus.PAUSED,
  ]),
  rejectionReason: z.string().optional(),
});

module.exports = {
  professionalCategoriesSchema,
  professionalProfileSchema,
  professionalServiceAreaSchema,
  professionalStatusSchema,
  searchProfessionalsSchema,
};
