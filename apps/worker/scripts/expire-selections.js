/**
 * Worker Script: Expire old service need selections.
 * 
 * This script is intended to be called by a cron job (e.g., every hour).
 * It finds ServiceNeeds stuck in SELECTION_PENDING_CONFIRMATION for more 
 * than 24 hours and reverts them to OPEN.
 * 
 * Usage: node apps/worker/scripts/expire-selections.js
 */

const path = require('path');

// Load env vars (adjust path if necessary, usually from project root)
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { Sequelize } = require('sequelize');
const { initModels } = require('../../../apps/api/src/models');
const { expireOldSelections } = require('../../../apps/api/src/controllers/service-needs-controller');

async function run() {
  let sequelize;

  try {
    // Initialize DB connection (similar to API startup)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
    });

    const models = initModels(sequelize);

    console.log('[Worker] Starting expiration check...');
    const expiredCount = await expireOldSelections(models);
    console.log(`[Worker] Finished. Expired ${expiredCount} selections.`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('[Worker] Error during expiration process:', error);
    if (sequelize) await sequelize.close();
    process.exit(1);
  }
}

run();
