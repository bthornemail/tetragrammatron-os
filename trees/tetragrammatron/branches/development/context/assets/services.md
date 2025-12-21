# Service Asset Catalog

Detailed catalog of assets produced and used by development services.

## ESP-IDF Asset Catalog

### Source Assets
**Location**: `services/esp-idf/v5.4.1/`

| Asset Type | Description | Example Files |
|------------|-------------|---------------|
| SDK Components | Reusable code modules | `components/*/` |
| Hardware Drivers | Peripheral drivers | `components/driver/` |
| Build System | CMake build files | `CMakeLists.txt`, `component.mk` |
| Configuration | Build configuration | `sdkconfig`, `partitions.csv` |
| Headers | API definitions | `*.h` files |
| Source Code | Implementation files | `*.c`, `*.cpp` files |

### Generated Assets
**Location**: `build/` (typically in project directory)

| Asset Type | Description | File Extensions |
|------------|-------------|-----------------|
| Firmware Binary | Compiled application | `.bin` |
| ELF File | Executable and linkable format | `.elf` |
| Map File | Memory map | `.map` |
| Partition Table | Flash layout | `.csv` |
| Bootloader | Second-stage bootloader | `bootloader.bin` |

### Asset Specifications

#### Firmware Binary
- **Format**: Raw binary
- **Size**: Variable (depends on application)
- **Location**: Project `build/` directory
- **Usage**: Flashed to device via esptool

#### Partition Table
- **Format**: CSV
- **Purpose**: Defines flash memory layout
- **Contains**: Partition name, type, subtype, offset, size
- **Usage**: Used by bootloader and firmware

## esptool Asset Catalog

### Tool Assets
**Location**: `services/python/venv/esptool/`

| Asset Type | Description |
|------------|-------------|
| Python Package | Installed esptool package |
| Executables | Command-line tools |
| Serial Drivers | USB-to-serial communication |

### Generated Assets
**Location**: Working directory (where esptool is invoked)

| Asset Type | Description | File Extensions |
|------------|-------------|-----------------|
| Flash Image | Combined firmware | `.bin` |
| Partition Image | Individual partition | `.bin` |
| Verification | Checksums | `.md5`, `.sha256` |

### Asset Specifications

#### Flash Image
- **Format**: Raw binary
- **Content**: Bootloader + partition table + application
- **Size**: Sum of partition sizes
- **Usage**: Direct flash to device

## Python Virtual Environment Asset Catalog

### Environment Assets
**Location**: `services/python/venv/`

| Asset Type | Description |
|------------|-------------|
| Python Interpreter | Isolated Python executable |
| Installed Packages | All pip-installed packages |
| Scripts | Entry point scripts |
| Configuration | venv configuration files |

### Package Assets
**Location**: `services/python/venv/lib/python*/site-packages/`

| Package | Version | Purpose |
|---------|---------|---------|
| esptool | (see venv) | ESP device flashing |
| pyserial | (see venv) | Serial communication |
| cryptography | (see venv) | Security features |

## Asset Lifecycle

### Build Phase
1. ESP-IDF compiles source → generates binaries
2. Build system packages binaries → creates flash image
3. Assets stored in `build/` directory

### Flash Phase
1. esptool reads flash image
2. esptool writes to device flash
3. Verification performed

### Integration Phase
1. Device generates probe data
2. Data flows to Tetragrammatron hardware layer
3. Assets referenced in canonical records

## Asset Integration with Tetragrammatron-OS

### Hardware Probe Integration
- Firmware version tracked in probe events
- Device capabilities recorded in canonical records
- Hardware state projected to VM sphere

### Asset References
- Firmware binaries may be referenced in `hardware/probe.jsonl`
- Device configurations in `hardware/canon.json`
- Projected state in `hardware/sphere.json`

## Asset Management

### Versioning
- ESP-IDF: v5.4.1 (documented in path)
- esptool: Managed by Python venv (check with `pip list`)
- Firmware: Versioned in source code/build

### Storage Locations
- **Source assets**: Service directories
- **Generated assets**: Build output directories
- **Final assets**: Deployment locations (if applicable)

### Asset Cleanup
- Build artifacts can be regenerated
- Source assets should be preserved
- Generated assets may be cleaned between builds

## Notes

- Assets are primarily located in service directories and build outputs
- This catalog documents what assets exist and their purposes
- Actual asset files should be referenced from their source locations

