const { createImageUploadIntent } = require('../services/uploads');

async function createWorkPostImageUploadIntent(req, res) {
  const intent = createImageUploadIntent({
    scope: req.validated.body.scope,
    fileName: req.validated.body.fileName,
    mimeType: req.validated.body.mimeType,
    user: req.auth.user,
  });

  res.json({
    data: intent,
  });
}

module.exports = {
  createWorkPostImageUploadIntent,
};
