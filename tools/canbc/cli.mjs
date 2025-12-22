#!/usr/bin/env node
import fs from 'node:fs';
import { parseAddr, sha256File, buildHashesSection, writeCanbc, readCanbc, formatAddr, FLAGS, SECTION } from './canbc.js';
import { assembleCanisa, disassemble, MODE, RULE } from './canisa.js';
import { writeStateJson } from './reduce_state.js';
import { runCanbc } from './interpreter.js';

function arg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const cmd = process.argv[2];

switch (cmd) {
  case 'build':
    build();
    break;
  case 'disasm':
    disasm();
    break;
  case 'state':
    state();
    break;
  case 'run':
    run();
    break;
  default:
    usage();
    process.exit(cmd ? 1 : 0);
}

function build() {
  const addrStr = arg('--addr');
  const input = arg('--in');
  if (!addrStr || !input) {
    throw new Error('usage: build --addr ADDR --in file.canisa [--out program.canbc]');
  }
  const out = arg('--out') ?? 'program.canbc';
  const mode = parseMode(arg('--mode') ?? 'private7');
  const rule = parseRule(arg('--rule') ?? 'except6');
  const addrBytes = parseAddr(addrStr);
  const asmText = fs.readFileSync(input, 'utf8');
  const { codeBytes, constBytes } = assembleCanisa(asmText);

  const hashEntries = [];
  const events = arg('--events');
  const topology = arg('--topology');
  const manifest = arg('--manifest');
  if (events && fs.existsSync(events)) hashEntries.push({ kind: 1, hash: sha256File(events) });
  if (topology && fs.existsSync(topology)) hashEntries.push({ kind: 2, hash: sha256File(topology) });
  if (manifest && fs.existsSync(manifest)) hashEntries.push({ kind: 3, hash: sha256File(manifest) });

  const sections = [];
  let flags = 0;
  if (hashEntries.length) {
    sections.push({ tag: SECTION.HASHES, payload: buildHashesSection(hashEntries) });
    flags |= FLAGS.HAS_HASHES;
  }

  writeCanbc({
    outPath: out,
    addrBytes,
    mode,
    admissibleRule: rule,
    flags,
    codeBytes,
    constBytes,
    sections,
  });
  process.stdout.write(`wrote ${out}\n`);
}

function disasm() {
  const input = arg('--in');
  if (!input) throw new Error('usage: disasm --in program.canbc [--out program.canisa]');
  const out = arg('--out') ?? 'program.canisa';
  const file = readCanbc(input);
  const text = [
    '; CanISA v1',
    `; addr: ${formatAddr(file.addr)}`,
    `; mode: 0x${file.mode.toString(16)}`,
    `; rule: 0x${file.admissibleRule.toString(16)}`,
    '',
    disassemble(file.codeBytes, file.constBytes),
  ].join('\n');
  fs.writeFileSync(out, text);
  process.stdout.write(`wrote ${out}\n`);
}

function state() {
  const events = arg('--events');
  if (!events) throw new Error('usage: state --events file.jsonl [--out state.json]');
  const out = arg('--out') ?? 'state.json';
  writeStateJson(events, out);
  process.stdout.write(`wrote ${out}\n`);
}

function run() {
  const input = arg('--in');
  if (!input) throw new Error('usage: run --in program.canbc [--out trace.jsonl]');
  const out = arg('--out') ?? null;
  runCanbc(input, { emitPath: out });
  if (out) process.stdout.write(`wrote ${out}\n`);
}

function parseMode(name) {
  switch (name.toLowerCase()) {
    case 'private7':
      return MODE.PRIVATE7;
    case 'public4':
      return MODE.PUBLIC4;
    case 'parity':
      return MODE.PARITY;
    case 'prime':
      return MODE.PRIME;
    default:
      throw new Error(`unknown mode ${name}`);
  }
}

function parseRule(name) {
  switch (name.toLowerCase()) {
    case 'except6':
      return RULE.EXCEPT6;
    case 'set4':
      return RULE.SET4;
    case 'custom':
      return RULE.CUSTOM;
    default:
      throw new Error(`unknown rule ${name}`);
  }
}

function usage() {
  process.stderr.write(`usage: cli.mjs <cmd> [options]\n\ncommands:\n  build  --addr ADDR --in program.canisa [--out program.canbc]\n  disasm --in program.canbc [--out program.canisa]\n  state  --events events.jsonl [--out state.json]\n  run    --in program.canbc [--out trace.jsonl]\n`);
}
