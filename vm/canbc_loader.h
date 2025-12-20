#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const uint8_t *base;
    size_t len;
} canbc_blob_t;

typedef struct {
    // Header
    uint8_t  ring_id;
    uint8_t  header_flags;
    uint32_t section_cnt;

    // VMPR
    uint32_t isa_id;      // "CAN1"
    uint16_t reg_count;
    uint16_t word_bits;

    // CODE
    uint32_t code_words;
    uint32_t entry_pc_words;
    const uint8_t *code_words_be; // pointer into file payload (u16 BE stream)

    // POLY
    uint32_t poly_cnt;
    const uint8_t *poly_table;    // pointer into POLY payload (u32 len + blob bytes)

} canbc_view_t;

typedef enum {
    CANBC_OK = 0,
    CANBC_ERR_MAGIC,
    CANBC_ERR_VERSION,
    CANBC_ERR_TRUNC,
    CANBC_ERR_SECTION,
    CANBC_ERR_REQUIRED_MISSING,
    CANBC_ERR_BAD_VMPR,
    CANBC_ERR_BAD_CODE,
} canbc_status_t;

// Parse file into a view (no allocations). base MUST remain valid.
canbc_status_t canbc_parse(const uint8_t *base, size_t len, canbc_view_t *out);

// Fetch ith polynomial blob from POLY section (raw CLBC-POLY bytes)
bool canbc_poly_get(const canbc_view_t *v, uint32_t i, canbc_blob_t *out_blob);

// Copy CODE words into host-endian u16 array
bool canbc_copy_code_u16(const canbc_view_t *v, uint16_t *dst, uint32_t cap_words);

#ifdef __cplusplus
}
#endif
