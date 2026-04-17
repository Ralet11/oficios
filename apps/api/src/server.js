const { env } = require('./config/env');
const { sequelize } = require('./db/sequelize');
const { initModels } = require('./models');
const { createApp } = require('./app');

async function bootstrap() {
  const models = initModels(sequelize);
  await sequelize.authenticate();
  await sequelize.sync();

  const app = createApp(models);
  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
