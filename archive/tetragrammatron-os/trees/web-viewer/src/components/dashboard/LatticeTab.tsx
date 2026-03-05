import React from "react";
import { GroupRecord, NodeRecord } from "../../lib/lattice";

interface LatticeTabProps {
  nodes: NodeRecord[];
  groups: GroupRecord[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function LatticeTab({ nodes, groups, collapsed, onToggleCollapse }: LatticeTabProps) {
  const byClass = (cls: string) => groups.filter(g => g.class === cls).length;
  const unknownSchema = groups.filter(g => g.schemaHash === "unknown").length;
  const invalid = nodes.filter(n => n.validation?.kind === "invalid").length;
  const unknown = nodes.filter(n => n.validation?.kind === "unknown-schema").length;

  return (
    <div>
      <div
        onClick={onToggleCollapse}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0",
          cursor: "pointer",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          marginBottom: collapsed ? 0 : 8
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500 }}>Lattice/Network</div>
        <button
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
            padding: 0,
            width: 20
          }}
        >
          {collapsed ? "▶" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ paddingLeft: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Overview:</div>
            <div>nodes: <b>{nodes.length}</b></div>
            <div>groups: <b>{groups.length}</b></div>
          </div>

          <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Node Status:</div>
            <div>valid nodes: <b>{nodes.length - invalid - unknown}</b></div>
            <div style={{ color: "#ff6b6b" }}>invalid nodes: <b>{invalid}</b></div>
            <div style={{ color: "#ffa94d" }}>unknown schema: <b>{unknown}</b></div>
          </div>

          <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Groups by Class:</div>
            <div>public planes: <b>{byClass("public")}</b></div>
            <div>protected linesets: <b>{byClass("protected")}</b></div>
            <div>private pointsets: <b>{byClass("private")}</b></div>
          </div>

          {unknownSchema > 0 && (
            <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Unknown Schema:</div>
              <div style={{ color: "#ffa94d" }}>unknown schema groups: <b>{unknownSchema}</b></div>
            </div>
          )}

          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11, opacity: 0.7 }}>
            <div>Data source: <code>/public/data/events.jsonl</code></div>
            <div style={{ marginTop: 2 }}>Data source: <code>/public/data/attestations.jsonl</code></div>
          </div>
        </div>
      )}
    </div>
  );
}

