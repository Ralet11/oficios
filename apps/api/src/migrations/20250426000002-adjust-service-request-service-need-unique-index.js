'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "service_requests_service_need_professional_unique";
      CREATE UNIQUE INDEX IF NOT EXISTS "service_requests_service_need_professional_active_unique"
      ON "service_requests" ("service_need_id", "professional_id")
      WHERE "service_need_id" IS NOT NULL
        AND "status" IN ('PENDING', 'AWAITING_PRO_CONFIRMATION', 'ACCEPTED');
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "service_requests_service_need_professional_active_unique";
      CREATE UNIQUE INDEX IF NOT EXISTS "service_requests_service_need_professional_unique"
      ON "service_requests" ("service_need_id", "professional_id");
    `);
  },
};
