#!/usr/bin/env python3
"""Emit or verify the canonical repo.canvasl kernel + lattice (Agent 6)."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Sequence, Tuple

FINGERPRINT = "REPO-LATTICE-TIME"

AXES: Sequence[str] = (
    "state",
    "alphabet",
    "left",
    "right",
    "delta",
    "start",
    "accept",
    "reject",
)

AXIS_INDEX: Dict[str, int] = {axis: idx for idx, axis in enumerate(AXES)}

FANO_LINES: Sequence[Tuple[str, str, str]] = (
    ("state", "alphabet", "delta"),
    ("state", "left", "start"),
    ("state", "right", "accept"),
    ("alphabet", "left", "accept"),
    ("alphabet", "right", "start"),
    ("delta", "left", "right"),
    ("delta", "start", "accept"),
)

SINK_AXES = {"reject"}


def build_kernel_yaml() -> str:
    lines: List[str] = [
        '$schema: "canvasl://repo/kernel/v1"',
        'kind: "repo.kernel"',
        'id: "repo.kernel.v1"',
        'name: "universal-life-protocol"',
        'kernel_version: "1.0"',
        f'fingerprint: "{FINGERPRINT}"',
        'branches:',
        '  main: "main"',
        '  current: "current"',
        '  feature_pattern: "feature/{axis}/{register}"',
        'axes:',
    ]
    lines.extend(f"  - {axis}" for axis in AXES)
    lines.append("axis_index:")
    lines.extend(f"  {axis}: {idx}" for axis, idx in AXIS_INDEX.items())
    lines.append("fano_lines:")
    for triad in FANO_LINES:
        lines.append(f"  - [{', '.join(triad)}]")
    lines.extend(
        [
            "merge_policy:",
            "  main:",
            '    accepts_from: ["current"]',
            '    rule: "MUST satisfy fano_lines for any introduced triads"',
            "  current:",
            '    accepts_from: ["feature/*"]',
            '    rule: "MUST satisfy fano_lines for any introduced triads"',
            "  feature:",
            "    accepts_from: []",
            '    rule: "feature/{axis}/{register} branches touch one register address"',
            "register_layout:",
            '  root: "repo.canvasl"',
            '  path_template: "repo.canvasl/{a}/{b}/{c}/reg.canvasl"',
            '  address_formula: "(idx(a)<<6) | (idx(b)<<3) | idx(c)"',
            "  register_count: 512",
            "  axis_register_bits: 3",
            "policy:",
            '  register_files_root: "repo.canvasl"',
            "  register_append_only: true",
            "  allow_merge_targets:",
            "    feature_to_current: true",
            "    feature_to_main: false",
            "    current_to_main: true",
            "    main_to_current: true",
            "fano_gate:",
            "  required: true",
            "  invariants:",
            "    - canonical_encoding",
            "    - normalization_idempotence",
            "    - deterministic_replay",
            "    - meet_join_closure",
            "    - fano_triad_preservation",
            "  failure_codes:",
            "    - NON_CANONICAL",
            "    - IDEMPOTENCE_FAIL",
            "    - NON_DETERMINISTIC",
            "    - CLOSURE_FAIL",
            "    - FANO_VIOLATION",
            "    - PROOF_MISSING",
            "    - ANALOG_CONSTRAINT_FAIL",
            "analog_constraint:",
            "  enabled: true",
            '  source: "clock/timing_crystal"',
            '  rule: "timestamped events must be monotone and bounded jitter"',
            "notes:",
            '  - "This kernel is a knowledge-graph friendly topology: axes/registers are stable embedding keys."',
        ]
    )
    return "\n".join(lines) + "\n"


REG_TEMPLATE = """$schema: "canvasl://register/v1"
kind: "repo.register"
fingerprint: "{fingerprint}"
id: "reg.{a}.{b}.{c}"
axis:
  a: "{a}"
  b: "{b}"
  c: "{c}"

address:
  a_idx: {a_idx}
  b_idx: {b_idx}
  c_idx: {c_idx}
  addr_u9: {addr}

semantics:
  summary: ""
  invariants:
    - "Normalization MUST be idempotent"
    - "Serialization MUST be canonical"
  fano_scope:
    participates: {participates}

can_isa_binding:
  bank: {a_idx}
  opcode_base: "0x{a_hex}0"
  register: {reg}

payload:
  poly:
    ring: "F2[x]"
    clbc_poly_v1: null
  events: []
"""

TRIAD_TEMPLATE = """$schema: "canvasl://repo/triad/v1"
kind: "repo.triad"
fingerprint: "{fingerprint}"
axis: "{axis}"
fano_scope:
  participates: {participates}
triads:{triad_block}
"""


def axis_triads() -> Dict[str, List[Tuple[str, str, str]]]:
    mapping: Dict[str, List[Tuple[str, str, str]]] = {axis: [] for axis in AXES}
    for line in FANO_LINES:
        for axis in line:
            mapping[axis].append(line)
    return mapping


def canonical_entries() -> Iterator[Tuple[Path, str]]:
    yield Path("repo.canvasl/kernel.canvasl"), build_kernel_yaml()
    for a in AXES:
        for b in AXES:
            for c in AXES:
                ai = AXIS_INDEX[a]
                bi = AXIS_INDEX[b]
                ci = AXIS_INDEX[c]
                addr = (ai << 6) | (bi << 3) | ci
                reg = (bi << 3) | ci
                participates = str(
                    not any(axis in SINK_AXES for axis in (a, b, c))
                ).lower()
                yield (
                    Path("repo.canvasl") / a / b / c / "reg.canvasl",
                    REG_TEMPLATE.format(
                        fingerprint=FINGERPRINT,
                        a=a,
                        b=b,
                        c=c,
                        a_idx=ai,
                        b_idx=bi,
                        c_idx=ci,
                        addr=addr,
                        reg=reg,
                        participates=participates,
                        a_hex=f"{ai:X}",
                    ),
                )
    triad_map = axis_triads()
    for axis in AXES:
        triads = triad_map.get(axis, [])
        participates = str(axis not in SINK_AXES).lower()
        triad_block = (
            "\n" + "\n".join(f"  - [{', '.join(line)}]" for line in triads)
            if triads
            else " []"
        )
        yield (
            Path("repo.canvasl/triads") / f"{axis}.canvasl",
            TRIAD_TEMPLATE.format(
                fingerprint=FINGERPRINT,
                axis=axis,
                participates=participates,
                triad_block=triad_block,
            ),
        )


def clean_target(root: Path) -> None:
    target = root / "repo.canvasl"
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)


def write_repo(root: Path) -> None:
    clean_target(root)
    for rel, content in canonical_entries():
        path = root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    print("✅ generated repo.canvasl kernel + 512 registers + triads")


def check_repo(root: Path) -> bool:
    expected = list(canonical_entries())
    errors: List[str] = []
    expected_paths = {rel for rel, _ in expected}
    for rel, content in expected:
        path = root / rel
        if not path.exists():
            errors.append(f"Missing file: {rel}")
            continue
        actual = path.read_text(encoding="utf-8")
        if actual != content:
            errors.append(f"Content drift: {rel}")
    repo_root = root / "repo.canvasl"
    if repo_root.exists():
        actual_files = {
            p.relative_to(root) for p in repo_root.rglob("*.canvasl")
        }
        extras = sorted(actual_files - expected_paths)
        for extra in extras:
            errors.append(f"Unexpected file: {extra}")
    else:
        errors.append("Missing directory: repo.canvasl")
    if errors:
        print("❌ repo.canvasl mismatch detected:")
        for err in errors:
            print("  -", err)
        print("Run `python3 tools/gen_repo_canvasl.py` to regenerate.")
        return False
    print("✅ repo.canvasl matches canonical kernel + lattice")
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify repo.canvasl contents without modifying the tree",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    if args.check:
        return 0 if check_repo(root) else 1
    write_repo(root)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
