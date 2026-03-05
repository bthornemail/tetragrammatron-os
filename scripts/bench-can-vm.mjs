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

function arg(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function sha256File(filePath) {
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
}

function p50(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) * 0.5)] || 0;
}

function p95(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) * 0.95)] || 0;
}

function main() {
  const outDir = path.resolve(arg('--out-dir', path.join(repoRoot, 'artifacts', 'vm', 'can-vm')));
  const warmup = Number(arg('--warmup', '100'));
  const iterations = Number(arg('--iterations', '2000'));
  fs.mkdirSync(outDir, { recursive: true });

  const asm = [
    'LOAD8 r0, 42',
    'LOAD8 r1, 5',
    'EMITREGS "telemetry.regs" r0 2',
    'HALT'
  ].join('\n');

  const compileNsSamples = [];
  const execNsSamples = [];
  const caseDir = path.join(outDir, 'bench-tmp');
  fs.mkdirSync(caseDir, { recursive: true });
  const canbcPath = path.join(caseDir, 'emitregs-basic.canbc');
  const ndjsonPath = path.join(caseDir, 'can-vm-run.ndjson');
  const addrBytes = parseAddr('01:02:03:04:05:06:07:08');
  let emittedOk = false;

  // Compile benchmark: asm -> bytecode only (no filesystem write).
  for (let i = 0; i < warmup + iterations; i += 1) {
    const tCompile0 = process.hrtime.bigint();
    assembleCanisa(asm);
    const tCompile1 = process.hrtime.bigint();
    if (i >= warmup) {
      compileNsSamples.push(Number(tCompile1 - tCompile0));
    }
  }

  // Prepare one canonical CANBC for execution benchmark.
  const { codeBytes, constBytes } = assembleCanisa(asm);
  writeCanbc({
    outPath: canbcPath,
    addrBytes,
    mode: MODE.PRIVATE7,
    admissibleRule: RULE.EXCEPT6,
    flags: 0,
    codeBytes,
    constBytes,
    sections: []
  });

  // Execution benchmark: run interpreter over same CANBC.
  for (let i = 0; i < warmup + iterations; i += 1) {
    fs.writeFileSync(ndjsonPath, '');

    const tExec0 = process.hrtime.bigint();
    runCanbc(canbcPath, {
      emitPath: ndjsonPath,
      now: () => '1970-01-01T00:00:00.000Z'
    });
    const tExec1 = process.hrtime.bigint();

    if (i >= warmup) {
      execNsSamples.push(Number(tExec1 - tExec0));
    }

    if (i === warmup + iterations - 1) {
      const records = fs
        .readFileSync(ndjsonPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const telemetry = records.find((r) => r.k === 'telemetry.regs');
      emittedOk = Array.isArray(telemetry?.v) && telemetry.v[0] === 42 && telemetry.v[1] === 5;
    }
  }

  // Preserve deterministic single-run artifacts for attestation.
  fs.writeFileSync(ndjsonPath, '');
  runCanbc(canbcPath, {
    emitPath: ndjsonPath,
    now: () => '1970-01-01T00:00:00.000Z'
  });
  {
    const records = fs
      .readFileSync(ndjsonPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const telemetry = records.find((r) => r.k === 'telemetry.regs');
    emittedOk = Array.isArray(telemetry?.v) && telemetry.v[0] === 42 && telemetry.v[1] === 5;
  }

  const benchNdjsonPath = path.join(outDir, 'can-vm-bench.ndjson');
  const benchEvents = [
    {
      event: 'vm.bench.start',
      seq: 1,
      payload: { runtime: 'can-vm-js', case: 'emitregs-basic', warmup, iterations }
    },
    {
      event: 'vm.bench.metric',
      seq: 2,
      payload: {
        runtime: 'can-vm-js',
        case: 'emitregs-basic',
        metric: 'compile_ns',
        p50: p50(compileNsSamples),
        p95: p95(compileNsSamples),
        total: compileNsSamples.reduce((a, b) => a + b, 0)
      }
    },
    {
      event: 'vm.bench.metric',
      seq: 3,
      payload: {
        runtime: 'can-vm-js',
        case: 'emitregs-basic',
        metric: 'exec_ns',
        p50: p50(execNsSamples),
        p95: p95(execNsSamples),
        total: execNsSamples.reduce((a, b) => a + b, 0),
        ops_per_sec: Math.floor(1e9 / Math.max(1, p50(execNsSamples)))
      }
    },
    {
      event: 'vm.bench.end',
      seq: 4,
      payload: { runtime: 'can-vm-js', case: 'emitregs-basic', pass: emittedOk }
    }
  ];
  fs.writeFileSync(benchNdjsonPath, `${benchEvents.map((e) => JSON.stringify(e)).join('\n')}\n`);

  const summary = {
    schema_version: 1,
    runtime: 'can-vm-js',
    case: 'emitregs-basic',
    warmup_iterations: warmup,
    iterations,
    pass: emittedOk,
    compile_ns: {
      total: compileNsSamples.reduce((a, b) => a + b, 0),
      p50: p50(compileNsSamples),
      p95: p95(compileNsSamples)
    },
    exec_ns: {
      total: execNsSamples.reduce((a, b) => a + b, 0),
      p50: p50(execNsSamples),
      p95: p95(execNsSamples),
      ns_per_iter: p50(execNsSamples),
      ops_per_sec: Math.floor(1e9 / Math.max(1, p50(execNsSamples)))
    },
    emitted_ok: emittedOk,
    artifacts: {
      bench_ndjson_sha256: sha256File(benchNdjsonPath),
      canbc_sha256: canbcPath ? sha256File(canbcPath) : null,
      run_ndjson_sha256: ndjsonPath ? sha256File(ndjsonPath) : null,
      runner_sha256: sha256File(__filename)
    }
  };

  const summaryPath = path.join(outDir, 'can-vm-bench.json');
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary)}\n`);

  if (!emittedOk) process.exit(2);
}

main();
