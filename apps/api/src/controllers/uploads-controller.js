const { hasRole } = require('@oficios/domain');
const { createImageUploadIntent: buildImageUploadIntent } = require('../services/uploads');
const { AppError } = require('../utils/app-error');

function assertUploadIntentAccess(user, scope) {
  if (scope === 'professional-work-post' && !hasRole(user, 'PROFESSIONAL')) {
    throw new AppError('Professional role required for work post uploads', 403);
  }

  if (scope !== 'professional-work-post' && scope !== 'service-need') {
    throw new AppError('Unsupported upload scope', 400);
  }
}

async function createImageUploadIntent(req, res) {
  const { scope, fileName, mimeType } = req.validated.body;
  assertUploadIntentAccess(req.auth.user, scope);

  const intent = buildImageUploadIntent({
    scope,
    fileName,
    mimeType,
    user: req.auth.user,
  });

  res.json({
    data: intent,
  });
}

module.exports = {
  createImageUploadIntent,
};
