#include "canbc_loader.h"

static uint16_t be16(const uint8_t *p) { return (uint16_t)((p[0] << 8) | p[1]); }
static uint32_t be32(const uint8_t *p) { return (uint32_t)(p[0]<<24 | p[1]<<16 | p[2]<<8 | p[3]); }

static bool tag_eq(const uint8_t *tag4, const char *s4) {
    return tag4[0]==(uint8_t)s4[0] && tag4[1]==(uint8_t)s4[1] && tag4[2]==(uint8_t)s4[2] && tag4[3]==(uint8_t)s4[3];
}

canbc_status_t canbc_parse(const uint8_t *base, size_t len, canbc_view_t *out) {
    if (!base || !out || len < 24) return CANBC_ERR_TRUNC;

    if (!(base[0]=='C' && base[1]=='L' && base[2]=='B' && base[3]=='C')) return CANBC_ERR_MAGIC;
    if (base[4] != (uint8_t)'C') return CANBC_ERR_SECTION;   // kind
    if (base[5] != 0x01) return CANBC_ERR_VERSION;

    const uint8_t ring_id = base[6];
    const uint8_t hflags  = base[7];
    const uint32_t file_len = be32(base + 8);
    const uint32_t scnt     = be32(base + 12);

    if ((size_t)file_len != len) return CANBC_ERR_TRUNC;

    // init view
    *out = (canbc_view_t){0};
    out->ring_id = ring_id;
    out->header_flags = hflags;
    out->section_cnt = scnt;

    bool have_vmpr = false;
    bool have_code = false;

    size_t off = 24;
    for (uint32_t si=0; si<scnt; si++) {
        if (off + 12 > len) return CANBC_ERR_TRUNC;

        const uint8_t *tag = base + off;      // 4
        const uint16_t sflags = be16(base + off + 4);
        const uint16_t align  = be16(base + off + 6);
        const uint32_t slen   = be32(base + off + 8);
        (void)sflags; (void)align;

        const size_t payload_off = off + 12;
        if (payload_off + slen > len) return CANBC_ERR_TRUNC;
        const uint8_t *payload = base + payload_off;

        if (tag_eq(tag, "VMPR")) {
            if (slen < 12) return CANBC_ERR_BAD_VMPR;
            out->isa_id    = be32(payload + 0);
            out->reg_count = be16(payload + 4);
            out->word_bits = be16(payload + 6);
            have_vmpr = true;
        } else if (tag_eq(tag, "CODE")) {
            if (slen < 8) return CANBC_ERR_BAD_CODE;
            out->code_words      = be32(payload + 0);
            out->entry_pc_words  = be32(payload + 4);
            const size_t words_bytes = (size_t)out->code_words * 2;
            if (slen < 8 + words_bytes) return CANBC_ERR_BAD_CODE;
            out->code_words_be = payload + 8;
            have_code = true;
        } else if (tag_eq(tag, "POLY")) {
            if (slen < 4) return CANBC_ERR_SECTION;
            out->poly_cnt   = be32(payload + 0);
            out->poly_table = payload + 4; // sequence: u32 len + blob
        }

        off = payload_off + slen;
    }

    if (!have_vmpr || !have_code) return CANBC_ERR_REQUIRED_MISSING;
    // VM profile sanity:
    if (out->isa_id != 0x43414E31U) return CANBC_ERR_BAD_VMPR; // "CAN1"
    if (out->word_bits != 16) return CANBC_ERR_BAD_VMPR;

    return CANBC_OK;
}

bool canbc_poly_get(const canbc_view_t *v, uint32_t i, canbc_blob_t *out_blob) {
    if (!v || !out_blob) return false;
    if (v->poly_cnt == 0 || !v->poly_table) return false;
    if (i >= v->poly_cnt) return false;

    const uint8_t *p = v->poly_table;
    for (uint32_t k=0; k<v->poly_cnt; k++) {
        uint32_t blen = be32(p);
        p += 4;
        if (k == i) {
            out_blob->base = p;
            out_blob->len  = blen;
            return true;
        }
        p += blen;
    }
    return false;
}

bool canbc_copy_code_u16(const canbc_view_t *v, uint16_t *dst, uint32_t cap_words) {
    if (!v || !dst) return false;
    if (cap_words < v->code_words) return false;
    const uint8_t *p = v->code_words_be;
    for (uint32_t i=0; i<v->code_words; i++) {
        dst[i] = be16(p + (size_t)i*2);
    }
    return true;
}
