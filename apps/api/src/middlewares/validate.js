const { AppError } = require('../utils/app-error');

function validate({ body, query, params }) {
  return function validationMiddleware(req, _res, next) {
    try {
      req.validated = {};

      if (body) {
        req.validated.body = body.parse(req.body);
      }

      if (query) {
        req.validated.query = query.parse(req.query);
      }

      if (params) {
        req.validated.params = params.parse(req.params);
      }

      return next();
    } catch (error) {
      return next(new AppError('Validation failed', 422, error.flatten ? error.flatten() : error.message));
    }
  };
}

module.exports = {
  validate,
};
