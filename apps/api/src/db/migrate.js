const { sequelize } = require('./sequelize');
const migrationCustomerProfile = require('../migrations/20250425000000-create-customer-profile');
const migrationReviewerRole = require('../migrations/20250425000001-add-reviewer-role-to-reviews');
const migrationServiceNeeds = require('../migrations/20250426000000-create-service-needs');
const migrationServiceRequestNeedFields = require('../migrations/20250426000001-add-service-need-fields-to-service-requests');
const migrationServiceRequestNeedUniqueIndex = require('../migrations/20250426000002-adjust-service-request-service-need-unique-index');
const migrationProfessionalProfilePublicDetails = require('../migrations/20250429000000-add-professional-profile-public-details');
const { DataTypes } = require('sequelize');

async function runMigrationStep(label, migration, sequelizeTypes) {
  console.log(`-> ${label}`);

  try {
    await migration.up(sequelize.getQueryInterface(), sequelizeTypes);
    console.log('  OK\n');
  } catch (err) {
    const errorCodes = [err.code, err.original && err.original.code, err.parent && err.parent.code].filter(Boolean);
    const errorMessages = [err.message, err.original && err.original.message, err.parent && err.parent.message]
      .filter(Boolean)
      .map((message) => String(message).toLowerCase());

    if (errorCodes.includes('42710') || errorCodes.includes('42P07')) {
      console.log('  Already exists, skipping\n');
      return;
    }

    if (errorCodes.includes('23505')) {
      console.log('  Duplicate, skipping\n');
      return;
    }

    if (
      errorMessages.some(
        (message) =>
          message.includes('already exists') ||
          message.includes('ya existe') ||
          message.includes('duplicate'),
      )
    ) {
      console.log('  Already exists, skipping\n');
      return;
    }

    throw err;
  }
}

async function migrate() {
  console.log('Running migrations...\n');

  try {
    await sequelize.authenticate();
    console.log('DB connected\n');

    await runMigrationStep('Migration 1: create customer_profiles', migrationCustomerProfile, {
      INTEGER: DataTypes.INTEGER,
      STRING: DataTypes.STRING,
      TEXT: DataTypes.TEXT,
      FLOAT: DataTypes.FLOAT,
      DATE: DataTypes.DATE,
      JSONB: DataTypes.JSONB,
      BOOLEAN: DataTypes.BOOLEAN,
      literal: (value) => sequelize.literal(value),
    });

    await runMigrationStep('Migration 2: add reviewer_role to reviews', migrationReviewerRole, {
      ENUM: DataTypes.ENUM,
    });

    await runMigrationStep('Migration 3: create service_needs', migrationServiceNeeds, {
      INTEGER: DataTypes.INTEGER,
      STRING: DataTypes.STRING,
      TEXT: DataTypes.TEXT,
      FLOAT: DataTypes.FLOAT,
      DATE: DataTypes.DATE,
      JSONB: DataTypes.JSONB,
      BOOLEAN: DataTypes.BOOLEAN,
      ENUM: DataTypes.ENUM,
      literal: (value) => sequelize.literal(value),
    });

    await runMigrationStep('Migration 4: add service_need fields to service_requests', migrationServiceRequestNeedFields, {
      INTEGER: DataTypes.INTEGER,
      STRING: DataTypes.STRING,
      DATE: DataTypes.DATE,
      ENUM: DataTypes.ENUM,
    });

    await runMigrationStep(
      'Migration 5: adjust service_request uniqueness per active service_need thread',
      migrationServiceRequestNeedUniqueIndex,
      {},
    );

    await runMigrationStep('Migration 6: add public profile enrichment fields', migrationProfessionalProfilePublicDetails, {
      JSONB: DataTypes.JSONB,
    });

    console.log('All migrations ran successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
