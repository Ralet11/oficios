const { verifyAccessToken, hashToken } = require('../services/tokens');
const { AppError } = require('../utils/app-error');
const { hasRole } = require('@oficios/domain');

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = verifyAccessToken(token);
    const session = await req.models.Session.findOne({
      where: {
        tokenHash: hashToken(token),
      },
      include: [{ model: req.models.User, as: 'user', include: [{ model: req.models.ProfessionalProfile, as: 'professionalProfile' }] }],
    });

    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      throw new AppError('Session expired', 401);
    }

    req.auth = {
      token,
      payload,
      user: session.user,
      session,
    };

    return next();
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError('Invalid token', 401));
  }
}

function requireRole(role) {
  return function roleMiddleware(req, _res, next) {
    if (!req.auth?.user || !hasRole(req.auth.user, role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
