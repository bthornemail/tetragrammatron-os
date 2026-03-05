# Drift Tracking System

## Overview

The Drift Tracking System provides **non-invasive, append-only monitoring** of structural and semantic changes across the project. It produces normalized, replayable JSONL event streams and human-readable diff reports.

## What "Drift" Means

Drift is **any structural or semantic change** detectable from the filesystem without interpreting meaning.

We track:

- **Structure drift**: added/removed/moved files, missing axis folders, missing context subfolders
- **Content drift** (non-invasive): hash change of files designated as "semantic sources"
- **Index drift**: regeneration changes `index.json` outputs
- **Protocol drift**: edits to `AGENTS.md` / `README.md`

Everything becomes events in JSONL.

## Storage Layout

```
.ulp/
  drift/
    snapshots/
      latest.json
      <timestamp>.json
    events/
      drift.jsonl
    reports/
      <timestamp>.md
```

### Snapshots
Stable canonical view of your project at time T. Deterministic, comparable, replayable.

### Events
Append-only drift log. Never modified, only appended. Source of truth for change history.

### Reports
Human-readable delta summaries. Generated from event stream.

## Snapshot Format

Each snapshot is a JSON object:

```json
{
  "version": 1,
  "createdAt": "2025-12-21T14:30:00.000Z",
  "entries": {
    "path/to/file.md": {
      "path": "path/to/file.md",
      "size": 1234,
      "mtimeMs": 1703172600000,
      "ext": ".md",
      "sha256": "abc123..."
    }
  }
}
```

### Entry Fields

- `path`: Normalized file path
- `size`: File size in bytes
- `mtimeMs`: Modification time in milliseconds
- `ext`: File extension
- `sha256`: SHA-256 hash (for text files) or null (for binaries)

## Event Format

Events are JSONL (JSON Lines) with consistent schema:

```json
{"t": "2025-12-21T14:30:00.000Z", "k": "drift.scan", "v": {...}}
{"t": "2025-12-21T14:30:00.001Z", "k": "file.add", "v": {...}}
{"t": "2025-12-21T14:30:00.002Z", "k": "file.remove", "v": {...}}
{"t": "2025-12-21T14:30:00.003Z", "k": "file.modify", "v": {...}}
{"t": "2025-12-21T14:30:00.004Z", "k": "validator.axes", "v": {...}}
```

### Event Fields

- `t`: ISO 8601 timestamp
- `k`: Event kind (namespace.action)
- `v`: Event value (kind-specific payload)

### Event Kinds

| Kind | Description | Value Schema |
|------|-------------|--------------|
| `drift.scan` | Scan summary | `{added, removed, modified, validator_ok}` |
| `file.add` | File added | File entry object |
| `file.remove` | File removed | File entry object |
| `file.modify` | File modified | `{before, after, reason}` |
| `validator.axes` | Validator result | `{ok, code}` |

## Drift Scanner

### Tool: `tools/drift_scan.mjs`

Non-invasive scanner that:

1. Walks configured root directories
2. Builds canonical snapshot of current state
3. Loads previous snapshot
4. Computes differences
5. Runs structural validator
6. Appends events to JSONL
7. Writes new snapshot + markdown report

### Monitored Directories

```javascript
const ROOTS = [
  "trees",
  "descriptors",
  "tools",
  "ulp/viewer"
];
```

### Hashed Extensions

Only text files are hashed for content change detection:

```javascript
const HASH_EXTS = new Set([
  ".md", ".json", ".jsonl",
  ".yaml", ".yml",
  ".canvas", ".canvasl",
  ".ts", ".tsx", ".js", ".mjs"
]);
```

Binary files use `size` + `mtime` for drift detection.

### Usage

```bash
node tools/drift_scan.mjs
```

Exit codes:
- `0`: Success, validator passed
- `2`: Validator failed (structural issues)

## Diff Computation

The scanner compares snapshots to detect three types of changes:

### Added Files
Files present in new snapshot but not in previous.

### Removed Files
Files present in previous snapshot but not in new.

### Modified Files
Files present in both with differences:

- **Hash change** (text files): Content changed
- **Size change**: File grew or shrank
- **Mtime change** (binaries): Timestamp changed without size change

## Validator Integration

The drift scanner runs `tools/validate_axes.mjs` before each scan:

```javascript
function runValidator() {
  const r = spawnSync("node", ["tools/validate_axes.mjs"], { stdio: "pipe" });
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: String(r.stdout ?? ""),
    stderr: String(r.stderr ?? "")
  };
}
```

Validator results are recorded in:
- Drift scan summary event
- Separate `validator.axes` event
- Markdown report

## Report Format

Reports are human-readable Markdown:

```markdown
# Drift Report — 2025-12-21T14-30-00-000Z

Validator: **PASS**

## Summary
- Added: 5
- Removed: 2
- Modified: 12

## Added
- trees/life/branches/genesis/context/documents/creation.md
- ...

## Removed
- obsolete/old-file.json
- ...

## Modified
- trees/life/branches/genesis/AGENTS.md (hash)
- tools/gen_tree_indexes.mjs (hash)
- ...

## Validator Output (stderr)
```
(none)
```
```

## Obsidian Integration

Drift events can be viewed in Obsidian via a Base:

```markdown
---
base:
  name: Drift Events
  source:
    folders:
      - .ulp/drift/events
  filters:
    - path.endsWith("drift.jsonl")
  columns:
    - name: Time
      value: t
    - name: Kind
      value: k
    - name: Value
      value: v
---

# Drift Events

This is an append-only log of structural changes.
```

This provides:
- Live timeline view
- Filterable by event kind
- Queryable for analysis

## Use Cases

### Continuous Integration
Run drift scanner in CI to detect unexpected changes:

```bash
if ! node tools/drift_scan.mjs; then
  echo "Structural validation failed"
  exit 1
fi
```

### Pre-Commit Hook
Ensure structural integrity before commits:

```bash
#!/bin/sh
node tools/drift_scan.mjs || exit 1
git add .ulp/drift/
```

### Consensus Timeline
Use drift events as source of truth for "when did X change?"

### Audit Trail
Regulatory or governance requirements for change tracking.

### Replay
Reconstruct project state at any previous snapshot.

## Directed System Model

This is your **directed system** in practice:

- Each snapshot is a **stage**
- Drift events are the **morphisms** between stages
- The JSONL log is a **colimit** of all changes
- Reports are **projections** for human observers

## Best Practices

1. **Run regularly** - Daily or per-commit for active projects
2. **Never edit events** - JSONL is append-only
3. **Preserve snapshots** - Keep history for replay
4. **Ignore noise** - Filter expected changes (node_modules, dist, etc.)
5. **Correlate with validator** - Structural drift should align with validation

## Integration Points

### Four-Axis Ontology
Track when branches gain or lose axis folders.

### ULP Addressing
Monitor when files with ULP addresses are created or modified.

### Obsidian Bases
Drift base provides queryable timeline.

### Three.js Renderer
Can animate structural changes over time using event stream.

## Future Extensions

Possible future enhancements:

1. **Semantic diff** - Compare JSONL content, not just hashes
2. **Schema evolution** - Track schema version changes
3. **Conflict detection** - Identify contradictory changes
4. **Visualization** - 3D timeline of project evolution
5. **Merge strategies** - Combine drift from multiple sources

## Performance

The scanner is lightweight:

- Filesystem walk is fast (thousands of files per second)
- Hashing only text files (skip large binaries)
- Snapshot diff is O(n) where n = file count
- JSONL append is constant time
- No external dependencies

Typical scan time: < 1 second for projects with < 10,000 files.

## Security

The scanner is read-only except for:

- Writing snapshots to `.ulp/drift/snapshots/`
- Appending to `.ulp/drift/events/drift.jsonl`
- Writing reports to `.ulp/drift/reports/`

It never modifies source files, indices, or content.

## References

- See `four-axis-ontology.md` for what structure is being validated
- See `obsidian-bases.md` for how to query drift events
- See `ulp-addressing.md` for address-based file tracking
- See `tools/validate_axes.mjs` implementation for validator details
