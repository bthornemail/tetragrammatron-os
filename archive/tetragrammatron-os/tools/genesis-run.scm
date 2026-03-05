
;; tools/genesis-run.scm (Guile)
;; Orchestrate layers 0–7 (minimal working end-to-end).
;; Note: ignore/include parsing is stubbed as simple lists here;
;; you’ll later parse .genesisignore/.genesisinclude files in L1.

(use-modules (tetragrammatron genesis layer0)
             (tetragrammatron genesis layer4))

(load "genesis/layer.1/genesis.layer.1.scm")
(load "genesis/layer.2/genesis.layer.2.scm")
(load "genesis/layer.3/genesis.layer.3.scm")
(load "genesis/layer.5/genesis.layer.5.scm")
(load "genesis/layer.6/genesis.layer.6.scm")
(load "genesis/layer.7/genesis.layer.7.scm")

(define (read-lines path)
  (if (file-exists? path)
      (call-with-input-file path
        (lambda (p)
          (let loop ((acc '()))
            (let ((line (read-line p 'concat)))
              (if (eof-object? line)
                  (reverse acc)
                  (loop (cons line acc)))))))
      '()))

(define (nonempty-noncomment xs)
  (let loop ((xs xs) (acc '()))
    (if (null? xs) (reverse acc)
        (let ((s (car xs)))
          (if (or (string=? s "")
                  (string-prefix? "#" s))
              (loop (cdr xs) acc)
              (loop (cdr xs) (cons s acc)))))))

(define (genesis-run root)
  (let* ((ignore (nonempty-noncomment (read-lines (string-append root "/.genesisignore"))))
         (include (nonempty-noncomment (read-lines (string-append root "/.genesisinclude"))))
         (paths (L0.enumerate root)))
    (for-each
      (lambda (rel)
        (let* ((l0 (L0.stat root rel))
               (l1 (L1.classify l0 ignore include))
               (l2 (L2.assign l0 l1))
               (l3 (L3.emit-org l0 l1 l2)))
          ;; Print provenance node
          (display l3)
          ;; Only do deeper layers for light/shadow (safe)
          (let* ((l4 (L4.represent l0 l1 l2))
                 (l5 (L5.structure l4))
                 (l6 (L6.validate l2 l5 '()))
                 (l7 (L7.project l2 l6)))
            (display ";; VM_STATE: ") (write l7) (newline)
            (newline))))
      paths)))

;; Usage:
;;   guile -s tools/genesis-run.scm -c '(genesis-run ".")'