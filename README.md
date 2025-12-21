# Tetragrammatron-OS

This repository encodes the **Tetragrammatron-OS** semantic modeling system, hardware canonicalization pipeline, and interactive spatial renderers. It integrates JSONL hardware probes, canonical sphere projection, index manifests, and 3D visualization via React and Obsidian.

## 🔹 What's Here

### Data Layer
- `hardware/`
  - `probe.jsonl`: hardware observations
  - `canon.json`: canonical hardware profile
  - `sphere.json`: VM projection record

### Structural Layer
- `trees/`: all tree data
  - `<tree>/branches/<branch>/books/<book>/entries.jsonl`

### Viewer Layer
- `ulp/viewer/react/`: React three-fiber 3D renderer
- `ulp/viewer/three/`: Legacy Three.js single-file viewer
- `obsidian/`: Canvas & Bases support files for Obsidian

### Tools
- `tools/validate_jsonl.mjs`: JSONL validator
- `tools/hw_canon.mjs`: Canonicalization script (probe → canon)
- `tools/hw_project.mjs`: Projection script (canon → sphere)
- `tools/gen_tree_indexes.mjs`: Index manifest generator
- `tools/validate_axes.mjs`: Structural validator for branches
- `tools/drift_scan.mjs`: Drift tracking scanner

### Tests
- `tests/unit/`: Unit tests for individual tools
- `tests/integration/`: End-to-end pipeline tests
- `tests/fixtures/`: Test data and expected outputs

## 🚀 Quick Start

1. **Validate hardware probe data**  
   ```bash
   node tools/validate_jsonl.mjs hardware/probe.jsonl schemas/hw_event.schema.json
   ```

2. **Generate canonical record**
   ```bash
   node tools/hw_canon.mjs hardware/probe.jsonl hardware/canon.json
   ```

3. **Generate sphere projection**
   ```bash
   node tools/hw_project.mjs hardware/canon.json hardware/sphere.json
   ```

4. **Generate tree indices**
   ```bash
   node tools/gen_tree_indexes.mjs trees
   ```

5. **Validate branch structure**
   ```bash
   node tools/validate_axes.mjs
   ```

6. **Run drift scan**
   ```bash
   node tools/drift_scan.mjs
   ```

7. **Run viewer** (when available)
   ```bash
   cd ulp/viewer/react
   npm install
   npm run dev
   ```

8. **Build viewer** (when available)
   ```bash
   npm run build
   ```

9. **Run tests**
   ```bash
   npm test
   ```

10. **Run full pipeline**
    ```bash
    npm run pipeline
    ```

## 🧠 Philosophy

This project treats:
- **Data as immutable truth**
- **Indices as projection artifacts**
- **Agents and viewers as read-only observers**
- **Human developers and AI tools as collaborators**

## 📐 Architecture Overview

The pipeline works as follows:

```
hardware probe (JSONL)
     ↓ validate (validate_jsonl.mjs)
     ↓ canonicalize (hw_canon.mjs)
hardware canon
     ↓ project (hw_project.mjs)
hardware sphere (VM state)
     ↓ visualize (when viewer available)
3D renderers + Inspector UIs
```

### Data Flow

1. **Probe** (`hardware/probe.jsonl`): Raw hardware observations
2. **Canon** (`hardware/canon.json`): Canonical record with quadrant-tagged values
3. **Sphere** (`hardware/sphere.json`): VM projection with pointer and admissibility

## 🧪 Contributing

- Follow the AGENTS.md instructions at each level.
- Update index files only through the designated generator tools.
- Confirm all new entries include valid manifest updates.

## 📜 License

*(Add your license here if applicable)*

