'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ENV_PATH = path.join(__dirname, '..', '.env');

if (fs.existsSync(ENV_PATH) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(ENV_PATH);
}

module.exports = { ENV_PATH };
