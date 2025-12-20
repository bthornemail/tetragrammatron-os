# 5) S-expression registration + add-child (genesis.sexpr)

This uses your `sexpr/register-sexpr` idea. The example calls the rotor creation and apply-rotor, then scales by `phi` and constructs a new tetra.

`(ns genesis.sexpr   (:require [hypergraph.polytopes :as poly]             [hypergraph.core :as core]             [clojure.uuid :as uuid]))  ;; globals: core/get-next-id, core/store-tetra etc. are expected in your codebase. (def golden-ratio 1.6180339887498948)  (defn register-add-child!   "Register an S-expression handler that creates a child tetra by rotor transform."   [{:keys [parent-tetra get-next-id store-tetra]}]   (fn add-child     []     (let [new-id (or (get-next-id) (str (java.util.UUID/randomUUID)))           angle (* 2 Math/PI (rand))           ;; choose parent bivector-plane from parent tetra metadata (must be provided)           parent-biv (:bivector-basis parent-tetra)           base-rotor (poly/create-rotor angle (or parent-biv (poly/map->Bivector {:e12 1e-6 :e13 0 :e14 0 :e23 0 :e24 0 :e34 0})))           transformed (mapv #(poly/apply-rotor % base-rotor) (:vertices parent-tetra))           scaled (mapv (fn [vert] (mapv (fn [c] (* c golden-ratio)) vert)) transformed)           new-tetra {:id new-id                      :vertices scaled                      :owner new-id                      :parent (:id parent-tetra)                      :vec600 (vec (repeat 600 0.0)) ;; initialize payload                      :children []}]       ;; persist child via provided callback       (when store-tetra         (store-tetra new-tetra))       ;; mutate parent's children if callback is present (or return both objects)       (if-let [update-parent (get parent-tetra :update-parent-fn)]         (update-parent new-id)         (assoc parent-tetra :children (conj (:children parent-tetra) new-id)))       new-tetra)))`

**Notes**

- I made registration function take a map of callbacks so you can integrate with your existing ID generation and storage.
    
- The rotor creation uses a trivial default bivector if parent doesn't provide one — change that to your actual bivector basis.
    

---
