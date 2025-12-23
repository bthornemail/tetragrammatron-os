#!/usr/bin/env node
/**
 * ESP32 CAN VM Bridge Server
 * 
 * Reads JSONL telemetry from ESP32 UART and forwards to WebSocket clients.
 * 
 * Usage:
 *   node server.js [--port 8080] [--serial /dev/ttyUSB0] [--baud 115200]
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { WebSocketServer } from 'ws';

const DEFAULT_PORT = 8080;
const DEFAULT_SERIAL = '/dev/ttyUSB0';
const DEFAULT_BAUD = 115200;

// Parse command line arguments
const args = process.argv.slice(2);
let wsPort = DEFAULT_PORT;
let serialPath = DEFAULT_SERIAL;
let baudRate = DEFAULT_BAUD;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    wsPort = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--serial' && args[i + 1]) {
    serialPath = args[i + 1];
    i++;
  } else if (args[i] === '--baud' && args[i + 1]) {
    baudRate = parseInt(args[i + 1], 10);
    i++;
  }
}

console.log(`ESP32 CAN VM Bridge Server`);
console.log(`WebSocket port: ${wsPort}`);
console.log(`Serial port: ${serialPath} @ ${baudRate} baud`);

// WebSocket server
const wss = new WebSocketServer({ port: wsPort });

wss.on('listening', () => {
  console.log(`WebSocket server listening on ws://localhost:${wsPort}`);
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    kind: 'bridge.connected',
    msg: { port: wsPort, serial: serialPath }
  }));
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Serial port connection
let serialPort = null;
let parser = null;

function connectSerial() {
  if (serialPort && serialPort.isOpen) {
    return; // Already connected
  }

  console.log(`Connecting to serial port: ${serialPath}...`);
  
  serialPort = new SerialPort({
    path: serialPath,
    baudRate: baudRate,
    autoOpen: false
  });

  parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

  serialPort.open((err) => {
    if (err) {
      console.error(`Failed to open serial port: ${err.message}`);
      console.log('Retrying in 5 seconds...');
      setTimeout(connectSerial, 5000);
      return;
    }
    
    console.log('Serial port opened successfully');
    
    // Send connection status
    broadcast({
      kind: 'bridge.serial.connected',
      msg: { path: serialPath, baudRate }
    });
  });

  parser.on('data', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    try {
      // Try to parse as JSONL
      const parsed = JSON.parse(trimmed);
      
      // Forward to WebSocket clients
      broadcast(parsed);
      
      // Log to console (optional, can be verbose)
      // console.log('ESP32:', trimmed);
    } catch (err) {
      // Not valid JSON, might be ESP-IDF log line
      // Forward as raw log line
      broadcast({
        kind: 'esp32.log',
        msg: trimmed
      });
    }
  });

  serialPort.on('error', (err) => {
    console.error('Serial port error:', err.message);
    broadcast({
      kind: 'bridge.serial.error',
      msg: err.message
    });
    
    // Attempt reconnection
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
    setTimeout(connectSerial, 5000);
  });

  serialPort.on('close', () => {
    console.log('Serial port closed');
    broadcast({
      kind: 'bridge.serial.disconnected',
      msg: {}
    });
    
    // Attempt reconnection
    setTimeout(connectSerial, 5000);
  });
}

// Start connection
connectSerial();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

