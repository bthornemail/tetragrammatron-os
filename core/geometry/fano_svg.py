#!/usr/bin/env python3
"""
Deterministic Fano-plane SVG renderer (Agent 5 — GEO-FANO-SVG).

This module interprets a render-event stream (JSONL) and emits a byte-stable
SVG that satisfies the canonical coordinate, incidence, and ordering rules from
RFC-009 / RFC-0012 (see dev-docs/12,13,14,15).
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional, Sequence

from .fano_data import (
    CIRCLE_CX,
    CIRCLE_CY,
    CIRCLE_INCIDENCE,
    CIRCLE_R,
    FANO_LINES,
    FANO_POINTS,
    POINT_RADIUS,
)

RFC009_STYLE = """/* RFC-009 SVG STYLESET v1 (NORMATIVE) */
.stroke{fill:none;stroke-linecap:round;stroke-linejoin:round}
.point{stroke-width:0}
.label{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:24px}
.style-0{stroke:#222;stroke-width:6;fill:#222}
.style-1{stroke:#0a0;stroke-width:10;fill:#0a0}
.style-2{stroke:#06c;stroke-width:10;fill:#06c;stroke-dasharray:16 10}
.style-3{stroke:#c00;stroke-width:12;fill:#c00;stroke-dasharray:10 10}
.style-4{stroke:#777;stroke-width:4;fill:#777;stroke-dasharray:6 12}
.style-5{stroke:#a0a;stroke-width:10;fill:#a0a}
.style-6{stroke:#999;stroke-width:2;fill:#999;stroke-dasharray:4 12}
.style-7{stroke:#f80;stroke-width:6;fill:#f80;stroke-dasharray:2 6}
"""

FLAG_BITS = {
    "lines": 0b0001,
    "points": 0b0010,
    "labels": 0b0100,
    "meta_hash": 0b1000,
}


def _get_field(obj: dict, *names: str):
    for name in names:
        if name in obj and obj[name] is not None:
            return obj[name]
    return None


@dataclass
class Frame:
    """Normalized frame containing line/point selections."""

    index: int
    lines: Dict[int, int] = field(default_factory=dict)
    points: Dict[int, "PointDraw"] = field(default_factory=dict)
    labels: Dict[int, str] = field(default_factory=dict)
    circle_style: Optional[int] = None
    flags: int = 0

    def has_content(self) -> bool:
        return bool(
            self.lines or self.points or self.labels or self.circle_style is not None
        )


class EventError(ValueError):
    """Raised for malformed or unsupported render events."""


@dataclass
class PointDraw:
    style: int
    axis: Optional[str] = None


def escape_xml(text: str) -> str:
    replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
    }
    return "".join(replacements.get(ch, ch) for ch in text)


def parse_style(value: Optional[int]) -> int:
    if value is None:
        return 0
    try:
        style = int(value)
    except (TypeError, ValueError) as exc:
        raise EventError(f"invalid style id: {value}") from exc
    if style < 0 or style > 255:
        raise EventError(f"style id out of range: {style}")
    return style


def parse_point_id(value: Optional[int]) -> int:
    try:
        pid = int(value)
    except (TypeError, ValueError) as exc:
        raise EventError(f"invalid point id: {value}") from exc
    if pid not in FANO_POINTS:
        raise EventError(f"point id {pid} not in canonical Fano set")
    return pid


def parse_line_id(value: Optional[int]) -> int:
    try:
        lid = int(value)
    except (TypeError, ValueError) as exc:
        raise EventError(f"invalid line id: {value}") from exc
    if lid not in FANO_LINES:
        raise EventError(f"line id {lid} not in canonical Fano set")
    return lid


def parse_flags(value: Optional[Iterable[str] | int]) -> int:
    if value is None:
        return 0
    if isinstance(value, int):
        return value & 0xFF
    bits = 0
    for name in value:
        if name not in FLAG_BITS:
            raise EventError(f"unknown frame flag '{name}'")
        bits |= FLAG_BITS[name]
    return bits


def ensure_frame(current: Optional[Frame], frames: List[Frame]) -> Frame:
    if current is None:
        current = Frame(index=len(frames))
    return current


def load_events(path: str) -> List[dict]:
    if path == "-":
        data = sys.stdin.read().splitlines()
    else:
        data = Path(path).read_text(encoding="utf-8").splitlines()

    events: List[dict] = []
    for idx, raw in enumerate(data, 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise EventError(f"line {idx}: invalid JSON: {exc}") from exc
    return events


def events_to_frames(events: Iterable[dict]) -> List[Frame]:
    frames: List[Frame] = []
    current: Optional[Frame] = None
    strings: Dict[int, str] = {}

    for ev in events:
        if not isinstance(ev, dict):
            raise EventError("render events must be JSON objects")
        op = ev.get("op")
        if not isinstance(op, str):
            raise EventError("render event missing 'op' string")

        if op == "FRAME_BEGIN":
            if current is not None:
                frames.append(current)
            current = Frame(index=len(frames))
            current.flags = parse_flags(ev.get("flags"))
            continue

        if op == "FRAME_END":
            if current is not None:
                frames.append(current)
                current = None
            continue

        if op == "DEFINE_STRING":
            sid = ev.get("id")
            if sid is None:
                raise EventError("DEFINE_STRING requires 'id'")
            try:
                sid_int = int(sid)
            except (TypeError, ValueError) as exc:
                raise EventError("DEFINE_STRING id must be integer") from exc
            text = ev.get("text", "")
            strings[sid_int] = str(text)
            continue

        current = ensure_frame(current, frames)

        if op == "PROJ_FANO":
            current.flags = parse_flags(ev.get("flags"))
            continue

        if op == "DRAW_FANO_POINT":
            pid = parse_point_id(_get_field(ev, "point", "pointId"))
            style = parse_style(_get_field(ev, "style", "styleId"))
            axis_label = _parse_axis(ev.get("axis"))
            current.points[pid] = PointDraw(style=style, axis=axis_label)
            continue

        if op == "DRAW_FANO_LINE":
            lid = parse_line_id(_get_field(ev, "line", "lineId"))
            style = parse_style(_get_field(ev, "style", "styleId"))
            current.lines[lid] = style
            continue

        if op == "DRAW_FANO_CIRCLE_LINE":
            style = parse_style(_get_field(ev, "style", "styleId"))
            current.circle_style = style
            continue

        if op == "LABEL_FANO_POINT":
            pid = parse_point_id(_get_field(ev, "point", "pointId"))
            if "text" in ev:
                text = str(ev["text"])
            else:
                sid = _get_field(ev, "string_id", "stringId")
                if sid is None:
                    raise EventError("LABEL_FANO_POINT requires 'text' or string id")
                try:
                    sid_int = int(sid)
                except (TypeError, ValueError) as exc:
                    raise EventError("string id must be integer") from exc
                if sid_int not in strings:
                    raise EventError(f"string id {sid_int} not defined")
                text = strings[sid_int]
            current.labels[pid] = text
            continue

        raise EventError(f"unsupported render opcode '{op}'")

    if current is not None:
        frames.append(current)

    if not frames:
        raise EventError("no frames were produced from the event stream")

    return frames


def render_svg(
    frames: Sequence[Frame], canvsl_hash: str = "0x0", title: Optional[str] = None
) -> str:
    if not frames:
        raise ValueError("frames sequence is empty")

    lines: List[str] = []
    lines.append(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" '
        'shape-rendering="geometricPrecision">'
    )
    if title:
        lines.append(f"  <title>{escape_xml(title)}</title>")
    lines.append("  <defs><style>")
    lines.append(RFC009_STYLE)
    lines.append("  </style></defs>")

    for frame in frames:
        lines.extend(_emit_frame(frame, canvsl_hash))

    lines.append("</svg>")
    return "\n".join(lines) + "\n"


def _emit_frame(frame: Frame, canvsl_hash: str) -> List[str]:
    body: List[str] = []
    frame_hash = escape_xml(canvsl_hash)
    body.append(
        f'  <g id="frame{frame.index}" data-proj="fano" '
        f'data-canvsl-hash="{frame_hash}" data-frame-flags="{frame.flags:#04x}">'
    )

    for lid in sorted(frame.lines):
        line_entry = FANO_LINES[lid]
        a, b, c = line_entry["inc"]
        u, v = line_entry["endpoints"]
        x1, y1 = FANO_POINTS[u]
        x2, y2 = FANO_POINTS[v]
        style = frame.lines[lid]
        body.append(
            f'    <line id="L{lid}" data-incidence="p{a},p{b},p{c}" '
            f'x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'class="stroke style-{style}"/>'
        )

    if frame.circle_style is not None:
        inc_attr = ",".join(f"p{pid}" for pid in CIRCLE_INCIDENCE)
        body.append(
            f'    <circle id="Lcircle" data-incidence="{inc_attr}" '
            f'cx="{CIRCLE_CX}" cy="{CIRCLE_CY}" r="{CIRCLE_R}" '
            f'class="stroke style-{frame.circle_style}"/>'
        )

    for pid in sorted(frame.points):
        x, y = FANO_POINTS[pid]
        point_draw = frame.points[pid]
        style = point_draw.style
        axis_attr = (
            f' data-axis="{escape_xml(point_draw.axis)}"' if point_draw.axis else ""
        )
        body.append(
            f'    <circle id="p{pid}" cx="{x}" cy="{y}" r="{POINT_RADIUS}" '
            f'class="point style-{style}"{axis_attr}/>'
        )

    for pid in sorted(frame.labels):
        x, y = FANO_POINTS[pid]
        text = escape_xml(frame.labels[pid])
        body.append(
            f'    <text data-label-for="p{pid}" x="{x + 14}" y="{y - 14}" '
            f'class="label">{text}</text>'
        )

    body.append("  </g>")
    return body


def cli(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Render canonical Fano SVG from JSONL event stream"
    )
    parser.add_argument(
        "events",
        help="Path to JSONL render events (use '-' for stdin)",
    )
    parser.add_argument(
        "output",
        help="Path to SVG output (use '-' for stdout)",
    )
    parser.add_argument(
        "--hash",
        dest="canvsl_hash",
        default="0x0",
        help="CanvasL hash metadata (default: 0x0)",
    )
    parser.add_argument(
        "--title",
        default=None,
        help="Optional SVG <title> content",
    )

    args = parser.parse_args(argv)

    try:
        events = load_events(args.events)
        frames = events_to_frames(events)
        svg = render_svg(frames, canvsl_hash=args.canvsl_hash, title=args.title)
    except EventError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if args.output == "-":
        sys.stdout.write(svg)
    else:
        Path(args.output).write_text(svg, encoding="utf-8")

    return 0


def _parse_axis(axis: Optional[str]) -> Optional[str]:
    if axis is None:
        return None
    text = str(axis).strip()
    return text or None


if __name__ == "__main__":
    raise SystemExit(cli())
