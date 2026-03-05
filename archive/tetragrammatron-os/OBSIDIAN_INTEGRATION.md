# Obsidian Integration Guide

This guide explains how to integrate Tetragrammatron-OS with Obsidian.

## Components

### 1. Viewer (`trees/universal-life-protocol/branches/development/context/services/viewer/react/`)

The React-based 3D viewer that visualizes the Tree-of-Life structure.

**Features:**
- 3D visualization of trees, branches, books, and entries
- Asset loading (GLB, OBJ/MTL, SVG)
- Inspector panel for node details
- Click-to-navigate integration

**Build:**
```bash
cd trees/universal-life-protocol/branches/development/context/services/viewer/react
npm install
npm run build
```

**Output:** `dist/index.html` (can be opened in Obsidian Web Viewer)

### 2. Plugin (`trees/obsidian/branches/development/services/plugin/`)

Obsidian plugin that bridges the viewer with vault navigation.

**Features:**
- Listens for `ulp-open-path` messages from viewer
- Opens files in Obsidian when nodes are clicked
- Minimal, read-only integration

**Build:**
```bash
cd trees/obsidian/branches/development/services/plugin
npm install
npm run build
```

**Install:**
1. Copy the plugin folder to `.obsidian/plugins/tetragrammatron-os/`
2. Enable in Settings → Community Plugins

### 3. Bases (`obsidian/bases/`)

Obsidian Base configurations for tabular views.

**Available Bases:**
- `axes.base.md` - Four-pillar ontology
- `freedom.base.md` - Freedom axis
- `autonomy.base.md` - Autonomy axis
- `sovereignty.base.md` - Sovereignty axis
- `context.base.md` - Context axis
- `drift.base.md` - Drift tracking

**Usage:**
- Open in Obsidian
- Link to JSONL files or other data sources
- Use as read-only filters/views

## Integration Workflow

### Step 1: Build Components

```bash
# Build viewer
cd trees/universal-life-protocol/branches/development/context/services/viewer/react && npm run build && cd ../../../../../../../../..

# Build plugin (optional, for development)
cd trees/obsidian/branches/development/services/plugin && npm run build && cd ../../../../../../..
```

### Step 2: Install Plugin

1. Copy `trees/obsidian/branches/development/services/plugin/` to `.obsidian/plugins/tetragrammatron-os/`
2. Restart Obsidian
3. Enable plugin in Settings → Community Plugins

### Step 3: Open Viewer

**Option A: Web Viewer Block**
1. Create a new note
2. Insert a Web Viewer block
3. Set path to: `trees/universal-life-protocol/branches/development/context/services/viewer/react/dist/index.html`

**Option B: HTML Block**
```html
<iframe src="trees/universal-life-protocol/branches/development/context/services/viewer/react/dist/index.html" width="100%" height="600px"></iframe>
```

### Step 4: Interact

- Click nodes in the 3D viewer
- Files should open automatically in Obsidian
- Use Inspector panel to view node details

## Message Protocol

The viewer sends messages via `window.postMessage`:

```javascript
{
  type: "ulp-open-path",
  path: "trees/tetragrammatron/branches/development/README.md"
}
```

The plugin listens for these messages and opens the corresponding file.

## Troubleshooting

### Viewer not loading
- Check browser console (F12)
- Verify `descriptors/render.map.yaml` exists
- Ensure tree indices are generated: `npm run index`

### Plugin not receiving messages
- Check Obsidian console (Ctrl+Shift+I)
- Verify plugin is enabled
- Check viewer console for message sending

### Files not opening
- Verify paths are relative to vault root
- Check that files exist
- Ensure plugin is listening (check console)

### CORS issues
- Use Obsidian's Web Viewer (not external browser)
- Ensure viewer is served from vault directory
- Check file permissions

## Development

### Plugin Development

```bash
cd trees/obsidian/branches/development/services/plugin
npm run dev  # Watch mode
```

### Viewer Development

```bash
cd trees/universal-life-protocol/branches/development/context/services/viewer/react
npm run dev  # Development server
```

Then point Web Viewer to `http://localhost:5173` (or configured port).

## Architecture

```
┌─────────────────┐
│  Obsidian Vault │
│                 │
│  ┌───────────┐  │
│  │  Viewer   │──┼──> posts messages
│  │ (WebView) │  │
│  └───────────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │  Plugin   │──┼──> opens files
│  │ (Bridge)  │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │  Bases    │  │
│  │ (Views)   │  │
│  └───────────┘  │
└─────────────────┘
```

## Best Practices

1. **Read-only principle**: Viewer and plugin never mutate data
2. **Path resolution**: Use relative paths from vault root
3. **Error handling**: Gracefully handle missing files
4. **Performance**: Lazy-load assets, use caching
5. **Security**: Validate message sources if needed

## Next Steps

- See `demos/README.md` for demo scenarios
- Check `README.md` for full documentation
- Review `AGENTS.md` for development guidelines

