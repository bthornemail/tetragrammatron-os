# 6) Tests / sanity checks

Quick REPL-style tests to exercise the above.

`(comment   ;; Fano test   (require '[hypergraph.core :as hc])   (hc/valid-fano-block? [4 5 7]) ;; => true    ;; receive-update test   (require '[hypergraph.peer :as hp])   (def st {:vector-clock {} :history []})   (def upd {:involved-tetrahedrons [4 5 7] :hash "h1"})   (def st2 (hp/receive-update st upd))   (:vector-clock st2) ;; expect keys 4,5,7 with #{"h1"}    ;; rotor stub test   (require '[hypergraph.polytopes :as p])   (def r (p/create-rotor (/ Math/PI 3) (p/map->Bivector {:e12 1 :e13 0 :e14 0 :e23 0 :e24 0 :e34 0})))   (p/apply-rotor [1 0 0 0] r) ;; returns placeholder rotated vector   )`

---
