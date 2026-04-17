const bcrypt = require('bcryptjs');
const { AuthProvider, UserRole } = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { hashToken, signAccessToken } = require('../services/tokens');
const { serializeProfessional, serializeUser } = require('../utils/serializers');

async function createSession(models, user, req) {
  const token = signAccessToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await models.Session.create({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: req.headers['user-agent'] || null,
    ipAddress: req.ip,
  });

  return {
    token,
    user: serializeUser(user),
  };
}

async function register(req, res) {
  const models = req.models;
  const payload = req.validated.body;

  const existingUser = await models.User.findOne({ where: { email: payload.email.toLowerCase() } });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await models.User.create({
    email: payload.email.toLowerCase(),
    passwordHash: await bcrypt.hash(payload.password, 10),
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone || null,
    roles: [UserRole.CUSTOMER],
  });

  await models.AuthIdentity.create({
    userId: user.id,
    provider: AuthProvider.PASSWORD,
    providerUserId: user.email,
    email: user.email,
  });

  res.status(201).json(await createSession(models, user, req));
}

async function login(req, res) {
  const models = req.models;
  const payload = req.validated.body;

  const user = await models.User.findOne({ where: { email: payload.email.toLowerCase() } });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 401);
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Invalid credentials', 401);
  }

  res.json(await createSession(models, user, req));
}

async function socialLogin(req, res) {
  const models = req.models;
  const payload = req.validated.body;

  let identity = await models.AuthIdentity.findOne({
    where: {
      provider: payload.provider,
      providerUserId: payload.providerUserId,
    },
    include: [{ model: models.User, as: 'user' }],
  });

  if (!identity) {
    let user = await models.User.findOne({ where: { email: payload.email.toLowerCase() } });

    if (!user) {
      user = await models.User.create({
        email: payload.email.toLowerCase(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        roles: [UserRole.CUSTOMER],
      });
    }

    identity = await models.AuthIdentity.create({
      userId: user.id,
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      email: payload.email.toLowerCase(),
    });

    identity.user = user;
  }

  res.json(await createSession(models, identity.user, req));
}

async function me(req, res) {
  const user = await req.models.User.findByPk(req.auth.user.id, {
    include: [
      {
        model: req.models.ProfessionalProfile,
        as: 'professionalProfile',
        include: [
          { model: req.models.Category, as: 'categories', through: { attributes: [] } },
          { model: req.models.ServiceArea, as: 'serviceAreas' },
        ],
      },
    ],
  });

  res.json({
    user: serializeUser(user),
    professionalProfile: user.professionalProfile
      ? serializeProfessional(user.professionalProfile, { includeContact: true })
      : null,
  });
}

async function logout(req, res) {
  await req.models.Session.destroy({
    where: { id: req.auth.session.id },
  });

  res.status(204).send();
}

async function activateProfessionalRole(req, res) {
  const user = req.auth.user;
  const roles = Array.from(new Set([...(user.roles || []), UserRole.PROFESSIONAL]));
  const payload = req.validated.body;

  await user.update({ roles });

  let professionalProfile = await req.models.ProfessionalProfile.findOne({
    where: { userId: user.id },
  });

  if (!professionalProfile) {
    professionalProfile = await req.models.ProfessionalProfile.create({
      userId: user.id,
      businessName: payload.businessName,
      status: 'DRAFT',
    });
  }

  res.json({
    user: serializeUser(await user.reload()),
    professionalProfile,
  });
}

module.exports = {
  activateProfessionalRole,
  login,
  logout,
  me,
  register,
  socialLogin,
};
