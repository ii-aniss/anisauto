'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const targets = ['server', 'scripts', 'api', path.join('public', 'js')];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
  }
}

for (const target of targets) walk(path.join(root, target));

let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAIL ${path.relative(root, file)}`);
    if (result.stderr) console.error(result.stderr.trim());
  }
}

if (failed) {
  console.error(`\n${failed} of ${files.length} JavaScript files failed syntax checks.`);
  process.exit(1);
}

console.log(`${files.length} JavaScript files passed syntax checks.`);
