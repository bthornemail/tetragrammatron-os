;; tools/can-pack.scm
;; Pure byte packing helpers (big-endian, RFC-0012 §4.1)

(define (u8 n) (bitwise-and n #xff))

(define (u16be n)
  (list (u8 (arithmetic-shift n -8))
        (u8 n)))

(define (u32be n)
  (list (u8 (arithmetic-shift n -24))
        (u8 (arithmetic-shift n -16))
        (u8 (arithmetic-shift n -8))
        (u8 n)))

(define (ascii-bytes s)
  (map char->integer (string->list s)))

(define (append* xs) (apply append xs))

(define (write-bytes-to-port bs port)
  (for-each (lambda (b) (write-u8 b port)) bs))

(define (write-u8 b port)
  (write-byte (u8 b) port))



