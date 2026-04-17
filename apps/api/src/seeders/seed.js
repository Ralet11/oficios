const bcrypt = require('bcryptjs');
const { sequelize } = require('../db/sequelize');
const { initModels } = require('../models');
const { UserRole, ProfessionalStatus } = require('@oficios/domain');

async function seed() {
  const models = initModels(sequelize);

  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  const [plomeria, electricidad, pintura] = await Promise.all([
    models.Category.create({
      name: 'Plomería',
      slug: 'plomeria',
      description: 'Instalaciones, pérdidas y arreglos sanitarios.',
      icon: 'water',
    }),
    models.Category.create({
      name: 'Electricidad',
      slug: 'electricidad',
      description: 'Instalaciones y reparaciones eléctricas.',
      icon: 'flash',
    }),
    models.Category.create({
      name: 'Pintura',
      slug: 'pintura',
      description: 'Pintura interior y exterior.',
      icon: 'color-fill',
    }),
  ]);

  const admin = await models.User.create({
    email: 'admin@oficios.app',
    passwordHash: await bcrypt.hash('Admin1234', 10),
    firstName: 'Admin',
    lastName: 'Marketplace',
    roles: [UserRole.CUSTOMER, UserRole.ADMIN],
  });

  const customer = await models.User.create({
    email: 'cliente@oficios.app',
    passwordHash: await bcrypt.hash('Cliente1234', 10),
    firstName: 'Paula',
    lastName: 'Gomez',
    phone: '+5491122223333',
    roles: [UserRole.CUSTOMER],
  });

  const professionalUser = await models.User.create({
    email: 'pro@oficios.app',
    passwordHash: await bcrypt.hash('Profesional1234', 10),
    firstName: 'Diego',
    lastName: 'Fernandez',
    phone: '+5491199990000',
    roles: [UserRole.CUSTOMER, UserRole.PROFESSIONAL],
  });

  const professional = await models.ProfessionalProfile.create({
    userId: professionalUser.id,
    status: ProfessionalStatus.APPROVED,
    businessName: 'Soluciones Diego',
    headline: 'Plomero matriculado en CABA y GBA',
    bio: 'Atiendo urgencias, instalaciones y mantenimiento preventivo para hogares y comercios.',
    yearsExperience: 12,
    ratingAverage: 4.8,
    reviewCount: 1,
    completedJobsCount: 24,
    availableNow: true,
    city: 'Buenos Aires',
    province: 'Buenos Aires',
    contactPhone: '+5491199990000',
    contactWhatsApp: '+5491199990000',
    contactEmail: 'pro@oficios.app',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
    coverUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
    photoUrls: ['https://images.unsplash.com/photo-1621905251918-48416bd8575a'],
    lat: -34.6037,
    lng: -58.3816,
    placeId: 'buenos-aires',
  });

  await professional.addCategories([plomeria, electricidad]);

  await models.ServiceArea.bulkCreate([
    {
      professionalProfileId: professional.id,
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      radiusKm: 15,
      lat: -34.6037,
      lng: -58.3816,
      placeId: 'buenos-aires',
    },
    {
      professionalProfileId: professional.id,
      city: 'Avellaneda',
      province: 'Buenos Aires',
      radiusKm: 10,
    },
  ]);

  const serviceRequest = await models.ServiceRequest.create({
    customerId: customer.id,
    professionalId: professional.id,
    categoryId: plomeria.id,
    status: 'ACCEPTED',
    title: 'Arreglo de pérdida en cocina',
    customerMessage: 'Necesito revisar una pérdida debajo de la mesada.',
    city: 'Buenos Aires',
    province: 'Buenos Aires',
    addressLine: 'Av. Corrientes 1234',
    budgetAmount: 50000,
    budgetCurrency: 'ARS',
    acceptedAt: new Date(),
    contactUnlockedAt: new Date(),
  });

  await models.ServiceRequestMessage.bulkCreate([
    {
      serviceRequestId: serviceRequest.id,
      senderUserId: customer.id,
      body: 'Necesito revisar una pérdida debajo de la mesada.',
    },
    {
      serviceRequestId: serviceRequest.id,
      senderUserId: professionalUser.id,
      body: 'Puedo pasar hoy por la tarde.',
    },
  ]);

  await models.Review.create({
    serviceRequestId: serviceRequest.id,
    reviewerUserId: customer.id,
    professionalId: professional.id,
    rating: 5,
    comment: 'Llegó a horario y resolvió el problema rápido.',
    status: 'VISIBLE',
  });

  console.log('Seed completed');
  console.log('Admin: admin@oficios.app / Admin1234');
  console.log('Cliente: cliente@oficios.app / Cliente1234');
  console.log('Profesional: pro@oficios.app / Profesional1234');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });
