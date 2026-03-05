# Tetragrammatron-OS Obsidian Plugin

Minimal read-only bridge plugin for integrating the Tetragrammatron-OS viewer with Obsidian.

## Features

- Listens for `ulp-open-path` messages from the Web Viewer
- Opens files in Obsidian when nodes are clicked in the 3D viewer
- Read-only (never mutates data)

## Installation

### Development

1. Build the plugin:
   ```bash
   npm install
   npm run build
   ```

2. Copy to Obsidian:
   - Copy this folder to `.obsidian/plugins/tetragrammatron-os/`
   - Restart Obsidian
   - Enable in Settings → Community Plugins

### Production

The plugin will be published to the Obsidian Community Plugins directory once ready.

## Usage

1. Enable the plugin in Obsidian Settings
2. Open the viewer in a Web Viewer block
3. Click nodes in the 3D viewer
4. Files will open automatically in Obsidian

## Development

```bash
# Watch mode
npm run dev

# Production build
npm run build
```

## Message Protocol

The viewer sends messages via `window.postMessage`:

```typescript
{
  type: "ulp-open-path",
  path: "trees/tetragrammatron/branches/development/README.md"
}
```

The plugin listens for these and opens the corresponding file.

## License

GPL-3.0-or-later

