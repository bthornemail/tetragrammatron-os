import React, { useState, useEffect, useRef, useCallback } from "react";
import { GroupRecord, NodeRecord } from "../lib/lattice";
import { TrustConfig } from "../lib/trust-config";
import { Esp32TelemetryData } from "../lib/esp32-telemetry";
import { WebSocketStatus } from "../lib/websocket";
import { MqttStatus } from "../lib/mqtt";
import { LatticeTab } from "./dashboard/LatticeTab";
import { TrustTab } from "./dashboard/TrustTab";
import { ExecutionTab } from "./dashboard/ExecutionTab";
import { ConnectionsTab } from "./dashboard/ConnectionsTab";
import { CommandsTab } from "./dashboard/CommandsTab";

export type TabId = "lattice" | "trust" | "execution" | "connections" | "commands";

interface DashboardProps {
  nodes: NodeRecord[];
  groups: GroupRecord[];
  schemaStatus?: Map<string, "ok" | "unsigned" | "invalid" | "untrusted">;
  trustConfig?: TrustConfig | null;
  telemetry?: Esp32TelemetryData | null;
  wsStatus?: WebSocketStatus;
  mqttStatus?: MqttStatus;
  mqttDeviceCount?: number;
  mqttMessageCount?: number;
}

interface DashboardState {
  position: { x: number; y: number };
  minimized: boolean;
  activeTab: TabId;
  collapsedTabs: Set<TabId>;
}

const STORAGE_KEY = "tetragrammatron-dashboard-state";
function getDefaultPosition() {
  if (typeof window === 'undefined') return { x: 100, y: 60 };
  return { x: window.innerWidth - 420, y: 60 };
}

const DEFAULT_STATE: DashboardState = {
  position: getDefaultPosition(),
  minimized: false,
  activeTab: "lattice",
  collapsedTabs: new Set()
};

function loadState(): DashboardState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_STATE,
        position: parsed.position || getDefaultPosition(),
        minimized: parsed.minimized ?? false,
        activeTab: parsed.activeTab || "lattice",
        collapsedTabs: new Set(parsed.collapsedTabs || [])
      };
    }
  } catch (err) {
    console.error("Failed to load dashboard state:", err);
  }
  return DEFAULT_STATE;
}

function saveState(state: DashboardState): void {
  try {
    const toSave = {
      ...state,
      collapsedTabs: Array.from(state.collapsedTabs)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error("Failed to save dashboard state:", err);
  }
}

export function Dashboard(props: DashboardProps) {
  const [state, setState] = useState<DashboardState>(loadState);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.minimized) return;
    if ((e.target as HTMLElement).closest('.dashboard-tab-content')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - state.position.x,
      y: e.clientY - state.position.y
    });
    e.preventDefault();
  }, [state.position, state.minimized]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Boundary constraints
    const maxX = window.innerWidth - (state.minimized ? 60 : 400);
    const maxY = window.innerHeight - (state.minimized ? 40 : 100);
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    setState(prev => ({
      ...prev,
      position: { x: constrainedX, y: constrainedY }
    }));
  }, [isDragging, dragStart, state.minimized]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize - constrain position
  useEffect(() => {
    const handleResize = () => {
      setState(prev => {
        const maxX = window.innerWidth - (prev.minimized ? 60 : 400);
        const maxY = window.innerHeight - (prev.minimized ? 40 : 100);
        const constrainedX = Math.max(0, Math.min(prev.position.x, maxX));
        const constrainedY = Math.max(0, Math.min(prev.position.y, maxY));
        if (constrainedX !== prev.position.x || constrainedY !== prev.position.y) {
          return { ...prev, position: { x: constrainedX, y: constrainedY } };
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, minimized: !prev.minimized }));
  }, []);

  const setActiveTab = useCallback((tab: TabId) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const toggleTabCollapse = useCallback((tab: TabId) => {
    setState(prev => {
      const newCollapsed = new Set(prev.collapsedTabs);
      if (newCollapsed.has(tab)) {
        newCollapsed.delete(tab);
      } else {
        newCollapsed.add(tab);
      }
      return { ...prev, collapsedTabs: newCollapsed };
    });
  }, []);

  const tabs: Array<{ id: TabId; label: string; badge?: number }> = [
    { id: "lattice", label: "Lattice" },
    { id: "trust", label: "Trust", badge: props.schemaStatus ? [...props.schemaStatus.values()].filter(s => s === "ok").length : undefined },
    { id: "execution", label: "Execution", badge: props.telemetry?.stats.totalExecutions },
    { id: "connections", label: "Connections" },
    { id: "commands", label: "Commands" }
  ];

  if (state.minimized) {
    return (
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          left: state.position.x,
          top: state.position.y,
          zIndex: 1000,
          cursor: "pointer"
        }}
        onClick={toggleMinimize}
      >
        <div style={{
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}>
          Dashboard
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: state.position.x,
        top: state.position.y,
        width: 400,
        maxHeight: "80vh",
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.85)",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "white"
      }}
    >
      {/* Header with drag handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none"
        }}
      >
        <div style={{ fontSize: 14, fontWeight: "bold" }}>Dashboard</div>
        <button
          onClick={toggleMinimize}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
            opacity: 0.7
          }}
          title="Minimize"
        >
          −
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.2)",
        overflowX: "auto"
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: state.activeTab === tab.id ? "rgba(77, 171, 247, 0.3)" : "transparent",
              border: "none",
              borderBottom: state.activeTab === tab.id ? "2px solid #4dabf7" : "2px solid transparent",
              color: "white",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: state.activeTab === tab.id ? 500 : 400,
              position: "relative",
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span style={{
                marginLeft: 6,
                background: "#4dabf7",
                color: "white",
                borderRadius: 10,
                padding: "2px 6px",
                fontSize: 10,
                fontWeight: 500
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="dashboard-tab-content" style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px"
      }}>
        {state.activeTab === "lattice" && (
          <LatticeTab
            nodes={props.nodes}
            groups={props.groups}
            collapsed={state.collapsedTabs.has("lattice")}
            onToggleCollapse={() => toggleTabCollapse("lattice")}
          />
        )}
        {state.activeTab === "trust" && (
          <TrustTab
            schemaStatus={props.schemaStatus}
            trustConfig={props.trustConfig}
            collapsed={state.collapsedTabs.has("trust")}
            onToggleCollapse={() => toggleTabCollapse("trust")}
          />
        )}
        {state.activeTab === "execution" && (
          <ExecutionTab
            telemetry={props.telemetry}
            collapsed={state.collapsedTabs.has("execution")}
            onToggleCollapse={() => toggleTabCollapse("execution")}
          />
        )}
        {state.activeTab === "connections" && (
          <ConnectionsTab
            wsStatus={props.wsStatus}
            mqttStatus={props.mqttStatus}
            mqttDeviceCount={props.mqttDeviceCount}
            mqttMessageCount={props.mqttMessageCount}
            collapsed={state.collapsedTabs.has("connections")}
            onToggleCollapse={() => toggleTabCollapse("connections")}
          />
        )}
        {state.activeTab === "commands" && (
          <CommandsTab
            collapsed={state.collapsedTabs.has("commands")}
            onToggleCollapse={() => toggleTabCollapse("commands")}
          />
        )}
      </div>
    </div>
  );
}

