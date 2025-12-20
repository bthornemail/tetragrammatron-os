// f2poly.c
// F₂[x] Polynomial Operations for CLBC-POLY v1
// Role B: COMPILER / VM IMPLEMENTER
// Implements: RFC-009 §X.7, RFC-0011 §6

#include "f2poly.h"

// Minimal string operations for compatibility
static void* memset_local(void* ptr, int value, size_t num) {
    unsigned char* p = (unsigned char*)ptr;
    while (num--) *p++ = (unsigned char)value;
    return ptr;
}

static int snprintf_local(char* str, size_t size, const char* format, ...) {
    // Minimal implementation - just copy format and return length
    const char* src = format;
    char* dst = str;
    size_t i = 0;
    
    while (i < size - 1 && *src) {
        *dst++ = *src++;
        i++;
    }
    *dst = '\0';
    
    return i;
}

#define memset memset_local
#define snprintf snprintf_local

// Helper: count set bits in 32-bit word (popcount)
static inline uint32_t popcount32(uint32_t x) {
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0F0F0F0F;
    x = x + (x >> 8);
    x = x + (x >> 16);
    return x & 0x3F;
}

// Helper: find position of highest set bit (0-based)
static inline int32_t find_msb32(uint32_t x) {
    if (x == 0) return -1;
    return 31 - __builtin_clz(x);
}

// Initialize polynomial to zero
void f2poly_init(f2poly_t* poly) {
    if (!poly) return;
    memset(poly, 0, sizeof(*poly));
}

// Set polynomial to zero
void f2poly_zero(f2poly_t* poly) {
    if (!poly) return;
    memset(poly->words, 0, sizeof(poly->words));
    poly->degree = 0;
    poly->nwords = 0;
}

// Set polynomial to one (x^0 = 1)
void f2poly_one(f2poly_t* poly) {
    if (!poly) return;
    memset(poly->words, 0, sizeof(poly->words));
    poly->words[0] = 0x00000001;  // Set bit 0
    poly->degree = 0;
    poly->nwords = 1;
}

// Set bit at position 'bit' (0-based)
void f2poly_set_bit(f2poly_t* poly, uint32_t bit) {
    if (!poly || bit >= F2POLY_MAX_DEGREE) return;
    
    uint32_t word_idx = bit / 32;
    uint32_t bit_idx = bit % 32;
    
    poly->words[word_idx] |= (1u << bit_idx);
    
    // Update degree and nwords
    if (bit > poly->degree) {
        poly->degree = bit;
        poly->nwords = word_idx + 1;
    }
}

// Get bit at position 'bit' (0-based)
bool f2poly_get_bit(const f2poly_t* poly, uint32_t bit) {
    if (!poly || bit >= F2POLY_MAX_DEGREE) return false;
    
    uint32_t word_idx = bit / 32;
    uint32_t bit_idx = bit % 32;
    
    return (poly->words[word_idx] & (1u << bit_idx)) != 0;
}

// Normalize polynomial (update degree and nwords)
void f2poly_normalize(f2poly_t* poly) {
    if (!poly) return;
    
    // Find highest set bit
    int32_t msb = -1;
    for (int32_t i = F2POLY_MAX_WORDS - 1; i >= 0; i--) {
        if (poly->words[i] != 0) {
            msb = find_msb32(poly->words[i]) + i * 32;
            break;
        }
    }
    
    if (msb < 0) {
        // Zero polynomial
        poly->degree = 0;
        poly->nwords = 0;
    } else {
        poly->degree = (uint32_t)msb;
        poly->nwords = (msb / 32) + 1;
    }
}

// Addition over F₂[x] (XOR operation)
void f2poly_add(const f2poly_t* a, const f2poly_t* b, f2poly_t* out) {
    if (!a || !b || !out) return;
    
    f2poly_init(out);
    
    // XOR the coefficients
    uint32_t max_words = (a->nwords > b->nwords) ? a->nwords : b->nwords;
    for (uint32_t i = 0; i < max_words; i++) {
        out->words[i] = a->words[i] ^ b->words[i];
    }
    
    f2poly_normalize(out);
}

// Multiplication over F₂[x] (schoolbook algorithm)
void f2poly_mul(const f2poly_t* a, const f2poly_t* b, f2poly_t* out) {
    if (!a || !b || !out) return;
    
    f2poly_init(out);
    
    // If either is zero, result is zero
    if (a->nwords == 0 || b->nwords == 0) {
        return;
    }
    
    // Schoolbook multiplication
    for (uint32_t i = 0; i < a->nwords; i++) {
        for (uint32_t j = 0; j < 32; j++) {
            if ((a->words[i] >> j) & 1) {
                uint32_t bit_a = i * 32 + j;
                
                for (uint32_t k = 0; k < b->nwords; k++) {
                    for (uint32_t l = 0; l < 32; l++) {
                        if ((b->words[k] >> l) & 1) {
                            uint32_t bit_b = k * 32 + l;
                            uint32_t result_bit = bit_a + bit_b;
                            
                            if (result_bit < F2POLY_MAX_DEGREE) {
                                f2poly_set_bit(out, result_bit);
                            }
                        }
                    }
                }
            }
        }
    }
    
    f2poly_normalize(out);
}

// Polynomial division over F₂[x] (long division)
void f2poly_div(const f2poly_t* a, const f2poly_t* b, f2poly_t* q, f2poly_t* r) {
    if (!a || !b || !q || !r) return;
    
    f2poly_init(q);
    f2poly_init(r);
    
    // Check for division by zero
    if (b->nwords == 0) {
        return;  // Error case
    }
    
    // Copy dividend to remainder
    *r = *a;
    
    // If divisor degree > dividend degree, quotient is 0, remainder is dividend
    if (b->degree > a->degree) {
        return;
    }
    
    // Long division
    while (r->degree >= b->degree && r->nwords > 0) {
        uint32_t shift = r->degree - b->degree;
        
        // Set quotient bit
        f2poly_set_bit(q, shift);
        
        // Subtract (XOR) shifted divisor from remainder
        f2poly_t shifted_div;
        f2poly_init(&shifted_div);
        
        // Shift divisor
        for (uint32_t i = 0; i < b->nwords; i++) {
            uint32_t src_word = b->words[i];
            if (src_word == 0) continue;
            
            for (uint32_t j = 0; j < 32; j++) {
                if ((src_word >> j) & 1) {
                    uint32_t src_bit = i * 32 + j;
                    uint32_t dst_bit = src_bit + shift;
                    
                    if (dst_bit < F2POLY_MAX_DEGREE) {
                        f2poly_set_bit(&shifted_div, dst_bit);
                    }
                }
            }
        }
        
        // XOR shifted divisor from remainder
        f2poly_t new_r;
        f2poly_add(r, &shifted_div, &new_r);
        *r = new_r;
    }
    
    f2poly_normalize(q);
    f2poly_normalize(r);
}

// GCD using Euclidean algorithm over F₂[x]
void f2poly_gcd(const f2poly_t* a, const f2poly_t* b, f2poly_t* out) {
    if (!a || !b || !out) return;
    
    f2poly_t r, q, temp;
    f2poly_init(&r);
    f2poly_init(&q);
    f2poly_init(&temp);
    
    // Handle special cases
    if (a->nwords == 0) {
        *out = *b;
        return;
    }
    if (b->nwords == 0) {
        *out = *a;
        return;
    }
    
    // Euclidean algorithm: gcd(a,b) = gcd(b, a mod b)
    f2poly_t a_copy = *a;
    f2poly_t b_copy = *b;
    
    while (b_copy.nwords != 0) {
        f2poly_div(&a_copy, &b_copy, &q, &r);
        a_copy = b_copy;
        b_copy = r;
    }
    
    *out = a_copy;
    
    // Ensure result is monic (highest coefficient = 1)
    if (out->nwords > 0) {
        // In F₂[x], monic means highest coefficient is 1 (already true)
        // No additional work needed
    }
}

// LCM: lcm(a,b) = (a*b) / gcd(a,b)
void f2poly_lcm(const f2poly_t* a, const f2poly_t* b, f2poly_t* out) {
    if (!a || !b || !out) return;
    
    f2poly_t product, gcd, quotient;
    f2poly_init(&product);
    f2poly_init(&gcd);
    f2poly_init(&quotient);
    
    // Handle zero cases
    if (a->nwords == 0 || b->nwords == 0) {
        f2poly_zero(out);
        return;
    }
    
    // lcm(a,b) = (a*b) / gcd(a,b)
    f2poly_mul(a, b, &product);
    f2poly_gcd(a, b, &gcd);
    f2poly_div(&product, &gcd, out, &quotient);
}

// Hamming weight (number of non-zero coefficients)
uint32_t f2poly_weight(const f2poly_t* poly) {
    if (!poly) return 0;
    
    uint32_t weight = 0;
    for (uint32_t i = 0; i < poly->nwords; i++) {
        weight += popcount32(poly->words[i]);
    }
    return weight;
}

// Check if polynomial is zero
bool f2poly_is_zero(const f2poly_t* poly) {
    if (!poly) return true;
    return poly->nwords == 0;
}

// Check if polynomial is one
bool f2poly_is_one(const f2poly_t* poly) {
    if (!poly) return false;
    return (poly->degree == 0 && poly->nwords == 1 && poly->words[0] == 0x00000001);
}

// Check if two polynomials are equal
bool f2poly_equals(const f2poly_t* a, const f2poly_t* b) {
    if (!a || !b) return false;
    
    if (a->degree != b->degree || a->nwords != b->nwords) {
        return false;
    }
    
    for (uint32_t i = 0; i < a->nwords; i++) {
        if (a->words[i] != b->words[i]) {
            return false;
        }
    }
    
    return true;
}

// Encode polynomial to CLBC-POLY v1 format
bool f2poly_encode(const f2poly_t* poly, uint8_t* out_bytes, size_t* out_len) {
    if (!poly || !out_bytes || !out_len) return false;
    
    // Calculate required size
    size_t required_size = sizeof(clbc_poly_header_t) + poly->nwords * 4;
    if (*out_len < required_size) {
        *out_len = required_size;
        return false;
    }
    
    // Write header
    clbc_poly_header_t* header = (clbc_poly_header_t*)out_bytes;
    header->magic[0] = CLBC_MAGIC0;
    header->magic[1] = CLBC_MAGIC1;
    header->magic[2] = CLBC_MAGIC2;
    header->magic[3] = CLBC_MAGIC3;
    header->kind = CLBC_KIND_POLY;
    header->ver = CLBC_VER_V1;
    header->ring = CLBC_RING_F2;
    header->flags = 0;
    
    // Big-endian encoding for degree and nwords
    header->degree = (poly->degree >> 24) | ((poly->degree >> 8) & 0x0000ff00) |
                     ((poly->degree << 8) & 0x00ff0000) | (poly->degree << 24);
    header->nwords = (poly->nwords >> 24) | ((poly->nwords >> 8) & 0x0000ff00) |
                     ((poly->nwords << 8) & 0x00ff0000) | (poly->nwords << 24);
    
    // Write polynomial words (big-endian)
    uint8_t* word_ptr = out_bytes + sizeof(clbc_poly_header_t);
    for (uint32_t i = 0; i < poly->nwords; i++) {
        uint32_t word = poly->words[i];
        *word_ptr++ = (uint8_t)(word >> 24);
        *word_ptr++ = (uint8_t)(word >> 16);
        *word_ptr++ = (uint8_t)(word >> 8);
        *word_ptr++ = (uint8_t)(word & 0xff);
    }
    
    *out_len = required_size;
    return true;
}

// Decode polynomial from CLBC-POLY v1 format
bool f2poly_decode(const uint8_t* in_bytes, size_t in_len, f2poly_t* out) {
    if (!in_bytes || !out || in_len < sizeof(clbc_poly_header_t)) {
        return false;
    }
    
    // Read and validate header
    const clbc_poly_header_t* header = (const clbc_poly_header_t*)in_bytes;
    
    // Check magic
    if (header->magic[0] != CLBC_MAGIC0 || header->magic[1] != CLBC_MAGIC1 ||
        header->magic[2] != CLBC_MAGIC2 || header->magic[3] != CLBC_MAGIC3) {
        return false;
    }
    
    // Check kind and version
    if (header->kind != CLBC_KIND_POLY || header->ver != CLBC_VER_V1 ||
        header->ring != CLBC_RING_F2 || header->flags != 0) {
        return false;
    }
    
    // Read degree and nwords (big-endian)
    uint32_t degree = (header->degree >> 24) | ((header->degree >> 8) & 0x0000ff00) |
                      ((header->degree << 8) & 0x00ff0000) | (header->degree << 24);
    uint32_t nwords = (header->nwords >> 24) | ((header->nwords >> 8) & 0x0000ff00) |
                      ((header->nwords << 8) & 0x00ff0000) | (header->nwords << 24);
    
    // Check size
    size_t expected_size = sizeof(clbc_poly_header_t) + nwords * 4;
    if (in_len < expected_size || nwords > F2POLY_MAX_WORDS) {
        return false;
    }
    
    // Initialize polynomial
    f2poly_init(out);
    out->degree = degree;
    out->nwords = nwords;
    
    // Read polynomial words (big-endian)
    const uint8_t* word_ptr = in_bytes + sizeof(clbc_poly_header_t);
    for (uint32_t i = 0; i < nwords; i++) {
        out->words[i] = ((uint32_t)word_ptr[0] << 24) | ((uint32_t)word_ptr[1] << 16) |
                       ((uint32_t)word_ptr[2] << 8) | (uint32_t)word_ptr[3];
        word_ptr += 4;
    }
    
    return true;
}

// Pretty print polynomial
void f2poly_print(const f2poly_t* poly, char* buf, size_t buf_len) {
    if (!poly || !buf || buf_len == 0) return;
    
    if (f2poly_is_zero(poly)) {
        snprintf(buf, buf_len, "0");
        return;
    }
    
    buf[0] = '\0';
    size_t pos = 0;
    bool first = true;
    
    for (int32_t i = (int32_t)poly->degree; i >= 0; i--) {
        if (f2poly_get_bit(poly, (uint32_t)i)) {
            if (!first) {
                pos += snprintf(buf + pos, buf_len - pos, " + ");
            }
            
            if (i == 0) {
                pos += snprintf(buf + pos, buf_len - pos, "1");
            } else if (i == 1) {
                pos += snprintf(buf + pos, buf_len - pos, "x");
            } else {
                pos += snprintf(buf + pos, buf_len - pos, "x^%d", i);
            }
            
            first = false;
        }
    }
}