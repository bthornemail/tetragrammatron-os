import React from "react";
import { Esp32TelemetryData } from "../../lib/esp32-telemetry";

interface ExecutionTabProps {
  telemetry?: Esp32TelemetryData | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function ExecutionTab({ telemetry, collapsed, onToggleCollapse }: ExecutionTabProps) {
  if (!telemetry) {
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
          <div style={{ fontSize: 13, fontWeight: 500 }}>CAN VM Execution</div>
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
          <div style={{ paddingLeft: 8, fontSize: 11, opacity: 0.7, fontStyle: "italic" }}>
            No execution telemetry available
          </div>
        )}
      </div>
    );
  }

  const statusCounts = new Map<string, number>();
  for (const exec of telemetry.completedExecutions) {
    const count = statusCounts.get(exec.status) || 0;
    statusCounts.set(exec.status, count + 1);
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
        <div style={{ fontSize: 13, fontWeight: 500 }}>CAN VM Execution</div>
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
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Active Executions:</div>
            <div>running: <b>{telemetry.executions.size}</b></div>
          </div>

          <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Statistics:</div>
            <div>total executions: <b>{telemetry.stats.totalExecutions}</b></div>
            <div>total steps: <b>{telemetry.stats.totalSteps.toLocaleString()}</b></div>
            <div>total ticks: <b>{telemetry.stats.totalTicks.toLocaleString()}</b></div>
          </div>

          {telemetry.completedExecutions.length > 0 && (
            <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Status Breakdown:</div>
              {Array.from(statusCounts.entries()).map(([status, count]) => {
                const color = status === "ok" ? "#51cf66" : status === "halt" ? "#ffd43b" : "#ff6b6b";
                return (
                  <div key={status} style={{ color, fontSize: 11 }}>
                    {status}: <b>{count}</b>
                  </div>
                );
              })}
              {telemetry.completedExecutions.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
                  last status: <b>{telemetry.completedExecutions[telemetry.completedExecutions.length - 1]?.status || "unknown"}</b>
                </div>
              )}
            </div>
          )}

          {(telemetry.stats.errorCount > 0 || telemetry.errors.length > 0) && (
            <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Errors:</div>
              <div style={{ color: "#ff6b6b" }}>total errors: <b>{telemetry.stats.errorCount}</b></div>
              <div style={{ color: "#ffa94d", fontSize: 11 }}>schema violations: <b>{telemetry.stats.schemaViolations}</b></div>
              <div style={{ color: "#ffa94d", fontSize: 11 }}>input errors: <b>{telemetry.stats.inputErrors}</b></div>
              {telemetry.errors.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 10, opacity: 0.8, maxHeight: 120, overflow: "auto" }}>
                  <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4 }}>Recent Errors:</div>
                  {telemetry.errors.slice(-10).map((err, i) => (
                    <div key={i} style={{ marginTop: 4, padding: "4px 6px", background: "rgba(255,107,107,0.1)", borderRadius: 4 }}>
                      <div style={{ fontWeight: 500 }}>{err.kind}</div>
                      <div style={{ fontSize: 10, opacity: 0.8 }}>{err.msg}</div>
                      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>
                        {new Date(err.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {telemetry.executions.size > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Active Executions:</div>
              {Array.from(telemetry.executions.values()).slice(0, 5).map((exec, i) => (
                <div key={i} style={{ marginBottom: 4, fontSize: 11, padding: "4px 6px", background: "rgba(77,171,247,0.1)", borderRadius: 4 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10 }}>{exec.address}</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>status: {exec.status} | steps: {exec.steps} | ticks: {exec.ticks}</div>
                </div>
              ))}
              {telemetry.executions.size > 5 && (
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                  +{telemetry.executions.size - 5} more...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

