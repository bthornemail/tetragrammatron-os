#!/usr/bin/env python3
"""
Projection invariant analyzer for Agent 5.

Consumes render-event streams (JSONL) and verifies that:
- axis labels on points match canonical axis↔point mapping
- drawn lines correspond to canonical Fano axis triads
- optional reports list missing/extra semantics per frame
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Iterable, List, Optional

try:
    from .fano_data import (
        FANO_LINES,
        FANO_AXIS_TRIAD_SET,
        POINT_TO_AXIS,
    )
    from . import fano_svg
except ImportError:  # pragma: no cover
    repo_root = Path(__file__).resolve().parents[2]
    if str(repo_root) not in sys.path:
        sys.path.append(str(repo_root))
    from core.geometry import fano_svg
    from core.geometry.fano_data import (
        FANO_LINES,
        FANO_AXIS_TRIAD_SET,
        POINT_TO_AXIS,
    )


def analyze_frames(frames: Iterable[fano_svg.Frame]) -> List[dict]:
    reports: List[dict] = []
    for frame in frames:
        axis_issues = []
        triad_issues = []
        for pid, draw in frame.points.items():
            if not draw.axis:
                continue
            expected = POINT_TO_AXIS.get(pid)
            normalized = draw.axis.strip().lower()
            if expected and normalized != expected:
                axis_issues.append(
                    {
                        "point": pid,
                        "expected": expected,
                        "got": normalized,
                    }
                )

        for lid in frame.lines:
            inc = FANO_LINES[lid]["inc"]
            axis_triad = tuple(sorted(POINT_TO_AXIS[p] for p in inc))
            if axis_triad not in FANO_AXIS_TRIAD_SET:
                triad_issues.append(
                    {"line": lid, "axis_triad": axis_triad, "reason": "non-fano"}
                )

        reports.append(
            {
                "frame": frame.index,
                "axis_ok": not axis_issues,
                "line_ok": not triad_issues,
                "axis_issues": axis_issues,
                "line_issues": triad_issues,
            }
        )
    return reports


def _load_events(path: str) -> List[dict]:
    if path == "-":
        data = sys.stdin.read().splitlines()
    else:
        data = Path(path).read_text(encoding="utf-8").splitlines()
    events = []
    for idx, raw in enumerate(data, 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise fano_svg.EventError(f"line {idx}: invalid JSON: {exc}") from exc
    if not events:
        raise fano_svg.EventError("event stream is empty")
    return events


def cli(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Verify Fano projection invariants on render-event streams"
    )
    parser.add_argument("events", help="JSONL render-event stream (use '-' for stdin)")

    args = parser.parse_args(argv)
    events = _load_events(args.events)
    frames = fano_svg.events_to_frames(events)
    report = analyze_frames(frames)

    ok = all(r["axis_ok"] and r["line_ok"] for r in report)
    print(json.dumps(report, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(cli())
