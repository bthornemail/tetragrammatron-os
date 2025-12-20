# RFC-011: Repo.CanvasL Kernel and 8³ Layer Normalization

## Status
**Proposed** (Normative)

## Abstract
This RFC defines a **keyboard-native, embedding-friendly repository kernel** (`repo.canvasl`) and a **canonical normalization** for the first **8³ = 512** semantic layers of CanvasL. The intent is to make repository evolution machine-auditable and deterministic by treating branch topology and CanvasL layers as the same normalized semantic graph.

## Terminology
The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119.

- **Axis**: One of 8 canonical semantic dimensions: {state, symbols, logic, runtime, dynamics, genesis, validation, rejection}.
- **Layer Path**: A slash-delimited triple `A/B/C` where each component is an Axis.
- **Node**: A CanvasL record representing a layer, identified by a canonical `id`.
- **Kernel**: The repository root CanvasL document describing axes, branch policy, and normalization rules.

## 1. Goals
Implementations:
1. **MUST** produce identical node identifiers across platforms given the same layer path.
2. **MUST** avoid Unicode-only identifiers to ensure keyboard portability.
3. **SHOULD** support knowledge-graph indexing and embeddings directly from identifiers.
4. **MUST** allow lossless reconstruction of the 8³ layer set from rules (no hidden state).

## 2. Canonical Axes
The canonical axis set is fixed and **MUST NOT** be renamed in-place:

1. `state` — ontology, invariants, identity
2. `symbols` — encoding, syntax, alphabets
3. `logic` — proofs, normalization, reasoning
4. `runtime` — execution, effects, hardware behavior
5. `dynamics` — transitions, VM semantics, folding
6. `genesis` — bootstrapping, initialization, origin
7. `validation` — acceptance, correctness, tests
8. `rejection` — errors, contradictions, counterexamples

Implementations **MAY** add *descriptions* and *aliases* for UI, but the canonical tokens above are normative.

## 3. Normalization Rules
### 3.1 Token Normalization
Axis tokens and path segments:
- **MUST** be ASCII lowercase.
- **MUST** use only `[a-z0-9-]`.
- **MUST NOT** contain spaces.
- **MUST NOT** contain Unicode symbols.

### 3.2 Path Normalization
A layer path:
- **MUST** be exactly three axis tokens separated by `/`:
  - `A/B/C`
- **MUST** use only canonical axis tokens.
- **MUST** be interpreted as an ordered triple (not a set).

### 3.3 Node Identifier Normalization
A node identifier:
- **MUST** be derived only from the normalized layer path.
- **MUST** be `n_` + `sha1(path)` truncated to 12 hex characters:
  - `id = "n_" || hex(sha1(UTF8(path)))[0:12]`
- **MUST** be stable across implementations.

## 4. The 8³ Layer Set
The first cube of layers is the full Cartesian product:

`L3 = Axes × Axes × Axes`  (cardinality 8³ = 512)

An implementation:
- **MUST** be able to enumerate all 512 layer paths.
- **MUST** produce a Node record per path.
- **SHOULD** serialize these Nodes as JSONL for streaming determinism.

## 5. Repo.CanvasL Kernel
A `repo.canvasl` kernel document:
- **MUST** declare the canonical axes and normalization rules.
- **MUST** declare branch topology as semantics, not as mutable configuration.
- **SHOULD** include a reproducible generation timestamp and RFC reference.

## 6. Deterministic Merge Semantics
For any set of Nodes:
- **Identity** is `id`.
- Merge **MUST** be:
  - **Commutative**
  - **Associative**
  - **Idempotent**
- Conflicts are resolved by:
  - identical `id` ⇒ same Node (byte-identical after normalization)
  - differing payloads with same `id` ⇒ **MUST** fail validation (corrupted normalization)

## 7. Fano/Incidence Hook
Axis triples are intended to support incidence testing:
- Implementations **MAY** map `A/B/C` into a 3-point candidate in PG(2,2)-style reasoning.
- If used, the incidence rule **MUST** be deterministic and derived only from normalized paths and/or canonical polynomial operations (e.g., gcd/lcm meet/join).

## 8. Files
This RFC defines two normative artifacts:
1. `repo.canvasl` — kernel (single JSON object or JSONL stream header)
2. `layers/8cube.canvasl` — JSONL stream of the 512 L3 nodes (order is implementation-defined, but **SHOULD** be lexicographic over axis token order listed in Section 2)

## 9. Security and Integrity
- Implementations **SHOULD** hash the serialized JSONL stream to produce a reproducible digest.
- Implementations **MUST** reject Nodes whose `id` does not match the normalized path-derived `id`.

## Appendix A: Reference Axis Order
Lexicographic generation order for deterministic builds:
`{", ".join(axis_names)}`

"""

out_dir="/mnt/data"
rfc_path=os.path.join(out_dir,"RFC-011.md")
kernel_path=os.path.join(out_dir,"repo.canvasl")
layers_path=os.path.join(out_dir,"layers_8cube.canvasl.jsonl")

with open(rfc_path,"w",encoding="utf-8") as f:
    f.write(rfc)

with open(kernel_path,"w",encoding="utf-8") as f:
    f.write(json.dumps(kernel, indent=2))

with open(layers_path,"w",encoding="utf-8") as f:
    # header line (optional but helpful)
    f.write(json.dumps({"kind":"layerset","name":"8cube","dim":3,"count":len(nodes),"axes":axis_names})+"
")
    for n in nodes:
        f.write(json.dumps(n, separators=(",",":"))+"
")

(rfc_path, kernel_path, layers_path, len(nodes), nodes[0], nodes[-1])

---

## ChatGPT

import json, itertools, os, datetime, hashlib, re

axes = [
    ("state","Ontology, invariants, identity"),
    ("symbols","Encoding, syntax, alphabets"),
    ("logic","Proofs, normalization, reasoning"),
    ("runtime","Execution, effects, hardware behavior"),
    ("dynamics","Transitions, VM semantics, folding"),
    ("genesis","Bootstrapping, initialization, origin"),
    ("validation","Acceptance, correctness, tests"),
    ("rejection","Errors, contradictions, counterexamples"),
]
axis_names=[a[0] for a in axes]

def sha1_12(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:12]

nodes=[]
for a,b,c in itertools.product(axis_names, repeat=3):
    path=f"{a}/{b}/{c}"
    nodes.append({
        "kind":"layer",
        "dim":3,
        "axes":[a,b,c],
        "path":path,
        "id":"n_"+sha1_12(path),
        "labels":[a,b,c],
        "norm":{"path":path,"id":"n_"+sha1_12(path)}
    })

kernel = {
    "kind":"repo.kernel",
    "version":"1.0",
    "rfc":"RFC-011",
    "generated_utc": datetime.datetime.utcnow().replace(microsecond=0).isoformat()+"Z",
    "branches":{
        "main":"Normalized fixed point",
        "current":"Integration manifold",
        "feature_axes":[f"feature/{a}" for a in axis_names],
        "release":"release/* immutable snapshots"
    },
    "axes":[{"name":n, "desc":d} for n,d in axes],
    "normalization":{
        "token":"lowercase kebab-case; ASCII; no unicode; no spaces",
        "path":"axis/axis/axis (depth=3) with '/' separators",
        "id":"sha1(path) truncated 12 hex, prefixed 'n_'"
    },
    "semantics":{
        "node_identity":"id is derived only from normalized path",
        "merge":"commutative, associative, idempotent on node sets by id",
        "projection":"Fano projection uses axis-triples as incidence candidates"
    }
}

rfc = f"""# RFC-011: Repo.CanvasL Kernel and 8³ Layer Normalization

## Status
**Proposed** (Normative)

## Abstract
This RFC defines a **keyboard-native, embedding-friendly repository kernel** (`repo.canvasl`) and a **canonical normalization** for the first **8³ = 512** semantic layers of CanvasL. The intent is to make repository evolution machine-auditable and deterministic by treating branch topology and CanvasL layers as the same normalized semantic graph.

## Terminology
The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119.

- **Axis**: One of 8 canonical semantic dimensions: {{state, symbols, logic, runtime, dynamics, genesis, validation, rejection}}.
- **Layer Path**: A slash-delimited triple `A/B/C` where each component is an Axis.
- **Node**: A CanvasL record representing a layer, identified by a canonical `id`.
- **Kernel**: The repository root CanvasL document describing axes, branch policy, and normalization rules.

## 1. Goals
Implementations:
1. **MUST** produce identical node identifiers across platforms given the same layer path.
2. **MUST** avoid Unicode-only identifiers to ensure keyboard portability.
3. **SHOULD** support knowledge-graph indexing and embeddings directly from identifiers.
4. **MUST** allow lossless reconstruction of the 8³ layer set from rules (no hidden state).

## 2. Canonical Axes
The canonical axis set is fixed and **MUST NOT** be renamed in-place:

1. `state` — ontology, invariants, identity  
2. `symbols` — encoding, syntax, alphabets  
3. `logic` — proofs, normalization, reasoning  
4. `runtime` — execution, effects, hardware behavior  
5. `dynamics` — transitions, VM semantics, folding  
6. `genesis` — bootstrapping, initialization, origin  
7. `validation` — acceptance, correctness, tests  
8. `rejection` — errors, contradictions, counterexamples  

Implementations **MAY** add descriptions and aliases for UI, but the canonical tokens above are normative.

## 3. Normalization Rules
### 3.1 Token Normalization
Axis tokens and path segments:
- **MUST** be ASCII lowercase.
- **MUST** use only `[a-z0-9-]`.
- **MUST NOT** contain spaces.
- **MUST NOT** contain Unicode symbols.

### 3.2 Path Normalization
A layer path:
- **MUST** be exactly three axis tokens separated by `/`: `A/B/C`
- **MUST** use only canonical axis tokens.
- **MUST** be interpreted as an ordered triple (not a set).

### 3.3 Node Identifier Normalization
A node identifier:
- **MUST** be derived only from the normalized layer path.
- **MUST** be `n_` + `sha1(path)` truncated to 12 hex characters:  
  `id = "n_" || hex(sha1(UTF8(path)))[0:12]`
- **MUST** be stable across implementations.

## 4. The 8³ Layer Set
The first cube of layers is the full Cartesian product:

`L3 = Axes × Axes × Axes` (cardinality 8³ = 512)

An implementation:
- **MUST** enumerate all 512 layer paths.
- **MUST** produce a Node record per path.
- **SHOULD** serialize these Nodes as JSONL for streaming determinism.

## 5. Repo.CanvasL Kernel
A `repo.canvasl` kernel document:
- **MUST** declare the canonical axes and normalization rules.
- **MUST** declare branch topology as semantics, not as mutable configuration.
- **SHOULD** include a reproducible generation timestamp and RFC reference.

## 6. Deterministic Merge Semantics
For any set of Nodes:
- Identity is `id`.
- Merge **MUST** be commutative, associative, and idempotent.
- If two records share an `id` but differ in payload after normalization, validators **MUST** fail the build.

## 7. Incidence Hook (Fano-ready)
Axis triples are intended to support incidence testing:
- Implementations **MAY** map `A/B/C` into an incidence candidate for PG(2,2)-style reasoning.
- If used, the incidence rule **MUST** be deterministic and derived only from normalized paths and/or canonical polynomial operations (e.g., gcd/lcm meet/join).

## 8. Files
This RFC defines two normative artifacts:
1. `repo.canvasl` — kernel (single JSON object)
2. `layers/8cube.canvasl.jsonl` — JSONL stream of the 512 L3 nodes

## Appendix A: Reference Axis Order
Lexicographic order (for deterministic generation):
`{", ".join(axis_names)}`
"""

out_dir="/mnt/data"
rfc_path=os.path.join(out_dir,"RFC-011.md")
kernel_path=os.path.join(out_dir,"repo.canvasl")
layers_path=os.path.join(out_dir,"layers_8cube.canvasl.jsonl")

with open(rfc_path,"w",encoding="utf-8") as f:
    f.write(rfc)

with open(kernel_path,"w",encoding="utf-8") as f:
    f.write(json.dumps(kernel, indent=2))

with open(layers_path,"w",encoding="utf-8") as f:
    f.write(json.dumps({"kind":"layerset","name":"8cube","dim":3,"count":len(nodes),"axes":axis_names}, separators=(",",":"))+"
")
    for n in nodes:
        f.write(json.dumps(n, separators=(",",":"))+"
")

[rfc_path, kernel_path, layers_path, len(nodes)]

---

## You

Rfc-011 and normalize repo.canvasl kernel and the first 8^3 .canvasl layers each file should be like a register that we can only propagate or back propagate to the main | current | branch iff merge maintains fano consistenecy maybe all merges should

---

## ChatGPT

Below is a **crisp, RFC-2119 style RFC-011**, plus a **normalized `repo.canvasl` kernel** and a **complete, deterministic naming scheme for the first 8³ = 512 `.canvasl` “register” layers** (with a generator + a few concrete examples). This is designed so merges can be *mechanically gated* by a **Fano-consistency rule**.

---
