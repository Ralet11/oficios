const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { AuthProvider, UserRole } = require('@oficios/domain');
const { AppError } = require('../utils/app-error');
const { hashToken, signAccessToken } = require('../services/tokens');
const { serializeProfessional, serializeUser } = require('../utils/serializers');

const PHONE_CODE_TTL_MS = 5 * 60 * 1000;
const PHONE_CODE_LENGTH = 6;
const PHONE_CODE_MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 13) {
    throw new AppError('Telefono invalido', 400);
  }

  const normalizedDigits = digits.startsWith('54') ? digits : `54${digits}`;
  return `+${normalizedDigits}`;
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generatePhoneCode() {
  const min = 10 ** (PHONE_CODE_LENGTH - 1);
  const max = 10 ** PHONE_CODE_LENGTH;
  return String(Math.floor(Math.random() * (max - min)) + min);
}

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
  const normalizedEmail = normalizeEmail(payload.email);

  const existingUser = await models.User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await models.User.create({
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(payload.password, 10),
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone ? normalizePhone(payload.phone) : null,
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

async function startPhoneAuth(req, res) {
  const models = req.models;
  const payload = req.validated.body;
  const normalizedPhone = normalizePhone(payload.phone);
  const code = generatePhoneCode();

  await models.AuthVerificationCode.destroy({
    where: {
      provider: AuthProvider.PHONE,
      targetValue: normalizedPhone,
    },
  });

  await models.AuthVerificationCode.create({
    provider: AuthProvider.PHONE,
    targetValue: normalizedPhone,
    codeHash: hashVerificationCode(code),
    expiresAt: new Date(Date.now() + PHONE_CODE_TTL_MS),
  });

  res.status(201).json({
    ok: true,
    phone: normalizedPhone,
    expiresInSeconds: Math.floor(PHONE_CODE_TTL_MS / 1000),
    ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
  });
}

async function verifyPhoneAuth(req, res) {
  const models = req.models;
  const payload = req.validated.body;
  const normalizedPhone = normalizePhone(payload.phone);
  const codeHash = hashVerificationCode(payload.code);

  const verification = await models.AuthVerificationCode.findOne({
    where: {
      provider: AuthProvider.PHONE,
      targetValue: normalizedPhone,
      consumedAt: null,
    },
    order: [['createdAt', 'DESC']],
  });

  if (!verification || new Date(verification.expiresAt).getTime() < Date.now()) {
    throw new AppError('El codigo expiro. Pedi uno nuevo.', 400);
  }

  if (verification.attempts >= PHONE_CODE_MAX_ATTEMPTS) {
    throw new AppError('Se bloquearon los intentos. Pedi un codigo nuevo.', 429);
  }

  if (verification.codeHash !== codeHash) {
    await verification.update({ attempts: verification.attempts + 1 });
    throw new AppError('Codigo incorrecto', 400);
  }

  let user = await models.User.findOne({ where: { phone: normalizedPhone } });

  if (!user) {
    if (!payload.firstName || !payload.lastName || !payload.email) {
      res.json({
        status: 'PROFILE_REQUIRED',
        phone: normalizedPhone,
      });
      return;
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const existingEmailUser = await models.User.findOne({ where: { email: normalizedEmail } });
    if (existingEmailUser) {
      throw new AppError('Email already registered', 409);
    }

    user = await models.User.create({
      email: normalizedEmail,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: normalizedPhone,
      roles: [UserRole.CUSTOMER],
    });

  }

  await verification.update({ consumedAt: new Date() });

  res.json({
    status: 'AUTHENTICATED',
    session: await createSession(models, user, req),
  });
}

async function login(req, res) {
  const models = req.models;
  const payload = req.validated.body;
  const normalizedEmail = normalizeEmail(payload.email);

  const user = await models.User.findOne({ where: { email: normalizedEmail } });
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
  const normalizedEmail = normalizeEmail(payload.email);

  let identity = await models.AuthIdentity.findOne({
    where: {
      provider: payload.provider,
      providerUserId: payload.providerUserId,
    },
    include: [{ model: models.User, as: 'user' }],
  });

  if (!identity) {
    let user = await models.User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      user = await models.User.create({
        email: normalizedEmail,
        firstName: payload.firstName,
        lastName: payload.lastName,
        roles: [UserRole.CUSTOMER],
      });
    }

    identity = await models.AuthIdentity.create({
      userId: user.id,
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      email: normalizedEmail,
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
  startPhoneAuth,
  verifyPhoneAuth,
};
