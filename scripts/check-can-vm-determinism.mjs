#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const runner = path.join(repoRoot, 'scripts', 'run-can-vm-vectors.mjs');

function run(outDir) {
  const p = spawnSync('node', [runner, '--out-dir', outDir], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (p.status !== 0) {
    process.stderr.write(p.stdout || '');
    process.stderr.write(p.stderr || '');
    process.exit(p.status || 1);
  }
  return JSON.parse(fs.readFileSync(path.join(outDir, 'can-vm-check.json'), 'utf8'));
}

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'can-vm-det-'));
const a = path.join(base, 'a');
const b = path.join(base, 'b');
fs.mkdirSync(a, { recursive: true });
fs.mkdirSync(b, { recursive: true });

const ca = run(a);
const cb = run(b);

const stable = ca.canbc_sha256 === cb.canbc_sha256 && ca.ndjson_sha256 === cb.ndjson_sha256;
const out = {
  schema_version: 1,
  runtime: 'can-vm-js',
  stable,
  run_a: { canbc_sha256: ca.canbc_sha256, ndjson_sha256: ca.ndjson_sha256 },
  run_b: { canbc_sha256: cb.canbc_sha256, ndjson_sha256: cb.ndjson_sha256 }
};

process.stdout.write(`${JSON.stringify(out)}\n`);
if (!stable) process.exit(2);
