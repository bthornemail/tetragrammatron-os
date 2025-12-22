# Demo Setup Guide

## Prerequisites

1. **Node.js** (v18+)
2. **Obsidian** (v1.0.0+)
3. **Git** (for cloning)

## Setup Steps

### 1. Install Dependencies

```bash
# Root dependencies (if any)
npm install

# Viewer dependencies
cd trees/universal-life-protocol/branches/development/context/services/viewer/react
npm install
cd ../../../../../../../../..
```

### 2. Build Viewer

```bash
cd trees/universal-life-protocol/branches/development/context/services/viewer/react
npm run build
cd ../../../../../../../../..
```

### 3. Generate Tree Indices

```bash
npm run index
```

### 4. Run Pipeline (Optional)

```bash
npm run pipeline
```

### 5. Install Obsidian Plugin (Development)

```bash
cd trees/obsidian/branches/development/services/plugin
npm install
npm run build
cd ../../../../../../..
```

Then:
1. Copy `trees/obsidian/branches/development/services/plugin/` to your Obsidian vault's `.obsidian/plugins/tetragrammatron-os/`
2. Enable the plugin in Obsidian Settings → Community Plugins

### 6. Open Viewer in Obsidian

1. Create a new note
2. Insert a Web Viewer block (or use HTML)
3. Point to: `trees/universal-life-protocol/branches/development/context/services/viewer/react/dist/index.html` (relative to vault root)

## Quick Test

```bash
# Run all tests
npm test

# Run pipeline
npm run pipeline

# Verify viewer builds
cd trees/universal-life-protocol/branches/development/context/services/viewer/react && npm run build && cd ../../../../../../../../..
```

## Next Steps

- See `demos/README.md` for demo scenarios
- Check `README.md` for full documentation
- Review `AGENTS.md` for development guidelines

