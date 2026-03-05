#!/usr/bin/env python3
"""
tetragrammatron-os -> ULP seam envelope emitter (Producer).

Wraps hardware probe JSONL facts as seam envelopes:
- strict input schema per line (fail closed)
- stable ordering (preserve input line order)
- string-only values
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def canonical_json(obj: object) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def component_prefix(namespace: str) -> str:
    parts = namespace.split(".")
    if len(parts) < 4 or parts[0:2] != ["ulp", "trace"]:
        raise SystemExit(f"namespace invalid (expected ulp.trace.<producer>.*.vN): {namespace!r}")
    return parts[2] + "__"


def emit_ndjson(obj: dict) -> None:
    print(json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True))


def value_as_string(v: object) -> str:
    if isinstance(v, str):
        return v
    # Stable JSON encoding for numbers/bools/null/objects/arrays.
    return canonical_json(v)


def main() -> int:
    ap = argparse.ArgumentParser(description="Emit ULP seam envelopes for tetragrammatron-os hardware probe fixtures.")
    ap.add_argument("--input", required=True, help="Path to probe.jsonl")
    ap.add_argument("--namespace", default="ulp.trace.tetragrammatron_os.v0")
    ap.add_argument("--writer", default="tetragrammatron-os")
    ap.add_argument("--epoch", type=int, default=1)
    ap.add_argument("--gen", type=int, default=1)
    ap.add_argument("--owner-mask", type=int, default=15)
    ap.add_argument("--advance-per-line", type=int, default=1)
    args = ap.parse_args()

    prefix = component_prefix(args.namespace)
    lines = Path(args.input).read_text().splitlines()

    rows = []
    for ln in lines:
        if not ln.strip():
            continue
        o = json.loads(ln)
        if not isinstance(o, dict) or set(o.keys()) != {"t", "k", "v", "src", "q"}:
            raise SystemExit("each probe line must have exact keys: t, k, v, src, q")
        rows.append(
            {
                "t": str(o["t"]),
                "k": str(o["k"]),
                "v": o["v"],
                "src": str(o["src"]),
                "q": str(o["q"]),
            }
        )

    # Input digest invariant to JSON key ordering inside lines (not to line order).
    digest_preimage = "\n".join([canonical_json(r) for r in rows]).encode("utf-8")
    input_digest = "sha256:" + sha256_hex(digest_preimage)

    authority = {"kind": "direct", "basis": []}
    meta = {"writer": args.writer, "epoch": args.epoch, "gen": args.gen}

    def env(payload: dict) -> dict:
        return {"namespace": args.namespace, "authority": authority, "meta": meta, "payload": payload}

    trace_eid = 1
    emit_ndjson(env({"op": "create_entity", "eid": trace_eid, "etype": "trace", "owner_mask": args.owner_mask}))
    emit_ndjson(env({"op": "set_component_string", "eid": trace_eid, "key": prefix + "trace_kind", "value": "hardware_probe_fixture"}))
    emit_ndjson(env({"op": "set_component_string", "eid": trace_eid, "key": prefix + "trace_input_digest", "value": input_digest}))
    emit_ndjson(env({"op": "set_component_string", "eid": trace_eid, "key": prefix + "event_count", "value": str(len(rows))}))

    base_eid = 100
    for idx, r in enumerate(rows):
        if args.advance_per_line > 0:
            emit_ndjson(env({"op": "advance_tick", "delta": int(args.advance_per_line)}))
        eid = base_eid + idx
        emit_ndjson(env({"op": "create_entity", "eid": eid, "etype": "probe_event", "owner_mask": args.owner_mask}))
        emit_ndjson(env({"op": "set_component_string", "eid": eid, "key": prefix + "t", "value": r["t"]}))
        emit_ndjson(env({"op": "set_component_string", "eid": eid, "key": prefix + "k", "value": r["k"]}))
        emit_ndjson(env({"op": "set_component_string", "eid": eid, "key": prefix + "v", "value": value_as_string(r["v"])}))
        emit_ndjson(env({"op": "set_component_string", "eid": eid, "key": prefix + "src", "value": r["src"]}))
        emit_ndjson(env({"op": "set_component_string", "eid": eid, "key": prefix + "q", "value": r["q"]}))
        emit_ndjson(env({"op": "set_component_string", "eid": eid, "key": prefix + "trace_input_digest", "value": input_digest}))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

