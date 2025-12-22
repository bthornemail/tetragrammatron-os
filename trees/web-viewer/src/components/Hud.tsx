import React from "react";
import { GroupRecord, NodeRecord } from "../lib/lattice";

export function Hud({ nodes, groups }: { nodes: NodeRecord[]; groups: GroupRecord[] }) {
  const byClass = (cls: string) => groups.filter(g => g.class === cls).length;
  const unknownSchema = groups.filter(g => g.schemaHash === "unknown").length;
  const invalid = nodes.filter(n => n.validation?.kind === "invalid").length;
  const unknown = nodes.filter(n => n.validation?.kind === "unknown-schema").length;
  // const unsigned = [...schemaStatus.values()].filter(s => s === "unsigned").length;
  // const invalidSig = [...schemaStatus.values()].filter(s => s === "invalid").length;
  return (
    <div style={{
      position: "absolute", top: 12, left: 12, zIndex: 10,
      background: "rgba(0,0,0,0.6)", color: "white",
      padding: "10px 12px", borderRadius: 10, width: 320,
      fontFamily: "system-ui, sans-serif", fontSize: 13
    }}>
      <div style={{ fontSize: 14, marginBottom: 6 }}><b>Tetragrammatron Web Viewer</b></div>
      <div>nodes: <b>{nodes.length}</b></div>
      <div>groups: <b>{groups.length}</b></div>
      <div style={{ marginTop: 6 }}>
        <div>valid nodes: <b>{nodes.length - invalid - unknown}</b></div>
        <div style={{ color: "#ff6b6b" }}>invalid nodes: <b>{invalid}</b></div>
        <div style={{ color: "#ffa94d" }}>unknown schema: <b>{unknown}</b></div>
      </div>
      <div style={{ marginTop: 6 }}>
        <div>public planes: <b>{byClass("public")}</b></div>
        <div>protected linesets: <b>{byClass("protected")}</b></div>
        <div>private pointsets: <b>{byClass("private")}</b></div>
      </div>
      <div style={{ marginTop: 6 }}>
        <div>unknown schema groups: <b>{unknownSchema}</b></div>
      </div>
      {/* <div style={{ marginTop: 8 }}>
        <div>schemas loaded: <b>{schemas.size}</b></div>
        <div style={{ color: "#ffa94d" }}>unsigned rejected: <b>{unsigned}</b></div>
        <div style={{ color: "#ff6b6b" }}>invalid signature: <b>{invalidSig}</b></div>
      </div> */}
      <div style={{ marginTop: 10, opacity: 0.85 }}>
        Data: <code>/public/data/events.jsonl</code> and <code>/public/data/attestations.jsonl</code>
      </div>
    </div>
  );
}