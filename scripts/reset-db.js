'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { ENV_PATH } = require('./load-env');

if (process.env.DATABASE_URL) {
  console.error(`Refusing to reset a remote database.

DATABASE_URL is set${fs.existsSync(ENV_PATH) ? ' in .env' : ' in the environment'}.
Create a fresh Neon branch or drop the AniissAuto tables manually instead.`);
  process.exit(1);
}

const dataDir = path.join(__dirname, '..', 'data');
const targets = [
  path.join(dataDir, 'pglite'),
  path.join(dataDir, 'aniissauto.db'),
  path.join(dataDir, 'aniissauto.db-wal'),
  path.join(dataDir, 'aniissauto.db-shm')
];

for (const target of targets) fs.rmSync(target, { recursive: true, force: true });

console.log('Local database reset. The showroom catalogue will be seeded on the next start.');
