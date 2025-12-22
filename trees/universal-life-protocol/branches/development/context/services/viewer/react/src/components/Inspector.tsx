import React from "react";
import type { NodeMeta } from "../lib/model";

export function Inspector({ meta }: { meta: NodeMeta | null }) {
  return (
    <div style={{
      position: "absolute",
      right: 10,
      top: 54,
      width: 380,
      maxWidth: "calc(100vw - 20px)",
      maxHeight: "calc(100vh - 70px)",
      overflow: "auto",
      background: "rgba(255,255,255,0.92)",
      border: "1px solid #ddd",
      borderRadius: 14,
      padding: 10,
      fontFamily: "ui-sans-serif, system-ui"
    }}>
      <div style={{ fontWeight: 700 }}>Inspector</div>
      <pre style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
        {meta ? JSON.stringify(meta, null, 2) : "Click a node."}
      </pre>
    </div>
  );
}

