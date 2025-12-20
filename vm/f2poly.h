// f2poly.h
// F₂[x] Polynomial Operations for CLBC-POLY v1
// Role B: COMPILER / VM IMPLEMENTER
// Implements: RFC-009 §X.7, RFC-0011 §6

#pragma once

#include <stdint.h>

// Define bool type if not available
#ifndef __cplusplus
typedef enum { false, true } bool;
#endif

// Define size_t if not available
#ifndef _SIZE_T_DEFINED
typedef __SIZE_TYPE__ size_t;
#endif

#ifdef __cplusplus
extern "C" {
#endif

// CLBC-POLY v1 constants
#define CLBC_MAGIC0 0x43u  // 'C'
#define CLBC_MAGIC1 0x4Cu  // 'L'
#define CLBC_MAGIC2 0x42u  // 'B'
#define CLBC_MAGIC3 0x43u  // 'C'
#define CLBC_KIND_POLY 0x50u  // 'P'
#define CLBC_VER_V1 0x01u
#define CLBC_RING_F2 0x01u

// Maximum polynomial degree (configurable)
#define F2POLY_MAX_DEGREE 1023
#define F2POLY_MAX_WORDS ((F2POLY_MAX_DEGREE + 31) / 32)

// F₂[x] polynomial structure
typedef struct {
    uint32_t degree;        // Normalized degree (highest set bit)
    uint32_t nwords;        // Number of words used (ceil((degree+1)/32))
    uint32_t words[F2POLY_MAX_WORDS];  // Big-endian bitset coefficients
} f2poly_t;

// CLBC-POLY blob header (16 bytes)
typedef struct {
    uint8_t magic[4];      // "CLBC"
    uint8_t kind;          // 'P' for polynomial
    uint8_t ver;           // 0x01
    uint8_t ring;          // 0x01 for F₂[x]
    uint8_t flags;         // Reserved, must be 0
    uint32_t degree;       // Polynomial degree (big-endian)
    uint32_t nwords;       // Number of words (big-endian)
} __attribute__((packed)) clbc_poly_header_t;

// Polynomial operations
void f2poly_init(f2poly_t* poly);
void f2poly_zero(f2poly_t* poly);
void f2poly_one(f2poly_t* poly);
void f2poly_set_bit(f2poly_t* poly, uint32_t bit);
bool f2poly_get_bit(const f2poly_t* poly, uint32_t bit);
void f2poly_normalize(f2poly_t* poly);

// Arithmetic operations over F₂[x]
void f2poly_add(const f2poly_t* a, const f2poly_t* b, f2poly_t* out);  // XOR
void f2poly_mul(const f2poly_t* a, const f2poly_t* b, f2poly_t* out);  // Schoolbook
void f2poly_div(const f2poly_t* a, const f2poly_t* b, f2poly_t* q, f2poly_t* r);  // Long division
void f2poly_gcd(const f2poly_t* a, const f2poly_t* b, f2poly_t* out);  // Euclidean algorithm
void f2poly_lcm(const f2poly_t* a, const f2poly_t* b, f2poly_t* out);  // (a*b)/gcd(a,b)

// Utility functions
uint32_t f2poly_weight(const f2poly_t* poly);  // Hamming weight (popcount)
bool f2poly_is_zero(const f2poly_t* poly);
bool f2poly_is_one(const f2poly_t* poly);
bool f2poly_equals(const f2poly_t* a, const f2poly_t* b);

// CLBC-POLY encoding/decoding
bool f2poly_encode(const f2poly_t* poly, uint8_t* out_bytes, size_t* out_len);
bool f2poly_decode(const uint8_t* in_bytes, size_t in_len, f2poly_t* out);

// Debug/pretty printing
void f2poly_print(const f2poly_t* poly, char* buf, size_t buf_len);

#ifdef __cplusplus
}
#endif