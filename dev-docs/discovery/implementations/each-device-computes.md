# Each device computes:
for poly in test_polynomials:
    p = parse_poly(poly)
    q = p * p  # Square it
    r = gcd(p, q)
    assert r == p  # Must hold on ALL architectures
```

Phase B: CanvasL JSONL Throughput

```
Device        | JSONL/sec | Poly ops/sec | State hash identical?
-------------|-----------|-------------|-----------------------
ESP32-S3 A   | 220       | 180         | ✓
ESP32-S3 B   | 215       | 175         | ✓  
ESP32-S3 C   | 210       | 170         | ✓
Pico W2      | 95        | 75          | ✓  # Slower but CORRECT
```

Phase C: Mixed Network Polynomial Consensus

```
Network Topology:
  ESP32-A <--ESP-NOW--> ESP32-B <--ESP-NOW--> ESP32-C
      ↓                    ↓                    ↓
    TCP/IP              TCP/IP              TCP/IP
      └─────────┬─────────┘                    ↓
              Pico W2 (Bridge)            [Internet?]
```

Test: All nodes start with different polynomial Pᵢ, converge to consensus polynomial C via your PCG algorithm.

Pico W2-Specific Advantages for Your Protocol

1. Better Floating-Point-Free Guarantee

· Pico W2 has no hardware FPU (Cortex-M0+)
· ESP32-S3 has single-precision FPU
· Proof: Your polynomial arithmetic works without any floating point

2. Memory Constraint Validation

Pico's 264KB forces you to implement true streaming polynomial evaluation:

```c
// On ESP32 you might buffer:
Poly buffer[1000];  // Easy with 512KB

// On Pico W2 you need:
Poly buffer[100];   // Must stream/process incrementally
```

This proves your protocol works with real memory constraints.

3. Different Byte Order Possibility

· ESP32: Little-endian Xtensa
· RP2040: Little-endian ARM (same, but could be configured differently)
· Opportunity: Test with different byte orders to prove serialization robustness

Concrete Implementation Plan

Step 1: Polynomial Library Port (Day 1)

```c
// File: polynomial.h (portable C)
typedef struct {
    uint32_t *coeffs;  // Bitset for F₂[x]
    size_t degree;
} Polynomial;

// These MUST produce identical results on ESP32 and Pico:
Polynomial poly_gcd(Polynomial a, Polynomial b);
Polynomial poly_mul(Polynomial a, Polynomial b);
uint8_t* poly_serialize(Polynomial p);  // Canonical byte form
```

Step 2: JSONL Parser (Day 2)

```c
// Parse {"type":"poly","coeffs":[1,0,1],"mod":2}
Polynomial parse_jsonl_poly(const char* jsonl_line);
// Must produce identical Polynomial object on both platforms
```

Step 3: Cross-Platform Test (Day 3)

```bash