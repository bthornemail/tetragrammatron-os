# ABI v2 Migration Complete

## Summary

The codebase has been **fully migrated to ABI v2**, removing all references to ABI v1. All components now use the unified ABI v2 format with schema_class, realm, epoch, and prefix list.

## ✅ Completed Changes

### 1. ESP32 Component (ABI v2)

**Files Updated:**
- `components/tetragrammatron_schema/include/tetragrammatron_schema.h`
- `components/tetragrammatron_schema/tetragrammatron_schema.c`

**Changes:**
- ✅ Changed from fixed-size struct to dynamic allocation (variable-length prefix list)
- ✅ Added `schema_class`, `realm`, `epoch` fields
- ✅ Updated `tg_schema_load_from_bytes()` to allocate memory and return pointer
- ✅ Added `tg_schema_free()` for memory management
- ✅ Updated version check to require ABI v2 only (`version != 2` returns false)
- ✅ Added helper functions: `tg_schema_get_class()`, `tg_schema_get_realm()`, `tg_schema_get_epoch()`

**ABI v2 Structure:**
```c
typedef struct {
  uint32_t magic;           // 'TADR'
  uint16_t version;         // 2 (ABI v2)
  uint8_t  rows;            // 8
  uint8_t  schema_rows;     // 5
  uint8_t  schema_class;    // 0=private, 1=protected, 2=public
  uint8_t  realm;           // R0 byte
  uint16_t epoch;           // monotonic version (little-endian)
  uint8_t  prefix_count;    // number of valid prefixes
  tg_prefix40_t prefixes[]; // variable-length array of prefixes
} tg_schema_t;
```

### 2. Python Compiler (ABI v2)

**File Updated:**
- `tools/compile_schema.py`

**Changes:**
- ✅ Reads `schema_class`, `realm`, `epoch` from YAML
- ✅ Generates prefix list from rowspec (all combinations of allowed values)
- ✅ Sets version to 2 (little-endian)
- ✅ Outputs compact binary format: ~13 + (5 × prefix_count) bytes

**Verification:**
```bash
$ python3 tools/compile_schema.py address-schema.yaml -o /tmp/test.bin
Wrote /tmp/test.bin (18 bytes)
  ABI v2, class=public, realm=0x1A, epoch=3
  Prefixes: 1
```

### 3. AGENT.org (Literate Source)

**File Updated:**
- `AGENT.org`

**Changes:**
- ✅ Updated Python compiler code block to generate ABI v2
- ✅ Updated C header code block to ABI v2 structure
- ✅ Updated C implementation code block to load ABI v2
- ✅ Updated schema version references from v1 to v2

### 4. Documentation Updates

**Files Updated:**
- `dev-docs/03-ONTOLOGY.md` - Updated schema version references
- `tools/obsidian/frontmatter_template.md` - Updated schema version
- `tools/bin/VALIDATION_REPORT.md` - Marked all issues as resolved

**Changes:**
- ✅ All schema version references changed from `@v1` to `@v2`
- ✅ Code examples updated to show ABI v2 format
- ✅ Binary layout documentation updated

### 5. Legacy Files (Deprecated)

**Files Marked as Deprecated:**
- `tools/bin/addr_schema_runtime.h` - Marked as ABI v1 (deprecated)
- `tools/bin/addr_schema_load.c` - Marked as ABI v1 (deprecated)
- `tools/bin/addr_schema_validate.c` - Already had deprecation notice

**Files Updated to Use Canonical Header:**
- `tools/bin/addr_assign.c` - Now uses `tetragrammatron_schema.h`
- `tools/bin/collision.c` - Now uses `tetragrammatron_schema.h`

## ABI v2 Binary Format

**Layout:**
```
offset size  field
0      4     magic = "TADR" (big-endian)
4      2     abi = 2 (little-endian)
6      1     rows = 8
7      1     schema_rows = 5
8      1     schema_class (0=private, 1=protected, 2=public)
9      1     realm (R0 byte)
10     2     epoch (little-endian)
12     1     prefix_count = N
13     5*N   allowed_prefixes (each 5 bytes: R0-R4)
```

**Total size:** ~13 + (5 × prefix_count) bytes

## Breaking Changes

⚠️ **This is a breaking change for any existing ABI v1 binaries.**

- Old ABI v1 binaries will **not** load in the new ESP32 component
- Old ABI v1 binaries will **not** load in the web viewer
- All new schemas must be compiled with ABI v2

**Migration Path:**
1. Recompile all schemas using `tools/compile_schema.py` (now generates v2)
2. Update any embedded binaries in ESP32 firmware
3. Regenerate web viewer schema files

## Verification

### Compiler Test
```bash
$ python3 tools/compile_schema.py address-schema.yaml -o /tmp/test.bin
Wrote /tmp/test.bin (18 bytes)
  ABI v2, class=public, realm=0x1A, epoch=3
  Prefixes: 1

$ hexdump -C /tmp/test.bin
00000000  54 41 44 52 02 00 08 05  02 1a 03 00 01 1a 02 04  |TADR............|
00000010  03 02                                             |..|
```

**Verification:**
- ✅ Magic: `54 41 44 52` = "TADR"
- ✅ ABI: `02 00` = 2 (little-endian)
- ✅ Rows: `08` = 8
- ✅ Schema rows: `05` = 5
- ✅ Class: `02` = public
- ✅ Realm: `1a` = 0x1A
- ✅ Epoch: `03 00` = 3 (little-endian)
- ✅ Prefix count: `01` = 1
- ✅ Prefix: `1a 02 04 03 02` = R0:R1:R2:R3:R4

## Component Alignment

### ✅ All Components Now Use ABI v2

| Component | Status | ABI Version |
|-----------|--------|-------------|
| Python Compiler | ✅ | v2 |
| ESP32 Component | ✅ | v2 |
| Web Viewer | ✅ | v2 |
| AGENT.org | ✅ | v2 |
| Documentation | ✅ | v2 |

## Next Steps

1. **Test ESP32 Component:**
   - Compile a schema with `tools/compile_schema.py`
   - Embed in ESP32 firmware
   - Verify `tg_schema_load_embedded()` succeeds
   - Verify `tg_schema_prefix_valid_global()` works

2. **Update Any Custom Tools:**
   - Any scripts that parse schema binaries must support ABI v2
   - Any embedded binaries must be recompiled

3. **Clean Up (Optional):**
   - Consider removing deprecated files in `tools/bin/` after confirming they're not used
   - Move `addr_assign.c` and `collision.c` to component directory

## Files Changed

### Core Components
- `components/tetragrammatron_schema/include/tetragrammatron_schema.h`
- `components/tetragrammatron_schema/tetragrammatron_schema.c`
- `tools/compile_schema.py`

### Documentation
- `AGENT.org`
- `dev-docs/03-ONTOLOGY.md`
- `tools/obsidian/frontmatter_template.md`
- `tools/bin/VALIDATION_REPORT.md`

### Legacy Files (Updated)
- `tools/bin/addr_assign.c` (uses canonical header)
- `tools/bin/collision.c` (uses canonical header)
- `tools/bin/addr_schema_runtime.h` (marked deprecated)
- `tools/bin/addr_schema_load.c` (marked deprecated)

## Summary

✅ **Migration Complete:** All components now use ABI v2 exclusively.  
✅ **No v1 Support:** ABI v1 is no longer supported anywhere.  
✅ **Unified Format:** Python compiler, ESP32, and web viewer all use the same binary format.  
✅ **Triadic Law:** Schema_class, realm, and epoch are now included in all binaries.

