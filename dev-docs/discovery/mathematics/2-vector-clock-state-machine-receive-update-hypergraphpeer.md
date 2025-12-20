# 2) Vector Clock State Machine — receive-update (hypergraph.peer)

This is a _pure_ function version you can wire into an agent/actor loop or call from a `swap!` if you use an atom for `local-state`. It **only accepts valid Fano blocks** and records the block hash into each involved tetrahedron’s vector-clock set.

`(ns hypergraph.peer   (:require [clojure.set :as set]             [hypergraph.core :refer [valid-fano-block?]]))  ;; Example local-state shape: ;; {:vector-clock {1 #{...hashes...} 2 #{...} ...} ;;  :tetras {id -> tetra-map} ;;  :history []}  (defn ensure-vec-clock-keys   "Make sure the vector-clock has a set for each tetra id (pure)."   [state tetra-ids]   (reduce (fn [s id]             (update s :vector-clock (fn [vc] (assoc (or vc {}) id (or (get vc id) #{})))))           state           tetra-ids))  (defn receive-update   "Process an update-msg. If the involved ids form a valid Fano block,    record the update-hash in each id's vector-clock set and append to history.    Returns new state (pure)."   [local-state update-msg]   (let [ids (set (:involved-tetrahedrons update-msg))         h   (:hash update-msg)]     (if (valid-fano-block? ids)       (let [s0 (ensure-vec-clock-keys local-state ids)             s1 (reduce (fn [s id]                          (update-in s [:vector-clock id] conj h))                        s0                        ids)]         ;; record canonical history entry (optional: timestamp, origin)         (update s1 :history conj {:block ids :hash h :moment (System/currentTimeMillis)}))       ;; invalid — keep state and optionally log       (do         (println "Invalid Fano Block rejected:" ids)         local-state))))`

**Notes**

- This keeps updates deterministic and auditable.
    
- You can plug this into a consensus layer: only accepter nodes that produce valid Fano blocks will change the vector-clock.
    

---
