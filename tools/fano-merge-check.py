#!/usr/bin/env python3
"""Fano merge gate for Agent 6 (REPO-LATTICE-TIME).

Validates that repo.canvasl edits only introduce Fano-legal triads and that
the per-axis triad declarations are present and canonical. Intended for CI
and local pre-flight checks.
"""

from __future__ import annotations

import argparse
import itertools
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

REPO_ROOT = Path(__file__).resolve().parents[1]

AXES = (
    "state",
    "alphabet",
    "left",
    "right",
    "delta",
    "start",
    "accept",
    "reject",
)

SINK_AXES = {"reject"}

FANO_LINES = (
    ("state", "alphabet", "delta"),
    ("state", "left", "start"),
    ("state", "right", "accept"),
    ("alphabet", "left", "accept"),
    ("alphabet", "right", "start"),
    ("delta", "left", "right"),
    ("delta", "start", "accept"),
)

FANO_SETS = {frozenset(line) for line in FANO_LINES}

TRIAD_LINE_RE = re.compile(r"\[\s*([a-z]+)\s*,\s*([a-z]+)\s*,\s*([a-z]+)\s*\]")


def git_changed_files(base: str, head: str) -> list[str]:
    diff_range = f"{base}...{head}"
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", diff_range],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        print(f"Failed to obtain git diff for {diff_range}: {exc.stderr}", file=sys.stderr)
        sys.exit(2)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def axis_from_path(path: str) -> str | None:
    parts = PurePosixPath(path).parts
    if not parts or parts[0] != "repo.canvasl":
        return None
    if len(parts) >= 3 and parts[1] == "triads":
        axis = PurePosixPath(parts[2]).stem
    elif len(parts) >= 2:
        axis = parts[1]
    else:
        return None
    return axis if axis in AXES else None


def load_triads(axis: str) -> set[frozenset[str]]:
    triad_path = REPO_ROOT / "repo.canvasl" / "triads" / f"{axis}.canvasl"
    if not triad_path.exists():
        raise FileNotFoundError(triad_path)
    content = triad_path.read_text(encoding="utf-8")
    matches = TRIAD_LINE_RE.findall(content)
    return {frozenset(match) for match in matches}


def verify_triad_file(axis: str) -> None:
    expected = {frozenset(line) for line in FANO_LINES if axis in line}
    actual = load_triads(axis)
    if actual != expected:
        exp_fmt = ", ".join(sorted("-".join(line) for line in expected)) or "(none)"
        act_fmt = ", ".join(sorted("-".join(line) for line in actual)) or "(none)"
        raise ValueError(
            f"Triad declaration mismatch for axis '{axis}'. Expected {{{exp_fmt}}}, got {{{act_fmt}}}"
        )


def check_triads(touched_axes: set[str]) -> None:
    for axis in sorted(touched_axes):
        if axis in SINK_AXES:
            continue
        try:
            verify_triad_file(axis)
        except FileNotFoundError as err:
            raise RuntimeError(f"Missing triad declaration for axis '{axis}': {err}") from err
        except ValueError as err:
            raise RuntimeError(str(err)) from err


def check_fano_closure(touched_axes: set[str]) -> list[tuple[str, str, str]]:
    axes = sorted(axis for axis in touched_axes if axis not in SINK_AXES)
    violations = []
    for combo in itertools.combinations(axes, 3):
        if frozenset(combo) not in FANO_SETS:
            violations.append(combo)
    return violations


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "base",
        nargs="?",
        default="origin/current",
        help="Base ref to diff against (default: origin/current)",
    )
    parser.add_argument(
        "head",
        nargs="?",
        default="HEAD",
        help="Head ref to diff (default: HEAD)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    files = git_changed_files(args.base, args.head)
    touched_axes: set[str] = set()

    for path in files:
        axis = axis_from_path(path)
        if axis:
            touched_axes.add(axis)

    check_triads(touched_axes)
    violations = check_fano_closure(touched_axes)

    if violations:
        print("❌ FANO MERGE VIOLATION")
        for triad in violations:
            print("  Non-Fano triad:", ", ".join(triad))
        print("\nAllowed triads:")
        for line in FANO_LINES:
            print("  ", ", ".join(line))
        return 1

    print("✅ Fano merge check passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

