#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assembleCanisa, MODE, RULE } from '../tools/canbc/canisa.js';
import { parseAddr, writeCanbc } from '../tools/canbc/canbc.js';
import { runCanbc } from '../tools/canbc/interpreter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function arg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

function sha256File(filePath) {
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
}

function sha256Text(text) {
  return `sha256:${crypto.createHash('sha256').update(text).digest('hex')}`;
}

function main() {
  const outDirArg = arg('--out-dir');
  const outDir = path.resolve(outDirArg || path.join(repoRoot, 'artifacts', 'vm', 'can-vm'));
  fs.mkdirSync(outDir, { recursive: true });

  const asm = [
    'LOAD8 r0, 42',
    'LOAD8 r1, 5',
    'EMITREGS "telemetry.regs" r0 2',
    'HALT'
  ].join('\n');

  const { codeBytes, constBytes } = assembleCanisa(asm);
  const canbcPath = path.join(outDir, 'emitregs-basic.canbc');
  writeCanbc({
    outPath: canbcPath,
    addrBytes: parseAddr('01:02:03:04:05:06:07:08'),
    mode: MODE.PRIVATE7,
    admissibleRule: RULE.EXCEPT6,
    flags: 0,
    codeBytes,
    constBytes,
    sections: []
  });

  const ndjsonPath = path.join(outDir, 'can-vm-run.ndjson');
  fs.writeFileSync(ndjsonPath, '');
  runCanbc(canbcPath, {
    emitPath: ndjsonPath,
    now: () => '1970-01-01T00:00:00.000Z'
  });

  const records = fs
    .readFileSync(ndjsonPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const telemetry = records.find((r) => r.k === 'telemetry.regs');
  const pass = Array.isArray(telemetry?.v) && telemetry.v.length === 2 && telemetry.v[0] === 42 && telemetry.v[1] === 5;

  const check = {
    schema_version: 1,
    runtime: 'can-vm-js',
    case: 'emitregs-basic',
    pass,
    records: records.length,
    emitted_key: telemetry?.k || null,
    emitted_values: telemetry?.v || null,
    asm_sha256: sha256Text(asm),
    canbc_sha256: sha256File(canbcPath),
    ndjson_sha256: sha256File(ndjsonPath),
    runner_sha256: sha256File(__filename)
  };

  const checkPath = path.join(outDir, 'can-vm-check.json');
  fs.writeFileSync(checkPath, `${JSON.stringify(check, null, 2)}\n`);

  process.stdout.write(`${JSON.stringify(check)}\n`);
  if (!pass) process.exit(2);
}

main();
