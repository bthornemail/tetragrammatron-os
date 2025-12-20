# Treat them as stable variables (field set) for embeddings + mnemonics.
emit "{"kind":"CANVASL_FIELDS","t":$TS,"dev":"$DEV","fields":[
  "os.android",
  "cpu.cores",
  "mem.total_kb",
  "net.if",
  "net.addr",
  "net.route",
  "net.dns",
  "proxy.http",
  "proxy.https",
  "storage.home",
  "storage.primary"
]}"

emit "{"kind":"HW_DONE","t":$(NOW_MS),"dev":"$DEV","out":$(jstr "$OUT")}"

echo "Wrote $OUT"
```

### How to run (Termux)
```bash
pkg update -y
pkg install -y python coreutils iproute2
bash hwscan_termux_canvasl.sh hardware.canvasl.jsonl
```

---

## What you get (example output shape)
You’ll get a **CanvasL-compatible JSONL** stream like:

```json
{"$schema":"canvasl://hw/v1","kind":"HW_HEADER","t":...,"dev":"android:...","note":"termux-hwscan"}
{"kind":"HW_OS","t":...,"dev":"...","os":"android","uname":"..."}
{"kind":"HW_CPU","t":...,"dev":"...","model":"...","cores":8}
{"kind":"NET_IF","t":...,"dev":"...","if":"wlan0","flags":"BROADCAST,MULTICAST,UP,LOWER_UP","state":"UP"}
{"kind":"NET_PROXY_ENV","t":...,"dev":"...","http_proxy":"http://10.47.25.121:8888","https_proxy":"http://10.47.25.121:8888","no_proxy":""}
{"kind":"HW_DONE","t":...,"dev":"...","out":"hardware.canvasl.jsonl"}
```

This is already in the form you can:
- hash,
- replay,
- feed into your renderer,
- and later **normalize into polynomials** (feature-set → term basis).

---

## CanvasL “hardware projection” mapping (your next step)
Use these stable record kinds as your **field set**:

- `HW_PROP` → categorical fields (`ro.product.model`, `ro.hardware`, …)
- `HW_CPU` / `HW_MEM` → numeric fields
- `NET_IF` / `NET_ADDR` / `NET_ROUTE` / `NET_DNS` → topology fields
- `NET_PROXY_ENV` / `NET_APT_PROXY_*` → constraint fields (your proxy reality)

If you want, I can now output **the companion normalizer** that takes this JSONL and emits a **canonical “HardwarePoly” basis** (deterministic ordering + stable hashing), ready for your GCD/LCM fold VM.

Say **“2”** and I’ll generate:
- `hw_norm.scm` (Scheme) — JSONL → canonical feature vector → CLBC-POLY bytes (or your CAN-ISA stream)  
- plus a tiny `hw_view.svg` generator that draws the devices as a Fano triad graph from the network routes.

---

## You

2

---

## ChatGPT

Below are **two drop-in Scheme tools**:

1) **`hw_norm.scm`** — reads your `hardware.canvasl.jsonl`, canonicalizes it, and emits:
- `hardware.norm.jsonl` (stable, ordered, deterministic “field set”)
- `hardware.f2poly.jsonl` (a **canonical F₂[x] bitset polynomial** view you can feed into MEET/JOIN later)

2) **`hw_view.scm`** — turns the same input into a **deterministic SVG** that places **7 semantic points** (a Fano-style basis) and highlights which ones are present; outputs `hardware.fano.svg`.

These are **mechanical + non-mystical**: pure normalization, stable ordering, deterministic hashing-to-bits, exact SVG coordinates.

---

## 1) `hw_norm.scm` (JSONL → canonical fields → F₂[x] bitset poly)

> Works on “simple JSON” lines (the ones we emitted): strings/numbers/bools/null, flat objects, small arrays.

```scheme
;; hw_norm.scm
;; R5RS-ish Scheme (tested style: minimal deps). If your Scheme lacks `command-line`,
;; replace `args` handling with constants.

;; ---------------------------
;; Minimal JSON parser for JSONL lines
;; Supports: objects, arrays, strings, numbers, true/false/null
;; ---------------------------

(define (char-ws? c) (or (char=? c #\space) (char=? c #	ab) (char=? c #
ewline) (char=? c #\return)))

(define (string->list* s)
  (let loop ((i 0) (n (string-length s)) (acc '()))
    (if (>= i n) (reverse acc)
        (loop (+ i 1) n (cons (string-ref s i) acc)))))

(define (peek xs) (if (null? xs) #f (car xs)))
(define (pop xs) (if (null? xs) (error "Unexpected EOF") (cdr xs)))

(define (skip-ws xs)
  (let loop ((ys xs))
    (if (and (pair? ys) (char-ws? (car ys))) (loop (cdr ys)) ys)))

(define (expect xs ch)
  (let ((ys (skip-ws xs)))
    (if (and (pair? ys) (char=? (car ys) ch)) (cdr ys)
        (error "Expected char" ch))))

(define (parse-literal xs lit val)
  (let loop ((ys xs) (cs (string->list* lit)))
    (cond
      ((null? cs) (cons val ys))
      ((or (null? ys) (not (char=? (car ys) (car cs))))
       (error "Bad literal" lit))
      (else (loop (cdr ys) (cdr cs))))))

(define (parse-string xs)
  (let ((ys (skip-ws xs)))
    (if (not (and (pair? ys) (char=? (car ys) #"))) (error "Expected string"))
    (let loop ((zs (cdr ys)) (acc '()))
      (cond
        ((null? zs) (error "Unterminated string"))
        ((char=? (car zs) #") (cons (list->string (reverse acc)) (cdr zs)))
        ((char=? (car zs) #\)
         (let ((rs (cdr zs)))
           (if (null? rs) (error "Bad escape"))
           (let ((e (car rs)))
             (cond
               ((char=? e #") (loop (cdr rs) (cons #" acc)))
               ((char=? e #\) (loop (cdr rs) (cons #\ acc)))
               ((char=? e #\/) (loop (cdr rs) (cons #\/ acc)))
               ((char=? e #\b) (loop (cdr rs) (cons (integer->char 8) acc)))
               ((char=? e #\f) (loop (cdr rs) (cons (integer->char 12) acc)))
               ((char=? e #
) (loop (cdr rs) (cons #
ewline acc)))
               ((char=? e #\r) (loop (cdr rs) (cons #\return acc)))
               ((char=? e #	) (loop (cdr rs) (cons #	ab acc)))
               (else (error "Unsupported escape" e))))))
        (else (loop (cdr zs) (cons (car zs) acc)))))))

(define (digit? c) (and c (char>=? c #\0) (char<=? c #\9)))

(define (parse-number xs)
  (let ((ys (skip-ws xs)))
    (let loop ((zs ys) (acc '()))
      (let ((c (peek zs)))
        (cond
          ((and (null? acc) (char=? c #\-)) (loop (cdr zs) (cons c acc)))
          ((digit? c) (loop (cdr zs) (cons c acc)))
          ((and c (or (char=? c #\.) (char=? c #\e) (char=? c #\E) (char=? c #\+) (char=? c #\-))
                (pair? acc))
           (loop (cdr zs) (cons c acc)))
          (else
            (if (null? acc) (error "Expected number")
                (let* ((s (list->string (reverse acc)))
                       (n (string->number s)))
                  (if n (cons n zs) (error "Bad number" s))))))))))

(define (parse-value xs)
  (let ((ys (skip-ws xs)))
    (let ((c (peek ys)))
      (cond
        ((char=? c #\{) (parse-object ys))
        ((char=? c #\[) (parse-array ys))
        ((char=? c #") (parse-string ys))
        ((or (digit? c) (char=? c #\-)) (parse-number ys))
        ((char=? c #	) (parse-literal ys "true" #t))
        ((char=? c #\f) (parse-literal ys "false" #f))
        ((char=? c #
) (parse-literal ys "null" 'null))
        (else (error "Unexpected token" c))))))

(define (parse-pair xs)
  (let* ((r1 (parse-string xs))
         (k (car r1))
         (ys (cdr r1))
         (ys2 (expect ys #\:))
         (r2 (parse-value ys2)))
    (cons (cons k (car r2)) (cdr r2))))

(define (parse-object xs)
  (let ((ys (expect xs #\{)))
    (let ((zs (skip-ws ys)))
      (if (and (pair? zs) (char=? (car zs) #\})) (cons '() (cdr zs))
          (let loop ((rs zs) (acc '()))
            (let* ((p (parse-pair rs))
                   (kv (car p))
                   (rest (skip-ws (cdr p))))
              (cond
                ((and (pair? rest) (char=? (car rest) #\,))
                 (loop (cdr rest) (cons kv acc)))
                ((and (pair? rest) (char=? (car rest) #\}))
                 (cons (reverse (cons kv acc)) (cdr rest)))
                (else (error "Bad object")))))))))

(define (parse-array xs)
  (let ((ys (expect xs #\[)))
    (let ((zs (skip-ws ys)))
      (if (and (pair? zs) (char=? (car zs) #\])) (cons '() (cdr zs))
          (let loop ((rs zs) (acc '()))
            (let* ((v (parse-value rs))
                   (val (car v))
                   (rest (skip-ws (cdr v))))
              (cond
                ((and (pair? rest) (char=? (car rest) #\,))
                 (loop (cdr rest) (cons val acc)))
                ((and (pair? rest) (char=? (car rest) #\]))
                 (cons (reverse (cons val acc)) (cdr rest)))
                (else (error "Bad array")))))))))

(define (json-parse-line s)
  (let* ((xs (string->list* s))
         (r (parse-value xs))
         (v (car r)))
    v))

;; ---------------------------
;; Canonicalization: pick stable fields + order keys
;; ---------------------------

(define (assoc-get al k)
  (let ((p (assoc k al))) (if p (cdr p) #f)))

(define (string< a b)
  (let ((na (string-length a)) (nb (string-length b)))
    (let loop ((i 0))
      (cond
        ((and (= i na) (= i nb)) #f)
        ((= i na) #t)
        ((= i nb) #f)
        (else
          (let ((ca (string-ref a i)) (cb (string-ref b i)))
            (cond
              ((char<? ca cb) #t)
              ((char>? ca cb) #f)
              (else (loop (+ i 1))))))))))

(define (sort-strings xs)
  (define (insert x ys)
    (cond ((null? ys) (list x))
          ((string< x (car ys)) (cons x ys))
          (else (cons (car ys) (insert x (cdr ys))))))
  (let loop ((zs xs) (acc '()))
    (if (null? zs) acc (loop (cdr zs) (insert (car zs) acc)))))

(define (json-escape s)
  (let loop ((i 0) (n (string-length s)) (acc '()))
    (if (>= i n)
        (list->string (reverse acc))
        (let ((c (string-ref s i)))
          (cond
            ((char=? c #") (loop (+ i 1) n (append (reverse (string->list* "\"")) acc)))
            ((char=? c #\) (loop (+ i 1) n (append (reverse (string->list* "\")) acc)))
            ((char=? c #
ewline) (loop (+ i 1) n (append (reverse (string->list* "\
")) acc)))
            ((char=? c #\return) (loop (+ i 1) n (append (reverse (string->list* "\r")) acc)))
            ((char=? c #	ab) (loop (+ i 1) n (append (reverse (string->list* "\	")) acc)))
            (else (loop (+ i 1) n (cons c acc))))))))

(define (jstr s) (string-append """ (json-escape s) """))

(define (jval v)
  (cond
    ((eq? v #t) "true")
    ((eq? v #f) "false")
    ((eq? v 'null) "null")
    ((number? v) (number->string v))
    ((string? v) (jstr v))
    ((pair? v)
     ;; arrays only in our use; emit JSON array of primitives/strings
     (string-append
      "["
      (let loop ((xs v) (acc ""))
        (if (null? xs) acc
            (let ((one (jval (car xs))))
              (loop (cdr xs)
                    (if (string=? acc "") one (string-append acc "," one))))))
      "]"))
    (else (jstr (call-with-output-string (lambda (p) (write v p)))))))

(define (emit-json-object al)
  ;; `al` list of (k . v) where k string, v any supported primitive
  (let* ((ks (sort-strings (map car al))))
    (string-append
     "{"
     (let loop ((xs ks) (acc ""))
       (if (null? xs) acc
           (let* ((k (car xs))
                  (v (assoc-get al k))
                  (pairstr (string-append (jstr k) ":" (jval v))))
             (loop (cdr xs)
                   (if (string=? acc "") pairstr (string-append acc "," pairstr))))))
     "}")))

;; ---------------------------
;; F₂[x] bitset mapping (deterministic)
;; Strategy:
;; - Build canonical "feature strings" like: kind:key=value
;; - Hash feature string -> bit index modulo N (default 1024)
;; - Set coefficient bit = 1 (XOR accumulation)
;; This is a deterministic "sketch polynomial" useful for meet/join later.
;; ---------------------------

(define (system->string cmd)
  (let ((p (open-input-pipe cmd)))
    (let loop ((acc '()))
      (let ((c (read-char p)))
        (if (eof-object? c)
            (begin (close-input-pipe p) (list->string (reverse acc)))
            (loop (cons c acc)))))))

(define (trim s)
  (let* ((n (string-length s)))
    (let loopL ((i 0))
      (if (or (>= i n) (not (char-ws? (string-ref s i))))
          (let loopR ((j (- n 1)))
            (if (or (< j i) (not (char-ws? (string-ref s j))))
                (substring s i (+ j 1))
                (loopR (- j 1))))
          (loopL (+ i 1))))))

(define (sha256-hex s)
  ;; Use host sha256sum for now; on ESP/Pico replace with your SHA256.
  (let* ((cmd (string-append "printf %s " (jstr s) " | sha256sum | awk '{print $1}'"))
         (out (trim (system->string cmd))))
    out))

(define (hex->u32 h8)
  (let ((n (string->number h8 16)))
    (if n n 0)))

(define (hash->index feature N)
  ;; take first 8 hex chars -> u32 -> mod N
  (let* ((h (sha256-hex feature))
         (h8 (substring h 0 8))
         (u (hex->u32 h8)))
    (modulo u N)))

(define (bitset-make N)
  ;; list of 32-bit words
  (let* ((words (+ 1 (quotient (- N 1) 32))))
    (make-vector words 0)))

(define (bitset-xor! bs i)
  (let* ((wordi (quotient i 32))
         (b (modulo i 32))
         (m (arithmetic-shift 1 b))
         (w (vector-ref bs wordi)))
    (vector-set! bs wordi (bitwise-xor w m))))

(define (bitset->hex bs)
  ;; big-endian words for readability
  (let* ((n (vector-length bs)))
    (let loop ((i (- n 1)) (acc ""))
      (if (< i 0) acc
          (let* ((w (vector-ref bs i))
                 (hx (let ((s (number->string w 16)))
                       (let ((pad (- 8 (string-length s))))
                         (string-append (make-string (max 0 pad) #\0) s)))))
            (loop (- i 1) (string-append acc hx)))))))

;; ---------------------------
;; Canonical field extraction from your JSONL stream
;; ---------------------------

(define (field->feature kind k v)
  (string-append kind ":" k "=" (if (string? v) v (jval v))))

(define (record->features rec)
  ;; rec is alist for object
  (let* ((kind (assoc-get rec "kind")))
    (cond
      ((not (string? kind)) '())
      ((string=? kind "HW_PROP")
       (let ((k (assoc-get rec "k")) (v (assoc-get rec "v")))
         (if (and (string? k) (string? v))
             (list (field->feature kind k v))
             '())))
      ((or (string=? kind "HW_CPU") (string=? kind "HW_MEM") (string=? kind "HW_FS")
           (string=? kind "NET_IF") (string=? kind "NET_ADDR") (string=? kind "NET_ROUTE")
           (string=? kind "NET_ROUTE6") (string=? kind "NET_DNS")
           (string=? kind "NET_PROXY_ENV") (string=? kind "NET_APT_PROXY_LINE"))
       ;; Turn each key/value (except noisy t/dev/kind) into features
       (let loop ((xs rec) (acc '()))
         (if (null? xs) (reverse acc)
             (let* ((kv (car xs)) (k (car kv)) (v (cdr kv)))
               (if (or (string=? k "t") (string=? k "dev") (string=? k "kind") (string=? k "$schema"))
                   (loop (cdr xs) acc)
                   (loop (cdr xs)
                         (cons (field->feature kind k v) acc)))))))
      (else '()))))

(define (read-lines path)
  (call-with-input-file path
    (lambda (p)
      (let loop ((acc '()))
        (let ((ln (read-line p)))
          (if (eof-object? ln) (reverse acc)
              (loop (cons ln acc))))))))

(define (write-lines path lines)
  (call-with-output-file path
    (lambda (p)
      (for-each (lambda (ln) (display ln p) (newline p)) lines))
    'truncate))

;; ---------------------------
;; Main
;; ---------------------------

(define (main argv)
  (let* ((in (if (>= (length argv) 2) (list-ref argv 1) "hardware.canvasl.jsonl"))
         (out-norm (if (>= (length argv) 3) (list-ref argv 2) "hardware.norm.jsonl"))
         (out-poly (if (>= (length argv) 4) (list-ref argv 3) "hardware.f2poly.jsonl"))
         (N (if (>= (length argv) 5) (string->number (list-ref argv 4)) 1024))
         (lines (read-lines in)))

    ;; Parse JSONL objects
    (define recs
      (let loop ((xs lines) (acc '()))
        (if (null? xs) (reverse acc)
            (let ((s (car xs)))
              (if (or (string=? s "") (char=? (string-ref s 0) #\#))
                  (loop (cdr xs) acc)
                  (loop (cdr xs) (cons (json-parse-line s) acc)))))))

    ;; Collect canonical features
    (define feats
      (let loop ((xs recs) (acc '()))
        (if (null? xs) acc
            (loop (cdr xs) (append (record->features (car xs)) acc)))))

    ;; Stable dedupe + sort
    (define (dedupe xs)
      (let loop ((ys xs) (seen '()) (acc '()))
        (if (null? ys) (reverse acc)
            (let ((x (car ys)))
              (if (member x seen)
                  (loop (cdr ys) seen acc)
                  (loop (cdr ys) (cons x seen) (cons x acc)))))))

    (define feats* (sort-strings (dedupe feats)))

    ;; Emit normalized field set as JSONL
    (write-lines out-norm
      (append
       (list (emit-json-object (list (cons "$schema" "canvasl://hw-norm/v1")
                                     (cons "kind" "HW_NORM_HEADER")
                                     (cons "N" N)
                                     (cons "input" in))))
       (map (lambda (f)
              (emit-json-object (list (cons "kind" "HW_FEATURE")
                                      (cons "feature" f))))
            feats*)
       (list (emit-json-object (list (cons "kind" "HW_NORM_DONE")
                                     (cons "count" (length feats*))
                                     (cons "out" out-norm))))))

    ;; Build F2 bitset polynomial sketch
    (define bs (bitset-make N))
    (for-each (lambda (f) (bitset-xor! bs (hash->index f N))) feats*)

    (define poly-hex (bitset->hex bs))

    (write-lines out-poly
      (list
       (emit-json-object (list (cons "$schema" "canvasl://f2poly/v1")
                              (cons "type" "f2poly_bitset")
                              (cons "N" N)
                              (cons "encoding" "hex_big_endian_u32")
                              (cons "words_hex" poly-hex)
                              (cons "note" "Deterministic sketch poly: XOR hash-to-bit over canonical HW_FEATURE strings.")))))

    (display "OK
")
    (display "  normalized: ") (display out-norm) (newline)
    (display "  f2poly:     ") (display out-poly) (newline)
    (display "  N bits:     ") (display N) (newline)))

;; entry
(let ((argv (if (procedure? command-line) (command-line) (list "hw_norm.scm"))))
  (main argv))
```

### Run it (Termux)
```bash
pkg install -y coreutils python