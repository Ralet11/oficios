const dotenv = require('dotenv');
const path = require('path');
const { parseApiEnv } = require('@oficios/config');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const env = parseApiEnv(process.env);

module.exports = {
  env,
};
