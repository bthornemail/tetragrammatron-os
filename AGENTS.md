# Tetragrammatron-OS — Agents Guide

This `AGENTS.md` file provides **AI coding agents** machine-readable guidance about the structure, conventions, and workflows of the Tetragrammatron-OS project. AGENTS.md is a recognized standard for guiding AI coding agents and tools.

## 🧭 Project Structure

- `trees/`: Contains all life trees.
  - `<tree>/`: A specific tree like "genesis", "john", "revelation".
    - `branches/<branch>/`: Conceptual chapters (e.g., creation, spirit).
      - `books/<book>/`: Subsections within a branch (ex. "day-1", "day-2").
        - `entries.jsonl`: Event or entry records for that book.
- `hardware/`: Canonical hardware probe, canon, and sphere records.
- `descriptors/render.map.yaml`: 3D renderer and scene mapping rules.
- `ulp/viewer/react/`: React three-fiber based interactive renderer.
- `ulp/viewer/agents/`: Viewer panels, inspectors, and tools.

## 🛠 Build & Tooling

AI agents should assume the following workflow:

```bash
# Validate JSONL probe files
node tools/validate_jsonl.mjs hardware/probe.jsonl schemas/hw_event.schema.json

# Generate canonical record from probe
node tools/hw_canon.mjs hardware/probe.jsonl hardware/canon.json

# Generate sphere projection from canonical
node tools/hw_project.mjs hardware/canon.json hardware/sphere.json

# Generate index manifests
node tools/gen_tree_indexes.mjs trees/

# Validate branch structure
node tools/validate_axes.mjs

# Run drift scan
node tools/drift_scan.mjs

# Run the React viewer locally (when available)
cd ulp/viewer/react/
npm install
npm run dev

# Build static viewer output (when available)
npm run build
```

## 📐 Coding Conventions

- JavaScript/TypeScript: follow existing patterns under `ulp/viewer/react/src/`.
- `AGENTS.md` and `README.md` should be updated in tandem for both humans and agents.
- Three.js + react-three-fiber is canonical renderer stack.

## 📊 Project Understanding

Agents should leverage:

- Canvases and bases for structural layout (Obsidian integration).
- JSONL → canonical → sphere pipeline for hardware context.
- Tree/Branch/Book/Entry shapes as primary data lenses.

Agents should **not modify source manifest files** or data streams; treat them as immutable ground truth.

## 🧪 Test & Validation Conventions

- JSONL files must validate against schema with the provided validator.
- Index manifests must reflect the folder structure exactly.
- React viewer must load without errors and conform to asset loading rules.

## ⚠️ Safety & Boundaries

- Do not generate or commit secrets or environment variables.
- Always confirm actionable paths before opening or modifying files.
- Respect the read-only tree of canonical data when suggesting fixes.

## 🧾 Pull Request & Commit Guidelines

- PR titles should begin with the target area: `[renderer]`, `[schema]`, `[viewer]`.
- All entries must include linked index updates where relevant.

