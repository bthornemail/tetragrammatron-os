import React from "react";
import { TrustConfig } from "../../lib/trust-config";

interface TrustTabProps {
  schemaStatus?: Map<string, "ok" | "unsigned" | "invalid" | "untrusted">;
  trustConfig?: TrustConfig | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function TrustTab({ schemaStatus, trustConfig, collapsed, onToggleCollapse }: TrustTabProps) {
  const unsigned = schemaStatus ? [...schemaStatus.values()].filter(s => s === "unsigned").length : 0;
  const invalidSig = schemaStatus ? [...schemaStatus.values()].filter(s => s === "invalid").length : 0;
  const untrusted = schemaStatus ? [...schemaStatus.values()].filter(s => s === "untrusted").length : 0;
  const trustedCount = schemaStatus ? [...schemaStatus.values()].filter(s => s === "ok").length : 0;
  const totalSchemas = schemaStatus ? schemaStatus.size : 0;

  // Group by realm
  const realmStats = new Map<string, { trusted: number; unsigned: number; invalid: number; untrusted: number }>();
  if (schemaStatus) {
    for (const [key, status] of schemaStatus.entries()) {
      const realm = key.split("|")[0];
      if (!realmStats.has(realm)) {
        realmStats.set(realm, { trusted: 0, unsigned: 0, invalid: 0, untrusted: 0 });
      }
      const stats = realmStats.get(realm)!;
      if (status === "ok") stats.trusted++;
      else if (status === "unsigned") stats.unsigned++;
      else if (status === "invalid") stats.invalid++;
      else if (status === "untrusted") stats.untrusted++;
    }
  }

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
        <div style={{ fontSize: 13, fontWeight: 500 }}>Trust/Schema</div>
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
          {schemaStatus && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Schema Status:</div>
              <div>total schemas: <b>{totalSchemas}</b></div>
              <div style={{ color: "#51cf66" }}>trusted schemas: <b>{trustedCount}</b></div>
              <div style={{ color: "#ffa94d" }}>unsigned rejected: <b>{unsigned}</b></div>
              <div style={{ color: "#ff6b6b" }}>invalid signature: <b>{invalidSig}</b></div>
              <div style={{ color: "#ff8787" }}>untrusted pubkey: <b>{untrusted}</b></div>
            </div>
          )}

          {trustConfig && trustConfig.trustedPubkeys.size > 0 && (
            <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Trust Configuration:</div>
              <div>realms with pinned pubkeys: <b>{trustConfig.trustedPubkeys.size}</b></div>
              {Array.from(trustConfig.trustedPubkeys.entries()).map(([realm, pubkeys]) => (
                <div key={realm} style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
                  <div>Realm <b>{realm}</b>: {pubkeys.length} trusted pubkey(s)</div>
                </div>
              ))}
            </div>
          )}

          {realmStats.size > 0 && (
            <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>By Realm:</div>
              {Array.from(realmStats.entries()).map(([realm, stats]) => (
                <div key={realm} style={{ marginBottom: 6, fontSize: 11 }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>Realm {realm}:</div>
                  <div style={{ paddingLeft: 8 }}>
                    <div style={{ color: "#51cf66" }}>trusted: {stats.trusted}</div>
                    <div style={{ color: "#ffa94d" }}>unsigned: {stats.unsigned}</div>
                    <div style={{ color: "#ff6b6b" }}>invalid: {stats.invalid}</div>
                    <div style={{ color: "#ff8787" }}>untrusted: {stats.untrusted}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!schemaStatus && (
            <div style={{ fontSize: 11, opacity: 0.7, fontStyle: "italic" }}>
              No schema status data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

