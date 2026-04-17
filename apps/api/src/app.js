const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { env } = require('./config/env');
const { buildOpenApiDocument } = require('./docs/openapi');
const { errorHandler, notFound } = require('./middlewares/error-handler');

function createApp(models) {
  const app = express();
  const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));
  app.use((req, _res, next) => {
    req.models = models;
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(buildOpenApiDocument()));
  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
