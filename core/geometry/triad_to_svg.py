#!/usr/bin/env python3
"""
Trace-to-SVG bridge for Agent 5 (GEO-FANO-SVG).

Reads JSONL triad traces (e.g. trace.jsonl) and emits both the intermediate
render-event stream and the deterministic SVG defined in fano_svg.py.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Iterable, List, Optional, Sequence

try:  # Allow running as a script
    from . import fano_svg
    from .fano_data import AXIS_TO_POINT, AXIS_TRIAD_TO_LINE, POINT_TO_AXIS
except ImportError:  # pragma: no cover
    repo_root = Path(__file__).resolve().parents[2]
    if str(repo_root) not in sys.path:
        sys.path.append(str(repo_root))
    from core.geometry import fano_svg
    from core.geometry.fano_data import AXIS_TO_POINT, AXIS_TRIAD_TO_LINE, POINT_TO_AXIS


def normalize_axis(value: Optional[str]) -> Optional[str]:
    if not isinstance(value, str):
        return None
    key = value.strip().lower()
    return key if key in AXIS_TO_POINT else None


def load_triads(path: str) -> List[dict]:
    if path == "-":
        raw_lines = sys.stdin.read()
    else:
        raw_lines = Path(path).read_text(encoding="utf-8")
    events: List[dict] = []
    for idx, line in enumerate(raw_lines.splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        line = _strip_inline_comment(line)
        if not line:
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError as exc:
            raise fano_svg.EventError(f"triad line {idx}: invalid JSON: {exc}") from exc
        if ev.get("op") != "TRIAD":
            continue
        events.append(ev)
    if not events:
        raise fano_svg.EventError("triad trace contained no TRIAD events")
    return events


def _result_is_accept(value: Optional[str]) -> bool:
    if value is None:
        return True
    text = str(value).strip().lower()
    return text not in {"reject", "fail", "invalid", "error"}


def _strip_inline_comment(line: str) -> str:
    in_string = False
    escape = False
    for idx, ch in enumerate(line):
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string and ch == "/" and idx + 1 < len(line) and line[idx + 1] == "/":
            return line[:idx].rstrip()
    return line


def triads_to_events(triads: Iterable[dict]) -> List[dict]:
    events: List[dict] = []
    for idx, tri in enumerate(triads, 1):
        axes = [
            normalize_axis(tri.get("a")),
            normalize_axis(tri.get("b")),
            normalize_axis(tri.get("c")),
        ]
        if None in axes or len(set(axes)) != 3:
            line_id = None
        else:
            key = tuple(sorted(axis for axis in axes if axis is not None))
            line_id = AXIS_TRIAD_TO_LINE.get(key)

        accepted = line_id is not None and _result_is_accept(tri.get("result"))
        line_style = 1 if accepted else 3
        point_style = line_style

        frame_meta = {
            "op": "FRAME_BEGIN",
            "flags": ["lines", "points", "labels"],
            "seq": idx,
        }
        events.append(frame_meta)
        events.append({"op": "DRAW_FANO_CIRCLE_LINE", "style": 6})

        if line_id is not None:
            events.append({"op": "DRAW_FANO_LINE", "line": line_id, "style": line_style})

        seen_points = set()
        for axis in axes:
            if axis is None:
                continue
            pid = AXIS_TO_POINT[axis]
            if pid in seen_points:
                continue
            seen_points.add(pid)
            events.append(
                {
                    "op": "DRAW_FANO_POINT",
                    "point": pid,
                    "style": point_style,
                    "axis": axis,
                }
            )
            label_text = axis if accepted else f"{axis}✕"
            events.append(
                {"op": "LABEL_FANO_POINT", "point": pid, "text": label_text.upper()}
            )

        events.append({"op": "FRAME_END"})
    return events


def cli(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Render canonical Fano SVG from TRIAD trace JSONL"
    )
    parser.add_argument("trace", help="Input triad trace (JSONL, use '-' for stdin)")
    parser.add_argument("svg", help="Output SVG path")
    parser.add_argument(
        "--events-out",
        dest="events_out",
        help="Optional path to write render events JSONL",
    )
    parser.add_argument("--hash", dest="canvsl_hash", default="0x0")
    parser.add_argument("--title", default="Fano Trace")

    args = parser.parse_args(argv)

    triads = load_triads(args.trace)
    events = triads_to_events(triads)

    if args.events_out:
        with open(args.events_out, "w", encoding="utf-8") as f:
            for ev in events:
                f.write(json.dumps(ev, ensure_ascii=False) + "\n")

    frames = fano_svg.events_to_frames(events)
    svg = fano_svg.render_svg(frames, canvsl_hash=args.canvsl_hash, title=args.title)
    Path(args.svg).write_text(svg, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(cli())
