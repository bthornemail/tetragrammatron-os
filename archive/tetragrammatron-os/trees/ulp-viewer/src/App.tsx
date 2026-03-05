import React, { useEffect, useState } from "react";
import { SceneCanvas } from "./components/SceneCanvas";
import { Inspector } from "./components/Inspector";
import type { NodeMeta } from "./lib/model";
import { loadRenderMap, loadTreeGraph } from "./lib/fetchers";

export default function App() {
  // Auto-detect vault root based on viewer location
  // Viewer is at: trees/universal-life-protocol/branches/development/context/services/viewer/react/dist/
  // Vault root is: ../../../../../../../../ (9 levels up from dist/)
  const autoDetectBase = () => {
    const currentPath = window.location.pathname;
    // If we're in dist/, count depth and go up to vault root
    if (currentPath.includes('trees/ulp-viewerd/dist')) {
      // From dist/ to vault root: dist -> react -> viewer -> services -> context -> development -> branches -> universal-life-protocol -> trees -> root
      // That's 9 levels up
      return '../../../../../';
    }
    // Fallback: try to detect from URL structure
    const pathParts = currentPath.split('/').filter(Boolean);
    // Find where we are in the tree structure
    const treesIndex = pathParts.indexOf('trees');
    if (treesIndex >= 0) {
      // Count levels from current location to trees, then one more to root
      const levelsToRoot = pathParts.length - treesIndex;
      return '../'.repeat(levelsToRoot);
    }
    // Default fallback
    return "../../../../../../../../";
  };

  const [base, setBase] = useState(autoDetectBase());
  const [status, setStatus] = useState<string>("idle");
  const [graph, setGraph] = useState<any>(null);
  const [picked, setPicked] = useState<NodeMeta | null>(null);

  async function load() {
    setStatus("loading…");
    try {
      const map = await loadRenderMap(base);
      const g = await loadTreeGraph(base, map);
      setGraph(g);
      setStatus("ok");
    } catch (e: any) {
      setStatus(`load failed: ${e?.message ?? String(e)}`);
    }
  }

  useEffect(() => { load(); }, []); // initial

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div style={{
        position: "absolute",
        top: 8,
        left: 8,
        right: 8,
        zIndex: 10,
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <button onClick={load} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ccc" }}>
          Load
        </button>
        <input
          value={base}
          onChange={(e) => setBase(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ccc", width: 520, maxWidth: "100%" }}
        />
        <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12 }}>
          {status}
        </span>
      </div>

      {graph ? (
        <SceneCanvas base={base} graph={graph} onPick={setPicked} />
      ) : (
        <div style={{ paddingTop: 80, textAlign: "center" }}>No graph loaded.</div>
      )}

      <Inspector meta={picked} />
    </div>
  );
}

