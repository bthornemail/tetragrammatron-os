import fs from 'node:fs';

export function reduceEventsJsonl(eventsPath) {
  const lines = fs.readFileSync(eventsPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const state = {
    schema: 'tetragrammatron/state@v1',
    addr: null,
    last_seen: null,
    profile8: { p: null, r: null },
    mesh: { edges: [] },
    kv: {},
  };

  for (const line of lines) {
    const event = JSON.parse(line);
    if (!state.addr && event.a) state.addr = event.a;
    if (event.t) state.last_seen = event.t;

    if (event.k === 'mesh.edge') {
      state.mesh.edges.push(event.v);
      continue;
    }
    if (event.k === 'profile8.p') {
      state.profile8.p = event.v;
      continue;
    }
    if (event.k === 'projection.residue') {
      state.profile8.r = event.v;
      continue;
    }

    state.kv[event.k] = event.v;
  }

  return state;
}

export function writeStateJson(eventsPath, outPath) {
  const reduced = reduceEventsJsonl(eventsPath);
  fs.writeFileSync(outPath, `${JSON.stringify(reduced, null, 2)}\n`);
}
