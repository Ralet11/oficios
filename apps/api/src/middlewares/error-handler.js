function notFound(_req, res) {
  res.status(404).json({
    error: 'Not Found',
  });
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    error: error.message || 'Internal Server Error',
    details: error.details || null,
  });
}

module.exports = {
  errorHandler,
  notFound,
};
