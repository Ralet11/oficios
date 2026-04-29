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

const professionalPersonalDetailsSchema = z.object({
  age: z.coerce.number().int().min(18).max(99).optional(),
  nationality: z.string().min(2).max(80).optional(),
  languages: z.array(z.string().min(2).max(40)).max(6).default([]),
});

const professionalCertificationSchema = z.object({
  title: z.string().min(2).max(120),
  issuer: z.string().min(2).max(120),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  credentialId: z.string().min(2).max(80).optional(),
  evidenceUrl: z.string().url().optional(),
});

const professionalReferenceSchema = z.object({
  name: z.string().min(2).max(120),
  relationship: z.string().min(2).max(80),
  summary: z.string().min(10).max(280),
  location: z.string().min(2).max(120).optional(),
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
  personalDetails: professionalPersonalDetailsSchema.default({ languages: [] }),
  certifications: z.array(professionalCertificationSchema).max(8).default([]),
  references: z.array(professionalReferenceSchema).max(8).default([]),
});

const professionalWorkPostSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(10).max(1500),
  photoUrls: z.array(z.string().url()).max(8).default([]),
  highlightLines: z.array(z.string().min(2).max(140)).max(6).default([]),
});

const professionalWorkPostsSchema = z.object({
  workPosts: z.array(professionalWorkPostSchema).max(12).default([]),
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
  professionalCertificationSchema,
  professionalPersonalDetailsSchema,
  professionalProfileSchema,
  professionalReferenceSchema,
  professionalServiceAreaSchema,
  professionalStatusSchema,
  professionalWorkPostSchema,
  professionalWorkPostsSchema,
  searchProfessionalsSchema,
};
