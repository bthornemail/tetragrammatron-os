# Service Connection Details

Detailed connection information for development services.

## ESP-IDF → esptool Connection

### Connection Type
**Build-time dependency**: ESP-IDF build system uses esptool for flashing firmware

### Connection Mechanism
- ESP-IDF build system calls esptool via Python
- esptool is invoked through the Python virtual environment
- Serial port communication established by esptool

### Data Flow
```
ESP-IDF Build
    → generates firmware.bin
    → invokes esptool
    → esptool reads firmware.bin
    → esptool writes to device flash
```

### Configuration
- Connection configured in ESP-IDF build system
- Serial port specified via environment or command line
- Flash parameters defined in partition table

## esptool → Python venv Connection

### Connection Type
**Runtime dependency**: esptool requires Python environment

### Connection Mechanism
- esptool installed as Python package in venv
- Activated venv provides esptool executable
- Python dependencies resolved within venv

### Data Flow
```
Python venv activation
    → provides esptool command
    → esptool uses venv Python
    → venv provides dependencies
```

### Configuration
- Virtual environment must be activated
- esptool installed via pip in venv
- Dependencies managed by pip/requirements.txt

## ESP-IDF → Tetragrammatron-OS Connection

### Connection Type
**Integration**: ESP-IDF firmware may integrate with Tetragrammatron hardware abstraction

### Connection Mechanism
- Firmware may read/write hardware probe data
- Device configurations may feed into canonical records
- Hardware state may project to VM sphere

### Data Flow
```
ESP Device
    → firmware reads hardware state
    → generates probe events
    → events → hardware/probe.jsonl
    → canonicalization → hardware/canon.json
    → projection → hardware/sphere.json
```

### Configuration
- Firmware must include Tetragrammatron integration code
- Serial/network connection to host system
- Data format compatibility with JSONL schema

## Connection Validation

### Required Connections
- ✅ ESP-IDF → esptool (for flashing)
- ✅ esptool → Python venv (for execution)
- ⚠️ ESP-IDF → Tetragrammatron (optional integration)

### Connection Health
- Verify esptool accessible from ESP-IDF build
- Verify Python venv activated when using esptool
- Verify serial port permissions for device access

## Notes

- Connections are logical relationships, not enforced programmatically
- Some connections are optional (Tetragrammatron integration)
- Connection health should be verified before use

