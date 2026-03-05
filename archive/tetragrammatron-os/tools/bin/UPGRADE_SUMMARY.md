# Upgrade Summary: ABI v2 Migration

## ✅ Completed Actions

### 1. Upgraded Python Compiler to ABI v2

**File:** `tools/compile_schema.py`

**Changes:**
- ✅ Now generates ABI v2 format (version=2)
- ✅ Reads `schema_class` from YAML and includes in binary
- ✅ Reads `realm` from YAML and includes in binary
- ✅ Reads `epoch` from YAML and includes in binary
- ✅ Generates prefix list format instead of full row specs
- ✅ Matches web viewer's expected format exactly

**ABI v2 Layout:**
```
offset  size  field
0       4     magic = "TADR" (big-endian)
4       2     abi = 2 (little-endian)
6       1     rows = 8
7       1     schema_rows = 5
8       1     schema_class (0=private, 1=protected, 2=public)
9       1     realm (R0 byte)
10      2     epoch (little-endian)
12      1     prefix_count = N
13      5*N   allowed_prefixes (each 5 bytes: R0-R4)
```

**Example Output:**
```bash
$ python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
Wrote build/address-schema.bin (18 bytes)
  ABI v2, class=public, realm=0x1A, epoch=3
  Prefixes: 1
```

### 2. Deleted Deprecated Files

**Deleted:**
- ✅ `tools/bin/addr_schema.h` - Hardcoded schema arrays (violates data-driven principle)
- ✅ `tools/bin/addr_schema.v1.h` - Duplicate file

**Reason:** These files used hardcoded schema arrays instead of data-driven binary tables. The canonical implementation is in `components/tetragrammatron_schema/include/tetragrammatron_schema.h`.

### 3. Fixed Broken References

**File:** `tools/bin/addr_schema_validate.c`

**Changes:**
- ✅ Fixed to use canonical `tetragrammatron_schema.h` header
- ✅ Added deprecation notice
- ✅ Wrapped legacy function to use canonical API

**Before:**
```c
#include "addr_schema_runtime.h"  // Wrong header
bool schema_prefix_valid(const uint8_t addr[8]) {
  // References undefined g_schema
}
```

**After:**
```c
#include "../../components/tetragrammatron_schema/include/tetragrammatron_schema.h"
// Uses canonical tg_schema_prefix_valid_global()
```

### 4. Renamed Reference File

**File:** `tools/bin/address_schema.bin` → `address_schema.bin.layout.txt`

**Reason:** File contained C struct definitions (documentation), not actual binary data. Renamed to make purpose clear.

## ⚠️ Remaining Issues

### 1. ESP32 Component Still Uses ABI v1

**Status:** ⚠️ **PENDING**

**Files:**
- `components/tetragrammatron_schema/include/tetragrammatron_schema.h` (ABI v1)
- `components/tetragrammatron_schema/tetragrammatron_schema.c` (ABI v1)

**Issue:** ESP32 component expects ABI v1 format, but compiler now generates ABI v2.

**Options:**
1. **Upgrade ESP32 component to ABI v2** (recommended)
2. **Support both ABI v1 and v2** with version detection
3. **Keep ABI v1 for ESP32, v2 for web viewer** (not recommended - causes drift)

**Recommendation:** Upgrade ESP32 component to ABI v2 to maintain consistency.

### 2. Incomplete Files in tools/bin/

**Status:** ⚠️ **PENDING**

**Files:**
- `addr_schema_runtime.h` - ABI v1 only, needs v2 support
- `addr_schema_load.c` - ABI v1 only, needs v2 support
- `addr_tg_schema_runtime.h` - Partial (has mode bits but incomplete)

**Action:** These files are reference/legacy. Consider:
- Moving to `dev-docs/` as examples
- Or deleting if not used
- Or completing ABI v2 support if needed

## 📊 Alignment Status

| Component | ABI Version | Status |
|-----------|-------------|--------|
| Python Compiler | v2 | ✅ **UPGRADED** |
| Web Viewer | v2 | ✅ Already correct |
| ESP32 Component | v1 | ⚠️ Needs upgrade |
| YAML Schema | v3 (has v2 fields) | ✅ Correct |

## Next Steps

### Priority 1: ESP32 Component Upgrade

1. Update `tetragrammatron_schema.h` to support ABI v2:
   - Add `schema_class`, `realm`, `epoch` fields
   - Change from row specs to prefix list
   - Add version detection to support both v1 and v2 (optional)

2. Update `tetragrammatron_schema.c`:
   - Load ABI v2 format
   - Validate using prefix list instead of row specs
   - Handle schema_class, realm, epoch

### Priority 2: Clean Up tools/bin/

1. Move active files to component directory:
   - `addr_assign.c` → `components/tetragrammatron_schema/`
   - `collision.c` → `components/tetragrammatron_schema/`

2. Move reference files to docs:
   - `binary_schema_header.c` → `dev-docs/`
   - `addr_schema_runtime.h` → `dev-docs/examples/`
   - `addr_schema_load.c` → `dev-docs/examples/`

3. Complete or remove partial files:
   - `addr_tg_schema_runtime.h` - Integrate mode bits into main header or remove

## Testing

### Test Compiler Output

```bash
# Compile schema
python3 tools/compile_schema.py address-schema.yaml -o build/test.bin

# Verify format
hexdump -C build/test.bin

# Expected:
# 00000000  54 41 44 52 02 00 08 05  02 1a 03 00 01 1a 02 04  |TADR............|
# 00000010  03 02                                             |..|
#
# Breakdown:
# 54 41 44 52 = "TADR" magic
# 02 00 = ABI v2 (little-endian)
# 08 = rows
# 05 = schema_rows
# 02 = schema_class (public)
# 1a = realm
# 03 00 = epoch 3 (little-endian)
# 01 = prefix_count
# 1a 02 04 03 02 = prefix (R0:R1:R2:R3:R4)
```

### Verify Web Viewer Compatibility

The web viewer's `schema.ts` expects ABI v2 format. After upgrading the compiler, schemas should load correctly in the viewer.

## Migration Notes

### Backward Compatibility

**Breaking Change:** The compiler now generates ABI v2, which is incompatible with ABI v1 loaders.

**Impact:**
- ESP32 firmware using ABI v1 will not load new schemas
- Must upgrade ESP32 component to ABI v2

**Mitigation:**
- Option 1: Upgrade ESP32 component (recommended)
- Option 2: Add version detection to support both formats
- Option 3: Keep old compiler for ESP32, new for web (not recommended)

### Schema YAML Requirements

The YAML must now include:
- `schema_class`: "private" | "protected" | "public"
- `realm`: hex value (e.g., 0x1A)
- `epoch`: integer (monotonic version)

These fields are required for ABI v2 compilation.

## Summary

✅ **Completed:**
- Python compiler upgraded to ABI v2
- Deprecated files deleted
- Broken references fixed
- Reference files renamed

⚠️ **Pending:**
- ESP32 component upgrade to ABI v2
- Cleanup of tools/bin/ directory
- Integration of mode bits support

The critical ABI version mismatch between compiler and web viewer is now **resolved**. The remaining work is to upgrade the ESP32 component to maintain full system alignment.

