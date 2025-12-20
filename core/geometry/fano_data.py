"""
Canonical Fano geometry tables and axis mappings for Agent 5.
"""

from __future__ import annotations

import itertools
from typing import Dict, Tuple

# SVG coordinate constants (viewBox 0 0 1024 1024)
FANO_POINTS = {
    0: (512, 256),
    1: (707, 369),
    2: (707, 655),
    3: (512, 768),
    4: (317, 655),
    5: (317, 369),
    6: (512, 512),
}

FANO_LINES = {
    0: {"inc": (0, 1, 2), "endpoints": (0, 1)},
    1: {"inc": (0, 3, 4), "endpoints": (0, 3)},
    2: {"inc": (0, 5, 6), "endpoints": (0, 5)},
    3: {"inc": (1, 3, 5), "endpoints": (1, 3)},
    4: {"inc": (1, 4, 6), "endpoints": (1, 4)},
    5: {"inc": (2, 3, 6), "endpoints": (2, 3)},
    6: {"inc": (2, 4, 5), "endpoints": (2, 4)},
}

CIRCLE_INCIDENCE = (1, 3, 5)
CIRCLE_CX = 512
CIRCLE_CY = 512
CIRCLE_R = 192

POINT_RADIUS = 10

AXES = ["state", "alphabet", "left", "right", "delta", "start", "accept"]
FANO_AXIS_TRIADS = [
    ("state", "alphabet", "delta"),
    ("state", "left", "start"),
    ("state", "right", "accept"),
    ("alphabet", "left", "accept"),
    ("alphabet", "right", "start"),
    ("delta", "left", "right"),
    ("delta", "start", "accept"),
]
FANO_AXIS_TRIAD_SET = {tuple(sorted(t)) for t in FANO_AXIS_TRIADS}


def _solve_axis_point_mapping() -> Dict[str, int]:
    point_ids = list(FANO_POINTS.keys())
    line_point_sets = [set(entry["inc"]) for entry in FANO_LINES.values()]
    for perm in itertools.permutations(point_ids):
        mapping = dict(zip(AXES, perm))
        ok = True
        for triad in FANO_AXIS_TRIADS:
            pts = {mapping[a] for a in triad}
            if pts not in line_point_sets:
                ok = False
                break
        if ok:
            return mapping
    raise RuntimeError("Failed to solve axis→point mapping")


AXIS_TO_POINT = _solve_axis_point_mapping()
POINT_TO_AXIS = {pid: axis for axis, pid in AXIS_TO_POINT.items()}

AXIS_TRIAD_TO_LINE: Dict[Tuple[str, str, str], int] = {}
for triad in FANO_AXIS_TRIADS:
    point_set = {AXIS_TO_POINT[a] for a in triad}
    for lid, line in FANO_LINES.items():
        if set(line["inc"]) == point_set:
            AXIS_TRIAD_TO_LINE[tuple(sorted(triad))] = lid
            break

if len(AXIS_TRIAD_TO_LINE) != len(FANO_AXIS_TRIADS):
    raise RuntimeError("Axis triad mapping incomplete")
