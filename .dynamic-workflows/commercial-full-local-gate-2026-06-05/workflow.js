#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runner = "/Users/sanjayb/.codex/plugins/cache/local-codex-marketplace/everything-claude-code/1.9.0/skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js";
const command = process.argv[2] || 'status';
const args = process.argv.slice(3);
const result = spawnSync(process.execPath, [runner, command, '--run', __dirname, ...args], {
  stdio: 'inherit'
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
if (result.signal) {
  console.error(`dynamic workflow runner terminated by signal ${result.signal}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
