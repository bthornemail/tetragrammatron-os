# Tetragrammatron-OS Demos

This directory contains demonstration scenarios and sample data for showcasing the Tetragrammatron-OS system.

## Quick Demo

### 1. Hardware Pipeline Demo

```bash
# Run the full pipeline
npm run pipeline

# View results
cat hardware/canon.json | jq
cat hardware/sphere.json | jq
```

### 2. Tree Visualization Demo

```bash
# Build the viewer
cd trees/universal-life-protocol/branches/development/context/services/viewer/react
npm run build

# The viewer is now in dist/
# Open dist/index.html in Obsidian Web Viewer
```

### 3. Obsidian Integration Demo

1. **Install the plugin** (development mode):
   ```bash
   cd trees/obsidian/branches/development/services/plugin
   npm install
   npm run build
   # Copy the plugin folder to your Obsidian vault's .obsidian/plugins/
   ```

2. **Enable the plugin** in Obsidian Settings → Community Plugins

3. **Open the viewer**:
   - Create a new note
   - Insert a Web Viewer block
   - Point it to `trees/universal-life-protocol/branches/development/context/services/viewer/react/dist/index.html`

4. **Interact**:
   - Click nodes in the 3D viewer
   - Files should open automatically in Obsidian

## Demo Scenarios

### Scenario 1: Hardware Probe → Sphere Projection

Demonstrates the core pipeline:
- Raw hardware observations → Canonical record → VM sphere

**Files:**
- `hardware/probe.jsonl` - Input
- `hardware/canon.json` - Intermediate
- `hardware/sphere.json` - Output

### Scenario 2: Tree Structure Visualization

Demonstrates the 3D visualization:
- Tree → Branches → Books → Entries hierarchy
- Radial layout
- Asset loading (GLB/OBJ/SVG)

**Files:**
- `trees/` - Tree structure
- `trees/universal-life-protocol/branches/development/context/services/viewer/react/dist/` - Built viewer

### Scenario 3: Obsidian Integration

Demonstrates the bridge:
- Viewer → Plugin → File navigation
- Bases and Canvas integration

**Files:**
- `trees/obsidian/branches/development/services/plugin/` - Plugin source
- `obsidian/bases/` - Base configurations

## Sample Data

Sample data is available in:
- `hardware/probe.jsonl` - Sample hardware probe
- `tests/fixtures/` - Test data (can be used for demos)

## Troubleshooting

### Viewer not loading
- Check browser console for errors
- Verify `descriptors/render.map.yaml` exists
- Ensure tree indices are generated (`npm run index`)

### Plugin not working
- Check Obsidian console (Ctrl+Shift+I)
- Verify plugin is enabled
- Check that messages are being sent (viewer console)

### Files not opening
- Verify file paths are relative to vault root
- Check that files exist in the vault
- Ensure plugin is listening for messages

