const bcrypt = require('bcryptjs');
const { sequelize } = require('../db/sequelize');
const { initModels } = require('../models');
const { UserRole, ProfessionalStatus } = require('@oficios/domain');

const CATEGORY_SEEDS = [
  {
    name: 'Plomeria',
    slug: 'plomeria',
    description: 'Instalaciones sanitarias, perdidas de agua y arreglos generales.',
    icon: 'water',
  },
  {
    name: 'Electricidad',
    slug: 'electricidad',
    description: 'Instalaciones, tableros, cableado y reparaciones electricas.',
    icon: 'flash',
  },
  {
    name: 'Pintura',
    slug: 'pintura',
    description: 'Pintura interior, exterior y puesta en valor de ambientes.',
    icon: 'color-fill',
  },
  {
    name: 'Tecnico en lavarropas',
    slug: 'tecnico-en-lavarropas',
    description: 'Reparacion, mantenimiento y puesta a punto de lavarropas.',
    icon: 'build',
  },
  {
    name: 'Tecnico en aire acondicionado',
    slug: 'tecnico-en-aire-acondicionado',
    description: 'Instalacion, carga de gas y service de aires acondicionados.',
    icon: 'snow',
  },
  {
    name: 'Tecnico en heladeras',
    slug: 'tecnico-en-heladeras',
    description: 'Reparacion de heladeras familiares, comerciales y freezers.',
    icon: 'cube',
  },
  {
    name: 'Programadores',
    slug: 'programadores',
    description: 'Desarrollo web, apps, automatizaciones y soporte tecnico.',
    icon: 'code-slash',
  },
  {
    name: 'Disenadores',
    slug: 'disenadores',
    description: 'Diseno grafico, branding, piezas visuales y UX/UI.',
    icon: 'brush',
  },
  {
    name: 'Carpinteria',
    slug: 'carpinteria',
    description: 'Muebles a medida, restauracion y arreglos en madera.',
    icon: 'hammer',
  },
  {
    name: 'Jardineria',
    slug: 'jardineria',
    description: 'Mantenimiento de jardines, poda y paisajismo.',
    icon: 'leaf',
  },
  {
    name: 'Albanileria',
    slug: 'albanileria',
    description: 'Reformas, reparaciones estructurales y trabajos de mamposteria.',
    icon: 'construct',
  },
  {
    name: 'Limpieza',
    slug: 'limpieza',
    description: 'Limpieza de hogares, oficinas y servicios post obra.',
    icon: 'sparkles',
  },
];

const customerSeeds = [
  { firstName: 'Paula', lastName: 'Gomez', city: 'Buenos Aires', province: 'Buenos Aires' },
  { firstName: 'Lucas', lastName: 'Martinez', city: 'Avellaneda', province: 'Buenos Aires' },
  { firstName: 'Sofia', lastName: 'Fernandez', city: 'La Plata', province: 'Buenos Aires' },
  { firstName: 'Mateo', lastName: 'Lopez', city: 'Lanus', province: 'Buenos Aires' },
  { firstName: 'Camila', lastName: 'Ramirez', city: 'Moron', province: 'Buenos Aires' },
  { firstName: 'Valentin', lastName: 'Torres', city: 'San Isidro', province: 'Buenos Aires' },
  { firstName: 'Martina', lastName: 'Ruiz', city: 'Quilmes', province: 'Buenos Aires' },
  { firstName: 'Benjamin', lastName: 'Herrera', city: 'Lomas de Zamora', province: 'Buenos Aires' },
  { firstName: 'Julieta', lastName: 'Diaz', city: 'Vicente Lopez', province: 'Buenos Aires' },
  { firstName: 'Thiago', lastName: 'Castro', city: 'Pilar', province: 'Buenos Aires' },
  { firstName: 'Mora', lastName: 'Sosa', city: 'San Miguel', province: 'Buenos Aires' },
  { firstName: 'Joaquin', lastName: 'Vega', city: 'Tigre', province: 'Buenos Aires' },
  { firstName: 'Lara', lastName: 'Medina', city: 'Berazategui', province: 'Buenos Aires' },
  { firstName: 'Franco', lastName: 'Navarro', city: 'Banfield', province: 'Buenos Aires' },
  { firstName: 'Emma', lastName: 'Suarez', city: 'Merlo', province: 'Buenos Aires' },
  { firstName: 'Bautista', lastName: 'Molina', city: 'Ramos Mejia', province: 'Buenos Aires' },
  { firstName: 'Catalina', lastName: 'Ortiz', city: 'San Justo', province: 'Buenos Aires' },
  { firstName: 'Nicolas', lastName: 'Silva', city: 'Hurlingham', province: 'Buenos Aires' },
  { firstName: 'Renata', lastName: 'Rojas', city: 'Temperley', province: 'Buenos Aires' },
  { firstName: 'Agustin', lastName: 'Acosta', city: 'Adrogue', province: 'Buenos Aires' },
];

const professionalSeeds = [
  { firstName: 'Diego', lastName: 'Fernandez', categorySlugs: ['plomeria', 'electricidad'], city: 'Buenos Aires', province: 'Buenos Aires' },
  { firstName: 'Mariano', lastName: 'Sanchez', categorySlugs: ['electricidad'], city: 'Avellaneda', province: 'Buenos Aires' },
  { firstName: 'Carla', lastName: 'Benitez', categorySlugs: ['pintura'], city: 'La Plata', province: 'Buenos Aires' },
  { firstName: 'Ezequiel', lastName: 'Romero', categorySlugs: ['tecnico-en-lavarropas'], city: 'Lanus', province: 'Buenos Aires' },
  { firstName: 'Luciana', lastName: 'Peralta', categorySlugs: ['tecnico-en-aire-acondicionado'], city: 'Moron', province: 'Buenos Aires' },
  { firstName: 'Federico', lastName: 'Aguilar', categorySlugs: ['tecnico-en-heladeras'], city: 'San Isidro', province: 'Buenos Aires' },
  { firstName: 'Brenda', lastName: 'Ibarra', categorySlugs: ['programadores'], city: 'Vicente Lopez', province: 'Buenos Aires' },
  { firstName: 'Tomas', lastName: 'Paz', categorySlugs: ['disenadores'], city: 'Quilmes', province: 'Buenos Aires' },
  { firstName: 'Rocio', lastName: 'Mendez', categorySlugs: ['carpinteria'], city: 'Pilar', province: 'Buenos Aires' },
  { firstName: 'Gaston', lastName: 'Farias', categorySlugs: ['jardineria'], city: 'Tigre', province: 'Buenos Aires' },
  { firstName: 'Daniela', lastName: 'Correa', categorySlugs: ['albanileria'], city: 'Lomas de Zamora', province: 'Buenos Aires' },
  { firstName: 'Santiago', lastName: 'Ledesma', categorySlugs: ['limpieza'], city: 'Merlo', province: 'Buenos Aires' },
  { firstName: 'Florencia', lastName: 'Campos', categorySlugs: ['plomeria', 'albanileria'], city: 'San Miguel', province: 'Buenos Aires' },
  { firstName: 'Pablo', lastName: 'Godoy', categorySlugs: ['electricidad', 'tecnico-en-aire-acondicionado'], city: 'San Justo', province: 'Buenos Aires' },
  { firstName: 'Micaela', lastName: 'Roldan', categorySlugs: ['pintura', 'disenadores'], city: 'Berazategui', province: 'Buenos Aires' },
  { firstName: 'Nahuel', lastName: 'Luna', categorySlugs: ['programadores', 'disenadores'], city: 'Hurlingham', province: 'Buenos Aires' },
  { firstName: 'Yesica', lastName: 'Arias', categorySlugs: ['tecnico-en-lavarropas', 'tecnico-en-heladeras'], city: 'Banfield', province: 'Buenos Aires' },
  { firstName: 'Kevin', lastName: 'Salinas', categorySlugs: ['carpinteria', 'pintura'], city: 'Ramos Mejia', province: 'Buenos Aires' },
  { firstName: 'Noelia', lastName: 'Cabrera', categorySlugs: ['jardineria', 'limpieza'], city: 'Temperley', province: 'Buenos Aires' },
  { firstName: 'Jonathan', lastName: 'Ponce', categorySlugs: ['albanileria', 'plomeria'], city: 'Adrogue', province: 'Buenos Aires' },
];

const avatarUrls = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3',
];

const coverUrls = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216',
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
];

const photoUrls = [
  'https://images.unsplash.com/photo-1621905251918-48416bd8575a',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
];

function buildPhone(index) {
  return `+54911${String(10000000 + index).slice(-8)}`;
}

function buildCoordinate(base, step, index) {
  return Number((base + step * index).toFixed(4));
}

async function createCustomers(models, passwordHash) {
  return Promise.all(
    customerSeeds.map((customerSeed, index) =>
      models.User.create({
        email: `cliente${index + 1}@oficios.app`,
        passwordHash,
        firstName: customerSeed.firstName,
        lastName: customerSeed.lastName,
        phone: buildPhone(index + 1),
        roles: [UserRole.CUSTOMER],
      }),
    ),
  );
}

async function createProfessionals(models, categoriesBySlug, passwordHash) {
  const createdProfessionals = [];

  for (const [index, professionalSeed] of professionalSeeds.entries()) {
    const user = await models.User.create({
      email: `pro${index + 1}@oficios.app`,
      passwordHash,
      firstName: professionalSeed.firstName,
      lastName: professionalSeed.lastName,
      phone: buildPhone(index + 101),
      roles: [UserRole.CUSTOMER, UserRole.PROFESSIONAL],
    });

    const professionalProfile = await models.ProfessionalProfile.create({
      userId: user.id,
      status: ProfessionalStatus.APPROVED,
      businessName: `${professionalSeed.firstName} ${professionalSeed.lastName} Servicios`,
      headline: `${professionalSeed.categorySlugs[0]} en ${professionalSeed.city}`,
      bio: `Profesional con experiencia en ${professionalSeed.categorySlugs.join(', ')} para hogares y comercios.`,
      yearsExperience: 3 + index,
      ratingAverage: Number((4.2 + (index % 4) * 0.2).toFixed(1)),
      reviewCount: 3 + index,
      completedJobsCount: 12 + index * 2,
      responseTimeMinutes: 15 + (index % 5) * 10,
      availableNow: index % 2 === 0,
      city: professionalSeed.city,
      province: professionalSeed.province,
      contactPhone: user.phone,
      contactWhatsApp: user.phone,
      contactEmail: user.email,
      avatarUrl: avatarUrls[index % avatarUrls.length],
      coverUrl: coverUrls[index % coverUrls.length],
      photoUrls: [photoUrls[index % photoUrls.length]],
      lat: buildCoordinate(-34.6037, 0.018, index),
      lng: buildCoordinate(-58.3816, -0.015, index),
      placeId: `${professionalSeed.city.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
    });

    await professionalProfile.addCategories(
      professionalSeed.categorySlugs.map((slug) => categoriesBySlug[slug]),
    );

    await models.ServiceArea.bulkCreate([
      {
        professionalProfileId: professionalProfile.id,
        city: professionalSeed.city,
        province: professionalSeed.province,
        radiusKm: 10 + (index % 4) * 5,
        lat: professionalProfile.lat,
        lng: professionalProfile.lng,
        placeId: professionalProfile.placeId,
      },
      {
        professionalProfileId: professionalProfile.id,
        city: 'Buenos Aires',
        province: professionalSeed.province,
        radiusKm: 15 + (index % 3) * 5,
      },
    ]);

    createdProfessionals.push({ user, profile: professionalProfile, seed: professionalSeed });
  }

  return createdProfessionals;
}

async function createServiceRequests(models, customers, professionals, categoriesBySlug) {
  const requests = [];

  for (let index = 0; index < 10; index += 1) {
    const customer = customers[index];
    const professional = professionals[index];
    const categorySlug = professional.seed.categorySlugs[0];
    const category = categoriesBySlug[categorySlug];
    const acceptedAt = new Date(Date.now() - index * 86400000);

    const request = await models.ServiceRequest.create({
      customerId: customer.id,
      professionalId: professional.profile.id,
      categoryId: category.id,
      status: 'ACCEPTED',
      title: `Consulta de ${category.name.toLowerCase()} #${index + 1}`,
      customerMessage: `Necesito ayuda con un trabajo de ${category.name.toLowerCase()} en ${professional.seed.city}.`,
      city: professional.seed.city,
      province: professional.seed.province,
      addressLine: `Calle ${index + 100} #${200 + index}`,
      budgetAmount: 25000 + index * 7500,
      budgetCurrency: 'ARS',
      acceptedAt,
      contactUnlockedAt: acceptedAt,
    });

    await models.ServiceRequestMessage.bulkCreate([
      {
        serviceRequestId: request.id,
        senderUserId: customer.id,
        body: `Hola, necesito una cotizacion para ${category.name.toLowerCase()}.`,
      },
      {
        serviceRequestId: request.id,
        senderUserId: professional.user.id,
        body: 'Perfecto, puedo ayudarte y coordinar una visita.',
      },
    ]);

    await models.Review.create({
      serviceRequestId: request.id,
      reviewerUserId: customer.id,
      professionalId: professional.profile.id,
      rating: 5 - (index % 2),
      comment: 'Muy buena experiencia, respondio rapido y resolvio el trabajo.',
      status: 'VISIBLE',
    });

    requests.push(request);
  }

  return requests;
}

async function seed() {
  const models = initModels(sequelize);

  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  const categories = await models.Category.bulkCreate(CATEGORY_SEEDS, { returning: true });
  const categoriesBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));

  const adminPasswordHash = await bcrypt.hash('Admin1234', 10);
  const customerPasswordHash = await bcrypt.hash('Cliente1234', 10);
  const professionalPasswordHash = await bcrypt.hash('Profesional1234', 10);

  await models.User.create({
    email: 'admin@oficios.app',
    passwordHash: adminPasswordHash,
    firstName: 'Admin',
    lastName: 'Marketplace',
    roles: [UserRole.CUSTOMER, UserRole.ADMIN],
  });

  const customers = await createCustomers(models, customerPasswordHash);
  const professionals = await createProfessionals(models, categoriesBySlug, professionalPasswordHash);

  await createServiceRequests(models, customers, professionals, categoriesBySlug);

  console.log('Seed completed');
  console.log(`Categorias creadas: ${categories.length}`);
  console.log(`Clientes creados: ${customers.length}`);
  console.log(`Profesionales creados: ${professionals.length}`);
  console.log('Admin: admin@oficios.app / Admin1234');
  console.log('Clientes: cliente1@oficios.app ... cliente20@oficios.app / Cliente1234');
  console.log('Profesionales: pro1@oficios.app ... pro20@oficios.app / Profesional1234');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });
