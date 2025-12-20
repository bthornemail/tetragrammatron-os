#!/usr/bin/env python3
"""
Fail the build if any merge introduces a NON-FANO triad.
Triads are inferred from touched axis scopes.
"""

import sys, subprocess, itertools

AXES = {
    "state","alphabet","left","right",
    "delta","start","accept","reject"
}

FANO_LINES = [
    {"state","alphabet","delta"},
    {"state","left","start"},
    {"state","right","accept"},
    {"alphabet","left","accept"},
    {"alphabet","right","start"},
    {"delta","left","right"},
    {"delta","start","accept"},
]

def is_fano(triad):
    s = set(triad)
    return any(s == line for line in FANO_LINES)

def git_changed_files(base):
    out = subprocess.check_output(
        ["git","diff","--name-only",base],
        text=True
    )
    return [l.strip() for l in out.splitlines() if l.strip()]

def axis_from_path(path):
    """
    Expected layout:
      repo.canvasl/state/...
      repo.canvasl/alphabet/...
      ...
    """
    parts = path.split("/")
    if not parts:
        return None
    return parts[0] if parts[0] in AXES else None

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "origin/current"
    files = git_changed_files(base)

    touched = set()
    for f in files:
        ax = axis_from_path(f)
        if ax:
            touched.add(ax)

    # reject axis is a sink only
    touched.discard("reject")

    failures = []
    for triad in itertools.combinations(sorted(touched), 3):
        if not is_fano(triad):
            failures.append(triad)

    if failures:
        print("❌ FANO MERGE VIOLATION")
        for t in failures:
            print("  NON-FANO TRIAD:", ", ".join(t))
        print("
Only these triads are permitted:")
        for l in FANO_LINES:
            print(" ", sorted(l))
        sys.exit(1)

    print("✅ Fano merge check passed")
    return 0

if __name__ == "__main__":
    main()
