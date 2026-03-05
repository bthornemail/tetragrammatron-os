# Development Service Connections

This directory documents dependencies and relationships between development services and tools.

## Service Relationships

### ESP-IDF and esptool

**ESP-IDF** (Espressif IoT Development Framework) and **esptool** work together to provide embedded development capabilities:

```
ESP-IDF (v5.4.1)
    ↓ provides
Firmware development framework
    ↓ uses
esptool (via Python venv)
    ↓ provides
Flash programming, serial communication
```

### Connection Graph

```
┌─────────────────┐
│   ESP-IDF v5.4.1│
│  (services/)    │
└────────┬────────┘
         │ provides: SDK, build system, toolchain
         │
         ▼
┌─────────────────┐
│  Python venv    │
│  (services/)    │
└────────┬────────┘
         │ contains: esptool
         │ provides: Flash utilities, serial tools
         │
         ▼
┌─────────────────┐
│  Tetragrammatron│
│  Hardware Layer │
└─────────────────┘
```

## Dependencies

### ESP-IDF Dependencies
- **Location**: `services/esp-idf/v5.4.1/`
- **Purpose**: Embedded firmware development framework
- **Provides**: 
  - Build system
  - Toolchain
  - SDK components
  - Hardware abstraction layer
- **Depends on**: Python environment, esptool

### esptool Dependencies
- **Location**: `services/python/venv/esptool/`
- **Purpose**: ESP32/ESP8266 flash programming tool
- **Provides**:
  - Serial communication
  - Flash programming
  - Device management
- **Depends on**: Python virtual environment, ESP-IDF (for device support)

### Python Virtual Environment
- **Location**: `services/python/venv/`
- **Purpose**: Isolated Python environment for development tools
- **Provides**: 
  - esptool installation
  - Dependency isolation
- **Depends on**: System Python installation

## Integration Points

### With Tetragrammatron-OS

1. **Hardware Layer**: ESP-IDF targets hardware that may be part of the hardware probe system
2. **Canonicalization**: Firmware builds may produce artifacts for the canonical hardware records
3. **Projection**: Hardware configurations from ESP devices may feed into the Ball → Sphere projection

## Connection Types

- **Build Dependency**: ESP-IDF requires esptool for flashing
- **Runtime Dependency**: esptool requires Python environment
- **Integration**: Both services connect to Tetragrammatron hardware abstraction layer

## Notes

- Services are versioned (ESP-IDF v5.4.1) for reproducibility
- Python venv isolates tool dependencies from system Python
- Connections are documented but not enforced programmatically

