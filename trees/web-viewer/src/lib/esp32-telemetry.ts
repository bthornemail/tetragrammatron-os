/**
 * ESP32 CAN VM Telemetry Types and Parsers
 * 
 * Defines TypeScript types for ESP32 telemetry events and provides
 * parsing utilities to convert raw JSONL events into typed structures.
 */

// Base ESP32 event types
export type Esp32ExecStart = {
  kind: "exec.start";
  msg: {};
};

export type Esp32EmitEvent = {
  a: string;  // Address in hex format "AA:BB:CC:..."
  k: string;   // Key
  v: number | number[];  // Value (single for EMIT8, array for EMITREGS)
};

export type Esp32VmDone = {
  kind: "vm_done";
  msg: {
    steps: number;
    ticks: number;
    status: "ok" | "halt" | "trap" | "pc_overflow" | "unknown_opcode" | "admiss_violation" | "error";
    pc: number;
  };
};

export type Esp32SchemaViolation = {
  kind: "schema_violation";
  msg: string;  // e.g., "prefix_rejected"
};

export type Esp32InputError = {
  kind: "input_error";
  msg: string;  // e.g., "length_missing", "length_invalid", "payload_missing"
};

// Bridge control messages
export type Esp32BridgeConnected = {
  kind: "bridge.connected";
  msg: { port: number; serial: string };
};

export type Esp32BridgeSerialConnected = {
  kind: "bridge.serial.connected";
  msg: { path: string; baudRate: number };
};

export type Esp32BridgeSerialDisconnected = {
  kind: "bridge.serial.disconnected";
  msg: {};
};

export type Esp32BridgeSerialError = {
  kind: "bridge.serial.error";
  msg: string;
};

export type Esp32Log = {
  kind: "esp32.log";
  msg: string;  // Raw ESP-IDF log line
};

// Union type for all ESP32 events
export type Esp32Event =
  | Esp32ExecStart
  | Esp32EmitEvent
  | Esp32VmDone
  | Esp32SchemaViolation
  | Esp32InputError
  | Esp32BridgeConnected
  | Esp32BridgeSerialConnected
  | Esp32BridgeSerialDisconnected
  | Esp32BridgeSerialError
  | Esp32Log;

// Execution state tracking
export type ExecutionState = {
  address: string;
  startTime: number;
  steps: number;
  ticks: number;
  status: Esp32VmDone["msg"]["status"] | "running";
  pc: number;
  emitEvents: Esp32EmitEvent[];
};

// Parsed telemetry data structure
export type Esp32TelemetryData = {
  executions: Map<string, ExecutionState>;  // address -> execution state
  completedExecutions: ExecutionState[];    // Completed executions (keep last N)
  errors: Array<{
    kind: "schema_violation" | "input_error";
    msg: string;
    timestamp: number;
  }>;
  stats: {
    totalExecutions: number;
    totalSteps: number;
    totalTicks: number;
    errorCount: number;
    schemaViolations: number;
    inputErrors: number;
  };
};

/**
 * Parse a raw JSON object into an Esp32Event
 */
export function parseEsp32Event(data: any): Esp32Event | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  // Check for known event types
  if (data.kind === "exec.start") {
    return { kind: "exec.start", msg: data.msg || {} };
  }

  if (data.kind === "vm_done") {
    // Parse the msg field (it's a JSON string in ESP32 output)
    let msg: Esp32VmDone["msg"];
    if (typeof data.msg === "string") {
      try {
        msg = JSON.parse(data.msg);
      } catch {
        return null;
      }
    } else if (typeof data.msg === "object") {
      msg = data.msg;
    } else {
      return null;
    }

    return {
      kind: "vm_done",
      msg: {
        steps: msg.steps || 0,
        ticks: msg.ticks || 0,
        status: msg.status || "error",
        pc: msg.pc || 0
      }
    };
  }

  if (data.kind === "schema_violation") {
    return {
      kind: "schema_violation",
      msg: typeof data.msg === "string" ? data.msg : String(data.msg || "")
    };
  }

  if (data.kind === "input_error") {
    return {
      kind: "input_error",
      msg: typeof data.msg === "string" ? data.msg : String(data.msg || "")
    };
  }

  // Bridge control messages
  if (data.kind === "bridge.connected") {
    return { kind: "bridge.connected", msg: data.msg || {} };
  }

  if (data.kind === "bridge.serial.connected") {
    return { kind: "bridge.serial.connected", msg: data.msg || {} };
  }

  if (data.kind === "bridge.serial.disconnected") {
    return { kind: "bridge.serial.disconnected", msg: {} };
  }

  if (data.kind === "bridge.serial.error") {
    return {
      kind: "bridge.serial.error",
      msg: typeof data.msg === "string" ? data.msg : String(data.msg || "")
    };
  }

  if (data.kind === "esp32.log") {
    return {
      kind: "esp32.log",
      msg: typeof data.msg === "string" ? data.msg : String(data.msg || "")
    };
  }

  // EMIT8/EMITREGS events: have 'a', 'k', 'v' fields but no 'kind'
  if (data.a && data.k && data.v !== undefined && !data.kind) {
    return {
      a: String(data.a),
      k: String(data.k),
      v: data.v  // Can be number or number[]
    };
  }

  return null;
}

/**
 * Create initial telemetry data structure
 */
export function createTelemetryData(): Esp32TelemetryData {
  return {
    executions: new Map(),
    completedExecutions: [],
    errors: [],
    stats: {
      totalExecutions: 0,
      totalSteps: 0,
      totalTicks: 0,
      errorCount: 0,
      schemaViolations: 0,
      inputErrors: 0
    }
  };
}

/**
 * Update telemetry data with a new event
 */
export function updateTelemetryData(
  data: Esp32TelemetryData,
  event: Esp32Event
): void {
  const now = Date.now();

  if (event.kind === "exec.start") {
    // Note: We don't have address here, will be set when we get EMIT or vm_done
    // For now, we'll track by the first EMIT event or vm_done
  } else if ("a" in event && event.a) {
    // EMIT8/EMITREGS event
    const addr = event.a;
    let exec = data.executions.get(addr);
    
    if (!exec) {
      // New execution
      exec = {
        address: addr,
        startTime: now,
        steps: 0,
        ticks: 0,
        status: "running",
        pc: 0,
        emitEvents: []
      };
      data.executions.set(addr, exec);
      data.stats.totalExecutions++;
    }
    
    exec.emitEvents.push(event);
  } else if (event.kind === "vm_done") {
    // Find execution by matching address from recent EMIT events
    // Or create a synthetic execution if we don't have address
    const msg = event.msg;
    
    // Try to find the most recent execution without a status
    let exec: ExecutionState | undefined;
    for (const [addr, e] of data.executions.entries()) {
      if (e.status === "running") {
        exec = e;
        break;
      }
    }
    
    if (exec) {
      exec.steps = msg.steps;
      exec.ticks = msg.ticks;
      exec.status = msg.status;
      exec.pc = msg.pc;
      
      data.stats.totalSteps += msg.steps;
      data.stats.totalTicks += msg.ticks;
      
      // Move to completed
      data.executions.delete(exec.address);
      data.completedExecutions.push(exec);
      
      // Keep only last 100 completed executions
      if (data.completedExecutions.length > 100) {
        data.completedExecutions.shift();
      }
      
      if (msg.status !== "ok" && msg.status !== "halt") {
        data.stats.errorCount++;
      }
    }
  } else if (event.kind === "schema_violation") {
    data.errors.push({
      kind: "schema_violation",
      msg: event.msg,
      timestamp: now
    });
    data.stats.errorCount++;
    data.stats.schemaViolations++;
    
    // Keep only last 50 errors
    if (data.errors.length > 50) {
      data.errors.shift();
    }
  } else if (event.kind === "input_error") {
    data.errors.push({
      kind: "input_error",
      msg: event.msg,
      timestamp: now
    });
    data.stats.errorCount++;
    data.stats.inputErrors++;
    
    // Keep only last 50 errors
    if (data.errors.length > 50) {
      data.errors.shift();
    }
  }
}

/**
 * Get execution state for a specific address
 */
export function getExecutionState(
  data: Esp32TelemetryData,
  address: string
): ExecutionState | undefined {
  return data.executions.get(address) || 
    data.completedExecutions.find(e => e.address === address);
}


