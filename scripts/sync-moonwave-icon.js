#!/usr/bin/env node
// Sync shared/assets/Moonwave.png to public/Moonwave.png without resizing
// Usage: node scripts/sync-moonwave-icon.js

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const sharedPath = path.join(projectRoot, 'shared', 'assets', 'Moonwave.png');
const publicPath = path.join(projectRoot, 'public', 'Moonwave.png');

function ensureSharedFromPublicIfMissing() {
  if (!fs.existsSync(sharedPath) && fs.existsSync(publicPath)) {
    fs.mkdirSync(path.dirname(sharedPath), { recursive: true });
    fs.copyFileSync(publicPath, sharedPath);
    console.log('[sync-moonwave-icon] seeded shared/assets/Moonwave.png from public');
  }
}

function sync() {
  ensureSharedFromPublicIfMissing();
  if (!fs.existsSync(sharedPath)) {
    console.error('[sync-moonwave-icon] missing', sharedPath);
    process.exit(1);
  }
  const srcStat = fs.statSync(sharedPath);
  const srcBuf = fs.readFileSync(sharedPath);
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(publicPath, srcBuf);
  const destStat = fs.statSync(publicPath);
  console.log(
    `[sync-moonwave-icon] copied Moonwave.png (${srcStat.size} bytes) -> public (${destStat.size} bytes)`
  );
}

sync();

