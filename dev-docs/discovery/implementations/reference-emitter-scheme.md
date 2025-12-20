# Reference Emitter: Scheme

Below is a minimal, portable emitter. It assumes you already have:
- `state-hash-hex` (sha256 of canonical state bytes)
- `fano-points` = list of 7 canonical point IDs (strings like `"a1b2..."`)
- `fano-lines` = list of 7 lines, each a list of 3 point IDs

```scheme
;; ===== CanvasL Geometry Emitter (Scheme) =====

(define (json-escape s)
  ;; minimal escape (enough for ids); expand as needed
  (list->string
   (apply append
          (map (lambda (ch)
                 (cond [(char=? ch #") (list #\ #")]
                       [(char=? ch #\) (list #\ #\)]
                       [else (list ch)]))
               (string->list s)))))

(define (emit-line s) (display s) (newline))

(define (emit-json obj)
  ;; very small JSON builder for known shapes
  ;; obj is an alist: '((k . v) ...)
  (define (emit-kv k v)
    (display """) (display (symbol->string k)) (display "":")
    (cond
      [(string? v) (display """) (display (json-escape v)) (display """)]
      [(number? v) (display v)]
      [(boolean? v) (display (if v "true" "false"))]
      [(list? v)
       (cond
         ;; list of strings -> JSON array
         [(and (pair? v) (string? (car v)))
          (display "[")
          (let loop ((xs v) (first #t))
            (unless first (display ","))
            (display """) (display (json-escape (car xs))) (display """)
            (if (null? (cdr xs)) (display "]") (loop (cdr xs) #f)))]
         [else
          (error "unsupported list value")])]
      [else (error "unsupported value type")]))

  (display "{")
  (let loop ((xs obj) (first #t))
    (unless first (display ","))
    (emit-kv (caar xs) (cdar xs))
    (if (null? (cdr xs)) (display "}") (loop (cdr xs) #f)))
  (newline))

(define (pref pfx s) (string-append pfx ":" s))

(define (emit-shape-point epoch pid)
  (emit-line
   (string-append
    "{"v":1,"t":"shape","id":"" (pref "p" pid) "","epoch":"
    (number->string epoch)
    ","payload":{"kind":"point","coords":{"x":0,"y":0,"z":0},"
    ""attrs":{"role":"FANO_POINT","optional":false}}}")))

(define (emit-triad epoch lid a b c)
  (emit-line
   (string-append
    "{"v":1,"t":"triad","id":"" (pref "l" lid) "","epoch":"
    (number->string epoch)
    ","payload":{"points":[""(pref "p" a)"",""(pref "p" b)"",""(pref "p" c)""],"
    ""line_id":""(pref "l" lid)"","meaning":"incidence"}}")))

(define (emit-hash epoch hex)
  (emit-line
   (string-append
    "{"v":1,"t":"hash","id":"h:" hex "","epoch":"
    (number->string epoch)
    ","payload":{"alg":"sha256","hex":"" hex ""}}")))

(define (emit-commit epoch hex)
  (emit-line
   (string-append
    "{"v":1,"t":"commit","id":"c:" hex "","epoch":"
    (number->string epoch)
    ","payload":{"state_id":"" hex "","why":"emit"}}")))

;; ---- Deterministic merkaba from sorted point ids ----
(define (sort-strings xs)
  (sort xs string<?))

(define (emit-merkaba epoch point-ids)
  (let* ((ps (sort-strings point-ids))
         (p1 (list-ref ps 0))
         (p2 (list-ref ps 1))
         (p3 (list-ref ps 2))
         (p4 (list-ref ps 3))
         (p5 (list-ref ps 4))
         (mid (string-append p1 p2 p3 p4 p5))) ;; simple stable id material
    (emit-line
     (string-append
      "{"v":1,"t":"shape","id":"m:" mid "","epoch":"
      (number->string epoch)
      ","payload":{"kind":"merkaba","coords":{"center":{"x":0,"y":0,"z":0}},"
      ""attrs":{"derived_from":"fano","T_plus":[""(pref "p" p1)"",""(pref "p" p2)"",""(pref "p" p3)"",""(pref "p" p4)""],"
      ""T_minus":[""(pref "p" p1)"",""(pref "p" p2)"",""(pref "p" p3)"",""(pref "p" p5)""]}}}"))))

;; ---- Main entry ----
;; fano-lines: list of (lid . (a b c)) where lid is stable line id material
(define (emit-geometry epoch mode state-hash fano-points fano-lines)
  ;; points
  (for-each (lambda (pid) (emit-shape-point epoch pid)) fano-points)
  ;; lines/triads
  (for-each
   (lambda (ln)
     (let ((lid (car ln))
           (pts (cdr ln)))
       (emit-triad epoch lid (list-ref pts 0) (list-ref pts 1) (list-ref pts 2))))
   fano-lines)
  ;; merkaba overlay
  (when (string=? mode "merkaba")
    (emit-merkaba epoch fano-points))
  ;; commit markers
  (emit-hash epoch state-hash)
  (emit-commit epoch state-hash))
```

---
