# Component Path Fix

## Problem

ESP-IDF build was failing with:
```
CMake Error: Failed to resolve component 'tetragrammatron_schema' required by component 'main': unknown name.
```

## Root Cause

ESP-IDF v5.4.1 couldn't find the `tetragrammatron_schema` component because:
- The component is located at `components/tetragrammatron_schema/` (repo root)
- The ESP-IDF project is at `hardware/esp32/can_app/`
- ESP-IDF only searches in `components/` relative to the project root by default
- `idf_component.yml` is for external dependencies, not local components

## Solution

Added `EXTRA_COMPONENT_DIRS` to the project's `CMakeLists.txt`:

```cmake
# Add the repository's components directory to component search path
get_filename_component(REPO_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../.." ABSOLUTE)
set(EXTRA_COMPONENT_DIRS "${REPO_ROOT}/components")
```

This tells ESP-IDF to also search in the repository root's `components/` directory.

## Files Changed

1. **`hardware/esp32/can_app/CMakeLists.txt`**
   - Added `EXTRA_COMPONENT_DIRS` configuration

2. **`hardware/esp32/can_app/idf_component.yml`**
   - Updated comment to clarify that local components use CMake, not component manager

## Verification

After this fix, the build should succeed:
```bash
cd hardware/esp32
./build.sh
```

The component will be found at:
- `components/tetragrammatron_schema/` (from repo root)
- Resolved via `EXTRA_COMPONENT_DIRS` in project CMakeLists.txt

